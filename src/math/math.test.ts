import { describe, expect, it } from "vitest";
import { parseRoute } from "../route";
import { ALL_STEPS, CHAPTERS, findStep, nextStep } from "./curriculum";
import {
  bondsHint,
  bondsRound,
  buildHint,
  compareAnswer,
  compareRound,
  countRound,
  factFor,
  flashRound,
  roundPoints,
  roundStars,
  sprintStars,
  type FactSet,
} from "./logic";
import { activeProfile, chapterScore, createProfile, loadStore, recordStep, removeProfile, saveStore, suggestedStep, type ProfileStore } from "./profiles";
import { nearbyChoices } from "./random";

const RUNS = 300;

describe("answer choices", () => {
  it("always contain the answer, stay in range, have no duplicates and read in order", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const answer = Math.floor(Math.random() * 21);
      const choices = nearbyChoices(answer, 4, 0, 20);
      expect(choices).toContain(answer);
      expect(new Set(choices).size).toBe(4);
      expect(choices.every((value) => value >= 0 && value <= 20)).toBe(true);
      expect([...choices].sort((a, b) => a - b)).toEqual(choices);
    }
  });
});

describe("count", () => {
  it("places the right number of objects in distinct cells and offers the answer", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = countRound({ min: 10, max: 20 });
      expect(round.count).toBeGreaterThanOrEqual(10);
      expect(round.count).toBeLessThanOrEqual(20);
      expect(new Set(round.cells).size).toBe(round.count);
      expect(round.cells.every((cell) => cell >= 0 && cell < round.gridSize)).toBe(true);
      expect(round.choices).toContain(round.count);
    }
  });
});

describe("flash", () => {
  it("never asks for more spots than a die has", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = flashRound({ max: 6, pattern: "dice", showMs: 1000 });
      expect(round.count).toBeGreaterThanOrEqual(1);
      expect(round.count).toBeLessThanOrEqual(6);
      expect(round.choices).toContain(round.count);
    }
  });
});

describe("build", () => {
  it("tells the child exactly how many to add or remove", () => {
    expect(buildHint(5, 7)).toContain("ajoute-en 2");
    expect(buildHint(9, 7)).toContain("enlève-en 2");
  });
});

describe("compare", () => {
  it("never produces a tie and finds the side the question asks for", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = compareRound({ min: 2, max: 10, mode: "objects", aligned: true });
      expect(round.left).not.toBe(round.right);
      const chosen = compareAnswer(round) === "left" ? round.left : round.right;
      const other = compareAnswer(round) === "left" ? round.right : round.left;
      expect(round.ask === "more" ? chosen > other : chosen < other).toBe(true);
    }
  });
});

describe("bonds", () => {
  it("splits the whole into two non-empty parts", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = bondsRound({ totals: [5, 6, 7, 8, 9, 10], frame: true });
      expect(round.part).toBeGreaterThanOrEqual(1);
      expect(round.missing).toBeGreaterThanOrEqual(1);
      expect(round.part + round.missing).toBe(round.total);
    }
  });

  it("explains a wrong part with the sum it really makes", () => {
    expect(bondsHint(6, 5, 10, true)).toBe("6 et 5, ça fait 11 : c’est trop !");
    expect(bondsHint(6, 2, 10, false)).toContain("il en manque encore");
  });
});

describe("sprint facts", () => {
  const sets: FactSet[] = ["complements10", "add10", "sub10", "doubles", "add20", "sub20", "tens", "tables2-5", "tables"];
  it.each(sets)("%s facts are correct, non-negative and offered among the choices", (set) => {
    for (let run = 0; run < RUNS; run += 1) {
      const fact = factFor(set);
      expect(fact.answer).toBeGreaterThanOrEqual(0);
      expect(fact.choices).toContain(fact.answer);
      const [a, op, b] = fact.text.split(" ");
      if (fact.text.includes("?")) {
        expect(Number(a) + fact.answer).toBe(10);
      } else {
        const expected = op === "+" ? Number(a) + Number(b) : op === "−" ? Number(a) - Number(b) : Number(a) * Number(b);
        expect(fact.answer).toBe(expected);
      }
    }
  });

  it("add20 and sub20 always cross ten, the skill they are there to train", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const add = factFor("add20");
      expect(add.answer).toBeGreaterThan(10);
      const [a, , b] = factFor("sub20").text.split(" ").map(Number);
      expect(a % 10).toBeLessThan(b);
    }
  });
});

describe("stars", () => {
  it("rewards accuracy without ever giving zero", () => {
    expect(roundStars(0)).toBe(3);
    expect(roundStars(3)).toBe(2);
    expect(roundStars(20)).toBe(1);
    expect(sprintStars(0)).toBe(1);
    expect(sprintStars(20)).toBe(3);
  });
});

