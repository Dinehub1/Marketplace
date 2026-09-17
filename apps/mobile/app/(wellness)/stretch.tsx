/**
 * Stretch — a five-minute guided desk-mobility class.
 *
 * ── Why this is a screen and not a list ───────────────────────────────────────────────
 *
 * The previous version was a card with a paragraph and a list of eight row labels: it told
 * you *what* the movements were and left you to run the timing in your head. That is a
 * reference page, not a class. What a person who sits all day actually needs is to be told
 * one thing — do this now, for this long, on this side — and to be able to keep their eyes
 * on their body instead of on the phone.
 *
 * So there are three states and only three:
 *
 *   **setup**   one large illustration of the first movement, the routine length, START,
 *               and a compact preview of all eight movements with the real total.
 *   **active**  the guided class. Movement n of 8, a large diagram, a giant countdown, a
 *               per-movement progress bar, one short instruction, the next movement named,
 *               and Previous / Pause / Skip.
 *   **done**    the summary, and the one place a session is written.
 *
 * ── The routine is exactly 300 seconds ───────────────────────────────────────────────
 *
 * This used to be a real bug: the list summed to 320 seconds (30+30+40+40+30+45+45+60) and
 * the screen told the user "5 min". `ROUTINE_TOTAL` below is *derived from the data* and the
 * header prints that, so a future edit to one duration cannot make the label lie again.
 * `EXPECTED_TOTAL` is asserted against it at module load — a mismatch is a build-time
 * failure in development rather than a wrong number on a user's screen.
 *
 * ── Sides ────────────────────────────────────────────────────────────────────────────
 *
 * Three movements are done once per side. Rather than leaving the person to remember to
 * swap, a side-specific movement is *expanded* into two phases — one per side, each keeping the
 * movement's own per-side duration — the second labelled LEFT, with the figure mirrored to match.
 * The cue is impossible to miss and it is impossible to do the movement on one side only by
 * accident.
 *
 * ── Sound and motion (this version) ──────────────────────────────────────────────────
 *
 * A mobility class is taken with the phone face down on the desk or your eyes shut, so it now
 * speaks: a short tone on every turn, the side in words when there is one, and a three-note end.
 * Every sound comes from `lib/sound.ts`, which synthesizes the files inside this repo — nothing
 * is downloaded, no permission is asked for — and the person's own switch governs all of it.
 * That switch is in the header rather than only on Profile, because the moment somebody wants
 * this app quiet is the moment a class is running.
 *
 * The motion is three restrained changes rather than a redesign. A new movement *arrives* —
 * fade, a few points of rise, a very small growth — instead of blinking into place. Both bars
 * stop rounding their width to a whole percent, which was the only discrete step left in a
 * value the engine already recomputes every 100 ms. And the diagram's frame warms toward the
 * accent while the clock runs, the one accent touch in the class. Under Reduce Motion the
 * arrival is skipped; the frame still changes, because a colour is not travel.
 *
 * ── Honest scope ─────────────────────────────────────────────────────────────────────
 *
 * General mobility for people who sit, not physiotherapy. The screen says so, in one line,
 * on the setup state — not in four paragraphs.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { alpha, radius, space } from "@hermes/tokens";
import { Button, Card, Text } from "@/components/ui";
import { WellnessShell, ProfileAction } from "@/components/wellness-shell";
import { SoundToggle } from "@/components/sound-toggle";
import { SyncBadge } from "@/components/sync-badge";
import { StretchFigure, sideLabel } from "@/components/stretch-figures";
import {
  MOVES,
  MOVEMENT_COUNT,
  PHASES,
  ROUTINE_TOTAL,
  STEPS,
  type StretchStep,
} from "@/lib/stretch-routine";
import { useSequence, mmss, type Sequence } from "@/lib/timer";
import { useWellnessStore } from "@/lib/session";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { useReduceMotion } from "@/lib/motion";
import { WELLNESS_CUES, makeWellnessAudio, useSoundPrefs } from "@/lib/sound";

/**
 * The movement that closes the class.
 *
 * Read off the end of the routine rather than matched on its id: the table's own comment says
 * the breathing goes last "so the class ends calm rather than braced", so the last movement is
 * the wind-down by design. Deriving it means reordering the routine moves the relax cue with
 * it, instead of leaving the words attached to whatever now happens to be last.
 */
