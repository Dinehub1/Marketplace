/**
 * Tap Sprint — a thirty-second reflex game and the first screen of its own build
 * target (see apps/mobile/targets.mjs: id "tap-sprint", accent #db2777, rewarded
 * ad = extra lives).
 *
 * One round, one job: a dot lands somewhere in the field, tap it before the dot
 * times out. Three lives, and both a tap that misses the dot and a dot nobody
 * reaches cost one. When the lives run out with time still on the clock, the
 * round offers a rewarded video for three more — the only place an ad ever
 * appears, and never required: the round ends cleanly if you decline.
 *
 * **This is a game about a finger, so the finger has to feel it.** Every state
 * change answers twice, once in the eye and once in the hand, and the answer is
 * scaled to what happened:
 *
 *   * the dot *lands* (spawn pop + a lift haptic as it goes up),
 *   * a fast hit is a harder buzz than a slow one — the haptic is derived from the
 *     same reaction time the score is, so the hand hears the score before the eye
 *     reads it,
 *   * a miss and a timeout shake the field and buzz an error, and a dead-on miss
 *     also shows an ✕ where the finger landed,
 *   * the last five seconds tick once a second, haptically and in the eye, so the
 *     clock is a sound and not just a number,
 *   * a finished round is a success notification — and only ever a real success,
 *     because "new best" is decided by the stored record, not by this render.
 *
 * Reduce Motion is honoured: the animations collapse to a fade and the haptics
 * stay, because a vibration is not movement and the hand still needs the answer.
 *
 * The accent is the game's own colour from the store-listing target, not the
 * tenant brand ramp: a game screen has to look like the game someone installed,
 * not like the directory behind it. Everything else (type scale, spacing,
 * press feedback, dark mode, elevation) comes from the shared design system.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type DimensionValue,
  type GestureResponderEvent,
  type PressableProps,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { alpha, radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { useReduceMotion } from "@/lib/motion";
import { Badge, Card, Press, Text } from "@/components/ui";
import { AdSlot } from "@/components/ad-slot";
import { Icon } from "@/components/icons";
import {
  EMPTY_RECORD,
  loadGameScores,
  recordRound,
  sinceLabel,
  type GameRecord,
} from "@/lib/game-scores";

/** targets.mjs colour for this build target, plus a lighter step that survives
 *  the near-black canvas (the deep pink goes muddy on it). */
const ACCENT = { light: "#db2777", dark: "#f472b6" };

/** Key this game's round records live under in the device score store. */
const GAME = "tap-sprint";

const ROUND_MS = 30_000;
const START_LIVES = 3;
const EXTRA_LIVES = 3;
const TICK_MS = 100;

/** The dot shrinks and its deadline shortens as the hits pile up, so the round
 *  gets harder on its own without a level system. */
const BASE_RADIUS = 58;
const MIN_RADIUS = 26;
const RADIUS_PER_HIT = 2;
const BASE_ALLOW_MS = 1500;
const MIN_ALLOW_MS = 650;
const ALLOW_PER_HIT_MS = 45;

/** A fingertip is ~9mm wide and the dot can shrink to 52pt: without slop, a
 *  visually-on-target tap reads as a miss and the game feels broken. */
const HIT_SLOP = 16;

/** The last seconds of the round tick. Five is the point where "plenty of time"
 *  turns into "put your thumb on the glass". */
const FINAL_SECONDS = 5;

/* ── Haptics ───────────────────────────────────────────────────────────────
   Every call is fire-and-forget. expo-haptics resolves immediately on iOS and
   Android; on the web it maps to `navigator.vibrate` and is a silent no-op on a
   desktop browser with no vibration motor. An unhandled rejection here would take
   a round down for a missing motor, so each one is caught and dropped.

   Android gets `performAndroidHapticsAsync` where it exists, because expo's own
   docs are explicit that the `Vibrator`-backed `impactAsync` is the wrong tool
   there (it needs the VIBRATE permission and feels like a buzz, not a tap); the
   named constants map to the platform's own semantic effects instead. */

type AndroidHapticsName = Parameters<typeof Haptics.performAndroidHapticsAsync>[0];

function buzz(
  ios: Haptics.ImpactFeedbackStyle,
  android: AndroidHapticsName | null = null,
): void {
  if (Platform.OS === "android" && android) {
    Haptics.performAndroidHapticsAsync(android).catch(() => {});
    return;
  }
  Haptics.impactAsync(ios).catch(() => {});
}

