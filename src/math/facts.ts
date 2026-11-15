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

/**
 * The next fact in a timed sprint: mostly facts that still need work, sometimes a known one
 * so the minute stays encouraging.
 */
export function sprintFact(set: FactSet, facts: Record<string, FactStat>, rng: Rng = Math.random, avoid?: string): FactItem {
  const items = factsIn(set).filter((fact) => fact.key !== avoid);
  const weak = items.filter((fact) => !isMastered(facts[fact.key]));
  const source = weak.length && rng() < 0.75 ? weak : items;
  return source[Math.floor(rng() * source.length)];
}
