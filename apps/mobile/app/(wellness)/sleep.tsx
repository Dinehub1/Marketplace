/**
 * Sleep — a wind-down, in two parts: 4·7·8 rounds, then a "lights out" countdown.
 *
 * Why this and not "sleep sounds": the part a phone can genuinely help with is the last
 * ten minutes — slowing the breath down and then getting out of the way. So the screen
 * does the breathing rounds, then counts down to lights-out while the screen stays dim
 * and still.
 *
 * Honest scope: no claims about curing insomnia or improving sleep stages. It is a
 * wind-down routine with a timer, and it says so.
 *
 * ── What changed ──────────────────────────────────────────────────────────────────────
 *
 * Both clocks now run on the shared engine (`lib/timer.ts`).
 *
 * The rounds already used a phase clock, so they mostly gained a pause button. The
 * lights-out countdown was the real bug: it was a hand-rolled `setInterval` that subtracted
 * 1000 from a stored number once a second. That is the worst of both worlds — it drifts when
 * the app is busy, and it *stops entirely* when the screen locks, which is precisely the
 * state a person's phone is in during a lights-out countdown. A twenty-minute countdown left
 * face down came back still showing nineteen minutes.
 *
 * Modelled as a one-phase sequence it costs nothing and inherits the fix: the remaining time
 * is `startedAt + duration - now`, so locking the phone for ten minutes and picking it back
 * up shows ten minutes fewer, correctly.
 *
 * ── Sound, and the one limit worth saying out loud ────────────────────────────────────
 *
 * The rounds are spoken — "breathe in", "hold", "breathe out" — and a bed plays underneath
 * the whole session. Both come from `lib/sound.ts` and are synthesized inside this repo, so
 * there is nothing to download, no permission to grant, and nothing to hear in aeroplane
 * mode. The two switches (cues, bed) are the person's, not this screen's: it only
 * says which sound belongs to which moment and lets the bank decide whether to make it.
 *
 * The limit, said here because a screen cannot say everything: **the bed stops when the app
 * is suspended.** This app does not play audio with the screen off, because that needs a
 * background audio mode and a different conversation with both stores. The countdown
 * survives a locked phone because it is measured from the clock; the sound does not survive
 * it. The lights-out card tells the person that in as many words, rather than letting them
 * find out at 2am.
 *
 * ── Motion ────────────────────────────────────────────────────────────────────────────
 *
 * Three decisions, all of them about the fact that somebody is looking at this in the dark
 * and would rather not be:
 *
 *   1. **The card settles as the rounds go by.** A soft scrim eases the card toward the
 *      canvas, one small step per phase, so the screen is already less interesting by the
 *      time the breathing ends.
 *   2. **The pacer follows the engine, not a clock of its own.** It is armed from
 *      `phaseRemainingMs` on the phase key, the same way the breathing circle is, so it
 *      cannot move at a rate the countdown disagrees with.
 *   3. **Lights out is quieter still.** One number, no accent colour asking to be looked
 *      at, no motion that draws the eye.
 *
 * Under Reduce Motion the pacer cross-fades opacity instead of scaling, and the settle lands
 * in a single step instead of easing — the same substitution `lib/motion.ts` documents.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { alpha, space } from "@hermes/tokens";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button, Card, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { SoundToggle } from "@/components/sound-toggle";
import { ProfileAction, WellnessShell } from "@/components/wellness-shell";
import { useSequence, mmss, type Phase } from "@/lib/timer";
import { useWellnessStore } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { useProductUI } from "@/lib/product-ui";
import { useReduceMotion } from "@/lib/motion";
import { WELLNESS_BED, WELLNESS_CUES, makeWellnessAudio, useSoundPrefs } from "@/lib/sound";

const ROUNDS = 4;
const LIGHTS_OUT_MIN = 20;

/**
 * How far the big card settles toward the canvas across the rounds, as an opacity.
 *
 * Not 1: the card is still the thing that says which phase you are in, and a screen that
 * goes fully dark is a screen somebody taps to check whether it froze. By the last round the
 * card is noticeably quieter and still legible, which is the whole target.
 */
const SETTLE_MAX = 0.42;

/**
 * The pacer's diameter. Small on purpose: it sits above a number somebody is reading from a
 * pillow, and a large moving shape in a dark room is the opposite of a wind-down.
 */
const PACER = 56;

/** Which way a movement goes: the inhale expands, the exhale contracts, the hold is still. */
type Pace = "in" | "hold" | "out";