function notify(type: Haptics.NotificationFeedbackType): void {
  if (Platform.OS === "android") {
    const android =
      type === Haptics.NotificationFeedbackType.Error
        ? Haptics.AndroidHaptics.Reject
        : type === Haptics.NotificationFeedbackType.Success
          ? Haptics.AndroidHaptics.Confirm
          : Haptics.AndroidHaptics.Gesture_End;
    Haptics.performAndroidHapticsAsync(android).catch(() => {});
    return;
  }
  Haptics.notificationAsync(type).catch(() => {});
}

/**
 * The hit, felt in proportion to how good it was. This is deliberately the same
 * quantity the score is made of (100 − reaction in ms): the buzz carries the
 * grade, so a great tap is recognisable with your eyes shut.
 *
 * The bands are picked against the score curve and not picked evenly: 100 − ms
 * floors at 10 points, so 90 ms and 180 ms are both "fast" taps but only one of
 * them is a genuine reflex. `Heavy` is therefore reserved for a tap under 150 ms
 * — roughly the point where the reaction was anticipation rather than reading the
 * dot. If every hit were Heavy the field would turn into one continuous
 * vibration and the grade would stop meaning anything.
 */
function hitFeel(reactionMs: number): void {
  if (reactionMs <= 150) buzz(Haptics.ImpactFeedbackStyle.Heavy, Haptics.AndroidHaptics.Confirm);
  else if (reactionMs <= 240) buzz(Haptics.ImpactFeedbackStyle.Medium, Haptics.AndroidHaptics.Confirm);
  else if (reactionMs <= 380) buzz(Haptics.ImpactFeedbackStyle.Light, Haptics.AndroidHaptics.Clock_Tick);
  else buzz(Haptics.ImpactFeedbackStyle.Soft, Haptics.AndroidHaptics.Clock_Tick);
}

/** A new dot landing, felt as a lift: the round's beat, one per spawn. */
function spawnFeel(): void {
  buzz(Haptics.ImpactFeedbackStyle.Soft, Haptics.AndroidHaptics.Gesture_Start);
}

/** A wrong tap or a dot nobody reached: unmistakably not a hit. */
function missFeel(): void {
  notify(Haptics.NotificationFeedbackType.Error);
}

/** One second of the final countdown. Deliberately the lightest tap in the game:
 *  it repeats five times and must not compete with a hit. */
function tickFeel(): void {
  if (Platform.OS === "android") {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick).catch(() => {});
    return;
  }
  Haptics.selectionAsync().catch(() => {});
}

/** react-native-web waits `DEFAULT_PRESS_DELAY_MS` (50 ms) before it *activates* a
 *  press, and a press released inside that window is only reported at all when the
 *  Pressable also has an `onPress` handler — RNW's PressResponder only calls
 *  `_activate` on RESPONDER_RELEASE `if (onPress != null)`. This field listens on
 *  `onPressIn` alone, so it heard nothing from any real tap: measured on the web
 *  build, a click and a touchscreen tap on the dot did nothing (0 hits, 0 misses,
 *  the dot never even moved) while a 300 ms press-and-hold scored. Zeroing the
 *  delay activates the press at pointerdown, which is also the moment the reaction
 *  should be measured from. It is an RNW-only prop (React Native's Pressable has no
 *  such prop, hence the widened type) and it is applied on web only, so the native
 *  path keeps the platform's own behaviour. */
type PressPropsWithDelay = PressableProps & { delayPressIn?: number };
const FIELD_PRESS_PROPS =
  Platform.OS === "web" ? ({ delayPressIn: 0 } as PressPropsWithDelay) : undefined;

/** 100 points minus one per millisecond, floor 10. Stated on the start screen
 *  so the score is a rule the player can play against, not a black box. */
const MAX_POINTS = 100;
const MIN_POINTS = 10;

/* ── The picture's timings ─────────────────────────────────────────────────
   Short on purpose. These fire on the fastest interaction in the app, so a long
   animation would still be playing when the next dot is already on the field and
   the screen would read as lag rather than as feedback. */

/** How long the ✕ and the hit burst stay mounted. Must cover RING_MS. */
const MARKER_MS = 340;
/** The dot's own pop: over almost before it registers, which is the point. */
const POP_MS = 180;
/** The ring where the finger landed, expanding and fading. */
const RING_MS = 320;
/** The field's shake on a miss — two swings, then still. */
const SHAKE_MS = 46;
/** How much of the field the shake moves. Small: it is a flinch, not an earthquake. */
const SHAKE_X = 7;

type Phase = "ready" | "playing" | "outOfLives" | "over";

type Target = { cx: number; cy: number; r: number; shownAt: number };

/** A touch that has already been resolved, drawn for a moment where the finger
 *  landed: the burst for a hit, the ✕ for a miss. Kept in field coordinates so it
 *  needs no layout maths and shakes with the field. */
