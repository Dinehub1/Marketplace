/**
 * The wellness app's timer engine — one clock, four screens.
 *
 * Breathe, Stretch, Walk and Sleep are the same machine: a list of timed phases, a
 * countdown, a haptic at each turn, a completion that files one session. Written once
 * here so a fix lands in all of them.
 *
 * ── Why this is a rewrite, not a patch ────────────────────────────────────────────────
 *
 * The previous engine counted by *accumulating interval ticks*. That is the root cause of
 * every timing bug this app has had, and it is worth naming precisely:
 *
 *   * **It drifted.** `setInterval(…, 100)` does not fire on a 100ms grid. Under load it
 *     fires late, and a counter that trusts the tick count runs slow — a "5 minute"
 *     session took longer than five minutes and the elapsed clock disagreed with the wall
 *     clock.
 *   * **It froze in the background.** iOS suspends JavaScript when the app is not
 *     foregrounded. A tick-accumulating clock simply stops, so a stretch left running
 *     while the phone was locked came back stuck on the movement it was suspended on. The
 *     person had been stretching for two minutes and the screen still said "00:30".
 *   * **It could not pause.** There was `start()` and `stop()` and nothing between, which
 *     is why the screens had no pause button: the engine could not express one.
 *   * **Completion could fire more than once.** `clearInterval` inside the callback does
 *     not stop a tick that is already executing, so a slow frame near the end ran the
 *     completion path twice and saved two sessions for one stretch.
 *   * **`elapsed` went backwards.** `start()` reset `startedAt` and elapsed together, so
 *     resuming a paused session restarted the clock at zero.
 *
 * ── The invariant ─────────────────────────────────────────────────────────────────────
 *
 * **The clock is derived from timestamps, never from ticks.** The interval does exactly
 * one job: ask React to re-render. Every number on screen is computed by
 *
 *     elapsed = now - startedAt - accumulatedPausedMs
 *
 * so a missed tick, a slow frame or a two-minute backgrounding changes nothing: the next
 * render computes the correct elapsed time from `Date.now()`, and if the phase has moved
 * on — or the whole sequence has finished — that is discovered immediately rather than
 * being waited for tick by tick.
 *
 * This is what makes backgrounding work rather than merely not-crash: `AppState` returning
 * to `active` forces an immediate `sync()`, so the screen catches up the instant the app is
 * unlocked instead of on the next 100ms tick.
 *
 * ── What each state means ─────────────────────────────────────────────────────────────
 *
 *   idle      — never started, or reset. `elapsed` is 0.
 *   running   — the clock is advancing from `startedAt`, less any paused time banked so far.
 *   paused    — the clock is frozen at the moment `pause()` was called. `pausedAt` is set,
 *               and `resume()` banks that span into `accumulatedPausedMs`.
 *   completed — the sequence reached its total. The clock is pinned to the total, so
 *               `elapsed` can never overshoot the length of the routine.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import {
  elapsedAt,
  isFinished,
  mmss,
  offsetOf,
  positionAt,
  totalMsOf,
  type Clock,
  type Phase,
  type TimerStatus,
} from "./timer-core";

/**
 * The pure arithmetic lives in `./timer-core` — no React, no React Native, so it can be
 * asserted in plain Node (`scripts/check-timer.mjs`). Re-exported here because every screen
 * already imports from this module and there is no reason for four screens to know that the
 * numbers and the hook live in two files.
 */
export {
  elapsedAt,
  isFinished,
  mmss,
  offsetOf,
  positionAt,
  totalMsOf,
  type Clock,
  type Phase,
  type TimerStatus,
};

/**
 * How often the screen is asked to re-render.
 *
 * This is a *refresh* rate, not a time source: a slower interval costs accuracy nothing and
 * saves battery, because every value is recomputed from timestamps on each render. 100ms is
 * chosen so the circle animation and the seconds countdown look continuous.
 */
const TICK_MS = 100;

function buzz(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  Haptics.impactAsync(style).catch(() => {});
}

function success() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** True when a screen has replaced the engine's own phase feedback with its own. */
type PhaseFeedback = "engine" | "screen";

