import { useEffect, useState } from "react";
import { beep } from "../../audio";
import { factFor, sprintPoints, sprintStars, type Fact, type SprintConfig } from "../logic";
import { NumberChoices, Prompt } from "../ui";
import { type RoundProps } from "../hooks";

const TICK_MS = 250;

/**
 * One timed minute of number facts. It starts only when the child is ready,
 * the background fills to make time visible, and a wrong answer simply stays greyed out
 * until the right one is found: speed grows, the pressure of failing does not.
 */
export default function SprintGame({ config, onSolved }: RoundProps<SprintConfig>) {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fact, setFact] = useState<Fact>(() => factFor(config.facts));
  const [wrong, setWrong] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const total = config.seconds * 1000;
  const finished = elapsed >= total;

  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setInterval(() => setElapsed((value) => value + TICK_MS), TICK_MS);
    // Lets automated checks jump through the minute without waiting for it.
    const advance = (event: Event) => setElapsed((value) => value + Number((event as CustomEvent<number>).detail));
    window.addEventListener("learning-games:advance-time", advance);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("learning-games:advance-time", advance);
    };
  }, [started, finished]);

  useEffect(() => {
    if (finished) onSolved({ mistakes, stars: sprintStars(score), points: sprintPoints(score), summary: `${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} en une minute !` });
    // Report once, when the minute ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const pick = (value: number) => {
    if (finished || wrong.includes(value)) return;
    if (value === fact.answer) {
      beep(880, 0.08);
      setScore(score + 1);
      setWrong([]);
      setFact(factFor(config.facts));
    } else {
      beep(220, 0.1);
      setWrong([...wrong, value]);
      setMistakes(mistakes + 1);
    }
  };

  const progress = Math.min(1, elapsed / total);
  const secondsLeft = Math.ceil((total - Math.min(elapsed, total)) / 1000);

  if (!started) {
    return (
      <div className="m-game sprint-game">
        <Prompt text={`Une minute pour répondre au plus de calculs possible.`} />
        <p className="sprint-example">{fact.text.replace("?", "…")}</p>
        <button className="m-primary is-big" onClick={() => setStarted(true)}>Prêt ? C’est parti !</button>
      </div>
    );
  }

  return (
    <div className="m-game sprint-game is-running" data-scene={JSON.stringify({ elapsed, score, fact: fact.text })}>
      <div className="sprint-fill" style={{ transform: `scaleY(${progress})` }} data-progress={progress.toFixed(2)} aria-hidden="true" />
      <div className="sprint-status">
        <span>⏱ <strong>{secondsLeft}</strong> s</span>
        <span>✓ <strong>{score}</strong></span>
      </div>
      <p className="sprint-fact" aria-live="polite">{fact.text.includes("?") ? fact.text : `${fact.text} = ?`}</p>
      <NumberChoices key={fact.text + score} values={fact.choices} onPick={pick} wrong={wrong} disabled={finished} />
    </div>
  );
}
