/**
 * The rules of Merge — four-by-four number tiles, with no React Native in them.
 *
 * The screen (app/merge-tiles.tsx) owns arrows, colours and copy; this file owns the
 * board. They are separate for the same reason `lib/block-clear.ts` is: the rules are the
 * part that has to be *provable*. The screenshot probes in scripts/interactions.mjs prove
 * the screen responds, but they need Playwright and a running preview — and a game whose
 * merging is subtly wrong passes every marker check there is. Nothing here imports a
 * renderer, so `scripts/check-merge-tiles.mjs` loads this module in plain Node and asserts
 * the merge rules, the scoring, the end condition and the rewarded undo directly.
 *
 * A board is a flat array of tile values, `0` for empty, addressed `r * N + c`. Every
 * function copies on write, so no caller can mutate a board or a state it was handed.
 *
 * The merge rule is the one this whole file exists to state precisely: a slide packs
 * every tile against the wall, then joins equal **neighbours** from that wall outwards,
 * and a tile that was already produced by a join this move cannot join again. That single
 * sentence is why [2,2,2,2] slides to [4,4] and scores 8, while [2,2,4] slides to [4,4]
 * and scores 4 — and it is asserted, not assumed, in the Node check.
 */

/** The board is square, and four is the size the genre settled on: small enough that a
 *  full board arrives quickly, large enough that a slide is a decision. */
export const N = 4;
export const CELLS = N * N;

/** The tile the round is aiming at. Reaching it is a win the screen states plainly and
 *  the round carries on — a game that ended at 2048 would be a much shorter game. */
export const WIN_TILE = 2048;

/** Tiles on the board when a round starts, and the value of a fresh tile. Nine in ten
 *  new tiles are a 2; the occasional 4 is what keeps the opening from being scripted. */
export const START_TILES = 2;
export const SPAWN_FOUR_CHANCE = 0.1;

export type Dir = "left" | "right" | "up" | "down";
export const DIRS: Dir[] = ["left", "right", "up", "down"];

/** Tile values, `0` = empty. */
export type Board = number[];

/** A local `r * N + c`, named so the board maths reads as coordinates. */
export const at = (r: number, c: number) => r * N + c;

/** The empty board. Shared, never mutated: every function here copies on write. */
export const EMPTY_BOARD: Board = Array.from({ length: CELLS }, () => 0);

/**
 * The cell indices of one line, **in the order tiles meet the wall they are sliding
 * toward**. Sliding left reads a row left-to-right, sliding right reads it right-to-left,
 * and the merge pass is then identical for all four directions — which is why there is
 * one merge implementation here and not four.
 */
export function lineIndexes(dir: Dir, line: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    if (dir === "left") out.push(at(line, i));
    else if (dir === "right") out.push(at(line, N - 1 - i));
    else if (dir === "up") out.push(at(i, line));
    else out.push(at(N - 1 - i, line));
  }
  return out;
}

/**
 * One line of four values, packed and merged. Exported because it is the rule the whole
 * game rests on and the Node check asserts it directly on hand-written lines.
 *
 * `gained` is the sum of the tiles the joins produced — the standard scoring for this
 * genre, and the number the start screen promises.
 *
 * `sources[slot]` lists the input indices that produced output slot `slot`: one entry for
 * a tile that merely moved, two for a join, none for a gap. The rules do not need it; the
 * screen does, because a tile that *slides* across the board has to be the same tile
 * before and after or the animation is a jump cut. Returning it from here is what keeps
 * that mapping derived from the rules instead of guessed by the renderer.
 */
export function mergeLine(line: number[]): {
  line: number[];
  gained: number;
  joins: number;
  sources: number[][];
} {
  const packed: { value: number; from: number }[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== 0) packed.push({ value: line[i], from: i });
  }
  const out: number[] = [];
  const sources: number[][] = [];
  let gained = 0;
  let joins = 0;
  for (let i = 0; i < packed.length; i++) {
    // One join per pair, left to right along the direction of travel. The `i++` is the
    // rule made mechanical: the tile produced here is pushed and then skipped, so it
    // cannot be the left half of the next join as well.
    if (i + 1 < packed.length && packed[i].value === packed[i + 1].value) {
      const joined = packed[i].value * 2;
      out.push(joined);
      sources.push([packed[i].from, packed[i + 1].from]);
      gained += joined;
      joins++;
      i++;
    } else {
      out.push(packed[i].value);
      sources.push([packed[i].from]);
    }
  }
  while (out.length < N) {
    out.push(0);
    sources.push([]);
  }
  return { line: out, gained, joins, sources };
}

