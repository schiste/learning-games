import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { compareAnswer, compareRound, type CompareConfig } from "../logic";
import { Hint, Prompt } from "../ui";
import { now, useTimeouts, type RoundProps } from "../hooks";

type Side = "left" | "right";

/** First place (from the left) where two numbers differ, for a precise hint on written numbers. */
function compareHint(left: number, right: number): string {
  const a = String(left);
  const b = String(right);
  if (a.length !== b.length) return "Le nombre qui a le plus de chiffres est le plus grand.";
  const names = ["unités", "dizaines", "centaines", "milliers"];
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return `Compare d’abord les ${names[a.length - 1 - index]} : ${a[index]} et ${b[index]}.`;
  }
  return "";
}

export default function CompareGame({ config, onSolved }: RoundProps<CompareConfig>) {
  const [round] = useState(() => compareRound(config));
  const [wrong, setWrong] = useState<Side | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState<Side | null>(null);
  const later = useTimeouts();
  const answer = compareAnswer(round);
  const word = round.ask === "more" ? "le plus" : "le moins";
  const question = config.mode === "numbers"
    ? `Touche le nombre ${round.ask === "more" ? "le plus grand" : "le plus petit"}.`
    : `Où y en a-t-il ${word} ?`;

  const choose = (side: Side) => {
    if (solved) return;
    if (side === answer) {
      const solvedAt = now();
      setSolved(side);
      beep(880, 0.12);
      speakFrench("Oui !", 1);
      later(() => onSolved({ mistakes, solvedAt }), 1000);
    } else {
      setWrong(side);
      setMistakes(mistakes + 1);
      beep(220, 0.14);
    }
  };

  const hint = wrong && !solved
    ? config.mode === "numbers"
      ? compareHint(round.left, round.right)
      : config.aligned ? "Regarde les deux lignes : laquelle va le plus loin ?" : "Compte chaque groupe, puis compare."
    : "";

  const card = (side: Side, value: number) => (
    <button
      key={side}
      className={`compare-card ${wrong === side && !solved ? "is-wrong" : ""} ${solved === side ? "is-right" : ""}`}
      onClick={() => choose(side)}
      aria-label={config.mode === "numbers" ? String(value) : `groupe de ${value}`}
    >
      {config.mode === "numbers"
        ? <strong className="compare-number">{value}</strong>
        : <span className={`compare-row ${config.aligned ? "is-aligned" : ""}`} aria-hidden="true">
            {Array.from({ length: value }, (_, index) => <span key={index}>{round.thing}</span>)}
          </span>}
      {solved && config.mode === "objects" && <b className="compare-count">{value}</b>}
    </button>
  );

  return (
    <div className="m-game compare-game" data-scene={JSON.stringify(round)}>
      <Prompt text={question} />
      <div className={`compare-cards ${config.aligned && config.mode === "objects" ? "is-stacked" : ""}`}>
        {card("left", round.left)}
        {card("right", round.right)}
      </div>
      <Hint message={hint} />
    </div>
  );
}
