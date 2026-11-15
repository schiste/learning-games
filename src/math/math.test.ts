import { describe, expect, it } from "vitest";
import { parseRoute } from "../route";
import { ALL_STEPS, CHAPTERS, findStep, nextStep } from "./curriculum";
import {
  blocksChoices,
  blocksHint,
  blocksRound,
  bondsHint,
  bridgeRound,
  estimateError,
  estimateMistakes,
  estimateRound,
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
import { chronoReady, chronoSteps, factSetUnlocks, unlockedFactSets } from "./curriculum";
import { FACT_SET_INFO, factByKey, factDifficulty, factsIn, factStrategy, isMastered, reviewQueue, SET_STRATEGY, sprintFact, sprintSets, updateFact, type FactSet } from "./facts";
import { chronoRecord, markPlayed, recordChrono, type Profile } from "./profiles";
import { clockRound, coinsRound, fewestCoins, formatTime, fractionRound, fractionWords, handAngles, problemRound, SCHEMA } from "./everyday";
import { countSolutions, mysteryRound, patternRound, sudokuConflict, sudokuRound } from "./puzzles";

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

describe("number-line estimation", () => {
  it.each([10, 20, 100, 1000])("targets up to %i stay away from the ends", (max) => {
    for (let run = 0; run < RUNS; run += 1) {
      const { target } = estimateRound({ max });
      expect(target).toBeGreaterThanOrEqual(1);
      expect(target).toBeLessThanOrEqual(max - 1);
    }
  });

  it("scores closeness, never a plain wrong answer", () => {
    expect(estimateError(48, 50, 100)).toBeCloseTo(0.02);
    expect(estimateMistakes(estimateError(48, 50, 100))).toBe(0);
    expect(estimateMistakes(estimateError(420, 500, 1000))).toBe(1);
    expect(estimateMistakes(estimateError(2, 9, 10))).toBe(2);
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

describe("sequences", () => {
  it("continue a repeating motif and offer the next shape", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = patternRound({ kind: "shapes", units: ["AB", "AAB", "ABC", "AABB"] });
      const unit = round.rule.length;
      const full = [...round.items, round.answer];
      full.forEach((item, index) => { if (index >= unit) expect(item).toBe(full[index - unit]); });
      expect(round.choices).toContain(round.answer);
      expect(new Set(round.choices).size).toBe(3);
    }
  });

  it("follow a constant rule and stay positive", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = patternRound({ kind: "numbers", rules: ["+5", "-3", "x2", "-10"] });
      const terms = [...round.items, round.answer].map(Number);
      expect(terms.every((value) => value >= 0)).toBe(true);
      const step = Number(round.rule.slice(1));
      for (let index = 1; index < terms.length; index += 1) {
        const expected = round.rule[0] === "+" ? terms[index - 1] + step : round.rule[0] === "-" ? terms[index - 1] - step : terms[index - 1] * step;
        expect(terms[index]).toBe(expected);
      }
      expect(round.choices).toContain(round.answer);
    }
  });
});

describe("mystery number", () => {
  it.each([[1, 20], [10, 99]])("between %i and %i, each clue rules out something and the last one leaves only the target", (min, max) => {
    for (let run = 0; run < 200; run += 1) {
      const round = mysteryRound({ min, max });
      expect(round.candidates).toContain(round.target);
      expect(round.candidates.every((value) => value >= min && value <= max)).toBe(true);
      expect(round.steps.length).toBeGreaterThanOrEqual(2);
      let remaining = round.candidates;
      for (const step of round.steps) {
        expect(step.excluded.length).toBeGreaterThan(0);
        expect(step.excluded).not.toContain(round.target);
        expect(step.excluded.every((value) => remaining.includes(value))).toBe(true);
        expect(step.tip.length).toBeGreaterThan(10);
        remaining = remaining.filter((value) => !step.excluded.includes(value));
      }
      expect(remaining).toEqual([round.target]);
    }
  });

  it("never gives a one-digit answer away with its units digit or digit sum", () => {
    let singleDigit = 0;
    for (let run = 0; run < 1500; run += 1) {
      const round = mysteryRound({ min: 1, max: 20 });
      if (round.target >= 10) continue;
      singleDigit += 1;
      for (const step of round.steps) expect(step.text).not.toMatch(/unités|somme/);
    }
    expect(singleDigit).toBeGreaterThan(100);
  });
});

describe("mini-sudoku", () => {
  it("builds valid grids whose puzzle has exactly one solution", () => {
    for (let run = 0; run < 200; run += 1) {
      const round = sudokuRound({ symbols: "digits", blanks: 11 });
      round.solution.forEach((value, cell) => expect(sudokuConflict(round.solution, cell, value)).toBeNull());
      expect(countSolutions(round.puzzle)).toBe(1);
      round.puzzle.forEach((value, cell) => { if (value !== null) expect(value).toBe(round.solution[cell]); });
      expect(round.puzzle.filter((value) => value === null).length).toBeGreaterThanOrEqual(8);
    }
  });

  it("names the rule a move breaks", () => {
    const grid = [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    expect(sudokuConflict(grid, 3, 0)).toBe("row");
    expect(sudokuConflict(grid, 12, 0)).toBe("column");
    expect(sudokuConflict(grid, 5, 0)).toBe("box");
    expect(sudokuConflict(grid, 10, 0)).toBeNull();
  });
});

describe("clock", () => {
  it.each([[[0]], [[0, 30]], [[0, 15, 30, 45]], [[5]]] as const)("with minutes %j, the time is among four distinct choices", (minutes) => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = clockRound({ minutes: [...minutes] });
      const labels = round.choices.map(formatTime);
      expect(new Set(labels).size).toBe(4);
      expect(labels).toContain(formatTime(round.time));
      expect(round.time.hour).toBeGreaterThanOrEqual(1);
      expect(round.time.hour).toBeLessThanOrEqual(12);
    }
  });

  it("moves the hour hand between the hours", () => {
    expect(handAngles({ hour: 3, minute: 0 })).toEqual({ hour: 90, minute: 0 });
    expect(handAngles({ hour: 3, minute: 30 })).toEqual({ hour: 105, minute: 180 });
  });
});

