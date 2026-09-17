#!/usr/bin/env node
/**
 * check-merge-tiles.mjs — the rules of Merge, asserted without a screen.
 *
 * The twin of `scripts/check-block-clear.mjs`, and for the same reason: the probes in
 * `scripts/interactions.mjs` prove the screen *responds*, but they need Playwright and a
 * running preview. The rules live in `apps/mobile/lib/merge-tiles.ts` with no renderer in
 * them, so this loads that module in plain Node and asserts the merge rule, the scoring,
 * the end condition and the rewarded undo directly. A game whose `[2,2,4]` quietly slides
 * to `[8]`, or whose undo rewinds the score by two moves, fails here on a laptop instead
 * of shipping — and a picture of a board cannot tell the difference.
 *
 * Usage:  node scripts/check-merge-tiles.mjs        (npm run check:merge)
 * Exit:   0 every rule holds, 1 one of them does not
 *
 * `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` is in the npm script for the same
 * reason as the Block Clear check: the engine is a `.ts` file and apps/mobile/package.json
 * is deliberately not `"type": "module"` (Expo/Metro expect CommonJS there).
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  at,
  bestTile,
  canSlide,
  canUndo,
  CELLS,
  DIRS,
  EMPTY_BOARD,
  empties,
  hasMove,
  lineIndexes,
  mergeLine,
  move,
  N,
  newGame,
  slide,
  spawn,
  spawnValue,
  START_TILES,
  SPAWN_FOUR_CHANCE,
  swipeDir,
  SWIPE_MIN_PX,
  undo,
  WIN_TILE,
} = await import(
  pathToFileURL(path.join(REPO, "apps", "mobile", "lib", "merge-tiles.ts")).href
);

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
  }
}
const ok = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const eq = (got, want, what) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) throw new Error(`${what}: got ${a}, expected ${b}`);
};

/** A board from 16 values, row by row. */
const board = (...rows) => rows.flat();
/** The board as rows, for a readable failure message. */
const rowsOf = (b) => Array.from({ length: N }, (_, r) => b.slice(r * N, r * N + N));

/** Always a 2, never a 4 — so a spawned tile cannot be mistaken for a merge. The cell
 *  it lands on is the middle empty one, which is deterministic but not the point. */
const ALWAYS_TWO = () => 0.5;
/** First call picks the first empty cell, second call spawns a 2 — the order spawn()
 *  uses them in, so the position assertions below are about position. */
const FIRST_EMPTY_TWO = (() => {
  let call = 0;
  return () => (call++ === 0 ? 0 : 0.5);
})();

/** A seeded PRNG, so a whole round is reproducible rather than merely probable. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every tile is either empty or a power of two ≥ 2 — the invariant a merge game cannot
 *  break without the board becoming unplayable. */
function tilesAreLegal(b) {
  for (const v of b) {
    if (v === 0) continue;
    if (v < 2 || (v & (v - 1)) !== 0) return false;
  }
  return true;
}

console.log(`\nMerge rules — ${N}×${N} board, ${CELLS} cells, win at ${WIN_TILE}\n`);

/* ── the board and the numbers the screen prints ───────────────────────────── */

check("the board and the rules are the numbers the start screen promises", () => {
  // Pinned literals, not re-derived: a check written as `CELLS === N * N` passes whatever
  // the constants become, which is the regression this is here to catch.
  eq(N, 4, "the board is 4×4");
  eq(CELLS, 16, "the board has 16 cells");
  eq(WIN_TILE, 2048, "the round is aiming at 2048");
  eq(START_TILES, 2, "a round starts with two tiles");
  eq(SPAWN_FOUR_CHANCE, 0.1, "one new tile in ten is a 4");
  eq(EMPTY_BOARD.length, CELLS, "the empty board is the size of the board");
  eq(bestTile(EMPTY_BOARD), 0, "an empty board has no best tile");
});

/* ── the merge rule, on hand-written lines ─────────────────────────────────── */

check("a slide packs the line against the wall", () => {
  eq(mergeLine([0, 0, 0, 2]).line, [2, 0, 0, 0], "a lone tile slides to the wall");
  eq(mergeLine([0, 2, 0, 0]).line, [2, 0, 0, 0], "a gap before the tile closes");
  eq(mergeLine([2, 0, 4, 0]).line, [2, 4, 0, 0], "two tiles keep their order, gaps gone");
  eq(mergeLine([2, 0, 4, 0]).gained, 0, "packing two different tiles scores nothing");
  eq(mergeLine([8, 4, 2, 0]).line, [8, 4, 2, 0], "an already-packed line is left alone");
});

