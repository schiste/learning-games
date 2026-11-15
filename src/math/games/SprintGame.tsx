import { useEffect, useRef, useState } from "react";
import { beep } from "../../audio";
import { useFactMemory } from "../factMemory";
import { factChoices, factStrategy, SET_STRATEGY, sprintFact, sprintSets, type FactItem, type FactSet } from "../facts";
import { now, type RoundProps } from "../hooks";
import { sprintPoints, sprintStars, type SprintConfig } from "../logic";
import { pick } from "../random";
import { ChronoChart, Hint, NumberChoices, Prompt } from "../ui";

const TICK_MS = 250;
/** First-try answers needed before the pool reaches the hardest facts of the set. */
const RAMP = 12;

/**
 * One timed minute of number facts, run the way the 2021 IES practice guide recommends:
 * only facts already taught, a strategy reminder first, one question at a time, immediate
 * correction with an efficient strategy, accuracy before speed (only first-try answers score),
 * and the goal of meeting or beating one's own previous score, charted privately.
 */
export default function SprintGame({ config, onSolved }: RoundProps<SprintConfig>) {
  const memory = useFactMemory();
  const [sets] = useState<FactSet[]>(() => sprintSets(config.facts, config.facts === "mixed" ? config.mix : undefined, memory.sets));
  const next = (avoid: string | undefined, progress: number) => sprintFact(pick(sets), memory.facts, Math.random, avoid, progress);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fact, setFact] = useState<FactItem>(() => next(undefined, 0));
  const [choices, setChoices] = useState(() => factChoices(fact));
  const shownAt = useRef(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const total = config.seconds * 1000;
  const finished = elapsed >= total;
  const record = Math.max(0, ...memory.history);

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
    if (!finished) return;
    const answered = score + fixed;
    const verdict = record === 0 ? "Premier score enregistré !" : score > record ? "Nouveau record !" : score === record ? "Record égalé !" : `Ton record reste ${record}. Tu y es presque !`;
    onSolved({
      mistakes,
      stars: sprintStars(score, record),
      points: sprintPoints(score) + fixed,
      score,
      summary: `${score} du premier coup${fixed ? `, ${fixed} corrigé${fixed > 1 ? "s" : ""}` : ""}${answered ? ` (${Math.round((100 * score) / answered)} % justes)` : ""}. ${verdict}`,
    });
    // Report once, when the minute ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Each fact's clock starts when it is shown (and when the minute starts).
  useEffect(() => {
    shownAt.current = now();
  }, [fact, started]);

  const pickAnswer = (value: number) => {
    if (finished || wrong.includes(value)) return;
    if (value === fact.answer) {
      const firstTry = wrong.length === 0;
      beep(880, 0.08);
      memory.record(fact.key, firstTry, now() - shownAt.current);
      const newScore = score + (firstTry ? 1 : 0);
      if (firstTry) setScore(newScore);
      else setFixed(fixed + 1);
      const following = next(fact.key, newScore / RAMP);
      setWrong([]);
      setFact(following);
      setChoices(factChoices(following));
    } else {
      beep(220, 0.1);
      setWrong([...wrong, value]);
      setMistakes(mistakes + 1);
    }
  };

  const strategy = config.facts === "mixed" ? "Astuce : regarde bien le signe, puis choisis ton astuce." : SET_STRATEGY[config.facts];

  if (!started) {
    return (
      <div className="m-game sprint-game">
        <span className="chrono-badge is-big" aria-hidden="true">⏱ {config.seconds} s</span>
        <Prompt text="Une minute : réponds juste, du premier coup." speech={`Une minute. Réponds juste, du premier coup. ${strategy}`} />
        <p className="sprint-strategy">💡 {strategy}</p>
        {memory.history.length > 0
          ? (
            <div className="sprint-goal">
              <ChronoChart scores={memory.history} />
              <p>🎯 Objectif : égaler ou battre <strong>{record}</strong></p>
            </div>
          )
          : <p className="m-note">Première fois : fais de ton mieux, ce sera ton score à battre.</p>}
        <button className="m-primary is-big" onClick={() => setStarted(true)}>Prêt ? C’est parti !</button>
      </div>
    );
  }

  const progress = Math.min(1, elapsed / total);
  const secondsLeft = Math.ceil((total - Math.min(elapsed, total)) / 1000);
  return (
    <div className="m-game sprint-game is-running" data-scene={JSON.stringify({ elapsed, score, fixed, fact: fact.text, set: fact.set })}>
      <div className="sprint-fill" style={{ transform: `scaleY(${progress})` }} data-progress={progress.toFixed(2)} aria-hidden="true" />
      <div className="sprint-status">
        <span>⏱ <strong>{secondsLeft}</strong> s</span>
        <span>✓ <strong>{score}</strong></span>
        {record > 0 && <span className={score >= record ? "is-reached" : ""}>🎯 {record}</span>}
      </div>
      <p className="sprint-fact" aria-live="polite">{fact.text.includes("?") ? fact.text : `${fact.text} = ?`}</p>
      <NumberChoices key={fact.key + score + fixed} values={choices} onPick={pickAnswer} wrong={wrong} disabled={finished} />
      <Hint message={wrong.length ? factStrategy(fact) : ""} />
    </div>
  );
}
