import { describe, expect, it } from "vitest";
import { parseRoute } from "../route";
import { ALL_STEPS, CHAPTERS, findStep, nextStep } from "./curriculum";
import {
  blocksChoices,
  blocksHint,
  blocksRound,
  bondsHint,
  bridgeRound,
  groupsFactKeys,
  groupsRound,
  shareRound,
  LINE_TICKS,
  lineRound,
  placeDigits,
  bondsRound,
  buildHint,
  compareAnswer,
  compareRound,
  countRound,
  flashRound,
  roundPoints,
  roundStars,
  sprintStars,
} from "./logic";
import { activeProfile, chapterScore, createProfile, loadStore, recordStep, removeProfile, saveStore, suggestedStep, type ProfileStore } from "./profiles";
import { nearbyChoices } from "./random";
import { factSetUnlocks, unlockedFactSets } from "./curriculum";
import { FACT_SET_INFO, factByKey, factsIn, isMastered, reviewQueue, sprintFact, updateFact, type FactSet } from "./facts";
import { markPlayed } from "./profiles";

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

describe("blocks", () => {
  it.each([99, 999, 9999])("targets up to %i are never round and are always among the choices", (max) => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = blocksRound({ max, mode: "read" });
      expect(round.target).toBeGreaterThan(10);
      expect(round.target).toBeLessThanOrEqual(max);
      expect(round.target % 10).not.toBe(0);
      expect(round.choices).toContain(round.target);
      expect(new Set(round.choices).size).toBe(4);
    }
  });

  it("offers the swapped-digits mistake and the forgotten zero", () => {
    expect(blocksChoices(34, 99)).toContain(43);
    expect(blocksChoices(305, 999)).toContain(35);
    expect(placeDigits(1093, 4)).toEqual([3, 9, 0, 1]);
  });

  it("names the first place that is wrong, from the biggest", () => {
    expect(blocksHint(25, 47)).toBe("Il manque des dizaines : tu en as 2, il en faut 4.");
    expect(blocksHint(49, 47)).toBe("Trop d’unités : tu en as 9, il en faut 7.");
    expect(blocksHint(347, 247)).toBe("Trop de centaines : tu en as 3, il en faut 2.");
  });
});

describe("number line", () => {
  it.each([20, 100, 1000])("places targets inside an 11-tick window up to %i", (max) => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = lineRound({ mode: "place", max });
      const end = round.from + (LINE_TICKS - 1) * round.step;
      expect(round.target).toBeGreaterThan(round.from);
      expect(round.target).toBeLessThan(end);
      expect((round.target - round.from) % round.step).toBe(0);
      expect(end).toBeLessThanOrEqual(max);
    }
  });

  it("keeps every hop on a visible tick and the landing among the choices", () => {
    for (const config of [
      { mode: "hop" as const, max: 10, op: "+" as const, hop: 1 as const, maxHops: 5 },
      { mode: "hop" as const, max: 10, op: "−" as const, hop: 1 as const, maxHops: 5 },
      { mode: "hop" as const, max: 100, op: "±" as const, hop: 10 as const, maxHops: 4 },
    ]) {
      for (let run = 0; run < RUNS; run += 1) {
        const round = lineRound(config);
        const end = round.from + 10 * round.step;
        for (const value of [round.start, round.target]) {
          expect(value).toBeGreaterThanOrEqual(round.from);
          expect(value).toBeLessThanOrEqual(end);
          expect((value - round.from) % round.step).toBe(0);
        }
        expect(Math.abs(round.target - round.start)).toBe(round.hops * round.step);
        expect(round.choices).toContain(round.target);
      }
    }
  });
});

describe("bridge through ten", () => {
  it.each(["+", "−"] as const)("%s always crosses ten and splits the second number into to-ten and rest", (op) => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = bridgeRound({ op });
      expect(round.toTen).toBeGreaterThan(0);
      expect(round.rest).toBeGreaterThan(0);
      expect(round.toTen + round.rest).toBe(round.b);
      if (op === "+") {
        expect(round.a + round.toTen).toBe(10);
        expect(round.answer).toBe(10 + round.rest);
      } else {
        expect(round.a - round.toTen).toBe(10);
        expect(round.answer).toBe(10 - round.rest);
      }
    }
  });
});

describe("groups", () => {
  it("always uses a factor from the tables being learned and offers neighbouring products", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = groupsRound({ tables: [6, 7, 8, 9], maxSize: 9, layout: "array" });
      expect([round.groups, round.size].some((factor) => [6, 7, 8, 9].includes(factor))).toBe(true);
      expect(round.answer).toBe(round.groups * round.size);
      expect(round.choices).toContain(round.answer);
      expect(new Set(round.choices).size).toBe(4);
    }
  });

  it("records the products the review knows about", () => {
    expect(groupsFactKeys({ groups: 3, size: 7, thing: "🍎", answer: 21, choices: [] })).toEqual(["tables:3:7", "tables2-5:3:7"]);
    expect(groupsFactKeys({ groups: 7, size: 10, thing: "🍎", answer: 70, choices: [] })).toEqual([]);
  });
});

