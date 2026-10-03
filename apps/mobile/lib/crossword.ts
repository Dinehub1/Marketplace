/**
 * Daily Mini Crossword Engine.
 *
 * Implements:
 * - 5x5 daily mini crosswords with Across and Down clues.
 * - Clue numbering derived from the grid (standard crossword numbering), so a
 *   puzzle is just a solution grid + a clue per answer and can never drift.
 * - Cell focus navigation (typing advances within the word, then jumps to the
 *   next unfinished clue; backspace steps back).
 * - Check (flag wrong letters) & hint reveals.
 * - Rewarded Ad integration: "Reveal Letter / Check Puzzle".
 */

export type Direction = "across" | "down";

export type Clue = {
  num: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
};

export type MiniCrosswordPuzzle = {
  id: string;
  title: string;
  size: 5;
  // 5 rows x 5 cols string: letters or '#' for black block
  solution: string[];
  across: Clue[];
  down: Clue[];
};

const SIZE = 5;

/**
 * Build a puzzle from its solution grid. Every run of 2+ white cells becomes an
 * entry; numbers are assigned in reading order like a printed crossword.
 * `clues` maps each answer word to its clue text.
 */
function buildPuzzle(
  id: string,
  title: string,
  solution: string[],
  clues: Record<string, string>
): MiniCrosswordPuzzle {
  const isWhite = (r: number, c: number) =>
    r >= 0 && r < SIZE && c >= 0 && c < SIZE && solution[r][c] !== "#";

  const across: Clue[] = [];
  const down: Clue[] = [];
  let num = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isWhite(r, c)) continue;
      const startsAcross = !isWhite(r, c - 1) && isWhite(r, c + 1);
      const startsDown = !isWhite(r - 1, c) && isWhite(r + 1, c);
      if (!startsAcross && !startsDown) continue;
      num++;
      if (startsAcross) {
        let answer = "";
        for (let x = c; isWhite(r, x); x++) answer += solution[r][x];
        across.push({ num, row: r, col: c, answer, clue: clues[answer] ?? answer });
      }
      if (startsDown) {
        let answer = "";
        for (let y = r; isWhite(y, c); y++) answer += solution[y][c];
        down.push({ num, row: r, col: c, answer, clue: clues[answer] ?? answer });
      }
    }
  }

  return { id, title, size: 5, solution, across, down };
}

export const SAMPLE_PUZZLES: MiniCrosswordPuzzle[] = [
  buildPuzzle("mini-1", "Daily Mini #1", ["##ASH", "#FLEA", "IRONY", "TENT#", "SEE##"], {
    ASH: "What's left after a campfire",
    FLEA: "Tiny jumping pest on a dog",
    IRONY: "Rain on your wedding day, per Alanis",
    TENT: "Camper's portable shelter",
    SEE: "\"I ___ what you did there\"",
    ITS: "Belonging to it",
    FREE: "Costing nothing",
    ALONE: "Home ___ (1990 holiday film)",
    SENT: "Mailed off",
    HAY: "Bale material for horses",
  }),
  buildPuzzle("mini-2", "Daily Mini #2", ["##FUN", "#WISE", "SHEET", "HELD#", "END##"], {
    FUN: "Enjoyment",
    WISE: "Like an old owl, supposedly",
    SHEET: "Bed linen or page of paper",
    HELD: "Kept in one's hands",
    END: "Finale",
    SHE: "Her, as a subject",
    WHEN: "\"___ in Rome...\"",
    FIELD: "Farmland or soccer pitch",
    USED: "Second-hand",
    NET: "Tennis court divider",
  }),
  buildPuzzle("mini-3", "Daily Mini #3", ["##WOE", "#PONY", "SAUCE", "PINE#", "ADD##"], {
    WOE: "Great sorrow",
    PONY: "Small horse",
    SAUCE: "Pasta topping",
    PINE: "Evergreen with needles",
    ADD: "Do some summing",
    SPA: "Place for a massage",
    PAID: "Settled the bill",
    WOUND: "Injury that needs a bandage",
    ONCE: "___ upon a time",
    EYE: "Organ of sight",
  }),
  buildPuzzle("mini-4", "Daily Mini #4", ["ATE##", "ROLL#", "CABIN", "#DOVE", "##WET"], {
    ATE: "Had dinner",
    ROLL: "Dinner bread or dice action",
    CABIN: "Log house in the woods",
    DOVE: "Bird of peace",
    WET: "Soaked",
    ARC: "Part of a circle",
    TOAD: "Warty amphibian",
    ELBOW: "Arm joint",
    LIVE: "Not recorded, as a concert",
    NET: "Fisherman's catcher",
  }),
  buildPuzzle("mini-5", "Daily Mini #5", ["ELK##", "LEAN#", "MAYOR", "#DATA", "##KEY"], {
    ELK: "Large antlered deer",
    LEAN: "Not fatty, as meat",
    MAYOR: "City leader",
    DATA: "Facts and figures",
    KEY: "Lock opener",
    ELM: "Shade tree",
    LEAD: "Pencil filling",
    KAYAK: "Paddled boat (and a palindrome)",
    NOTE: "Quick written message",
    RAY: "Beam of sunshine",
  }),
  buildPuzzle("mini-6", "Daily Mini #6", ["#BAD#", "MONEY", "EAGLE", "TREAT", "#DRY#"], {
    BAD: "Not good",
    MONEY: "Cash",
    EAGLE: "Bald national bird",
    TREAT: "Trick-or-___",
    DRY: "Like a desert",
    MET: "Got to know",
    BOARD: "Chess surface",
    ANGER: "Rage",
    DELAY: "Flight board bad news",
    YET: "So far",
  }),
];

