import { useEffect, useRef, useState, type ReactNode } from "react";
import { fanfare, speakFrench } from "../audio";
import { nextStep, roundSeconds, type Chapter, type Step } from "./curriculum";
import { roundPoints, roundStars } from "./logic";
import type { Stars as StarCount } from "./profiles";
import { ChronoChart, Countdown, Stars } from "./ui";
import { now, type RoundResult } from "./hooks";
import BlocksGame from "./games/BlocksGame";
import BondsGame from "./games/BondsGame";
import BridgeGame from "./games/BridgeGame";
import ClockGame from "./games/ClockGame";
import CoinsGame from "./games/CoinsGame";
import FractionGame from "./games/FractionGame";
import ProblemGame from "./games/ProblemGame";
import GroupsGame from "./games/GroupsGame";
import LineGame from "./games/LineGame";
import MysteryGame from "./games/MysteryGame";
import PatternGame from "./games/PatternGame";
import SudokuGame from "./games/SudokuGame";
import ShareGame from "./games/ShareGame";
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
    case "blocks": return <BlocksGame config={step.config} onSolved={onSolved} />;
    case "line": return <LineGame config={step.config} onSolved={onSolved} />;
    case "bridge": return <BridgeGame config={step.config} onSolved={onSolved} />;
    case "groups": return <GroupsGame config={step.config} onSolved={onSolved} />;
    case "share": return <ShareGame config={step.config} onSolved={onSolved} />;
    case "pattern": return <PatternGame config={step.config} onSolved={onSolved} />;
    case "mystery": return <MysteryGame config={step.config} onSolved={onSolved} />;
    case "sudoku": return <SudokuGame config={step.config} onSolved={onSolved} />;
    case "clock": return <ClockGame config={step.config} onSolved={onSolved} />;
    case "coins": return <CoinsGame config={step.config} onSolved={onSolved} />;
    case "problem": return <ProblemGame config={step.config} onSolved={onSolved} />;
    case "fraction": return <FractionGame config={step.config} onSolved={onSolved} />;
  }
}

export default function StepPlayer({ step, chapter, previousBest, history, onFinish, onOpen }: {
  step: Step;
  chapter: Chapter;
  /** Best score before this play, to celebrate a new record. */
  previousBest: number;
  /** Earlier scores of this timed minute (empty for other steps), to chart progress at the end. */
  history: number[];
  onFinish: (stars: StarCount, points: number, score?: number) => void;
  onOpen: (stepId: string | null) => void;
}) {
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [result, setResult] = useState<{ stars: StarCount; points: number; summary?: string; score?: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const roundStart = useRef(0);
  // Each round's clock starts when it appears on screen.
  useEffect(() => {
    roundStart.current = now();
  }, [round, attempt]);
  const following = nextStep(step.id);
  const seconds = roundSeconds(step);

  const solved = ({ mistakes: roundMistakes, solvedAt, stars, points: ownPoints, score, summary }: RoundResult) => {
    const totalMistakes = mistakes + roundMistakes;
    const elapsed = ((solvedAt ?? now()) - roundStart.current) / 1000;
    const gain = ownPoints ?? roundPoints(roundMistakes, seconds ? 1 - elapsed / seconds : 0);
    const totalPoints = points + gain;
    setMistakes(totalMistakes);
    setPoints(totalPoints);
    setLastGain(gain);
    if (round + 1 < step.rounds) {
      setRound(round + 1);
      return;
    }
    const earned = stars ?? roundStars(totalMistakes);
    setResult({ stars: earned, points: totalPoints, summary, score });
    onFinish(earned, totalPoints, score);
  };

  const replay = () => {
    setRound(0);
    setMistakes(0);
    setPoints(0);
    setLastGain(null);
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
        {step.engine === "sprint" && <span className="chrono-badge" title="Jeu chronométré">⏱ Chrono {step.config.seconds} s</span>}
        <ol className="m-round-dots" aria-label={`Manche ${Math.min(round + 1, step.rounds)} sur ${step.rounds}`}>
          {Array.from({ length: step.rounds }, (_, index) => (
            <li key={index} className={result || index < round ? "is-done" : index === round ? "is-current" : ""} />
          ))}
        </ol>
        <span className="m-stage-score" aria-live="polite">
          🏆 {points}{lastGain !== null && !result && <span className="m-points-pop" key={`${round}-${attempt}`}> +{lastGain}</span>}
        </span>
      </div>
      <div className="m-stage-body">
        {result
          ? (
            <StepDone stars={result.stars} points={result.points} record={result.points > previousBest && previousBest > 0} summary={result.summary} hasNext={following !== null} onReplay={replay} onNext={() => onOpen(following?.id ?? null)}>
              {result.score !== undefined && <ChronoChart scores={[...history, result.score]} highlightLast />}
            </StepDone>
          )
          : (
            <div className="m-round" key={`${step.id}-${attempt}-${round}`}>
              {seconds && <Countdown seconds={seconds} />}
              <Round step={step} onSolved={solved} />
            </div>
          )}
      </div>
    </section>
  );
}

function StepDone({ stars, points, record, summary, hasNext, onReplay, onNext, children }: {
  children?: ReactNode;
  stars: StarCount;
  points: number;
  record: boolean;
  summary?: string;
  hasNext: boolean;
  onReplay: () => void;
  onNext: () => void;
}) {
  const title = stars === 3 ? "Bravo, champion !" : stars === 2 ? "Très bien !" : "Bien joué !";
  useEffect(() => {
    fanfare();
    speakFrench(`${title} ${summary ?? ""} ${points} points.${record ? " Nouveau record !" : ""}`, 0.95);
  }, [summary, title, points, record]);
  return (
    <div className="m-done" aria-live="polite">
      <Stars value={stars} size="lg" />
      <h2>{title}</h2>
      {summary && <p>{summary}</p>}
      {children}
      <p><strong>🏆 {points} points</strong></p>
      {record && <p className="m-record">🎉 Nouveau record !</p>}
      {stars < 3 && <p className="m-note">Rejoue pour gagner toutes les étoiles.</p>}
      <div className="m-done-actions">
        <button className="m-secondary" onClick={onReplay}>↻ Rejouer</button>
        <button className="m-primary is-big" onClick={onNext}>{hasNext ? "Étape suivante →" : "Retour à la carte"}</button>
      </div>
    </div>
  );
}
