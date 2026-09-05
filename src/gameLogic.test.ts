import { describe, expect, it } from "vitest";
import {
  answerOptions,
  balanceRound,
  basketRound,
  bowlingRound,
  cashRound,
  holeQuestion,
  memoryDeck,
  pathRound,
  randomStart,
  shareRound,
  timerQuestion,
  type Complexity,
} from "./gameLogic";

describe("game rounds", () => {
  it("always includes the answer once in answer options", () => {
    for (let answer = 0; answer <= 10; answer += 1) {
      const options = answerOptions(answer);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options).toContain(answer);
    }
  });

  it("scales starting-number ranges with complexity", () => {
    const samples = (complexity: Complexity) => Array.from({ length: 100 }, () => randomStart(complexity));
    expect(samples(1).every((number) => number >= 5 && number <= 9)).toBe(true);
    expect(samples(2).every((number) => number >= 2 && number <= 8)).toBe(true);
    expect(samples(3).every((number) => number >= 0 && number <= 9)).toBe(true);
  });

  it("builds valid basket complements", () => {
    for (let i = 0; i < 100; i += 1) {
      const round = basketRound(3);
      expect(round.start + round.need).toBe(10);
      expect(round.options).toHaveLength(4);
      expect(round.options).toContain(round.need);
    }
  });

  it("builds solvable hole questions", () => {
    for (let i = 0; i < 100; i += 1) {
      const question = holeQuestion(3);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThanOrEqual(10);
      expect(question.text).toContain("?");
    }
  });

  it("deals six complementary memory pairs", () => {
    const deck = memoryDeck(2);
    expect(deck).toHaveLength(12);
    const counts = new Map<number, number>();
    for (const card of deck) counts.set(card.value, (counts.get(card.value) ?? 0) + 1);
    expect(counts.get(5)).toBe(2);
    for (let n = 0; n < 5; n += 1) {
      expect(counts.get(n)).toBe(1);
      expect(counts.get(10 - n)).toBe(1);
    }
  });

  it("changes memory-deck size by complexity", () => {
    expect(memoryDeck(1)).toHaveLength(6);
    expect(memoryDeck(2)).toHaveLength(12);
    expect(memoryDeck(3)).toHaveLength(16);
  });

  it("builds valid bowling rounds at every complexity", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let i = 0; i < 50; i += 1) {
        const round = bowlingRound(complexity);
        expect(round.knocked + round.standing).toBe(10);
        expect(round.options).toContain(round.standing);
        expect(round.options).toHaveLength(complexity + 1);
      }
    }
  });

  it("keeps timed games at 10 while scaling the expression", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let i = 0; i < 100; i += 1) {
        const question = timerQuestion(complexity);
        expect(question.terms.reduce((sum, term) => sum + term, 0)).toBe(10);
        expect(question.answer).toBe(question.terms[question.missingIndex]);
        expect(question.inputValues).toContain(question.answer);
        expect(question.text).toContain("?");
        expect(question.terms).toHaveLength(complexity === 1 ? 2 : 3);
        if (complexity === 3) {
          expect(question.terms.every((term) => term >= 0 && term <= 5)).toBe(true);
          expect(question.inputValues).toEqual([0, 1, 2, 3, 4, 5]);
        }
      }
    }
  });

  it("builds valid cash rounds at every complexity", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let i = 0; i < 50; i += 1) {
        const round = cashRound(complexity);
        expect(round.total + round.change).toBe(10);
        expect(round.prices.reduce((sum, price) => sum + price, 0)).toBe(round.total);
        expect(round.change).toBeGreaterThan(0);
        if (complexity === 1) expect(round.denominations).toEqual([1]);
        if (complexity === 3) {
          expect(round.prices).toHaveLength(2);
          expect(round.maxCoins).toBeGreaterThan(0);
        }
      }
    }
  });

  it("always gives the balance a selectable solution", () => {
    const hasSubset = (values: number[], target: number) => Array.from(
      { length: 2 ** values.length },
      (_, mask) => values.reduce((sum, value, index) => sum + ((mask >> index) & 1 ? value : 0), 0),
    ).includes(target);
    for (const complexity of [1, 2, 3] as const) {
      for (let i = 0; i < 50; i += 1) {
        const round = balanceRound(complexity);
        const left = round.leftWeights.reduce((sum, value) => sum + value, 0);
        expect(left).toBe(10);
        expect(hasSubset(round.tiles, left - round.rightBase)).toBe(true);
        if (complexity === 3) {
          expect(round.tiles.every((value) => value >= 1 && value <= 5)).toBe(true);
          expect(Array.from({ length: round.tiles.length }, (_, first) => first).some((first) => (
            round.tiles.some((_, second) => second > first && round.tiles.some((__, third) => (
              third > second && round.tiles[first] + round.tiles[second] + round.tiles[third] === 10
            )))
          ))).toBe(true);
        }
      }
    }
  });

  it("builds bounded paths whose provided route reaches 10", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let i = 0; i < 30; i += 1) {
        const round = pathRound(complexity);
        let position = round.start;
        for (const operation of round.solution) {
          position += operation;
          expect(position).toBeGreaterThanOrEqual(0);
          expect(position).toBeLessThanOrEqual(round.maxPosition);
        }
        expect(position).toBe(10);
        expect(round.solution.length).toBeLessThanOrEqual(round.maxMoves);
        if (complexity === 1) expect(round.operations.every((operation) => operation > 0)).toBe(true);
        if (complexity > 1) expect(round.operations.some((operation) => operation < 0)).toBe(true);
      }
    }
  });

  it("builds ten-treasure sharing rounds with valid relations", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let i = 0; i < 30; i += 1) {
        const round = shareRound(complexity);
        expect(round.targets.reduce((sum, value) => sum + value, 0)).toBe(10);
        for (const relation of round.relations) {
          expect(round.targets[relation.left]).toBe(round.targets[relation.right] + relation.offset);
        }
      }
    }
  });
});