const WIND_DOWN_MOVE = MOVES[MOVES.length - 1].id;


export default function Stretch() {
  const ui = useProductUI("stretch");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const store = useWellnessStore("stretch");
  const [phase, setPhase] = useState<"setup" | "active" | "done">("setup");
  /** The minutes actually completed, captured at the moment the session is filed. */
  const [result, setResult] = useState<{ seconds: number; moves: number } | null>(null);

  /**
   * Guards the write. The engine fires `onComplete` exactly once by contract, but the write
   * is the expensive, user-visible half of that promise — a duplicated row in the Progress
   * chart is a bug a person can see — so it is guarded here as well rather than trusted
   * from a distance.
   */
  const saved = useRef(false);

  /*
   * ── The audio ─────────────────────────────────────────────────────────────────────────
   *
   * One literal `useAudioPlayer` per sound this screen can make, because a hook's call count
   * has to be fixed — which is the entire reason `lib/sound.ts` hands back a plain bank rather
   * than a hook that loads a list. Four cues, and nothing loaded "just in case": an unused player is
   * a file decoded at mount to sit silent.
   */
  const prefs = useSoundPrefs();
  const cueTick = useAudioPlayer(WELLNESS_CUES.tick);
  const cueDone = useAudioPlayer(WELLNESS_CUES.done);
  const cueRelax = useAudioPlayer(WELLNESS_CUES.relax);
  /* The sided turns. `interval` is Walk's two-note figure, and it is exactly the right thing here:
     a movement done once per side is the one kind of turn in this class that needs marking as
     *different*, and the two-note shape does that without a spoken "left" or "right". */
  const cueSide = useAudioPlayer(WELLNESS_CUES.interval);

  /**
   * The bank, built once because the players never change identity.
   *
   * That stability is what lets a callback the engine holds in a ref call `audio.cue` without
   * the engine knowing anything about sound. The preferences are pushed in by the effect below
   * rather than listed here: rebuilding the bank on a toggle would replace every method, and
   * anything holding the old one would keep obeying the old switch.
   */
  const audio = useMemo(
    () =>
      makeWellnessAudio(
        {
          cues: { tick: cueTick, done: cueDone, relax: cueRelax, interval: cueSide },
        },
        prefs,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefs is pushed in via syncPrefs
    [cueTick, cueDone, cueRelax, cueSide],
  );

  /* The switches are read when a sound fires, so flipping one takes effect on the next cue
     rather than at the next class. */
  useEffect(() => {
    audio.syncPrefs(prefs);
  }, [audio, prefs]);

  const file = useCallback(
    (elapsedMs: number) => {
      if (saved.current) return;
      saved.current = true;
      const seconds = Math.max(0, Math.round(elapsedMs / 1000));
      setResult({ seconds, moves: MOVEMENT_COUNT });
      store.save({
        at: Date.now(),
        screen: "stretch",
        // Real elapsed time, floored at one minute so a completed routine never records as
        // "0m" in the Progress totals.
        minutes: Math.max(1, Math.round(seconds / 60)),
        units: MOVEMENT_COUNT,
        label: "5-minute desk mobility",
      });
    },
    [store],
  );

  const seq = useSequence(PHASES, {
    onComplete: () => {
      // A completed class is exactly the routine length by definition — the engine clamps
      // elapsed to the total — so this is not an estimate. Reading `seq.elapsedMs` here
      // would be a temporal dead zone: this callback is written in the same expression that
      // declares `seq`.
      file(ROUTINE_TOTAL * 1000);
      // Three notes up, over the success haptic the engine fires itself. Nothing is awaited:
      // a sound that can fail must never sit in front of a state change.
      audio.cue("done");
      setPhase("done");
    },
    onPhase: (index) => {
      // A distinct tick when the movement changes, so the class is followable with the
      // phone face down on the desk.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const step = STEPS[index];
      if (!step) return;

      // The closing breathing movement is the class's one wind-down, so it gets its own lower,
      // slower cue rather than the bare tick. This is where the removed voice used to say "relax";
      // the cue carries the same "the class is ending, not changing" idea without a word.
      if (step.move.id === WIND_DOWN_MOVE) {
        audio.cue("relax");
        return;
      }

      if (!step.sided) {
        audio.cue("tick");
        return;
      }

      /*
       * The side, without words.
       *
       * A per-side movement is expanded into a right step then a left step, so the side lives on the
       * *step* and never on the movement (`stretch-routine.ts`). The removed voice used to speak
       * "right", "left" and "switch sides" here; the information that survives the removal is the
       * part a sound can carry, which is *that this turn is a sided one*. So the sided turns get the
       * two-note figure and the everything-else turns keep the plain tick, and the figure is what
       * tells a person with their eyes closed that they are about to do the same movement again on
       * the other side.
       *
       * What is genuinely lost: which side is next. That was the voice's real value and it cannot be
       * a tone, because there is nothing in pitch that means "left". It stays where it already was —
       * on the screen, in the side pill, which is what somebody following this class with their eyes
       * open has always read.
       */
      // `interval` replaces the tick's plain turn with the two-note figure rather than playing on top
      // of it: two cues on one beat would be a flam. (The `!step.sided` case already returned above,
      // so everything that reaches this line is a sided turn.)
      audio.cue("interval");
    },
  });

  const current = STEPS[Math.min(seq.index, STEPS.length - 1)];
  const nextStep = STEPS[seq.index + 1] ?? null;

  function begin() {
    saved.current = false;
    setResult(null);
    setPhase("active");
    // The starting gun, and the only place it can be: the engine calls `onPhase` when the index
    // *changes*, and starting leaves it on the first step, so nothing else would ever announce
    // movement one. It is also the moment somebody puts the phone down, which is why the tone
    // matters more here than anywhere else in the class. "Go again" on the summary comes
    // through this same door, so both beginnings sound alike.
    audio.cue("tick");
    seq.start();
  }

  /**
   * Finish early. The engine keeps the elapsed time, so the session filed is the work
   * actually done rather than the length of the routine.
   */
  function finishEarly() {
    seq.finish();
    file(seq.elapsedMs);
    setPhase("done");
  }

  return (
    <WellnessShell
      product="stretch"
      title="Stretch"
      lead="5-minute desk mobility"
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
      headerAction={
        <View style={s.headActions}>
          <SoundToggle noun="Class sound" />
          <ProfileAction />
        </View>
      }
    >
      {phase === "setup" ? (
        <Setup ui={ui} s={s} onStart={begin} lastLabel={store.last?.label ?? null} />
      ) : null}

      {phase === "active" ? (
        <Active
          ui={ui}
          s={s}
          seq={seq}
          current={current}
          nextStep={nextStep}
          onFinish={finishEarly}
        />
      ) : null}

      {phase === "done" ? (
        <Done
          ui={ui}
          s={s}
          result={result}
          onAgain={begin}
          onClose={() => {
            seq.reset();
            setPhase("setup");
          }}
        />
      ) : null}
    </WellnessShell>
  );
}

/* ── Setup ───────────────────────────────────────────────────────────────────────────── */

/**
 * How each diagram reads to a screen reader.
 *
 * A diagram is informative here, not decorative — it *is* the instruction — so VoiceOver has
 * to describe the body position rather than announce a filename. Kept beside the screen that
 * uses it rather than in the figure component so the wording can match the movement's own
 * instruction sentence.
 */
const DIAGRAM_ALT: Record<string, string> = {
  "neck-rolls": "A standing figure tilting the head toward one shoulder, with an arc showing the half-circle.",
  "shoulder-rolls": "A standing figure with both shoulders circled backward.",
  "chest-opener": "A standing figure with hands clasped behind the back and arrows pushing the elbows apart.",
  "seated-twist": "A seated figure turned from the ribs, one hand braced on the opposite knee.",
  "wrist-stretch": "A figure with one arm extended and the wrist drawn back by the other hand.",
  "hip-stretch": "A figure in a lunge, front knee bent and back leg straight, hips pressing forward.",
  "hamstring-reach": "A figure hinged forward from the hips with the head hanging and knees soft.",
  "slow-breathing": "A seated figure at rest, with two rings around the chest showing the breath filling.",
};

function Setup({
  ui,
  s,
  onStart,
  lastLabel,
}: {
  ui: ProductUI;
  s: ReturnType<typeof makeStyles>;
  onStart: () => void;
  lastLabel: string | null;
}) {
  const first = MOVES[0];
  return (
    <>
      <Card style={s.hero}>
        <View style={s.heroArt}>
          <StretchFigure
            id={first.diagram}
            size={216}
            accessibilityLabel={DIAGRAM_ALT[first.diagram] ?? first.name}
          />
        </View>
        <Text variant="title2">{first.name}</Text>
        <Text variant="meta" tone="ink2">
          {first.duration} seconds · {MOVEMENT_COUNT} movements · {mmss(ROUTINE_TOTAL)} total
        </Text>
        <Text variant="meta" tone="ink2" style={s.heroNote}>
          {first.instruction}
        </Text>
      </Card>

      <Button title="Start routine" onPress={onStart} haptic="medium" />

      <Card style={s.preview}>
        <Text variant="caption" tone="ink3">
          THE ROUTINE
        </Text>
        <View style={s.previewList}>
          {MOVES.map((m, i) => (
            <View key={m.id} style={s.previewRow}>
              <Text variant="meta" tone="ink3" style={s.previewIndex}>
                {i + 1}
              </Text>
              <Text variant="callout" style={s.previewName} numberOfLines={1}>
                {m.name}
              </Text>
              <Text variant="meta" tone="ink2">
                {m.side === "left-right" ? `${m.duration}s each side` : `${m.duration}s`}
              </Text>
            </View>
          ))}
        </View>
        <View style={s.previewTotal}>
          <Text variant="caption" tone="ink3">
            TOTAL
          </Text>
          <Text variant="callout" style={{ color: ui.accent }}>
            {mmss(ROUTINE_TOTAL)}
          </Text>
        </View>
      </Card>

      {lastLabel ? (
        <Text variant="meta" tone="ink3" style={s.footNote}>
          Last completed: {lastLabel}
        </Text>
      ) : null}

      <Text variant="meta" tone="ink3" style={s.footNote}>
        General mobility for people who sit — not physiotherapy. If a movement hurts, stop.
      </Text>
    </>
  );
}

/* ── Active ──────────────────────────────────────────────────────────────────────────── */

/**
 * How a new movement arrives: a fade, ten points of rise, and about 1.5% of growth.
 *
 * The diagram used to fade in where it stood, which reads as a blink — the eye is told that
 * something changed but not that the class moved on, and on a screen whose whole point is that
 * you are not looking at it closely, "which way did it move" is the thing the motion should
 * say. A short rise is the smallest movement that reads as an arrival rather than a screen
 * transition, and the growth is small enough that the drawing never looks like it is zooming.
 *
 * ── Why this is a shared value and not a Reanimated `entering` animation ─────────────
 *
 * It was a `Keyframe` passed to `entering`, which is the documented API for exactly this and the
 * cleaner-looking code. It was also **broken on React Native Web**: an entering animation positions
 * the view absolutely for the duration, and on web that leaves it out of flow permanently. The stage
 * is 379 pt of content in the middle of the class — once it was absolute, the NEXT card, the Pause
 * button, the Skip row and the instruction all flowed up underneath it and the screen became an
 * unreadable pile. A person on the web build saw a screen that looked like a crash.
 *
 * A shared value armed from the phase cannot do that, because it only ever animates `opacity`,
 * `translateY` and `scale` — properties that have no say in whether the view is in flow. The
 * arrival is the same three properties the keyframe used, so nothing about the motion changed; what
 * changed is that the layout can no longer be a casualty of it.
 */
const ARRIVE_MS = 240;

function Active({
  ui,
  s,
  seq,
  current,
  nextStep,
  onFinish,
}: {
  ui: ProductUI;
  s: ReturnType<typeof makeStyles>;
  seq: Sequence;
  current: StretchStep;
  nextStep: StretchStep | null;
  onFinish: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const side = sideLabel(current.side);
  const paused = seq.paused;
  /**
   * Which *movement* this step belongs to, 1-based.
   *
   * The counter reads "MOVE 3 OF 8", not "STEP 5 OF 11". The two-sided movements expand into
   * two steps internally, and "step 5 of 11" would be counting a machine's units rather than
   * the person's — they are on movement three, and the side pill already tells them which half
   * of it they are in.
   */
  const moveNumber = MOVES.findIndex((m) => m.id === current.move.id) + 1;

  /**
   * The one accent touch: the diagram's frame.
   *
   * `ui.hairline` while the clock is not running, the product accent while it is, so the
   * question "is this class actually going?" is answerable from across the room without
   * reading a counter. It is a colour and not a pulse on purpose — this is a calm mobility
   * class, and anything that repeats is the first thing that starts to feel like nagging.
   *
   * The shared value lives here rather than inside the arriving view, so the frame settles
   * once when the class starts and then stays put: if it travelled with the keyframe it would
   * re-run on every movement and turn a state into a flash.
   */
  /*
   * The arrival: re-armed on every phase change by the effect below, and torn down by the `key` on
   * the stage view. One shared value, three properties, no layout.
   */
  const arrival = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) {
      arrival.value = 1;
      return;
    }
    arrival.value = 0;
    arrival.value = withTiming(1, { duration: ARRIVE_MS, easing: Easing.out(Easing.cubic) });
  }, [current.phase.key, reduceMotion, arrival]);

  const arrive = useAnimatedStyle(() => ({
    opacity: arrival.value,
    transform: [{ translateY: (1 - arrival.value) * 10 }, { scale: 0.985 + arrival.value * 0.015 }],
  }));

  const live = useSharedValue(0);
  useEffect(() => {
    live.value = withTiming(seq.running ? 1 : 0, {
      // Reduce Motion is about travel, and a border changing state is not travel — so it still
      // changes, it simply does not take 420ms to get there.
      duration: reduceMotion ? 0 : 420,
      easing: Easing.out(Easing.quad),
    });
  }, [seq.running, reduceMotion, live]);

  /*
   * Deliberately **not** `interpolateColor`.
   *
   * The first version animated the frame with `interpolateColor(live.value, [0,1], [ui.hairline,
   * alpha(ui.accent, 0.55)])`, which is the obvious way to write it and the way that shipped. It is
   * also the only use of `interpolateColor` anywhere in this repository, and it runs *on the UI
   * thread*: it parses its output range inside a worklet, and `alpha()` hands it `rgba(…)` strings
   * rather than the `#rrggbb` the rest of the app uses. That is a lot of machinery in the one place
   * that cannot be debugged from a stack trace, for a result that is two colours at 420 ms.
   *
   * So the *colour* is constant and an **opacity** is animated instead: the frame keeps the hairline
   * border it has always had, and an accent-coloured overlay cross-fades on top of it. One number
   * crossing the bridge instead of four, no colour parsing in a worklet, and the same thing on
   * screen — including under Reduce Motion, where the duration is simply 0.
   */
  const frame = useAnimatedStyle(() => ({ opacity: live.value }));

  return (
    <>
      <View style={s.counterRow}>
        <Text variant="caption" tone="ink3">
          MOVE {moveNumber} OF {MOVEMENT_COUNT}
        </Text>
        <Text variant="caption" tone="ink3">
          {mmss(Math.max(0, seq.remainingSeconds))} LEFT
        </Text>
      </View>

      {/* The whole class is one bar; the movement is another. Two bars rather than one
          because "how long left in this movement" and "how long left in the class" are
          different questions and the person asks both.

          Neither fill rounds its width any more, and that rounding was the only discrete step
          in either of them. Both values are recomputed from timestamps on the engine's 100 ms
          tick — a third of a percent of a 30-second movement, a thirtieth of a percent of the
          class — and rounding that to a whole percent threw the movement away and left a
          standstill followed by a jump: every third of a second on the movement bar, every
          three seconds on the class bar. The accessibility value stays a whole percent,
          because a whole percent is what an announcement wants. */}
      <View style={s.classBar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(seq.progress * 100) }}>
        <View style={[s.classFill, { width: `${seq.progress * 100}%`, backgroundColor: ui.accent }]} />
      </View>

      {/* Keyed on the phase rather than the movement, so a side turning over is also a new
          instruction worth arriving. The arrival is `arrive` — see the note on `ARRIVE_MS`. */}
      <Animated.View key={current.phase.key} style={[s.stage, arrive]}>
        {side ? (
          <View style={[s.sidePill, { backgroundColor: ui.accentTint, borderColor: ui.accent }]}>
            <Text variant="caption" style={{ color: ui.accent, letterSpacing: 1.4 }}>
              {side}
            </Text>
          </View>
        ) : null}

        <Text variant="title1" style={s.moveName}>
          {current.move.name}
        </Text>

        <View style={[s.figureFrame, { borderColor: ui.hairline, backgroundColor: alpha(ui.accent, 0.05) }]}>
          {/* The accent arrives as a translucent wash rather than as a border colour change: see
              the note on `frame` above for why this is an opacity and not an interpolated colour. */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: alpha(ui.accent, 0.06) }, frame]}
          />
          <StretchFigure
            id={current.move.diagram}
            side={current.side}
            size={244}
            accessibilityLabel={DIAGRAM_ALT[current.move.diagram] ?? current.move.name}
          />
        </View>

        <Text variant="hero" style={[s.countdown, { color: paused ? ui.muted : ui.ink }]}>
          {mmss(seq.secondsLeft)}
        </Text>

        <View style={s.moveBar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(seq.phaseProgress * 100) }}>
          <View style={[s.moveFill, { width: `${seq.phaseProgress * 100}%`, backgroundColor: ui.accent }]} />
        </View>

        <Text variant="body" tone="ink2" style={s.instruction}>
          {current.move.instruction}
        </Text>
      </Animated.View>

      <Card style={s.nextCard}>
        <Text variant="caption" tone="ink3">
          {nextStep ? "NEXT" : "LAST MOVEMENT"}
        </Text>
        <Text variant="callout">
          {nextStep ? `${nextStep.move.name}${nextStep.sided ? ` · ${nextStep.side} side` : ""}` : "That's the class"}
        </Text>
      </Card>

      {/* One large primary control, then three quiet ones. The primary is the thing a
          person reaches for without looking; it must not move between states, so pause and
          resume share a position and swap only their label. */}
      <Button
        title={paused ? "Resume" : "Pause"}
        onPress={paused ? seq.resume : seq.pause}
        haptic="medium"
        style={s.primaryControl}
      />

      <View style={s.secondaryRow}>
        <Button
          title="Previous"
          variant="ghost"
          onPress={seq.previous}
          disabled={seq.index === 0}
          style={s.secondaryControl}
        />
        <Button
          title="Skip"
          variant="ghost"
          onPress={seq.next}
          style={s.secondaryControl}
        />
        <Button
          title="Finish"
          variant="ghost"
          onPress={onFinish}
          style={s.secondaryControl}
        />
      </View>

      <Text variant="meta" tone="ink3" style={s.cue}>
        {current.move.cue}
      </Text>
    </>
  );
}

