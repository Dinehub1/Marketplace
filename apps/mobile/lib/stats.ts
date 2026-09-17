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
 *
 * A day is the person's local day, everywhere. This file used to compute buckets in UTC
 * while the counters filed their numbers under the local date, which meant that between
 * midnight and 05:30 in India the bar chart and the glasses count were looking at two
 * different days. Calendar arithmetic (`setDate`) rather than 86,400,000-millisecond
 * arithmetic also keeps the buckets right if this ever runs somewhere with a DST change.
 */
import type { SessionRecord } from "./session";

export type DayBucket = { day: string; count: number; minutes: number };

/** `YYYY-MM-DD` in the device's own timezone — the key every counter and chart shares. */
export function dayKeyOf(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** `ms` moved by whole calendar days, so a DST change cannot skip or repeat a bucket. */
function shiftDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Midnight local for a `YYYY-MM-DD` key. */
function parseDay(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
}

/** The last `days` days, oldest first, with a zero for the days nothing happened. */
export function dailyBuckets(sessions: SessionRecord[], days: number, now = Date.now()): DayBucket[] {
  const byDay = new Map<string, { count: number; minutes: number }>();
  for (const s of sessions) {
    const k = dayKeyOf(s.at);
    const cur = byDay.get(k) ?? { count: 0, minutes: 0 };
    byDay.set(k, { count: cur.count + 1, minutes: cur.minutes + Math.max(0, s.minutes) });
  }
  const out: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKeyOf(shiftDays(now, -i));
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
  const days = new Set(sessions.map((s) => dayKeyOf(s.at)));

  let current = 0;
  let cursor = days.has(dayKeyOf(now)) ? now : shiftDays(now, -1);
  while (days.has(dayKeyOf(cursor))) {
    current++;
    cursor = shiftDays(cursor, -1);
  }

  // Best: walk the distinct days in order and find the longest unbroken run.
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && parseDay(d) === shiftDays(parseDay(prev), 1) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
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
  const week = 7 * 86_400_000;
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
  const days = Math.round((parseDay(dayKeyOf(now)) - parseDay(dayKeyOf(at))) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** The same buckets, for a screen that counts taps instead of saving sessions. */
export function dailyBucketsFromCounts(counts: Record<string, number>, days: number, now = Date.now()): DayBucket[] {
  const out: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKeyOf(shiftDays(now, -i));
    out.push({ day: k, count: counts[k] ?? 0, minutes: 0 });
  }
  return out;
}

/**
 * A streak for a counter: a day counts when its number is above zero.
 *
 * The keys are already local day strings, so they are parsed as local midnights rather than
 * through `Date.parse(day + "T00:00:00Z")`, which filed a 1am IST glass under yesterday.
 */
export function streakFromCounts(counts: Record<string, number>, now = Date.now()): { current: number; best: number } {
  const fake = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([day]) => ({ day, at: parseDay(day), minutes: 0, units: 0 }));
  return streak(fake as never, now);
}
