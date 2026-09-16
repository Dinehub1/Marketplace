/**
 * The wellness app's shared clock and shared record.
 *
 * Two jobs live here, and they used to be one.
 *
 * `usePhases` is the clock. Breathe, Stretch, Walk and Sleep are the same machine with
 * different tables: a list of timed phases, a ticker that advances through them, a haptic at
 * each turn. Written once so a fix lands in all of them — the bug that made Breathe's circle
 * snap and its cycle counter lie was one effect re-running on every tick, and copying that
 * mistake five more times is not a plan.
 *
 * `useWellnessStore` is the record: sessions and daily counts, read by six screens. It is now
 * one store for the whole app rather than one per screen per mount, for two reasons that were
 * both real bugs before this rewrite:
 *
 *   * two screens mounting the same store each read AsyncStorage separately and never saw
 *     each other's writes, so saving a walk did not move the Progress chart until a remount;
 *   * "today" was captured once per render, so a counter left open across midnight kept
 *     adding to yesterday.
 *
 * The data itself lives in the main database (see lib/wellness-db.ts). This store is the
 * offline half: it renders instantly from a device cache, applies writes locally, and drains
 * a pending queue whenever the network lets it. Everything convenient — the cache, the queue,
 * the goals and phrase in lib/settings.ts — stays on the device; everything a person would
 * miss if they lost the phone is in the database.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  MAX_SESSIONS,
  deleteRemote,
  enqueueWrite,
  hasBackfilled,
  installToken,
  loadRemote,
  markBackfilled,
  newClientId,
  pushPending,
  readQueue,
  withClientId,
  writeQueue,
  type CountMap,
  type CountsByScreen,
  type RemoteData,
  type SessionRecord,
} from "./wellness-db";

export type { CountMap, CountsByScreen, SessionRecord } from "./wellness-db";

export type Phase = { key: string; label: string; seconds: number };

const CACHE_KEY = "dropby-wellness";
/** The local-only build's per-screen keys, cleared by "Delete my data". */
const LEGACY_KEYS = ["dropby-breathe", "dropby-japa-phrase"] as const;

