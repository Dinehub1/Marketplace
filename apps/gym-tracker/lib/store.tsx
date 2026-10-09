import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  dateKey,
  newRecords,
  prefillSets,
  type EntryLog,
  type PlanItem,
  type Record,
  type Routine,
  type Schedule,
  type Session,
  type WeightEntry,
} from '@/lib/training';

/**
 * Everything the app knows, kept on the device. There is no account and no server: a workout
 * log is personal, and the app works the same in a basement gym with no signal.
 *
 * The plan is openGym-shaped: named routines, and a week schedule that points each day at one
 * routine or at rest, so one routine can run on several days.
 */
export type Settings = { unit: 'kg' | 'lb'; restSeconds: number; goalKg: number | null; keepAwake: boolean };
export type ActiveWorkout = Omit<Session, 'endedAt'> & {
  routineId: string | null;
  restUntil: number | null;
  /** Length of the rest that is running, for the countdown bar. */
  restTotal: number;
  /** The exercise on screen. */
  index: number;
};

type State = {
  routines: Routine[];
  schedule: Schedule;
  sessions: Session[];
  weights: WeightEntry[];
  settings: Settings;
  active: ActiveWorkout | null;
};

const KEY = 'gym-tracker/v2';

const routine = (id: string, name: string, icon: Routine['icon'], items: [string, number, number][]): Routine => ({
  id,
  name,
  icon,
  items: items.map(([exerciseId, sets, reps]) => ({ exerciseId, sets, reps })),
});

