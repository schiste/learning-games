import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { mysteryRound, type MysteryConfig } from "../puzzles";
import { Hint, Prompt } from "../ui";

/**
 * The mystery number: read the clues, cross out the numbers that cannot be it,
 * then switch to « C’est lui ! » and pick the only one left.
 */
export default function MysteryGame({ config, onSolved }: RoundProps<MysteryConfig>) {
  const [round] = useState(() => mysteryRound(config));
  const [crossed, setCrossed] = useState<number[]>([]);
  const [crossing, setCrossing] = useState(true);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();

  const tap = (value: number) => {
    if (solved) return;
    if (crossing) {
      setCrossed(crossed.includes(value) ? crossed.filter((item) => item !== value) : [...crossed, value]);
      beep(crossed.includes(value) ? 520 : 360, 0.05);
      return;
    }
    if (value === round.target) {
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench(`Oui, c’était ${value} !`, 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1300);
    } else {
      setWrong(value);
      setMistakes(mistakes + 1);
      beep(220, 0.14);
    }
  };

  return (
    <div className="m-game mystery-game" data-scene={JSON.stringify({ target: round.target, clues: round.clues })}>
      <Prompt text="Qui suis-je ?" speech={`Qui suis-je ? ${round.clues.join(" ")}`} />
      <ul className="y-clues">
        {round.clues.map((clue) => <li key={clue}>🔎 {clue}</li>)}
      </ul>
      <div className="y-mode" role="radiogroup" aria-label="Mode">
        <button role="radio" aria-checked={crossing} className={crossing ? "is-active" : ""} onClick={() => setCrossing(true)}>✖ Barrer</button>
        <button role="radio" aria-checked={!crossing} className={!crossing ? "is-active" : ""} onClick={() => setCrossing(false)}>👉 C’est lui !</button>
      </div>
      <div className="y-grid">
        {round.candidates.map((value) => (
          <button
            key={value}
            className={`y-number ${crossed.includes(value) ? "is-crossed" : ""} ${wrong === value && !solved ? "is-wrong" : ""} ${solved && value === round.target ? "is-right" : ""}`}
            onClick={() => tap(value)}
            aria-pressed={crossed.includes(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <Hint message={wrong !== null && !solved ? `${wrong} ne va pas : relis chaque indice et barre les nombres qui ne vont pas.` : ""} />
    </div>
  );
}
