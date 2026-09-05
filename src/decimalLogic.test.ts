import { describe, expect, it } from "vitest";
import {
  activePlaces,
  bundleRound,
  codeClue,
  counterRound,
  decimalNumber,
  detectiveRound,
  expandedParts,
  lineRound,
  machineRound,
  placeDigits,
} from "./decimalLogic";

describe("decimal-system rounds", () => {
  it("uses two, three, then four place-value columns", () => {
    expect(activePlaces(1).map((place) => place.value)).toEqual([10, 1]);
    expect(activePlaces(2).map((place) => place.value)).toEqual([100, 10, 1]);
    expect(activePlaces(3).map((place) => place.value)).toEqual([1000, 100, 10, 1]);
  });

  it("recomposes every generated number from its digits and expanded parts", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let index = 0; index < 50; index += 1) {
        const number = decimalNumber(complexity);
        const digits = placeDigits(number, complexity);
        const places = activePlaces(complexity);
        expect(digits.reduce((sum, digit, digitIndex) => sum + digit * places[digitIndex].value, 0)).toBe(number);
        expect(expandedParts(number, complexity).reduce((sum, part) => sum + part, 0)).toBe(number);
        expect(codeClue(number, complexity)).toHaveLength(complexity + 1);
      }
    }
  });

  it("keeps bundle regrouping quantities constant", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let index = 0; index < 50; index += 1) {
        const round = bundleRound(complexity);
        const places = activePlaces(complexity);
        expect(round.counts.reduce((sum, count, countIndex) => sum + count * places[countIndex].value, 0)).toBe(round.target);
        expect(round.counts[round.fromIndex]).toBeGreaterThanOrEqual(10);
        expect(round.counts[round.toIndex]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("builds exact counter and number-line answers", () => {
    for (const complexity of [1, 2, 3] as const) {
      const counter = counterRound(complexity);
      expect(counter.start + counter.operation).toBe(counter.answer);
      expect(counter.options).toContain(counter.answer);
      const line = lineRound(complexity);
      expect(line.values[line.missingIndex]).toBe(line.answer);
      expect(line.options).toContain(line.answer);
    }
  });

  it("builds reachable place-value machines", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let index = 0; index < 20; index += 1) {
        const round = machineRound(complexity);
        let difference = round.target - round.start;
        let moves = 0;
        for (const operation of [...round.operations].sort((a, b) => b - a)) {
          moves += Math.floor(difference / operation);
          difference %= operation;
        }
        expect(difference).toBe(0);
        expect(moves).toBeLessThanOrEqual(round.maxMoves);
      }
    }
  });

  it("creates two true detective cards and one false card", () => {
    for (const complexity of [1, 2, 3] as const) {
      const round = detectiveRound(complexity);
      expect(round.cards.filter((card) => card.correct)).toHaveLength(2);
      expect(round.cards.filter((card) => !card.correct)).toHaveLength(1);
    }
  });
});
