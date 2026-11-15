import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { mysteryRound, type MysteryConfig } from "../puzzles";
import { Hint, Prompt } from "../ui";

/**
 * The mystery number, one clue at a time: the child crosses out every number the current clue
 * rules out; only then does the next clue appear. Crossing a number that still fits is refused
 * with the pattern to look for, so each clue teaches its pattern (even numbers, tables, digits…).
 * When a single number is left, the child taps it.
 */
export default function MysteryGame({ config, onSolved }: RoundProps<MysteryConfig>) {
  const [round] = useState(() => mysteryRound(config));
  const [stepIndex, setStepIndex] = useState(0);
  const [crossed, setCrossed] = useState<number[]>([]);
  // Mirrors `crossed` synchronously so taps arriving in the same frame all count.
  const latest = useRef<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const finalPhase = stepIndex >= round.steps.length;
  const step = round.steps[stepIndex];
  const left = step ? step.excluded.filter((value) => !crossed.includes(value)).length : 0;

  const tap = (value: number) => {
    if (solved || latest.current.includes(value)) return;
    if (finalPhase) {
      if (value !== round.target) return;
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench(`Oui, c’était ${value} !`, 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1300);
      return;
    }
    if (!step.excluded.includes(value)) {
      setWrong(value);
      setMistakes(mistakes + 1);
      beep(220, 0.14);
      return;
    }
    const next = [...latest.current, value];
    latest.current = next;
    setCrossed(next);
    setWrong(null);
    beep(420, 0.05);
    if (step.excluded.every((excluded) => next.includes(excluded))) {
      const following = round.steps[stepIndex + 1];
      beep(760, 0.1);
      speakFrench(following ? `Bravo ! Indice suivant : ${following.text}` : "Bravo ! Il ne reste plus qu’un nombre. Touche-le !", 0.95);
      setStepIndex(stepIndex + 1);
    }
  };

  return (
    <div className="m-game mystery-game" data-scene={JSON.stringify({ target: round.target, step: stepIndex, steps: round.steps.length, excluded: step?.excluded ?? [], crossed })}>
      <Prompt text="Qui suis-je ?" speech={`Qui suis-je ? Premier indice : ${round.steps[0].text} Barre tous les nombres qui ne vont pas.`} />
      <ol className="y-clues">
        {round.steps.slice(0, stepIndex + 1).map((clue, index) => (
          <li key={clue.text} className={index === stepIndex ? "is-current" : "is-done"}>
            <span aria-hidden="true">{index < stepIndex ? "✅" : "🔎"}</span> {clue.text}
          </li>
        ))}
      </ol>
      <p className="m-note" aria-live="polite">
        {finalPhase
          ? solved ? " " : "Il ne reste qu’un nombre : touche-le !"
          : `Barre les nombres qui ne vont pas avec cet indice — encore ${left}.`}
      </p>
      <div className="y-grid">
        {round.candidates.map((value) => (
          <button
            key={value}
            className={`y-number ${crossed.includes(value) ? "is-crossed" : ""} ${wrong === value && !solved ? "is-wrong" : ""} ${solved && value === round.target ? "is-right" : ""} ${finalPhase && !solved && value === round.target ? "is-last" : ""}`}
            onClick={() => tap(value)}
            disabled={crossed.includes(value)}
            aria-label={crossed.includes(value) ? `${value}, barré` : String(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <Hint message={wrong !== null && step ? `${wrong} va avec « ${step.text} » : ne le barre pas. ${step.tip}` : ""} />
    </div>
  );
}
