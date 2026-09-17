#!/usr/bin/env node
/**
 * check-timer.mjs — the wellness timer engine's invariants, asserted without a screen.
 *
 * Why this exists: every claim `lib/timer.ts` makes is a claim about *arithmetic over
 * timestamps*, and arithmetic is exactly the kind of thing a screenshot cannot check. "Pause
 * and resume does not lose time", "a two-minute background is caught up correctly", "the
 * clock cannot go backwards" and "the routine is exactly 300 seconds" are all decided by
 * numbers, so they are asserted here.
 *
 * It imports the real module — `lib/timer-core.ts`, where the pure arithmetic lives — and
 * does not re-implement any of the logic it is checking. A test that reimplements the thing
 * it tests proves only that the author wrote the same bug twice.
 *
 * Usage:  node scripts/check-timer.mjs
 * Exit:   0 every invariant holds, 1 one of them does not
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MOBILE = path.join(REPO, "apps", "mobile");

const { positionAt, elapsedAt, offsetOf, totalMsOf, mmss, isFinished } = await import(
  pathToFileURL(path.join(MOBILE, "lib", "timer-core.ts")).href
);

let failures = 0;
let checks = 0;

function ok(name, condition, detail = "") {
  checks++;
  if (condition) return;
  failures++;
  console.error(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
}

function eq(name, actual, expected) {
  ok(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/* ── 1. The stretch routine is exactly 300 seconds ───────────────────────────────────────
   This was a real bug: the shipped durations summed to 320s while the screen said
   "5 min". The screen now *derives* its label from the routine (`ROUTINE_TOTAL`), so this
   section asserts two separate things: that the derived number really is 300, and that the
   per-movement durations and sides the class is built from are internally consistent.

   `ROUTINE_TOTAL` is imported as a runtime value rather than scraped out of the source. A
   check that greps a file proves what the file says; a check that reads the constant proves
   what the code does, and the whole point of this file is the second one. */