/** One surviving tile's journey in a slide: the cell it left and the cell it reached. */
export type SlideStep = { from: number; to: number };

/** Slide every line in `dir`, and report what the board did. */
export function slide(board: Board, dir: Dir): {
  board: Board;
  gained: number;
  joins: number;
  moved: boolean;
  /** Every surviving tile's journey, including the tiles that did not move (from === to).
   *  Together they map the whole board one move forward, which is what a renderer needs to
   *  animate tiles rather than redraw them. */
  steps: SlideStep[];
  /** Destination cells where two tiles joined. */
  merges: number[];
} {
  const next = board.slice();
  const steps: SlideStep[] = [];
  const merges: number[] = [];
  let gained = 0;
  let joins = 0;
  for (let line = 0; line < N; line++) {
    const idx = lineIndexes(dir, line);
    const before = idx.map((i) => board[i]);
    const merged = mergeLine(before);
    gained += merged.gained;
    joins += merged.joins;
    for (let slot = 0; slot < N; slot++) {
      next[idx[slot]] = merged.line[slot];
      const from = merged.sources[slot];
      if (from.length === 1) steps.push({ from: idx[from[0]], to: idx[slot] });
      else if (from.length === 2) {
        steps.push({ from: idx[from[0]], to: idx[slot] });
        steps.push({ from: idx[from[1]], to: idx[slot] });
        merges.push(idx[slot]);
      }
    }
  }
  let moved = false;
  for (let i = 0; i < CELLS; i++) {
    if (next[i] !== board[i]) {
      moved = true;
      break;
    }
  }
  return { board: next, gained, joins, moved, steps, merges };
}

/** The indices of every empty cell. */
export function empties(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < CELLS; i++) if (board[i] === 0) out.push(i);
  return out;
}

/** The highest tile on the board, or 0 for an empty board. */
export function bestTile(board: Board): number {
  return board.reduce((m, v) => (v > m ? v : m), 0);
}

/** The tile value a fresh spawn carries. Takes the random source so a check can pin it. */
export function spawnValue(rand: () => number = Math.random): number {
  return rand() < SPAWN_FOUR_CHANCE ? 4 : 2;
}

/**
 * Drop one new tile on a random empty cell, or return nothing when there is no room.
 * `rand` is a parameter so the Node check can spawn deterministically.
 *
 * The cell comes back with the board because the screen pops the new tile in, and "which
 * tile is new" is not something a renderer can recover by comparing two boards that happen
 * to share a value.
 */
export function spawnAt(
  board: Board,
  rand: () => number = Math.random,
): { board: Board; index: number } | null {
  const free = empties(board);
  if (!free.length) return null;
  const next = board.slice();
  const index = free[Math.min(free.length - 1, Math.floor(rand() * free.length))];
  next[index] = spawnValue(rand);
  return { board: next, index };
}

/** The board after a spawn, for callers that do not need to know where the tile landed. */
export function spawn(board: Board, rand: () => number = Math.random): Board {
  return spawnAt(board, rand)?.board ?? board;
}

/**
 * The end condition, in one place: no empty cell **and** no two neighbours that could
 * join. Checked as neighbours rather than as "does any slide move something", because
 * that is what the player can see on the board.
 */
export function hasMove(board: Board): boolean {
  if (empties(board).length) return true;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = board[at(r, c)];
      if (c + 1 < N && board[at(r, c + 1)] === v) return true;
      if (r + 1 < N && board[at(r + 1, c)] === v) return true;
    }
  }
  return false;
}

/** True when `dir` would actually change the board. The screen uses it to grey an arrow
 *  that cannot do anything, rather than letting a press do nothing. */
export function canSlide(board: Board, dir: Dir): boolean {
  return slide(board, dir).moved;
}

/** How far a thumb has to travel before it means a direction rather than a tap. */
export const SWIPE_MIN_PX = 22;

/**
 * The direction a swipe means, or null when it did not travel far enough to mean anything.
 *
 * It lives here, with the rules, for one reason: the gesture is the half of this game that a
 * screenshot cannot check, and a browser harness on this box cannot be trusted to synthesise
 * a drag. As arithmetic it is assertable in plain Node — including the two cases a hurried
 * implementation gets wrong, the diagonal and the tie.
 */
