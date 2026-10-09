/**
 * The training arithmetic: one-rep-max estimates, personal records, what to pre-fill from last
 * time, and when to add weight. Pure functions over plain data, so `npm test` can check them in
 * Node without a device. Every weight here is in kilograms; the screens convert for display.
 */

export type SetLog = { weight: number; reps: number; done: boolean };
export type EntryLog = { exerciseId: string; targetReps: number; sets: SetLog[] };
export type Session = {
  id: string;
  /** Local calendar date of the workout, YYYY-MM-DD. */
  date: string;
  title: string;
  startedAt: number;
  endedAt: number;
  entries: EntryLog[];
};

export type PlanItem = { exerciseId: string; sets: number; reps: number };
export type RoutineIcon = 'push' | 'pull' | 'legs' | 'upper' | 'core' | 'full';
export type Routine = { id: string; name: string; icon: RoutineIcon; items: PlanItem[] };
/** Seven routine ids (or null for rest), index 0 = Sunday to match Date#getDay. */
export type Schedule = (string | null)[];

export type WeightEntry = { date: string; kg: number };

export type Record = { exerciseId: string; kind: 'weight' | 'e1rm'; value: number; reps: number };

/** Epley's estimate. One rep is the lift itself; past 12 reps the estimate stops meaning much. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + Math.min(reps, 12) / 30);
}

const doneSets = (e: EntryLog) => e.sets.filter((s) => s.done && s.reps > 0);

/** Heaviest weight and best estimated 1RM ever completed, per exercise. */
export function bestByExercise(sessions: Session[]): Map<string, { weight: number; e1rm: number }> {
  const best = new Map<string, { weight: number; e1rm: number }>();
  for (const s of sessions) {
    for (const e of s.entries) {
      for (const set of doneSets(e)) {
        const cur = best.get(e.exerciseId) ?? { weight: 0, e1rm: 0 };
        best.set(e.exerciseId, {
          weight: Math.max(cur.weight, set.weight),
          e1rm: Math.max(cur.e1rm, estimate1RM(set.weight, set.reps)),
        });
      }
    }
  }
  return best;
}

/**
 * Records set by `session` against everything before it. An exercise done for the first time is
 * not a record: there is nothing to beat, and calling every first set a PR makes the word useless.
 */
export function newRecords(session: Session, before: Session[]): Record[] {
  const prior = bestByExercise(before);
  const out: Record[] = [];
  for (const e of session.entries) {
    const old = prior.get(e.exerciseId);
    if (!old) continue;
    const sets = doneSets(e).filter((s) => s.weight > 0);
    if (!sets.length) continue;
    const heaviest = sets.reduce((a, b) => (b.weight > a.weight ? b : a));
    if (heaviest.weight > old.weight) {
      out.push({ exerciseId: e.exerciseId, kind: 'weight', value: heaviest.weight, reps: heaviest.reps });
      continue;
    }
    const strongest = sets.reduce((a, b) =>
      estimate1RM(b.weight, b.reps) > estimate1RM(a.weight, a.reps) ? b : a,
    );
    const e1rm = estimate1RM(strongest.weight, strongest.reps);
    // A rounding-level gain is not a record.
    if (e1rm > old.e1rm + 0.01) {
      out.push({ exerciseId: e.exerciseId, kind: 'e1rm', value: e1rm, reps: strongest.reps });
    }
  }
  return out;
}

/** The most recent completed sets of an exercise, newest session first. */
export function lastPerformance(exerciseId: string, sessions: Session[]): EntryLog | null {
  const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
  for (const s of sorted) {
    const e = s.entries.find((x) => x.exerciseId === exerciseId);
    if (e && doneSets(e).length) return e;
  }
  return null;
}

/**
 * Double progression: once every working set reached the target reps at one weight, the next
 * session adds a step. Smaller lifts (under 20 kg) move by 1 kg, since 2.5 kg on a 6 kg dumbbell
 * is a 40% jump. A session that missed reps repeats the weight.
 */
