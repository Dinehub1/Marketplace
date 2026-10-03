#!/usr/bin/env node
/**
 * check-math-sprint.mjs — pure Node assertions for Math Sprint engine rules.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  startSprint,
  generateProblem,
  submitAnswer,
} = await import(
  pathToFileURL(path.join(REPO, "apps", "mobile", "lib", "math-sprint.ts")).href
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

console.log("\nMath Sprint rules — 30-second rapid mental arithmetic drill\n");

check("problem generation always provides 4 distinct options with correctIndex pointing to the answer", () => {
  for (let i = 0; i < 50; i++) {
    const p = generateProblem(i);
    assert.equal(p.options.length, 4, "must have 4 options");
    const unique = new Set(p.options);
    assert.equal(unique.size, 4, "all 4 options must be unique");
    assert(p.correctIndex >= 0 && p.correctIndex < 4, "correctIndex must be in bounds");
  }
});

check("round starts in playing phase with 30s and 0 score", () => {
  const s = startSprint();
  assert.equal(s.phase, "playing");
  assert.equal(s.timeLeft, 30);
  assert.equal(s.score, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.solved, 0);
});

check("correct answer increases score, advances streak, and updates bestStreak", () => {
  let s = startSprint();
  const res = submitAnswer(s, s.currentProblem.correctIndex);
  assert.equal(res.isCorrect, true);
  assert.equal(res.nextState.streak, 1);
  assert.equal(res.nextState.solved, 1);
  assert(res.nextState.score >= 10);
  assert.equal(res.nextState.bestStreak, 1);
});

check("incorrect answer resets current streak to 0 while preserving bestStreak and score", () => {
  let s = startSprint();
  // Answer correctly first
  s = submitAnswer(s, s.currentProblem.correctIndex).nextState;
  const prevScore = s.score;
  const wrongIndex = (s.currentProblem.correctIndex + 1) % 4;

  const res = submitAnswer(s, wrongIndex);
  assert.equal(res.isCorrect, false);
  assert.equal(res.nextState.streak, 0);
  assert.equal(res.nextState.bestStreak, 1);
  assert.equal(res.nextState.score, prevScore);
});

console.log(`\n${failures === 0 ? "✓ every Math Sprint rule holds." : `✗ ${failures} failure(s).`}\n`);
process.exit(failures === 0 ? 0 : 1);
