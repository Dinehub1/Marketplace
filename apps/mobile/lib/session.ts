/**
 * The wellness app's shared clock.
 *
 * Breathe, Stretch, Walk and Sleep are the same machine with different tables: a list of
 * timed phases, a ticker that advances through them, a haptic at each turn, and a record
 * of what was done kept on the device. Written once here so a fix lands in all of them —
 * the bug that made Breathe's circle snap and its cycle counter lie was one effect
 * re-running on every tick, and copying that mistake five more times is not a plan.
 *
 * The rules it encodes (see docs/ios-layout-and-nav.md):
 *  - the ticker's effect must not depend on the value it updates, or it tears itself down
 *    ten times a second;
 *  - the clock is armed once at start, not re-derived every tick;
 *  - a session that is interrupted keeps its state, because the numbers live in refs.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

export type Phase = { key: string; label: string; seconds: number };

/** day → count, for screens that count taps rather than run a timer. */
export type CountMap = Record<string, number>;

export type SessionRecord = {
  at: number;
  screen: string;
  minutes: number;
  units: number;   // cycles, moves, rounds — whatever the screen counts
  label: string;   // the pattern or routine name
};

const STORE_KEY = "dropby-wellness";

/** The day key both the counter and its history are filed under. */
function todayKeyOf(): string {
  return new Date().toISOString().slice(0, 10);
}
const TICK_MS = 100;

function buzz() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** One second-resolution clock for any list of phases. */
export function usePhases(phases: Phase[], opts?: { onComplete?: () => void }) {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [index, setIndex] = useState(0);
  const [phaseMs, setPhaseMs] = useState(0);
  const [units, setUnits] = useState(0);
  const startedAt = useRef<number | null>(null);

  const total = useMemo(() => phases.reduce((n, p) => n + p.seconds, 0), [phases]);
  const done = useCallback(() => {
    setRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    opts?.onComplete?.();
  }, [opts]);

  useEffect(() => {
    if (!running) return;
    if (startedAt.current == null) startedAt.current = Date.now();
    const id = setInterval(() => {
      const ms = Date.now() - (startedAt.current as number);
      setElapsedMs(ms);
      const secs = ms / 1000;
      if (secs >= total) {
        setIndex(phases.length - 1);
        setPhaseMs(phases[phases.length - 1].seconds * 1000);
        setUnits((u) => u + 1);
        clearInterval(id);
        done();
        return;
      }
      let acc = 0;
      let idx = 0;
      for (let i = 0; i < phases.length; i++) {
        if (secs < acc + phases[i].seconds) {
          idx = i;
          break;
        }
        acc += phases[i].seconds;
        idx = i;
      }
      setPhaseMs((secs - acc) * 1000);
      setIndex((prev) => {
        if (prev !== idx) buzz();
        return idx;
      });
    }, TICK_MS);
    return () => clearInterval(id);
    // NOTE: elapsedMs is deliberately NOT a dependency. It is the value this effect
    // writes; depending on it re-created the interval every tick and produced "3 cycles
    // in 10 seconds" on an 11-second cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phases, total, done]);

  const controls = useMemo(
    () => ({
      start() {
        startedAt.current = Date.now();
        setElapsedMs(0);
        setIndex(0);
        setPhaseMs(0);
        setUnits(0);
        setRunning(true);
      },
      stop() {
        setRunning(false);
      },
    }),
    [],
  );

  const phase = phases[Math.min(index, phases.length - 1)];
  const secondsLeft = phase ? Math.max(0, Math.ceil((phase.seconds * 1000 - phaseMs) / 1000)) : 0;
  const progress = total > 0 ? Math.min(1, elapsedMs / (total * 1000)) : 0;
  const clock = `${Math.floor(elapsedMs / 60_000)}:${String(Math.floor((elapsedMs % 60_000) / 1000)).padStart(2, "0")}`;

  return { running, phase, secondsLeft, progress, clock, units, elapsedMs, ...controls };
}

/** Sessions and habit counts, on the device, because nobody signs up for a timer. */
export function useWellnessStore(screen: string) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [today, setToday] = useState<{ day: string; count: number } | null>(null);
  // day → count. The old shape stored only today's count, which meant a counter app could
  // never show a month; the migration below reads either shape.
  const [history, setHistory] = useState<CountMap>({});

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as { sessions?: SessionRecord[]; counts?: Record<string, { day: string; count: number }> };
        setSessions((parsed.sessions ?? []).filter((s) => s.screen === screen));
        const storedCount = parsed.counts?.[screen] as unknown;
        if (storedCount && typeof storedCount === "object") {
          const legacy = storedCount as { day?: string; count?: number };
          const asMap =
            typeof legacy.day === "string" && typeof legacy.count === "number"
              ? { [legacy.day]: legacy.count }
              : (storedCount as CountMap);
          setHistory(asMap);
          // Today's number lives inside the history; taking it from there is what keeps the
          // screen's own counter and its chart from disagreeing.
          setToday({ day: todayKeyOf(), count: asMap[todayKeyOf()] ?? 0 });
        } else {
          setToday(storedCount ?? null);
        }
      })
      .catch(() => {});
  }, [screen]);

  const save = useCallback(
    async (entry: SessionRecord) => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const all = [entry, ...(parsed.sessions ?? [])].slice(0, 60);
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ ...parsed, sessions: all }));
        setSessions(all.filter((s) => s.screen === screen));
      } catch {
        /* a device that refuses to store a stat must not break the session */
      }
    },
    [screen],
  );

  /** A count that resets when the date changes — "today's glasses", not "all glasses". */
  const bump = useCallback(
    async (delta: number) => {
      const next = today && today.day === todayKey ? Math.max(0, today.count + delta) : Math.max(0, delta);
      const value = { day: todayKey, count: next };
      setToday(value);
      const nextHistory: CountMap = { ...history, [todayKey]: next };
      setHistory(nextHistory);
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(
          STORE_KEY,
          JSON.stringify({ ...parsed, counts: { ...(parsed.counts ?? {}), [screen]: nextHistory } }),
        );
      } catch {}
    },
    [screen, today, todayKey, history],
  );

  const countToday = today && today.day === todayKey ? today.count : 0;
  return { sessions, last: sessions[0] ?? null, countToday, countHistory: history, save, bump, todayKey };
}
