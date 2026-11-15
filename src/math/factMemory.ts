import { createContext, useContext } from "react";
import type { FactSet } from "./facts";
import type { FactStat } from "./profiles";

/** The current player's memory of number facts, shared with every engine that asks facts. */
export type FactMemory = {
  facts: Record<string, FactStat>;
  /** Fact sets the child has already met, used by mixed sprints. */
  sets: FactSet[];
  /** Previous scores of the timed minute being played, oldest first (private to this child). */
  history: number[];
  /** Called once per fact answered: was it right the first time, and how long did it take? */
  record: (key: string, firstTry: boolean, ms: number) => void;
};

export const FactMemoryContext = createContext<FactMemory>({ facts: {}, sets: [], history: [], record: () => undefined });

export function useFactMemory(): FactMemory {
  return useContext(FactMemoryContext);
}