/** A plain push / pull / legs week to start from. Every id is checked against the library by `npm test`. */
export const STARTER_ROUTINES: Routine[] = [
  routine('push', 'Push Day', 'push', [['0025', 4, 8], ['0314', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0201', 3, 12]]),
  routine('pull', 'Pull Day', 'pull', [['0032', 3, 5], ['0652', 3, 8], ['0861', 3, 10], ['0293', 3, 10], ['0031', 3, 12]]),
  routine('legs', 'Leg Day', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0336', 3, 10], ['0585', 3, 12], ['0586', 3, 12]]),
];
const STARTER_SCHEDULE: Schedule = [null, 'push', null, 'pull', null, 'legs', null];

const INITIAL: State = {
  routines: STARTER_ROUTINES,
  schedule: STARTER_SCHEDULE,
  sessions: [],
  weights: [],
  settings: { unit: 'kg', restSeconds: 90, goalKg: null, keepAwake: true },
  active: null,
};

type Obj = { [key: string]: unknown };
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Stored state, field by field: anything missing or of the wrong shape falls back to the default
 * rather than reaching a screen as `undefined`. Saved data outlives app versions, so it is never
 * trusted to match this one.
 */
export function hydrate(raw: unknown): State {
  if (!isObj(raw)) return INITIAL;
  const arr = <T,>(v: unknown, ok: (x: unknown) => boolean, fallback: T[]): T[] =>
    Array.isArray(v) ? (v.filter(ok) as T[]) : fallback;
  const routines = arr<Routine>(
    raw.routines,
    (r) => isObj(r) && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.items),
    INITIAL.routines,
  ).map((r) => ({ ...r, icon: r.icon ?? 'full', items: r.items.filter((i) => isObj(i) && typeof i.exerciseId === 'string') }));
  const ids = new Set(routines.map((r) => r.id));
  const schedule =
    Array.isArray(raw.schedule) && raw.schedule.length === 7
      ? raw.schedule.map((d: unknown) => (typeof d === 'string' && ids.has(d) ? d : null))
      : INITIAL.schedule;
  const sessions = arr<Session>(
    raw.sessions,
    (s) => isObj(s) && typeof s.date === 'string' && Array.isArray(s.entries) && s.entries.every((e: unknown) => isObj(e) && Array.isArray(e.sets)),
    [],
  );
  const weights = arr<WeightEntry>(raw.weights, (w) => isObj(w) && typeof w.date === 'string' && typeof w.kg === 'number', []);
  const settings = { ...INITIAL.settings, ...(isObj(raw.settings) ? raw.settings : {}) } as Settings;
  const a = raw.active;
  const active =
    isObj(a) && Array.isArray(a.entries) && a.entries.every((e: unknown) => isObj(e) && Array.isArray(e.sets))
      ? ({ restUntil: null, restTotal: 0, index: 0, routineId: null, ...a } as ActiveWorkout)
      : null;
  return { routines, schedule, sessions, weights, settings, active };
}

type Store = State & {
  ready: boolean;
  routineById: (id: string | null | undefined) => Routine | undefined;
  saveRoutine: (r: Routine) => void;
  createRoutine: (name: string) => string;
  deleteRoutine: (id: string) => void;
  addToRoutine: (routineId: string, exerciseId: string) => void;
  setScheduleDay: (weekday: number, routineId: string | null) => void;
  logWeight: (kg: number, date?: string) => void;
  deleteWeight: (date: string) => void;
  startWorkout: (routineId: string | null) => void;
  updateActive: (fn: (w: ActiveWorkout) => ActiveWorkout) => void;
  finishWorkout: () => { session: Session; records: Record[] } | null;
  discardWorkout: () => void;
  deleteSession: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);
  // finishWorkout returns a value computed from the latest state, so it reads this ref rather
  // than a possibly stale closure.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((json) => {
        if (json) setState(hydrate(JSON.parse(json)));
      })
      .catch(() => {
        // Unreadable storage starts fresh rather than leaving the app on a blank screen.
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    // Saving before the load finishes would overwrite the stored log with the empty initial state.
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const set = useCallback((fn: (s: State) => State) => setState(fn), []);

  const store = useMemo<Store>(
    () => ({
      ...state,
      ready,
      routineById: (id) => (id ? state.routines.find((r) => r.id === id) : undefined),
      saveRoutine: (r) => set((s) => ({ ...s, routines: s.routines.map((x) => (x.id === r.id ? r : x)) })),
      createRoutine: (name) => {
        const id = `r${Date.now().toString(36)}`;
        set((s) => ({ ...s, routines: [...s.routines, { id, name, icon: 'full', items: [] }] }));
        return id;
      },
      deleteRoutine: (id) =>
        set((s) => ({
          ...s,
          routines: s.routines.filter((r) => r.id !== id),
          schedule: s.schedule.map((d) => (d === id ? null : d)),
        })),
      addToRoutine: (routineId, exerciseId) =>
        set((s) => ({
          ...s,
          routines: s.routines.map((r) =>
            r.id === routineId ? { ...r, items: [...r.items, { exerciseId, sets: 3, reps: 10 } satisfies PlanItem] } : r,
          ),
        })),
      setScheduleDay: (weekday, routineId) =>
        set((s) => ({ ...s, schedule: s.schedule.map((d, i) => (i === weekday ? routineId : d)) })),
      logWeight: (kg, date = dateKey()) =>
        set((s) => ({
          ...s,
          weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date)),
        })),
      deleteWeight: (date) => set((s) => ({ ...s, weights: s.weights.filter((w) => w.date !== date) })),
      startWorkout: (routineId) =>
        set((s) => {
          const r = routineId ? s.routines.find((x) => x.id === routineId) : undefined;
          const entries: EntryLog[] = (r?.items ?? []).map((item) => ({
            exerciseId: item.exerciseId,
            targetReps: item.reps,
            sets: prefillSets(item, s.sessions),
          }));
          const now = Date.now();
          return {
            ...s,
            active: {
              id: `w${now}`,
              date: dateKey(),
              title: r?.name ?? 'Quick workout',
              routineId: r?.id ?? null,
              startedAt: now,
              entries,
              restUntil: null,
              restTotal: 0,
              index: 0,
            },
          };
        }),
      updateActive: (fn) => set((s) => (s.active ? { ...s, active: fn(s.active) } : s)),
      finishWorkout: () => {
        const s = latest.current;
        if (!s.active) return null;
        const { restUntil: _r, restTotal: _t, index: _i, routineId: _id, ...rest } = s.active;
        const session: Session = {
          ...rest,
          endedAt: Date.now(),
          // Exercises with no completed set were skipped; keeping them would show empty rows in history.
          entries: rest.entries.filter((e) => e.sets.some((x) => x.done)),
        };
        const records = newRecords(session, s.sessions);
        const next = { ...s, active: null, sessions: session.entries.length ? [...s.sessions, session] : s.sessions };
        latest.current = next;
        setState(next);
        return { session, records };
      },
      discardWorkout: () => set((s) => ({ ...s, active: null })),
      deleteSession: (id) => set((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) })),
      updateSettings: (patch) => set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      resetAll: () => set(() => INITIAL),
    }),
    [state, ready, set],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Monday first, the way most people think about a training week. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
