import type { FactStat } from "./profiles";
import { nearbyChoices, shuffle, type Rng } from "./random";

/**
 * Number facts children should eventually know by heart, and the spaced-repetition
 * rules that make sure they do. Every fact has a stable key so its memory can be stored.
 */

export type FactSet = "complements10" | "add10" | "sub10" | "doubles" | "add20" | "sub20" | "tens" | "tables2-5" | "tables";
export type FactItem = { key: string; set: FactSet; a: number; b: number; text: string; answer: number; max: number };

export const FACT_SET_INFO: Record<FactSet, { title: string; icon: string }> = {
  complements10: { title: "Faire 10", icon: "🔟" },
  add10: { title: "Additions jusqu’à 10", icon: "+" },
  sub10: { title: "Soustractions jusqu’à 10", icon: "−" },
  doubles: { title: "Les doubles", icon: "👯" },
  add20: { title: "Passer la dizaine (+)", icon: "↗" },
  sub20: { title: "Passer la dizaine (−)", icon: "↘" },
  tens: { title: "Additions de dizaines", icon: "10" },
  "tables2-5": { title: "Tables de 2 à 5", icon: "×" },
  tables: { title: "Tables de 2 à 9", icon: "✖" },
};

function item(set: FactSet, a: number, b: number, text: string, answer: number, max: number): FactItem {
  return { key: `${set}:${a}:${b}`, set, a, b, text, answer, max };
}

const cache = new Map<FactSet, FactItem[]>();

/** Every fact of a set, in reading order (a, then b). */
export function factsIn(set: FactSet): FactItem[] {
  const known = cache.get(set);
  if (known) return known;
  const items: FactItem[] = [];
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
  switch (set) {
    case "complements10":
      for (const a of range(0, 10)) items.push(item(set, a, 10 - a, `${a} + ? = 10`, 10 - a, 10));
      break;
    case "add10":
      for (const a of range(0, 10)) for (const b of range(0, 10 - a)) items.push(item(set, a, b, `${a} + ${b}`, a + b, 10));
      break;
    case "sub10":
      for (const a of range(1, 10)) for (const b of range(0, a)) items.push(item(set, a, b, `${a} − ${b}`, a - b, 10));
      break;
    case "doubles":
      for (const a of range(1, 10)) items.push(item(set, a, a, `${a} + ${a}`, a * 2, 20));
      break;
    case "add20":
      for (const a of range(2, 9)) for (const b of range(2, 9)) if (a + b > 10) items.push(item(set, a, b, `${a} + ${b}`, a + b, 20));
      break;
    case "sub20":
      for (const a of range(11, 18)) for (const b of range(2, 9)) if (a % 10 < b && a - b <= 9) items.push(item(set, a, b, `${a} − ${b}`, a - b, 20));
      break;
    case "tens":
      for (const a of range(1, 9)) for (const b of range(1, 10 - a)) items.push(item(set, a * 10, b * 10, `${a * 10} + ${b * 10}`, (a + b) * 10, 100));
      break;
    case "tables2-5":
      for (const a of range(2, 5)) for (const b of range(1, 10)) items.push(item(set, a, b, `${a} × ${b}`, a * b, 50));
      break;
    case "tables":
      for (const a of range(2, 9)) for (const b of range(2, 9)) items.push(item(set, a, b, `${a} × ${b}`, a * b, 81));
      break;
  }
  cache.set(set, items);
  return items;
}

export function factByKey(key: string): FactItem | null {
  const set = key.split(":")[0] as FactSet;
  if (!(set in FACT_SET_INFO)) return null;
  return factsIn(set).find((candidate) => candidate.key === key) ?? null;
}

export function factChoices(fact: FactItem, rng: Rng = Math.random): number[] {
  return nearbyChoices(fact.answer, 4, 0, fact.max, rng);
}

/* ---------- Spaced repetition (Leitner boxes) ---------- */

/** Days to wait before asking again, per box. Box 3 and above counts as "known by heart". */
export const INTERVALS = [0, 1, 2, 4, 7, 14] as const;
export const MASTERED_BOX = 3;
/** An answer faster than this counts as recalled rather than worked out. */
export const FAST_MS = 4000;

export function today(now: number = Date.now()): number {
  return Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000);
}

/**
 * New memory of a fact after one answer:
 * right and fast → one box up and a longer wait; right but slow → same box, again tomorrow;
 * any mistake → back to box 0, asked again today.
 */
export function updateFact(stat: FactStat | undefined, firstTry: boolean, ms: number, day: number): FactStat {
  const before = stat ?? { box: 0, right: 0, wrong: 0, due: day };
  if (!firstTry) return { box: 0, right: before.right, wrong: before.wrong + 1, due: day };
  const box = ms <= FAST_MS ? Math.min(INTERVALS.length - 1, before.box + 1) : before.box;
  return { box, right: before.right + 1, wrong: before.wrong, due: day + (ms <= FAST_MS ? INTERVALS[box] : 1) };
}