/** The day key both the counter and its history are filed under. */
export function todayKeyOf(now = new Date()): string {
  // Local midnight, not UTC: a person counting glasses at 11pm should still be on today's
  // number, and `toISOString` would have moved them to tomorrow at 5:30am IST.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const TICK_MS = 100;

function buzz() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/* ══ The clock ══════════════════════════════════════════════════════════════════════════ */

/** One second-resolution clock for any list of phases. */
export function usePhases(phases: Phase[], opts?: { onComplete?: () => void }) {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [index, setIndex] = useState(0);
  const [phaseMs, setPhaseMs] = useState(0);
  const [units, setUnits] = useState(0);
  const startedAt = useRef<number | null>(null);

  const total = useMemo(() => phases.reduce((n, p) => n + p.seconds, 0), [phases]);

  /**
   * The completion callback is held in a ref, not a dependency.
   *
   * Callers pass an inline `{ onComplete }`, which is a new object on every render — and the
   * callback itself calls setState, so depending on it meant the ticker effect tore down and
   * re-armed its interval on every render for the whole session. Keeping the ref current in
   * its own effect makes `done` stable, which is what the effect below needs.
   */
  const onComplete = useRef(opts?.onComplete);
  useEffect(() => {
    onComplete.current = opts?.onComplete;
  });

  const done = useCallback(() => {
    setRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onComplete.current?.();
  }, []);

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
    // NOTE: elapsedMs is still deliberately absent from this list. It is the value this
    // effect writes; depending on it re-created the interval every tick and produced "3
    // cycles in 10 seconds" on an 11-second cycle. It is no longer read here, so the list
    // below is complete rather than suppressed.
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

/* ══ The record ═════════════════════════════════════════════════════════════════════════ */

/**
 * How the device's copy relates to the database, in the four states a screen can honestly
 * report. "offline" is not an error: the app is built to be used in aeroplane mode.
 */
export type SyncState = "local" | "syncing" | "synced" | "offline";

type StoreState = {
  sessions: SessionRecord[];
  counts: CountsByScreen;
  sync: SyncState;
  /** Writes accepted locally but not yet in the database. */
  pending: number;
  /** True once the device cache has been read, so a screen can tell "empty" from "loading". */
  ready: boolean;
  lastSyncedAt: number | null;
};

let state: StoreState = {
  sessions: [],
  counts: {},
  sync: "local",
  pending: 0,
  ready: false,
  lastSyncedAt: null,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): StoreState {
  return state;
}

const EMPTY_COUNTS: CountMap = {};

/* ── The device cache ───────────────────────────────────────────────────────────────── */

/**
 * The legacy single-day shape (`{ "<screen>": { day, count } }`) is read as well as the
 * current day→count map. It is the first release's format and a phone upgrading from it must
 * not lose its history — which is also why the cache is read before the network is touched.
 */
function normalizeCounts(raw: Record<string, unknown>): CountsByScreen {
  const out: CountsByScreen = {};
  for (const [screen, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    const legacy = value as { day?: unknown; count?: unknown };
    if (typeof legacy.day === "string" && typeof legacy.count === "number") {
      out[screen] = { [legacy.day]: legacy.count };
      continue;
    }
    const map: CountMap = {};
    for (const [day, count] of Object.entries(value as Record<string, unknown>)) {
      if (typeof count === "number" && Number.isFinite(count)) map[day] = count;
    }
    out[screen] = map;
  }
  return out;
}

async function readCache(): Promise<{ sessions: SessionRecord[]; counts: CountsByScreen }> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return { sessions: [], counts: {} };
    const parsed = JSON.parse(raw) as { sessions?: SessionRecord[]; counts?: Record<string, unknown> };
    return {
      sessions: (parsed.sessions ?? []).filter((s) => s && typeof s.at === "number").map(withClientId),
      counts: normalizeCounts(parsed.counts ?? {}),
    };
  } catch {
    // Corrupt or unreadable: start empty and let the database refill it. A lost cache is
    // better than a screen that will not open.
    return { sessions: [], counts: {} };
  }
}

/**
 * Cache writes are debounced. A mala tap updates state sixty times a minute, and serialising
 * five hundred sessions on every one of those taps is work the phone does not need to do —
 * the in-memory store is already correct, and the cache only has to be right by the time the
 * app is backgrounded.
 */
let cacheTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCacheWrite() {
  if (cacheTimer) clearTimeout(cacheTimer);
  cacheTimer = setTimeout(() => {
    cacheTimer = null;
    void AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ sessions: state.sessions, counts: state.counts }),
    ).catch(() => {});
  }, 400);
}

/* ── Sync ───────────────────────────────────────────────────────────────────────────── */

let started = false;
let syncInFlight: Promise<void> | null = null;
let syncAgain = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Start syncing, once, the first time any wellness screen mounts.
 *
 * Order matters here and is the whole offline-first contract: read the device cache and paint
 * immediately, upload anything the local-only build left behind, then push the queue and pull
 * the database. The network is never on the path to the first frame.
 */
export function startWellnessSync(): void {
  if (started) return;
  started = true;

  void (async () => {
    const token = await installToken();
    const cache = await readCache();
    setState({ sessions: cache.sessions, counts: cache.counts, ready: true });

    // One-time backfill: the history this phone accumulated before the database existed.
    // Every write in it is idempotent, so a half-finished backfill is safe to repeat.
    if (!(await hasBackfilled(token))) {
      for (const session of cache.sessions) {
        await enqueueWrite({
          kind: "session",
          clientId: session.clientId as string,
          screen: session.screen,
          at: session.at,
          minutes: session.minutes,
          units: session.units,
          label: session.label,
        });
      }
      for (const [screen, map] of Object.entries(cache.counts)) {
        for (const [day, count] of Object.entries(map)) {
          await enqueueWrite({ kind: "count", screen, day, count });
        }
      }
      await markBackfilled(token);
    }

    await syncNow();
  })();

  // Coming back to the app is the one moment a queued write has a good chance of getting out.
  AppState.addEventListener("change", (next) => {
    if (next === "active") void syncNow();
  });
}

