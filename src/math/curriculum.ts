import type { FactSet } from "./facts";
import type { BlocksConfig, BondsConfig, BridgeConfig, BuildConfig, CompareConfig, CountConfig, FlashConfig, GroupsConfig, LineConfig, ShareConfig, SprintConfig } from "./logic";

export type Grade = "CP" | "CE1" | "CE2";
export type ChapterColor = "sky" | "sun" | "berry" | "leaf" | "plum" | "teal";

/** Each step plays one engine with one configuration. The union keeps config and engine in sync. */
export type StepGame =
  | { engine: "count"; config: CountConfig }
  | { engine: "flash"; config: FlashConfig }
  | { engine: "build"; config: BuildConfig }
  | { engine: "compare"; config: CompareConfig }
  | { engine: "bonds"; config: BondsConfig }
  | { engine: "sprint"; config: SprintConfig }
  | { engine: "blocks"; config: BlocksConfig }
  | { engine: "line"; config: LineConfig }
  | { engine: "bridge"; config: BridgeConfig }
  | { engine: "groups"; config: GroupsConfig }
  | { engine: "share"; config: ShareConfig };

export type EngineId = StepGame["engine"];

export type Step = StepGame & {
  id: string;
  title: string;
  /** What the child is learning, in words a six-year-old understands. Spoken aloud on the map. */
  goal: string;
  grade: Grade;
  /** How many rounds make up the step. Timed steps are a single round. */
  rounds: number;
  /** Facts this step introduces; once it is finished they join the daily review. Sprints teach their own set. */
  teaches?: FactSet;
};

export type Chapter = { id: string; title: string; icon: string; color: ChapterColor; steps: Step[] };