export type Sequence = {
  status: TimerStatus;
  running: boolean;
  paused: boolean;
  completed: boolean;
  /** Index of the current phase. Valid in every state — idle shows phase 0. */
  index: number;
  /** The current phase object, never undefined for a non-empty list. */
  phase: Phase | undefined;
  /**
   * The phase after the current one, or null on the last.
   *
   * Named `nextPhase` rather than `next` because `next` is a control below: an object with
   * both would have one property silently shadowing the other, which is exactly what the
   * first draft of this type did.
   */
  nextPhase: Phase | null;
  /** Whole seconds left in the current phase, rounded up, never negative. */
  secondsLeft: number;
  /** Milliseconds elapsed in the current phase. */
  phaseMs: number;
  /** Milliseconds left in the current phase. Exposed so a caller can size a phase animation
   *  without reaching for `phaseMs` and having to recompute the phase length itself. */
  phaseRemainingMs: number;
  /** Milliseconds elapsed across the whole sequence, clamped to the total. */
  elapsedMs: number;
  /** Milliseconds left across the whole sequence. */
  remainingMs: number;
  /** Whole seconds left across the whole sequence. */
  remainingSeconds: number;
  /** 0→1 across the whole sequence. Safe to feed straight into a progress bar. */
  progress: number;
  /** 0→1 across the *current* phase, for the per-movement bar. */
  phaseProgress: number;
  /** `m:ss` across the whole sequence. */
  clock: string;
  /** Total sequence length in seconds. */
  totalSeconds: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Pause if running, resume if paused. The one control a big circle binds to. */
  toggle: () => void;
  /** End the session early, keeping the elapsed time (the screens file a partial session). */
  finish: () => void;
  /** Jump to a specific phase, continuing from its start if running. */
  goTo: (index: number) => void;
  /** Advance one phase. Skipping past the last phase completes the sequence. */
  next: () => void;
  /** Step back one phase. At phase 0 this restarts the current phase. */
  previous: () => void;
  /** Back to idle, clock at zero. */
  reset: () => void;
};

/**
 * The clock.
 *
 * @param phases     The steps to run through. Changing the list mid-run is safe: the clock
 *                   keeps its position and the total is recomputed.
 * @param opts.onComplete Called **exactly once** when the sequence reaches its end. Held in
 *                   a ref, so an inline arrow function does not tear down the ticker.
 * @param opts.onPhase    Called when the current phase changes, with the new index. This is
 *                   where a screen puts its phase-transition haptic — the engine no longer
 *                   decides that every screen wants the same one.
 * @param opts.feedback  Who provides the phase-turn feedback.
 *
 *                   `"engine"` (the default) keeps the light impact this always fired, so the
 *                   four screens that predate the sound work unchanged. `"screen"` silences it
 *                   because the screen has a *better* signature — Breathe plays a rising tone
 *                   on the inhale and a falling one on the exhale, and a generic buzz landing
 *                   on the same beat only muddies it. A screen that asks for `"screen"` must
 *                   do something in `onPhase`; the engine cannot check that, so it is written
 *                   down here instead.
 */