export function isMastered(stat: FactStat | undefined): boolean {
  return (stat?.box ?? 0) >= MASTERED_BOX;
}

export function masteryOf(set: FactSet, facts: Record<string, FactStat>): { mastered: number; seen: number; total: number } {
  const items = factsIn(set);
  return {
    mastered: items.filter((fact) => isMastered(facts[fact.key])).length,
    seen: items.filter((fact) => facts[fact.key]).length,
    total: items.length,
  };
}

/**
 * Today's review: facts that are due come first (weakest box first), then a few new facts,
 * then the weakest of the rest so a session is never empty. Shuffled so similar facts don't cluster.
 */
export function reviewQueue(sets: FactSet[], facts: Record<string, FactStat>, day: number, size = 10, newPerSession = 3, rng: Rng = Math.random): FactItem[] {
  const pool = sets.flatMap(factsIn);
  const seen = pool.filter((fact) => facts[fact.key]);
  const due = seen.filter((fact) => facts[fact.key].due <= day).sort((x, y) => facts[x.key].box - facts[y.key].box);
  const fresh = shuffle(pool.filter((fact) => !facts[fact.key]), rng).slice(0, newPerSession);
  const rest = shuffle(seen.filter((fact) => facts[fact.key].due > day), rng).sort((x, y) => facts[x.key].box - facts[y.key].box);
  const picked: FactItem[] = [];
  for (const fact of [...due, ...fresh, ...rest, ...shuffle(pool, rng)]) {
    if (picked.length >= size) break;
    if (!picked.includes(fact)) picked.push(fact);
  }
  return shuffle(picked, rng);
}

export function dueCount(sets: FactSet[], facts: Record<string, FactStat>, day: number): number {
  return sets.flatMap(factsIn).filter((fact) => facts[fact.key] && facts[fact.key].due <= day).length;
}

/* ---------- Difficulty and strategies (IES 2021, Rec. 6; Baroody's counting → reasoning → recall) ---------- */

/**
 * How hard a fact is to recall, from 0 (easiest). Follows the usual teaching order:
 * +0/+1 and doubles before other sums; ×1, ×2, ×10 then ×5, squares, ×3/×4, and last ×6–×9.
 */
export function factDifficulty(fact: FactItem): number {
  const { a, b } = fact;
  switch (fact.set) {
    case "complements10": return Math.min(Math.abs(a - 5), a, 10 - a) === 0 ? 0 : Math.min(a, 10 - a);
    case "add10": return a === b ? 1 : Math.min(a, b);
    case "sub10": return Math.min(b, a - b);
    case "doubles": return a <= 5 ? 0 : a === 10 ? 0 : a - 4;
    case "add20": return (a === b || Math.abs(a - b) === 1 ? 0 : 1) + Math.min(10 - Math.max(a, b), 4);
    case "sub20": return Math.min(b - (a - 10), a - 10) + (b === 9 ? 0 : 1);
    case "tens": return Math.min(a, b) / 10;
    case "tables2-5":
    case "tables": {
      const tier = (factor: number) => ([1, 2, 10].includes(factor) ? 0 : factor === 5 ? 1 : factor <= 4 ? 3 : 4);
      return Math.min(tier(a), tier(b)) + (a === b ? 0 : 1);
    }
  }
}

