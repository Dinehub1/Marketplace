/**
 * The wellness timer engine's arithmetic — and nothing else.
 *
 * ── Why this file is separate from `timer.ts` ─────────────────────────────────────────
 *
 * `timer.ts` holds the React hook: refs, an interval, an `AppState` subscription. This file
 * holds the numbers the hook is built out of. They are split because the numbers are the
 * part that can be wrong in a way nobody can see — a skip that lands one movement early, a
 * pause that silently drops ten seconds, a routine whose durations do not add up to the time
 * on the label — and the only way to check arithmetic is to run it.
 *
 * Every function here is pure: same inputs, same output, no clock of its own, no renderer,
 * no React Native import. That is what lets `scripts/check-timer.mjs` assert the engine's
 * behaviour in plain Node, and it is why the module has no imports at all.
 *
 * The rule for adding to this file: if it needs `Date.now()`, it does not belong here — take
 * `now` as a parameter instead.
 */

/** One timed step. `seconds` may be fractional — Breathe's coherent pattern is 5.5s. */
export type Phase = { key: string; label: string; seconds: number };

/** The four states a sequence can be in. */
export type TimerStatus = "idle" | "running" | "paused" | "completed";

/**
 * The three timestamps that define a sequence's position.
 *
 * `startedAt` is null until the first `start()`. `pausedAt` is non-null only while paused.
 * `bankedPauseMs` is the total of every *completed* pause.
 */
export type Clock = {
  startedAt: number | null;
  pausedAt: number | null;
  bankedPauseMs: number;
};

/**
 * The clock, as a pure function of four numbers.
 *
 * This single expression is the invariant the whole engine rests on:
 *
 *     elapsed = now - startedAt - bankedPause
 *
 * A missing tick cannot affect it, because no tick is involved. A backgrounded app cannot
 * lose time, because the timestamps were never suspended. A pause cannot lose or gain time,
 * because the frozen span is added to the subtrahend rather than thrown away.
 *
 * `pausedAt` overrides `now` while paused, which is what freezes the display while still
 * letting the component re-render. The result is clamped at zero because a device clock can
 * be moved backwards (NTP sync, a timezone change, the user setting the time) and a negative
 * elapsed time draws a progress bar pointing off the left of the screen.
 */
export function elapsedAt(clock: Clock, now: number): number {
  if (clock.startedAt == null) return 0;
  const until = clock.pausedAt ?? now;
  return Math.max(0, until - clock.startedAt - clock.bankedPauseMs);
}

/**
 * Which phase `elapsedMs` falls inside, and how far into it we are.
 *
 * A forward scan over absolute boundaries rather than a chain of comparisons against
 * cumulative sums, so a zero-second phase (a pattern with no hold, or an inhale trimmed to
 * nothing by the session length) is skipped rather than capturing a boundary it should not
 * own.
 *
 * Past the end it reports the *last* phase with `intoMs` pinned to that phase's length. That
 * matters for the completion render: the screen is still showing the final movement's name
 * and a full progress bar at the moment the sequence ends, and an `undefined` phase there
 * would blank the title for one frame.
 */
export function positionAt(phases: Phase[], elapsedMs: number): { index: number; intoMs: number } {
  let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    const span = phases[i].seconds * 1000;
    if (elapsedMs < acc + span) return { index: i, intoMs: elapsedMs - acc };
    acc += span;
  }
  const last = phases.length - 1;
  if (last < 0) return { index: 0, intoMs: 0 };
  return { index: last, intoMs: phases[last].seconds * 1000 };
}

/** Total length of a phase list, in milliseconds. */
export function totalMsOf(phases: Phase[]): number {
  return phases.reduce((n, p) => n + Math.max(0, p.seconds) * 1000, 0);
}

/**
 * Milliseconds into a sequence at which `index` begins.
 *
 * Used to rebase the clock in `goTo`, which is how "skip" and "previous" are exact rather
 * than approximate: the engine redefines `startedAt` so that `elapsedAt` returns exactly this
 * offset, instead of nudging a counter and hoping.
 */
export function offsetOf(phases: Phase[], index: number): number {
  let offset = 0;
  for (let k = 0; k < Math.min(index, phases.length); k++) {
    offset += Math.max(0, phases[k].seconds) * 1000;
  }
  return offset;
}

/**
 * `m:ss` for a duration.
 *
 * Shared so no screen formats a countdown its own way: the bug this prevents is one screen
 * showing "0:9" and another "00:09", which is the kind of inconsistency nobody reports and
 * everybody notices. Negative and fractional inputs are floored rather than trusted, because
 * both occur at a phase boundary.
 */
export function mmss(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * Whether a clock has reached the end of a sequence.
 *
 * Extracted rather than inlined into the hook so the boundary — exactly at the total, not one
 * millisecond before — is asserted directly.
 */
export function isFinished(elapsedMs: number, totalMs: number): boolean {
  return totalMs > 0 && elapsedMs >= totalMs;
}
