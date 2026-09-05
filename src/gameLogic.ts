export type HoleQuestion = { text: string; answer: number };
export type Complexity = 1 | 2 | 3;
export type TimerQuestion = {
  text: string;
  answer: number;
  terms: number[];
  missingIndex: number;
  inputValues: number[];
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