/**
 * The movement a phase label names.
 *
 * Matched on the label rather than on the phase key because the key carries the round number
 * (`in-2`) while the movement is what decides both the sound and the motion; and on the
 * labels `buildPhases()` writes, which are also the strings the engine hands to `onPhase`.
 */
function paceOf(label: string | undefined): Pace {
  if (label === "Breathe in") return "in";
  if (label === "Breathe out") return "out";
  return "hold";
}

/**
 * Where the pacer goes for a movement, as a 0→1 position.
 *
 * `null` means "leave it where it is", which is what a hold wants in both motion settings: a
 * hold that moved would be asking for a breath the timer is not asking for. One position
 * rather than a scale and an opacity, so the two motion settings cannot drift apart.
 */
function paceTarget(pace: Pace): number | null {
  if (pace === "in") return 1;
  if (pace === "out") return 0;
  return null;
}

function buildPhases(): Phase[] {
  const out: Phase[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    out.push({ key: `in-${i}`, label: "Breathe in", seconds: 4 });
    out.push({ key: `hold-${i}`, label: "Hold", seconds: 7 });
    out.push({ key: `out-${i}`, label: "Breathe out", seconds: 8 });
  }
  return out;
}

/** The lights-out countdown, as a single phase so it runs on the same clock. */
const LIGHTS_OUT: Phase[] = [
  { key: "lights-out", label: "Lights out", seconds: LIGHTS_OUT_MIN * 60 },
];