export function swipeDir(dx: number, dy: number, min: number = SWIPE_MIN_PX): Dir | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < min) return null;
  // A diagonal goes to the axis it travelled furthest on; an exact tie goes to the
  // horizontal, because a line of tiles reads left-to-right.
  if (ax >= ay) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/**
 * What the last committed move did, in cells: which tiles travelled where, which cells two
 * tiles joined on, and where the new tile landed.
 *
 * It is engine output rather than a rendering detail because only the rules know which
 * tile went where — two 2s and a merge look identical on two boards compared after the
 * fact. The screen animates from this; nothing in the rules reads it back.
 */
export type MoveTrace = {
  steps: SlideStep[];
  merges: number[];
  /** Where the new tile landed, or null if the board somehow had no room for one. */
  spawnedAt: number | null;
};

/**
 * Everything a round is, in one value. The screen holds this in state; the Node check
 * drives it without a screen at all.
 *
 * `previous` is the state before the last committed move and exactly one level deep. It
 * exists for one reason: the rewarded ad in targets.mjs promises "undo the last move",
 * and a promise has to be kept. Anything deeper would be an undo *history*, which the ad
 * does not sell and the copy does not claim.
 */
export type State = {
  board: Board;
  score: number;
  /** Committed moves. A slide that changes nothing is not one. */
  moves: number;
  /** A 2048 tile has appeared on this board (or on one the undo came back from). */
  won: boolean;
  /** The best tile this round has reached — kept across an undo, so a win is not undone. */
  reached: number;
  /** No slide can do anything: the round is over unless the player takes the rewarded undo. */
  over: boolean;
  /** How the last move got here, for the screen's animation. Null on a fresh board, after
   *  an undo, and in a snapshot. */
  lastMove: MoveTrace | null;
  /** The state one move ago, or null at the start of a round. */
  previous: State | null;
};

/** A fresh board with START_TILES tiles on it. Two, always: a one-tile opening is a
 *  coin flip. */
export function newGame(rand: () => number = Math.random): State {
  let board = EMPTY_BOARD;
  for (let i = 0; i < START_TILES; i++) board = spawn(board, rand);
  return {
    board,
    score: 0,
    moves: 0,
    won: false,
    reached: bestTile(board),
    over: false,
    lastMove: null,
    previous: null,
  };
}

/**
 * Apply one slide. A slide that changes the board always leaves at least one empty cell —
 * a merge frees a cell, and a pure shift moves the gap along the line — so a committed
 * move always gets its new tile.
 *
 * A slide that changes nothing returns the state **unchanged**, `previous` included: an
 * arrow pressed against a wall must not cost the player their one rewarded undo.
 */
export function move(state: State, dir: Dir, rand: () => number = Math.random): State {
  if (state.over) return state;
  const slid = slide(state.board, dir);
  if (!slid.moved) return state;

  const spawned = spawnAt(slid.board, rand);
  const board = spawned?.board ?? slid.board;
  const reached = Math.max(state.reached, bestTile(board));
  return {
    board,
    score: state.score + slid.gained,
    moves: state.moves + 1,
    won: state.won || reached >= WIN_TILE,
    reached,
    over: !hasMove(board),
    lastMove: {
      steps: slid.steps,
      merges: slid.merges,
      spawnedAt: spawned?.index ?? null,
    },
    previous: {
      board: state.board,
      score: state.score,
      moves: state.moves,
      won: state.won,
      reached: state.reached,
      over: state.over,
      // A snapshot has nothing to animate: it is not a move anyone just made.
      lastMove: null,
      previous: null,
    },
  };
}

/**
 * The rewarded undo: the board and the score go back exactly one move. With no move to
 * take back it returns the state unchanged rather than inventing one — the copy on the
 * card says "one move back", and this is what makes that true.
 *
 * `won` and `reached` are carried forward rather than rewound. An ad that took a 2048 off
 * the board would be selling the player their own achievement back, and the win badge on
 * the summary would be a lie about a round that really did reach it.
 */
export function undo(state: State): State {
  const prev = state.previous;
  if (!prev) return state;
  return {
    ...prev,
    won: state.won || prev.won,
    reached: Math.max(prev.reached, state.reached),
    // The board jumps back rather than sliding back: the ad undoes a move, it does not
    // replay one.
    lastMove: null,
    // Exactly one level deep, always: the snapshot must not come back holding a second
    // undo the ad did not sell.
    previous: null,
  };
}

/** True when this state has a move the rewarded undo can actually take back. */
export function canUndo(state: State): boolean {
  return state.previous !== null;
}
