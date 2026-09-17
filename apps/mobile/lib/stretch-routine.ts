/**
 * The Stretch routine — the data, with no React in it.
 *
 * ── Why this is its own module ────────────────────────────────────────────────────────
 *
 * The routine is the part of the Stretch screen that can be *wrong* in a way nobody can see:
 * a class advertised as five minutes whose movement durations actually add up to five
 * twenty; a movement that gives one side a longer hold than the other; a per-side movement
 * that forgets to expand at all. Those are all assertions about a table of numbers, and the
 * only honest way to check them is to run them — which requires the table to be importable
 * without a renderer.
 *
 * So the data lives here, `app/(wellness)/stretch.tsx` renders it, and
 * `scripts/check-timer.mjs` asserts it. Nothing in this file imports React or React Native,
 * and nothing in it touches the clock: `lib/timer-core.ts` owns time, this owns the class.
 */

import type { StretchDiagramId } from "./stretch-diagrams";

/**
 * Which anatomical diagram to draw.
 *
 * Imported rather than re-declared: two unions that must stay in step are two unions that
 * eventually do not.
 */
export type { StretchDiagramId };

/** The side a figure is drawn working. `both` means the movement is not sided. */
export type FigureSide = "both" | "left" | "right";

/** One movement in the class. */
export type StretchMove = {
  id: string;
  /** The illustration to draw. */
  diagram: StretchDiagramId;
  name: string;
  /** Seconds *per side* for a two-sided movement, or total for a both-sided one. */
  duration: number;
  instruction: string;
  /** `"left-right"` means the movement is performed once per side. */
  side: FigureSide | "left-right";
  /** The short cue shown while the movement runs. */
  cue: string;
};

/**
 * The one `side` value that means "perform this movement on each side".
 *
 * `as const` is load-bearing. Without it this widens to `string`, and although
 * `move.side === PER_SIDE` still type-checks, the *comparison* no longer narrows the union —
 * which is how a per-side movement silently stops expanding into two steps. That bug shipped
 * for exactly one debug cycle: the class ran 11 steps and 335 seconds instead of 12 and 300.
 */
const PER_SIDE = "left-right" as const;

/**
 * The routine.
 *
 * `duration` is per-side, so a `left-right` movement contributes `duration * 2` seconds:
 *
 *   30 + 30 + (15*2) + (20*2) + 20 + (25*2) + 30 + 70  =  300 seconds exactly.
 *
 * Four movements are done once and three are done per side (chest opener, seated twist, hip
 * stretch), which is why the numbers look uneven — they are chosen to land the class on
 * exactly five minutes, not to be round. `ROUTINE_TOTAL` below is derived from this table, so
 * an edit here changes the advertised length rather than silently contradicting it.
 *
 * The order is a warm-up convention rather than a preference: small joints before big ones,
 * and the breathing last so the class ends calm rather than braced.
 */
