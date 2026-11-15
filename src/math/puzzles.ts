import { nearbyChoices, pick, randomInt, shuffle, type Rng } from "./random";

/* ---------- Sequences: find what comes next ---------- */

export const SHAPES = ["🔴", "🔵", "🟡", "🟢", "🔺", "⭐"] as const;

export type PatternConfig = { kind: "shapes"; units: Array<"AB" | "AAB" | "ABB" | "ABC" | "AABB"> } | { kind: "numbers"; rules: Array<"+1" | "+2" | "+5" | "+10" | "-1" | "-2" | "-10" | "x2" | "+3" | "-3"> };
export type PatternRound = { items: string[]; answer: string; choices: string[]; rule: string };

/** A repeating unit (shapes) or a constant step (numbers), shown with one missing term at the end. */
export function patternRound(config: PatternConfig, rng: Rng = Math.random): PatternRound {
  if (config.kind === "shapes") {
    const unit = pick(config.units, rng);
    const letters = [...new Set(unit)];
    const shapes = shuffle(SHAPES, rng).slice(0, letters.length);
    const map = Object.fromEntries(letters.map((letter, index) => [letter, shapes[index]]));
    const length = Math.max(7, unit.length * 2 + randomInt(1, unit.length, rng));
    const sequence = Array.from({ length }, (_, index) => map[unit[index % unit.length]]);
    const answer = sequence.at(-1)!;
    // Distractors come first from the pattern itself (the tempting ones), then from other shapes.
    const others = [...shuffle(shapes.filter((shape) => shape !== answer), rng), ...shuffle(SHAPES.filter((shape) => !shapes.includes(shape)), rng)];
    return { items: sequence.slice(0, -1), answer, choices: shuffle([answer, ...others.slice(0, 2)], rng), rule: unit };
  }
  const rule = pick(config.rules, rng);
  const step = Number(rule.slice(1));
  const op = rule[0];
  const length = 5;
  let start: number;
  if (op === "x") start = randomInt(1, 3, rng);
  else if (op === "-") start = randomInt(step * length, step * length + 20, rng);
  else start = randomInt(0, step === 10 ? 50 : 20, rng);
  const terms = [start];
  for (let index = 1; index <= length; index += 1) {
    const last = terms[index - 1];
    terms.push(op === "+" ? last + step : op === "-" ? last - step : last * step);
  }
  const answer = terms.at(-1)!;
  const choices = nearbyChoices(answer, 4, 0, answer + 40, rng);
  return { items: terms.slice(0, -1).map(String), answer: String(answer), choices: choices.map(String), rule };
}

export function patternHint(round: PatternRound): string {
  if (/^[ABC]+$/.test(round.rule)) return `Cherche le motif qui se répète : ${round.items.slice(0, round.rule.length).join(" ")}…`;
  const [op, step] = [round.rule[0], round.rule.slice(1)];
  const verb = op === "+" ? `on ajoute ${step}` : op === "-" ? `on enlève ${step}` : `on double`;
  return `Regarde de combien on avance à chaque fois : ${round.items[0]} → ${round.items[1]}. Ici, ${verb}.`;
}

/* ---------- Mystery number: deduce from clues, one clue at a time ---------- */

export type MysteryConfig = { min: number; max: number };
type Clue = { text: string; tip: string; test: (value: number) => boolean };
/** One revealed clue: what it says, the pattern to look for, and the numbers it rules out among those still in play. */
export type MysteryStep = { text: string; tip: string; excluded: number[] };
export type MysteryRound = { target: number; candidates: number[]; steps: MysteryStep[] };

function digitSum(value: number): number {
  return String(value).split("").reduce((sum, digit) => sum + Number(digit), 0);
}

function lowerBound(bound: number): Clue {
  return { text: `Je suis plus grand que ${bound}.`, tip: `Barre ${bound} et tous les nombres plus petits.`, test: (value) => value > bound };
}

function upperBound(bound: number): Clue {
  return { text: `Je suis plus petit que ${bound}.`, tip: `Barre ${bound} et tous les nombres plus grands.`, test: (value) => value < bound };
}

/**
 * Clues true for the target. A one-digit answer never gets its units digit (or its digit sum,
 * which is the same number): those would give the answer away instead of making the child reason.
 */
function clueBank(target: number, first: number, last: number, rng: Rng): Clue[] {
  const units = target % 10;
  const tens = Math.floor(target / 10) % 10;
  const clues: Clue[] = [
    target % 2 === 0
      ? { text: "Je suis pair.", tip: "Les nombres pairs finissent par 0, 2, 4, 6 ou 8 : barre les autres.", test: (value) => value % 2 === 0 }
      : { text: "Je suis impair.", tip: "Les nombres impairs finissent par 1, 3, 5, 7 ou 9 : barre les autres.", test: (value) => value % 2 === 1 },
  ];
  if (target > first) clues.push(lowerBound(randomInt(Math.max(first, target - 8), target - 1, rng)));
  if (target < last) clues.push(upperBound(randomInt(target + 1, Math.min(last, target + 8), rng)));
  if (target >= 10) {
    clues.push({ text: `Mon chiffre des unités est ${units}.`, tip: "Regarde le dernier chiffre de chaque nombre.", test: (value) => value % 10 === units });
    clues.push({ text: `Mon chiffre des dizaines est ${tens}.`, tip: "Le chiffre des dizaines est le premier chiffre : 3 dans 34.", test: (value) => value >= 10 && Math.floor(value / 10) % 10 === tens });
    clues.push({ text: `La somme de mes chiffres est ${digitSum(target)}.`, tip: "Additionne les deux chiffres : pour 23, 2 + 3 = 5.", test: (value) => digitSum(value) === digitSum(target) });
  }
  if (target % 5 === 0) clues.push({ text: "Je suis dans la table de 5.", tip: "Les nombres de la table de 5 finissent par 0 ou 5.", test: (value) => value % 5 === 0 });
  if (target % 3 === 0) clues.push({ text: "Je suis dans la table de 3.", tip: "La table de 3 : 3, 6, 9, 12, 15, 18, 21, 24, 27, 30…", test: (value) => value % 3 === 0 });
  return clues;
}

