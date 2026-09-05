import { describe, expect, it } from "vitest";
import { answerOptions, basketRound, bowlingRound, holeQuestion, memoryDeck, randomStart, type Complexity } from "./gameLogic";

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
});
