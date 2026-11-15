import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { speakFrench } from "../audio";
import { useKeyboardNumbers } from "./keyboard";

export type { RoundProps, RoundResult } from "./hooks";
/** The instruction, written large and read aloud on arrival. Children who cannot read yet tap the speaker. */
export function Prompt({ text, speech = text, children }: { text: string; speech?: string; children?: ReactNode }) {
  useEffect(() => {
    speakFrench(speech, 0.9);
  }, [speech]);
  return (
    <div className="m-prompt">
      <button className="m-speak" onClick={() => speakFrench(speech, 0.9)} aria-label="Écouter la consigne">
        <span aria-hidden="true">🔊</span>
      </button>
      <p className="instruction">{text}</p>
      {children}
    </div>
  );
}

/** A gentle, specific hint after a mistake. It stays until the child acts again. */
export function Hint({ message }: { message: string }) {
  return (
    <div className={`m-hint ${message ? "is-visible" : ""}`} role="status" aria-live="polite">
      {message && <><span aria-hidden="true">💡</span><span>{message}</span></>}
    </div>
  );
}

/** Large number buttons, also playable from the keyboard. */
export function NumberChoices({ values, onPick, wrong, solved, disabled = false }: {
  values: number[];
  onPick: (value: number) => void;
  wrong: number[];
  solved?: number | null;
  disabled?: boolean;
}) {
  const typed = useKeyboardNumbers(onPick, values, !disabled);
  return (
    <div className="m-choices-wrap">
      <div className={`m-choices ${values.length > 6 ? "is-many" : ""}`}>
        {values.map((value) => (
          <button
            key={value}
            className={`m-choice ${wrong.includes(value) ? "is-wrong" : ""} ${solved === value ? "is-right" : ""}`}
            onClick={() => onPick(value)}
            disabled={disabled || wrong.includes(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="m-typed" aria-live="polite">{typed ? <>⌨ <kbd>{typed}</kbd></> : " "}</p>
    </div>
  );
}

export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`m-stars is-${size}`} aria-label={`${value} étoile${value > 1 ? "s" : ""} sur 3`}>
      {[1, 2, 3].map((index) => <span key={index} className={index <= value ? "is-on" : ""} aria-hidden="true">★</span>)}
    </span>
  );
}

/**
 * A draining bar that turns quick answers into bonus points. When it empties nothing is lost:
 * it simply invites the child to take their time.
 */
export function Countdown({ seconds }: { seconds: number }) {
  const [ended, setEnded] = useState(false);
  return (
    <div className={`m-countdown ${ended ? "is-ended" : ""}`} role="timer" aria-label={ended ? "Prends ton temps" : `Bonus rapide : ${seconds} secondes`}>
      <span aria-hidden="true">{ended ? "🐢" : "⚡"}</span>
      <div className="m-countdown-track">
        <i style={{ "--countdown": `${seconds}s` } as CSSProperties} onAnimationEnd={() => setEnded(true)} />
      </div>
      <small>{ended ? "Prends ton temps" : "Bonus"}</small>
    </div>
  );
}

/**
 * A child's own timed scores as bars, with the record line: progress is compared with oneself only
 * (IES 2021: chart scores privately and aim to meet or beat the previous one).
 */
export function ChronoChart({ scores, highlightLast = false }: { scores: number[]; highlightLast?: boolean }) {
  const shown = scores.slice(-10);
  if (!shown.length) return null;
  const top = Math.max(10, ...shown);
  const best = Math.max(...shown.slice(0, highlightLast ? -1 : undefined), 0);
  return (
    <div className="chrono-chart" role="img" aria-label={`Mes derniers scores : ${shown.join(", ")}`}>
      {best > 0 && <i className="chrono-record-line" style={{ bottom: `${(best / top) * 100}%` }} aria-hidden="true" />}
      {shown.map((score, index) => {
        const last = highlightLast && index === shown.length - 1;
        return (
          <span key={index} className={`chrono-bar ${last ? "is-last" : ""} ${last && score >= best ? "is-record" : ""}`} style={{ height: `${Math.max(6, (score / top) * 100)}%` }}>
            <b>{score}</b>
          </span>
        );
      })}
    </div>
  );
}