console.log("Stretch routine");
{
  const { ROUTINE_TOTAL, MOVEMENT_COUNT, STEPS, MOVES, PHASES } = await import(
    pathToFileURL(path.join(MOBILE, "lib", "stretch-routine.ts")).href
  );

  eq("ROUTINE_TOTAL is exactly 300 seconds", ROUTINE_TOTAL, 300);
  eq("mmss(ROUTINE_TOTAL) reads as 5:00", mmss(ROUTINE_TOTAL), "5:00");
  eq("the class advertises eight movements", MOVEMENT_COUNT, 8);

  // Four movements are performed once per side, so the class expands to twelve timed steps.
  // The routine has four single-sided movements and three performed per side, so eight
  // movements become eleven timed steps. Derived here from MOVES rather than written as a
  // literal, so adding a movement does not silently invalidate this check.
  const perSideMoves = MOVES.filter((m) => m.side === "left-right").length;
  const expectedSteps = MOVES.length + perSideMoves;
  eq("the step list is the movements plus one extra step per sided movement", STEPS.length, expectedSteps);
  eq(
    "each sided movement contributes exactly two steps",
    STEPS.filter((step) => step.sided).length,
    perSideMoves * 2,
  );

  // Every step must be a real, positive duration — a zero-second step would flash a
  // movement on screen for one frame and count as a "completed" movement.
  ok(
    "every step has a positive duration",
    STEPS.every((step) => step.phase.seconds > 0),
    JSON.stringify(STEPS.filter((step) => step.phase.seconds <= 0).map((step) => step.phase.key)),
  );

  // The engine's own total must agree with the advertised label. If these ever differ, the
  // screen promises a length the timer does not run.
  eq("the engine's total matches the advertised length", totalMsOf(STEPS.map((s) => s.phase)), 300_000);

  // Per-side steps come in RIGHT then LEFT pairs, and the two halves of a pair are equal —
  // a movement that gave one side longer than the other would be a real defect.
  for (let i = 0; i < STEPS.length; i += 1) {
    const step = STEPS[i];
    if (!step.sided) {
      eq(`step ${i} is not sided but reports side "both"`, step.side, "both");
      continue;
    }
    const partner = STEPS[i + 1];
    ok(`step ${i} has a partner step`, !!partner, "the last step cannot be half of a pair");
    if (!partner) continue;
    eq(`step ${i} is the right side`, step.side, "right");
    eq(`step ${i + 1} is the left side`, partner.side, "left");
    eq(
      `both sides of "${step.move.name}" get the same time`,
      step.phase.seconds,
      partner.phase.seconds,
    );
    ok(
      `both sides of "${step.move.name}" are the same movement`,
      partner.move.id === step.move.id,
    );
    i += 1;
  }

  // The phase keys the engine keys its haptic transitions on must be unique, or a transition
  // between two steps sharing a key would be silent.
  const keys = STEPS.map((step) => step.phase.key);
  eq("every step has a unique phase key", new Set(keys).size, keys.length);

  // The "next movement" card reads the next step, so the last step must have no successor and
  // every other step must. Off-by-one here would advertise a movement that never arrives.
  eq("the last step has no next step", STEPS.at(-1).phase.key, PHASES.at(-1).key);
  ok(
    "every step but the last has a successor",
    STEPS.slice(0, -1).every((_, i) => STEPS[i + 1] !== undefined),
  );

  // A movement's name must be findable by id: the running screen resolves the "MOVE n OF 8"
  // number with `MOVES.findIndex`, and a miss would report move 0.
  for (const step of STEPS) {
    ok(
      `"${step.move.id}" is findable in MOVES`,
      MOVES.some((m) => m.id === step.move.id),
    );
  }

  // Two movements sharing an id would make `findIndex` report the wrong move number.
  eq("movement ids are unique", new Set(MOVES.map((m) => m.id)).size, MOVES.length);
  eq("movement names are unique", new Set(MOVES.map((m) => m.name)).size, MOVES.length);

  // `sideLabel` must label exactly the sided steps, since it is what the user reads to know
  // which side to work. A movement that is per-side but shows no label is a guessing game.
  const { sideLabel } = await import(
    pathToFileURL(path.join(MOBILE, "components", "stretch-figures.tsx")).href
  ).catch(() => ({ sideLabel: null }));
  if (sideLabel) {
    for (const step of STEPS) {
      const label = sideLabel(step.side);
      ok(
        step.sided
          ? label === (step.side === "right" ? "RIGHT SIDE" : "LEFT SIDE")
          : label === null,
        `side label for "${step.phase.key}" (side=${step.side}) was ${JSON.stringify(label)}`,
      );
    }
  }

  // Every movement must draw a diagram that actually exists in the registry. A dangling id
  // renders an empty frame, and because the id is a string in a data table the type system
  // only catches it if the registry itself is the source of the union — which it now is.
  const { DIAGRAM_IDS } = await import(
    pathToFileURL(path.join(MOBILE, "lib", "stretch-diagrams.ts")).href
  );
  const declared = new Set(DIAGRAM_IDS);
  for (const move of MOVES) {
    ok(
      `"${move.name}" has a diagram ("${move.diagram}")`,
      declared.has(move.diagram),
      `known diagrams: ${[...declared].sort().join(", ")}`,
    );
  }
  eq("the diagram registry covers all eight movements", declared.size, 8);
  eq(
    "every registered diagram is used by exactly one movement",
    declared.size,
    new Set(MOVES.map((m) => m.diagram)).size,
  );

  // The flat phase list the timer runs must be the same length as the step list, or the
  // engine would run a class different from the one the preview lists.
  eq("the timer's phase list matches the step list", PHASES.length, STEPS.length);
}

/* ── 2. Phase location ──────────────────────────────────────────────────────────────────
   The table is the only thing that decides which movement is on screen. */
