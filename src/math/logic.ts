import { nearbyChoices, pick, randomInt, shuffle, type Rng } from "./random";

/** Friendly objects to count. Emoji keep the scenes recognisable without any reading. */
export const THINGS = ["🍎", "🐟", "⭐", "🐞", "🌸", "🍓", "🐥", "🎈", "🍪", "🐸"] as const;
export type Thing = (typeof THINGS)[number];

/* ---------- Count: tap each object, then say how many ---------- */

export type CountConfig = { min: number; max: number };
export type CountRound = { thing: Thing; count: number; gridSize: number; cells: number[]; choices: number[] };

/** Size of the five-column grid: just enough rows that objects are scattered but the field stays compact. */
export function countGridSize(max: number): number {
  if (max <= 5) return 10;
  if (max <= 10) return 15;
  return 25;
}

/** Objects sit in distinct grid cells so they never overlap and stay easy to tap. */
export function countRound({ min, max }: CountConfig, rng: Rng = Math.random): CountRound {
  const count = randomInt(min, max, rng);
  const gridSize = countGridSize(max);
  const cells = shuffle(Array.from({ length: gridSize }, (_, index) => index), rng).slice(0, count).sort((a, b) => a - b);
  return { thing: pick(THINGS, rng), count, gridSize, cells, choices: nearbyChoices(count, 4, Math.max(1, min - 1), max + 1, rng) };
}

/* ---------- Flash: see a quantity briefly, recognise it without counting ---------- */

export type FlashConfig = { max: number; pattern: "dice" | "frame"; showMs: number };
export type FlashRound = { count: number; choices: number[] };

export function flashRound({ max }: FlashConfig, rng: Rng = Math.random): FlashRound {
  const count = randomInt(1, max, rng);
  return { count, choices: nearbyChoices(count, 4, 1, max, rng) };
}

/** Classic dice spots on a 3×3 grid (cell indices 0–8). */
export const DICE_SPOTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/* ---------- Build: put exactly N objects in the basket ---------- */

export type BuildConfig = { min: number; max: number };
export type BuildRound = { thing: Thing; target: number };

export function buildRound({ min, max }: BuildConfig, rng: Rng = Math.random): BuildRound {
  return { thing: pick(THINGS, rng), target: randomInt(min, max, rng) };
}

/** A precise, encouraging correction that tells the child what to do next. */
export function buildHint(placed: number, target: number): string {
  if (placed < target) return `Tu en as mis ${placed}. Il en faut ${target} : ajoute-en ${target - placed}.`;
  return `Tu en as mis ${placed}. Il en faut ${target} : enlève-en ${placed - target}.`;
}

/* ---------- Compare: which side has more (or fewer)? ---------- */

export type CompareConfig = { min: number; max: number; mode: "objects" | "numbers"; aligned: boolean };
export type CompareRound = { left: number; right: number; ask: "more" | "fewer"; thing: Thing };

export function compareRound({ min, max }: CompareConfig, rng: Rng = Math.random): CompareRound {
  const left = randomInt(min, max, rng);
  let right = randomInt(min, max, rng);
  while (right === left) right = randomInt(min, max, rng);
  return { left, right, ask: rng() < 0.7 ? "more" : "fewer", thing: pick(THINGS, rng) };
}

export function compareAnswer(round: CompareRound): "left" | "right" {
  const leftBigger = round.left > round.right;
  return (round.ask === "more") === leftBigger ? "left" : "right";
}

/* ---------- Bonds: what goes with this part to make the whole? ---------- */

export type BondsConfig = { totals: number[]; frame: boolean };
export type BondsRound = { total: number; part: number; missing: number; choices: number[] };

export function bondsRound({ totals }: BondsConfig, rng: Rng = Math.random): BondsRound {
  const total = pick(totals, rng);
  const part = randomInt(1, total - 1, rng);
  const missing = total - part;
  return { total, part, missing, choices: Array.from({ length: total + 1 }, (_, value) => value) };
}

/** Explains a wrong part by giving back the total it actually makes. */
export function bondsHint(part: number, picked: number, total: number, frame: boolean): string {
  const sum = part + picked;
  if (sum > total) return `${part} et ${picked}, ça fait ${sum} : c’est trop !`;
  return frame
    ? `${part} et ${picked}, ça fait ${sum}. Remplis les cases vides pour voir ce qui manque.`
    : `${part} et ${picked}, ça fait ${sum} : il en manque encore.`;
}

/* ---------- Sprint: one timed minute of number facts ---------- */

export type FactSet = "complements10" | "add10" | "sub10" | "doubles" | "add20" | "sub20" | "tens" | "tables2-5" | "tables";
export type SprintConfig = { facts: FactSet; seconds: number };
export type Fact = { text: string; answer: number; choices: number[] };

export function factFor(facts: FactSet, rng: Rng = Math.random): Fact {
  const make = (text: string, answer: number, max: number) => ({ text, answer, choices: nearbyChoices(answer, 4, 0, max, rng) });
  switch (facts) {
    case "complements10": {
      const a = randomInt(0, 10, rng);
      return make(`${a} + ? = 10`, 10 - a, 10);
    }
    case "add10": {
      const a = randomInt(0, 10, rng);
      const b = randomInt(0, 10 - a, rng);
      return make(`${a} + ${b}`, a + b, 10);
    }
    case "sub10": {
      const a = randomInt(1, 10, rng);
      const b = randomInt(0, a, rng);
      return make(`${a} − ${b}`, a - b, 10);
    }
    case "doubles": {
      const a = randomInt(1, 10, rng);
      return make(`${a} + ${a}`, a * 2, 20);
    }
    case "add20": {
      const a = randomInt(2, 9, rng);
      const b = randomInt(11 - a, 9, rng);
      return make(`${a} + ${b}`, a + b, 20);
    }
    case "sub20": {
      const a = randomInt(11, 18, rng);
      const b = randomInt(a - 9, 9, rng);
      return make(`${a} − ${b}`, a - b, 20);
    }
    case "tens": {
      const a = randomInt(1, 9, rng) * 10;
      const b = randomInt(1, (100 - a) / 10, rng) * 10;
      return make(`${a} + ${b}`, a + b, 100);
    }
    case "tables2-5": {
      const a = randomInt(2, 5, rng);
      const b = randomInt(1, 10, rng);
      return make(`${a} × ${b}`, a * b, 50);
    }
    case "tables": {
      const a = randomInt(2, 9, rng);
      const b = randomInt(2, 9, rng);
      return make(`${a} × ${b}`, a * b, 81);
    }
  }
}

/** Stars for a minute of practice: generous, because speed comes with time. */
export function sprintStars(score: number): 1 | 2 | 3 {
  if (score >= 15) return 3;
  if (score >= 8) return 2;
  return 1;
}

/**
 * Points for one round: accuracy first (10, 6 or 3), plus up to 5 bonus points
 * for the time left on the countdown. Running out of time only removes the bonus.
 */
export function roundPoints(mistakes: number, timeLeft: number): number {
  const base = mistakes === 0 ? 10 : mistakes === 1 ? 6 : 3;
  const bonus = Math.round(5 * Math.min(1, Math.max(0, timeLeft)));
  return base + bonus;
}

/** Points for a timed minute: every right answer counts. */
export function sprintPoints(score: number): number {
  return score * 5;
}

/** Stars for a step made of several rounds. Mistakes are allowed; they only soften the reward. */
export function roundStars(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 1) return 3;
  if (mistakes <= 4) return 2;
  return 1;
}
