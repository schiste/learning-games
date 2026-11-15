import type { FactSet } from "./facts";
import type { BondsConfig, BuildConfig, CompareConfig, CountConfig, FlashConfig, SprintConfig } from "./logic";

export type Grade = "CP" | "CE1" | "CE2";
export type ChapterColor = "sky" | "sun" | "berry" | "leaf" | "plum" | "teal";

/** Each step plays one engine with one configuration. The union keeps config and engine in sync. */
export type StepGame =
  | { engine: "count"; config: CountConfig }
  | { engine: "flash"; config: FlashConfig }
  | { engine: "build"; config: BuildConfig }
  | { engine: "compare"; config: CompareConfig }
  | { engine: "bonds"; config: BondsConfig }
  | { engine: "sprint"; config: SprintConfig };

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
