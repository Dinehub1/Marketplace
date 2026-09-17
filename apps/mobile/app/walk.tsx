/**
 * Walk — an interval timer for a walk that is actually a workout.
 *
 * Why: "walk for thirty minutes" is easy to skip and impossible to feel. A timer that
 * says FAST for a minute and EASY for two turns the same walk into something with a
 * shape. It needs no sensors, no GPS and no account — a person walking with one earbud
 * in is the whole user interface.
 *
 * Honest scope: an interval timer. It does not measure distance, steps or heart rate,
 * and it does not claim a training effect it cannot see.
 *
 * ── What changed ──────────────────────────────────────────────────────────────────────
 *
 * It now runs on the shared engine (`lib/timer.ts`) rather than the old tick-accumulating
 * clock. Two consequences a person will notice, and both are fixes rather than features:
 *
 *   * **It survives a lock screen.** The old clock counted interval ticks, and iOS suspends
 *     JavaScript when the app is not foregrounded — so putting the phone in a pocket for two
 *     minutes of the walk meant the timer came back two minutes behind. The intervals are
 *     now derived from timestamps, so a backgrounded walk is simply *correct*.
 *   * **It can be paused.** There was no pause button because the old clock could not
 *     express one. Stopping at a crossing should not end the session or restart the round.
 *
 * ── Why sound is the primary feedback here ────────────────────────────────────────────
 *
 * The premise above is the reason the tone is not a decoration on this screen. The person it is for
 * has the phone in a pocket and one earbud in: "walk fast" is only an instruction if it is *heard*,
 * because the screen it would otherwise be written on is not being looked at. So the cue carries the
 * instruction, and each half of the interval has its own shape — `fast` pushes upward, `easy` settles
 * downward, and the alternation is audible as an alternation rather than as a series of beeps.
 *
 * (This screen used to speak those words instead. The voice was removed for sounding robotic on a
 * real phone; the three pace cues are what replaced it, and they are arguably better here, because a
 * tone is recognisable before it has finished while a word needs its whole length to land.)
 *
 * Two details are deliberate:
 *
 *   * **The last fast interval gets its own cue.** Every other fast turn gets `fast`; the final one
 *     gets `last`, a rising figure rather than a falling one. Somebody who cannot see the phone has
 *     no other way to know the session is nearly over, and the difference between "one more hard
 *     minute" and "you are done after this" is the difference between pacing and giving up.
 *   * **The phase haptics are fired here, not by the engine** (`feedback: "screen"`). The engine
 *     fires one light impact per turn and cannot know which turn matters, so taking it over is the
 *     only way the fast interval can be heavier. Every turn the engine would have buzzed still gets
 *     its light impact, so nothing on this screen is quieter than it was.
 *
 * ── Motion ────────────────────────────────────────────────────────────────────────────
 *
 * The fast interval is the only thing on the card that moves: an accent ring cross-fades in, a
 * glow behind the card breathes on a 1.5s cycle, and the phase word fades and lifts 8pt when it
 * changes. All three are there so that a glance — from a pocket or from a hand — registers the
 * turn, not for decoration: no spring, no bounce. Under Reduce Motion the pulse and the scale are
 * dropped and the ring still cross-fades, because a border changing colour is information rather
 * than motion. Both numbers that change every second use tabular figures, so a countdown does not
 * twitch as the glyph widths change.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { alpha, radius, space } from "@hermes/tokens";
import Svg, { Path as SvgPath } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Button, Card, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { ProfileAction, WellnessShell } from "@/components/wellness-shell";
import { useSequence, type Phase } from "@/lib/timer";
import { useWellnessStore } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { useReduceMotion } from "@/lib/motion";
import { useProductUI } from "@/lib/product-ui";
import { WELLNESS_CUES, isMuted, makeWellnessAudio, setMuted, useSoundPrefs } from "@/lib/sound";

const ROUND_OPTIONS = [3, 5, 8];
const FAST = 60;
const EASY = 120;
const WARM = 180;
const COOL = 180;

function buildPhases(rounds: number): Phase[] {
  const out: Phase[] = [{ key: "warm", label: "Warm up", seconds: WARM }];
  for (let i = 0; i < rounds; i++) {
    out.push({ key: `fast-${i}`, label: "Fast", seconds: FAST });
    out.push({ key: `easy-${i}`, label: "Easy", seconds: EASY });
  }
  out.push({ key: "cool", label: "Cool down", seconds: COOL });
  return out;
}

export default function Walk() {
  const ui = useProductUI("walk");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [rounds, setRounds] = useState(5);
  const [finished, setFinished] = useState(false);
  const phases = useMemo(() => buildPhases(rounds), [rounds]);
  const store = useWellnessStore("walk");
  const { settings, update } = useSettings();
  const reduceMotion = useReduceMotion();

  /**
   * The players, one literal `useAudioPlayer` call each.
   *
   * Verbose on purpose, and the reason is written down at length in `lib/sound.ts`: a hook's call
   * count has to be fixed, so the list of sounds a screen can make has to be *code* rather than
   * data. `["walkFast","walkSlow"].map(useAudioPlayer)` is a rules-of-hooks violation, and the
   * two drafts that hid the loop behind a helper were both flagged by lint for good reason.
   *
   * Only the sounds this screen actually fires are loaded. A cue with no player is a no-op rather
   * than a fallback, so a cue this screen forgot to load would be a quiet bug rather than a loud one
   * — which is exactly why the list is here to read.
   */
  const cueTick = useAudioPlayer(WELLNESS_CUES.tick);
  const cueInterval = useAudioPlayer(WELLNESS_CUES.interval);
  const cueDone = useAudioPlayer(WELLNESS_CUES.done);
  /* Walk's three pace cues. These replaced the spoken "fast"/"slow"/"last round": a walker with one
     earbud in needs to tell the two halves of an interval apart, and a low settling figure versus a
     high pushing one does that without a word. */
  const cueFast = useAudioPlayer(WELLNESS_CUES.fast);
  const cueEasy = useAudioPlayer(WELLNESS_CUES.easy);
  const cueLast = useAudioPlayer(WELLNESS_CUES.last);

  const prefs = useSoundPrefs();

  /** All three sound layers off. What the header speaker draws itself from. */

  const muted = isMuted(prefs);

  /**
   * The audio behaviour, built once and then kept up to date.
   *
   * `useMemo` on the *players*, which are stable for the life of the screen, so this object is
   * created once — which is what lets the engine's `onPhase` callback hold `audio.say` without
   * being torn down and rebuilt. The preferences are pushed in by the effect below rather than
   * being a dependency here, because rebuilding this object on a toggle would recreate every
   * method and defeat exactly that stability.
   */
  const audio = useMemo(
    () =>
      makeWellnessAudio(
        {
          cues: {
            tick: cueTick,
            interval: cueInterval,
            done: cueDone,
            fast: cueFast,
            easy: cueEasy,
            last: cueLast,
          },
        },
        prefs,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `prefs` is pushed in via syncPrefs
    [cueTick, cueInterval, cueDone, cueFast, cueEasy, cueLast],
  );

  /* The switch is read at fire time, so flipping the header toggle takes effect on the very next
     phase rather than at the next session. */
  useEffect(() => {
    audio.syncPrefs(prefs);
  }, [audio, prefs]);

  /**
   * Guards the write. The engine fires `onComplete` once by contract; this is the second
   * gate, because a duplicated session row is visible in the Progress chart.
   */
  const saved = useRef(false);
  const persist = useMemo(
    () => (elapsedMs: number) => {
      if (saved.current) return;
      saved.current = true;
      const seconds = Math.max(0, Math.round(elapsedMs / 1000));
      setFinished(true);
      store.save({
        at: Date.now(),
        screen: "walk",
        // The time actually walked, not the time the session was scheduled for.
        minutes: Math.max(1, Math.round(seconds / 60)),
        units: rounds,
        label: `${rounds} fast/easy rounds`,
      });
    },
    [rounds, store],
  );

  const totalSeconds = useMemo(() => phases.reduce((n, p) => n + p.seconds, 0), [phases]);

  /**
   * The key of the final Fast interval — the one that gets the "last one" phrase.
   *
   * Read out of the phase list rather than computed as `fast-${rounds - 1}` so it cannot disagree
   * with what the engine is actually running: the list is
   * [warm, fast-0, easy-0, … fast-(n-1), easy-(n-1), cool], so the last entry labelled "Fast" is
   * the interval immediately before the cool-down. `rounds` is state that a person can change;
   * `phases` is the thing on the clock.
   */
  const lastFastKey = useMemo(
    () => phases.slice().reverse().find((p) => p.label === "Fast")?.key ?? "",
    [phases],
  );

  /**
   * The engine's phase transition is the only place a cue can correctly live.
   *
   * Adding the sound here rather than to a tick is what makes it fire exactly once per turn:
   * `onPhase` is called only when the index really changed, so a re-render, a settings change or
   * a resume from pause cannot double a cue — and a background catch-up that skips four phases
   * plays one sound instead of four, each haptic landing once on the turn the walker is actually
   * in.
   *
   * `feedback: "screen"` takes the engine's generic light impact over, and the comment above the
   * `onPhase` body says what replaces it. Nothing here can throw into a render: `cue` and `say`
   * are fire-and-forget by design and the haptics are `.catch(() => {})` like everywhere else in
   * this app, so a device with no audio route or no taptic engine walks the same session.
   */
  const seq = useSequence(phases, {
    feedback: "screen",
    onComplete: () => {
      persist(totalSeconds * 1000);
      // Three notes up a triad: the same "finished" the other wellness screens use, so the end of
      // a walk is recognisable from inside a pocket without having to be learned again.
      audio.cue("done");
    },
    onPhase: (_index, phase) => {
      if (phase.label === "Fast") {
        // The last fast interval gets its own rising figure instead of the words "last round" —
        // the one piece of information a walker wants without looking at the phone, since it is the
        // difference between pacing yourself and spending what is left.
        audio.cue(phase.key === lastFastKey ? "last" : "fast");
        // Heavier than every other turn, and that is the point: through a jacket pocket the
        // difference between this and a light tap is the whole message, because the fast interval
        // is what the walk is built around.
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        return;
      }
      if (phase.label === "Easy") {
        audio.cue("easy");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return;
      }
      // Warm up and cool down are not instructions — there is nothing to say — so they keep the
      // plain routine tick and the light impact the engine fired for every turn before this.
      audio.cue("tick");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
  });

  const totalMin = Math.round(totalSeconds / 60);
  const isFast = seq.phase?.label === "Fast";
  const active = seq.running || seq.paused;
  const fastNow = isFast && active;

  /**
   * The fast interval's accent treatment, cross-faded rather than snapped on.
   *
   * Two values rather than one because they say different things: `fastTint` is the *state* (the
   * ring is on while fast runs), `fastPulse` is the *life* (the glow behind the card breathes).
   * Merging them would make the ring fade in and out on every pulse, which reads as a fault
   * light rather than as a state.
   *
   * The pulse is a `withRepeat(…, -1, true)` on a plain shared value: it only runs while fast is
   * running, so the card is completely still for the warm-up, the easy intervals and the
   * cool-down. Under Reduce Motion it never starts, and the ring still cross-fades — a 420ms
   * colour change is not motion.
   */
  const fastTint = useSharedValue(0);
  const fastPulse = useSharedValue(0);

  useEffect(() => {
    fastTint.value = withTiming(fastNow ? 1 : 0, {
      duration: reduceMotion ? 180 : 420,
      easing: Easing.out(Easing.quad),
    });
    if (fastNow && !reduceMotion) {
      fastPulse.value = 0;
      fastPulse.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      // Assigning a timing over a running repeat cancels it, so this is also the "fast ended"
      // path and the glow settles to nothing instead of freezing mid-breath.
      fastPulse.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
    }
  }, [fastNow, reduceMotion, fastTint, fastPulse]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: fastTint.value }));
  /* Half opacity at the peak of the breath, 1.2% larger than the card: the glow is a halo at the
     card's edge, not a wash over the text, so legibility never depends on where the pulse is. */
  const glowStyle = useAnimatedStyle(() => ({
    opacity: fastPulse.value * 0.5,
    transform: [{ scale: 1 + fastPulse.value * 0.012 }],
  }));
  /* The card itself moves 0.4% — felt more than seen, and pinned at 1 under Reduce Motion. */
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : 1 + fastPulse.value * 0.004 }],
  }));

  /** The big line, and the phase it belongs to — the key is the animation's identity. */
  const word = active ? (seq.phase?.label ?? "") : `${totalMin} minutes`;
  const wordKey = active ? (seq.phase?.key ?? "none") : finished ? "finished" : "idle";

  const wordFade = useSharedValue(1);
  const wordSlide = useSharedValue(0);

  useLayoutEffect(() => {
    // Reset and replay inside the same commit. A plain effect can land after the new word has
    // been painted, which shows it once at full opacity and then blinks — the exact flicker this
    // is here to remove. The lift is dropped under Reduce Motion; the fade stays, because a
    // pocket glance needs *some* signal that the word changed.
    wordFade.value = 0;
    wordSlide.value = reduceMotion ? 0 : 8;
    wordFade.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
    wordSlide.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
  }, [wordKey, reduceMotion, wordFade, wordSlide]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordFade.value,
    transform: [{ translateY: wordSlide.value }],
  }));

  function begin() {
    saved.current = false;
    setFinished(false);
    seq.start();
    /* The engine reports a phase only when the index *changes*, and `start()` leaves the index at
       zero — so phase one would otherwise arrive with a haptic and no words. The walker presses
       Start and then puts the phone in a pocket, so this is the one cue that must not be missed. */
    audio.cue("tick");
  }

  function finishEarly() {
    seq.finish();
    persist(seq.elapsedMs);
  }

  return (
    <WellnessShell
      product="walk"
      title="Walk"
      lead="Fast for a minute, easy for two. The timer keeps the shape, you keep walking."
      tabBar={false}
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
      headerAction={
        /* The sound control is here, beside Profile, rather than only inside Profile: the moment
           somebody wants the walk quiet is the moment they are already walking. */
        <View style={s.headerActions}>
          <SoundToggle
            muted={muted}
            onPress={() => {
              setMuted(update, !muted);
              // Feedback for the control itself, and only when un-muting: answering the tap that
              // turns sound *off* with a noise is the one joke a mute control must not make.
              if (muted) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }}
          />
          <ProfileAction />
        </View>
      }
    >
      {/* The wrapper owns the card's bottom margin so the glow is positioned against the card's
          own box: a margin inside it would leave the halo hanging over the gap below. */}
      <View style={s.cardWrap}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, s.glow, { backgroundColor: alpha(ui.accent, 0.22) }, glowStyle]}
        />
        <Animated.View style={cardStyle}>
          <Card style={s.big}>
            {/* The accent ring, cross-faded in while the fast interval runs. An overlay rather
                than the Card's own border because a border colour has to animate, and a colour
                that changes in one commit is what reads as a glitch. */}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, s.ring, { borderColor: ui.accent }, ringStyle]}
            />
            <Text variant="caption" tone="ink3">
              {active ? (isFast ? "NOW — FAST" : (seq.phase?.label ?? "").toUpperCase()) : "THE SESSION"}
            </Text>
            {/* The word is wrapped so it can fade and lift on its own: it is the one line that
                changes at a turn, and it is what a glance is looking for. */}
            <Animated.View style={wordStyle}>
              <Text variant="title1" style={isFast && active ? { color: ui.accent } : undefined}>
                {word}
              </Text>
            </Animated.View>
            <Text variant="title2" style={[s.countdown, { color: ui.accent }]}>
              {active ? `${seq.secondsLeft}s` : `${rounds} fast/easy rounds`}
            </Text>
            {active ? (
              <View
                style={s.bar}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(seq.progress * 100) }}
              >
                <View style={[s.fill, { width: `${Math.round(seq.progress * 100)}%` }]} />
              </View>
            ) : null}
            {active ? (
              <Text variant="meta" tone="ink3" style={s.clock}>
                {seq.clock} elapsed ·{" "}
                {seq.remainingSeconds >= 60
                  ? `${Math.ceil(seq.remainingSeconds / 60)} min left`
                  : `${seq.remainingSeconds}s left`}
              </Text>
            ) : null}
            {seq.paused ? (
              <Text variant="meta" tone="ink2">
                Paused — the clock is stopped.
              </Text>
            ) : null}
          </Card>
        </Animated.View>
      </View>

      {active ? (
        <>
          <Button
            title={seq.paused ? "Resume" : "Pause"}
            onPress={seq.paused ? seq.resume : seq.pause}
            haptic="medium"
            style={s.primaryControl}
          />
          <View style={s.secondaryRow}>
            <Button title="Skip interval" variant="ghost" onPress={seq.next} style={s.secondaryControl} />
            <Button title="Finish" variant="ghost" onPress={finishEarly} style={s.secondaryControl} />
          </View>
        </>
      ) : (
        <Button title={finished ? "Go again" : "Start walking"} onPress={begin} haptic="medium" />
      )}

      {!active ? (
        <>
          <Text variant="caption" tone="ink3" style={s.section}>
            ROUNDS
          </Text>
          <View style={s.row}>
            {ROUND_OPTIONS.map((r) => (
              <Button
                key={r}
                title={`${r}×`}
                variant={r === rounds ? "secondary" : "ghost"}
                onPress={() => {
                  setRounds(r);
                  setFinished(false);
                  saved.current = false;
                  seq.reset();
                }}
                style={s.roundButton}
              />
            ))}
          </View>
          <Card style={s.info}>
            <Text variant="title3">How the session is built</Text>
            <Text variant="meta" tone="ink2">
              3 minutes warm up · {rounds} × ({FAST}s fast + {EASY}s easy) · 3 minutes cool down.
              It stops when the last round ends; nothing to remember.
            </Text>
          </Card>
        </>
      ) : null}

      {finished ? (
        <Card style={s.saved}>
          <Text variant="title3">Saved on this device</Text>
          <Text variant="meta" tone="ink2">
            {store.last?.minutes ?? 0} minutes · {store.last?.label ?? ""}
          </Text>
        </Card>
      ) : null}

      {store.last && !active && !finished ? (
        <Text variant="meta" tone="ink3" style={s.note}>
          Last session: {store.last.minutes} min · {store.last.label}
        </Text>
      ) : null}

      <InsightPanel screen="walk" unitsLabel="intervals" weeklyGoal={settings.weeklyGoal} />
    </WellnessShell>
  );
}