describe("share", () => {
  it("deals a total that splits into equal parts plus a remainder smaller than the number of friends", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = shareRound({ maxFriends: 5, maxEach: 6, remainder: true });
      expect(round.total).toBe(round.friends * round.each + round.left);
      expect(round.left).toBeLessThan(round.friends);
      expect(shareRound({ maxFriends: 4, maxEach: 5, remainder: false }).left).toBe(0);
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

  it("keeps grades in non-decreasing order within each chapter", () => {
    const order = { CP: 0, CE1: 1, CE2: 2 };
    for (const chapter of CHAPTERS) {
      for (let index = 1; index < chapter.steps.length; index += 1) {
        expect(order[chapter.steps[index].grade]).toBeGreaterThanOrEqual(order[chapter.steps[index - 1].grade]);
      }
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

describe("facts", () => {
  const sets = Object.keys(FACT_SET_INFO) as FactSet[];

  it.each(sets)("%s facts are correct, unique and offered with their answer in range", (set) => {
    const items = factsIn(set);
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((fact) => fact.key)).size).toBe(items.length);
    for (const fact of items) {
      expect(fact.answer).toBeGreaterThanOrEqual(0);
      expect(fact.answer).toBeLessThanOrEqual(fact.max);
      const [a, op, b] = fact.text.split(" ");
      const expected = fact.text.includes("?") ? 10 - Number(a) : op === "+" ? Number(a) + Number(b) : op === "−" ? Number(a) - Number(b) : Number(a) * Number(b);
      expect(fact.answer).toBe(expected);
      expect(factByKey(fact.key)).toBe(fact);
    }
  });

  it("covers the whole tables of 2 to 9 and every crossing of ten", () => {
    expect(factsIn("tables")).toHaveLength(64);
    expect(factsIn("add20").every((fact) => fact.answer > 10)).toBe(true);
    expect(factsIn("sub20").every((fact) => fact.a % 10 < fact.b && fact.answer < 10)).toBe(true);
  });

  it("moves a fact up only when it is recalled fast, and back to the start after a mistake", () => {
    let stat = updateFact(undefined, true, 2000, 100);
    expect(stat).toEqual({ box: 1, right: 1, wrong: 0, due: 101 });
    stat = updateFact(stat, true, 9000, 101);
    expect(stat.box).toBe(1);
    expect(stat.due).toBe(102);
    stat = updateFact(updateFact(stat, true, 1000, 102), true, 1000, 104);
    expect(isMastered(stat)).toBe(true);
    stat = updateFact(stat, false, 1000, 110);
    expect(stat).toMatchObject({ box: 0, due: 110 });
  });

  it("reviews due facts first, weakest first, and adds a few new ones", () => {
    const facts = {
      "tables:7:8": { box: 0, right: 0, wrong: 2, due: 10 },
      "tables:2:2": { box: 4, right: 4, wrong: 0, due: 99 },
    };
    const queue = reviewQueue(["tables"], facts, 10, 4, 3);
    expect(queue).toHaveLength(4);
    expect(queue.map((fact) => fact.key)).toContain("tables:7:8");
    expect(queue.map((fact) => fact.key)).not.toContain("tables:2:2");
  });

  it("sprints mostly ask facts that are not known yet and never repeat the same fact twice in a row", () => {
    const known = Object.fromEntries(factsIn("complements10").slice(1).map((fact) => [fact.key, { box: 5, right: 5, wrong: 0, due: 999 }]));
    let weak = 0;
    for (let run = 0; run < 400; run += 1) {
      const fact = sprintFact("complements10", known);
      if (fact.key === "complements10:0:10") weak += 1;
      expect(sprintFact("complements10", known, Math.random, fact.key).key).not.toBe(fact.key);
    }
    expect(weak).toBeGreaterThan(200);
  });

  it("joins the review once the step that teaches it is finished", () => {
    const first = factSetUnlocks()[0];
    expect(unlockedFactSets(() => false)).toEqual([]);
    expect(unlockedFactSets((id) => id === first.step.id)).toEqual([first.set]);
  });
});

describe("streak", () => {
  const base = { id: "a", name: "A", avatar: "🦊", points: 0, steps: {}, facts: {}, streak: 0, lastDay: 0 };
  it("grows on consecutive days and restarts after a gap", () => {
    const day1 = markPlayed(base, 50);
    expect(markPlayed(day1, 50).streak).toBe(1);
    expect(markPlayed(day1, 51).streak).toBe(2);
    expect(markPlayed(markPlayed(day1, 51), 53).streak).toBe(1);
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