/** Applies clues in order, keeping only those that rule out at least one number still in play. */
function chain(clues: Clue[], candidates: number[]): { steps: MysteryStep[]; remaining: number[] } {
  const steps: MysteryStep[] = [];
  let remaining = candidates;
  for (const clue of clues) {
    if (remaining.length === 1) break;
    const excluded = remaining.filter((value) => !clue.test(value));
    if (!excluded.length) continue;
    steps.push({ text: clue.text, tip: clue.tip, excluded });
    remaining = remaining.filter(clue.test);
  }
  return { steps, remaining };
}

/**
 * The grid is chosen first (up to 20 numbers, 30 beyond 100), then clues are added in random order
 * until exactly one number remains. Every clue rules out something, so the child always has
 * numbers to cross out before the next clue appears.
 */
export function mysteryRound({ min, max }: MysteryConfig, rng: Rng = Math.random): MysteryRound {
  const span = Math.min(max - min + 1, max - min >= 99 ? 30 : 20);
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const target = randomInt(min, max, rng);
    const first = Math.max(min, Math.min(max - span + 1, target - randomInt(0, span - 1, rng)));
    const candidates = Array.from({ length: span }, (_, index) => first + index);
    const { steps, remaining } = chain(shuffle(clueBank(target, first, candidates.at(-1)!, rng), rng), candidates);
    if (remaining.length === 1 && remaining[0] === target && steps.length >= 2) return { target, candidates, steps };
  }
  // Practically unreachable: parity, then tight bounds always isolate the target without its units digit.
  const target = randomInt(Math.max(min, 2), Math.min(max, min + span - 2), rng);
  const candidates = Array.from({ length: span }, (_, index) => min + index);
  const parity = clueBank(target, min, candidates.at(-1)!, rng)[0];
  const { steps } = chain([parity, lowerBound(target - 1), upperBound(target + 1)], candidates);
  return { target, candidates, steps };
}

/* ---------- Mini-sudoku 4×4: every row, column and 2×2 box holds each symbol once ---------- */

export type SudokuConfig = { symbols: "shapes" | "digits"; blanks: number };
export type SudokuRound = { solution: number[]; puzzle: Array<number | null> };

const BASE = [0, 1, 2, 3, 2, 3, 0, 1, 1, 0, 3, 2, 3, 2, 1, 0];

export function sudokuConflict(grid: Array<number | null>, cell: number, value: number): "row" | "column" | "box" | null {
  const row = Math.floor(cell / 4);
  const col = cell % 4;
  for (let index = 0; index < 16; index += 1) {
    if (index === cell || grid[index] !== value) continue;
    if (Math.floor(index / 4) === row) return "row";
    if (index % 4 === col) return "column";
    if (Math.floor(Math.floor(index / 4) / 2) === Math.floor(row / 2) && Math.floor((index % 4) / 2) === Math.floor(col / 2)) return "box";
  }
  return null;
}

/** Number of completions of a grid, stopping at `limit`: used to keep only puzzles with one solution. */
export function countSolutions(grid: Array<number | null>, limit = 2): number {
  const cell = grid.indexOf(null);
  if (cell < 0) return 1;
  let total = 0;
  for (let value = 0; value < 4 && total < limit; value += 1) {
    if (sudokuConflict(grid, cell, value)) continue;
    const next = [...grid];
    next[cell] = value;
    total += countSolutions(next, limit - total);
  }
  return total;
}

/** Shuffle a valid grid (symbols, rows within bands, bands, columns within stacks), then blank cells while the solution stays unique. */
export function sudokuRound({ blanks }: SudokuConfig, rng: Rng = Math.random): SudokuRound {
  const symbols = shuffle([0, 1, 2, 3], rng);
  // Bands of two rows (and stacks of two columns) may swap, and so may the two lines inside each.
  const lines = () => (rng() < 0.5 ? [0, 1] : [1, 0]).flatMap((band) => (rng() < 0.5 ? [band * 2, band * 2 + 1] : [band * 2 + 1, band * 2]));
  const rowOrder = lines();
  const colOrder = lines();
  const solution = Array.from({ length: 16 }, (_, cell) => symbols[BASE[rowOrder[Math.floor(cell / 4)] * 4 + colOrder[cell % 4]]]);
  const puzzle: Array<number | null> = [...solution];
  for (const cell of shuffle(Array.from({ length: 16 }, (_, index) => index), rng)) {
    if (puzzle.filter((value) => value === null).length >= blanks) break;
    const saved = puzzle[cell];
    puzzle[cell] = null;
    if (countSolutions(puzzle) !== 1) puzzle[cell] = saved;
  }
  return { solution, puzzle };
}
