import { randomInt, shuffle, type Complexity } from "./gameLogic";

export type Place = { name: string; short: string; value: number; color: string };
export type CounterRound = { start: number; operation: number; answer: number; options: number[] };
export type LineRound = { values: number[]; missingIndex: number; answer: number; options: number[] };
export type MachineRound = { start: number; target: number; operations: number[]; maxMoves: number };
export type DetectiveCard = { text: string; correct: boolean };
export type DetectiveRound = { number: number; cards: DetectiveCard[] };

export const PLACES: Place[] = [
  { name: "milliers", short: "M", value: 1000, color: "berry" },
  { name: "centaines", short: "C", value: 100, color: "sky" },
  { name: "dizaines", short: "D", value: 10, color: "leaf" },
  { name: "unités", short: "U", value: 1, color: "sun" },
];

const NUMBER_POOLS: Record<Complexity, number[]> = {
  1: [10, 20, 24, 37, 42, 58, 73, 90],
  2: [105, 120, 208, 340, 472, 609, 750, 905],
  3: [1007, 1020, 1093, 1205, 2040, 3216, 4098, 5730],
};

export function activePlaces(complexity: Complexity): Place[] {
  return PLACES.slice(PLACES.length - complexity - 1);
}

export function decimalNumber(complexity: Complexity): number {
  const pool = NUMBER_POOLS[complexity];
  return pool[randomInt(0, pool.length - 1)];
}

export function placeDigits(number: number, complexity: Complexity): number[] {
  return activePlaces(complexity).map((place) => Math.floor(number / place.value) % 10);
}

export function expandedParts(number: number, complexity: Complexity): number[] {
  return activePlaces(complexity).map((place) => Math.floor(number / place.value) % 10 * place.value);
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat("fr-FR").format(number);
}

export function bundleRound(complexity: Complexity) {
  const places = activePlaces(complexity);
  const digits = places.map((_, index) => index === 0 ? randomInt(1, complexity === 3 ? 5 : 9) : randomInt(0, 9));
  const target = digits.reduce((sum, digit, index) => sum + digit * places[index].value, 0);
  const toIndex = 0;
  const fromIndex = 1;
  const counts = [...digits];
  counts[toIndex] -= 1;
  counts[fromIndex] += 10;
  return {
    target,
    counts,
    fromIndex,
    toIndex,
  };
}

export function nearbyOptions(answer: number, complexity: Complexity, count = 3): number[] {
  const place = complexity === 1 ? 10 : complexity === 2 ? 100 : 1000;
  const candidates = [
    answer - 1,
    answer + 1,
    answer - 10,
    answer + 10,
    answer - place,
    answer + place,
  ].filter((value, index, values) => value >= 0 && value !== answer && values.indexOf(value) === index);
  return shuffle([answer, ...shuffle(candidates).slice(0, count - 1)]);
}

export function counterRound(complexity: Complexity): CounterRound {
  const rounds: Record<Complexity, Array<[number, number]>> = {
    1: [[19, 1], [29, 1], [39, 1], [49, 1]],
    2: [[99, 1], [109, 1], [190, 10], [299, 1]],
    3: [[999, 1], [1099, 1], [1990, 10], [2093, 100]],
  };
  const [start, operation] = rounds[complexity][randomInt(0, rounds[complexity].length - 1)];
  const answer = start + operation;
  return { start, operation, answer, options: nearbyOptions(answer, complexity, complexity + 1) };
}

export function lineRound(complexity: Complexity): LineRound {
  const step = complexity === 1 ? 10 : complexity === 2 ? 100 : randomInt(0, 1) ? 100 : 10;
  const start = complexity === 1 ? randomInt(0, 4) * 10 : complexity === 2 ? randomInt(0, 4) * 100 : randomInt(10, 16) * 100;
  const values = Array.from({ length: 5 }, (_, index) => start + index * step);
  const missingIndex = randomInt(1, 3);
  const answer = values[missingIndex];
  return { values, missingIndex, answer, options: nearbyOptions(answer, complexity, complexity + 1) };
}

export function machineRound(complexity: Complexity): MachineRound {
  const rounds: Record<Complexity, MachineRound[]> = {
    1: [
      { start: 12, target: 34, operations: [1, 10], maxMoves: 4 },
      { start: 25, target: 47, operations: [1, 10], maxMoves: 4 },
    ],
    2: [
      { start: 183, target: 305, operations: [1, 10, 100], maxMoves: 5 },
      { start: 240, target: 462, operations: [1, 10, 100], maxMoves: 6 },
    ],
    3: [
      { start: 963, target: 1093, operations: [1, 10, 100, 1000], maxMoves: 4 },
      { start: 1093, target: 2094, operations: [1, 10, 100, 1000], maxMoves: 2 },
    ],
  };
  const round = rounds[complexity][randomInt(0, rounds[complexity].length - 1)];
  return { ...round, operations: [...round.operations] };
}

export function detectiveRound(complexity: Complexity): DetectiveRound {
  const number = decimalNumber(complexity);
  const places = activePlaces(complexity);
  const digits = placeDigits(number, complexity);
  const parts = expandedParts(number, complexity);
  const wrongIndex = randomInt(0, parts.length - 1);
  const wrongParts = parts.map((part, index) => index === wrongIndex ? part + places[index].value : part);
  const placeText = digits.map((digit, index) => `${digit} ${places[index].short}`).join(" · ");
  return {
    number,
    cards: shuffle([
      { text: `${formatNumber(number)} = ${parts.map(formatNumber).join(" + ")}`, correct: true },
      { text: `${formatNumber(number)} = ${placeText}`, correct: true },
      { text: `${formatNumber(number)} = ${wrongParts.map(formatNumber).join(" + ")}`, correct: false },
    ]),
  };
}

export function codeClue(number: number, complexity: Complexity): string[] {
  const places = activePlaces(complexity);
  return placeDigits(number, complexity).map((digit, index) => `${digit} ${places[index].name}`);
}
