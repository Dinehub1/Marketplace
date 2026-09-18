/**
 * Breathe — a guided slow-breathing screen that costs nothing to run.
 *
 * Why it exists: every other product here needs a server (pdfcpu, rembg, a hosted model). This
 * one is a timer, an animation and a few synthesized tones, so it works in aeroplane mode, cannot
 * fail on a slow network, and cannot cost us a rupee per session. It is also the one product a
 * person opens daily, which is what a store listing is actually ranked on.
 *
 * What it deliberately does NOT claim: no blood-pressure promises, no "heals anxiety", no
 * invented statistics. The only numbers on screen are arithmetic the user can check — cycles
 * done, minutes done, and the breathing rate the pattern implies (60 ÷ cycle seconds). The
 * honest framing is in `docs/breathe-app-plan.md`.
 *
 * The prayer angle without the religion: many traditions pair a long, slow breath with a
 * repeated phrase (japa, dhikr, the rosary, pranayama counting). That mechanical shape — slow
 * breath plus repetition — is what this screen gives you; you type your own two lines, so the
 * app never picks a faith for anybody.
 *
 * ── What changed, and why ─────────────────────────────────────────────────────────────
 *
 * This screen used to own its own interval. It counted *ticks*, which meant the clock drifted,
 * froze when the phone was locked, and could not be paused — there was no pause button because
 * the timer had no way to express one. It now uses the shared engine in `lib/timer.ts`, which
 * derives every number from timestamps.
 *
 * The consequence a person will actually notice: **the countdown is now the length of the
 * session, not the length of the phase.** Both numbers are on screen — the phase countdown in
 * the circle, the session countdown in the readout below it.
 *
 * The animation is deliberately *not* an independent clock. It is restarted from the engine's
 * phase on every phase change, so if a frame is dropped, the app is backgrounded or the pattern
 * changes mid-session, the circle re-syncs to the timer on the next phase rather than drifting
 * away from it. The timer is the source of truth; the circle follows.
 *
 * ── Sound (this version) ──────────────────────────────────────────────────────────────
 *
 * When a phase turns, a rising tone plays; the exhale is the exact mirror, falling. Generated inside
 * this repo by `scripts/make-wellness-sounds.mjs`, so it needs no permission, no network and no
 * attribution, and the app stays silent-switch-respecting and fully offline.
 *
 * **The screen used to speak, and no longer does.** A formant-synthesized voice said "breathe in" and
 * "breathe out"; it was removed for sounding robotic and unclear on a real phone. The tones were
 * always the real instruction — a rising figure *is* an inward breath, which is why they move in the
 * same direction as the circle — and the words were riding on top of them. The reasoning and what
 * replaced each thing the voice carried are in `scripts/make-wellness-sounds.mjs`.
 *
 * Two switches remain — cues and bed — because they are two different promises: information and
 * atmosphere. See `lib/settings.ts`.
 *
 * ── Motion (this version) ─────────────────────────────────────────────────────────────
 *
 * Three layers, each with one job:
 *
 *   1. **The ripples** — three concentric rings breathing outward, staggered by 700 ms. This is
 *      the idle state's life; without it a stopped session is a dead circle.
 *   2. **The disc** — the pacer, driven from the engine's own timestamps (see the note above).
 *   3. **The progress ring** — a hairline arc that fills over the current breath. It is the one
 *      element that makes "how long is left of *this* breath" readable without reading.
 *
 * Under Reduce Motion the ripples stop and the pacer cross-fades opacity instead of scaling,
 * which is the same substitution `lib/motion.ts` documents.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { alpha, radius, space } from "@hermes/tokens";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Button, Card, Chip as UiChip, Text } from "@/components/ui";
import { HeaderAction } from "@/components/wellness-shell";
import { SoundSwitchRow, SoundToggle } from "@/components/sound-toggle";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { saveSession, useWellnessStore } from "@/lib/session";
import { useSequence, mmss, type Phase } from "@/lib/timer";
import { useSettings } from "@/lib/settings";
import { useReduceMotion } from "@/lib/motion";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import {
  WELLNESS_BED,
  WELLNESS_CUES,
  isMuted,
  makeWellnessAudio,
  useSoundPrefs,
} from "@/lib/sound";

/** One pattern = one cycle of phases, in seconds. Hold phases may be zero. */
type Pattern = {
  id: string;
  name: string;
  /** The short label for the pattern chip. */
  chip: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  note: string;
};

