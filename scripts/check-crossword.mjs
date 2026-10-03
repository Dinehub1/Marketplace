#!/usr/bin/env node
/**
 * check-crossword.mjs — pure Node assertions for Daily Mini Crossword engine rules.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  SAMPLE_PUZZLES,
  initCrossword,
  enterLetter,
  backspace,
  checkPuzzle,
  revealCrosswordHint,
  isWrong,
  isRevealed,
} = await import(
  pathToFileURL(path.join(REPO, "apps", "mobile", "lib", "crossword.ts")).href
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

console.log("\nDaily Mini Crossword rules — 5×5 daily grid with Across and Down clues\n");

check("sample puzzles have 5x5 dimensions and non-empty across/down clue sets", () => {
  assert(SAMPLE_PUZZLES.length >= 6, "must have at least 6 mini puzzles");
  for (const p of SAMPLE_PUZZLES) {
    assert.equal(p.size, 5);
    assert.equal(p.solution.length, 5);
    for (const row of p.solution) {
      assert.equal(row.length, 5);
    }
    assert(p.across.length > 0, `${p.id} must have across clues`);
    assert(p.down.length > 0, `${p.id} must have down clues`);
  }
});

check("initCrossword generates an empty 5x5 playable grid preserving black cells", () => {
  const p = SAMPLE_PUZZLES[0];
  const s = initCrossword(p);
  assert.equal(s.grid.length, 5);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (p.solution[r][c] === "#") {
        assert.equal(s.grid[r][c], "#");
      } else {
        assert.equal(s.grid[r][c], "");
      }
    }
  }
  assert.equal(s.solved, false);
});

check("typing advances within the current word and backspace clears letter", () => {
  const p = SAMPLE_PUZZLES[0];
  let s = initCrossword(p);
  const startRow = s.selectedRow;
  const startCol = s.selectedCol;

  s = enterLetter(s, "A");
  assert.equal(s.grid[startRow][startCol], "A");

  s = backspace(s);
  assert.equal(s.grid[startRow][startCol], "");
});

check("checkPuzzle flags wrong letters and revealCrosswordHint uncovers correct letter", () => {
  const p = SAMPLE_PUZZLES[0];
  let s = initCrossword(p);
  const r = s.selectedRow;
  const c = s.selectedCol;
  const correct = p.solution[r][c];
  const wrongLetter = correct === "Z" ? "Y" : "Z";

  s = enterLetter(s, wrongLetter);
  const { state: checked, wrongCount } = checkPuzzle(s);
  assert(wrongCount > 0, "should count at least 1 wrong letter");
  assert(isWrong(checked, r, c), "wrong letter must be flagged by isWrong");

  const fresh = initCrossword(p);
  const targetR = fresh.selectedRow;
  const targetC = fresh.selectedCol;
  const targetCorrect = p.solution[targetR][targetC];
  const hinted = revealCrosswordHint(fresh);
  assert.equal(hinted.grid[targetR][targetC], targetCorrect);
  assert(isRevealed(hinted, targetR, targetC), "hinted cell must be flagged by isRevealed");
});

console.log(`\n${failures === 0 ? "✓ every Daily Mini Crossword rule holds." : `✗ ${failures} failure(s).`}\n`);
process.exit(failures === 0 ? 0 : 1);
