import { describe, expect, it } from "vitest";
import { answerOptions, basketRound, holeQuestion, memoryDeck } from "./gameLogic";

describe("game rounds", () => {
  it("always includes the answer once in answer options", () => {
    for (let answer = 1; answer <= 9; answer += 1) {
      const options = answerOptions(answer);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options).toContain(answer);
    }
  });

  it("builds valid basket complements", () => {
    for (let i = 0; i < 100; i += 1) {
      const round = basketRound();
      expect(round.start + round.need).toBe(10);
      expect(round.options).toHaveLength(4);
      expect(round.options).toContain(round.need);
    }
  });

  it("builds solvable hole questions", () => {
    for (let i = 0; i < 100; i += 1) {
      const question = holeQuestion();
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThanOrEqual(10);
      expect(question.text).toContain("?");
    }
  });

  it("deals six complementary memory pairs", () => {
    const deck = memoryDeck();
    expect(deck).toHaveLength(12);
    const counts = new Map<number, number>();
    for (const card of deck) counts.set(card.value, (counts.get(card.value) ?? 0) + 1);
    expect(counts.get(5)).toBe(2);
    for (let n = 0; n < 5; n += 1) {
      expect(counts.get(n)).toBe(1);
      expect(counts.get(10 - n)).toBe(1);
    }
  });
});
