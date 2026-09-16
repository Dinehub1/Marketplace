#!/usr/bin/env node
/**
 * check-block-clear.mjs — the rules of Block Clear, asserted without a screen.
 *
 * Why this exists next to `scripts/interactions.mjs`: the probes there prove the
 * screen *responds*, but they need Playwright and a running preview. The rules are
 * the part that can be checked anywhere, because they live in
 * `apps/mobile/lib/block-clear.ts` with no renderer in them — so a scoring change
 * that quietly halves every combo, or an end condition that fires one move early,
 * fails here on a laptop instead of shipping. A screenshot cannot tell the
 * difference; this can.
 *
 * Usage:  node scripts/check-block-clear.mjs        (npm run check:game)
 * Exit:   0 every rule holds, 1 one of them does not
 *
 * `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` is in the npm script because the
 * engine is a `.ts` file and apps/mobile/package.json is deliberately not
 * `"type": "module"` (Expo/Metro expect CommonJS there). Node strips the types and
 * detects ESM, which is the point; it just says so once.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  anchors,
  at,
  CELLS,
  clearLines,
  drawTray,
  EMPTY_BOARD,
  fits,
  freshTray,
  hasAnyMove,
  N,
  place,
  POINTS_PER_BLOCK,
  POINTS_PER_LINE,
  scoreFor,
  SHAPES,
} = await import(
  pathToFileURL(path.join(REPO, "apps", "mobile", "lib", "block-clear.ts")).href
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

const piece = (key) => {
  const sh = SHAPES.find((s) => s.key === key);
  if (!sh) throw new Error(`the bag has no shape called "${key}"`);
  return sh;
};
const boardWith = (cells) => {
  const b = EMPTY_BOARD.slice();
  for (const [r, c] of cells) b[at(r, c)] = true;
  return b;
};
const filled = (board) => board.filter(Boolean).length;

console.log(`\nBlock Clear rules — ${SHAPES.length} pieces, ${N}×${N} board, ${CELLS} cells\n`);

/* ── the bag ───────────────────────────────────────────────────────────────── */

check("every piece is well formed, and no two are the same piece twice", () => {
  const keys = new Set();
  const shapes = new Set();
  for (const sh of SHAPES) {
    ok(!keys.has(sh.key), `duplicate piece key "${sh.key}"`);
    keys.add(sh.key);
    ok(sh.size === sh.cells.length, `${sh.key}: size says ${sh.size}, cells say ${sh.cells.length}`);
    ok(sh.w <= N && sh.h <= N, `${sh.key} is ${sh.w}×${sh.h}, which cannot fit a ${N}×${N} board`);
    const seen = new Set();
    for (const [r, c] of sh.cells) {
      ok(r >= 0 && c >= 0 && r < sh.h && c < sh.w, `${sh.key}: a cell sits outside its own ${sh.w}×${sh.h} box`);
      const k = `${r},${c}`;
      ok(!seen.has(k), `${sh.key}: lists the cell ${k} twice`);
      seen.add(k);
    }
    // A rotation-only duplicate would silently weight the draw toward whichever
    // shape has the most of them, which is exactly what drawing pieces must not do.
    const normal = [...sh.cells].map(([r, c]) => `${r},${c}`).sort().join(" ");
    ok(!shapes.has(normal), `${sh.key} is a duplicate of an existing piece`);
    shapes.add(normal);
  }
  ok(SHAPES.length >= 20, `only ${SHAPES.length} pieces in the bag`);
});

/* ── the bag and the numbers the screen prints ─────────────────────────────── */

check("the board and the scoring are the numbers the start screen promises", () => {
  // Pinned literals, not `N` re-derived: a check written as `anchors(...) === CELLS`
  // passes whatever the constants become, which is exactly the regression this is
  // here to catch. `POINTS_PER_LINE = 5` must fail; the copy on the card says ×10.
  eq(N, 8, "the board is 8×8");
  eq(CELLS, 64, "the board has 64 cells");
  eq(POINTS_PER_BLOCK, 1, "points for one block");
  eq(POINTS_PER_LINE, 10, "points for one line, before the combo");
});

/* ── placement ─────────────────────────────────────────────────────────────── */

check("every piece fits the empty board in exactly the places it should", () => {
  eq(anchors(EMPTY_BOARD, piece("dot")).length, CELLS, "anchors for a 1×1");
  eq(anchors(EMPTY_BOARD, piece("i5h")).length, N * (N - 4), "anchors for a 5-wide bar");
  eq(anchors(EMPTY_BOARD, piece("i5v")).length, (N - 4) * N, "anchors for a 5-tall bar");
  eq(anchors(EMPTY_BOARD, piece("o3")).length, (N - 2) * (N - 2), "anchors for a 3×3");
  eq(anchors(EMPTY_BOARD, piece("corner-nw")).length, (N - 1) * (N - 1), "anchors for a corner");
});

check("a piece may not hang off the board or land on a block", () => {
  ok(!fits(EMPTY_BOARD, piece("i5h"), 0, 4), "a 5-wide bar was allowed to start at column 4 of 8");
  ok(!fits(EMPTY_BOARD, piece("i5v"), 4, 0), "a 5-tall bar was allowed to start at row 4 of 8");
  ok(!fits(EMPTY_BOARD, piece("corner-nw"), N - 1, N - 1), "a corner was allowed to hang off the bottom-right");
  const b = boardWith([[3, 3]]);
  ok(!fits(b, piece("dot"), 3, 3), "a block was allowed on top of another block");
  ok(!fits(b, piece("i3h"), 3, 1), "a bar was allowed to pass through a block");
  ok(fits(b, piece("dot"), 3, 4), "a legal square next to a block was refused");
});