/** Today's puzzle index, so the "daily" mini actually changes each day. */
export function dailyPuzzleIndex(now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  return day % SAMPLE_PUZZLES.length;
}

export type CrosswordState = {
  puzzle: MiniCrosswordPuzzle;
  grid: string[][]; // 5x5 current letters
  selectedRow: number;
  selectedCol: number;
  direction: Direction;
  timerSec: number;
  solved: boolean;
  /** Cells flagged wrong by Check, keyed "r,c". Cleared when that cell changes. */
  wrong: Record<string, true>;
  /** Cells revealed by a hint, keyed "r,c". */
  revealed: Record<string, true>;
};

const key = (r: number, c: number) => `${r},${c}`;

export function initCrossword(puzzle: MiniCrosswordPuzzle = SAMPLE_PUZZLES[0]): CrosswordState {
  const grid = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => (puzzle.solution[r][c] === "#" ? "#" : ""))
  );
  const first = puzzle.across[0];

  return {
    puzzle,
    grid,
    selectedRow: first.row,
    selectedCol: first.col,
    direction: "across",
    timerSec: 0,
    solved: false,
    wrong: {},
    revealed: {},
  };
}

/** Cells of a clue, in order. */
export function clueCells(clue: Clue, dir: Direction): [number, number][] {
  return Array.from({ length: clue.answer.length }, (_, i) =>
    dir === "across" ? [clue.row, clue.col + i] : [clue.row + i, clue.col]
  );
}

/** The clue running through (r, c) in a direction, if any. */
export function clueAt(
  puzzle: MiniCrosswordPuzzle,
  r: number,
  c: number,
  dir: Direction
): Clue | undefined {
  const list = dir === "across" ? puzzle.across : puzzle.down;
  return list.find((cl) => isCellInActiveClue(r, c, cl, dir));
}

/** The active clue for the current selection (falls back to the other direction). */
export function activeClueOf(state: CrosswordState): { clue: Clue; dir: Direction } {
  const { puzzle, selectedRow: r, selectedCol: c, direction } = state;
  const same = clueAt(puzzle, r, c, direction);
  if (same) return { clue: same, dir: direction };
  const other: Direction = direction === "across" ? "down" : "across";
  const alt = clueAt(puzzle, r, c, other);
  if (alt) return { clue: alt, dir: other };
  return { clue: puzzle.across[0], dir: "across" };
}

/** Select a cell. Tapping the selected cell again flips direction (if a word runs that way). */
export function selectCell(state: CrosswordState, r: number, c: number): CrosswordState {
  if (state.grid[r][c] === "#") return state;
  if (state.selectedRow === r && state.selectedCol === c) {
    const flipped: Direction = state.direction === "across" ? "down" : "across";
    return clueAt(state.puzzle, r, c, flipped) ? { ...state, direction: flipped } : state;
  }
  // Keep direction if a word runs that way through the new cell, else switch.
  const dir = clueAt(state.puzzle, r, c, state.direction)
    ? state.direction
    : state.direction === "across"
    ? "down"
    : "across";
  return { ...state, selectedRow: r, selectedCol: c, direction: dir };
}

