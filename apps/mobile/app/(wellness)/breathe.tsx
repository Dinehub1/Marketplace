/**
 * Breathe — a guided slow-breathing screen that costs nothing to run.
 *
 * Why it exists: every other product here needs a server (pdfcpu, rembg, a hosted
 * model). This one is a timer and an animation, so it works in aeroplane mode, cannot
 * fail on a slow network, and cannot cost us a rupee per session. It is also the one
 * product a person opens daily, which is what a store listing is actually ranked on.
 *
 * What it deliberately does NOT claim: no blood-pressure promises, no "heals anxiety",
 * no invented statistics. The only numbers on screen are arithmetic the user can
 * check — cycles done, minutes done, and the breathing rate the pattern implies
 * (60 ÷ cycle seconds). The honest framing is in `docs/breathe-app-plan.md`.
 *
 * The prayer angle without the religion: many traditions pair a long, slow breath with
 * a repeated phrase (japa, dhikr, the rosary, pranayama counting). That mechanical
 * shape — slow breath plus repetition — is what this screen gives you; you type your
 * own two lines, so the app never picks a faith for anybody.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { alpha, radius, space } from "@hermes/tokens";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";
import { Card, Press, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";

/** One pattern = one cycle of phases, in seconds. Hold phases may be zero. */
type Pattern = {
  id: string;
  name: string;
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
    inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0,
    note: "About six breaths a minute — the rate slow-breathing research focuses on.",
  },
  {
    id: "box",
    name: "Box 4·4·4·4",
    inhale: 4, holdIn: 4, exhale: 4, holdOut: 4,
    note: "Even in, hold, out, hold. Steadying — swimmers and soldiers use it.",
  },
  {
    id: "478",
    name: "4·7·8",
    inhale: 4, holdIn: 7, exhale: 8, holdOut: 0,
    note: "A long exhale. The classic pattern people use before sleep.",
  },
  {
    id: "prayer",
    name: "Long exhale",
    inhale: 4, holdIn: 0, exhale: 8, holdOut: 0,
    note: "The shape most traditions use with a repeated phrase.",
  },
];

const LENGTHS = [3, 5, 10];            // minutes
const STORE_KEY = "dropby-breathe";
const TICK_MS = 100;

type Phase = { key: "in" | "holdIn" | "out" | "holdOut"; label: string; seconds: number };