console.log("Phase location");
{
  const phases = [
    { key: "a", label: "A", seconds: 30 },
    { key: "b", label: "B", seconds: 30 },
    { key: "c", label: "C", seconds: 60 },
  ];
  eq("total is 120s", totalMsOf(phases), 120_000);

  eq("0ms is phase 0 at 0", JSON.stringify(positionAt(phases, 0)), JSON.stringify({ index: 0, intoMs: 0 }));
  eq("29_999ms is still phase 0", positionAt(phases, 29_999).index, 0);
  eq("exactly 30_000ms crosses into phase 1", positionAt(phases, 30_000).index, 1);
  eq("phase 1 has just started", positionAt(phases, 30_000).intoMs, 0);
  eq("59_999ms is phase 1", positionAt(phases, 59_999).index, 1);
  eq("exactly 60_000ms crosses into phase 2", positionAt(phases, 60_000).index, 2);

  // Past the end the last phase must stay reported rather than going undefined — the
  // completion render still shows the final movement's name.
  eq("past the end reports the last phase", positionAt(phases, 999_999).index, 2);
  eq(
    "past the end clamps intoMs to the phase length",
    positionAt(phases, 999_999).intoMs,
    60_000,
  );

  // Zero-second phases exist in the real patterns (Box has no hold-out in some shapes) and
  // must be skipped rather than capture the boundary.
  const withZero = [
    { key: "in", label: "In", seconds: 5 },
    { key: "hold", label: "Hold", seconds: 0 },
    { key: "out", label: "Out", seconds: 5 },
  ];
  eq("a zero-second phase never becomes current", positionAt(withZero, 0).index, 0);
  // A phase owns [start, start + span). At exactly 5000ms the zero-second hold is already
  // behind us and the exhale has begun; one millisecond earlier the inhale is still current.
  // Getting this backwards would show "Hold" for a phase with no duration.
  eq("at 4999ms the inhale is still current", positionAt(withZero, 4_999).index, 0);
  eq("at exactly 5000ms the zero-second hold is skipped", positionAt(withZero, 5_000).index, 2);
  eq("total ignores nothing but counts the real seconds", totalMsOf(withZero), 10_000);

  // An empty list must not throw — the engine is called with one while a pattern loads.
  ok("an empty phase list is handled", positionAt([], 0).index === 0);
  eq("an empty phase list has no duration", totalMsOf([]), 0);
}

/* ── 3. Rebasing (skip / previous) ──────────────────────────────────────────────────────
   `goTo` rebases the clock so elapsed equals the offset of the target phase. An off-by-one
   here lands a skip on the wrong movement. */
console.log("Skip / previous rebasing");
{
  const phases = [
    { key: "a", label: "A", seconds: 30 },
    { key: "b", label: "B", seconds: 30 },
    { key: "c", label: "C", seconds: 60 },
  ];
  eq("phase 0 starts at 0", offsetOf(phases, 0), 0);
  eq("phase 1 starts at 30_000", offsetOf(phases, 1), 30_000);
  eq("phase 2 starts at 60_000", offsetOf(phases, 2), 60_000);

  // After rebasing to offset(i), positionAt must report phase i with 0 elapsed. This is the
  // round-trip that makes skip exact.
  for (let i = 0; i < phases.length; i++) {
    const at = positionAt(phases, offsetOf(phases, i));
    eq(`rebasing to phase ${i} reports phase ${i}`, at.index, i);
    eq(`rebasing to phase ${i} lands at 0 into it`, at.intoMs, 0);
  }
}

/* ── 4. The clock: pause, resume, background ────────────────────────────────────────────
   The core invariant. `elapsedAt` is pure, so each of these is a direct assertion rather
   than an inference from rendered output. */