/**
 * Coalesces a burst of writes into one sync pass. A mala round is 108 taps; one request after
 * the taps stop is the behaviour a person wants, not 108 requests while they count.
 */
function scheduleSync(delay = 1200) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncNow();
  }, delay);
}

/**
 * Push what is pending, then pull what the database has. Concurrent callers share one pass.
 *
 * A write enqueued *during* a pass cannot be in the queue that pass already read, so it sets
 * `syncAgain` and the pass repeats itself once it finishes. Without that, a tap that landed
 * mid-flush sat in the queue until the next tap or the next app foreground — which on a
 * counter screen is exactly the write a person would notice going missing.
 *
 * A pull that fails never overwrites the cache — `loadRemote` returns null for "could not
 * reach it", which is a different thing from "you have no data", and merging the second one
 * over a full cache is how an app appears to delete a person's history while offline.
 */
export function syncNow(): Promise<void> {
  if (syncInFlight) {
    syncAgain = true;
    return syncInFlight;
  }
  syncInFlight = runSync().finally(async () => {
    syncInFlight = null;
    if (syncAgain) {
      syncAgain = false;
      await syncNow();
    }
  });
  return syncInFlight;
}

async function runSync(): Promise<void> {
  setState({ sync: "syncing" });
  try {
    const token = await installToken();
    const queue = await readQueue();
    const { remaining, offline } = await pushPending(queue, token);
    if (queue.length) await writeQueue(remaining);

    if (offline) {
      setState({ sync: "offline", pending: remaining.length });
      return;
    }

    const remote = await loadRemote(token);
    if (!remote) {
      setState({ sync: "offline", pending: remaining.length });
      return;
    }

    mergeRemote(remote);
    setState({ sync: "synced", pending: remaining.length, lastSyncedAt: Date.now() });
  } catch {
    setState({ sync: "offline" });
  }
}

/**
 * Union the database's copy with the device's, letting the device win.
 *
 * The device is the newer of the two by construction: it holds every write the moment it
 * happens, including the ones still queued, while the database only has what has been pushed.
 * The database's purpose in this merge is to bring back the days the device no longer has.
 */
function mergeRemote(remote: RemoteData): void {
  const key = (s: SessionRecord) => s.clientId ?? `${s.screen}-${s.at}-${s.units}`;

  const byId = new Map<string, SessionRecord>();
  for (const session of remote.sessions) byId.set(key(session), session);
  for (const session of state.sessions) byId.set(key(session), session);

  const sessions = [...byId.values()].sort((a, b) => b.at - a.at).slice(0, MAX_SESSIONS);

  const counts: CountsByScreen = { ...remote.counts };
  for (const [screen, map] of Object.entries(state.counts)) {
    counts[screen] = { ...(counts[screen] ?? {}), ...map };
  }

  setState({ sessions, counts });
}

/* ── Writes ─────────────────────────────────────────────────────────────────────────── */

/**
 * Record a finished session. Local first, always: the row exists on screen before the network
 * is consulted, and the queue is what makes the database catch up later.
 */
export async function saveSession(entry: SessionRecord): Promise<void> {
  const record = withClientId({ ...entry, clientId: entry.clientId ?? newClientId(entry) });
  setState({ sessions: [record, ...state.sessions].slice(0, MAX_SESSIONS) });
  scheduleCacheWrite();

  await enqueueWrite({
    kind: "session",
    clientId: record.clientId as string,
    screen: record.screen,
    at: record.at,
    minutes: record.minutes,
    units: record.units,
    label: record.label,
  });
  scheduleSync(400);
}