/** Flip direction at the current cell, only if a word runs the other way. */
export function toggleDirection(state: CrosswordState): CrosswordState {
  const flipped: Direction = state.direction === "across" ? "down" : "across";
  return clueAt(state.puzzle, state.selectedRow, state.selectedCol, flipped)
    ? { ...state, direction: flipped }
    : state;
}

function isSolved(puzzle: MiniCrosswordPuzzle, grid: string[][]): boolean {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (puzzle.solution[i][j] !== "#" && grid[i][j] !== puzzle.solution[i][j]) return false;
    }
  }
  return true;
}

/** True when every white cell has a letter. */
export function isGridFull(state: CrosswordState): boolean {
  return state.grid.every((row) => row.every((cell) => cell !== ""));
}

/** All clues in solving order: across first, then down. */
function orderedClues(puzzle: MiniCrosswordPuzzle): { clue: Clue; dir: Direction }[] {
  return [
    ...puzzle.across.map((clue) => ({ clue, dir: "across" as const })),
    ...puzzle.down.map((clue) => ({ clue, dir: "down" as const })),
  ];
}

/** After finishing a word: go to the next clue with an empty cell, at that cell. */
function jumpToNextOpen(state: CrosswordState, grid: string[][]): CrosswordState {
  const all = orderedClues(state.puzzle);
  const { clue, dir } = activeClueOf(state);
  const start = all.findIndex((x) => x.clue === clue && x.dir === dir);
  for (let step = 1; step <= all.length; step++) {
    const target = all[(start + step) % all.length];
    const open = clueCells(target.clue, target.dir).find(([r, c]) => grid[r][c] === "");
    if (open) {
      return { ...state, grid, selectedRow: open[0], selectedCol: open[1], direction: target.dir };
    }
  }
  return { ...state, grid };
}

export function enterLetter(state: CrosswordState, letter: string): CrosswordState {
  if (state.solved) return state;
  const { selectedRow: r, selectedCol: c, grid, puzzle } = state;
  if (grid[r][c] === "#" || state.revealed[key(r, c)]) {
    // Revealed letters are locked; just advance.
    return advance(state, grid);
  }

  const nextGrid = grid.map((row) => [...row]);
  nextGrid[r][c] = letter.toUpperCase();
  const wrong = { ...state.wrong };
  delete wrong[key(r, c)];

  const solved = isSolved(puzzle, nextGrid);
  if (solved) return { ...state, grid: nextGrid, wrong: {}, solved: true };

  return advance({ ...state, wrong }, nextGrid);
}

/** Move to the next empty cell in the current word, or on to the next open clue. */
function advance(state: CrosswordState, grid: string[][]): CrosswordState {
  const { clue, dir } = activeClueOf(state);
  const cells = clueCells(clue, dir);
  const idx = cells.findIndex(([r, c]) => r === state.selectedRow && c === state.selectedCol);
  // Next empty cell after the cursor within this word.
  for (let i = idx + 1; i < cells.length; i++) {
    const [r, c] = cells[i];
    if (grid[r][c] === "") return { ...state, grid, selectedRow: r, selectedCol: c, direction: dir };
  }
  // Word complete from here on — if the word still has a gap earlier, wrap to it.
  const gap = cells.find(([r, c]) => grid[r][c] === "");
  if (gap) return { ...state, grid, selectedRow: gap[0], selectedCol: gap[1], direction: dir };
  // Whole word filled: move on (or stay on the last cell if the grid is full).
  if (grid.every((row) => row.every((cell) => cell !== ""))) {
    const [r, c] = cells[Math.min(idx + 1, cells.length - 1)];
    return { ...state, grid, selectedRow: r, selectedCol: c, direction: dir };
  }
  return jumpToNextOpen({ ...state, direction: dir }, grid);
}

export function backspace(state: CrosswordState): CrosswordState {
  if (state.solved) return state;
  const { selectedRow: r, selectedCol: c, grid } = state;
  const nextGrid = grid.map((row) => [...row]);
  const wrong = { ...state.wrong };

  if (nextGrid[r][c] !== "" && !state.revealed[key(r, c)]) {
    nextGrid[r][c] = "";
    delete wrong[key(r, c)];
    return { ...state, grid: nextGrid, wrong };
  }

  // Step back within the current word and clear that cell.
  const { clue, dir } = activeClueOf(state);
  const cells = clueCells(clue, dir);
  const idx = cells.findIndex(([y, x]) => y === r && x === c);
  if (idx <= 0) return state;
  const [pr, pc] = cells[idx - 1];
  if (!state.revealed[key(pr, pc)]) {
    nextGrid[pr][pc] = "";
    delete wrong[key(pr, pc)];
  }
  return { ...state, grid: nextGrid, wrong, selectedRow: pr, selectedCol: pc, direction: dir };
}

