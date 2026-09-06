import { describe, expect, it } from "vitest";
import { CORE_SPACES, makeCoreRound, type Grade } from "./coreSkillsLogic";

function canMakeTotal(values: number[], target: number) {
  let totals = new Set([0]);
  for (const value of values) totals = new Set([...totals, ...[...totals].map((total) => total + value)]);
  return totals.has(target);
}

describe("cycle 2 catalog", () => {
  it("contains ten spaces with three games in every learning stage", () => {
    expect(CORE_SPACES).toHaveLength(10);
    expect(new Set(CORE_SPACES.map((space) => space.id)).size).toBe(10);
    for (const space of CORE_SPACES) {
      expect(space.games).toHaveLength(9);
      expect(space.games.filter((game) => game.stage === "discover")).toHaveLength(3);
      expect(space.games.filter((game) => game.stage === "train")).toHaveLength(3);
      expect(space.games.filter((game) => game.stage === "master")).toHaveLength(3);
    }
  });

  it("generates a reachable round for every game, grade and support level", () => {
    for (const space of CORE_SPACES) {
      for (const game of space.games) {
        for (const grade of ["CP", "CE1", "CE2"] as Grade[]) {
          for (const complexity of [1, 2, 3] as const) {
            const round = makeCoreRound(space.id, game.id, grade, complexity);
            const context = `${space.id}/${game.id}/${grade}/aide-${complexity}`;
            expect(round.prompt.length).toBeGreaterThan(3);
            expect(round.hint.length).toBeGreaterThan(3);
            if (round.mode === "choice") expect(round.options).toContain(round.answer);
            if (round.mode === "order") expect([...round.tokens].sort()).toEqual([...round.answer].sort());
            if (round.mode === "sort") expect(round.items.every((item) => round.categories.includes(item.category))).toBe(true);
            if (round.mode === "build" && round.rule === "text") {
              const labels = round.tokens.map((token) => token.label);
              let remaining = String(round.answer);
              while (remaining) {
                const index = labels.findIndex((label) => remaining.startsWith(label));
                expect(index, `${context}: ${String(round.answer)} with ${labels.join("|")}`).toBeGreaterThanOrEqual(0);
                const [piece] = labels.splice(index, 1);
                remaining = remaining.slice(piece!.length);
              }
            }
            if (round.mode === "build" && round.rule === "sum") {
              expect(canMakeTotal(round.tokens.map((token) => token.value ?? 0), Number(round.answer)), context).toBe(true);
            }
            if (round.mode === "counter") {
              expect(round.target).toBeGreaterThanOrEqual(round.min);
              expect(round.target).toBeLessThanOrEqual(round.max);
            }
          }
        }
      }
    }
  });
});
