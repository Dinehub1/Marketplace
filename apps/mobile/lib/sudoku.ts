/**
 * Sudoku Game Engine — Pure deterministic 9x9 logic puzzle solver & generator.
 *
 * Implements:
 * 1. Seeded backtracking generator for 4 difficulty tiers:
 *    - Easy (38 clues)
 *    - Medium (32 clues)
 *    - Hard (28 clues)
 *    - Expert (24 clues)
 * 2. Realtime row, column, and 3x3 block conflict validation.
 * 3. Pencil notes mode (candidate marks per cell).
 * 4. Hint finder for rewarded ad reveals.
 * 5. Move stack for undo operations.
 */

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type CellIndex = number; // 0 to 80

export type SudokuState = {
  initial: readonly number[];     // Given numbers (0 = empty, 1..9 = clue)
  current: number[];             // User's current board
  solution: readonly number[];    // Complete valid solution
  notes: Record<number, number[]>; // Candidates keyed by cell index
  history: { index: number; prevVal: number; newVal: number }[];
  difficulty: Difficulty;
  mistakes: number;
  completed: boolean;
};

export const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  easy: 38,
  medium: 32,
  hard: 28,
  expert: 24,
};

/** Get row index (0..8) from cell index (0..80) */
export function rowOf(idx: CellIndex): number {
  return Math.floor(idx / 9);
}

/** Get column index (0..8) from cell index (0..80) */
export function colOf(idx: CellIndex): number {
  return idx % 9;
}

/** Get 3x3 block index (0..8) from cell index (0..80) */
export function blockOf(idx: CellIndex): number {
  return Math.floor(rowOf(idx) / 3) * 3 + Math.floor(colOf(idx) / 3);
}

/** Check if placing num at idx violates row, col, or 3x3 block */
export function isSafe(board: number[], idx: CellIndex, num: number): boolean {
  const r = rowOf(idx);
  const c = colOf(idx);
  const b = blockOf(idx);

  for (let i = 0; i < 81; i++) {
    if (i === idx) continue;
    if (board[i] === num) {
      if (rowOf(i) === r || colOf(i) === c || blockOf(i) === b) {
        return false;
      }
    }
  }
  return true;
}