/* ── The sound control ───────────────────────────────────────────────────────────────── */

/**
 * The one-tap silence in the header.
 *
 * It is the master mute described in `setMuted`: one tap takes the cues and the bed, so the label
 * can promise silence and mean it. The independent switches are on Profile, for somebody who wants
 * a finer answer than "sound or no sound".
 */
function SoundToggle({
  muted,
  onPress,
}: {
  muted: boolean;
  onPress: () => void;
}) {
  const ui = useProductUI("walk");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: muted }}
      accessibilityLabel={
        muted
          ? "Sound is muted. Tap to turn the walk's tones back on."
          : "Sound is on. Tap to mute the walk's tones."
      }
      hitSlop={10}
      style={[
        s0.toggle,
        {
          borderColor: muted ? ui.hairline : alpha(ui.accent, 0.5),
          backgroundColor: muted ? "transparent" : ui.accentTint,
        },
      ]}
    >
      <SpeakerGlyph color={muted ? ui.faint : ui.accent} muted={muted} />
    </Pressable>
  );
}

/**
 * A speaker mark: a cone and two arcs, or a cone and a stroke through it when muted.
 *
 * Hand-drawn here rather than imported from the Breathe screen or added to `components/icons.tsx`:
 * a screen importing a control from another screen is how two screens become one screen with two
 * names, and the shared icon set is deliberately small — a shared glyph nobody shares is just a
 * longer list to read.
 */