check("two equal neighbours join, and the join scores its own value", () => {
  const cases = [
    [[2, 2, 0, 0], [4, 0, 0, 0], 4, 1, "2+2"],
    [[4, 4, 0, 0], [8, 0, 0, 0], 8, 1, "4+4"],
    [[1024, 1024, 0, 0], [2048, 0, 0, 0], 2048, 1, "1024+1024 reaches the win tile"],
    [[2, 0, 2, 0], [4, 0, 0, 0], 4, 1, "a gap does not stop a join"],
    [[2, 4, 8, 16], [2, 4, 8, 16], 0, 0, "four different tiles never join"],
  ];
  for (const [input, line, gained, joins, what] of cases) {
    const got = mergeLine(input);
    eq(got.line, line, `${what}: line`);
    eq(got.gained, gained, `${what}: gained`);
    eq(got.joins, joins, `${what}: joins`);
  }
});

check("a tile produced by a join cannot join again in the same move", () => {
  // This is the rule the whole game rests on, and the one a naive implementation gets
  // wrong: [2,2,2,2] is two joins (score 8), never a cascade to 8 (which would score 8
  // but leave one tile instead of two).
  const cases = [
    [[2, 2, 2, 2], [4, 4, 0, 0], 8, 2, "four twos make two fours"],
    [[2, 2, 4, 0], [4, 4, 0, 0], 4, 1, "[2,2,4] makes [4,4], not [8]"],
    [[4, 2, 2, 0], [4, 4, 0, 0], 4, 1, "[4,2,2] makes [4,4]"],
    [[2, 2, 2, 0], [4, 2, 0, 0], 4, 1, "the pair nearest the wall joins first"],
    [[2, 2, 4, 4], [4, 8, 0, 0], 12, 2, "two separate pairs both join"],
    [[4, 4, 8, 8], [8, 16, 0, 0], 24, 2, "pairs stay in their own halves"],
  ];
  for (const [input, line, gained, joins, what] of cases) {
    const got = mergeLine(input);
    eq(got.line, line, `${what}: line`);
    eq(got.gained, gained, `${what}: gained`);
    eq(got.joins, joins, `${what}: joins`);
  }
  eq(mergeLine([2, 2, 2, 2]).line.filter((v) => v !== 0).length, 2, "four twos leave two tiles, not one");
});

check("every merge carries the source cells it came from", () => {
  // The screen animates tiles rather than redrawing them, so it needs to know which input
  // cell became which output cell. The mapping is derived from the rules here, not guessed
  // by the renderer from two boards that happen to look alike.
  eq(mergeLine([2, 2, 0, 0]).sources, [[0, 1], [], [], []], "a join names both of its sources");
  eq(mergeLine([0, 2, 2, 0]).sources, [[1, 2], [], [], []], "the sources are the input positions, gaps and all");
  eq(mergeLine([2, 0, 4, 0]).sources, [[0], [2], [], []], "a moved tile names its own source");
  eq(mergeLine([0, 0, 0, 2]).sources, [[3], [], [], []], "a tile crosses the whole line");
  eq(mergeLine([2, 2, 4, 4]).sources, [[0, 1], [2, 3], [], []], "two joins keep their own pairs");
  eq(mergeLine([2, 4, 8, 16]).sources, [[0], [1], [2], [3]], "nothing moved, so every source is its own slot");
  eq(mergeLine([0, 0, 0, 0]).sources, [[], [], [], []], "an empty line has no sources");

  // And the same information at board level, where the indices are board indices.
  const b = board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const slid = slide(b, "left");
  eq(slid.merges, [at(0, 0)], "the join landed in the top-left cell");
  eq(
    slid.steps.filter((s) => s.to === at(0, 0)).map((s) => s.from).sort((x, y) => x - y),
    [at(0, 0), at(0, 1)],
    "the destination reports both tiles that reached it",
  );
  // Every surviving tile is accounted for exactly once as a `from`, which is what lets a
  // renderer move tiles instead of rebuilding them.
  const sources = slid.steps.map((s) => s.from).sort((x, y) => x - y);
  eq(new Set(sources).size, sources.length, "a tile was reported leaving two cells at once");
  eq(sources.length, b.filter((v) => v !== 0).length, "a tile on the board had no journey reported");
});