export const CHAPTERS: Chapter[] = [
  {
    id: "count",
    title: "Compter",
    icon: "🍎",
    color: "sky",
    steps: [
      { id: "count-5", title: "Jusqu’à 5", goal: "Je touche chaque objet et je compte.", grade: "CP", rounds: 5, engine: "count", config: { min: 1, max: 5 } },
      { id: "dice", title: "Le dé", goal: "Je reconnais les points du dé sans compter.", grade: "CP", rounds: 5, engine: "flash", config: { max: 6, pattern: "dice", showMs: 2200 } },
      { id: "count-10", title: "Jusqu’à 10", goal: "Je compte jusqu’à 10 sans en oublier.", grade: "CP", rounds: 5, engine: "count", config: { min: 4, max: 10 } },
      { id: "basket", title: "Le panier", goal: "Je mets juste le bon nombre dans le panier.", grade: "CP", rounds: 5, engine: "build", config: { min: 3, max: 10 } },
      { id: "more", title: "Le plus", goal: "Je trouve où il y en a le plus.", grade: "CP", rounds: 5, engine: "compare", config: { min: 2, max: 10, mode: "objects", aligned: true } },
      { id: "count-20", title: "Jusqu’à 20", goal: "Je compte de grandes collections.", grade: "CP", rounds: 5, engine: "count", config: { min: 10, max: 20 } },
    ],
  },
  {
    id: "ten",
    title: "Faire 10",
    icon: "🔟",
    color: "sun",
    steps: [
      { id: "frame", title: "Le cadre", goal: "Je vois 5 et 10 d’un coup d’œil.", grade: "CP", rounds: 5, engine: "flash", config: { max: 10, pattern: "frame", showMs: 2500 } },
      { id: "house-5", title: "La maison du 5", goal: "Je trouve ce qui manque pour faire 5.", grade: "CP", rounds: 5, engine: "bonds", config: { totals: [5], frame: true } },
      { id: "houses", title: "Les maisons", goal: "Je casse un nombre en deux morceaux.", grade: "CP", rounds: 6, engine: "bonds", config: { totals: [6, 7, 8, 9], frame: true } },
      { id: "make-10", title: "Faire 10", goal: "Je trouve ce qui manque pour faire 10.", grade: "CP", rounds: 6, teaches: "complements10", engine: "bonds", config: { totals: [10], frame: true } },
      { id: "make-10-head", title: "10 dans la tête", goal: "Je fais 10 sans regarder le cadre.", grade: "CP", rounds: 6, engine: "bonds", config: { totals: [10], frame: false } },
      { id: "sprint-10", title: "Chrono du 10", goal: "Une minute pour faire 10 le plus de fois possible.", grade: "CP", rounds: 1, engine: "sprint", config: { facts: "complements10", seconds: 60 } },
    ],
  },
  {
    id: "tens",
    title: "Dizaines et unités",
    icon: "🧱",
    color: "berry",
    steps: [
      { id: "pv-build", title: "Je construis", goal: "10 cubes font une barre de dix. Je construis le nombre.", grade: "CP", rounds: 5, engine: "blocks", config: { max: 99, mode: "build" } },
      { id: "pv-read", title: "Je lis", goal: "Je compte les dizaines puis les unités.", grade: "CP", rounds: 5, engine: "blocks", config: { max: 99, mode: "read" } },
      { id: "line-20", title: "La règle", goal: "Je place les nombres jusqu’à 20.", grade: "CP", rounds: 5, engine: "line", config: { mode: "place", max: 20 } },
      { id: "line-100", title: "La grande règle", goal: "Je place les nombres jusqu’à 100.", grade: "CP", rounds: 5, engine: "line", config: { mode: "place", max: 100 } },
      { id: "compare-100", title: "Le plus grand", goal: "Je compare d’abord les dizaines.", grade: "CP", rounds: 6, engine: "compare", config: { min: 10, max: 99, mode: "numbers", aligned: false } },
    ],
  },
  {
    id: "addsub",
    title: "Ajouter et enlever",
    icon: "🐸",
    color: "leaf",
    steps: [
      { id: "hop-add", title: "La grenouille avance", goal: "Ajouter, c’est avancer sur la ligne.", grade: "CP", rounds: 5, engine: "line", config: { mode: "hop", max: 10, op: "+", hop: 1, maxHops: 5 } },
      { id: "hop-sub", title: "La grenouille recule", goal: "Enlever, c’est reculer sur la ligne.", grade: "CP", rounds: 5, engine: "line", config: { mode: "hop", max: 10, op: "−", hop: 1, maxHops: 5 } },
      { id: "sprint-add10", title: "Chrono +", goal: "Une minute d’additions jusqu’à 10.", grade: "CP", rounds: 1, engine: "sprint", config: { facts: "add10", seconds: 60 } },
      { id: "sprint-doubles", title: "Les doubles", goal: "Je connais les doubles par cœur.", grade: "CP", rounds: 1, engine: "sprint", config: { facts: "doubles", seconds: 60 } },
      { id: "sprint-sub10", title: "Chrono −", goal: "Une minute de soustractions jusqu’à 10.", grade: "CP", rounds: 1, engine: "sprint", config: { facts: "sub10", seconds: 60 } },
      { id: "bridge-add", title: "Passer la dizaine", goal: "Je complète la dizaine, puis j’ajoute le reste.", grade: "CE1", rounds: 5, engine: "bridge", config: { op: "+" }, teaches: "add20" },
      { id: "bridge-sub", title: "Redescendre à 10", goal: "Je reviens à 10, puis j’enlève le reste.", grade: "CE1", rounds: 5, engine: "bridge", config: { op: "−" }, teaches: "sub20" },
      { id: "hop-tens", title: "Les bonds de 10", goal: "Ajouter 10, c’est changer les dizaines.", grade: "CE1", rounds: 5, engine: "line", config: { mode: "hop", max: 100, op: "±", hop: 10, maxHops: 4 } },
      { id: "sprint-20", title: "Chrono jusqu’à 20", goal: "Une minute pour passer la dizaine.", grade: "CE1", rounds: 1, engine: "sprint", config: { facts: "add20", seconds: 60 } },
      { id: "sprint-tens", title: "Chrono des dizaines", goal: "Une minute d’additions de dizaines.", grade: "CE1", rounds: 1, engine: "sprint", config: { facts: "tens", seconds: 60 } },
    ],
  },
  {
    id: "big",
    title: "Les grands nombres",
    icon: "🏰",
    color: "plum",
    steps: [
      { id: "pv-build-1000", title: "Les centaines", goal: "10 barres de dix font une plaque de cent.", grade: "CE1", rounds: 5, engine: "blocks", config: { max: 999, mode: "build" } },
      { id: "pv-read-1000", title: "Lire les centaines", goal: "Je lis les nombres jusqu’à 999, même avec un zéro.", grade: "CE1", rounds: 5, engine: "blocks", config: { max: 999, mode: "read" } },
      { id: "line-1000", title: "La règle des centaines", goal: "Je place les nombres jusqu’à 1 000.", grade: "CE1", rounds: 5, engine: "line", config: { mode: "place", max: 1000 } },
      { id: "compare-1000", title: "Le plus grand jusqu’à 1 000", goal: "Je compare les centaines d’abord.", grade: "CE1", rounds: 6, engine: "compare", config: { min: 100, max: 999, mode: "numbers", aligned: false } },
      { id: "pv-build-10000", title: "Les milliers", goal: "10 plaques de cent font un millier.", grade: "CE2", rounds: 5, engine: "blocks", config: { max: 9999, mode: "build" } },
      { id: "pv-read-10000", title: "Lire les milliers", goal: "Je lis les grands nombres, comme 1 093.", grade: "CE2", rounds: 5, engine: "blocks", config: { max: 9999, mode: "read" } },
      { id: "line-10000", title: "La règle des milliers", goal: "Je place les nombres jusqu’à 10 000.", grade: "CE2", rounds: 5, engine: "line", config: { mode: "place", max: 10000 } },
    ],
  },
  {
    id: "times",
    title: "Multiplier et partager",
    icon: "✖️",
    color: "teal",
    steps: [
      { id: "bags-2-5", title: "Les sacs", goal: "Des groupes égaux : je compte de 2 en 2, de 5 en 5…", grade: "CE1", rounds: 5, engine: "groups", config: { tables: [2, 5, 10], maxSize: 5, layout: "bags" } },
      { id: "array-2-5", title: "Les rectangles", goal: "3 lignes de 4, c’est 3 fois 4. Et si je tourne ?", grade: "CE1", rounds: 5, engine: "groups", config: { tables: [2, 3, 4, 5], maxSize: 6, layout: "array" } },
      { id: "share-fair", title: "Le partage juste", goal: "Je partage pour que chacun ait la même chose.", grade: "CE1", rounds: 4, engine: "share", config: { maxFriends: 4, maxEach: 5, remainder: false } },
      { id: "sprint-tables-2-5", title: "Chrono des tables", goal: "Une minute de tables de 2, 3, 4 et 5.", grade: "CE1", rounds: 1, engine: "sprint", config: { facts: "tables2-5", seconds: 60 } },
      { id: "array-6-9", title: "Les grands rectangles", goal: "Les tables de 6, 7, 8 et 9.", grade: "CE2", rounds: 6, engine: "groups", config: { tables: [6, 7, 8, 9], maxSize: 9, layout: "array" } },
      { id: "share-left", title: "Le partage et le reste", goal: "Parfois, il en reste : c’est le reste.", grade: "CE2", rounds: 4, engine: "share", config: { maxFriends: 5, maxEach: 6, remainder: true } },
      { id: "sprint-tables", title: "Chrono de toutes les tables", goal: "Une minute de tables de 2 à 9.", grade: "CE2", rounds: 1, engine: "sprint", config: { facts: "tables", seconds: 60 } },
    ],
  },
];