/**
 * Move a counter for today. The stored number is absolute, so a tap and its replay are the
 * same write and "today" is decided here, at the moment of the tap — not at the moment the
 * screen was rendered.
 *
 * Returns the number the counter now holds, read from the store rather than from the caller's
 * render, so a screen that needs to react to a specific value (Japa's 108th bead) sees every
 * tap even when several land before React re-renders.
 */
export async function bumpCount(screen: string, delta: number, day = todayKeyOf()): Promise<number> {
  const current = state.counts[screen]?.[day] ?? 0;
  const next = Math.max(0, current + delta);
  setState({
    counts: { ...state.counts, [screen]: { ...(state.counts[screen] ?? {}), [day]: next } },
  });
  scheduleCacheWrite();
  await enqueueWrite({ kind: "count", screen, day, count: next });
  scheduleSync(1500);
  return next;
}

/**
 * Delete everything: the database rows first, then the device's copy.
 *
 * The order is deliberate. If the server cannot be reached the local wipe still happens (the
 * person asked for it), but the caller is told so the screen can say the delete was local
 * only rather than claiming a deletion that did not occur. The install token is kept, because
 * it is the only thing that could still reach any rows that survived.
 */
export async function eraseWellnessData(): Promise<{ remote: boolean }> {
  const token = await installToken();
  const remote = await deleteRemote(token);

  setState({ sessions: [], counts: {}, pending: 0, lastSyncedAt: Date.now(), sync: remote ? "synced" : "offline" });
  try {
    await AsyncStorage.multiRemove([CACHE_KEY, ...LEGACY_KEYS]);
  } catch {
    /* the in-memory store is already empty; the next launch would just re-read the cache */
  }
  await writeQueue([]);
  return { remote };
}

/* ── Hooks ──────────────────────────────────────────────────────────────────────────── */

/**
 * "Today", re-computed when the date actually turns over.
 *
 * The old store captured the day string once per render, so a counter left open past midnight
 * kept adding to the previous day. A timeout armed at the next local midnight costs nothing
 * and makes the number on the screen true.
 */
function useTodayKey(): string {
  const [day, setDay] = useState(todayKeyOf);
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const id = setTimeout(() => setDay(todayKeyOf()), next.getTime() - now.getTime() + 50);
    return () => clearTimeout(id);
  }, [day]);
  return day;
}

function useStoreState(): StoreState {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  useEffect(() => {
    startWellnessSync();
  }, []);
  return snapshot;
}

/**
 * Everything on the device, for a page that reports on all of it (Profile). Screens that show
 * one practice should use `useWellnessStore` instead.
 */
export function useWellnessOverview(): StoreState & { refresh: () => Promise<void> } {
  const snapshot = useStoreState();
  return useMemo(() => ({ ...snapshot, refresh: syncNow }), [snapshot]);
}

/**
 * One practice: its sessions, its counts, and the two writes that change them.
 *
 * The returned `save`/`bump` are module functions and therefore stable, so a screen can put
 * them in a dependency list without re-running an effect on every render.
 */
export function useWellnessStore(screen: string) {
  const snapshot = useStoreState();
  const todayKey = useTodayKey();

  const sessions = useMemo(
    () => snapshot.sessions.filter((s) => s.screen === screen),
    [snapshot.sessions, screen],
  );
  const countHistory = snapshot.counts[screen] ?? EMPTY_COUNTS;
  const countToday = countHistory[todayKey] ?? 0;
  const last = sessions[0] ?? null;

  const save = useCallback((entry: SessionRecord) => saveSession(entry), []);
  const bump = useCallback((delta: number) => bumpCount(screen, delta), [screen]);

  return useMemo(
    () => ({
      sessions,
      last,
      countToday,
      countHistory,
      todayKey,
      save,
      bump,
      sync: snapshot.sync,
      pending: snapshot.pending,
      ready: snapshot.ready,
      lastSyncedAt: snapshot.lastSyncedAt,
      refresh: syncNow,
    }),
    [sessions, last, countToday, countHistory, todayKey, save, bump, snapshot],
  );
}