/** An efficient strategy for one fact, said after a mistake so the child corrects it by reasoning, not guessing. */
export function factStrategy(fact: FactItem): string {
  const { a, b } = fact;
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  switch (fact.set) {
    case "complements10":
      return `Pense au cadre de 10 : avec ${a} jetons, il reste ${10 - a} cases vides.`;
    case "doubles":
      return a > 5 ? `${a} + ${a} : 5 + 5 = 10, et encore ${a - 5} + ${a - 5} = ${2 * (a - 5)}. Ça fait ${2 * a}.` : `Un double : ${a} doigts et encore ${a} doigts, ça fait ${2 * a}.`;
    case "add10":
    case "add20":
      if (a === b) return `C’est un double : ${a} + ${a} = ${2 * a}.`;
      if (big - small === 1) return `Double plus un : ${small} + ${small} = ${2 * small}, puis + 1 = ${2 * small + 1}.`;
      if (a + b > 10) return `Fais 10 d’abord : ${big} + ${10 - big} = 10, puis 10 + ${small - (10 - big)} = ${a + b}.`;
      return `Pars du plus grand, ${big}, et avance de ${small} : ${Array.from({ length: small }, (_, index) => big + index + 1).join(", ")}.`;
    case "sub10":
      if (b === 0) return `Enlever 0, ça ne change rien : ${a} − 0 = ${a}.`;
      if (a === b) return `On enlève tout : ${a} − ${a} = 0.`;
      return b <= 3
        ? `Recule de ${b} depuis ${a} : ${Array.from({ length: b }, (_, index) => a - index - 1).join(", ")}.`
        : `Pense à l’addition : ${b} + ${a - b} = ${a}, donc ${a} − ${b} = ${a - b}.`;
    case "sub20":
      return `Redescends à 10 : ${a} − ${a - 10} = 10, puis 10 − ${b - (a - 10)} = ${a - b}.`;
    case "tens":
      return `${a / 10} dizaines + ${b / 10} dizaines = ${(a + b) / 10} dizaines, donc ${a + b}.`;
    case "tables2-5":
    case "tables": {
      // Use the factor that gives the easiest strategy; the other one is "how many times".
      const order = [10, 2, 5, 4, 9, 3, 6, 8, 7];
      const known = order.find((factor) => factor === a || factor === b)!;
      const times = known === a ? b : a;
      const tricks: Record<number, string> = {
        10: `× 10 : on met un zéro. ${times} × 10 = ${times * 10}.`,
        2: `× 2, c’est le double : ${times} + ${times} = ${times * 2}.`,
        5: `× 5, c’est la moitié de × 10 : ${times} × 10 = ${times * 10}, la moitié c’est ${times * 5}.`,
        4: `× 4, c’est le double du double : ${times} → ${times * 2} → ${times * 4}.`,
        9: `× 9, c’est × 10 moins une fois : ${times * 10} − ${times} = ${times * 9}.`,
        3: `× 3, c’est × 2 plus une fois : ${times * 2} + ${times} = ${times * 3}.`,
        6: `× 6, c’est × 5 plus une fois : ${times * 5} + ${times} = ${times * 6}.`,
        8: `× 8, c’est le double de × 4 : ${times * 4} + ${times * 4} = ${times * 8}.`,
        7: `× 7, c’est × 5 plus × 2 : ${times * 5} + ${times * 2} = ${times * 7}.`,
      };
      return a === b ? `${a} × ${a}, un carré à retenir : ${a * a}. ${tricks[known]}` : tricks[known];
    }
  }
}

/** The strategy to remind before a timed minute starts (IES: remind students of a strategy they know). */
export const SET_STRATEGY: Record<FactSet, string> = {
  complements10: "Astuce : pense au cadre de 10 et aux cases vides.",
  add10: "Astuce : pars toujours du plus grand nombre.",
  sub10: "Astuce : une soustraction, c’est une addition à trou.",
  doubles: "Astuce : 6 + 6, c’est 5 + 5 et encore 1 + 1.",
  add20: "Astuce : fais 10 d’abord. 8 + 5 = 8 + 2 + 3.",
  sub20: "Astuce : redescends à 10 d’abord. 13 − 5 = 13 − 3 − 2.",
  tens: "Astuce : compte les dizaines. 30 + 40, c’est 3 + 4 dizaines.",
  "tables2-5": "Astuce : × 2 c’est le double, × 4 le double du double, × 5 la moitié de × 10.",
  tables: "Astuce : × 9 = × 10 moins une fois. × 6 = × 5 plus une fois.",
};

/**
 * The next fact in a timed sprint. The pool starts with the easiest facts of the set and widens
 * as the child succeeds (`progress` from 0 to 1), as recommended for fluency work; within it,
 * facts not yet known are favoured, with a few known ones to keep the minute encouraging.
 */
export function sprintFact(set: FactSet, facts: Record<string, FactStat>, rng: Rng = Math.random, avoid?: string, progress = 1): FactItem {
  const sorted = [...factsIn(set)].sort((x, y) => factDifficulty(x) - factDifficulty(y));
  const size = Math.max(4, Math.ceil(sorted.length * (0.3 + 0.7 * Math.min(1, Math.max(0, progress)))));
  const items = sorted.slice(0, size).filter((fact) => fact.key !== avoid);
  const weak = items.filter((fact) => !isMastered(facts[fact.key]));
  const source = weak.length && rng() < 0.75 ? weak : items;
  return source[Math.floor(rng() * source.length)];
}

/** Sets a sprint draws from: its own set, or for a mixed sprint the listed sets the child has met (all of them if none yet). */
export function sprintSets(facts: FactSet | "mixed", mix: FactSet[] | undefined, unlocked: FactSet[]): FactSet[] {
  if (facts !== "mixed") return [facts];
  const met = (mix ?? []).filter((set) => unlocked.includes(set));
  return met.length ? met : mix ?? ["complements10"];
}