/* ── Done ────────────────────────────────────────────────────────────────────────────── */

function Done({
  ui,
  s,
  result,
  onAgain,
  onClose,
}: {
  ui: ProductUI;
  s: ReturnType<typeof makeStyles>;
  result: { seconds: number; moves: number } | null;
  onAgain: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const seconds = result?.seconds ?? ROUTINE_TOTAL;
  return (
    /* `FadeIn` rather than the Keyframe the class uses: a fade-only entering animation does not
       move the view, so it cannot take it out of flow the way the stage's keyframe did. */
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)}>
      <Card style={s.doneCard}>
        <View style={[s.doneMark, { backgroundColor: ui.accentTint, borderColor: ui.accent }]}>
          <Text variant="title1" style={{ color: ui.accent }}>
            ✓
          </Text>
        </View>
        <Text variant="title1">Great work</Text>
        <Text variant="body" tone="ink2">
          {mmss(seconds)} completed · {result?.moves ?? MOVEMENT_COUNT} movements
        </Text>
        <Text variant="meta" tone="ink3" style={s.doneNote}>
          Saved on this device. It is in your Progress chart already, and it will sync next
          time the phone has a signal.
        </Text>
      </Card>

      <Button title="Done" onPress={onClose} haptic="success" />
      <Button title="Go again" variant="ghost" onPress={onAgain} style={s.again} />
    </Animated.View>
  );
}

