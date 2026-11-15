/** A random source in [0, 1). Generators take one so tests can be deterministic. */
export type Rng = () => number;

export function randomInt(min: number, max: number, rng: Rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(items: readonly T[], rng: Rng = Math.random): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Answer choices around a correct value: the answer plus close distractors
 * (off-by-one and off-by-ten are the mistakes children actually make),
 * sorted so the buttons read like a number line.
 */
export function nearbyChoices(answer: number, count: number, min: number, max: number, rng: Rng = Math.random): number[] {
  const candidates = new Set<number>([answer]);
  const offsets = shuffle([-1, 1, -2, 2, -10, 10, -3, 3, 5, -5], rng);
  for (const offset of offsets) {
    if (candidates.size >= count) break;
    const value = answer + offset;
    if (value >= min && value <= max) candidates.add(value);
  }
  for (let value = min; candidates.size < count && value <= max; value += 1) candidates.add(value);
  return [...candidates].sort((a, b) => a - b);
}
