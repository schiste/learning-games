import type { FactSet } from "./facts";
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

/* ---------- Sprint: one timed minute of number facts (facts come from facts.ts) ---------- */

/**
 * "mixed" interleaves the sets listed in `mix` that the child has already met (interleaved practice):
 * deciding which strategy fits is part of the skill.
 */
export type SprintConfig = { facts: FactSet; seconds: number } | { facts: "mixed"; mix: FactSet[]; seconds: number };

/**
 * Stars for a minute of practice. Meeting or beating one's own record is worth full marks
 * (IES 2021: "meet or beat" a previous score), otherwise generous absolute thresholds apply.
 */
export function sprintStars(score: number, previousBest = 0): 1 | 2 | 3 {
  if (score >= 15 || (previousBest > 0 && score >= previousBest && score >= 5)) return 3;
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

/* ---------- Blocks: base-ten place value ---------- */

export type BlocksConfig = { max: number; mode: "build" | "read" };
export type BlocksRound = { target: number; choices: number[] };
export const PLACES = ["unités", "dizaines", "centaines", "milliers"] as const;

/** Digits of n from units upwards: 1093 → [3, 9, 0, 1]. */
export function placeDigits(value: number, places: number): number[] {
  return Array.from({ length: places }, (_, index) => Math.floor(value / 10 ** index) % 10);
}

export function placesFor(max: number): number {
  return String(max).length;
}

/**
 * Distractors are the classic place-value mistakes: swapped digits (34 ↔ 43),
 * one more or less in a place, and a forgotten zero (305 read as 35).
 */
export function blocksChoices(target: number, max: number, rng: Rng = Math.random): number[] {
  const digits = String(target);
  const valid = (value: number) => value !== target && value >= 1 && value <= max + 100;
  // The signature mistakes always appear; ±1 and ±10 fill the remaining places.
  const priority = [
    digits.length >= 2 ? Number([...digits].reverse().join("")) : NaN,
    digits.length > 2 && digits.includes("0") ? Number(digits.replaceAll("0", "")) : NaN,
  ].filter((value) => Number.isFinite(value) && valid(value));
  const others = shuffle([target + 10, target - 10, target + 1, target - 1, target + 100].filter(valid), rng);
  const picked = [...new Set([...priority, ...others])].slice(0, 3);
  return [target, ...picked].sort((a, b) => a - b);
}

/** Targets avoid trivial round numbers, and at the top levels often contain an inner zero (1 093, 405). */
export function blocksRound({ max }: BlocksConfig, rng: Rng = Math.random): BlocksRound {
  let target = randomInt(max >= 100 ? 101 : 11, max, rng);
  if (max >= 1000 && rng() < 0.4) target = randomInt(1, 9, rng) * 1000 + randomInt(0, 9, rng) * 10 + randomInt(1, 9, rng);
  else if (max >= 100 && rng() < 0.3) target = randomInt(1, 9, rng) * 100 + randomInt(1, 9, rng);
  if (target % 10 === 0) target += randomInt(1, 9, rng);
  target = Math.min(target, max);
  return { target, choices: blocksChoices(target, max, rng) };
}

/** Where the built number first differs from the target, starting from the biggest place. */
export function blocksHint(built: number, target: number): string {
  const places = Math.max(String(built).length, String(target).length);
  const a = placeDigits(built, places);
  const b = placeDigits(target, places);
  for (let index = places - 1; index >= 0; index -= 1) {
    if (a[index] !== b[index]) {
      const name = PLACES[index];
      return a[index] < b[index]
        ? `Il manque des ${name} : tu en as ${a[index]}, il en faut ${b[index]}.`
        : `Trop ${name === "unités" ? "d’unités" : `de ${name}`} : tu en as ${a[index]}, il en faut ${b[index]}.`;
    }
  }
  return "";
}

/* ---------- Number line: place a number, or hop to add and subtract ---------- */

export type LineConfig =
  | { mode: "place"; max: number }
  | { mode: "hop"; max: number; op: "+" | "−" | "±"; hop: 1 | 10; maxHops: number };

/** A visible window of 11 ticks (`from`, `from + step`, … `from + 10·step`), zoomed on the right ten or hundred. */
export type LineRound = { from: number; step: number; target: number; start: number; hops: number; op: "+" | "−"; choices: number[] };

export const LINE_TICKS = 11;

export function lineRound(config: LineConfig, rng: Rng = Math.random): LineRound {
  if (config.mode === "place") {
    // Up to 20: the 0–10 or 10–20 stretch. Beyond: one ten of a hundred, or one hundred of a thousand…
    const step = config.max <= 100 ? 1 : config.max <= 1000 ? 10 : 100;
    const span = step * 10;
    const from = config.max <= 20 ? pick([0, 10].filter((value) => value < config.max), rng) : randomInt(0, config.max / span - 1, rng) * span;
    const target = from + randomInt(1, 9, rng) * step;
    return { from, step, target, start: target, hops: 0, op: "+", choices: [] };
  }
  const op = config.op === "±" ? (rng() < 0.5 ? "+" : "−") : config.op;
  const step = config.hop;
  const hops = randomInt(2, config.maxHops, rng);
  const span = step * 10;
  // Hops of 10 start from a number that is not round (34 → 44 → 54) so the units visibly stay the same.
  const from = config.max <= 20 ? 0 : step === 10 ? randomInt(1, 9, rng) + (config.max > 110 ? randomInt(0, config.max / 100 - 1, rng) * 100 : 0) : randomInt(0, config.max / span - 1, rng) * span;
  const position = op === "+" ? randomInt(0, 10 - hops, rng) : randomInt(hops, 10, rng);
  const start = from + position * step;
  const target = op === "+" ? start + hops * step : start - hops * step;
  return { from, step, target, start, hops, op, choices: nearbyChoices(target, 4, 0, config.max + 10, rng) };
}

/* ---------- Bridge through ten: 8 + 5 = 8 + 2 + 3 ---------- */

export type BridgeConfig = { op: "+" | "−" };
export type BridgeRound = { a: number; b: number; op: "+" | "−"; toTen: number; rest: number; answer: number };

/** Addition: a + b with a + b > 10 (8 + 5). Subtraction: a − b crossing ten downwards (13 − 5 = 13 − 3 − 2). */
export function bridgeRound({ op }: BridgeConfig, rng: Rng = Math.random): BridgeRound {
  if (op === "+") {
    const a = randomInt(6, 9, rng);
    const b = randomInt(11 - a, 9, rng);
    return { a, b, op, toTen: 10 - a, rest: b - (10 - a), answer: a + b };
  }
  const a = randomInt(11, 17, rng);
  const b = randomInt(a - 9, 9, rng);
  const fixed = a % 10 < b ? b : Math.min(9, a % 10 + 1);
  return { a, b: fixed, op, toTen: a - 10, rest: fixed - (a - 10), answer: a - fixed };
}

/* ---------- Groups: multiplication as equal groups or rectangles ---------- */

export type GroupsConfig = { tables: number[]; maxSize: number; layout: "bags" | "array" };
export type GroupsRound = { groups: number; size: number; thing: Thing; answer: number; choices: number[] };

/** `groups` bags (or rows) of `size`: one factor always comes from the tables being learned. */
export function groupsRound({ tables, maxSize }: GroupsConfig, rng: Rng = Math.random): GroupsRound {
  const table = pick(tables, rng);
  const other = randomInt(2, maxSize, rng);
  const [groups, size] = rng() < 0.5 ? [table, other] : [other, table];
  const answer = groups * size;
  // Neighbouring products (one group more or less) are the meaningful mistakes.
  const candidates = shuffle([answer + size, answer - size, answer + groups, answer - groups, answer + 1].filter((value) => value > 0 && value !== answer), rng);
  const choices = [answer, ...[...new Set(candidates)].slice(0, 3)].sort((a, b) => a - b);
  return { groups, size, thing: pick(THINGS, rng), answer, choices };
}

/** The table facts this round practises, as stored by the review ("groups × size", read in that order). */
export function groupsFactKeys(round: GroupsRound): string[] {
  const { groups: a, size: b } = round;
  const keys: string[] = [];
  if (a >= 2 && a <= 9 && b >= 2 && b <= 9) keys.push(`tables:${a}:${b}`);
  if (a >= 2 && a <= 5 && b >= 1 && b <= 10) keys.push(`tables2-5:${a}:${b}`);
  return keys;
}

/* ---------- Share: division as dealing out equally ---------- */

export type ShareConfig = { maxFriends: number; maxEach: number; remainder: boolean };
export type ShareRound = { friends: number; each: number; left: number; total: number; thing: Thing };

export function shareRound({ maxFriends, maxEach, remainder }: ShareConfig, rng: Rng = Math.random): ShareRound {
  const friends = randomInt(2, maxFriends, rng);
  const each = randomInt(2, maxEach, rng);
  const left = remainder ? randomInt(0, friends - 1, rng) : 0;
  return { friends, each, left, total: friends * each + left, thing: pick(THINGS, rng) };
}

/* ---------- Estimate: place a number on an unmarked line (Siegler & Booth) ---------- */

export type EstimateConfig = { max: number };
export type EstimateRound = { target: number };

/** Targets avoid the very ends, where estimation is trivial. */
export function estimateRound({ max }: EstimateConfig, rng: Rng = Math.random): EstimateRound {
  const margin = Math.max(1, Math.round(max * 0.03));
  return { target: randomInt(margin, max - margin, rng) };
}

/** Distance between the tap and the target, as a share of the whole line (percent absolute error). */
export function estimateError(position: number, target: number, max: number): number {
  return Math.abs(position - target) / max;
}

/** Estimation has no wrong answer, only closer or further: within 5 % is perfect, within 10 % good. */
export function estimateMistakes(error: number): number {
  if (error <= 0.05) return 0;
  if (error <= 0.1) return 1;
  return 2;
}