export const MOVES: StretchMove[] = [
  {
    id: "neck-rolls",
    diagram: "neck-rolls",
    name: "Neck Rolls",
    duration: 30,
    instruction: "Slow half-circles. Bring your chin toward each shoulder.",
    side: "both",
    cue: "Half-circles, never full rolls. Stop short of pain.",
  },
  {
    id: "shoulder-rolls",
    diagram: "shoulder-rolls",
    name: "Shoulder Rolls",
    duration: 30,
    instruction: "Ten backward, ten forward. Keep the arms loose.",
    side: "both",
    cue: "Let the shoulders do the work, not the elbows.",
  },
  {
    id: "chest-opener",
    diagram: "chest-opener",
    name: "Chest Opener",
    duration: 15,
    instruction: "Hands clasped behind your back. Lift the chest and open.",
    side: PER_SIDE,
    cue: "Breathe out as you open. Shoulders stay down.",
  },
  {
    id: "seated-twist",
    diagram: "seated-twist",
    name: "Seated Twist",
    duration: 20,
    instruction: "Opposite hand on the knee. Turn from the ribs, not the neck.",
    side: PER_SIDE,
    cue: "Grow taller on the in-breath, turn on the out-breath.",
  },
  {
    id: "wrist-stretch",
    diagram: "wrist-stretch",
    name: "Wrist & Finger Stretch",
    duration: 20,
    instruction: "Both hands. Palm down, then palm up, drawing the fingers back.",
    side: "both",
    cue: "This is the one that saves a typing day. Easy does it.",
  },
  {
    id: "hip-stretch",
    diagram: "hip-stretch",
    name: "Standing Hip Stretch",
    duration: 25,
    instruction: "Front knee bent, back leg straight, press the hips forward.",
    side: PER_SIDE,
    cue: "Back heel stays down. You should feel the front of the hip.",
  },
  {
    id: "hamstring-reach",
    diagram: "hamstring-reach",
    name: "Hamstring Reach",
    duration: 30,
    instruction: "Hinge at the hips with soft knees and let the head hang.",
    side: "both",
    cue: "Hinge, don't curl. The back stays long.",
  },
  {
    id: "slow-breathing",
    diagram: "slow-breathing",
    name: "Slow Breathing",
    duration: 70,
    instruction: "Sit tall. Longer out than in, all the way to the end.",
    side: "both",
    cue: "Not a warm-up — this is the last minute, and it is the point.",
  },
];

/** How many distinct movements the class contains. */
export const MOVEMENT_COUNT = MOVES.length;

/** Seconds one movement contributes to the class, counting both sides where it has them. */
export function secondsFor(move: StretchMove): number {
  return move.side === PER_SIDE ? move.duration * 2 : move.duration;
}

/**
 * The class length in seconds, derived rather than declared.
 *
 * This is the reason the module exists. The shipped version hard-coded "5 min" in the header
 * while the durations underneath summed to 320 seconds, and nothing could catch it because
 * the label and the table were never compared. `app/(wellness)/stretch.tsx` prints this
 * value, so the two cannot disagree.
 */
export const ROUTINE_TOTAL = MOVES.reduce((sum, move) => sum + secondsFor(move), 0);

/** One runnable step: a movement, and which side of it this step is. */
export type StretchStep = {
  /** The step as the timer sees it. */
  phase: { key: string; label: string; seconds: number };
  move: StretchMove;
  /** The side *this step* works, or `both` for a movement that is not sided. */
  side: FigureSide;
  /** Whether this movement is performed per side at all. */
  sided: boolean;
};

/**
 * The routine expanded into the flat step list the timer runs.
 *
 * A per-side movement becomes two steps of `duration` seconds each, RIGHT then LEFT, so the
 * person is never asked to remember to swap sides. The figure is mirrored per step and the
 * side label is derived from the same value, which is what keeps the cue and the drawing from
 * disagreeing.
 *
 * Written as an explicit accumulator rather than `flatMap` over a tuple: the two halves of a
 * pair are the thing that must stay together, so they are pushed together.
 */
function expand(moves: StretchMove[]): StretchStep[] {
  const steps: StretchStep[] = [];
  for (const move of moves) {
    if (move.side === PER_SIDE) {
      steps.push({
        phase: { key: `${move.id}-right`, label: `${move.name} (right)`, seconds: move.duration },
        move,
        side: "right",
        sided: true,
      });
      steps.push({
        phase: { key: `${move.id}-left`, label: `${move.name} (left)`, seconds: move.duration },
        move,
        side: "left",
        sided: true,
      });
    } else {
      steps.push({
        phase: { key: move.id, label: move.name, seconds: move.duration },
        move,
        side: "both",
        sided: false,
      });
    }
  }
  return steps;
}

export const STEPS: StretchStep[] = expand(MOVES);

/** What the timer actually runs. Same array identity for the life of the module. */
export const PHASES = STEPS.map((step) => step.phase);
