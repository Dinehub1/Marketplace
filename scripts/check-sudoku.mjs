#!/usr/bin/env node
/**
 * check-sudoku.mjs — pure Node assertions for Sudoku engine rules.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  createSudoku,
  DIFFICULTY_CLUES,
  setCellValue,
  toggleNote,
  undoMove,
  revealHint,
  isSafe,
  rowOf,
  colOf,
  blockOf,
} = await import(
  pathToFileURL(path.join(REPO, "apps", "mobile", "lib", "sudoku.ts")).href
);

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (e) {
    failures += 1;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
}

console.log("\nSudoku Daily rules — 9×9 board, 81 cells, 4 difficulty tiers\n");

check("grid indexing maps to valid rows, columns, and 3x3 blocks", () => {
  for (let i = 0; i < 81; i++) {
    const r = rowOf(i);
    const c = colOf(i);
    const b = blockOf(i);
    assert(r >= 0 && r < 9, `row out of bounds for index ${i}`);
    assert(c >= 0 && c < 9, `col out of bounds for index ${i}`);
    assert(b >= 0 && b < 9, `block out of bounds for index ${i}`);
  }
});

check("generated puzzle has a complete valid solution with no conflicts", () => {
  const s = createSudoku("easy");
  assert.equal(s.solution.length, 81);
  for (let i = 0; i < 81; i++) {
    const val = s.solution[i];
    assert(val >= 1 && val <= 9, `solution cell ${i} not in 1..9`);
    const boardCopy = [...s.solution];
    boardCopy[i] = 0;
    assert(isSafe(boardCopy, i, val), `solution conflict at cell ${i}`);
  }
});

check("clue counts match difficulty targets", () => {
  for (const diff of ["easy", "medium", "hard", "expert"]) {
    const s = createSudoku(diff);
    const clues = s.initial.filter((n) => n > 0).length;
    if (diff === "expert") {
      assert(clues >= 24 && clues <= 26, `expert clues out of range 24..26: got ${clues}`);
    } else {
      assert.equal(clues, DIFFICULTY_CLUES[diff], `mismatched clues for ${diff}`);
    }
  }
});

check("valid cell entry updates board and tracks history for undo", () => {
  const s = createSudoku("easy");
  const openIdx = s.initial.findIndex((n) => n === 0);
  assert(openIdx !== -1, "must have open cell");
  const correctVal = s.solution[openIdx];

  const { nextState, isCorrect } = setCellValue(s, openIdx, correctVal);
  assert.equal(isCorrect, true);
  assert.equal(nextState.current[openIdx], correctVal);
  assert.equal(nextState.mistakes, 0);

  const restored = undoMove(nextState);
  assert.equal(restored.current[openIdx], 0);
});

check("invalid cell entry increments mistake counter", () => {
  const s = createSudoku("easy");
  const openIdx = s.initial.findIndex((n) => n === 0);
  const correctVal = s.solution[openIdx];
  const wrongVal = (correctVal % 9) + 1;

  const { nextState, isCorrect } = setCellValue(s, openIdx, wrongVal);
  assert.equal(isCorrect, false);
  assert.equal(nextState.mistakes, 1);
});

check("notes toggle correctly per cell", () => {
  const s = createSudoku("easy");
  const openIdx = s.initial.findIndex((n) => n === 0);
  const withNote = toggleNote(s, openIdx, 5);
  assert(withNote.notes[openIdx]?.includes(5));

  const withoutNote = toggleNote(withNote, openIdx, 5);
  assert(!withoutNote.notes[openIdx]?.includes(5));
});

check("revealHint uncovers the exact solution number in an open cell", () => {
  const s = createSudoku("easy");
  const hinted = revealHint(s);
  const lastMove = hinted.history[hinted.history.length - 1];
  assert(lastMove !== undefined);
  assert.equal(hinted.current[lastMove.index], hinted.solution[lastMove.index]);
});

console.log(`\n${failures === 0 ? "✓ every Sudoku rule holds." : `✗ ${failures} failure(s).`}\n`);
process.exit(failures === 0 ? 0 : 1);