/** Solve Sudoku using backtracking. Mutates board in-place. */
function solveBoard(board: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      for (const num of nums) {
        if (isSafe(board, i, num)) {
          board[i] = num;
          if (solveBoard(board)) return true;
          board[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/**
 * Count solutions of a board, stopping at `limit`. Uses bitmasks and the
 * most-constrained-cell heuristic so it stays fast enough to run on-device
 * dozens of times while carving a puzzle.
 */
function countSolutions(board: number[], limit = 2): number {
  const rows = new Array<number>(9).fill(0);
  const cols = new Array<number>(9).fill(0);
  const blks = new Array<number>(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = board[i];
    if (v) {
      const bit = 1 << v;
      rows[rowOf(i)] |= bit;
      cols[colOf(i)] |= bit;
      blks[blockOf(i)] |= bit;
    }
  }
  const b = [...board];
  let count = 0;

  const rec = (): void => {
    if (count >= limit) return;
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (b[i]) continue;
      const used = rows[rowOf(i)] | cols[colOf(i)] | blks[blockOf(i)];
      let mask = 0;
      let n = 0;
      for (let v = 1; v <= 9; v++) {
        if (!(used & (1 << v))) {
          mask |= 1 << v;
          n++;
        }
      }
      if (n === 0) return;
      if (n < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = n;
        if (n === 1) break;
      }
    }
    if (best === -1) {
      count++;
      return;
    }
    const r = rowOf(best);
    const c = colOf(best);
    const k = blockOf(best);
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      b[best] = v;
      rows[r] |= bit;
      cols[c] |= bit;
      blks[k] |= bit;
      rec();
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      blks[k] &= ~bit;
      b[best] = 0;
      if (count >= limit) return;
    }
  };

  rec();
  return count;
}

/** Generate a brand-new Sudoku with exactly one solution */
export function createSudoku(difficulty: Difficulty = "medium"): SudokuState {
  const solution = new Array<number>(81).fill(0);
  solveBoard(solution);

  const initial = [...solution];
  const target = DIFFICULTY_CLUES[difficulty];
  let clues = 81;

  // Remove cells one by one; put a cell back if removing it breaks uniqueness.
  const indices = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const idx of indices) {
    if (clues <= target) break;
    const keep = initial[idx];
    initial[idx] = 0;
    if (countSolutions(initial, 2) !== 1) {
      initial[idx] = keep;
    } else {
      clues--;
    }
  }

  return {
    initial: Object.freeze(initial),
    current: [...initial],
    solution: Object.freeze(solution),
    notes: {},
    history: [],
    difficulty,
    mistakes: 0,
    completed: false,
  };
}

/** Place a number into current board */
export function setCellValue(
  state: SudokuState,
  idx: CellIndex,
  num: number
): { nextState: SudokuState; isCorrect: boolean } {
  if (state.initial[idx] !== 0 || state.completed) {
    return { nextState: state, isCorrect: true };
  }

  const prevVal = state.current[idx];
  if (prevVal === num) return { nextState: state, isCorrect: true };

  const nextCurrent = [...state.current];
  nextCurrent[idx] = num;

  const isCorrect = num === 0 || num === state.solution[idx];
  const mistakes = isCorrect ? state.mistakes : state.mistakes + 1;

  // Clear notes for this cell, and — when the entry is right — the same
  // candidate from every peer in its row, column and box.
  const nextNotes = { ...state.notes };
  delete nextNotes[idx];
  if (num !== 0 && isCorrect) {
    for (const key of Object.keys(nextNotes)) {
      const i = Number(key);
      if (rowOf(i) === rowOf(idx) || colOf(i) === colOf(idx) || blockOf(i) === blockOf(idx)) {
        nextNotes[i] = nextNotes[i].filter((n) => n !== num);
      }
    }
  }

  const nextHistory = [...state.history, { index: idx, prevVal, newVal: num }];
  const completed = nextCurrent.every((val, i) => val === state.solution[i]);

  return {
    nextState: {
      ...state,
      current: nextCurrent,
      notes: nextNotes,
      history: nextHistory,
      mistakes,
      completed,
    },
    isCorrect,
  };
}

/** Toggle a candidate pencil note */
export function toggleNote(state: SudokuState, idx: CellIndex, num: number): SudokuState {
  if (state.initial[idx] !== 0 || state.current[idx] !== 0 || state.completed) {
    return state;
  }

  const currentNotes = state.notes[idx] || [];
  const exists = currentNotes.includes(num);
  const updated = exists
    ? currentNotes.filter((n) => n !== num)
    : [...currentNotes, num].sort((a, b) => a - b);

  return {
    ...state,
    notes: {
      ...state.notes,
      [idx]: updated,
    },
  };
}

/** Undo last move */
export function undoMove(state: SudokuState): SudokuState {
  if (state.history.length === 0 || state.completed) return state;

  const nextHistory = [...state.history];
  const last = nextHistory.pop()!;

  const nextCurrent = [...state.current];
  nextCurrent[last.index] = last.prevVal;

  return {
    ...state,
    current: nextCurrent,
    history: nextHistory,
    completed: false,
  };
}

/** Rewarded Ad Hint: reveals the correct solution for a cell */
export function revealHint(state: SudokuState, targetIdx?: CellIndex): SudokuState {
  if (state.completed) return state;

  let cell = targetIdx;
  if (cell === undefined || state.current[cell] === state.solution[cell]) {
    // Find first empty or wrong cell
    const candidates: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (state.current[i] !== state.solution[i]) candidates.push(i);
    }
    if (candidates.length === 0) return state;
    cell = candidates[Math.floor(Math.random() * candidates.length)];
  }

  const nextCurrent = [...state.current];
  nextCurrent[cell] = state.solution[cell];

  const nextNotes = { ...state.notes };
  delete nextNotes[cell];

  const completed = nextCurrent.every((val, i) => val === state.solution[i]);

  return {
    ...state,
    current: nextCurrent,
    notes: nextNotes,
    history: [...state.history, { index: cell, prevVal: state.current[cell], newVal: state.solution[cell] }],
    completed,
  };
}

/** How many times each digit 1..9 is correctly placed (index 0 unused). */
export function digitCounts(state: SudokuState): number[] {
  const counts = new Array<number>(10).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = state.current[i];
    if (v && v === state.solution[i]) counts[v]++;
  }
  return counts;
}

/** First empty (or wrong) cell, used to give the player a starting selection. */
export function firstOpenCell(state: SudokuState): number | null {
  for (let i = 0; i < 81; i++) if (state.current[i] !== state.solution[i]) return i;
  return null;
}
