import { useEffect, useState } from "react";
import { fanfare, speakFrench } from "../audio";
import { nextStep, type Chapter, type Step } from "./curriculum";
import { roundStars } from "./logic";
import type { Stars as StarCount } from "./progress";
import { Stars } from "./ui";
import { type RoundResult } from "./hooks";
import BondsGame from "./games/BondsGame";
import BuildGame from "./games/BuildGame";
import CompareGame from "./games/CompareGame";
import CountGame from "./games/CountGame";
import FlashGame from "./games/FlashGame";
import SprintGame from "./games/SprintGame";

/** Renders one round of a step. The switch keeps each engine paired with its own config type. */
function Round({ step, onSolved }: { step: Step; onSolved: (result: RoundResult) => void }) {
  switch (step.engine) {
    case "count": return <CountGame config={step.config} onSolved={onSolved} />;
    case "flash": return <FlashGame config={step.config} onSolved={onSolved} />;
    case "build": return <BuildGame config={step.config} onSolved={onSolved} />;
    case "compare": return <CompareGame config={step.config} onSolved={onSolved} />;
    case "bonds": return <BondsGame config={step.config} onSolved={onSolved} />;
    case "sprint": return <SprintGame config={step.config} onSolved={onSolved} />;
  }
}

export default function StepPlayer({ step, chapter, onFinish, onOpen }: {
  step: Step;
  chapter: Chapter;
  onFinish: (stars: StarCount) => void;
  onOpen: (stepId: string | null) => void;
}) {
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<{ stars: StarCount; summary?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const following = nextStep(step.id);

  const solved = ({ mistakes: roundMistakes, stars, summary }: RoundResult) => {
    const totalMistakes = mistakes + roundMistakes;
    setMistakes(totalMistakes);
    if (round + 1 < step.rounds) {
      setRound(round + 1);
      return;
    }
    const earned = stars ?? roundStars(totalMistakes);
    setResult({ stars: earned, summary });
    onFinish(earned);
  };

  const replay = () => {
    setRound(0);
    setMistakes(0);
    setResult(null);
    setAttempt(attempt + 1);
  };

  return (
    <section className={`game-stage m-stage accent-${chapter.color}`} aria-label={step.title} data-step={step.id} data-engine={step.engine}>
      <div className="m-stage-bar">
        <button className="m-back" onClick={() => onOpen(null)} aria-label="Retour à la carte">← Carte</button>
        <div className="m-stage-title">
          <small>{chapter.icon} {chapter.title} · {step.grade}</small>
          <h2>{step.title}</h2>
        </div>
        <ol className="m-round-dots" aria-label={`Manche ${Math.min(round + 1, step.rounds)} sur ${step.rounds}`}>
          {Array.from({ length: step.rounds }, (_, index) => (
            <li key={index} className={result || index < round ? "is-done" : index === round ? "is-current" : ""} />
          ))}
        </ol>
      </div>
      <div className="m-stage-body">
        {result
          ? <StepDone stars={result.stars} summary={result.summary} hasNext={following !== null} onReplay={replay} onNext={() => onOpen(following?.id ?? null)} />
          : <Round key={`${step.id}-${attempt}-${round}`} step={step} onSolved={solved} />}
      </div>
    </section>
  );
}

function StepDone({ stars, summary, hasNext, onReplay, onNext }: { stars: StarCount; summary?: string; hasNext: boolean; onReplay: () => void; onNext: () => void }) {
  const title = stars === 3 ? "Bravo, champion !" : stars === 2 ? "Très bien !" : "Bien joué !";
  useEffect(() => {
    fanfare();
    speakFrench(summary ? `${title} ${summary}` : title, 0.95);
  }, [summary, title]);
  return (
    <div className="m-done" aria-live="polite">
      <Stars value={stars} size="lg" />
      <h2>{title}</h2>
      {summary && <p>{summary}</p>}
      {stars < 3 && <p className="m-note">Rejoue pour gagner toutes les étoiles.</p>}
      <div className="m-done-actions">
        <button className="m-secondary" onClick={onReplay}>↻ Rejouer</button>
        <button className="m-primary is-big" onClick={onNext}>{hasNext ? "Étape suivante →" : "Retour à la carte"}</button>
      </div>
    </div>
  );
}
