/**
 * Math Sprint Engine — Fast mental arithmetic drill generator.
 *
 * Provides:
 * - Dynamic problem generation across 4 arithmetic operations (+, -, ×, ÷).
 * - Distractor generation for 4 multiple choice options.
 * - Missing-sign puzzles (e.g. 18 [ ? ] 6 = 3).
 * - Combo streak multipliers.
 */

export type MathProblem = {
  question: string;
  options: number[] | string[];
  correctIndex: number;
  type: "arithmetic" | "missing_op" | "true_false";
};

export type SprintState = {
  score: number;
  streak: number;
  bestStreak: number;
  solved: number;
  currentProblem: MathProblem;
  timeLeft: number;
  phase: "ready" | "playing" | "over";
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProblem(streak: number = 0): MathProblem {
  const level = Math.min(5, Math.floor(streak / 5) + 1);
  const types = ["arithmetic", "arithmetic", "missing_op"];
  const selectedType = types[randomInt(0, types.length - 1)];

  if (selectedType === "missing_op") {
    const ops = [
      { sym: "+", fn: (a: number, b: number) => a + b },
      { sym: "−", fn: (a: number, b: number) => a - b },
      { sym: "×", fn: (a: number, b: number) => a * b },
    ];
    const op = ops[randomInt(0, ops.length - 1)];
    const a = randomInt(2, 6 * level);
    let b = randomInt(2, 6 * level);
    if (a === 2 && b === 2) b = 3;
    const result = op.fn(a, b);

    const options = ["+", "−", "×", "÷"];
    const correctIndex = options.indexOf(op.sym);

    return {
      question: `${a}  [ ? ]  ${b} = ${result}`,
      options,
      correctIndex,
      type: "missing_op",
    };
  }

  // Standard arithmetic
  const ops = level === 1 ? ["+", "−"] : ["+", "−", "×", "÷"];
  const op = ops[randomInt(0, ops.length - 1)];

  let a = 0;
  let b = 0;
  let answer = 0;

  if (op === "+") {
    a = randomInt(5 * level, 20 * level);
    b = randomInt(5 * level, 20 * level);
    answer = a + b;
  } else if (op === "−") {
    a = randomInt(10 * level, 30 * level);
    b = randomInt(2 * level, a - 1);
    answer = a - b;
  } else if (op === "×") {
    a = randomInt(2, 6 + level * 2);
    b = randomInt(2, 6 + level * 2);
    answer = a * b;
  } else {
    // Division
    b = randomInt(2, 6 + level);
    answer = randomInt(2, 8 + level);
    a = b * answer;
  }

  // Distractors
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const delta = randomInt(-5, 5);
    const fake = answer + (delta === 0 ? 3 : delta);
    if (fake !== answer && fake >= 0) distractors.add(fake);
  }

  const allOptions = [answer, ...distractors].sort(() => Math.random() - 0.5);
  const correctIndex = allOptions.indexOf(answer);

  return {
    question: `${a} ${op} ${b} = ?`,
    options: allOptions,
    correctIndex,
    type: "arithmetic",
  };
}

export function startSprint(): SprintState {
  return {
    score: 0,
    streak: 0,
    bestStreak: 0,
    solved: 0,
    currentProblem: generateProblem(0),
    timeLeft: 30,
    phase: "playing",
  };
}

export function submitAnswer(
  state: SprintState,
  optionIndex: number
): { nextState: SprintState; isCorrect: boolean } {
  if (state.phase !== "playing") return { nextState: state, isCorrect: false };

  const isCorrect = optionIndex === state.currentProblem.correctIndex;

  if (isCorrect) {
    const nextStreak = state.streak + 1;
    const multiplier = Math.min(5, 1 + Math.floor(nextStreak / 3));
    const scoreAdd = 10 * multiplier;

    return {
      nextState: {
        ...state,
        score: state.score + scoreAdd,
        streak: nextStreak,
        bestStreak: Math.max(state.bestStreak, nextStreak),
        solved: state.solved + 1,
        currentProblem: generateProblem(nextStreak),
      },
      isCorrect: true,
    };
  } else {
    return {
      nextState: {
        ...state,
        streak: 0,
        currentProblem: generateProblem(0),
      },
      isCorrect: false,
    };
  }
}
