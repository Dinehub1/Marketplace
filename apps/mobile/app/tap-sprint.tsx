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
 * The accent is the game's own colour from the store-listing target, not the
 * tenant brand ramp: a game screen has to look like the game someone installed,
 * not like the directory behind it. Everything else (type scale, spacing,
 * press feedback, dark mode, elevation) comes from the shared design system.
 */
import { useCallback, useEffect, useRef, useState } from "react";
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
import { alpha, radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
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

type Phase = "ready" | "playing" | "outOfLives" | "over";

type Target = { cx: number; cy: number; r: number; shownAt: number };

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
      if (left === 0) {
        killMissTimer();
        setTarget(null);
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
    const line = hits
      ? `${hits} ${hits === 1 ? "dot" : "dots"} hit · avg ${avgMs} ms · fastest ${bestMs} ms`
      : "no dots hit";
    recordRound(GAME, scoreRef.current, line).then(({ record: next, isNewBest }) => {
      setRecord(next);
      setSummary((prev) => (prev ? { ...prev, isNewBest } : prev));
    });
  }, [phase]);

  function spawn() {
    const r = Math.max(MIN_RADIUS, BASE_RADIUS - hitsRef.current * RADIUS_PER_HIT);
    const allowed = Math.max(MIN_ALLOW_MS, BASE_ALLOW_MS - hitsRef.current * ALLOW_PER_HIT_MS);
    const pad = r + space.xs;
    const cx = pad + Math.random() * Math.max(1, fieldW - pad * 2);
    const cy = pad + Math.random() * Math.max(1, fieldH - pad * 2);
    setTarget({ cx, cy, r, shownAt: Date.now() });
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => {
      missTimer.current = null;
      registerMiss("The dot timed out — too slow.");
    }, allowed);
  }

  function registerHit(t: Target) {
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
    if (msRef.current > 0) spawn();
  }

  function registerMiss(reason: string) {
    killMissTimer();
    if (phaseRef.current !== "playing") return;
    const left = livesRef.current - 1;
    livesRef.current = left;
    missesRef.current += 1;
    setLives(left);
    setLast(null);
    setNotice(reason);
    setTarget(null);
    if (msRef.current <= 0) {
      setPhase("over");
      return;
    }
    if (left <= 0) {
      if (continueUsed) setPhase("over");
      else setPhase("outOfLives");
      return;
    }
    spawn();
  }

  function onFieldPress(e: GestureResponderEvent) {
    if (phase !== "playing" || !target) return;
    // `locationX/Y` is measured from the field itself, which is exactly the
    // frame the dot's coordinates are in — no layout maths, no drift.
    const dx = e.nativeEvent.locationX - target.cx;
    const dy = e.nativeEvent.locationY - target.cy;
    if (Math.sqrt(dx * dx + dy * dy) <= target.r + HIT_SLOP) registerHit(target);
    else registerMiss("That was the field, not the dot — a miss.");
  }

  function startRound() {
    killMissTimer();
    msRef.current = ROUND_MS;
    livesRef.current = START_LIVES;
    hitsRef.current = 0;
    missesRef.current = 0;
    scoreRef.current = 0;
    reactionsRef.current = [];
    setMsLeft(ROUND_MS);
    setLives(START_LIVES);
    setScore(0);
    setLast(null);
    setNotice("");
    setSummary(null);
    setContinueUsed(false);
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
    spawn();
  }

  const seconds = (msLeft / 1000).toFixed(1);
  const timeFill = `${((msLeft / ROUND_MS) * 100).toFixed(2)}%` as DimensionValue;

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
                <Text variant="title1" style={s.tabular}>
                  {seconds}
                </Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Score
                </Text>
                <Text variant="title1">{score}</Text>
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
              <View style={[s.fill, { width: timeFill, backgroundColor: accent }]} />
            </View>

            <View style={s.noticeRow}>
              <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                {notice}
              </Text>
              {last ? (
                <Text variant="meta" style={{ color: accent }}>
                  {last.ms} ms · +{last.points}
                </Text>
              ) : null}
            </View>

            {phase === "playing" ? (
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
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: target.cx - target.r,
                      top: target.cy - target.r,
                      width: target.r * 2,
                      height: target.r * 2,
                      borderRadius: target.r,
                      backgroundColor: accent,
                      borderWidth: 3,
                      borderColor: c.canvas,
                    }}
                  />
                ) : null}
              </Pressable>
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
              {summary?.isNewBest ? <Badge tone="positive" label="New best" /> : null}
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
