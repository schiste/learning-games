import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { estimateError, estimateMistakes, estimateRound, type EstimateConfig } from "../logic";
import { Prompt } from "../ui";

/**
 * Number-line estimation: only the two ends are written, the child taps where the number goes.
 * The answer is then shown on the line, with how close the tap was. Linear estimation on such
 * lines tracks — and with practice improves — children's sense of number size (Siegler & Booth).
 */
export default function EstimateGame({ config, onSolved }: RoundProps<EstimateConfig>) {
  const [round] = useState(() => estimateRound(config));
  const [cursor, setCursor] = useState(0.5);
  const [answer, setAnswer] = useState<number | null>(null);
  // The touch area is wider than the line itself, so taps at or just past either end still count.
  const track = useRef<HTMLDivElement>(null);
  const later = useTimeouts();
  const max = config.max;

  const confirm = (fraction: number) => {
    if (answer !== null) return;
    const position = Math.round(fraction * max);
    const error = estimateError(position, round.target, max);
    const mistakes = estimateMistakes(error);
    const solvedAt = now();
    setAnswer(position);
    beep(mistakes === 0 ? 880 : mistakes === 1 ? 660 : 440, 0.12);
    speakFrench(mistakes === 0 ? "Bravo, tout près !" : mistakes === 1 ? "Pas loin !" : `${round.target} était ici.`, 0.95);
    later(() => onSolved({ mistakes, solvedAt }), 2200);
  };

  const tap = (event: PointerEvent<HTMLDivElement>) => {
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    const fraction = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    setCursor(fraction);
    confirm(fraction);
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (answer !== null) return;
    const step = event.shiftKey ? 0.1 : 0.01;
    if (event.key === "ArrowLeft") setCursor((value) => Math.max(0, value - step));
    else if (event.key === "ArrowRight") setCursor((value) => Math.min(1, value + step));
    else if (event.key === "Enter" || event.key === " ") confirm(cursor);
    else return;
    event.preventDefault();
  };

  const error = answer === null ? 0 : estimateError(answer, round.target, max);
  const verdict = answer === null ? "" : estimateMistakes(error) === 0 ? "Tout près !" : estimateMistakes(error) === 1 ? "Pas loin !" : "Regarde où il était.";
  return (
    <div className="m-game estimate-game" data-scene={JSON.stringify({ target: round.target, max, answer })}>
      <Prompt text={`Où se trouve ${round.target} ?`} speech={`Où se trouve ${round.target}, entre 0 et ${max} ?`}>
        <strong className="m-target">{round.target}</strong>
      </Prompt>
      <div
        className={`est-line ${answer !== null ? "is-answered" : ""}`}
        role="slider"
        tabIndex={0}
        aria-label={`Ligne de 0 à ${max}. Flèches pour déplacer, Entrée pour valider.`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(cursor * max)}
        onPointerDown={tap}
        onKeyDown={key}
      >
        <div className="est-inner" ref={track}>
          <span className="est-end is-start">0</span>
          <span className="est-end is-end">{max.toLocaleString("fr-FR")}</span>
          <i className="est-track" aria-hidden="true" />
          {answer === null && <i className="est-cursor" style={{ left: `${cursor * 100}%` }} aria-hidden="true" />}
          {answer !== null && (
            <>
              <span className="est-mark is-child" style={{ left: `${(answer / max) * 100}%` }}><b>toi</b></span>
              <span className="est-mark is-target" style={{ left: `${(round.target / max) * 100}%` }}><b>{round.target}</b></span>
            </>
          )}
        </div>
      </div>
      <p className="m-note" aria-live="polite">{answer === null ? "Touche la ligne là où tu penses." : `${verdict} Tu as montré ${answer.toLocaleString("fr-FR")}.`}</p>
    </div>
  );
}
