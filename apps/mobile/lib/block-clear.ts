/**
 * The rules of Block Clear, with no React Native in them.
 *
 * The screen (app/block-clear.tsx) owns taps, colours and copy; this file owns the
 * board. They are separate because the rules are the part that has to be *provable*:
 * the screenshot probes in scripts/interactions.mjs run on the machine that has
 * Playwright, and a game whose scoring quietly regressed passes every marker check
 * there is. Nothing here imports a renderer, so `scripts/check-block-clear.mjs` can
 * load this module in plain Node and assert the rules directly.
 *
 * Cells are addressed `r * N + c`. A board is a flat boolean array, copied on write,
 * so a placement is one `slice()` and no caller can mutate a board it was handed.
 */

/** The board is square. Eight is the size the genre settled on: big enough that a
 *  row takes real work, small enough that a 5-long piece is a decision. */
export const N = 8;
export const CELLS = N * N;

/** Scoring, stated on the start screen so it is a rule the player can play against,
 *  not a black box. */
export const POINTS_PER_BLOCK = 1;
export const POINTS_PER_LINE = 10;

export type Board = boolean[];

export type Shape = {
  key: string;
  /** Offsets from the piece's top-left corner, as [row, col]. */
  cells: readonly (readonly [number, number])[];
  w: number;
  h: number;
  size: number;
};

export type Tray = (Shape | null)[];

/** A local `r * N + c`, named so the board maths reads as coordinates. */
export const at = (r: number, c: number) => r * N + c;

export function shape(key: string, cells: readonly (readonly [number, number])[]): Shape {
  const w = Math.max(...cells.map(([, c]) => c)) + 1;
  const h = Math.max(...cells.map(([r]) => r)) + 1;
  return { key, cells, w, h, size: cells.length };
}

/**
 * The piece bag. Written out rather than generated from rotations: a generated set
 * silently includes duplicates that differ only by symmetry, which would quietly
 * weight the draw toward whichever shape has the most rotations.
 */
export const SHAPES: Shape[] = [
  shape("dot", [[0, 0]]),
  shape("i2h", [[0, 0], [0, 1]]),
  shape("i2v", [[0, 0], [1, 0]]),
  shape("i3h", [[0, 0], [0, 1], [0, 2]]),
  shape("i3v", [[0, 0], [1, 0], [2, 0]]),
  shape("i4h", [[0, 0], [0, 1], [0, 2], [0, 3]]),
  shape("i4v", [[0, 0], [1, 0], [2, 0], [3, 0]]),
  shape("i5h", [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]),
  shape("i5v", [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]),
  shape("o2", [[0, 0], [0, 1], [1, 0], [1, 1]]),
  shape("box6h", [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]),
  shape("box6v", [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]]),
  shape("o3", [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]),
  // The four three-cell corners.
  shape("corner-nw", [[0, 0], [0, 1], [1, 0]]),
  shape("corner-ne", [[0, 0], [0, 1], [1, 1]]),
  shape("corner-sw", [[0, 0], [1, 0], [1, 1]]),
  shape("corner-se", [[0, 1], [1, 0], [1, 1]]),
  // The four L/J tetrominoes.
  shape("ell-up", [[0, 0], [1, 0], [2, 0], [2, 1]]),
  shape("ell-left", [[0, 0], [0, 1], [0, 2], [1, 0]]),
  shape("ell-down", [[0, 0], [0, 1], [1, 1], [2, 1]]),
  shape("ell-right", [[0, 2], [1, 0], [1, 1], [1, 2]]),
  // S and Z.
  shape("s-left", [[0, 1], [0, 2], [1, 0], [1, 1]]),
  shape("s-right", [[0, 0], [0, 1], [1, 1], [1, 2]]),
  // T, both ways up.
  shape("tee-flat", [[0, 0], [0, 1], [0, 2], [1, 1]]),
  shape("tee-up", [[0, 0], [1, 0], [1, 1], [2, 0]]),
];

/** The small half of the bag, which is what a rewarded tray is allowed to re-roll
 *  from when the first draw is hopeless. */
export const STOCK: Shape[] = SHAPES.filter((sh) => sh.size <= 4);

/** The empty board. Shared, never mutated: every function here copies on write. */
export const EMPTY_BOARD: Board = Array.from({ length: CELLS }, () => false);

/** True when `sh` can be placed with its top-left corner on (r, c). */
export function fits(board: Board, sh: Shape, r: number, c: number): boolean {
  if (r + sh.h > N || c + sh.w > N) return false;
  for (const [dr, dc] of sh.cells) if (board[at(r + dr, c + dc)]) return false;
  return true;
}

/** Every top-left corner where `sh` fits, as board indices. */
export function anchors(board: Board, sh: Shape): number[] {
  const out: number[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) if (fits(board, sh, r, c)) out.push(at(r, c));
  }
  return out;
}

/** The end condition, in one place: the round is over when nothing in the tray can
 *  go anywhere. */
export function hasAnyMove(board: Board, tray: Tray): boolean {
  return tray.some((sh) => sh !== null && anchors(board, sh).length > 0);
}

export function place(board: Board, sh: Shape, r: number, c: number): Board {
  const next = board.slice();
  for (const [dr, dc] of sh.cells) next[at(r + dr, c + dc)] = true;
  return next;
}

/** Clears every full row and column **at once**. They have to be found before any is
 *  removed, or clearing a row first would hide a column that was already full. */
export function clearLines(board: Board): { board: Board; lines: number } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < N; r++) {
    let full = true;
    for (let c = 0; c < N; c++) if (!board[at(r, c)]) { full = false; break; }
    if (full) rows.push(r);
  }
  for (let c = 0; c < N; c++) {
    let full = true;
    for (let r = 0; r < N; r++) if (!board[at(r, c)]) { full = false; break; }
    if (full) cols.push(c);
  }
  if (!rows.length && !cols.length) return { board, lines: 0 };
  const next = board.slice();
  for (const r of rows) for (let c = 0; c < N; c++) next[at(r, c)] = false;
  for (const c of cols) for (let r = 0; r < N; r++) next[at(r, c)] = false;
  return { board: next, lines: rows.length + cols.length };
}

/** Points for one placement. The multiplier is the streak *after* it: the first
 *  clearing move scores 1×, and each consecutive clear after it adds another step. */
export function scoreFor(sh: Shape, linesCleared: number, comboAfter: number): number {
  return (
    sh.size * POINTS_PER_BLOCK +
    (linesCleared > 0 ? POINTS_PER_LINE * linesCleared * comboAfter : 0)
  );
}

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export function drawTray(): Tray {
  return [pick(SHAPES), pick(SHAPES), pick(SHAPES)];
}

/**
 * The rewarded tray, which is a promise and has to be kept: swapping three pieces
 * that do not fit for three *different* pieces that also do not fit would sell an ad
 * that pays nothing. So a draw with no move at all is re-rolled from the small stock,
 * and the reward copy says exactly that much and no more. A full board has no rescue
 * and is left alone — the round is genuinely over.
 */
export function freshTray(board: Board): Tray {
  const drawn = drawTray();
  if (hasAnyMove(board, drawn)) return drawn;
  const rescuers = STOCK.filter((sh) => anchors(board, sh).length > 0);
  if (!rescuers.length) return drawn;
  const next: Tray = [...drawn];
  next[0] = pick(rescuers);
  return next;
}
