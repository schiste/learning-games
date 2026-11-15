import { ALL_STEPS, type Step } from "./curriculum";

export type Stars = 1 | 2 | 3;
export type Progress = Record<string, Stars>;

const KEY = "dix-sur-dix:progress:v1";

/** Progress lives only in this browser. Storage can be missing or blocked, so every access is guarded. */
export function loadProgress(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Progress {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const result: Progress = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (value === 1 || value === 2 || value === 3) result[id] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export function saveProgress(progress: Progress, storage: Pick<Storage, "setItem"> | undefined = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Playing still works; only the remembered stars are lost.
  }
}

/** Keep the best result: replaying a step never takes stars away. */
export function recordStars(progress: Progress, stepId: string, stars: Stars): Progress {
  const best = Math.max(progress[stepId] ?? 0, stars) as Stars;
  return { ...progress, [stepId]: best };
}

/** Where "Continuer" leads: the first step not finished yet, or the first step once everything is done. */
export function suggestedStep(progress: Progress, steps: Step[] = ALL_STEPS): Step {
  return steps.find((step) => !progress[step.id]) ?? steps[0];
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