const PATTERNS: Pattern[] = [
  {
    id: "coherent",
    name: "Coherent",
    chip: "Coherent",
    inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0,
    note: "About six breaths a minute — the rate slow-breathing research focuses on.",
  },
  {
    id: "box",
    name: "Box",
    chip: "Box 4·4·4·4",
    inhale: 4, holdIn: 4, exhale: 4, holdOut: 4,
    note: "Even in, hold, out, hold. Steadying — swimmers and soldiers use it.",
  },
  {
    id: "478",
    name: "4·7·8",
    chip: "4·7·8",
    inhale: 4, holdIn: 7, exhale: 8, holdOut: 0,
    note: "A long exhale. The classic pattern people use before sleep.",
  },
  {
    id: "prayer",
    name: "Long exhale",
    chip: "Long exhale",
    inhale: 4, holdIn: 0, exhale: 8, holdOut: 0,
    note: "The shape most traditions use with a repeated phrase.",
  },
];

const LENGTHS = [3, 5, 10];            // minutes
/** The phrase line, until the person replaces the in-breath one in settings. */
const PHRASE_IN = "Breathe in";
const PHRASE_OUT = "Breathe out";
/**
 * How far the circle dims on the exhale under Reduce Motion.
 *
 * Not to zero: the circle is the control as well as the pacer, and a control that fades out
 * while you are reaching for it reads as disabled. This is dim enough to read as a breath and
 * bright enough to still look tappable.
 */
const FADE_LOW = 0.4;
/** The circle's drawn geometry, in one place: the SVG, the styles and the hit area agree. */
const RING = 236;
const RING_R = RING / 2 - 6;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;
/** How many rings ripple outward in the idle state. */
const RIPPLES = 3;

type PaceKey = "in" | "holdIn" | "out" | "holdOut";
type PacePhase = Phase & { pace: PaceKey };

/**
 * Where the pacer drives to for a phase, in whichever unit the motion setting allows:
 * scale grows through the inhale and settles through the exhale, or — under Reduce Motion —
 * opacity brightens and dims instead. `null` means "hold, leave it where it is", which is what
 * the two hold phases want in both settings.
 */
function paceTarget(key: PaceKey, reduceMotion: boolean): number | null {
  if (key === "in") return reduceMotion ? 1 : 1.34;
  if (key === "out") return reduceMotion ? FADE_LOW : 0.78;
  return null;
}

/** The phases of one cycle, in order, with the ones that are zero removed. */
function phasesOf(p: Pattern): PacePhase[] {
  const all: PacePhase[] = [
    { key: "in", pace: "in", label: "Breathe in", seconds: p.inhale },
    { key: "holdIn", pace: "holdIn", label: "Hold", seconds: p.holdIn },
    { key: "out", pace: "out", label: "Breathe out", seconds: p.exhale },
    { key: "holdOut", pace: "holdOut", label: "Hold", seconds: p.holdOut },
  ];
  return all.filter((ph) => ph.seconds > 0);
}

function cycleSeconds(p: Pattern): number {
  return p.inhale + p.holdIn + p.exhale + p.holdOut;
}

/** breaths per minute this pattern implies — arithmetic, not a claim */
function ratePerMinute(p: Pattern): number {
  const c = cycleSeconds(p);
  return c > 0 ? 60 / c : 0;
}

/**
 * How many full cycles fit in the chosen length.
 *
 * Used for the completed state and for the check on the live counter. Derived from the pattern
 * and the length rather than from the ticker, so the number is right even if the session
 * finished while the app was backgrounded and no ticks ran at all.
 */
function targetCycles(p: Pattern, minutes: number): number {
  const c = cycleSeconds(p);
  return c > 0 ? Math.floor((minutes * 60) / c) : 0;
}

/** Ticks are 100 ms apart in the engine; that is what makes a state-driven arc look smooth. */
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

