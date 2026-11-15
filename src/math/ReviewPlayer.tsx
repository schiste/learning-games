import { useEffect, useRef, useState } from "react";
import { beep, fanfare, speakFrench } from "../audio";
import { useFactMemory } from "./factMemory";
import { factChoices, FAST_MS, type FactItem } from "./facts";
import { now, useTimeouts } from "./hooks";
import { roundPoints } from "./logic";
import { Countdown, Hint, NumberChoices } from "./ui";

const SECONDS = 8;

/**
 * « Révision du jour »: a short daily session over the facts this player has already met,
 * weakest and due facts first. Each answer moves the fact in its Leitner box.
 */
export default function ReviewPlayer({ queue, onFinish, onBack }: {
  queue: FactItem[];
  onFinish: (points: number, firstTry: number) => void;
  onBack: () => void;
}) {
  const memory = useFactMemory();
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState(() => (queue[0] ? factChoices(queue[0]) : []));
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [done, setDone] = useState(false);
  const shownAt = useRef(0);
  const later = useTimeouts();
  const fact = queue[index];

  useEffect(() => {
    shownAt.current = now();
  }, [index]);

  useEffect(() => {
    if (!done) return;
    fanfare();
    speakFrench(`Révision terminée ! ${firstTry} du premier coup.`, 0.95);
  }, [done, firstTry]);

  if (!fact) {
    return <div className="m-done"><h2>Rien à réviser pour l’instant</h2><button className="m-primary" onClick={onBack}>Retour à la carte</button></div>;
  }

  const pick = (value: number) => {
    if (solved !== null || wrong.includes(value)) return;
    const ms = now() - shownAt.current;
    if (value !== fact.answer) {
      setWrong([...wrong, value]);
      beep(220, 0.14);
      return;
    }
    const clean = wrong.length === 0;
    memory.record(fact.key, clean, ms);
    const gain = roundPoints(wrong.length, 1 - ms / (SECONDS * 1000));
    const totalPoints = points + gain;
    const totalFirstTry = firstTry + (clean ? 1 : 0);
    setSolved(value);
    setPoints(totalPoints);
    setFirstTry(totalFirstTry);
    beep(880, 0.1);
    later(() => {
      if (index + 1 >= queue.length) {
        setDone(true);
        onFinish(totalPoints, totalFirstTry);
        return;
      }
      setIndex(index + 1);
      setChoices(factChoices(queue[index + 1]));
      setWrong([]);
      setSolved(null);
    }, ms <= FAST_MS ? 600 : 900);
  };

  if (done) {
    return (
      <div className="m-done" aria-live="polite">
        <span className="m-done-icon" aria-hidden="true">🧠</span>
        <h2>Révision terminée !</h2>
        <p>{firstTry} sur {queue.length} du premier coup · 🏆 {points} points</p>
        <p className="m-note">Les calculs difficiles reviendront demain, les faciles plus tard.</p>
        <div className="m-done-actions"><button className="m-primary is-big" onClick={onBack}>Retour à la carte</button></div>
      </div>
    );
  }

  return (
    <div className="m-round review-round" key={fact.key} data-scene={JSON.stringify({ fact: fact.text, answer: fact.answer, index })}>
      <Countdown seconds={SECONDS} />
      <p className="sprint-fact">{fact.text.includes("?") ? fact.text : `${fact.text} = ?`}</p>
      <NumberChoices values={choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={wrong.length && solved === null ? "Prends ton temps. Tu peux t’aider de tes doigts ou d’un dessin." : ""} />
    </div>
  );
}
