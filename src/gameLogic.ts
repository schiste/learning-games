export type HoleQuestion = { text: string; answer: number };
export type Complexity = 1 | 2 | 3;
export type TimerQuestion = {
  text: string;
  answer: number;
  terms: number[];
  missingIndex: number;
  inputValues: number[];
};
export type CashRound = {
  prices: number[];
  total: number;
  change: number;
  denominations: number[];
  maxCoins?: number;
};
export type BalanceRound = {
  leftWeights: number[];
  rightBase: number;
  tiles: number[];
};
export type PathRound = {
  start: number;
  operations: number[];
  solution: number[];
  maxMoves: number;
  maxPosition: number;
};
export type ShareRelation = { left: number; right: number; offset: number };
export type ShareRound = {
  targets: number[];
  visibleTargets: boolean[];
  relations: ShareRelation[];
};

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomStart(complexity: Complexity = 2): number {
  if (complexity === 1) return randomInt(5, 9);
  if (complexity === 2) return randomInt(2, 8);
  return randomInt(0, 9);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function answerOptions(answer: number, count = 3): number[] {
  const candidates = shuffle(
    Array.from({ length: 11 }, (_, index) => index).filter((n) => n !== answer),
  );
  return shuffle([answer, ...candidates.slice(0, count - 1)]);
}

export function basketRound(complexity: Complexity = 2) {
  const start = randomStart(complexity);
  const need = 10 - start;
  const candidates = shuffle(
    Array.from({ length: 11 }, (_, index) => index).filter((n) => n !== need),
  ).sort((a, b) => Math.abs(a - need) - Math.abs(b - need));
  return { start, need, options: shuffle([need, ...candidates.slice(0, complexity)]) };
}

export function holeQuestion(complexity: Complexity = 2): HoleQuestion {
  const a = complexity === 1 ? randomInt(5, 9) : complexity === 2 ? randomInt(1, 9) : randomInt(0, 10);
  const b = 10 - a;
  const kind = complexity === 1 ? 0 : randomInt(0, complexity === 2 ? 2 : 3);
  if (kind === 0) return { text: `${a} + ? = 10`, answer: b };
  if (kind === 1) return { text: `? + ${b} = 10`, answer: a };
  if (kind === 2) return { text: `10 − ${a} = ?`, answer: b };
  const c = randomInt(0, a);
  return { text: `${c} + ? + ${b} = 10`, answer: a - c };
}

export type MemoryCard = { id: number; value: number };

export function memoryDeck(complexity: Complexity = 2): MemoryCard[] {
  const values = complexity === 1
    ? [2, 8, 4, 6, 5, 5]
    : complexity === 2
      ? [0, 10, 1, 9, 2, 8, 3, 7, 4, 6, 5, 5]
      : [0, 10, 1, 9, 2, 8, 3, 7, 4, 6, 5, 5, 1, 9, 4, 6];
  return shuffle(values).map((value, id) => ({ id, value }));
}

export function bowlingRound(complexity: Complexity) {
  const knocked = complexity === 1 ? randomInt(1, 5) : complexity === 2 ? randomInt(1, 9) : randomInt(0, 10);
  const standing = 10 - knocked;
  return {
    knocked,
    standing,
    options: answerOptions(standing, complexity + 1),
  };
}

export function timerQuestion(complexity: Complexity): TimerQuestion {
  const inputValues = Array.from({ length: complexity === 3 ? 6 : 11 }, (_, index) => index);
  if (complexity === 1) {
    const first = randomInt(0, 10);
    return {
      text: `${first} + ? = 10`,
      answer: 10 - first,
      terms: [first, 10 - first],
      missingIndex: 1,
      inputValues,
    };
  }

  let terms: number[];
  if (complexity === 2) {
    const first = randomInt(1, 8);
    const second = randomInt(1, 9 - first);
    terms = [first, second, 10 - first - second];
  } else {
    const triples: number[][] = [];
    for (let first = 0; first <= 5; first += 1) {
      for (let second = 0; second <= 5; second += 1) {
        const third = 10 - first - second;
        if (third >= 0 && third <= 5) triples.push([first, second, third]);
      }
    }
    terms = triples[randomInt(0, triples.length - 1)];
  }

  const missingIndex = randomInt(0, 2);
  return {
    text: `${terms.map((term, index) => index === missingIndex ? "?" : term).join(" + ")} = 10`,
    answer: terms[missingIndex],
    terms,
    missingIndex,
    inputValues,
  };
}

export function minimumCoins(amount: number): number {
  let remaining = amount;
  let count = 0;
  for (const coin of [5, 2, 1]) {
    count += Math.floor(remaining / coin);
    remaining %= coin;
  }
  return count;
}

export function cashRound(complexity: Complexity): CashRound {
  const prices = complexity < 3
    ? [randomInt(complexity === 1 ? 5 : 1, 9)]
    : (() => {
        const first = randomInt(1, 5);
        return [first, randomInt(1, 9 - first)];
      })();
  const total = prices.reduce((sum, price) => sum + price, 0);
  const change = 10 - total;
  return {
    prices,
    total,
    change,
    denominations: complexity === 1 ? [1] : [1, 2, 5],
    maxCoins: complexity === 3 ? minimumCoins(change) : undefined,
  };
}

export function balanceRound(complexity: Complexity): BalanceRound {
  if (complexity === 1) {
    const rightBase = randomInt(5, 9);
    const answer = 10 - rightBase;
    const distractors = shuffle([1, 2, 3, 4, 5].filter((value) => value !== answer)).slice(0, 2);
    return { leftWeights: [10], rightBase, tiles: shuffle([answer, ...distractors]) };
  }

  if (complexity === 2) {
    const rightBase = randomInt(2, 6);
    const missing = 10 - rightBase;
    const first = randomInt(Math.max(1, missing - 5), Math.min(5, missing - 1));
    const solution = [first, missing - first];
    const firstLeft = randomInt(2, 5);
    return {
      leftWeights: [firstLeft, 10 - firstLeft],
      rightBase,
      tiles: shuffle([...solution, randomInt(1, 5), randomInt(1, 5)]),
    };
  }

  const solutions = [[1, 4, 5], [2, 3, 5], [2, 4, 4], [3, 3, 4]];
  const solution = solutions[randomInt(0, solutions.length - 1)];
  const firstLeft = randomInt(2, 5);
  return {
    leftWeights: [firstLeft, 10 - firstLeft],
    rightBase: 0,
    tiles: shuffle([...solution, randomInt(1, 5), randomInt(1, 5)]),
  };
}

const PATH_ROUNDS: Record<Complexity, PathRound[]> = {
  1: [
    { start: 0, operations: [1, 2, 5], solution: [5, 5], maxMoves: 5, maxPosition: 10 },
    { start: 1, operations: [1, 3, 4], solution: [4, 4, 1], maxMoves: 5, maxPosition: 10 },
    { start: 2, operations: [1, 2, 4], solution: [4, 4], maxMoves: 5, maxPosition: 10 },
  ],
  2: [
    { start: 8, operations: [3, 1, -2], solution: [3, 1, -2], maxMoves: 4, maxPosition: 12 },
    { start: 6, operations: [5, 2, -3], solution: [5, -3, 2], maxMoves: 4, maxPosition: 12 },
    { start: 4, operations: [4, 3, -1], solution: [4, 3, -1], maxMoves: 4, maxPosition: 12 },
  ],
  3: [
    { start: 2, operations: [5, 3, -2], solution: [5, 5, -2], maxMoves: 4, maxPosition: 14 },
    { start: 3, operations: [4, 2, -3], solution: [-3, 4, 4, 2], maxMoves: 4, maxPosition: 14 },
    { start: 5, operations: [4, 2, -3], solution: [4, 4, -3], maxMoves: 4, maxPosition: 14 },
    { start: 7, operations: [5, 2, -4], solution: [5, -4, 2], maxMoves: 4, maxPosition: 14 },
  ],
};

export function pathRound(complexity: Complexity): PathRound {
  const rounds = PATH_ROUNDS[complexity];
  const round = rounds[randomInt(0, rounds.length - 1)];
  return { ...round, operations: shuffle(round.operations), solution: [...round.solution] };
}

export function shareRound(complexity: Complexity): ShareRound {
  if (complexity === 1) {
    const first = randomInt(2, 8);
    return { targets: [first, 10 - first], visibleTargets: [true, false], relations: [] };
  }
  if (complexity === 2) {
    const first = randomInt(1, 4);
    const second = randomInt(1, 9 - first);
    return { targets: [first, second, 10 - first - second], visibleTargets: [true, true, false], relations: [] };
  }
  const puzzles: ShareRound[] = [
    {
      targets: [3, 3, 4],
      visibleTargets: [false, false, false],
      relations: [{ left: 0, right: 1, offset: 0 }, { left: 2, right: 0, offset: 1 }],
    },
    {
      targets: [2, 4, 4],
      visibleTargets: [false, false, false],
      relations: [{ left: 1, right: 2, offset: 0 }, { left: 1, right: 0, offset: 2 }],
    },
    {
      targets: [4, 2, 4],
      visibleTargets: [false, false, false],
      relations: [{ left: 0, right: 2, offset: 0 }, { left: 0, right: 1, offset: 2 }],
    },
  ];
  const puzzle = puzzles[randomInt(0, puzzles.length - 1)];
  return {
    targets: [...puzzle.targets],
    visibleTargets: [...puzzle.visibleTargets],
    relations: puzzle.relations.map((relation) => ({ ...relation })),
  };
}
