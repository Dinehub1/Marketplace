/**
 * What the wellness screens know about you — computed on the device, from the sessions
 * they already store.
 *
 * Why this exists: every app in this category that people keep is the one that answers
 * "am I getting anywhere?" — a streak, a week of bars, a year of dots (see
 * docs/wellness-app-reference.md for the reference audit: Streaks, Habitify, Breathwrk and
 * Apple Fitness all lead with exactly these three). We had none of it: the screens counted
 * a session and forgot.
 *
 * Everything here is derived, never stored twice: the source of truth is the session list
 * in `lib/session.ts`, so a change to how a session is recorded cannot leave the stats
 * telling a different story.
 */
import type { SessionRecord } from "./session";

export type DayBucket = { day: string; count: number; minutes: number };

const DAY_MS = 86_400_000;

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The last `days` days, oldest first, with a zero for the days nothing happened. */
export function dailyBuckets(sessions: SessionRecord[], days: number, now = Date.now()): DayBucket[] {
  const byDay = new Map<string, { count: number; minutes: number }>();
  for (const s of sessions) {
    const k = dayKey(s.at);
    const cur = byDay.get(k) ?? { count: 0, minutes: 0 };
    byDay.set(k, { count: cur.count + 1, minutes: cur.minutes + Math.max(0, s.minutes) });
  }
  const out: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(now - i * DAY_MS);
    const v = byDay.get(k) ?? { count: 0, minutes: 0 };
    out.push({ day: k, count: v.count, minutes: v.minutes });
  }
  return out;
}

/**
 * Consecutive days ending today (or yesterday — a streak is not broken until a whole day
 * has been missed, which is how every app in this category does it).
 */
export function streak(sessions: SessionRecord[], now = Date.now()): { current: number; best: number } {
  const days = new Set(sessions.map((s) => dayKey(s.at)));
  let current = 0;
  const start = days.has(dayKey(now)) ? now : now - DAY_MS;
  for (let i = 0; ; i++) {
    if (!days.has(dayKey(start - i * DAY_MS))) break;
    current++;
  }
  // Best: walk the distinct days in order and find the longest unbroken run.
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(`${d}T00:00:00Z`);
    run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return { current, best };
}

export function totals(sessions: SessionRecord[]) {
  const count = sessions.length;
  const minutes = sessions.reduce((n, s) => n + Math.max(0, s.minutes), 0);
  const units = sessions.reduce((n, s) => n + Math.max(0, s.units), 0);
  return { count, minutes, units };
}

/** This week against last week — the comparison that makes a number mean something. */
export function weekOverWeek(sessions: SessionRecord[], now = Date.now()) {
  const week = 7 * DAY_MS;
  const inRange = (from: number, to: number) => sessions.filter((s) => s.at > from && s.at <= to);
  const thisWeek = inRange(now - week, now);
  const lastWeek = inRange(now - 2 * week, now - week);
  return {
    thisWeek: thisWeek.length,
    lastWeek: lastWeek.length,
    minutesThisWeek: thisWeek.reduce((n, s) => n + s.minutes, 0),
    delta: thisWeek.length - lastWeek.length,
  };
}

/** The most recent N sessions, newest first, shaped for a list row. */
export function recent(sessions: SessionRecord[], n = 5) {
  return [...sessions].sort((a, b) => b.at - a.at).slice(0, n);
}

export function whenLabel(at: number, now = Date.now()): string {
  const days = Math.floor((now - at) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** The same buckets, for a screen that counts taps instead of saving sessions. */
export function dailyBucketsFromCounts(counts: Record<string, number>, days: number, now = Date.now()): DayBucket[] {
  const out: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(now - i * DAY_MS);
    const c = counts[k] ?? 0;
    out.push({ day: k, count: c, minutes: 0 });
  }
  return out;
}

/** A streak for a counter: a day counts when its number is above zero. */
export function streakFromCounts(counts: Record<string, number>, now = Date.now()): { current: number; best: number } {
  const fake = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([day]) => ({ day, at: Date.parse(`${day}T00:00:00Z`), minutes: 0, units: 0 }));
  return streak(fake as never, now);
}
