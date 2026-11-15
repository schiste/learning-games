import { nearbyChoices, pick, randomInt, shuffle, type Rng } from "./random";

/* ---------- Clock: read the time on a clock face ---------- */

export type ClockConfig = { minutes: Array<0 | 15 | 30 | 45 | 5> };
export type Time = { hour: number; minute: number };
export type ClockRound = { time: Time; choices: Time[] };

export function formatTime({ hour, minute }: Time): string {
  return `${hour} h ${String(minute).padStart(2, "0")}`;
}

/** Minute steps allowed: 0 (o'clock), 30, 15/45 (quarters), or 5 for any multiple of 5. */
export function clockRound({ minutes }: ClockConfig, rng: Rng = Math.random): ClockRound {
  const allowed = minutes.includes(5) ? Array.from({ length: 12 }, (_, index) => index * 5) : [...new Set(minutes)];
  const time = { hour: randomInt(1, 12, rng), minute: pick(allowed, rng) };
  // The classic confusions: hands swapped, the hour before, the other half of the dial.
  const swapped = { hour: time.minute === 0 ? 12 : (time.minute / 5) || 12, minute: (time.hour % 12) * 5 };
  const candidates = [
    swapped,
    { hour: time.hour === 1 ? 12 : time.hour - 1, minute: time.minute },
    { hour: time.hour, minute: (time.minute + 30) % 60 },
    { hour: time.hour === 12 ? 1 : time.hour + 1, minute: time.minute },
  ].filter((candidate) => allowed.includes(candidate.minute) || minutes.includes(5));
  const unique = new Map<string, Time>([[formatTime(time), time]]);
  for (const candidate of shuffle(candidates, rng)) {
    if (unique.size >= 4) break;
    unique.set(formatTime(candidate), candidate);
  }
  for (let hour = 1; unique.size < 4; hour += 1) unique.set(formatTime({ hour, minute: time.minute }), { hour, minute: time.minute });
  return { time, choices: shuffle([...unique.values()], rng) };
}

/** Angles of the hands, in degrees from 12 o'clock. The hour hand moves between the hours. */
export function handAngles({ hour, minute }: Time): { hour: number; minute: number } {
  return { hour: ((hour % 12) + minute / 60) * 30, minute: minute * 6 };
}

/* ---------- Coins: pay an exact amount ---------- */

export type CoinsConfig = { max: number; values: number[] };
export type CoinsRound = { price: number; item: string };

export const SHOP = ["🧸", "📚", "🪁", "🍦", "🎨", "⚽", "🧃", "🖍️", "🎲", "🪀"] as const;

export function coinsRound({ max }: CoinsConfig, rng: Rng = Math.random): CoinsRound {
  return { price: randomInt(Math.min(3, max), max, rng), item: pick(SHOP, rng) };
}

/** Fewest coins/notes for an amount: the "smart" way to pay, shown after success. */
export function fewestCoins(amount: number, values: number[]): number[] {
  const result: number[] = [];
  let rest = amount;
  for (const value of [...values].sort((a, b) => b - a)) {
    while (rest >= value) {
      result.push(value);
      rest -= value;
    }
  }
  return result;
}

/* ---------- Word problems: understand the story, choose the operation, then compute ---------- */

export type ProblemKind = "join" | "separate" | "compare" | "groups" | "share";
export type ProblemConfig = { kinds: ProblemKind[]; max: number };
export type ProblemRound = { kind: ProblemKind; story: string; question: string; a: number; b: number; op: "+" | "−" | "×" | "÷"; answer: number; choices: number[] };

const PEOPLE = [
  { name: "Léo", pronoun: "il" }, { name: "Inès", pronoun: "elle" }, { name: "Sami", pronoun: "il" }, { name: "Jade", pronoun: "elle" },
  { name: "Noé", pronoun: "il" }, { name: "Lina", pronoun: "elle" }, { name: "Tom", pronoun: "il" }, { name: "Mia", pronoun: "elle" },
] as const;