/* ── directions ────────────────────────────────────────────────────────────── */

check("every direction reads each line once, in the order tiles meet the wall", () => {
  eq(lineIndexes("left", 0), [0, 1, 2, 3], "the top row, left to right");
  eq(lineIndexes("right", 0), [3, 2, 1, 0], "the top row, right to left");
  eq(lineIndexes("up", 0), [0, 4, 8, 12], "the first column, top to bottom");
  eq(lineIndexes("down", 0), [12, 8, 4, 0], "the first column, bottom to top");
  for (const dir of DIRS) {
    const seen = new Set();
    for (let i = 0; i < N; i++) for (const idx of lineIndexes(dir, i)) seen.add(idx);
    eq(seen.size, CELLS, `${dir}: every cell belongs to exactly one line`);
  }
});

check("sliding left and right are mirrors of each other", () => {
  const left = slide(board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), "left");
  eq(rowsOf(left.board)[0], [4, 0, 0, 0], "a row slides left");
  eq(left.gained, 4, "the left slide scored its join");

  const right = slide(board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), "right");
  eq(rowsOf(right.board)[0], [0, 0, 0, 4], "the same row slides right");
  eq(right.gained, 4, "the right slide scored the same join");
});

check("sliding up and down are mirrors of each other", () => {
  const col = board(2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const up = slide(col, "up");
  eq(up.board[at(0, 0)], 4, "the column merges at the top");
  eq(up.board[at(1, 0)], 0, "the second cell is emptied by the merge");
  const down = slide(col, "down");
  eq(down.board[at(3, 0)], 4, "the column merges at the bottom");
  eq(down.board[at(2, 0)], 0, "the third cell is emptied by the merge");
});

check("a swipe means the direction it travelled furthest on, and nothing below the threshold", () => {
  // The gesture is the one interaction a screenshot cannot check and this box cannot
  // synthesise, so the arithmetic behind it is asserted instead: a diagonal, an exact tie,
  // and a thumb that barely moved.
  eq(SWIPE_MIN_PX, 22, "the swipe threshold the screen uses");
  eq(swipeDir(0, 0), null, "a tap is not a swipe");
  eq(swipeDir(SWIPE_MIN_PX - 1, 0), null, "just under the threshold is not a swipe");
  eq(swipeDir(0, -(SWIPE_MIN_PX - 1)), null, "just under the threshold upwards is not a swipe");
  eq(swipeDir(SWIPE_MIN_PX, 0), "right", "exactly at the threshold is a swipe");
  eq(swipeDir(-40, 0), "left", "a leftward swipe");
  eq(swipeDir(40, -6), "right", "a mostly-horizontal swipe with a little drift");
  eq(swipeDir(6, 40), "down", "a mostly-vertical swipe with a little drift");
  eq(swipeDir(-6, -40), "up", "an upward swipe");
  eq(swipeDir(40, 30), "right", "a diagonal goes to the longer axis");
  eq(swipeDir(30, 40), "down", "a diagonal the other way goes down");
  eq(swipeDir(35, 35), "right", "an exact tie goes to the horizontal");
  eq(swipeDir(-35, -35), "left", "an exact tie the other way");
  eq(swipeDir(0.5, 0.5), null, "a tremor is not a swipe");
});

check("a slide that changes nothing says so, and a slide that changes something says that", () => {
  // A row packed against the left wall with a gap on its right: left is the no-op, right
  // is the real move. (A gap is required — a full row with no equal neighbours cannot
  // slide in either direction, which is the end condition, not a bug.)
  const packed = board(2, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  eq(slide(packed, "left").moved, false, "an already-left-packed row reported a move");
  eq(slide(packed, "right").moved, true, "a row with room to its right reported no move");
  ok(canSlide(packed, "right"), "canSlide disagreed with slide");
  ok(!canSlide(packed, "left"), "canSlide reported a move that does not exist");
});

check("slide copies the board instead of editing the one it was handed", () => {
  const before = board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const snapshot = before.slice();
  slide(before, "left");
  eq(before, snapshot, "slide() mutated its input");
});

/* ── spawning ──────────────────────────────────────────────────────────────── */

check("a new tile is a 2 or a 4, and lands on an empty cell", () => {
  eq(spawnValue(ALWAYS_TWO), 2, "the common spawn");
  eq(spawnValue(() => 0), 4, "one in ten spawns is a 4");
  eq(spawnValue(() => 0.09), 4, "just under the threshold is a 4");
  eq(spawnValue(() => 0.1), 2, "the threshold itself is a 2");

  const one = spawn(EMPTY_BOARD, FIRST_EMPTY_TWO);
  eq(one.filter((v) => v !== 0).length, 1, "one tile was placed");
  eq(one[0], 2, "the first empty cell took the tile");

  const full = board(2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2);
  eq(spawn(full, ALWAYS_TWO), full, "spawning on a full board invented a cell");
  const boardSnapshot = full.slice();
  spawn(full, ALWAYS_TWO);
  eq(full, boardSnapshot, "spawn() mutated its input");
});

check("one spawn in ten is a 4, over 20,000 draws", () => {
  const rand = mulberry32(7);
  let fours = 0;
  for (let i = 0; i < 20000; i++) if (spawnValue(rand) === 4) fours++;
  const rate = fours / 20000;
  ok(rate > 0.08 && rate < 0.12, `the 4-rate came out at ${(rate * 100).toFixed(1)}%, not near 10%`);
});

/* ── the start and the end ─────────────────────────────────────────────────── */

check("a round starts with two tiles, no score and no history", () => {
  const s = newGame(mulberry32(1));
  eq(s.board.filter((v) => v !== 0).length, START_TILES, "tiles on a fresh board");
  eq(s.score, 0, "score on a fresh board");
  eq(s.moves, 0, "moves on a fresh board");
  eq(s.over, false, "a fresh board is not over");
  eq(s.won, false, "a fresh board has not won");
  eq(s.previous, null, "a fresh board has nothing to undo");
  ok(tilesAreLegal(s.board), "a fresh board holds a value that is not a power of two");
});

check("the end condition is a full board with no two neighbours equal", () => {
  const checker = board(2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2);
  eq(empties(checker).length, 0, "the checkerboard is full");
  ok(!hasMove(checker), "a checkerboard reported a move");

  const pair = checker.slice();
  pair[at(0, 0)] = 2;
  pair[at(0, 1)] = 2;
  ok(hasMove(pair), "a full board with a joinable pair reported no move");

  const gap = checker.slice();
  gap[at(2, 2)] = 0;
  ok(hasMove(gap), "a board with an empty cell reported no move");
  eq(slide(gap, "left").moved, true, "a board with an empty cell cannot slide");
});

/* ── a move ────────────────────────────────────────────────────────────────── */

check("a committed move scores its joins, adds one tile and remembers the board before it", () => {
  const before = board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const s = { board: before, score: 0, moves: 0, won: false, reached: 2, over: false, lastMove: null, previous: null };
  const after = move(s, "left", ALWAYS_TWO);

  eq(after.score, 4, "the score after one join");
  eq(after.moves, 1, "committed moves");
  eq(after.board.filter((v) => v !== 0).length, 2, "the merged tile plus the one new tile");
  eq(after.board[at(0, 0)], 4, "the join landed at the wall");
  ok(tilesAreLegal(after.board), "the move produced a value that is not a power of two");
  eq(after.previous.board, before, "the previous board was not kept");
  eq(after.previous.score, 0, "the previous score was not kept");
  ok(canUndo(after), "a committed move left nothing to undo");

  // The trace the screen animates from, asserted here because a renderer cannot recover
  // it: which cells the tiles left, which cell joined, and where the new tile landed.
  ok(after.lastMove, "a committed move left no trace to animate");
  eq(after.lastMove.merges, [at(0, 0)], "the trace does not name the cell that joined");
  eq(
    after.lastMove.steps.filter((s) => s.to === at(0, 0)).map((s) => s.from).sort((x, y) => x - y),
    [at(0, 0), at(0, 1)],
    "the trace does not move both joining tiles into the join",
  );
  ok(after.lastMove.spawnedAt !== null, "the trace does not say where the new tile arrived");
  eq(after.board[after.lastMove.spawnedAt], 2, "the cell the trace calls new does not hold the new tile");
  eq(after.previous.lastMove, null, "a snapshot came back with a move to animate");
});

check("a slide against a wall is not a move, costs nothing and keeps the undo", () => {
  const packed = board(2, 4, 8, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const s = { board: packed, score: 40, moves: 3, won: false, reached: 16, over: false, lastMove: null, previous: null };
  eq(move(s, "left", ALWAYS_TWO), s, "a slide that changes nothing produced a new state");
  eq(s.moves, 3, "a slide that changes nothing counted as a move");
});

/* ── the rewarded undo ─────────────────────────────────────────────────────── */

check("the rewarded undo puts the board and the score back exactly one move", () => {
  // Hand-built rather than drawn from newGame(): the point of this check is the undo, and
  // a random opening could hand "left" a row that is already against the wall — which
  // would make every assertion below pass without a move ever happening.
  const start = {
    board: board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    score: 0,
    moves: 0,
    won: false,
    reached: 2,
    over: false,
    lastMove: null,
    previous: null,
  };
  const moved = move(start, "left", ALWAYS_TWO);
  ok(canUndo(moved), "a real move left nothing to undo");
  const undone = undo(moved);
  eq(undone.board, start.board, "the undo did not restore the board");
  eq(undone.score, start.score, "the undo did not restore the score");
  eq(undone.moves, start.moves, "the undo did not restore the move count");
  eq(canUndo(undone), false, "the undo left a second undo behind");
  eq(undo(undone).board, undone.board, "undoing with nothing to undo changed the board");
});

check("the undo goes back one move, never two", () => {
  const start = {
    board: board(2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    score: 0,
    moves: 0,
    won: false,
    reached: 2,
    over: false,
    lastMove: null,
    previous: null,
  };
  const first = move(start, "left", ALWAYS_TWO);
  const second = move(first, "right", ALWAYS_TWO);
  ok(first.moves === 1 && second.moves === 2, "the two test moves did not both commit");
  ok(canUndo(second), "the second move left nothing to undo");
  const back = undo(second);
  eq(back.board, first.board, "the undo did not stop at one move back");
  eq(back.board === start.board, false, "the undo rewound two moves");
});

check("an undo does not take a win off the board", () => {
  // One join away from 2048, with a deterministic spawn so only the merge can win it.
  const nearly = board(1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const s = { board: nearly, score: 0, moves: 0, won: false, reached: 1024, over: false, lastMove: null, previous: null };
  const won = move(s, "left", ALWAYS_TWO);
  eq(won.reached, WIN_TILE, "the merge did not reach the win tile");
  eq(won.won, true, "the round did not record the win");
  const undone = undo(won);
  eq(undone.board, nearly, "the undo did not restore the board");
  eq(undone.reached, WIN_TILE, "the undo took the reached tile back");
  eq(undone.won, true, "the undo took the win back");
});

/* ── a whole round ─────────────────────────────────────────────────────────── */

check("a full round terminates, keeps its invariants and makes progress", () => {
  const rand = mulberry32(2024);
  let s = newGame(rand);
  let guard = 0;

  while (!s.over) {
    ok(++guard < 20000, "a round ran for 20,000 moves without ending");
    ok(tilesAreLegal(s.board), `move ${s.moves} left an illegal tile on the board`);

    // Play greedily: the slide that joins the most, then the one that scores the most,
    // then a fixed order. That exercises merging and spawning far harder than a
    // first-move walk would.
    let best = null;
    for (const dir of DIRS) {
      const r = slide(s.board, dir);
      if (!r.moved) continue;
      const rank = r.joins * 1000 + r.gained;
      if (!best || rank > best.rank) best = { dir, rank };
    }
    ok(best, "the round is not over, but no direction can move");
    const next = move(s, best.dir, rand);
    ok(next.moves === s.moves + 1, "a slide that moved did not count as a move");
    ok(next.score >= s.score, "the score went down during a round");
    ok(next.reached >= s.reached, "the best tile went down during a round");
    s = next;
  }

  eq(empties(s.board).length, 0, "the finished board still had an empty cell");
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = s.board[at(r, c)];
      if (c + 1 < N) ok(s.board[at(r, c + 1)] !== v, `the finished board still had a joinable pair at row ${r + 1}`);
      if (r + 1 < N) ok(s.board[at(r + 1, c)] !== v, `the finished board still had a joinable pair at column ${c + 1}`);
    }
  }
  ok(s.moves >= 20, `a greedy round ended after only ${s.moves} moves`);
  ok(s.reached >= 64, `a greedy round never got past ${s.reached}`);
  ok(s.score > 0, "a round finished with a score of zero");
  ok(s.won === false || s.reached >= WIN_TILE, "the round claims a win it did not reach");
});

/* ── report ────────────────────────────────────────────────────────────────── */

if (failures) {
  console.error(`\n✗ ${failures} rule(s) broken.\n`);
  process.exit(1);
}
console.log("\n✓ every Merge rule holds.\n");
