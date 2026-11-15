import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { patternHint, patternRound, type PatternConfig } from "../puzzles";
import { Hint, Prompt } from "../ui";

/** Sequences: spot the repeating motif or the constant step, then choose what comes next. */
export default function PatternGame({ config, onSolved }: RoundProps<PatternConfig>) {
  const [round] = useState(() => patternRound(config));
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();

  const choose = (value: string) => {
    if (solved || wrong.includes(value)) return;
    if (value === round.answer) {
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench("Bravo !", 1);
      later(() => onSolved({ mistakes: wrong.length, solvedAt }), 1100);
    } else {
      setWrong([...wrong, value]);
      beep(220, 0.14);
    }
  };

  return (
    <div className="m-game pattern-game" data-scene={JSON.stringify({ answer: round.answer, rule: round.rule })}>
      <Prompt text="Qu’est-ce qui vient après ?" speech="Regarde bien la suite. Qu’est-ce qui vient après ?" />
      <ol className={`p-sequence is-${config.kind}`} aria-label={`Suite : ${round.items.join(", ")}, puis ?`}>
        {round.items.map((item, index) => <li key={index}>{item}</li>)}
        <li className={`p-gap ${solved ? "is-filled" : ""}`}>{solved ? round.answer : "?"}</li>
      </ol>
      <div className="m-choices">
        {round.choices.map((choice) => (
          <button key={choice} className={`m-choice p-choice ${wrong.includes(choice) ? "is-wrong" : ""} ${solved && choice === round.answer ? "is-right" : ""}`} onClick={() => choose(choice)} disabled={wrong.includes(choice)} aria-label={choice}>
            {choice}
          </button>
        ))}
      </div>
      <Hint message={wrong.length && !solved ? patternHint(round) : ""} />
    </div>
  );
}