/** Reveal the correct letter in the selected cell (or the first wrong/empty one). */
export function revealCrosswordHint(state: CrosswordState): CrosswordState {
  if (state.solved) return state;
  const { puzzle } = state;
  let r = state.selectedRow;
  let c = state.selectedCol;
  if (state.grid[r][c] === puzzle.solution[r][c]) {
    // Selected cell already right — reveal the first wrong/empty cell in the active word.
    const { clue, dir } = activeClueOf(state);
    const target =
      clueCells(clue, dir).find(([y, x]) => state.grid[y][x] !== puzzle.solution[y][x]) ??
      (() => {
        for (let y = 0; y < SIZE; y++)
          for (let x = 0; x < SIZE; x++)
            if (puzzle.solution[y][x] !== "#" && state.grid[y][x] !== puzzle.solution[y][x])
              return [y, x] as [number, number];
        return undefined;
      })();
    if (!target) return state;
    [r, c] = target;
  }
  const moved = { ...state, selectedRow: r, selectedCol: c };
  const revealed = { ...state.revealed, [key(r, c)]: true as const };
  const nextGrid = state.grid.map((row) => [...row]);
  nextGrid[r][c] = puzzle.solution[r][c];
  const wrong = { ...state.wrong };
  delete wrong[key(r, c)];
  const solved = isSolved(puzzle, nextGrid);
  if (solved) return { ...moved, grid: nextGrid, revealed, wrong: {}, solved: true };
  return advance({ ...moved, revealed, wrong }, nextGrid);
}

/** Flag every filled-in letter that is wrong. Returns the new state and how many were wrong. */
export function checkPuzzle(state: CrosswordState): { state: CrosswordState; wrongCount: number } {
  const wrong: Record<string, true> = {};
  let wrongCount = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = state.grid[r][c];
      if (v && v !== "#" && v !== state.puzzle.solution[r][c]) {
        wrong[key(r, c)] = true;
        wrongCount++;
      }
    }
  }
  return { state: { ...state, wrong }, wrongCount };
}

export function isWrong(state: CrosswordState, r: number, c: number): boolean {
  return !!state.wrong[key(r, c)];
}

export function isRevealed(state: CrosswordState, r: number, c: number): boolean {
  return !!state.revealed[key(r, c)];
}

/** Clue number printed in the corner of a cell, if any. */
export function cellNumber(puzzle: MiniCrosswordPuzzle, r: number, c: number): number | undefined {
  return (
    puzzle.across.find((a) => a.row === r && a.col === c)?.num ??
    puzzle.down.find((d) => d.row === r && d.col === c)?.num
  );
}

/** Check if cell coordinates fall within a specific clue's answer */
export function isCellInActiveClue(
  r: number,
  col: number,
  clue: Clue,
  direction: Direction
): boolean {
  if (direction === "across") {
    return r === clue.row && col >= clue.col && col < clue.col + clue.answer.length;
  } else {
    return col === clue.col && r >= clue.row && r < clue.row + clue.answer.length;
  }
}

/** Jump directly to a clue (at its first empty cell) by number and direction */
export function selectClue(
  state: CrosswordState,
  num: number,
  direction: Direction
): CrosswordState {
  const clues = direction === "across" ? state.puzzle.across : state.puzzle.down;
  const clue = clues.find((c) => c.num === num) || clues[0];
  if (!clue) return state;
  const cells = clueCells(clue, direction);
  const [r, c] = cells.find(([y, x]) => state.grid[y][x] === "") ?? cells[0];

  return { ...state, selectedRow: r, selectedCol: c, direction };
}

function stepClue(state: CrosswordState, delta: 1 | -1): CrosswordState {
  const all = orderedClues(state.puzzle);
  const { clue, dir } = activeClueOf(state);
  const cur = all.findIndex((x) => x.clue === clue && x.dir === dir);
  const target = all[(cur + delta + all.length) % all.length];
  return selectClue(state, target.clue.num, target.dir);
}

/** Advance to the next clue in the puzzle */
export function nextClue(state: CrosswordState): CrosswordState {
  return stepClue(state, 1);
}

/** Move to the previous clue in the puzzle */
export function prevClue(state: CrosswordState): CrosswordState {
  return stepClue(state, -1);
}