export function suggestWeight(last: EntryLog | null, targetReps: number): number {
  if (!last) return 0;
  const sets = doneSets(last);
  if (!sets.length) return 0;
  const top = Math.max(...sets.map((s) => s.weight));
  if (top <= 0) return 0;
  const atTop = sets.filter((s) => s.weight === top);
  const allHit = atTop.every((s) => s.reps >= targetReps);
  if (!allHit) return top;
  return round(top + (top < 20 ? 1 : 2.5));
}

/** What to put on the bar next time, and why, for the hint under the exercise name. */
export function suggestion(
  last: EntryLog | null,
  targetReps: number,
): { weight: number; reason: 'first' | 'up' | 'repeat' | 'bodyweight' } {
  if (!last) return { weight: 0, reason: 'first' };
  const top = Math.max(0, ...doneSets(last).map((s) => s.weight));
  if (top <= 0) return { weight: 0, reason: 'bodyweight' };
  const next = suggestWeight(last, targetReps);
  return { weight: next, reason: next > top ? 'up' : 'repeat' };
}

/** Sets for a new workout entry: pre-filled with the suggested weight, nothing marked done. */
export function prefillSets(item: PlanItem, sessions: Session[]): SetLog[] {
  const weight = suggestWeight(lastPerformance(item.exerciseId, sessions), item.reps);
  return Array.from({ length: Math.max(1, item.sets) }, () => ({ weight, reps: item.reps, done: false }));
}

/** Kilograms moved: weight × reps over every completed set. */
export function volume(session: Session): number {
  let v = 0;
  for (const e of session.entries) for (const s of doneSets(e)) v += s.weight * s.reps;
  return v;
}

export function completedSetCount(session: Session): number {
  return session.entries.reduce((n, e) => n + doneSets(e).length, 0);
}

/** Local YYYY-MM-DD. toISOString would give the UTC date, which is yesterday east of Greenwich after midnight. */
export function dateKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Sessions in the Monday-start week containing `now`. */
export function sessionsThisWeek(sessions: Session[], now: Date = new Date()): Session[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const from = dateKey(start);
  const to = dateKey(now);
  return sessions.filter((s) => s.date >= from && s.date <= to);
}

/**
 * Consecutive weeks (ending this week or last) with at least one session. This week not having
 * a session yet does not break the streak, since the week is not over.
 */
export function weekStreak(sessions: Session[], now: Date = new Date()): number {
  const weeks = new Set(sessions.map((s) => mondayOf(parseDate(s.date))));
  let cursor = mondayOf(now);
  if (!weeks.has(cursor)) cursor = shiftWeek(cursor, -1);
  let n = 0;
  while (weeks.has(cursor)) {
    n += 1;
    cursor = shiftWeek(cursor, -1);
  }
  return n;
}

function parseDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function mondayOf(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dateKey(x);
}
function shiftWeek(key: string, by: number): string {
  const d = parseDate(key);
  d.setDate(d.getDate() + 7 * by);
  return dateKey(d);
}

/** Minutes trained per local date, for the activity heatmap. */
export function minutesByDate(sessions: Session[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sessions) {
    const min = Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000));
    out.set(s.date, (out.get(s.date) ?? 0) + min);
  }
  return out;
}

/** Best estimated 1RM per session for one exercise, oldest first, for its progress chart. */
export function e1rmSeries(exerciseId: string, sessions: Session[]): { date: string; value: number }[] {
  return [...sessions]
    .sort((a, b) => a.endedAt - b.endedAt)
    .map((s) => {
      const sets = s.entries.filter((e) => e.exerciseId === exerciseId).flatMap(doneSets);
      return { date: s.date, value: Math.max(0, ...sets.map((x) => estimate1RM(x.weight, x.reps))) };
    })
    .filter((p) => p.value > 0);
}

export const round = (n: number, step = 0.25) => Math.round(n / step) * step;

export const KG_PER_LB = 0.45359237;
export const toDisplay = (kg: number, unit: 'kg' | 'lb') => (unit === 'kg' ? kg : kg / KG_PER_LB);
export const fromDisplay = (v: number, unit: 'kg' | 'lb') => (unit === 'kg' ? v : v * KG_PER_LB);
/** A weight for display: whole numbers without decimals, others to one place. */
export function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  const v = toDisplay(kg, unit);
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