export function useSequence(
  phases: Phase[],
  opts?: {
    onComplete?: () => void;
    onPhase?: (index: number, phase: Phase) => void;
    feedback?: PhaseFeedback;
  },
): Sequence {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [index, setIndex] = useState(0);

  /**
   * The clock's three timestamps. Refs, not state, because they are read inside the
   * ticker and written by controls: putting them in state would make every control a
   * re-render trigger for values nothing renders directly.
   */
  const startedAt = useRef<number | null>(null);
  const pausedAt = useRef<number | null>(null);
  const accumulatedPausedMs = useRef(0);
  /** Guards the completion path. Reset only by `start`. See the module note on duplicates. */
  const hasCompleted = useRef(false);
  /**
   * The last phase index already announced to the screen.
   *
   * A ref rather than a comparison against `index`, because the announcement now happens in `sync`
   * *before* the state update is committed — comparing against the state would re-announce the same
   * phase on every tick until React flushed, which is the duplicate-feedback bug in a new costume.
   * `-1` rather than `0`: the first phase must be announced, and `0` would swallow it.
   */
  const announcedIndex = useRef(-1);

  const totalMs = useMemo(() => totalMsOf(phases), [phases]);
  const totalSeconds = totalMs / 1000;

  /**
   * Callbacks live in refs so their identity never reaches a dependency array. This is the
   * fix the old engine documented and it is preserved deliberately: an inline
   * `{ onComplete }` object is a new value every render, and depending on it re-armed the
   * interval on every tick.
   */
  const onComplete = useRef(opts?.onComplete);
  const onPhase = useRef(opts?.onPhase);
  const feedback = useRef(opts?.feedback);
  useEffect(() => {
    onComplete.current = opts?.onComplete;
    onPhase.current = opts?.onPhase;
    feedback.current = opts?.feedback;
  });

  /**
   * Read the clock as of `now`. The single source of every displayed number.
   *
   * Clamped at the low end because a device clock can be adjusted backwards (NTP sync,
   * the user changing the time, a timezone change) and a negative elapsed time would draw
   * a progress bar pointing off the left of the screen.
   */
  const readElapsed = useCallback(
    (now: number): number =>
      elapsedAt(
        {
          startedAt: startedAt.current,
          pausedAt: pausedAt.current,
          bankedPauseMs: accumulatedPausedMs.current,
        },
        now,
      ),
    [],
  );

  /**
   * One pass: recompute elapsed, derive the phase, and complete if we are past the end.
   *
   * Called from the interval *and* from the AppState listener. Both paths go through the
   * same code, so "woke up from the background" and "the tick fired" cannot disagree.
   */
  const sync = useCallback(
    (now: number) => {
      const next = totalMs > 0 ? Math.min(readElapsed(now), totalMs) : readElapsed(now);
      setElapsedMs(next);

      const at = positionAt(phases, next);
      /*
       * The phase change is reported here, in `sync` — **not** inside a `setIndex` updater.
       *
       * This is a fix, and the bug was real before any sound existed. `setIndex(prev => …)` is a
       * *render-phase* callback: React may invoke it while building the next tree, and it may invoke
       * it more than once for a single update (it re-runs updaters in development to surface
       * impurity, and a discarded concurrent render re-runs them too). A haptic fired from there was
       * already a side effect during render; once the screens began playing a tone and a spoken word
       * from the same place it became a crash — audio started while React was rendering, and
       * sometimes started twice.
       *
       * The ref is what keeps it exactly-once. The index stays state React owns; the ref only records
       * which index has already been *announced*.
       */
      if (announcedIndex.current !== at.index) {
        announcedIndex.current = at.index;
        const phase = phases[at.index];
        // Once per real transition rather than once per skipped phase: catching up after a
        // background gap jumps several phases at once and should buzz once. A screen with its own
        // feedback signature (`feedback: "screen"`) silences this one and does the equivalent in
        // `onPhase`.
        if (phase) {
          if (feedback.current !== "screen") buzz();
          onPhase.current?.(at.index, phase);
        }
      }
      setIndex(at.index);

      if (isFinished(next, totalMs) && !hasCompleted.current) {
        hasCompleted.current = true;
        setStatus("completed");
        success();
        onComplete.current?.();
      }
    },
    [phases, totalMs, readElapsed],
  );

  /**
   * The ticker. Its only job is to ask for a re-render; `sync` derives everything.
   *
   * `syncRef` holds the current `sync` so the effect can depend on `status` alone. Without
   * it, `sync` changing identity (which it does whenever `phases` does) would re-arm the
   * interval — the recreate-on-every-render bug, in a new costume.
   */
  const syncRef = useRef(sync);
  useEffect(() => {
    syncRef.current = sync;
  });

  useEffect(() => {
    if (status !== "running") return;
    // Paint immediately: a `start()` followed by an untouched screen for 100ms reads as a
    // dead button.
    syncRef.current(Date.now());
    const id = setInterval(() => syncRef.current(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [status]);

  /**
   * Catch up when the app comes back.
   *
   * iOS suspends JavaScript while the app is not foregrounded, so the interval above
   * simply stops. The timestamps do not. On `active` we run one `sync` against `Date.now()`
   * and the display jumps to where it should have been all along — including completing
   * the routine, if that is where the clock now says we are.
   *
   * Guarded on `status === "running"`: a paused session must stay frozen across a
   * background, which is the entire point of pausing.
   */
  useEffect(() => {
    if (status !== "running") return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") syncRef.current(Date.now());
    });
    return () => sub.remove();
  }, [status]);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    pausedAt.current = null;
    accumulatedPausedMs.current = 0;
    hasCompleted.current = false;
    // Re-armed so the first phase of the new session is announced: `sync` runs immediately after
    // this, and `-1` is what makes it see a change.
    announcedIndex.current = -1;
    setElapsedMs(0);
    setIndex(0);
    setStatus("running");
  }, []);

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== "running") return prev;
      pausedAt.current = Date.now();
      return "paused";
    });
  }, []);

  const resume = useCallback(() => {
    setStatus((prev) => {
      if (prev !== "paused") return prev;
      // Bank the frozen span, then start counting again. Elapsed is continuous across the
      // pause because the span is added to the subtrahend rather than lost.
      if (pausedAt.current != null) {
        accumulatedPausedMs.current += Date.now() - pausedAt.current;
        pausedAt.current = null;
      }
      return "running";
    });
  }, []);

  const toggle = useCallback(() => {
    setStatus((prev) => {
      if (prev === "running") {
        pausedAt.current = Date.now();
        return "paused";
      }
      if (prev === "paused") {
        if (pausedAt.current != null) {
          accumulatedPausedMs.current += Date.now() - pausedAt.current;
          pausedAt.current = null;
        }
        return "running";
      }
      // From idle or completed, the big control starts a fresh session.
      startedAt.current = Date.now();
      pausedAt.current = null;
      accumulatedPausedMs.current = 0;
      hasCompleted.current = false;
      setElapsedMs(0);
      setIndex(0);
      return "running";
    });
  }, []);

  /**
   * End early. The elapsed time is *kept* rather than zeroed, so the caller can file a
   * partial session — a four-minute stretch that was finished at minute three should
   * record three minutes, not four and not nothing.
   */
  const finish = useCallback(() => {
    setStatus((prev) => (prev === "running" || prev === "paused" ? "completed" : prev));
  }, []);

  /** Move to phase `i`, restarting that phase from its first second. */
  const goTo = useCallback(
    (i: number) => {
      if (!phases.length) return;
      const target = Math.max(0, Math.min(phases.length - 1, i));
      const offset = offsetOf(phases, target);

      // Rebase the timestamps so `readElapsed` returns exactly `offset` from here on. This
      // is why skipping and stepping back are exact rather than approximate: the clock is
      // redefined, not nudged.
      const now = Date.now();
      startedAt.current = now - offset;
      accumulatedPausedMs.current = 0;
      pausedAt.current = status === "paused" ? now : null;
      hasCompleted.current = false;

      setElapsedMs(offset);
      setIndex(target);
      setStatus((prev) => (prev === "idle" ? "running" : prev));
    },
    [phases, status],
  );

  const next = useCallback(() => {
    if (!phases.length) return;
    if (index >= phases.length - 1) {
      // Past the last phase there is nothing to move to, so "next" means "done".
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        success();
        onComplete.current?.();
      }
      setElapsedMs(totalMs);
      setIndex(phases.length - 1);
      setStatus("completed");
      return;
    }
    goTo(index + 1);
  }, [phases, index, totalMs, goTo]);

  const previous = useCallback(() => {
    // Deliberately not `goTo(index - 1)` at index 0: a person who taps back on the first
    // movement means "start this one again", not "do nothing".
    goTo(Math.max(0, index - 1));
  }, [index, goTo]);

  const reset = useCallback(() => {
    startedAt.current = null;
    pausedAt.current = null;
    accumulatedPausedMs.current = 0;
    hasCompleted.current = false;
    // Forget the announcement: a screen that resets and starts again must hear its first phase.
    announcedIndex.current = -1;
    setElapsedMs(0);
    setIndex(0);
    setStatus("idle");
  }, []);

  /* ── Derived display values ───────────────────────────────────────────────────────── */

  const phase = phases[Math.min(index, Math.max(0, phases.length - 1))];
  const nextPhase = phases[index + 1] ?? null;

  const at = positionAt(phases, elapsedMs);
  const phaseMs = at.intoMs;
  const phaseSpan = (phase?.seconds ?? 0) * 1000;
  const phaseRemainingMs = Math.max(0, phaseSpan - phaseMs);
  const secondsLeft = Math.ceil(phaseRemainingMs / 1000);

  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const progress = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;
  const phaseProgress = phaseSpan > 0 ? Math.min(1, phaseMs / phaseSpan) : 0;
  const clock = `${Math.floor(elapsedMs / 60_000)}:${String(
    Math.floor((elapsedMs % 60_000) / 1000),
  ).padStart(2, "0")}`;

  return {
    status,
    running: status === "running",
    paused: status === "paused",
    completed: status === "completed",
    index,
    phase,
    nextPhase,
    secondsLeft,
    phaseMs,
    phaseRemainingMs,
    elapsedMs,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progress,
    phaseProgress,
    clock,
    totalSeconds,
    start,
    pause,
    resume,
    toggle,
    finish,
    goTo,
    next,
    previous,
    reset,
  };
}