type TouchMark = {
  kind: "hit" | "miss";
  x: number;
  y: number;
  r: number;
  /** Epoch ms, and the React key: a new touch is always a new marker. */
  at: number;
};

type Summary = {
  score: number;
  hits: number;
  misses: number;
  bestMs: number;
  avgMs: number;
  isNewBest: boolean;
};

export default function TapSprint() {
  const { c, scheme, elevation } = useTheme();
  const accent = scheme === "dark" ? ACCENT.dark : ACCENT.light;
  const accentTint = alpha(accent, scheme === "dark" ? 0.16 : 0.09);
  const accentEdge = alpha(accent, scheme === "dark" ? 0.42 : 0.3);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const win = useWindowDimensions();

  // The field is sized from the window rather than from onLayout: the dot's
  // coordinates have to be known the moment the round starts, and a measured
  // field is one frame late for that.
  const fieldW = Math.min(win.width - space.base * 2, 520);
  const fieldH = Math.max(240, Math.min(Math.round(win.height * 0.46), 420));

  const [phase, setPhase] = useState<Phase>("ready");
  const [msLeft, setMsLeft] = useState(ROUND_MS);
  const [target, setTarget] = useState<Target | null>(null);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState<{ ms: number; points: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [continueUsed, setContinueUsed] = useState(false);
  /** The record as loaded, or updated by the round that just ended. */
  const [record, setRecord] = useState<GameRecord>(EMPTY_RECORD);
  /** False until the device store has answered, so the screen never claims
   *  "no rounds recorded" while it is still reading them. */
  const [recordRead, setRecordRead] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  /** Whole seconds left, for the haptic tick. Only changes once a second, so the
   *  100 ms clock keeps owning the re-renders and this adds five of its own. */
  const [secLeft, setSecLeft] = useState(Math.ceil(ROUND_MS / 1000));
  /** Counts dot spawns. The dot's landing animation is keyed on it, which is the
   *  only unambiguous "a new dot appeared, even at the same spot" signal. */
  const [spawnAt, setSpawnAt] = useState(0);
  /** Where the last touch landed and what came of it — the burst or the ✕. Null
   *  when nothing has been touched yet, or once the marker's own timer clears it. */
  const [marker, setMarker] = useState<TouchMark | null>(null);
  const [overFeel, setOverFeel] = useState<{ good: boolean; at: number } | null>(null);

  // The round clock, the lives and the dot's deadline all live in refs as well
  // as state: the timeout callbacks and the 100ms tick read them, and a state
  // read inside a timer closure is a stale read.
  const msRef = useRef(ROUND_MS);
  const livesRef = useRef(START_LIVES);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const scoreRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The whole-second value the tick haptic last fired for. A ref, not the state
   *  above: the comparison has to see the real previous second inside the
   *  interval's closure, not the value this render happened to capture. */
  const lastSecRef = useRef(Math.ceil(ROUND_MS / 1000));
  const reduceMotion = useReduceMotion();

  /** Still 1 while the round is calm; swings on a miss and on a timeout. Shared so
   *  the field and every marker drawn inside it shake as one piece. */
  const shake = useSharedValue(0);
  const fieldShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  function shakeField() {
    if (reduceMotion) return;
    shake.value = 0;
    shake.value = withSequence(
      withTiming(-SHAKE_X, { duration: SHAKE_MS, easing: Easing.out(Easing.quad) }),
      withTiming(SHAKE_X, { duration: SHAKE_MS, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: SHAKE_MS + 20, easing: Easing.out(Easing.quad) }),
    );
  }

  /** Two passes and the ✕ / burst is gone. Keyed on `at` so a second touch inside
   *  the same second still gets its own marker. */
  function showMarker(next: TouchMark) {
    setMarker(next);
    setTimeout(() => {
      setMarker((prev) => (prev && prev.at === next.at ? null : prev));
    }, MARKER_MS);
  }

  /** Cancels the current dot's deadline. Stable, so the unmount effect below can
   *  depend on it without re-running. */
  const killMissTimer = useCallback(() => {
    if (missTimer.current) {
      clearTimeout(missTimer.current);
      missTimer.current = null;
    }
  }, []);

  const phaseRef = useRef<Phase>("ready");
  const boundsRef = useRef({ w: fieldW, h: fieldH });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // The dot's deadline is cancelled **on unmount only**. It used to be cleared by
  // a cleanup keyed on `phase`, which was wrong twice over: a timeout that arrives
  // after the round ended is already inert (registerMiss returns unless
  // phaseRef.current is "playing"), and startRound() calls spawn() in the same
  // event as setPhase("playing") — so the cleanup for the previous phase ran
  // *after* the timer existed and deleted it, leaving the first dot of every round
  // with no deadline at all (measured: 3.2 s of no input cost no life).
  useEffect(() => killMissTimer, [killMissTimer]);

  useEffect(() => {
    if (phase !== "playing") return;
    const deadline = Date.now() + msRef.current;
    const id = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      msRef.current = left;
      setMsLeft(left);
      // The countdown is felt as well as read, but only for the last five
      // seconds: a tick every second from thirty would be a metronome, and a
      // metronome fights the dot for attention. `left === 0` also lands in the
      // final window, which is why the timeout itself re-uses the same felt
      // language below rather than inventing a sixth buzz.
      const sec = Math.ceil(left / 1000);
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec;
        setSecLeft(sec);
        if (sec > 0 && sec <= FINAL_SECONDS) tickFeel();
      }
      if (left === 0) {
        killMissTimer();
        setTarget(null);
        setMarker(null);
        setPhase("over");
      }
    }, TICK_MS);
    // Re-entering "playing" (after the rewarded ad) re-anchors the deadline to
    // whatever was left, which is what pausing the clock means here.
    return () => clearInterval(id);
  }, [phase]);

  // Rotation or a split-view resize moves the field out from under the dot.
  // Guarded on a real size change so it never re-places a dot mid-round.
  useEffect(() => {
    if (boundsRef.current.w === fieldW && boundsRef.current.h === fieldH) return;
    boundsRef.current = { w: fieldW, h: fieldH };
    if (phaseRef.current === "playing") spawn();
    // spawn is deliberately not a dependency: it is re-created every render and
    // reads the round from refs, so listing it would re-place the dot on every
    // render rather than only on a real size change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldW, fieldH]);

  // The device record is read once, on mount. It is what "Best score" means on
  // this screen now: a number that survives closing the app, not one that
  // restarts with it.
  useEffect(() => {
    let live = true;
    loadGameScores()
      .then((scores) => {
        if (live) setRecord(scores[GAME] ?? EMPTY_RECORD);
      })
      .finally(() => {
        if (live) setRecordRead(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "over") return;
    const rs = reactionsRef.current;
    const hits = hitsRef.current;
    const bestMs = rs.length ? rs.reduce((a, b) => (b < a ? b : a)) : 0;
    const avgMs = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
    setSummary({
      score: scoreRef.current,
      hits,
      misses: missesRef.current,
      bestMs,
      avgMs,
      // Not decided here: the badge is set from the stored record below, which
      // is the only thing that knows whether this round really beat the best.
      isNewBest: false,
    });
    // The round is over; say so once, in the hand. This is the neutral "that is
    // that", and it is deliberately not a success notification: whether the round
    // was actually a record is not known yet — the stored record answers that a
    // moment later, and it is the only thing allowed to celebrate.
    buzz(Haptics.ImpactFeedbackStyle.Light);
    const line = hits
      ? `${hits} ${hits === 1 ? "dot" : "dots"} hit · avg ${avgMs} ms · fastest ${bestMs} ms`
      : "no dots hit";
    recordRound(GAME, scoreRef.current, line).then(({ record: next, isNewBest }) => {
      setRecord(next);
      setSummary((prev) => (prev ? { ...prev, isNewBest } : prev));
      // The beat that marks a real record, and only a real one: `isNewBest` comes
      // from the stored record, so it cannot fire for a round that merely looked
      // good on this screen. It is deliberately a second, distinct notification
      // on top of the round-over one, because it means something different.
      if (isNewBest) {
        setOverFeel({ good: true, at: Date.now() });
        notify(Haptics.NotificationFeedbackType.Success);
      }
    });
  }, [phase]);

  function spawn() {
    const r = Math.max(MIN_RADIUS, BASE_RADIUS - hitsRef.current * RADIUS_PER_HIT);
    const allowed = Math.max(MIN_ALLOW_MS, BASE_ALLOW_MS - hitsRef.current * ALLOW_PER_HIT_MS);
    const pad = r + space.xs;
    const cx = pad + Math.random() * Math.max(1, fieldW - pad * 2);
    const cy = pad + Math.random() * Math.max(1, fieldH - pad * 2);
    setTarget({ cx, cy, r, shownAt: Date.now() });
    // The landing, in the hand and in the eye: the pop is keyed on this counter,
    // and the buzz marks the beat the round runs on. A dot nobody notices is a
    // life lost to the screen rather than to the player, which is the one thing
    // this game must never do.
    setSpawnAt((n) => n + 1);
    spawnFeel();
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => {
      missTimer.current = null;
      // The deadline ran out. Same felt language as a wrong tap, and the same
      // shake, because to the player they are the same failure. Unless the round
      // ended in the same breath — then the round-over buzz is the one to hear.
      if (phaseRef.current === "playing" && msRef.current > 0) {
        shakeField();
        missFeel();
      }
      registerMiss("The dot timed out — too slow.");
    }, allowed);
  }

  function registerHit(t: Target, x: number, y: number) {
    killMissTimer();
    const reaction = Date.now() - t.shownAt;
    const points = Math.max(MIN_POINTS, MAX_POINTS - reaction);
    reactionsRef.current.push(reaction);
    hitsRef.current += 1;
    scoreRef.current += points;
    setScore(scoreRef.current);
    setLast({ ms: reaction, points });
    setNotice("");
    setTarget(null);
    // The finger's answer, in the order a tap arrives: the burst where it landed,
    // then a buzz graded by how good the tap was.
    showMarker({ kind: "hit", x, y, r: t.r, at: Date.now() });
    hitFeel(reaction);
    if (msRef.current > 0) spawn();
  }

  function registerMiss(reason: string, x?: number, y?: number) {
    killMissTimer();
    if (phaseRef.current !== "playing") return;
    const left = livesRef.current - 1;
    livesRef.current = left;
    missesRef.current += 1;
    setLives(left);
    setLast(null);
    setNotice(reason);
    setTarget(null);
    // Only a tap that went to the wrong place can be drawn at the place it went:
    // a timeout has no finger behind it. The shake and the buzz happen either way
    // — but a timeout already did both at the timer, before calling in here, so
    // this pass only covers the misfired tap.
    if (x !== undefined && y !== undefined) {
      showMarker({ kind: "miss", x, y, r: 18, at: Date.now() });
      shakeField();
      missFeel();
    }
    if (msRef.current <= 0) {
      // The clock and the last life can run out together; the ad panel below is
      // not the field, so nothing that happened on the field follows it there.
      setMarker(null);
      setPhase("over");
      return;
    }
    if (left <= 0) {
      if (continueUsed) setPhase("over");
      else setPhase("outOfLives");
      setMarker(null);
      return;
    }
    spawn();
  }

  function onFieldPress(e: GestureResponderEvent) {
    if (phase !== "playing" || !target) return;
    // `locationX/Y` is measured from the field itself, which is exactly the
    // frame the dot's coordinates are in — no layout maths, no drift.
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - target.cx;
    const dy = locationY - target.cy;
    if (Math.sqrt(dx * dx + dy * dy) <= target.r + HIT_SLOP) {
      registerHit(target, locationX, locationY);
    } else {
      registerMiss("That was the field, not the dot — a miss.", locationX, locationY);
    }
  }

  function startRound() {
    killMissTimer();
    msRef.current = ROUND_MS;
    livesRef.current = START_LIVES;
    hitsRef.current = 0;
    missesRef.current = 0;
    scoreRef.current = 0;
    reactionsRef.current = [];
    // Both must match the round's first real second, or the first tick compares
    // against a stale second and fires a countdown tick at 30 s.
    lastSecRef.current = Math.ceil(ROUND_MS / 1000);
    setSecLeft(Math.ceil(ROUND_MS / 1000));
    setMsLeft(ROUND_MS);
    setLives(START_LIVES);
    setScore(0);
    setLast(null);
    setNotice("");
    setSummary(null);
    setContinueUsed(false);
    setMarker(null);
    setOverFeel(null);
    setTarget(null);
    setPhase("playing");
    // Spawned here rather than from an effect: the dot has to be on the field in
    // the same render the round becomes playable, not one frame later.
    spawn();
  }

  function continueWithExtraLives() {
    setContinueUsed(true);
    livesRef.current = EXTRA_LIVES;
    setLives(EXTRA_LIVES);
    setNotice("");
    setPhase("playing");
    // Coming back from the ad is its own moment; it gets its own lift.
    buzz(Haptics.ImpactFeedbackStyle.Medium);
    spawn();
  }

  const seconds = (msLeft / 1000).toFixed(1);
  const timeFill = `${((msLeft / ROUND_MS) * 100).toFixed(2)}%` as DimensionValue;
  /** The countdown stops being information and starts being a warning. */
  const urgent = phase === "playing" && secLeft <= FINAL_SECONDS;

  return (
    <View style={[s.root, { backgroundColor: c.canvas, paddingTop: insets.top + space.sm }]}>
      <View style={s.column}>
        {router.canGoBack() ? (
          <Press
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={s.back}
          >
            <Icon name="back" size={22} color={c.ink} strokeWidth={2} />
          </Press>
        ) : null}

        {phase === "ready" ? (
          <View style={{ gap: space.base }}>
            <View style={s.badgeRow}>
              <Text variant="caption" tone="ink3">
                THIRTY-SECOND ROUND
              </Text>
              <View style={[s.chip, { backgroundColor: accentTint, borderColor: accentEdge }]}>
                <Text variant="caption" style={{ color: accent }}>
                  Free
                </Text>
              </View>
            </View>

            <Text variant="hero">How fast are your taps?</Text>
            <Text variant="lede" tone="ink2">
              A dot lands in the field. Tap it before it moves on. Thirty seconds, three
              lives, and the dot gets smaller — and its window shorter — the better you get.
            </Text>

            <View style={s.steps}>
              {[
                "Press start — the clock runs for thirty seconds",
                "Tap the dot the moment it lands",
                "Three lives: a missed tap, or a dot you never reach, costs one",
              ].map((step, i) => (
                <View key={step} style={s.step}>
                  <View style={[s.stepDot, { backgroundColor: accentTint }]}>
                    <Text variant="caption" style={{ color: accent }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text variant="meta" tone="ink2" style={s.stepText}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>

            <Card style={{ padding: space.base, gap: space.sm }}>
              <Text variant="title3">Scoring</Text>
              <Row label="A hit" value={`100 − your reaction in ms (${MIN_POINTS} minimum)`} />
              <Row label="A missed tap" value="One life" />
              <Row label="A dot you never reach" value="One life" />
              <Row label="Running out of lives" value={`${EXTRA_LIVES} more for one rewarded video`} />
            </Card>

            <Press
              accessibilityRole="button"
              accessibilityLabel="Start the round"
              haptic="medium"
              onPress={startRound}
              style={[
                s.primary,
                elevation(2),
                { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
              ]}
            >
              <Text variant="title3" style={s.primaryLabel}>
                Start the round
              </Text>
            </Press>

            <Text variant="meta" tone="ink3" style={s.centre}>
              {!recordRead
                ? "Reading this device's scores…"
                : record.rounds
                  ? `Best score on this device: ${record.best} · ${record.rounds} ${
                      record.rounds === 1 ? "round" : "rounds"
                    } played`
                  : "No rounds recorded on this device yet"}
            </Text>
          </View>
        ) : null}

        {phase === "playing" || phase === "outOfLives" ? (
          <View style={{ gap: space.md }}>
            <View style={s.hud}>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Time
                </Text>
                <Beat beat={secLeft} distance={4}>
                  {/* The last five seconds stop being a number and become a
                      warning: the digits go critical and each new one lands with
                      the same tick that is already in the hand. */}
                  <Text
                    variant="title1"
                    style={[s.tabular, urgent ? { color: c.critical } : null]}
                  >
                    {seconds}
                  </Text>
                </Beat>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Score
                </Text>
                <Beat beat={score} distance={5}>
                  <Text variant="title1">{score}</Text>
                </Beat>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Lives
                </Text>
                <View style={s.lives}>
                  {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                    <View key={i} style={[s.life, { backgroundColor: accent }]} />
                  ))}
                  {lives <= 0 ? (
                    <Text variant="meta" tone="ink3">
                      none
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={[s.track, { backgroundColor: c.surfaceInset }]}>
              <Animated.View
                style={[
                  s.fill,
                  {
                    width: timeFill,
                    backgroundColor: urgent ? c.critical : accent,
                  },
                ]}
              />
            </View>

            <View style={s.noticeRow}>
              <Text variant="meta" tone={notice ? "critical" : "ink2"} style={{ flex: 1 }}>
                {notice}
              </Text>
              {/* The reaction, punched in: the number is the score's whole rule,
                  so it arrives with a shove rather than fading in beside it. */}
              <Beat beat={last ? last.ms : 0} distance={6}>
                {last ? (
                  <Text variant="meta" style={{ color: accent }}>
                    {last.ms} ms · +{last.points}
                  </Text>
                ) : null}
              </Beat>
            </View>

            {phase === "playing" ? (
              // The shake lives on a wrapper, not on the Pressable: a transform on
              // the touch target moves the frame `locationX/Y` is measured in, and
              // the dot's coordinates are in that frame. Shaking the wrapper moves
              // the picture without moving the ruler.
              <Animated.View style={[s.fieldWrap, fieldShakeStyle]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Playing field. Tap the dot."
                  // `onPressIn`, not `onPress`: the reaction has to be measured from
                  // the finger landing, not from the finger lifting.
                  {...FIELD_PRESS_PROPS}
                  onPressIn={onFieldPress}
                  style={[
                    s.field,
                    {
                      width: fieldW,
                      height: fieldH,
                      backgroundColor: accentTint,
                      borderColor: accentEdge,
                    },
                  ]}
                >
                  {target ? (
                    <Dot
                      key={spawnAt}
                      cx={target.cx}
                      cy={target.cy}
                      r={target.r}
                      color={accent}
                      edge={c.canvas}
                    />
                  ) : null}
                  {marker ? (
                    <Marker key={marker.at} mark={marker} color={accent} wrong={c.critical} />
                  ) : null}
                </Pressable>
              </Animated.View>
            ) : (
              <View style={{ gap: space.md }}>
                <Text variant="title2">Out of lives</Text>
                <Text variant="body" tone="ink2">
                  {seconds}s left on the clock, score {score}. The clock is held while this
                  is on screen — take the lives or end the round.
                </Text>
                <AdSlot
                  accent={accent}
                  title="Rewarded ad — extra lives"
                  reward={`+${EXTRA_LIVES} lives, once per round`}
                  cta={`Watch ad for ${EXTRA_LIVES} lives`}
                  onReward={continueWithExtraLives}
                  onDismiss={() => setPhase("over")}
                  dismissLabel="End the round"
                />
              </View>
            )}
          </View>
        ) : null}

        {phase === "over" ? (
          <View style={{ gap: space.base }}>
            <View style={s.head}>
              <Text variant="hero">Round over.</Text>
              {summary?.isNewBest ? (
                // Keyed on the moment the stored record said so, so the badge arrives
                // with the success buzz that played at the same instant rather than
                // after it.
                <Beat key={overFeel?.at ?? 0} beat={overFeel?.at ?? 0} distance={-4}>
                  <Badge tone="positive" label="New best" />
                </Beat>
              ) : null}
            </View>
            {summary ? (
              <Card style={{ padding: space.base, gap: space.sm }}>
                <Row label="Score" value={String(summary.score)} />
                <Row label="Dots hit" value={String(summary.hits)} />
                <Row label="Misses" value={String(summary.misses)} />
                <Row
                  label="Lives lost"
                  value={String(START_LIVES + (continueUsed ? EXTRA_LIVES : 0) - lives)}
                />
                <Row label="Average reaction" value={summary.avgMs ? `${summary.avgMs} ms` : "—"} />
                <Row label="Fastest reaction" value={summary.bestMs ? `${summary.bestMs} ms` : "—"} />
                <Row label="Best score on this device" value={String(record.best)} />
                <Row label="Rounds played on this device" value={String(record.rounds)} />
              </Card>
            ) : null}

            {record.recent.length > 0 ? (
              <Card style={{ padding: space.base, gap: space.md }}>
                <Text variant="title3">
                  {record.recent.length === 1
                    ? "Your last round"
                    : `Your last ${record.recent.length} rounds`}
                </Text>
                {record.recent.map((r, i) => (
                  <View key={`${r.at}-${i}`} style={{ gap: 2 }}>
                    <View style={s.row}>
                      <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                        {r.line || "round recorded"}
                      </Text>
                      <Text variant="meta" style={{ color: c.ink }}>
                        {r.score}
                      </Text>
                    </View>
                    <Text variant="caption" tone="ink3">
                      {sinceLabel(r.at)}
                    </Text>
                  </View>
                ))}
                <Text variant="caption" tone="ink3">
                  Kept on this device, newest first — closing the app does not clear them.
                </Text>
              </Card>
            ) : null}

            <Press
              accessibilityRole="button"
              accessibilityLabel="Play again"
              haptic="medium"
              onPress={startRound}
              style={[
                s.primary,
                elevation(2),
                { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
              ]}
            >
              <Text variant="title3" style={s.primaryLabel}>
                Play again
              </Text>
            </Press>

            <Press
              accessibilityRole="link"
              accessibilityLabel="Passport photo maker, forty-nine rupees"
              onPress={() => router.push("/passport")}
              style={[s.cross, { borderColor: c.hairline }]}
            >
              <Text variant="meta" tone="ink2">
                Also in this app: a print-ready passport photo sheet for ₹49
              </Text>
            </Press>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ── The picture ───────────────────────────────────────────────────────────
   Three small components, each holding one animation. They sit outside the screen
   component on purpose: the field re-renders ten times a second off the round
   clock, and a component that owns a shared value can be reasoned about (and
   re-keyed) without the clock's renders reaching into it.

   Reduce Motion is checked in each of them, not once in the parent, because what
   it should remove differs: a number that jumps is replaced by nothing at all
   (the value itself is still legible), while the dot's landing and the hit burst
   are replaced by a plain fade rather than disappearing — a tap that produces
   literally nothing on screen reads as a dropped input. */

/**
 * A number that lands rather than updates. Keyed on `beat` so the animation is
 * tied to the value changing, never to the clock: the score bumps on a hit and
 * the countdown bumps on a new second, and neither can fire on a re-render that
 * changed nothing.
 */
function Beat({
  beat,
  distance = 5,
  children,
}: {
  beat: number;
  /** How far, in points, the number is shoved as it lands. */
  distance?: number;
  children: ReactNode;
}) {
  const reduceMotion = useReduceMotion();
  const at = useSharedValue(1);
  // First mount is not a beat: the screen opens with a score of 0 and a clock of
  // 30, and neither of those just happened.
  const seen = useRef(beat);

  useEffect(() => {
    if (seen.current === beat) return;
    seen.current = beat;
    at.value = 0;
    at.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [beat, at]);

  const style = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1 };
    const t = at.value;
    return {
      opacity: 0.35 + 0.65 * t,
      transform: [{ translateY: (1 - t) * distance }, { scale: 0.94 + 0.06 * t }],
    };
  }, [reduceMotion, distance]);

  return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * The dot, and everything that happens to it where it sits.
 *
 * The pop is keyed on the component itself (`key={spawnAt}` at the call site), so
 * "a new dot landed" is a mount and cannot be confused with a re-render — two
 * dots can land on the same pixel and the second one still pops. This is the
 * *only* animation the dot runs: it is a target, and a target that breathes or
 * drifts while you are aiming at it is a target that feels broken.
 */
function Dot({
  cx,
  cy,
  r,
  color,
  edge,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  edge: string;
}) {
  const reduceMotion = useReduceMotion();
  /** How far the dot has landed. Keyed on the mount, so it is 0 for the first
   *  frame and 1 for every frame after — a re-render of the same dot cannot
   *  re-play it. */
  const pop = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    pop.value = withTiming(1, { duration: POP_MS, easing: Easing.out(Easing.back(2.2)) });
  }, [reduceMotion, pop]);

  const grow = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1 };
    const t = pop.value;
    return { opacity: 0.25 + 0.75 * t, transform: [{ scale: 0.72 + 0.28 * t }] };
  }, [reduceMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          backgroundColor: color,
          borderWidth: 3,
          borderColor: edge,
        },
        grow,
      ]}
    />
  );
}

/**
 * What a touch left behind: a ring where a hit landed, an ✕ where it did not.
 *
 * Both are drawn where the finger itself landed — which for a hit is inside the
 * dot's generous slop radius, not necessarily its centre — and then get out of
 * the way, so the next dot is never competing with the last one's receipt. The
 * hit's mark is a ring rather than a filled disc on purpose: a filled disc
 * expanding out of the dot would read as a *second* dot, which on this field is
 * the one thing that must never appear.
 */
function Marker({ mark, color, wrong }: { mark: TouchMark; color: string; wrong: string }) {
  const reduceMotion = useReduceMotion();
  const at = useSharedValue(0);

  useEffect(() => {
    at.value = withTiming(1, {
      duration: reduceMotion ? 260 : RING_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [reduceMotion, at]);

  const style = useAnimatedStyle(() => {
    const t = at.value;
    // Reduce Motion keeps the gesture and drops the travel: it grows a little and
    // fades, instead of exploding across the field.
    return {
      opacity: 1 - t,
      transform: [{ scale: reduceMotion ? 1 : 0.6 + 1.6 * t }],
    };
  }, [reduceMotion]);

  const size = mark.r * 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: mark.x - mark.r,
          top: mark.y - mark.r,
          width: size,
          height: size,
          borderRadius: mark.r,
          borderWidth: mark.kind === "hit" ? 3 : 2,
          borderColor: mark.kind === "hit" ? color : wrong,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {mark.kind === "miss" ? (
        <Text variant="title3" style={{ color: wrong }}>
          ✕
        </Text>
      ) : null}
    </Animated.View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={s.row}>
      <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="meta" style={{ color: c.ink }}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.base },
  column: { width: "100%", maxWidth: 520, alignSelf: "center", gap: space.base },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -space.sm },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  head: { flexDirection: "row", alignItems: "center", gap: space.md, flexWrap: "wrap" },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  steps: { gap: space.sm },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepText: { flex: 1 },
  primary: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { color: "#fff" },
  centre: { textAlign: "center" },
  hud: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  hudCell: { gap: 2 },
  tabular: { fontVariant: ["tabular-nums"] },
  lives: { flexDirection: "row", alignItems: "center", gap: space.xs, height: 32 },
  life: { width: 14, height: 14, borderRadius: 7 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  noticeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 20 },
  /** Holds the field so the miss-shake can move the picture without moving the
   *  touch frame the hit test is measured in. */
  fieldWrap: { alignSelf: "center" },
  field: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignSelf: "center",
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  cross: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    alignItems: "center",
  },
});
