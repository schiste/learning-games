import { randomInt, shuffle, type Complexity } from "./gameLogic";

export type Place = { name: string; short: string; value: number; color: string };
export type CounterRound = { start: number; operation: number; answer: number; options: number[] };
export type LineRound = { values: number[]; missingIndex: number; answer: number; options: number[] };
export type MachineRound = {
  start: number;
  addend: number;
  landmark: number;
  bridge: number;
  remainder: number;
  target: number;
  bridgeOptions: number[];
  remainderOptions: number[];
};
export type CarryExchange = { fromIndex: number; toIndex: number };
export type DetectiveCard = {
  kind: "places" | "products";
  digits: number[];
  correct: boolean;
};
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

export function carryExchanges(number: number, operation: number, complexity: Complexity): CarryExchange[] {
  const places = activePlaces(complexity);
  const digits = placeDigits(number, complexity);
  let placeIndex = places.findIndex((place) => place.value === operation);
  const exchanges: CarryExchange[] = [];
  while (placeIndex > 0 && digits[placeIndex] === 9) {
    exchanges.push({ fromIndex: placeIndex, toIndex: placeIndex - 1 });
    placeIndex -= 1;
  }
  return exchanges;
}

export function machineRound(complexity: Complexity): MachineRound {
  const rounds: Record<Complexity, Array<Omit<MachineRound, "bridgeOptions" | "remainderOptions">>> = {
    1: [
      { start: 28, addend: 7, landmark: 30, bridge: 2, remainder: 5, target: 35 },
      { start: 47, addend: 8, landmark: 50, bridge: 3, remainder: 5, target: 55 },
      { start: 68, addend: 5, landmark: 70, bridge: 2, remainder: 3, target: 73 },
      { start: 76, addend: 9, landmark: 80, bridge: 4, remainder: 5, target: 85 },
    ],
    2: [
      { start: 185, addend: 37, landmark: 200, bridge: 15, remainder: 22, target: 222 },
      { start: 268, addend: 54, landmark: 300, bridge: 32, remainder: 22, target: 322 },
      { start: 375, addend: 48, landmark: 400, bridge: 25, remainder: 23, target: 423 },
      { start: 492, addend: 36, landmark: 500, bridge: 8, remainder: 28, target: 528 },
    ],
    3: [
      { start: 1875, addend: 260, landmark: 2000, bridge: 125, remainder: 135, target: 2135 },
      { start: 2460, addend: 680, landmark: 3000, bridge: 540, remainder: 140, target: 3140 },
      { start: 3980, addend: 145, landmark: 4000, bridge: 20, remainder: 125, target: 4125 },
      { start: 4755, addend: 390, landmark: 5000, bridge: 245, remainder: 145, target: 5145 },
    ],
  };
  const round = rounds[complexity][randomInt(0, rounds[complexity].length - 1)];
  return {
    ...round,
    bridgeOptions: nearbyOptions(round.bridge, complexity, complexity + 2),
    remainderOptions: nearbyOptions(round.remainder, complexity, complexity + 2),
  };
}

export function detectiveRound(complexity: Complexity): DetectiveRound {
  const number = decimalNumber(complexity);
  const digits = placeDigits(number, complexity);
  const wrongIndex = randomInt(0, digits.length - 1);
  const wrongDigits = digits.map((digit, index) => index === wrongIndex ? (digit + 1) % 10 : digit);
  return {
    number,
    cards: shuffle([
      { kind: "places", digits: [...digits], correct: true },
      { kind: "products", digits: [...digits], correct: true },
      { kind: "places", digits: wrongDigits, correct: false },
    ]),
  };
}

export function codeClue(number: number, complexity: Complexity): string[] {
  const places = activePlaces(complexity);
  return placeDigits(number, complexity).map((digit, index) => `${digit} ${places[index].name}`);
}