check("placing and clearing copy the board instead of editing the one they were handed", () => {
  const before = boardWith([[0, 0]]);
  const snapshot = before.slice();
  place(before, piece("i5h"), 4, 0);
  eq(before, snapshot, "place() mutated its input");

  const fullRow = boardWith(Array.from({ length: N }, (_, c) => [0, c]));
  const rowSnapshot = fullRow.slice();
  clearLines(fullRow);
  eq(fullRow, rowSnapshot, "clearLines() mutated its input");
});

/* ── clearing ──────────────────────────────────────────────────────────────── */

check("a completed row clears, and only that row", () => {
  const almost = boardWith(Array.from({ length: N - 1 }, (_, c) => [0, c]));
  const res = clearLines(place(almost, piece("dot"), 0, N - 1));
  eq(res.lines, 1, "lines cleared");
  eq(filled(res.board), 0, "blocks left on the board after the clear");
});

check("a placement that completes a row and a column clears both in one move", () => {
  const cells = [];
  for (let c = 1; c < N; c++) cells.push([0, c]);
  for (let r = 1; r < N; r++) cells.push([r, 0]);
  const res = clearLines(place(boardWith(cells), piece("dot"), 0, 0));
  eq(res.lines, 2, "lines cleared");
  eq(filled(res.board), 0, "blocks left on the board after the clear");
});

/* ── scoring ───────────────────────────────────────────────────────────────── */

check("scoring follows the rule printed on the start screen", () => {
  const four = piece("i4h");
  eq(scoreFor(four, 0, 0), 4, "a four-block placement that clears nothing");
  eq(scoreFor(four, 1, 1), 14, "the first line of a run");
  eq(scoreFor(four, 1, 2), 24, "the second line in a row");
  eq(scoreFor(four, 1, 5), 54, "the fifth line in a row");
  eq(scoreFor(four, 2, 1), 24, "two lines at once");
  eq(scoreFor(four, 2, 3), 64, "two lines on a ×3 combo");
  // A placement that clears nothing must not be multiplied: the combo resets.
  eq(scoreFor(piece("dot"), 0, 0), 1, "a single block after a broken combo");
});

/* ── the end condition ─────────────────────────────────────────────────────── */

check("the round ends exactly when nothing in the tray fits", () => {
  ok(!hasAnyMove(EMPTY_BOARD, [null, null, null]), "an empty tray reported a move");
  const full = EMPTY_BOARD.map(() => true);
  ok(!hasAnyMove(full, drawTray()), "a full board reported a move");
  const oneHole = full.slice();
  oneHole[at(4, 4)] = false;
  ok(hasAnyMove(oneHole, [piece("dot")]), "a lone hole should still take a 1×1");
  ok(!hasAnyMove(oneHole, [piece("i2h")]), "a lone hole was reported as a move for a 2-long bar");
  ok(!hasAnyMove(oneHole, [null, piece("i2v"), null]), "a lone hole was reported as a move for a 2-tall bar");
});

check("the rewarded tray always holds a piece that fits (200 draws)", () => {
  const full = EMPTY_BOARD.map(() => true);
  const oneHole = full.slice();
  oneHole[at(4, 4)] = false;
  for (let i = 0; i < 200; i++) {
    ok(
      hasAnyMove(oneHole, freshTray(oneHole)),
      "a rewarded tray was handed over with nothing in it that fits — the ad paid nothing",
    );
  }
  // And it does not invent a move on a board that has no room at all: the copy on
  // the card says "once per round", not "always".
  ok(!hasAnyMove(full, freshTray(full)), "a full board was promised a move it cannot have");
});

/* ── a whole round ─────────────────────────────────────────────────────────── */

check("a full round terminates, and never leaves a completed line on the board", () => {
  let board = EMPTY_BOARD.slice();
  let tray = drawTray();
  let score = 0;
  let combo = 0;
  let placed = 0;
  let moves = 0;
  while (hasAnyMove(board, tray)) {
    ok(++moves < 5000, "a round ran for 5000 placements without ending");
    // Play greedily: the most lines, then the most blocks. That exercises clearing
    // and combos far harder than a first-fit walk would.
    let best = null;
    for (let i = 0; i < tray.length; i++) {
      const sh = tray[i];
      if (!sh) continue;
      for (const index of anchors(board, sh)) {
        const res = clearLines(place(board, sh, Math.floor(index / N), index % N));
        const rank = res.lines * 100 + sh.size;
        if (!best || rank > best.rank) best = { i, sh, res, rank };
      }
    }
    ok(best, "hasAnyMove reported a move, but no placement could be found");
    const nextCombo = best.res.lines > 0 ? combo + 1 : 0;
    score += scoreFor(best.sh, best.res.lines, nextCombo);
    combo = nextCombo;
    placed += best.sh.size;
    board = best.res.board;
    const left = tray.map((p, i) => (i === best.i ? null : p));
    tray = left.every((p) => p === null) ? drawTray() : left;
  }
  eq(clearLines(board).lines, 0, "the finished board still had a full line on it");
  ok(placed > 0, "a round ended without placing a single block");
  ok(score >= placed * POINTS_PER_BLOCK, "the score came out below the blocks that were placed");
  ok(combo >= 0, "the combo went negative");
});

/* ── report ────────────────────────────────────────────────────────────────── */

if (failures) {
  console.error(`\n✗ ${failures} rule(s) broken.\n`);
  process.exit(1);
}
console.log("\n✓ every Block Clear rule holds.\n");
