import { useEffect, useRef, useState } from "react";
import { beep, speakFrench } from "../audio";

/** Every engine receives its configuration and reports how the round went. */
export type RoundResult = {
  mistakes: number;
  /** performance.now() at the moment of the right answer, before the little celebration. */
  solvedAt?: number;
  /** Timed engines score themselves; round-based engines leave these to the step player. */
  stars?: 1 | 2 | 3;
  points?: number;
  /** Raw score of a timed minute, kept in the child's chrono history. */
  score?: number;
  summary?: string;
};
export type RoundProps<C> = { config: C; onSolved: (result: RoundResult) => void };

/** Clock for answer timing; only ever called from event handlers and effects. */
export function now(): number {
  return performance.now();
}

export function useTimeouts() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return (callback: () => void, delay: number) => {
    timers.current.push(window.setTimeout(callback, delay));
  };
}

/**
 * The common "pick the right number" loop: a wrong pick is greyed out with a hint,
 * a right pick celebrates briefly and ends the round. Returns the handler and state.
 */
export function useAnswer(answer: number, onSolved: (result: RoundResult) => void, hintFor: (picked: number) => string) {
  const later = useTimeouts();
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState<number | null>(null);

  const pick = (value: number) => {
    if (solved !== null || wrong.includes(value)) return;
    if (value === answer) {
      const solvedAt = now();
      setSolved(value);
      beep(880, 0.12);
      speakFrench(`Oui, ${value} !`, 0.95);
      later(() => onSolved({ mistakes: wrong.length, solvedAt }), 1100);
    } else {
      setWrong([...wrong, value]);
      beep(220, 0.14);
    }
  };

  const lastWrong = wrong.at(-1);
  return { pick, wrong, solved, hint: solved === null && lastWrong !== undefined ? hintFor(lastWrong) : "" };
}