function makeStyles(ui: ProductUI) {
  return StyleSheet.create({
    /* The sound switch and the profile action sit as one unit, so the header's top-right
       corner keeps a single alignment however wide either control is. */
    headActions: { flexDirection: "row", alignItems: "center", gap: space.xs },
    /* 40 is the floor this control is allowed to be; `hitSlop` on the Pressable carries the
       touchable area past the 44 the platform asks for without drawing a larger circle. */
    toggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: { gap: 4, marginBottom: space.base, alignItems: "center", paddingVertical: space.lg },
    heroArt: {
      width: "100%",
      alignItems: "center",
      marginBottom: space.sm,
    },
    heroNote: { textAlign: "center", marginTop: 2 },
    preview: { marginTop: space.base, gap: 4 },
    previewList: { marginTop: space.sm },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.sm,
      paddingVertical: 9,
      minHeight: 44,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ui.hairline,
    },
    previewIndex: { width: 16, textAlign: "center" },
    previewName: { flex: 1 },
    previewTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: space.md,
      minHeight: 44,
    },
    footNote: { marginTop: space.base, lineHeight: 18 },

    counterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm },
    classBar: { height: 3, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden" },
    classFill: { height: 3, borderRadius: 2 },
    stage: { alignItems: "center", marginTop: space.base, gap: space.xs },
    /* The frame is drawn around the figure rather than around the whole stage so the glow
       belongs to the diagram — the instruction and the countdown are text, and a border around
       them would read as a selected card. The padding is what makes the edge sit off the
       drawing instead of cutting it. */
    figureFrame: {
      borderRadius: radius.xl,
      borderWidth: 1,
      /* Both are load-bearing, and the first version of this shipped with neither. The accent wash
         is an absolutely positioned child: `overflow: hidden` clips it to the frame's box, and
         `position: relative` gives it a containing block to be clipped *against*. On React Native
         Web a View with no positioning resolves an `absoluteFill` child against the nearest
         positioned ancestor up the tree — which here was the screen — so the wash painted over the
         NEXT card and the Pause button instead of sitting behind the figure. */
      position: "relative",
      overflow: "hidden",
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      alignItems: "center",
      justifyContent: "center",
    },
    sidePill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      marginBottom: 2,
    },
    moveName: { textAlign: "center" },
    countdown: { fontVariant: ["tabular-nums"], marginTop: space.xs },
    moveBar: {
      width: "100%",
      height: 6,
      borderRadius: 3,
      backgroundColor: ui.hairline,
      overflow: "hidden",
      marginTop: space.sm,
    },
    moveFill: { height: 6, borderRadius: 3 },
    instruction: { textAlign: "center", marginTop: space.sm, paddingHorizontal: space.sm },
    nextCard: { marginTop: space.base, gap: 2 },
    primaryControl: { marginTop: space.base, minHeight: 54 },
    secondaryRow: { flexDirection: "row", gap: space.sm, marginTop: space.sm },
    secondaryControl: { flex: 1, minHeight: 44 },
    cue: { textAlign: "center", marginTop: space.md, lineHeight: 18 },

    doneCard: { alignItems: "center", gap: 6, paddingVertical: space.xl, marginBottom: space.base },
    doneMark: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: space.sm,
    },
    doneNote: { textAlign: "center", marginTop: space.sm, lineHeight: 18 },
    again: { marginTop: space.sm, marginBottom: space.lg },
  });
}