function SpeakerGlyph({ color, muted }: { color: string; muted: boolean }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The cone: one closed path, so the speaker reads at 20pt. */}
      <SvgPath d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" />
      {muted ? (
        <SvgPath d="M16 9.5l4 5M20 9.5l-4 5" />
      ) : (
        <>
          <SvgPath d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          <SvgPath d="M18.2 6.8a7.6 7.6 0 0 1 0 10.4" />
        </>
      )}
    </Svg>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    headerActions: { flexDirection: "row", alignItems: "center", gap: space.xs },
    cardWrap: { marginBottom: space.base },
    big: { gap: 6, borderWidth: 1, borderColor: "transparent" },
    /* The ring is drawn on top of the card, so it repeats the card's radius to sit on its edge. */
    ring: { borderRadius: radius.lg, borderWidth: 1 },
    glow: { borderRadius: radius.lg },
    /* Tabular figures for the two numbers that change every second: proportional digits make a
       countdown twitch as each glyph's width changes. */
    countdown: { fontVariant: ["tabular-nums"] },
    clock: { fontVariant: ["tabular-nums"] },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: 6 },
    fill: { height: 4, backgroundColor: ui.accent, borderRadius: 2 },
    section: { marginTop: space.lg, marginBottom: space.sm, letterSpacing: 1.1 },
    row: { flexDirection: "row", gap: space.sm },
    roundButton: { flex: 1 },
    primaryControl: { minHeight: 52 },
    secondaryRow: { flexDirection: "row", gap: space.sm, marginTop: space.sm },
    secondaryControl: { flex: 1 },
    info: { marginTop: space.base, gap: 6 },
    saved: { marginTop: space.base, gap: 3 },
    note: { marginTop: space.md },
  });
}

/**
 * The styles for the control atom, kept apart from `makeStyles` because they do not depend on the
 * palette — which is also why they can live outside the component and not be rebuilt on every
 * theme change. 40×40 with `hitSlop` is the smallest thing worth tapping in a header; the 44pt
 * floor is the shell's action, and a control beside it should not read as the same weight.
 */
const s0 = StyleSheet.create({
  toggle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
