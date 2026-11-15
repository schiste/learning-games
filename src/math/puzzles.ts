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

/* ---------- Mystery number: deduce from clues ---------- */

export type MysteryConfig = { min: number; max: number };
export type Clue = { text: string; test: (value: number) => boolean };
export type MysteryRound = { target: number; candidates: number[]; clues: string[] };

function clueBank(target: number, min: number, max: number, rng: Rng): Clue[] {
  const units = target % 10;
  const tens = Math.floor(target / 10) % 10;
  const clues: Clue[] = [
    target % 2 === 0 ? { text: "Je suis pair.", test: (value) => value % 2 === 0 } : { text: "Je suis impair.", test: (value) => value % 2 === 1 },
    { text: `Mon chiffre des unités est ${units}.`, test: (value) => value % 10 === units },
  ];
  const lower = Math.max(min, target - randomInt(2, 8, rng));
  const upper = Math.min(max, target + randomInt(2, 8, rng));
  if (lower > min) clues.push({ text: `Je suis plus grand que ${lower - 1}.`, test: (value) => value > lower - 1 });
  if (upper < max) clues.push({ text: `Je suis plus petit que ${upper + 1}.`, test: (value) => value < upper + 1 });
  if (target >= 10) clues.push({ text: `Mon chiffre des dizaines est ${tens}.`, test: (value) => Math.floor(value / 10) % 10 === tens && value >= 10 });
  if (target >= 10) clues.push({ text: `La somme de mes chiffres est ${digitSum(target)}.`, test: (value) => digitSum(value) === digitSum(target) });
  if (target % 5 === 0) clues.push({ text: "Je suis dans la table de 5.", test: (value) => value % 5 === 0 });
  if (target % 3 === 0 && target > 0) clues.push({ text: "Je suis dans la table de 3.", test: (value) => value % 3 === 0 });
  return clues;
}

function digitSum(value: number): number {
  return String(value).split("").reduce((sum, digit) => sum + Number(digit), 0);
}

/**
 * Clues are added in random order until exactly one number of the grid fits all of them,
 * so the puzzle is always solvable and never has two answers.
 */
export function mysteryRound({ min, max }: MysteryConfig, rng: Rng = Math.random): MysteryRound {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const target = randomInt(min, max, rng);
    const all = Array.from({ length: max - min + 1 }, (_, index) => min + index);
    const bank = shuffle(clueBank(target, min, max, rng), rng);
    const chosen: Clue[] = [];
    let remaining = all;
    for (const clue of bank) {
      const next = remaining.filter(clue.test);
      if (next.length === remaining.length) continue;
      chosen.push(clue);
      remaining = next;
      if (remaining.length === 1) break;
    }
    if (remaining.length === 1 && chosen.length >= 2) {
      // Show a manageable grid around the answer: up to 20 numbers for young children.
      const span = Math.min(all.length, max - min >= 99 ? 30 : 20);
      const first = Math.max(min, Math.min(max - span + 1, target - randomInt(0, span - 1, rng)));
      const candidates = Array.from({ length: span }, (_, index) => first + index);
      if (candidates.filter((value) => chosen.every((clue) => clue.test(value))).length === 1) {
        return { target, candidates, clues: chosen.map((clue) => clue.text) };
      }
    }
  }
  // Practically unreachable; a 10-number window with its units digit always has a single answer.
  const target = randomInt(min, max, rng);
  const first = Math.max(min, target - (target % 10));
  const candidates = Array.from({ length: Math.min(10, max - first + 1) }, (_, index) => first + index);
  return { target, candidates, clues: [`Mon chiffre des unités est ${target % 10}.`, `Je suis entre ${first} et ${candidates.at(-1)}.`] };
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
