/**
 * The Stretch diagrams' identifiers, in a module with no React in it.
 *
 * ── Why this is separate from `components/stretch-figures.tsx` ────────────────────────
 *
 * The figure component is JSX and React Native SVG, so it can only be executed by a
 * renderer. The *set of ids* it can draw, however, is data — and data is checkable in plain
 * Node. Splitting it out is what lets `scripts/check-timer.mjs` assert that every movement in
 * `lib/stretch-routine.ts` names a diagram that actually exists, without needing to mount a
 * component to find out.
 *
 * A union type alone would not do: it is erased at runtime, so a mistyped id would be caught
 * by `tsc` and by nothing else. A tuple gives the same union *and* a value to iterate.
 */
export const DIAGRAM_IDS = [
  "neck-rolls",
  "shoulder-rolls",
  "chest-opener",
  "seated-twist",
  "wrist-stretch",
  "hip-stretch",
  "hamstring-reach",
  "slow-breathing",
] as const;

export type StretchDiagramId = (typeof DIAGRAM_IDS)[number];
