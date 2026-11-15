import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { fractionRound, fractionWords, type FractionConfig } from "../everyday";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { Hint, Prompt } from "../ui";

function Fraction({ numerator, denominator }: { numerator: number; denominator: number }) {
  return <span className="f-written" aria-label={fractionWords(numerator, denominator)}><b>{numerator}</b><i /><b>{denominator}</b></span>;
}

/**
 * Fractions as equal parts of a bar. Read: which fraction is coloured?
 * Colour: tap parts until the bar shows the fraction asked for.
 */
export default function FractionGame({ config, onSolved }: RoundProps<FractionConfig>) {
  const [round] = useState(() => fractionRound(config));
  const [colored, setColored] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const words = fractionWords(round.numerator, round.denominator);

  const succeed = (extra = 0) => {
    const solvedAt = now();
    setSolved(true);
    beep(880, 0.12);
    speakFrench(`Oui, ${words} !`, 0.95);
    later(() => onSolved({ mistakes: mistakes + extra, solvedAt }), 1200);
  };

  const choose = ([numerator, denominator]: [number, number]) => {
    const key = `${numerator}/${denominator}`;
    if (solved || wrong.includes(key)) return;
    if (numerator === round.numerator && denominator === round.denominator) {
      succeed(wrong.length);
      return;
    }
    setWrong([...wrong, key]);
    beep(220, 0.14);
    setHint(denominator !== round.denominator
      ? `Compte toutes les parts de la barre : il y en a ${round.denominator}. C’est le nombre du bas.`
      : `Compte les parts coloriées : c’est le nombre du haut.`);
  };

  const toggle = (part: number) => {
    if (solved || config.mode !== "color") return;
    setColored((before) => (before.includes(part) ? before.filter((item) => item !== part) : [...before, part]));
    setHint("");
    beep(colored.includes(part) ? 320 : 600, 0.05);
  };

  const check = () => {
    if (solved) return;
    if (colored.length === round.numerator) {
      succeed();
      return;
    }
    setMistakes(mistakes + 1);
    beep(220, 0.14);
    setHint(`Tu as colorié ${colored.length} part${colored.length > 1 ? "s" : ""}. Le nombre du haut, ${round.numerator}, dit combien il en faut.`);
  };

  const shown = config.mode === "read" ? Array.from({ length: round.numerator }, (_, index) => index) : colored;
  return (
    <div className="m-game fraction-game" data-scene={JSON.stringify({ numerator: round.numerator, denominator: round.denominator, colored: colored.length })}>
      {config.mode === "read"
        ? <Prompt text="Quelle part de la barre est coloriée ?" speech="Quelle part de la barre est coloriée ?" />
        : <Prompt text={`Colorie ${words} de la barre.`} speech={`Colorie ${words} de la barre.`}><Fraction numerator={round.numerator} denominator={round.denominator} /></Prompt>}
      <div className={`f-bar ${solved ? "is-solved" : ""}`} role="group" aria-label={`Barre partagée en ${round.denominator} parts égales`}>
        {Array.from({ length: round.denominator }, (_, part) => (
          <button key={part} className={`f-part ${shown.includes(part) ? "is-colored" : ""}`} onClick={() => toggle(part)} disabled={config.mode !== "color" || solved} aria-pressed={shown.includes(part)} aria-label={`part ${part + 1}`} />
        ))}
      </div>
      {config.mode === "read"
        ? (
          <div className="m-choices">
            {round.choices.map(([numerator, denominator]) => {
              const key = `${numerator}/${denominator}`;
              const right = solved && numerator === round.numerator && denominator === round.denominator;
              return (
                <button key={key} className={`m-choice f-choice ${wrong.includes(key) ? "is-wrong" : ""} ${right ? "is-right" : ""}`} onClick={() => choose([numerator, denominator])} disabled={wrong.includes(key)}>
                  <Fraction numerator={numerator} denominator={denominator} />
                </button>
              );
            })}
          </div>
        )
        : <button className="m-primary" onClick={check} disabled={solved}>C’est bon !</button>}
      <Hint message={hint} />
    </div>
  );
}
