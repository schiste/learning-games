import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { buildHint, buildRound, type BuildConfig } from "../logic";
import { Hint, Prompt } from "../ui";
import { now, useTimeouts, type RoundProps } from "../hooks";

/**
 * Making a collection of a given size. The basket is laid out in rows of five,
 * so the child can check the amount by its shape, not only by counting.
 */
export default function BuildGame({ config, onSolved }: RoundProps<BuildConfig>) {
  const [round] = useState(() => buildRound(config));
  const [placed, setPlaced] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState("");
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const slots = round.target > 10 || config.max > 10 ? 20 : 10;

  // The ref sees every tap immediately, so quick successive taps each count.
  const latest = useRef(0);
  const change = (delta: 1 | -1) => {
    if (solved) return;
    const next = Math.min(slots, Math.max(0, latest.current + delta));
    if (next === latest.current) return;
    latest.current = next;
    setPlaced(next);
    setHint("");
    beep(delta > 0 ? 520 + next * 20 : 300, 0.06);
    if (delta > 0) speakFrench(String(next), 1);
  };

  const check = () => {
    if (solved) return;
    if (placed === round.target) {
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench(`Bravo, ${round.target} !`, 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1100);
    } else {
      setMistakes(mistakes + 1);
      setHint(buildHint(placed, round.target));
      beep(220, 0.14);
    }
  };

  return (
    <div className="m-game build-game" data-scene={JSON.stringify({ target: round.target, placed })}>
      <Prompt text={`Mets ${round.target} ${round.thing} dans le panier.`} speech={`Mets ${round.target} dans le panier.`}>
        <strong className="m-target">{round.target}</strong>
      </Prompt>
      <div className={`m-basket ${solved ? "is-solved" : ""}`} aria-label={`Panier : ${placed}`}>
        {Array.from({ length: slots }, (_, index) =>
          index < placed
            ? <button key={index} className="m-basket-slot is-full" onClick={() => change(-1)} aria-label="enlever"><span aria-hidden="true">{round.thing}</span></button>
            : <span key={index} className="m-basket-slot" />,
        )}
      </div>
      <div className="build-controls">
        <button className="m-round-button" onClick={() => change(-1)} disabled={placed === 0 || solved} aria-label="Enlever un objet">−</button>
        <button className="m-pile" onClick={() => change(1)} disabled={placed === slots || solved} aria-label="Ajouter un objet">
          <span aria-hidden="true">{round.thing}{round.thing}{round.thing}</span>
          <small>touche pour ajouter</small>
        </button>
        <button className="m-round-button" onClick={() => change(1)} disabled={placed === slots || solved} aria-label="Ajouter un objet">+</button>
      </div>
      <button className="m-primary" onClick={check} disabled={solved}>C’est bon !</button>
      <Hint message={hint} />
    </div>
  );
}