describe("curriculum", () => {
  it("has unique step ids and at least one round per step", () => {
    const ids = ALL_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ALL_STEPS.every((step) => step.rounds >= 1)).toBe(true);
    expect(CHAPTERS.every((chapter) => chapter.steps.length > 0)).toBe(true);
  });

  it("chains steps across chapters", () => {
    const lastOfFirst = CHAPTERS[0].steps.at(-1)!;
    expect(nextStep(lastOfFirst.id)).toBe(CHAPTERS[1].steps[0]);
    expect(nextStep(ALL_STEPS.at(-1)!.id)).toBeNull();
    expect(findStep("nope")).toBeNull();
  });

  it("keeps grades in non-decreasing order along the adventure", () => {
    const order = { CP: 0, CE1: 1, CE2: 2 };
    for (let index = 1; index < ALL_STEPS.length; index += 1) {
      expect(order[ALL_STEPS[index].grade]).toBeGreaterThanOrEqual(order[ALL_STEPS[index - 1].grade]);
    }
  });
});

describe("profiles", () => {
  const memory = (initial: Record<string, string> = {}) => {
    const data = new Map<string, string>(Object.entries(initial));
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  };
  const empty: ProfileStore = { activeId: null, profiles: [] };

  it("creates an active player, named after the avatar when no name is given", () => {
    const store = createProfile(empty, "  ", "🐼", "a");
    expect(activeProfile(store)?.name).toBe("Panda");
    expect(createProfile(store, "Léa", "🦊", "b").activeId).toBe("b");
  });

  it("keeps best stars and best score per step while lifetime points always grow", () => {
    let player = activeProfile(createProfile(empty, "Léa", "🦊", "a"))!;
    player = recordStep(player, "count-5", 3, 60);
    player = recordStep(player, "count-5", 2, 40);
    expect(player.steps["count-5"]).toEqual({ stars: 3, best: 60, plays: 2 });
    expect(player.points).toBe(100);
    expect(chapterScore(player, CHAPTERS[0])).toEqual({ stars: 3, best: 60, done: 1 });
  });

  it("round-trips through storage", () => {
    const storage = memory();
    const store = createProfile(empty, "Léa", "🦊", "a");
    saveStore(store, storage);
    expect(loadStore(storage)).toEqual(store);
  });

  it("migrates stars saved before profiles existed", () => {
    const store = loadStore(memory({ "dix-sur-dix:progress:v1": JSON.stringify({ "count-5": 2, bogus: 9 }) }));
    expect(activeProfile(store)?.steps).toEqual({ "count-5": { stars: 2, best: 0, plays: 1 } });
  });

  it("survives corrupt or blocked storage", () => {
    expect(loadStore({ getItem: () => "{not json" })).toEqual(empty);
    expect(loadStore({ getItem: () => JSON.stringify({ activeId: "x", profiles: [{ nope: 1 }] }) })).toEqual(empty);
    expect(loadStore({ getItem: () => { throw new Error("blocked"); } })).toEqual(empty);
    expect(() => saveStore(empty, { setItem: () => { throw new Error("full"); } })).not.toThrow();
  });

  it("removing the active player returns to the picker", () => {
    const store = createProfile(empty, "Léa", "🦊", "a");
    expect(removeProfile(store, "a")).toEqual(empty);
  });

  it("suggests the first unfinished step", () => {
    const player = activeProfile(createProfile(empty, "Léa", "🦊", "a"))!;
    expect(suggestedStep(player)).toBe(ALL_STEPS[0]);
    expect(suggestedStep(recordStep(player, ALL_STEPS[0].id, 1, 10))).toBe(ALL_STEPS[1]);
  });
});

describe("points", () => {
  it("rewards accuracy first, then speed, and never punishes running out of time", () => {
    expect(roundPoints(0, 1)).toBe(15);
    expect(roundPoints(0, 0)).toBe(10);
    expect(roundPoints(0, -3)).toBe(10);
    expect(roundPoints(1, 0.5)).toBe(9);
    expect(roundPoints(4, 0)).toBe(3);
  });
});

describe("routes", () => {
  it("opens the adventure by default and from old links", () => {
    expect(parseRoute("")).toEqual({ topic: "maths", stepId: null });
    expect(parseRoute("#faire-10")).toEqual({ topic: "maths", stepId: null });
    expect(parseRoute("#maths/make-10")).toEqual({ topic: "maths", stepId: "make-10" });
    expect(parseRoute("#lecture")).toEqual({ topic: "reading" });
  });
});