export default function Sleep() {
  const ui = useProductUI("sleep");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("sleep");
  const { settings } = useSettings();
  const phases = useMemo(() => buildPhases(), []);
  const [lightsOut, setLightsOut] = useState(false);
  const reduceMotion = useReduceMotion();

  /**
   * The sound players, one literal `useAudioPlayer` call each.
   *
   * Verbose on purpose: a hook's call count has to be fixed per render, so the set of sounds
   * a screen can make has to be *code*, not data. `lib/sound.ts` explains why at length; the
   * short version is that a mapped `useAudioPlayer` is a rules-of-hooks violation, and the
   * two drafts that hid it behind a helper were both flagged for good reason.
   */
  const cueIn = useAudioPlayer(WELLNESS_CUES.in);
  const cueHold = useAudioPlayer(WELLNESS_CUES.hold);
  const cueOut = useAudioPlayer(WELLNESS_CUES.out);
  const cueSwell = useAudioPlayer(WELLNESS_CUES.swell);
  const cueDone = useAudioPlayer(WELLNESS_CUES.done);
  const bed = useAudioPlayer(WELLNESS_BED);

  const prefs = useSoundPrefs();

  /**
   * The audio behaviour, built once and then kept current.
   *
   * `useMemo` on the *players*, which are stable for the life of the screen, so the bank is
   * created once — which is what lets a timer callback hold `audio.cue` without the callback
   * being torn down and rebuilt. The preferences are pushed in by the effect below rather
   * than being a dependency here, because rebuilding the bank on a toggle would recreate
   * every method and defeat exactly that stability.
   */
  const audio = useMemo(
    () =>
      makeWellnessAudio(
        {
          cues: { in: cueIn, hold: cueHold, out: cueOut, swell: cueSwell, done: cueDone },
          bed,
        },
        prefs,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `prefs` is pushed in via syncPrefs
    [cueIn, cueHold, cueOut, cueSwell, cueDone, bed],
  );

  /* The switch is read at fire time, so flipping it takes effect on the next phase rather
     than at the next session. */
  useEffect(() => {
    audio.syncPrefs(prefs);
  }, [audio, prefs]);

  /** Second gate on the write, on top of the engine's exactly-once completion. */
  const saved = useRef(false);
  const persist = useMemo(
    () => () => {
      if (saved.current) return;
      saved.current = true;
      store.save({
        at: Date.now(),
        screen: "sleep",
        minutes: 2,
        units: ROUNDS,
        label: `${ROUNDS} rounds of 4·7·8`,
      });
    },
    [store],
  );

  const rounds = useSequence(phases, {
    /**
     * The swell lives here, in the rounds' own completion, rather than in `skipToLightsOut`.
     *
     * It has no transient by design — it is the cue for somebody who is already drifting off
     * and should not be able to tell when a sound started — so it belongs at the natural end
     * of the rounds, which is the moment it was built for. "Skip" is a person awake and in a
     * hurry, and firing a falling-asleep cue at them would be the wrong sentence.
     */
    onComplete: () => {
      persist();
      setLightsOut(true);
      audio.cue("swell");
    },
    /**
     * The engine's phase transition is the only place the spoken cue can correctly live.
     *
     * `onPhase` is called only when the index really changed, so a tick, a re-render, a
     * settings change or a resume from pause cannot double a cue — and a catch-up after a
     * background gap that skips four phases speaks once instead of four times. The engine's
     * own phase haptic is deliberately left in place: a person falling asleep with their eyes shut
     * reads the buzz as reliably as anything they can hear, and the two land on the same beat here
     * rather than competing.
     */
    onPhase: (_index, phase) => {
      const pace = paceOf(phase.label);
      // The tone is the whole cue: rising is the in-breath, falling is the out-breath, the same
      // direction the on-screen pacer moves. A spoken layer used to ride on top of it and was
      // removed for sounding robotic on a real phone.
      if (pace === "in") audio.cue("in");
      else if (pace === "out") audio.cue("out");
      else audio.cue("hold");
    },
  });

  /**
   * The lights-out clock starts when the rounds end, not when the screen mounts.
   *
   * Driven by the effect below rather than by a check in the render body. The sequence's own
   * status is the guard: it is "idle" until the countdown is armed and never returns to
   * "idle" on its own, so a re-render cannot restart a countdown that is already running —
   * which is the one thing that would make the remaining time jump back up.
   */
  const lights = useSequence(LIGHTS_OUT, {
    // The countdown reaching zero is the only "this session is over" moment the screen has.
    // Deliberately not wired to the Skip button below: pressing "Skip to lights out" is
    // somebody ending the wait, not the wait ending.
    onComplete: () => audio.cue("done"),
  });
  const started = lights.status !== "idle";

  /**
   * Starts the countdown the moment the rounds end.
   *
   * An effect rather than a check in the render body: calling `lights.start()` during render
   * is a state update on a component that is already rendering, which React rejects and
   * ESLint's `set-state-in-render` rule flags. `started` in the guard is what keeps it from
   * restarting a countdown that is already running.
   */
  useEffect(() => {
    if (lightsOut && !started) lights.start();
  }, [lightsOut, started, lights]);

  /**
   * The bed, tied to the session rather than to the render loop.
   *
   * Both calls are idempotent, so this can run on any state change without restarting the
   * loop: a pause does not interrupt it and a re-render does not touch it. `started` is what
   * carries it past the rounds — lights-out is the half somebody actually falls asleep in,
   * and the bed has to outlive the breathing for that to be true.
   *
   * The dependency is the two callbacks, not the bank. `startBed`/`stopBed` are stable for
   * the life of the screen, while `useMemo` rebuilds the bank whenever a player changes;
   * depending on the bank would stop and restart the bed for no reason. The lint rule cannot
   * see through the member expression, which is the only reason this is disabled rather than
   * satisfied.
   */
  useEffect(() => {
    // `lightsOut` is in this condition as well as `started`: there is one render between the rounds
    // completing and the lights-out clock arming, and without it the bed stops and restarts — an
    // audible hole at exactly the moment the swell plays and somebody is drifting off.
    if (rounds.running || rounds.paused || started || lightsOut) audio.startBed();
    else audio.stopBed();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see the note above
  }, [rounds.running, rounds.paused, started, audio.startBed, audio.stopBed]);

  /* Leaving the screen must not leave a bed playing behind the next one. Unmount only: the
     callbacks are stable, so this is not torn down and re-armed on every render. */
  useEffect(
    () => () => {
      audio.stopBed();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see the note above
    [audio.stopBed],
  );

  /* ── The motion ───────────────────────────────────────────────────────────────────── */

  /**
   * How full the breath is: 0 at the end of the exhale, 1 at the top of the inhale.
   *
   * One shared value with two readings rather than two values that have to be kept in step —
   * motion scales it, Reduce Motion cross-fades it (see the style below). It is a *position*,
   * not an animation: the effect underneath decides where it goes and how long it has to get
   * there.
   *
   * It starts at 0 — the end of an exhale — because the first phase of every round is the
   * inhale: starting it full would make the opening breath of a session the one breath that
   * never visibly happens.
   */
  const breath = useSharedValue(0);

  /**
   * The current phase and how much of it is left, frozen together.
   *
   * The remaining time is captured here rather than read inside the effect, because
   * `phaseRemainingMs` changes on every 100 ms tick: taking it as a dependency would re-arm
   * the easing curve ten times a second and turn a smooth expansion into a stutter. The phase
   * *key* is the stable identity of "this breath" — the same reason the engine keys each
   * phase with its round number.
   *
   * The paused flag is a dependency too, so a resume re-reads the time left. The engine freezes
   * its clock while paused, so the value it hands back on resume is exactly the remainder of
   * the breath — which is what keeps the pacer landing where the countdown says the phase ends
   * rather than a full breath later.
   */
  const arm = useMemo(
    () => ({
      key: rounds.phase?.key ?? "",
      pace: paceOf(rounds.phase?.label),
      leftMs: rounds.phaseRemainingMs,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `leftMs` is read when the phase turns or a pause ends, not on every tick
    [rounds.phase?.key, rounds.paused],
  );

  /**
   * Arm the pacer from the engine.
   *
   * A hold returns early and leaves the value exactly where it is. The 200 ms floor on the
   * duration is for the edges: a resume with 40 ms left in the phase should still visibly land
   * rather than snap, and a snap is what a zero-duration timing call looks like.
   */
  useEffect(() => {
    // Idle or finished: the pacer is not on screen, and moving it would be work nobody sees.
    // Leaving it parked is also what lets the next session open on a full inhale.
    if (!rounds.running && !rounds.paused) return;
    const target = paceTarget(arm.pace);
    if (target === null) return;
    breath.value = reduceMotion
      ? // Reduce Motion still gets the rhythm — a pacer that stopped would hide the phase
        // turn entirely — it just arrives in one step instead of easing through it.
        target
      : withTiming(target, {
          duration: Math.max(200, arm.leftMs),
          easing: Easing.inOut(Easing.sin),
        });
  }, [arm, rounds.running, rounds.paused, reduceMotion, breath]);

  /**
   * How far the card has eased toward the canvas.
   *
   * A step per phase rather than a value derived from `rounds.progress`, so it moves 21 times
   * across the rounds instead of ten times a second. Reduce Motion still gets the settle — it
   * is a dimming rather than a movement, and it is half the point of this screen — but it
   * lands in one step, so nothing on the screen is animating.
   */
  const settle = useSharedValue(0);

  useEffect(() => {
    const target =
      rounds.running || rounds.paused ? SETTLE_MAX * ((rounds.index + 1) / phases.length) : 0;
    settle.value = reduceMotion
      ? target
      : withTiming(target, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [rounds.index, rounds.running, rounds.paused, phases.length, reduceMotion, settle]);

  /**
   * The pacer's two paths, from the one value above.
   *
   * Motion scales a 56 pt disc between 0.82 and 1.24 — restrained, because it sits next to a
   * number somebody is reading. Reduce Motion cross-fades its opacity instead, which is the
   * substitution `lib/motion.ts` documents. The settle is folded in so the pacer dims with the
   * rest of the card instead of being the one thing that stays bright.
   */
  const pacerStyle = useAnimatedStyle(() => ({
    opacity: (reduceMotion ? 0.35 + breath.value * 0.5 : 1) * (1 - settle.value * 0.6),
    transform: [{ scale: reduceMotion ? 1 : 0.82 + breath.value * 0.42 }],
  }));

  /* The scrim that does the settling. Its colour is the canvas, so "settling" reads as the
     card losing its surface and its border rather than as a grey film laid over it. */
  const settleStyle = useAnimatedStyle(() => ({ opacity: settle.value }));

  const leftMs = lights.remainingMs;

  function reset() {
    saved.current = false;
    lights.reset();
    rounds.reset();
    setLightsOut(false);
  }

  function skipToLightsOut() {
    rounds.finish();
    persist();
    setLightsOut(true);
  }

  return (
    <WellnessShell
      product="sleep"
      title="Sleep"
      lead={`${ROUNDS} rounds of 4·7·8, then a ${LIGHTS_OUT_MIN}-minute countdown to lights out.`}
      tabBar={false}
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
      headerAction={
        /* The mute sits in the header rather than only in settings: this screen is used in the dark
           next to somebody who may be asleep, so the moment the sound is wrong is the moment the
           session is running. It is a master mute, so one tap takes the bed as well as
           the cues. */
        <View style={s.headActions}>
          <SoundToggle />
          <ProfileAction />
        </View>
      }
    >
      {!lightsOut ? (
        <Card style={s.big}>
          <Text variant="caption" tone="ink3">
            4 IN · 7 HOLD · 8 OUT
          </Text>
          <Text variant="title1">
            {rounds.running || rounds.paused ? (rounds.phase?.label ?? "") : "Wind down"}
          </Text>
          <Text variant="title2" style={[s.nums, { color: ui.accent }]}>
            {rounds.running || rounds.paused
              ? `${rounds.secondsLeft}s`
              : `${ROUNDS} rounds · about 2 minutes`}
          </Text>
          {rounds.running || rounds.paused ? (
            <>
              {/* The pacer: the same turn the countdown above is on, drawn instead of
                  written, so the phase is readable with the phone at arm's length. */}
              <View style={s.pacerRow} pointerEvents="none">
                <Animated.View
                  style={[
                    s.pacer,
                    { borderColor: alpha(ui.accent, 0.5), backgroundColor: ui.accentTint },
                    pacerStyle,
                  ]}
                />
              </View>
              <View
                style={s.bar}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(rounds.progress * 100) }}
              >
                <View style={[s.fill, { width: `${Math.round(rounds.progress * 100)}%` }]} />
              </View>
            </>
          ) : null}
          <Text variant="meta" tone="ink2">
            Longer out than in. If the holds feel tight, shorten them — the point is the slow
            exhale, not the number.
          </Text>
          {rounds.paused ? (
            <Text variant="meta" tone="ink2">
              Paused — the clock is stopped.
            </Text>
          ) : null}
          {/* The settle, drawn last so it sits over the whole card. Only while the rounds are
              live: an idle card is already the quietest thing on the screen. */}
          {rounds.running || rounds.paused ? (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: ui.bg }, settleStyle]}
            />
          ) : null}
        </Card>
      ) : (
        <Card style={s.big}>
          <Text variant="caption" tone="ink3">
            LIGHTS OUT IN
          </Text>
          {/* Not the product accent: the accent is the brightest thing on this screen and the
              point of this half is that nothing asks to be looked at. The number stays legible
              and stops glowing. */}
          <Text variant="hero" style={[s.nums, s.countdown]}>
            {mmss(leftMs / 1000)}
          </Text>
          <Text variant="meta" tone="ink2">
            Put the phone face down. The countdown keeps running while the screen is off — it
            is measured from the clock, not counted tick by tick. The sound does not: the bed
            stops when the app is suspended, because playing audio with the screen off needs a
            background audio mode this app does not ask for.
          </Text>
          <Button
            title={leftMs > 0 ? "Skip to lights out" : "Reset the countdown"}
            variant="ghost"
            onPress={() => {
              if (leftMs > 0) {
                lights.finish();
              } else {
                // `started` flips back to false when the sequence resets, which is what lets
                // the effect above arm a fresh countdown.
                lights.reset();
              }
            }}
          />
        </Card>
      )}

      {!lightsOut ? (
        rounds.running || rounds.paused ? (
          <>
            <Button
              title={rounds.paused ? "Resume" : "Pause"}
              onPress={rounds.paused ? rounds.resume : rounds.pause}
              haptic="medium"
              style={s.primaryControl}
            />
            <Button
              title="Skip to lights out"
              variant="ghost"
              onPress={skipToLightsOut}
              style={s.skip}
            />
          </>
        ) : (
          <Button
            title="Start the rounds"
            onPress={() => {
              saved.current = false;
              rounds.start();
              /* The first "breathe in" would otherwise be silent: the engine reports a phase only
                 when the index changes, and starting leaves it at zero. */
              audio.cue("in");
            }}
            haptic="medium"
          />
        )
      ) : (
        <Button title="Start again" variant="ghost" onPress={reset} style={s.skip} />
      )}

      {store.last && !rounds.running && !rounds.paused && !lightsOut ? (
        <Text variant="meta" tone="ink3" style={s.note}>
          Last wind-down: {store.last.label}
        </Text>
      ) : null}

      <Card style={s.info}>
        <Text variant="title3">What this is not</Text>
        <Text variant="meta" tone="ink2">
          Not a treatment for insomnia and not a promise about sleep quality. It is a wind-down
          with a timer. Don&apos;t practise breath-holds in water or while driving, and if you
          feel dizzy, stop. Persistent sleep problems are worth a doctor&apos;s time, not an
          app&apos;s.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>

      <InsightPanel screen="sleep" unitsLabel="rounds" weeklyGoal={settings.weeklyGoal} />
    </WellnessShell>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    // The header row holding the mute and the profile action. `space.xs` rather than `space.sm`: two
    // 40 pt controls plus the title is already tight on a small phone.
    headActions: { flexDirection: "row", alignItems: "center", gap: space.xs },
    big: { gap: 6, marginBottom: space.base },
    pacerRow: {
      height: PACER + 24,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.sm,
    },
    pacer: { width: PACER, height: PACER, borderRadius: PACER / 2, borderWidth: 1 },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: space.sm },
    fill: { height: 4, backgroundColor: ui.accent, borderRadius: 2 },
    /** A changing number must not reflow: the digits keep one width as the count moves. */
    nums: { fontVariant: ["tabular-nums"] },
    countdown: { color: ui.muted },
    primaryControl: { minHeight: 52 },
    skip: { marginTop: space.sm },
    note: { marginTop: space.md },
    info: { marginTop: space.base, gap: 6 },
  });
}