/** The phases of one cycle, in order, with the ones that are zero removed. */
function phasesOf(p: Pattern): Phase[] {
  const all: Phase[] = [
    { key: "in", label: "Breathe in", seconds: p.inhale },
    { key: "holdIn", label: "Hold", seconds: p.holdIn },
    { key: "out", label: "Breathe out", seconds: p.exhale },
    { key: "holdOut", label: "Hold", seconds: p.holdOut },
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

type Stored = { sessions: { at: number; minutes: number; cycles: number; pattern: string }[] };

/** The shared shape the analytics panel expects, mapped lazily from Breathe's own store. */
type PanelSession = { at: number; screen: string; minutes: number; units: number; label: string };

export default function Breathe() {
  const ui = useProductUI("breathe");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const insets = useSafeAreaInsets();

  const [patternId, setPatternId] = useState(PATTERNS[0].id);
  const [minutes, setMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseMs, setPhaseMs] = useState(0);
  const [phraseIn, setPhraseIn] = useState("Breathe in");
  const [phraseOut, setPhraseOut] = useState("Breathe out");
  const [editing, setEditing] = useState(false);
  const [last, setLast] = useState<Stored["sessions"][number] | null>(null);
  const [history, setHistory] = useState<PanelSession[]>([]);
  const [done, setDone] = useState(false);

  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0];
  const phases = useMemo(() => phasesOf(pattern), [pattern]);
  const phase = phases[Math.min(phaseIndex, phases.length - 1)];
  const targetMs = minutes * 60_000;
  const scale = useSharedValue(1);

  /* The device remembers the last session, so the app has a memory without an
     account and without a server. */
  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Stored;
        setLast(parsed.sessions?.[0] ?? null);
        // The analytics panel reads the same history the "last session" line does, mapped
        // into the shared session shape rather than written a second time.
        setHistory(
          (parsed.sessions ?? []).map((x) => ({
            at: x.at,
            screen: "breathe",
            minutes: x.minutes,
            units: x.cycles,
            label: x.pattern,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (entry: Stored["sessions"][number]) => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const parsed: Stored = raw ? (JSON.parse(raw) as Stored) : { sessions: [] };
      const sessions = [entry, ...(parsed.sessions ?? [])].slice(0, 30);
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ sessions }));
      setHistory(
        sessions.map((x) => ({ at: x.at, screen: "breathe", minutes: x.minutes, units: x.cycles, label: x.pattern })),
      );
      setLast(entry);
    } catch {
      /* a device that refuses to store a stat must not break the session */
    }
  }, []);

  /* One interval drives everything: elapsed time, which phase we are in, and how far
     through it we are. A ticker rather than four chained timers because a phase list
     changes shape when the pattern changes. */
  const startedAt = useRef<number | null>(null);
  // Deps are [running, pattern, phases, targetMs] and NOT elapsedMs: with elapsedMs in
  // here the effect re-ran on every tick, which reset the interval's baseline ten times
  // a second and made the cycle counter report three cycles in ten seconds.
  useEffect(() => {
    if (!running) return;
    if (startedAt.current == null) startedAt.current = Date.now();
    const id = setInterval(() => {
      const total = Date.now() - (startedAt.current as number);
      setElapsedMs(total);

      let into = total / 1000;                        // seconds into the current cycle
      const c = cycleSeconds(pattern);
      const full = Math.floor(into / c);
      into -= full * c;
      let acc = 0;
      let idx = 0;
      for (let i = 0; i < phases.length; i++) {
        if (into < acc + phases[i].seconds) {
          idx = i;
          break;
        }
        acc += phases[i].seconds;
        idx = Math.min(i + 1, phases.length - 1);
      }
      setPhaseMs((into - acc) * 1000);
      setPhaseIndex((prev) => {
        if (prev !== idx) {
          // A buzz at the turn of each phase: this is the cue you feel with your eyes shut.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        return idx;
      });
      setCycles(full);

      if (total >= targetMs) {
        setRunning(false);
        setDone(true);
        setCycles(Math.floor(targetMs / (cycleSeconds(pattern) * 1000)));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        persist({
          at: Date.now(),
          minutes: Math.round(total / 60_000),
          cycles: Math.floor(total / (cycleSeconds(pattern) * 1000)),
          pattern: pattern.name,
        });
      }
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, patternId, targetMs, persist]);

  /* The circle: grows across the inhale, holds, and settles across the exhale. Each
     phase gets its own timing so the movement matches the breath the user is being
     asked for instead of a fixed animation speed. */
  useEffect(() => {
    if (!running) {
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      return;
    }
    // Animate on the phase CHANGE only. The breath has to take the whole phase, so the
    // duration is the phase, and a hold deliberately leaves the scale where it is.
    const ms = Math.max(200, phase.seconds * 1000);
    if (phase.key === "in") scale.value = withTiming(1.34, { duration: ms, easing: Easing.inOut(Easing.sin) });
    else if (phase.key === "out") scale.value = withTiming(0.78, { duration: ms, easing: Easing.inOut(Easing.sin) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase.key, phase.seconds, scale]);

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const secondsLeft = Math.max(0, Math.ceil((phase.seconds * 1000 - phaseMs) / 1000));
  const phaseWord = phase.key === "in" ? phraseIn : phase.key === "out" ? phraseOut : "Hold";
  const progress = targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : 0;

  function start() {
    setDone(false);
    startedAt.current = Date.now();
    setElapsedMs(0);
    setCycles(0);
    setPhaseIndex(0);
    setPhaseMs(0);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    if (elapsedMs > 20_000) {
      persist({
        at: Date.now(),
        minutes: Math.round(elapsedMs / 60_000),
        cycles,
        pattern: pattern.name,
      });
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + space.base, paddingBottom: insets.bottom + 78 }]}>  {/* 78 = the floating iOS 26 tab bar */}
      <View style={s.head}>
        <Text variant="title2">Breathe</Text>
        <Text variant="meta" tone="ink2">
          Slow breathing, four patterns, nothing to sign up for. Works offline.
        </Text>
      </View>

      {/* The circle IS the control. On a phone the big circle is the only thing anyone
          tries to tap, so tapping it starts and stops the session — the labelled button
          below is a second way in, not the only way. */}
      <Press
        onPress={running ? stop : start}
        accessibilityRole="button"
        accessibilityLabel={running ? "Finish the session" : "Begin breathing"}
        style={s.circleBox}
      >
        <Animated.View style={[s.circle, circle]} />
        <View style={s.circleInner}>
          <Text variant="title1">{running ? phaseWord : done ? "Done" : "Ready"}</Text>
          <Text variant="meta" tone="ink2">
            {running ? `${secondsLeft}s` : `${Math.round(ratePerMinute(pattern))} breaths a minute`}
          </Text>
          <Text variant="caption" tone="ink3" style={s.tapHint}>
            {running ? "TAP TO FINISH" : "TAP TO BEGIN"}
          </Text>
        </View>
      </Press>

      {/* Above the fold on purpose: the old layout put this button at y=872 on an
          844-point screen, so the only visible thing was an inert circle. */}
      <Press
        onPress={running ? stop : start}
        accessibilityRole="button"
        accessibilityLabel={running ? "Finish the session" : "Start breathing"}
        style={s.cta}
      >
        <Text variant="title3" style={s.ctaText}>{running ? "Finish" : done ? "Again" : "Begin"}</Text>
      </Press>

      <View style={s.stats}>
        <Stat ui={ui} label="cycles" value={String(cycles)} />
        <Stat
          ui={ui}
          label="elapsed"
          value={`${Math.floor(elapsedMs / 60_000)}:${String(Math.floor((elapsedMs % 60_000) / 1000)).padStart(2, "0")}`}
        />
        <Stat ui={ui} label="target" value={`${minutes}m`} />
      </View>

      <View style={s.bar}>
        <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {!running ? (
        <>
          <Text variant="caption" tone="ink3" style={s.section}>
            PATTERN
          </Text>
          <View style={s.row}>
            {PATTERNS.map((p) => (
              <Chip
                key={p.id}
                ui={ui}
                label={p.name}
                active={p.id === patternId}
                onPress={() => {
                  setPatternId(p.id);
                  setPhaseIndex(0);
                  setPhaseMs(0);
                  setElapsedMs(0);
                  setCycles(0);
                  setDone(false);
                }}
              />
            ))}
          </View>
          <Text variant="meta" tone="ink2" style={s.note}>
            {pattern.note}
          </Text>

          <Text variant="caption" tone="ink3" style={s.section}>
            LENGTH
          </Text>
          <View style={s.row}>
            {LENGTHS.map((m) => (
              <Chip key={m} ui={ui} label={`${m} min`} active={m === minutes} onPress={() => setMinutes(m)} />
            ))}
          </View>

          <Text variant="caption" tone="ink3" style={s.section}>
            YOUR PHRASE
          </Text>
          {editing ? (
            <View style={s.editRow}>
              <PhraseInput value={phraseIn} onDone={(v) => { setPhraseIn(v || "Breathe in"); setEditing(false); }} ui={ui} />
            </View>
          ) : null}
          <Press
            onPress={() => setEditing((v) => !v)}
            accessibilityRole="button"
            style={s.phraseCard}
          >
            <Text variant="body" tone="ink">{phraseIn}</Text>
            <Text variant="body" tone="ink3">{phraseOut}</Text>
            <Text variant="meta" tone="ink4">Tap to change — one line for the in-breath, one for the out-breath</Text>
          </Press>

          {done ? (
            <Card style={s.doneCard}>
              <Text variant="title3">Session saved on this device</Text>
              <Text variant="meta" tone="ink2">
                {minutes} minutes · {cycles} cycles · {pattern.name} · about {Math.round(ratePerMinute(pattern))} breaths a minute
              </Text>
            </Card>
          ) : null}

          {last ? (
            <Text variant="meta" tone="ink3" style={s.note}>
              Last session: {last.minutes} min, {last.cycles} cycles, {last.pattern}
            </Text>
          ) : null}
        </>
      ) : null}

      <InsightPanel
        screen="breathe"
        unitsLabel="cycles"
        weeklyGoal={5}
        countToday={last?.cycles}
        sessions={history}
        accentKey="breathe"
      />

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
          Not a treatment, not a diagnosis, not a replacement for care. Don't practise
          breath-holds in water or while driving, and stop if you feel dizzy.
        </Text>
      </Card>
    </View>
  );
}

function Stat({ ui, label, value }: { ui: ProductUI; label: string; value: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text variant="title3" style={{ color: ui.accent }}>{value}</Text>
      <Text variant="caption" tone="ink3">{label}</Text>
    </View>
  );
}

function Chip({ ui, label, active, onPress }: { ui: ProductUI; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: active ? ui.accent : ui.hairline,
          backgroundColor: active ? ui.accentTint : "transparent",
        },
      ]}
    >
      <Text variant="callout" style={{ color: active ? ui.accent : ui.muted, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Two inputs in one control: the in-breath line and the out-breath line. */
function PhraseInput({ value, onDone, ui }: { value: string; onDone: (v: string) => void; ui: ProductUI }) {
  const [text, setText] = useState(value);
  const RNInput = require("react-native").TextInput;
  return (
    <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
      <RNInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => onDone(text.trim())}
        placeholder="In-breath line"
        placeholderTextColor={ui.faint}
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: ui.hairline,
          borderRadius: radius.sm,
          paddingHorizontal: 12,
          paddingVertical: 9,
          color: ui.ink,
        }}
      />
      <Press onPress={() => onDone(text.trim())} accessibilityRole="button" style={{ paddingHorizontal: 12 }}>
        <Text variant="callout" style={{ color: ui.accent, fontWeight: "700" }}>Save</Text>
      </Press>
    </View>
  );
}

function makeStyles(ui: ProductUI) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg, paddingHorizontal: space.base },
    head: { gap: 4, marginBottom: space.base },
    circleBox: { alignItems: "center", justifyContent: "center", height: 232 },
    circle: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: alpha(ui.accent, 0.16),
      borderWidth: 1,
      borderColor: alpha(ui.accent, 0.42),
    },
    circleInner: { alignItems: "center", gap: 2 },
    tapHint: { letterSpacing: 1.1, marginTop: 2 },
    stats: { flexDirection: "row", justifyContent: "space-around", marginTop: space.sm },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, marginTop: space.md, overflow: "hidden" },
    barFill: { height: 4, borderRadius: 2, backgroundColor: ui.accent },
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
    },
    doneCard: { marginTop: space.md, gap: 4 },
    cta: {
      marginTop: space.md,
      backgroundColor: ui.accent,
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: "center",
    },
    ctaText: { color: "#fff" },
    infoCard: { marginTop: space.lg, marginBottom: space.xxl, gap: 6 },
    infoH: { marginTop: space.sm },
    infoP: { lineHeight: 19 },
  });
}
