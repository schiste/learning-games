export type HoleQuestion = { text: string; answer: number };

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomStart(): number {
  return randomInt(1, 8);
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
    Array.from({ length: 9 }, (_, index) => index + 1).filter((n) => n !== answer),
  );
  return shuffle([answer, ...candidates.slice(0, count - 1)]);
}

export function basketRound() {
  const start = randomStart();
  const need = 10 - start;
  const candidates = shuffle(
    Array.from({ length: 9 }, (_, index) => index + 1).filter((n) => n !== need),
  ).sort((a, b) => Math.abs(a - need) - Math.abs(b - need));
  return { start, need, options: shuffle([need, ...candidates.slice(0, 3)]) };
}

export function holeQuestion(): HoleQuestion {
  const a = randomInt(0, 10);
  const b = 10 - a;
  const kind = randomInt(0, 3);
  if (kind === 0) return { text: `${a} + ? = 10`, answer: b };
  if (kind === 1) return { text: `? + ${b} = 10`, answer: a };
  if (kind === 2) return { text: `10 − ${a} = ?`, answer: b };
  const c = randomInt(0, a);
  return { text: `${c} + ? + ${b} = 10`, answer: a - c };
}

export type MemoryCard = { id: number; value: number };

export function memoryDeck(): MemoryCard[] {
  return shuffle([0, 10, 1, 9, 2, 8, 3, 7, 4, 6, 5, 5]).map((value, id) => ({ id, value }));
}