/** Short stories of the classic structures: add, take away, compare, equal groups and sharing. */
export function problemRound({ kinds, max }: ProblemConfig, rng: Rng = Math.random): ProblemRound {
  const kind = pick(kinds, rng);
  const [first, second] = shuffle(PEOPLE, rng);
  const [p1, p2] = [first.name, second.name];
  const Pronoun = first.pronoun === "il" ? "Il" : "Elle";
  const choices = (answer: number) => nearbyChoices(answer, 4, 0, Math.max(answer + 20, max), rng);
  switch (kind) {
    case "join": {
      const a = randomInt(2, Math.floor(max / 2), rng);
      const b = randomInt(2, max - a, rng);
      return { kind, story: `${p1} a ${a} billes. ${p2} lui en donne ${b}.`, question: `Combien de billes a ${p1} maintenant ?`, a, b, op: "+", answer: a + b, choices: choices(a + b) };
    }
    case "separate": {
      const a = randomInt(6, max, rng);
      const b = randomInt(1, a - 1, rng);
      return { kind, story: `${p1} a ${a} bonbons. ${Pronoun} en mange ${b}.`, question: "Combien en reste-t-il ?", a, b, op: "−", answer: a - b, choices: choices(a - b) };
    }
    case "compare": {
      const b = randomInt(2, Math.floor(max / 2), rng);
      const a = b + randomInt(1, Math.floor(max / 2), rng);
      return { kind, story: `${p1} a ${a} cartes. ${p2} a ${b} cartes.`, question: `Combien de cartes ${p1} a-t-${first.pronoun} de plus que ${p2} ?`, a, b, op: "−", answer: a - b, choices: choices(a - b) };
    }
    case "groups": {
      const a = randomInt(2, 6, rng);
      const b = randomInt(2, Math.min(10, Math.floor(max / a)) || 2, rng);
      return { kind, story: `Il y a ${a} boîtes de ${b} crayons.`, question: "Combien de crayons en tout ?", a, b, op: "×", answer: a * b, choices: choices(a * b) };
    }
    case "share": {
      const b = randomInt(2, 5, rng);
      const answer = randomInt(2, Math.max(2, Math.floor(max / b)), rng);
      const a = answer * b;
      return { kind, story: `${p1} partage ${a} images entre ${b} amis, autant pour chacun.`, question: "Combien d’images pour chaque ami ?", a, b, op: "÷", answer, choices: choices(answer) };
    }
  }
}

export function problemOps(kinds: ProblemKind[]): Array<ProblemRound["op"]> {
  const ops: Array<ProblemRound["op"]> = ["+", "−"];
  if (kinds.includes("groups")) ops.push("×");
  if (kinds.includes("share")) ops.push("÷");
  return ops;
}

/* ---------- Fractions: equal parts of a whole ---------- */

export type FractionConfig = { denominators: number[]; mode: "read" | "color"; unitOnly: boolean };
export type FractionRound = { numerator: number; denominator: number; choices: Array<[number, number]> };

export function fractionRound({ denominators, unitOnly }: FractionConfig, rng: Rng = Math.random): FractionRound {
  const denominator = pick(denominators, rng);
  const numerator = unitOnly ? 1 : randomInt(1, denominator - 1, rng);
  // Swapped terms (4/1 for 1/4) and a neighbouring denominator are the usual confusions.
  const candidates: Array<[number, number]> = [
    [numerator, denominator + 1],
    [numerator, Math.max(2, denominator - 1)],
    [Math.min(denominator, numerator + 1), denominator],
    [denominator - numerator, denominator],
  ];
  const unique = new Map<string, [number, number]>([[`${numerator}/${denominator}`, [numerator, denominator]]]);
  for (const candidate of shuffle(candidates, rng)) {
    if (unique.size >= 4) break;
    if (candidate[0] > 0 && candidate[0] < candidate[1]) unique.set(`${candidate[0]}/${candidate[1]}`, candidate);
  }
  for (let extra = 2; unique.size < 4; extra += 1) unique.set(`1/${denominator + extra}`, [1, denominator + extra]);
  return { numerator, denominator, choices: shuffle([...unique.values()], rng) };
}

export function fractionWords(numerator: number, denominator: number): string {
  const names: Record<number, string> = { 2: "demi", 3: "tiers", 4: "quart", 5: "cinquième", 6: "sixième", 8: "huitième", 10: "dixième" };
  const name = names[denominator] ?? `${denominator}e`;
  const plural = numerator > 1 && !name.endsWith("s") ? `${name}s` : name;
  const count = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"][numerator] ?? String(numerator);
  return `${count} ${plural}`;
}
