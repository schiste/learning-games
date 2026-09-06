import { describe, expect, it } from "vitest";
import {
  dictationTiles,
  clapWord,
  intruderRound,
  sentenceRound,
  soundRound,
  syllableCountOptions,
  syllableRound,
  wordRound,
  wordsForLevel,
} from "./readingLogic";

describe("reading rounds", () => {
  it("progresses from simple words to complex graphemes", () => {
    expect(wordsForLevel(1).every((word) => !word.graphemes.some((part) => part.length > 1))).toBe(true);
    expect(wordsForLevel(3).some((word) => word.graphemes.includes("ou"))).toBe(true);
    expect(wordsForLevel(3).some((word) => word.graphemes.includes("ch"))).toBe(true);
  });

  it("builds syllables from the expected two keys", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let index = 0; index < 25; index += 1) {
        const round = syllableRound(complexity);
        expect(round.left + round.right).toBe(round.syllable);
        expect(round.leftOptions).toContain(round.left);
        expect(round.rightOptions).toContain(round.right);
      }
    }
  });

  it("creates sound hunts with one correct word", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let index = 0; index < 25; index += 1) {
        const round = soundRound(complexity);
        expect(round.answer.sounds).toContain(round.sound);
        expect(round.options.filter((word) => word.sounds.includes(round.sound))).toEqual([round.answer]);
      }
    }
  });

  it("keeps word, syllable-count, sentence and dictation answers reachable", () => {
    for (const complexity of [1, 2, 3] as const) {
      const word = wordRound(complexity);
      expect(word.options).toContain(word.answer);
      expect(syllableCountOptions(word.answer)).toContain(word.answer.syllables.length);

      const sentence = sentenceRound(complexity);
      expect(`${sentence.words.join(" ")}.`).toBe(sentence.sentence);

      const tiles = dictationTiles(word.answer, complexity);
      for (const grapheme of word.answer.graphemes) expect(tiles).toContain(grapheme);

      expect([1, 2, 3]).toContain(clapWord(complexity).syllables.length);
    }
  });

  it("creates an intruder outside a three-word sound family", () => {
    for (const complexity of [1, 2, 3] as const) {
      for (let index = 0; index < 25; index += 1) {
        const round = intruderRound(complexity);
        expect(round.options.filter((word) => word.sounds.includes(round.sound))).toHaveLength(3);
        expect(round.answer.sounds).not.toContain(round.sound);
      }
    }
  });
});
