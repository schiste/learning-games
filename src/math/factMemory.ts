import { createContext, useContext } from "react";
import type { FactStat } from "./profiles";

/** The current player's memory of number facts, shared with every engine that asks facts. */
export type FactMemory = {
  facts: Record<string, FactStat>;
  /** Called once per fact answered: was it right the first time, and how long did it take? */
  record: (key: string, firstTry: boolean, ms: number) => void;
};

export const FactMemoryContext = createContext<FactMemory>({ facts: {}, record: () => undefined });

export function useFactMemory(): FactMemory {
  return useContext(FactMemoryContext);
}
