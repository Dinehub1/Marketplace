import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import {
  dateKey,
  estimate1RM,
  newRecords,
  prefillSets,
  minutesByDate,
  sessionsThisWeek,
  suggestion,
  suggestWeight,
  volume,
  weekStreak,
  type EntryLog,
  type Session,
} from './training.ts';

const entry = (exerciseId: string, sets: [number, number, boolean?][], targetReps = 8): EntryLog => ({
  exerciseId,
  targetReps,
  sets: sets.map(([weight, reps, done = true]) => ({ weight, reps, done })),
});
let n = 0;
const session = (date: string, entries: EntryLog[]): Session => {
  n += 1;
  return { id: `s${n}`, date, title: 'T', startedAt: n * 1000, endedAt: n * 1000 + 500, entries };
};

test('estimate1RM: one rep is the lift, Epley above, capped at 12 reps', () => {
  assert.equal(estimate1RM(100, 1), 100);
  assert.ok(Math.abs(estimate1RM(100, 3) - 110) < 1e-9);
  assert.equal(estimate1RM(100, 30), estimate1RM(100, 12));
  assert.equal(estimate1RM(0, 5), 0);
});

test('newRecords: first time doing an exercise is not a record', () => {
  const s = session('2026-01-01', [entry('bench', [[60, 8]])]);
  assert.deepEqual(newRecords(s, []), []);
});

test('newRecords: heavier weight is a weight record', () => {
  const before = [session('2026-01-01', [entry('bench', [[60, 8]])])];
  const r = newRecords(session('2026-01-03', [entry('bench', [[62.5, 5]])]), before);
  assert.deepEqual(r, [{ exerciseId: 'bench', kind: 'weight', value: 62.5, reps: 5 }]);
});

test('newRecords: same weight, more reps is an estimated-1RM record', () => {
  const before = [session('2026-01-01', [entry('bench', [[60, 8]])])];
  const r = newRecords(session('2026-01-03', [entry('bench', [[60, 10]])]), before);
  assert.equal(r.length, 1);
  assert.equal(r[0].kind, 'e1rm');
});

test('newRecords: sets not ticked off do not count', () => {
  const before = [session('2026-01-01', [entry('bench', [[60, 8]])])];
  assert.deepEqual(newRecords(session('2026-01-03', [entry('bench', [[100, 8, false]])]), before), []);
});

test('suggestWeight: double progression', () => {
  assert.equal(suggestWeight(entry('x', [[60, 8], [60, 8]]), 8), 62.5, 'all reps hit: add 2.5');
  assert.equal(suggestWeight(entry('x', [[60, 8], [60, 6]]), 8), 60, 'missed reps: repeat');
  assert.equal(suggestWeight(entry('x', [[10, 12]]), 12), 11, 'light lift: add 1');
  assert.equal(suggestWeight(entry('x', [[0, 12]]), 12), 0, 'bodyweight stays 0');
  assert.equal(suggestWeight(null, 8), 0);
});

test('prefillSets: uses the most recent session, nothing marked done', () => {
  const sessions = [
    session('2026-01-01', [entry('row', [[40, 10], [40, 10]], 10)]),
    session('2026-01-05', [entry('row', [[50, 10], [50, 10]], 10)]),
  ];
  const sets = prefillSets({ exerciseId: 'row', sets: 3, reps: 10 }, sessions);
  assert.equal(sets.length, 3);
  assert.ok(sets.every((s) => s.weight === 52.5 && s.reps === 10 && !s.done));
});

test('volume counts only completed sets', () => {
  assert.equal(volume(session('2026-01-01', [entry('a', [[50, 10], [50, 10, false]])])), 500);
});

test('dateKey is the local calendar date', () => {
  assert.equal(dateKey(new Date(2026, 0, 2, 0, 30)), '2026-01-02');
});

test('week helpers: Monday-start week and streak', () => {
  const wed = new Date(2026, 9, 7); // Wednesday 7 Oct 2026
  const s = [
    session('2026-10-05', []), // Mon this week
    session('2026-10-04', []), // Sun last week
    session('2026-09-15', []), // after a week off
  ];
  assert.equal(sessionsThisWeek(s, wed).length, 1);
  assert.equal(weekStreak(s, wed), 2);
  // A week with nothing yet does not break the streak.
  assert.equal(weekStreak([session('2026-10-04', [])], wed), 1);
});

test('starter plan only references exercises that exist in the library', () => {
  const lib = JSON.parse(fs.readFileSync(new URL('../data/exercises.json', import.meta.url), 'utf8')) as { id: string }[];
  const ids = new Set(lib.map((e) => e.id));
  const src = fs.readFileSync(new URL('./store.tsx', import.meta.url), 'utf8');
  const plan = src.slice(src.indexOf('STARTER_ROUTINES'), src.indexOf('const INITIAL'));
  const used = [...plan.matchAll(/\['(\d{4})'/g)].map((m) => m[1]);
  assert.ok(used.length >= 15, `found ${used.length} starter exercises`);
  for (const id of used) assert.ok(ids.has(id), `starter plan id ${id} is not in the library`);
});

test('suggestion explains itself', () => {
  assert.deepEqual(suggestion(null, 8), { weight: 0, reason: 'first' });
  assert.deepEqual(suggestion(entry('x', [[85, 8], [85, 8]]), 8), { weight: 87.5, reason: 'up' });
  assert.deepEqual(suggestion(entry('x', [[85, 8], [85, 7]]), 8), { weight: 85, reason: 'repeat' });
  assert.deepEqual(suggestion(entry('x', [[0, 12]]), 8), { weight: 0, reason: 'bodyweight' });
});

test('minutesByDate sums sessions on the same day', () => {
  const a = session('2026-01-01', []);
  const b = session('2026-01-01', []);
  a.endedAt = a.startedAt + 30 * 60000;
  b.endedAt = b.startedAt + 15 * 60000;
  assert.equal(minutesByDate([a, b]).get('2026-01-01'), 45);
});