export default function Breathe() {
  const ui = useProductUI("breathe");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [patternId, setPatternId] = useState(PATTERNS[0].id);
  const [minutes, setMinutes] = useState(5);
  const [editing, setEditing] = useState(false);
  /** The minutes actually completed, for the summary card. */
  const [result, setResult] = useState<{ seconds: number; cycles: number } | null>(null);

  const store = useWellnessStore("breathe");
  const { settings, update } = useSettings();
  const reduceMotion = useReduceMotion();

  /**
   * The cue players, one literal `useAudioPlayer` call each.
   *
   * Verbose on purpose: a hook's call count has to be fixed, so the list of sounds a screen can
   * make has to be *code*, not data. `lib/sound.ts` explains why at length; the short version is
   * that `["in","out"].map(useAudioPlayer)` is a rules-of-hooks violation and the two drafts that
   * hid it behind a helper were both flagged by lint for good reason.
   */
  const cueIn = useAudioPlayer(WELLNESS_CUES.in);
  const cueOut = useAudioPlayer(WELLNESS_CUES.out);
  const cueHold = useAudioPlayer(WELLNESS_CUES.hold);
  const cueDone = useAudioPlayer(WELLNESS_CUES.done);
  const bed = useAudioPlayer(WELLNESS_BED);

  const prefs = useSoundPrefs();

  /**
   * The audio behaviour, built once and then kept up to date.
   *
   * `useMemo` on the *players*, which are stable for the life of the screen, so this object is
   * created once — which is what lets a timer callback hold `audio.cue` without the callback being
   * torn down and rebuilt. The preferences are pushed in by the effect below rather than being a
   * dependency here, because rebuilding this object on a toggle would recreate every method and
   * defeat exactly that stability.
   */
  const audio = useMemo(
    () =>
      makeWellnessAudio(
        {
          cues: { in: cueIn, out: cueOut, hold: cueHold, done: cueDone },
          bed,
        },
        prefs,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `prefs` is pushed in via syncPrefs
    [cueIn, cueOut, cueHold, cueDone, bed],
  );

  /* The switch is read at fire time, so flipping it takes effect on the very next cue rather than
     at the next session. */
  useEffect(() => {
    audio.syncPrefs(prefs);
  }, [audio, prefs]);

  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0];
  const phraseIn = settings.phrase || PHRASE_IN;
  const phraseOut = PHRASE_OUT;
  /** All three layers off. What the header speaker icon draws itself from. */
  const muted = isMuted(prefs);

  /**
   * The session's phases: repeat the pattern's cycle until the chosen length is used up.
   *
   * A flat list rather than a "cycles" counter, because the engine runs *phases* and a session
   * that is a whole number of cycles is the only kind that has a meaningful end. The final cycle
   * is trimmed to land exactly on the target so the session is the length the person asked for,
   * not the next multiple of the pattern.
   */
  const phases = useMemo<PacePhase[]>(() => {
    const cycle = phasesOf(pattern);
    const cycleLen = cycleSeconds(pattern);
    if (cycleLen <= 0 || !cycle.length) return [];
    const total = minutes * 60;
    const out: PacePhase[] = [];
    let used = 0;
    let n = 0;
    while (used < total - 0.001) {
      for (const ph of cycle) {
        if (used >= total - 0.001) break;
        const seconds = Math.min(ph.seconds, total - used);
        // Skip a sliver shorter than a frame, and do not let a trimmed tail phase share a key
        // with the full one that precedes it.
        if (seconds > 0.05) {
          out.push({ ...ph, key: `${ph.key}-${n}`, seconds });
          used += seconds;
        }
      }
      n++;
    }
    return out;
  }, [pattern, minutes]);

  const target = minutes * 60;

  /**
   * The write happens here and only here.
   *
   * `saved` guards it: `onComplete` fires once by the engine's contract, but a session row is
   * user-visible and a duplicate is a bug someone can see, so both paths into it (the clock
   * reaching the end, and Finish being pressed) share one gate.
   */
  const saved = useRef(false);
  const persist = useMemo(
    () => (seconds: number, cycleCount: number) => {
      if (saved.current) return;
      saved.current = true;
      setResult({ seconds, cycles: cycleCount });
      void saveSession({
        at: Date.now(),
        screen: "breathe",
        minutes: Math.max(1, Math.round(seconds / 60)),
        units: cycleCount,
        label: pattern.name,
      });
    },
    [pattern.name],
  );

  /**
   * The engine's phase transition is the only place a cue can correctly live.
   *
   * Adding the sound to the engine rather than to this screen is what makes it fire exactly once
   * per turn: `onPhase` is called only when the index really changed, so a tick, a re-render, a
   * settings change or a resume from pause cannot double a cue — and a background catch-up that
   * skips four phases plays one sound instead of four. That is the same reason the haptic lives
   * there, and it is why this screen asks the engine for `feedback: "screen"`: it has a better
   * signature than a generic buzz, and the two landing on the same beat only muddies it.
   */
  const seq = useSequence(phases, {
    feedback: "screen",
    onComplete: () => {
      persist(target, targetCycles(pattern, minutes));
      audio.cue("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onPhase: (_index, phase) => {
      const pace = (phase as PacePhase).pace;
      // The tone *is* the instruction: a rising figure is "breathe in" and a falling one is
      // "breathe out", which is the same direction the circle moves. That was always the real cue;
      // the spoken layer that used to ride on top of it is gone (see `lib/sound.ts`).
      if (pace === "in") {
        audio.cue("in");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else if (pace === "out") {
        audio.cue("out");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else {
        audio.cue("hold");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
  });

  /**
   * The bed, hung off the two moments that matter: the session starting and the session ending.
   *
   * Deliberately not an effect keyed on `seq.running` alone: a pause must not restart it, and a
   * bed that starts over every time you pause is worse than one that keeps going. Both calls are
   * idempotent, so this runs whenever the session state changes and the bed follows by itself.
   *
   * The dependency is the two callbacks, not the bank. `startBed`/`stopBed` are stable for the life
   * of the screen, while the bank object is rebuilt whenever a preference changes — depending on the
   * bank would stop and restart the bed every time somebody flipped a switch.
   */
  useEffect(() => {
    if (seq.running || seq.paused) audio.startBed();
    else audio.stopBed();
    // `startBed`/`stopBed` are class fields, not closures over the render — they never change
    // identity, so depending on them is strictly more precise than depending on the bank, which
    // `useMemo` rebuilds whenever the player set changes. The lint rule cannot see through the
    // member expression, which is the only reason this is disabled rather than satisfied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq.running, seq.paused, audio.startBed, audio.stopBed]);

  /* Leaving the screen must not leave a bed playing behind the next one. This is an unmount
     cleanup only: the callbacks are stable, so it is not torn down and re-armed on every render. */
  useEffect(
    () => () => {
      audio.stopBed();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see the note above
    [audio.stopBed],
  );

  /**
   * The pacer.
   *
   * ── Why the animation is *driven* rather than self-running ────────────────────────────
   *
   * The one thing this animation must never do is breathe at a rate the timer disagrees with. So
   * it is not an independent clock: it is armed from the engine's phase, and its duration is how
   * much of that phase is actually left. Interrupt it — a pause, a resume, a pattern change, a
   * return from the background — and it is re-armed against the same timestamps the countdown is
   * drawn from, which is what "the timer is the source of truth" means in practice.
   *
   * ── Two details that are easy to get wrong ───────────────────────────────────────────
   *
   * **The duration is computed once per arming, not per render.** `seq.phaseMs` changes on every
   * tick, so deriving the duration inside the effect and listing it as a dependency would restart
   * the easing curve ten times a second and visibly stutter. Instead the remaining time is
   * captured in the same `useMemo` that captures the phase it belongs to, so the pair is frozen
   * together and the effect depends on the pair.
   *
   * **The dependency is the phase key, not the phase object.** `useSequence` returns a fresh
   * object every render, so depending on `seq.phase` would re-arm the animation on every render —
   * the same class of bug as the old engine's interval recreation, in a new place. `seq.phase.key`
   * is the stable identity of "this breath".
   */
  const scale = useSharedValue(1);
  const fade = useSharedValue(1);
  const pace = (seq.phase as PacePhase | undefined)?.pace ?? "in";

  /**
   * The current breath and how much of it is left, frozen together.
   *
   * Keyed on the phase key and the paused state: those are the two moments the target changes. A
   * tick changes neither, so the pacer is not disturbed by one — while the duration is still read
   * from the engine rather than recomputed here, so a resume rejoins the breath exactly where the
   * countdown says it is.
   */
  const arm = useMemo(
    () => ({ key: seq.phase?.key ?? "", pace, leftMs: seq.phaseRemainingMs }),
    [seq.phase?.key, seq.phaseRemainingMs, pace],
  );

  useEffect(() => {
    const driven = reduceMotion ? fade : scale;
    if (!seq.running) {
      driven.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      return;
    }
    const to = paceTarget(arm.pace, reduceMotion);
    // A hold leaves the value where it is: the breath is not supposed to move.
    if (to === null) return;
    driven.value = withTiming(to, {
      // 200ms floor: a resume with 40ms left in the breath should still visibly land rather than
      // snap, and a snap is what a zero-duration timing call looks like.
      duration: Math.max(200, arm.leftMs),
      easing: Easing.inOut(Easing.sin),
    });
  }, [seq.running, arm, scale, fade, reduceMotion]);

  const circle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? fade.value : 1,
    transform: [{ scale: reduceMotion ? 1 : scale.value }],
  }));

  /**
   * The progress ring: a hairline arc that fills over the current breath.
   *
   * Driven from `phaseProgress`, which is a plain number recomputed on the engine's 100 ms tick.
   * That is a deliberate choice rather than a shortcut: the ring is 700 px of circumference, so a
   * 100 ms step is 1.4% of the arc — under a pixel on any phone — and keeping it in React state
   * means it is derived from the same timestamp as the countdown beside it. An independent
   * Reanimated timing curve would look marginally smoother and would be able to disagree with the
   * clock, which is the one thing this screen has decided never to allow.
   */
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - seq.phaseProgress),
  }));

  const phaseWord = pace === "in" ? phraseIn : pace === "out" ? phraseOut : "Hold";
  const rate = Math.round(ratePerMinute(pattern));

  /**
   * Cycles done. From the clock, not from a counter that ticks — so it is right after a
   * background, and it freezes at the target when the session ends rather than continuing to
   * climb.
   */
  const cycles = useMemo(() => {
    const cycle = cycleSeconds(pattern) * 1000;
    if (cycle <= 0) return 0;
    if (seq.status === "idle") return 0;
    if (seq.completed) return targetCycles(pattern, minutes);
    return Math.floor(seq.elapsedMs / cycle);
  }, [pattern, seq.elapsedMs, seq.status, seq.completed, minutes]);

  function begin() {
    saved.current = false;
    setResult(null);
    seq.start();
  }

  /** Finish early: the engine keeps the elapsed time, so the partial session is honest. */
  function finish() {
    seq.finish();
    const cycle = cycleSeconds(pattern) * 1000;
    persist(seq.elapsedMs, cycle > 0 ? Math.floor(seq.elapsedMs / cycle) : 0);
  }

  function choosePattern(id: string) {
    setPatternId(id);
    seq.reset();
    setResult(null);
    saved.current = false;
  }

  function chooseLength(m: number) {
    setMinutes(m);
    seq.reset();
    setResult(null);
    saved.current = false;
  }

  /* The circle IS the control. On a phone the big circle is the only thing anyone tries to tap,
     so tapping it starts, pauses and resumes the session — the labelled button below is a second
     way in, not the only way. */
  const circleLabel = seq.running
    ? `Pause breathing, ${seq.secondsLeft} seconds left in this breath`
    : seq.paused
      ? "Resume breathing"
      : seq.completed
        ? "Start another session"
        : "Begin breathing";

  return (
    /* This is the one wellness screen that does not use `WellnessShell`, because its layout is the
       product — a centred circle with the controls under it, not a card stack. It therefore also has
       to bring its own scroller, and it did not have one: the pattern chips, the phrase editor, the
       charts and the two cards below them were laid out past the bottom of the screen with no way
       to reach them. A `ScrollView` with the same clearances is the whole fix. */
    <ScrollView
      style={s.root}
      contentContainerStyle={[
        s.content,
        {
          // Same clearance rule as WellnessShell: the floating iOS 26 tab bar draws over the
          // content, so the last card needs its height plus the home-indicator band.
          paddingTop: insets.top + space.base,
          paddingBottom: insets.bottom + 55,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.head}>
        <View style={s.headRow}>
          <View style={s.headText}>
            <Text variant="title2">Breathe</Text>
            <Text variant="meta" tone="ink2" numberOfLines={1}>
              {seq.running || seq.paused
                ? `${pattern.name} · ${muted ? "silent" : "sound on"}`
                : "Slow breathing, four patterns, nothing to sign up for."}
            </Text>
          </View>
          {/* The sound control is here, in reach, rather than only on the Profile page: the
              moment somebody wants this app quiet is the moment a session is running. */}
          <SoundToggle noun="Breathing sound" />
          <HeaderAction onPress={() => router.push("/profile")} label="Profile and settings" />
        </View>
        <SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />
      </View>

      <Pressable
        onPress={seq.running ? seq.pause : seq.paused ? seq.resume : begin}
        accessibilityRole="button"
        accessibilityLabel={circleLabel}
        accessibilityState={{ selected: seq.running }}
        style={s.circleBox}
      >
        <View style={s.ringWrap} pointerEvents="none">
          {/* The ripples: idle life, and under Reduce Motion they are simply not drawn. */}
          {!reduceMotion && <Ripples ui={ui} running={seq.running} />}

          {/* The anchor: a hairline ring that never moves, so the disc has something to breathe
              against. Without it the growth reads as the whole element zooming. */}
          <View style={[s.anchor, { borderColor: alpha(ui.accent, 0.22) }]} />

          {/* The progress arc, over the anchor: how much of this breath is left. */}
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <AnimatedCircle
              cx={RING / 2}
              cy={RING / 2}
              r={RING_R}
              stroke={alpha(ui.accent, 0.75)}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              // Start at twelve o'clock: a breath should begin at the top, not at three.
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={ringProps}
            />
          </Svg>

          {/* The disc: the pacer itself. */}
          <Animated.View style={[s.disc, { backgroundColor: ui.accentTint }, circle]} />
        </View>

        <View style={s.circleInner}>
          <Text variant="title1" style={s.circleWord}>
            {seq.status === "idle" ? "Ready" : seq.completed ? "Done" : phaseWord}
          </Text>
          <Text variant="meta" tone="ink2" style={s.circleSub}>
            {seq.status === "idle"
              ? `${rate} breaths a minute`
              : seq.completed
                ? `${cycles} cycles`
                : `${seq.secondsLeft}s`}
          </Text>
          <Text variant="caption" tone="ink3" style={s.tapHint}>
            {seq.status === "idle" ? "TAP TO BEGIN" : seq.paused ? "PAUSED — TAP TO RESUME" : "TAP TO PAUSE"}
          </Text>
        </View>
      </Pressable>

      {/* The primary action stays in one position and changes label, so the control a person
          reaches for without looking is always in the same place. */}
      <Button
        title={
          seq.running ? "Pause" : seq.paused ? "Resume" : seq.completed ? "Go again" : "Begin"
        }
        onPress={seq.running ? seq.pause : seq.paused ? seq.resume : begin}
        haptic="medium"
        style={s.cta}
      />

      <View style={s.stats}>
        <Stat ui={ui} label="cycles" value={String(cycles)} />
        <Stat ui={ui} label="elapsed" value={mmss(seq.elapsedMs / 1000)} />
        <Stat ui={ui} label="left" value={mmss(seq.remainingSeconds)} />
      </View>

      <View
        style={s.bar}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(seq.progress * 100) }}
      >
        <View style={[s.barFill, { width: `${Math.round(seq.progress * 100)}%` }]} />
      </View>

      {seq.running || seq.paused ? (
        <Button title="Finish early" variant="ghost" onPress={finish} style={s.early} />
      ) : null}

      {/*
       * ── The setup controls are hidden while a session exists, and this shows what they were
       *    set to ─────────────────────────────────────────────────────────────────────────────
       *
       * The chips below are hidden only while the clock is *actually ticking*, because changing the
       * pattern mid-breath would leave the phases already breathed belonging to a different pattern
       * than the cycles count beside them — the same "the label lies" problem the routine-length
       * guard exists to prevent.
       *
       * This card covers that one state so the screen is never silent about what a session is set
       * to. **Paused is not that state**: a pause is exactly when somebody looks up and asks what
       * they chose or wants to change it, so the real chips come back and this card steps aside.
       * Hiding them there was the bug — a paused screen showed a circle, a Finish button and the
       * charts, and nothing that said the pattern and length controls existed at all, which reads
       * as the app having lost a feature rather than tidied one away.
       */}
      {seq.running ? (
        <Card style={s.setupCard}>
          <Text variant="caption" tone="ink3">
            THIS SESSION
          </Text>
          <View style={s.setupRow}>
            <View style={s.setupItem}>
              <Text variant="callout" style={{ color: ui.accent }}>
                {pattern.name}
              </Text>
              <Text variant="caption" tone="ink3">
                PATTERN
              </Text>
            </View>
            <View style={s.setupItem}>
              <Text variant="callout" style={{ color: ui.accent }}>
                {minutes} min
              </Text>
              <Text variant="caption" tone="ink3">
                LENGTH
              </Text>
            </View>
            <View style={s.setupItem}>
              <Text variant="callout" style={{ color: ui.accent }}>
                {rate}/min
              </Text>
              <Text variant="caption" tone="ink3">
                BREATHS
              </Text>
            </View>
          </View>
          <Text variant="meta" tone="ink3">
            Pause to change the pattern or the length. They cannot change while the clock is running,
            because the cycles count beside them would stop being true.
          </Text>
        </Card>
      ) : null}

      {!seq.running ? (
        <>
          <Text variant="caption" tone="ink3" style={s.section}>
            {seq.paused ? "PATTERN · TAP TO START OVER" : "PATTERN"}
          </Text>
          <View style={s.row}>
            {PATTERNS.map((p) => (
              <UiChip
                key={p.id}
                label={p.chip}
                active={p.id === patternId}
                onPress={() => choosePattern(p.id)}
                accessibilityLabel={
                  seq.paused
                    ? `${p.chip} — ends this session and starts a new one in this pattern`
                    : p.chip
                }
              />
            ))}
          </View>
          <Text variant="meta" tone="ink2" style={s.note}>
            {pattern.note}
          </Text>

          <Text variant="caption" tone="ink3" style={s.section}>
            {seq.paused ? "LENGTH · TAP TO START OVER" : "LENGTH"}
          </Text>
          <View style={s.row}>
            {LENGTHS.map((m) => (
              <UiChip
                key={m}
                label={`${m} min`}
                active={m === minutes}
                onPress={() => chooseLength(m)}
                accessibilityLabel={
                  seq.paused
                    ? `${m} minutes — ends this session and starts a new one`
                    : `${m} minutes`
                }
              />
            ))}
          </View>
          <Text variant="meta" tone="ink3" style={s.note}>
            {seq.paused
              ? `Tapping a pattern or a length ends this paused session and returns to the start. Right now: ${rate} breaths a minute, about ${targetCycles(pattern, minutes)} cycles.`
              : `${rate} breaths a minute · about ${targetCycles(pattern, minutes)} cycles`}
          </Text>

          {seq.completed && result ? (
            <Card style={s.doneCard}>
              <Text variant="title3">Session saved</Text>
              <Text variant="meta" tone="ink2">
                {mmss(result.seconds)} · {result.cycles} cycles · {pattern.name} · about {rate}{" "}
                breaths a minute
              </Text>
              <SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />
            </Card>
          ) : null}

          <Text variant="caption" tone="ink3" style={s.section}>
            YOUR PHRASE
          </Text>
          {editing ? (
            <View style={s.editRow}>
              <PhraseInput
                value={phraseIn}
                onDone={(v) => {
                  // The in-breath line is the phrase Profile shows, so it is the one that is
                  // saved; clearing it back to the default stores nothing rather than storing
                  // the placeholder as if the person had typed it.
                  const next = v.trim();
                  update({ phrase: next === PHRASE_IN ? "" : next });
                  setEditing(false);
                }}
                ui={ui}
              />
            </View>
          ) : null}
          <Pressable
            onPress={() => setEditing((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={`Your phrase: ${phraseIn}, then ${phraseOut}. Tap to change.`}
            style={s.phraseCard}
          >
            <Text variant="body">{phraseIn}</Text>
            <Text variant="body" tone="ink3">{phraseOut}</Text>
            <Text variant="meta" tone="ink4">
              Tap to change — one line for the in-breath, one for the out-breath
            </Text>
          </Pressable>
        </>
      ) : null}

      {store.last && seq.status === "idle" ? (
        <Text variant="meta" tone="ink3" style={s.note}>
          Last session: {store.last.minutes} min, {store.last.units} cycles, {store.last.label}
        </Text>
      ) : null}

      <InsightPanel
        screen="breathe"
        unitsLabel="cycles"
        weeklyGoal={settings.weeklyGoal}
        accentKey="breathe"
      />

      {/* The sound settings, on the screen they change. A cue and a bed are two different things a
          person may want separately, so they are two switches. The sentence about your own words is
          here rather than buried: it is the one thing about the sound a person could otherwise
          expect and not get. */}
      <Card style={s.soundCard}>
        <Text variant="title3">Sound</Text>
        <SoundSwitchRow
          label="Cues"
          hint="A rising tone in, a falling tone out"
          on={settings.cuesOn}
          onPress={() => update({ cuesOn: !settings.cuesOn })}
        />
        <SoundSwitchRow
          label="Backdrop"
          hint="A quiet drone under the whole session"
          on={settings.droneOn}
          onPress={() => update({ droneOn: !settings.droneOn })}
        />
        <Text variant="meta" tone="ink3" style={s.infoP}>
          Generated inside the app, so it works with no signal and nothing is downloaded. There is no
          spoken voice: the rising and falling tones carry the instruction, and the two lines above
          are yours to read at your own pace.
        </Text>
      </Card>

      <Card style={s.infoCard}>
        <Text variant="title3">What slow breathing does</Text>
        <Text variant="meta" tone="ink2" style={s.infoP}>
          Breathing at about six breaths a minute, with a longer exhale than inhale, is the
          rate slow-breathing research focuses on. Protocols that study it measure things
          like heart-rate variability.
        </Text>
        <Text variant="title3" style={s.infoH}>Why long prayer is in here</Text>
        <Text variant="meta" tone="ink2" style={s.infoP}>
          Many traditions pair a long, slow breath with a repeated phrase — japa, dhikr, the
          rosary, pranayama counting. What they share is the shape: a slow breath and a
          repetition. Type your own two lines and this screen keeps the count for you.
        </Text>
        <Text variant="title3" style={s.infoH}>What this is not</Text>
        <Text variant="meta" tone="ink2" style={s.infoP}>
          Not a treatment, not a diagnosis, not a replacement for care. Don&apos;t practise
          breath-holds in water or while driving, and stop if you feel dizzy.
        </Text>
      </Card>
    </ScrollView>
  );
}

/* ── The animation layers ───────────────────────────────────────────────────────────────
   Two small components rather than inline JSX, because each owns a shared value and therefore
   a hook, and a hook inside a conditional branch of the main render is exactly the thing this
   codebase has been careful not to do.                                                        */

/**
 * The ripples: three rings breathing outward on a loop, staggered so the eye reads a pulse
 * rather than three expanding circles.
 *
 * Indefinite by design (`withRepeat(..., -1)`) and *not* phase-locked to the timer. The idle
 * state has no clock to lock to, and a locked ripple would jump when a session starts. It is
 * ambient: it says the screen is alive, and it stops entirely under Reduce Motion — which is
 * checked here rather than at the call site so the component cannot be used the wrong way.
 */
function Ripples({ ui, running }: { ui: ProductUI; running: boolean }) {
  const reduceMotion = useReduceMotion();
  if (reduceMotion) return null;
  return (
    <View style={s0.rippleWrap} pointerEvents="none">
      {Array.from({ length: RIPPLES }).map((_, i) => (
        <Ripple key={i} ui={ui} index={i} running={running} />
      ))}
    </View>
  );
}

function Ripple({ ui, index, running }: { ui: ProductUI; index: number; running: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    // Slower and wider while a session runs, so the ambient layer does not compete with the
    // pacer; faster and tighter at rest, so a stopped screen is not completely still.
    const period = running ? 6400 : 4600;
    p.value = 0;
    p.value = withDelay(
      index * 700,
      withRepeat(withTiming(1, { duration: period, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [p, index, running]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - p.value) * (running ? 0.16 : 0.2),
    transform: [{ scale: 0.86 + p.value * 0.38 }],
  }));

  return <Animated.View style={[s0.ripple, { borderColor: ui.accent }, style]} />;
}

function Stat({ ui, label, value }: { ui: ProductUI; label: string; value: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text variant="title3" style={{ color: ui.accent }}>{value}</Text>
      <Text variant="caption" tone="ink3">{label}</Text>
    </View>
  );
}

/** The phrase field. One input: the in-breath line, which is the one settings stores. */
function PhraseInput({ value, onDone, ui }: { value: string; onDone: (v: string) => void; ui: ProductUI }) {
  const [text, setText] = useState(value);
  return (
    <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => onDone(text.trim())}
        placeholder="In-breath line"
        placeholderTextColor={ui.faint}
        returnKeyType="done"
        accessibilityLabel="Your in-breath phrase"
        style={{
          flex: 1,
          minHeight: 44,
          borderWidth: 1,
          borderColor: ui.hairline,
          borderRadius: radius.sm,
          paddingHorizontal: 12,
          color: ui.ink,
        }}
      />
      <Button title="Save" onPress={() => onDone(text.trim())} style={{ minWidth: 84 }} />
    </View>
  );
}

function makeStyles(ui: ProductUI) {
  return StyleSheet.create({
    // `flex: 1` is on the scroller, not on a content container: the background has to cover the
    // full screen even when the content is taller than it.
    root: { flex: 1, backgroundColor: ui.bg },
    // The horizontal inset lives on the content, so the scroll indicator sits at the screen edge
    // the way it does on every other screen rather than floating inside the cards.
    content: { paddingHorizontal: space.base },
    head: { gap: 4, marginBottom: space.base },
    headRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
    headText: { flex: 1, gap: 4 },
    circleBox: { alignItems: "center", justifyContent: "center", height: RING + 24, minHeight: 44 },
    ringWrap: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
    anchor: { position: "absolute", width: RING - 12, height: RING - 12, borderRadius: (RING - 12) / 2, borderWidth: 1 },
    disc: {
      position: "absolute",
      width: RING - 60,
      height: RING - 60,
      borderRadius: (RING - 60) / 2,
      borderWidth: 1,
      borderColor: alpha(ui.accent, 0.42),
    },
    circleInner: { position: "absolute", alignItems: "center", gap: 2 },
    circleWord: { textAlign: "center" },
    circleSub: { fontVariant: ["tabular-nums"] },
    tapHint: { letterSpacing: 1.1, marginTop: 2 },
    stats: { flexDirection: "row", justifyContent: "space-around", marginTop: space.sm },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, marginTop: space.md, overflow: "hidden" },
    barFill: { height: 4, borderRadius: 2, backgroundColor: ui.accent },
    cta: { marginTop: space.md, minHeight: 52 },
    early: { marginTop: space.sm },
    section: { marginTop: space.lg, marginBottom: space.xs, letterSpacing: 1.1 },
    row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
    note: { marginTop: space.sm },
    editRow: { marginBottom: space.sm },
    phraseCard: {
      borderWidth: 1,
      borderColor: ui.hairline,
      borderRadius: radius.md,
      padding: space.md,
      gap: 2,
      minHeight: 44,
    },
    doneCard: { marginTop: space.md, gap: 4 },
    soundCard: { marginTop: space.base, gap: space.sm },
    // The read-only summary of what a running session is set to. Three equal columns so the
    // numbers line up with the stats row above rather than drifting with their label widths.
    setupCard: { marginTop: space.base, gap: space.sm },
    setupRow: { flexDirection: "row", justifyContent: "space-between", gap: space.sm },
    setupItem: { flex: 1, gap: 0 },
    switchRow: { gap: space.sm },
    infoCard: { marginTop: space.base, marginBottom: space.xxl, gap: 6 },
    infoH: { marginTop: space.sm },
    infoP: { lineHeight: 19 },
  });
}

/**
 * The styles for the animation and control atoms, kept separate from `makeStyles` because they
 * do not depend on the palette — which is also why they can live outside the component and not
 * be rebuilt on every theme change.
 */
const s0 = StyleSheet.create({
  rippleWrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  ripple: { position: "absolute", width: RING - 40, height: RING - 40, borderRadius: (RING - 40) / 2, borderWidth: 1.5 },
  toggle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  switchChip: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, gap: 2, minHeight: 44 },
  switchTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  switchHint: { lineHeight: 15 },
});