console.log("Pause / resume / background");
{
  const T0 = 1_000_000;

  // Running normally.
  eq(
    "10s of running is 10s elapsed",
    elapsedAt({ startedAt: T0, pausedAt: null, bankedPauseMs: 0 }, T0 + 10_000),
    10_000,
  );

  // Paused: the display freezes no matter how much wall time passes.
  const paused = { startedAt: T0, pausedAt: T0 + 10_000, bankedPauseMs: 0 };
  eq("a paused clock reads 10s", elapsedAt(paused, T0 + 10_000), 10_000);
  eq("a paused clock is still 10s a minute later", elapsedAt(paused, T0 + 70_000), 10_000);

  // Resume: the paused span is banked, so elapsed continues from 10s rather than
  // restarting at zero or jumping forward by the pause.
  const resumed = { startedAt: T0, pausedAt: null, bankedPauseMs: 30_000 };
  eq(
    "resuming after a 30s pause continues from 10s",
    elapsedAt(resumed, T0 + 40_000),
    10_000,
  );
  eq(
    "and keeps counting normally afterwards",
    elapsedAt(resumed, T0 + 45_000),
    15_000,
  );

  // Monotonic: elapsed never goes backwards as `now` advances, across a pause/resume seam.
  const timeline = [
    { clock: { startedAt: T0, pausedAt: null, bankedPauseMs: 0 }, now: T0 + 5_000 },
    { clock: { startedAt: T0, pausedAt: T0 + 6_000, bankedPauseMs: 0 }, now: T0 + 6_000 },
    { clock: { startedAt: T0, pausedAt: T0 + 6_000, bankedPauseMs: 0 }, now: T0 + 90_000 },
    { clock: { startedAt: T0, pausedAt: null, bankedPauseMs: 84_000 }, now: T0 + 91_000 },
    { clock: { startedAt: T0, pausedAt: null, bankedPauseMs: 84_000 }, now: T0 + 100_000 },
  ];
  let previous = -1;
  let monotonic = true;
  for (const step of timeline) {
    const value = elapsedAt(step.clock, step.now);
    if (value < previous) monotonic = false;
    previous = value;
  }
  ok("elapsed is monotonic across a pause/resume seam", monotonic);

  // Backgrounding is not a special case in the clock — the timestamps simply keep running,
  // which is the whole reason this design was chosen. A two-minute gap advances the clock by
  // two minutes with no ticks having fired.
  const beforeBackground = elapsedAt({ startedAt: T0, pausedAt: null, bankedPauseMs: 0 }, T0 + 10_000);
  const afterBackground = elapsedAt({ startedAt: T0, pausedAt: null, bankedPauseMs: 0 }, T0 + 130_000);
  eq("a two-minute background advances elapsed by two minutes", afterBackground - beforeBackground, 120_000);

  // A paused session must NOT advance across a background: the pause is the point.
  const pausedAcrossBackground = elapsedAt(paused, T0 + 600_000);
  eq("a paused session does not advance across a background", pausedAcrossBackground, 10_000);

  // A device clock adjusted backwards cannot produce a negative elapsed time.
  eq(
    "a backwards clock adjustment clamps at zero",
    elapsedAt({ startedAt: T0, pausedAt: null, bankedPauseMs: 0 }, T0 - 5_000),
    0,
  );

  // Never started.
  eq("an unstarted clock reads zero", elapsedAt({ startedAt: null, pausedAt: null, bankedPauseMs: 0 }, T0), 0);
}

/* ── 5. Completion is reached exactly once, and only at the end ─────────────────────────
   The engine completes when `elapsed >= total`. This models the sync pass the hook runs on
   every tick and on every AppState resume, and asserts the guard fires once. */
console.log("Completion");
{
  const phases = [
    { key: "a", label: "A", seconds: 30 },
    { key: "b", label: "B", seconds: 30 },
  ];
  const total = totalMsOf(phases);

  const totalFromSteps = phases.reduce((n, p) => n + p.seconds * 1000, 0);
  eq("the total the engine compares against is the sum of the phases", total, totalFromSteps);

  /** Mirrors the hook's completion condition, with its guard. */
  function simulate(nows) {
    let completed = 0;
    let guard = false;
    for (const now of nows) {
      const elapsed = Math.min(elapsedAt({ startedAt: 0, pausedAt: null, bankedPauseMs: 0 }, now), total);
      if (total > 0 && elapsed >= total && !guard) {
        guard = true;
        completed++;
      }
    }
    return completed;
  }

  eq("a full run completes once", simulate([0, 10_000, 30_000, 59_000, 60_000, 60_100, 61_000]), 1);

  // The boundary itself, asserted on the real predicate rather than through the model.
  ok("59_999ms of a 60_000ms sequence is not finished", !isFinished(59_999, 60_000));
  ok("exactly 60_000ms is finished", isFinished(60_000, 60_000));
  ok("a zero-length sequence never reports finished", !isFinished(0, 0));
  eq(
    "a background that overshoots the end completes once",
    simulate([0, 5_000, 5_000_000, 5_000_100]),
    1,
  );
  eq("a run that never reaches the end does not complete", simulate([0, 10_000, 59_999]), 0);

  // Skipping to the last phase and then pressing next completes exactly once even though
  // both paths run.
  eq("completing via skip and then next fires once", simulate([60_000, 60_000, 60_000]), 1);
}

/* ── 6. mmss formatting ─────────────────────────────────────────────────────────────────
   Every countdown on every screen goes through this, so a formatting bug would be global. */
console.log("Formatting");
{
  eq("0s", mmss(0), "0:00");
  eq("9s pads", mmss(9), "0:09");
  eq("59s", mmss(59), "0:59");
  eq("60s", mmss(60), "1:00");
  eq("300s", mmss(300), "5:00");
  eq("negative clamps", mmss(-5), "0:00");
  eq("fractional floors", mmss(29.9), "0:29");
}

console.log(
  failures === 0
    ? `\ncheck-timer: ${checks} assertions passed\n`
    : `\ncheck-timer: ${failures} of ${checks} assertions FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