describe("money", () => {
  it("prices stay in range and the fewest-coins way adds up", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = coinsRound({ max: 50, values: [1, 2, 5, 10, 20] });
      expect(round.price).toBeLessThanOrEqual(50);
      expect(fewestCoins(round.price, [1, 2, 5, 10, 20]).reduce((sum, value) => sum + value, 0)).toBe(round.price);
    }
    expect(fewestCoins(38, [1, 2, 5, 10, 20])).toEqual([20, 10, 5, 2, 1]);
  });
});

describe("word problems", () => {
  it("each structure has the right operation, a non-negative whole answer, and offers it", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = problemRound({ kinds: ["join", "separate", "compare", "groups", "share"], max: 100 });
      const expected = { "+": round.a + round.b, "−": round.a - round.b, "×": round.a * round.b, "÷": round.a / round.b }[round.op];
      expect(round.answer).toBe(expected);
      expect(Number.isInteger(round.answer) && round.answer >= 0).toBe(true);
      expect(round.choices).toContain(round.answer);
      expect(round.story).toMatch(/\d/);
    }
  });
});

describe("fractions", () => {
  it("are proper, offered among distinct proper choices, and named in words", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = fractionRound({ denominators: [3, 4, 5, 6, 8], mode: "read", unitOnly: false });
      expect(round.numerator).toBeLessThan(round.denominator);
      const keys = round.choices.map(([n, d]) => `${n}/${d}`);
      expect(new Set(keys).size).toBe(4);
      expect(keys).toContain(`${round.numerator}/${round.denominator}`);
      expect(round.choices.every(([n, d]) => n > 0 && n < d)).toBe(true);
    }
    expect(fractionWords(1, 2)).toBe("un demi");
    expect(fractionWords(3, 4)).toBe("trois quarts");
    expect(fractionWords(2, 3)).toBe("deux tiers");
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

describe("fluency practice (IES 2021, recommendation 6)", () => {
  const sets = Object.keys(FACT_SET_INFO) as FactSet[];

  it.each(sets)("every %s fact has a strategy that leads to its answer, and the set has a reminder", (set) => {
    expect(SET_STRATEGY[set]).toMatch(/Astuce/);
    for (const fact of factsIn(set)) {
      const hint = factStrategy(fact);
      expect(hint.length).toBeGreaterThan(10);
      expect(hint).toContain(String(fact.answer));
    }
  });

  it("ranks the classic easy facts first: +1, doubles, ×2, ×5 and ×10 before ×7", () => {
    const fact = (key: string) => factByKey(key)!;
    expect(factDifficulty(fact("add10:5:1"))).toBeLessThan(factDifficulty(fact("add10:4:5")));
    expect(factDifficulty(fact("tables:2:8"))).toBeLessThan(factDifficulty(fact("tables:7:8")));
    expect(factDifficulty(fact("tables:5:7"))).toBeLessThan(factDifficulty(fact("tables:6:7")));
    expect(factDifficulty(fact("add20:9:4"))).toBeLessThan(factDifficulty(fact("add20:6:8")));
  });

  it("starts a sprint with easier facts and widens to the whole set as the child succeeds", () => {
    const average = (progress: number) => {
      let total = 0;
      for (let run = 0; run < 600; run += 1) total += factDifficulty(sprintFact("tables", {}, Math.random, undefined, progress));
      return total / 600;
    };
    expect(average(0)).toBeLessThan(average(1) - 0.5);
    const hardest = factsIn("tables").reduce((worst, fact) => (factDifficulty(fact) > factDifficulty(worst) ? fact : worst));
    let reached = false;
    for (let run = 0; run < 2000 && !reached; run += 1) reached = sprintFact("tables", {}, Math.random, undefined, 1).key === hardest.key;
    expect(reached).toBe(true);
  });

  it("mixes only the listed sets the child has met, or all listed ones at first", () => {
    expect(sprintSets("doubles", undefined, [])).toEqual(["doubles"]);
    expect(sprintSets("mixed", ["add10", "sub10", "tables"], ["add10", "tables", "doubles"])).toEqual(["add10", "tables"]);
    expect(sprintSets("mixed", ["add20", "sub20"], [])).toEqual(["add20", "sub20"]);
  });

  it("gives full stars for meeting or beating one's own record", () => {
    expect(sprintStars(9, 9)).toBe(3);
    expect(sprintStars(10, 9)).toBe(3);
    expect(sprintStars(8, 9)).toBe(2);
    expect(sprintStars(4, 3)).toBe(1);
    expect(sprintStars(15)).toBe(3);
  });

  it("keeps a private, bounded history and its record", () => {
    let player: Profile = { id: "a", name: "A", avatar: "🦊", points: 0, steps: {}, facts: {}, chrono: {}, streak: 0, lastDay: 0 };
    for (let score = 1; score <= 25; score += 1) player = recordChrono(player, "sprint-10", score % 7);
    expect(player.chrono["sprint-10"]).toHaveLength(20);
    expect(chronoRecord(player, "sprint-10")).toBe(6);
    expect(chronoRecord(player, "never")).toBe(0);
  });

  it("advises a chrono only after the steps that teach it", () => {
    const sprint = chronoSteps().find(({ step }) => step.id === "sprint-20")!.step;
    expect(chronoReady(sprint, () => false).ready).toBe(false);
    expect(chronoReady(sprint, () => false).missing.map((step) => step.id)).toContain("bridge-add");
    expect(chronoReady(sprint, () => true).ready).toBe(true);
    expect(chronoSteps().every(({ step }) => step.engine === "sprint")).toBe(true);
  });
});

describe("worked examples", () => {
  const withExamples = ALL_STEPS.filter((step) => step.example);

  it("open the strategy steps, stay short, and never precede a timed minute", () => {
    expect(withExamples.length).toBeGreaterThanOrEqual(12);
    for (const step of withExamples) {
      expect(step.engine).not.toBe("sprint");
      expect(step.example!.length).toBeGreaterThanOrEqual(2);
      expect(step.example!.length).toBeLessThanOrEqual(5);
    }
  });

  it("contain only correct calculations", () => {
    const pattern = /(\d+) ([+−×]) (\d+) = (\d+)/g;
    let checked = 0;
    for (const step of withExamples) {
      for (const line of step.example!) {
        for (const [, a, op, b, result] of line.matchAll(pattern)) {
          const expected = op === "+" ? +a + +b : op === "−" ? +a - +b : +a * +b;
          expect(`${step.id}: ${a} ${op} ${b} = ${result}`).toBe(`${step.id}: ${a} ${op} ${b} = ${expected}`);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(15);
  });
});

describe("schema-based word problems", () => {
  it("name every structure", () => {
    for (const kind of ["join", "separate", "compare", "groups", "share"] as const) expect(SCHEMA[kind].sentence).toMatch(/\./);
  });

  it("can hide a number that is not needed, never equal to the data or the answer", () => {
    for (let run = 0; run < RUNS; run += 1) {
      const round = problemRound({ kinds: ["join", "separate", "compare", "groups", "share"], max: 100, distractor: true });
      expect(round.extra).not.toBeNull();
      expect([round.a, round.b, round.answer]).not.toContain(round.extra);
      expect(round.story).toContain(String(round.extra));
      expect(round.story).not.toMatch(/\.\./);
    }
    expect(problemRound({ kinds: ["join"], max: 20 }).extra).toBeNull();
  });
});

describe("streak", () => {
  const base = { id: "a", name: "A", avatar: "🦊", points: 0, steps: {}, facts: {}, chrono: {}, streak: 0, lastDay: 0 };
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
    expect(parseRoute("#nombres")).toEqual({ topic: "maths", stepId: null });
    expect(parseRoute("#cycle-2")).toEqual({ topic: "maths", stepId: null });
  });
});