export const ALL_STEPS: Step[] = CHAPTERS.flatMap((chapter) => chapter.steps);

export function findStep(id: string): { step: Step; chapter: Chapter } | null {
  for (const chapter of CHAPTERS) {
    const step = chapter.steps.find((candidate) => candidate.id === id);
    if (step) return { step, chapter };
  }
  return null;
}

/** The step that follows `id` along the whole adventure, across chapters. */
export function nextStep(id: string): Step | null {
  const index = ALL_STEPS.findIndex((step) => step.id === id);
  return index >= 0 ? ALL_STEPS[index + 1] ?? null : null;
}

/**
 * Countdown length for one round, in seconds: long enough to count every object or
 * fill a frame calmly, shorter for recall. Timed sprints have their own minute.
 */
export function roundSeconds(step: Step): number | null {
  switch (step.engine) {
    case "count": return Math.round(8 + step.config.max * 1.2);
    case "flash": return 10;
    case "build": return Math.round(8 + step.config.max * 1.2);
    case "compare": return step.config.mode === "objects" ? 10 : 8;
    case "bonds": return step.config.frame ? 15 : 8;
    case "sprint": return null;
    case "blocks": return step.config.mode === "build" ? 12 + 4 * String(step.config.max).length : 12;
    case "line": return step.config.mode === "place" ? 12 : 16;
    case "bridge": return 20;
    case "groups": return step.config.layout === "bags" ? 16 : 18;
    case "share": return 40;
  }
}

/** Which fact set each step adds to the review once finished. */
export function stepTeaches(step: Step): FactSet | null {
  return step.engine === "sprint" ? step.config.facts : step.teaches ?? null;
}

/** Fact sets the player has met, in adventure order: these are what the daily review keeps fresh. */
export function unlockedFactSets(finished: (stepId: string) => boolean): FactSet[] {
  const sets: FactSet[] = [];
  for (const step of ALL_STEPS) {
    const set = stepTeaches(step);
    if (set && finished(step.id) && !sets.includes(set)) sets.push(set);
  }
  return sets;
}

/** Every fact set the adventure teaches, with the step that unlocks it first. */
export function factSetUnlocks(): Array<{ set: FactSet; step: Step }> {
  const seen = new Map<FactSet, Step>();
  for (const step of ALL_STEPS) {
    const set = stepTeaches(step);
    if (set && !seen.has(set)) seen.set(set, step);
  }
  return [...seen].map(([set, step]) => ({ set, step }));
}
