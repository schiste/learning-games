import { useEffect, useState } from "react";
import { speakFrench } from "../audio";
import { ALL_STEPS, CHAPTERS, findStep, type Chapter } from "./curriculum";
import { loadProgress, recordStars, saveProgress, suggestedStep, type Progress } from "./progress";
import StepPlayer from "./StepPlayer";
import { Stars } from "./ui";
import "./math.css";

/** The math adventure: one map, steps in teaching order, the next one always suggested but none locked. */
export default function AdventurePage({ stepId, onOpen }: { stepId: string | null; onOpen: (stepId: string | null) => void }) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const current = stepId ? findStep(stepId) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stepId]);

  if (current) {
    return (
      <StepPlayer
        key={current.step.id}
        step={current.step}
        chapter={current.chapter}
        onOpen={onOpen}
        onFinish={(stars) => setProgress((before) => {
          const after = recordStars(before, current.step.id, stars);
          saveProgress(after);
          return after;
        })}
      />
    );
  }

  const suggestion = suggestedStep(progress);
  const suggestionChapter = findStep(suggestion.id)!.chapter;
  const earned = Object.values(progress).reduce((sum, stars) => sum + stars, 0);

  return (
    <div className="m-map">
      <div className="m-hero">
        <div>
          <h1>L’aventure des nombres</h1>
          <p>Avance d’étape en étape. Chaque étape te fait gagner jusqu’à 3 étoiles.</p>
          <p className="m-total"><span aria-hidden="true">★</span> {earned} / {ALL_STEPS.length * 3} étoiles</p>
        </div>
        <button className={`m-continue accent-${suggestionChapter.color}`} onClick={() => onOpen(suggestion.id)}>
          <span className="m-continue-icon" aria-hidden="true">{suggestionChapter.icon}</span>
          <span><small>{earned ? "Continuer" : "Commencer"}</small><strong>{suggestion.title}</strong></span>
          <span aria-hidden="true">▶</span>
        </button>
      </div>
      {CHAPTERS.map((chapter, index) => (
        <ChapterTrail key={chapter.id} chapter={chapter} number={index + 1} progress={progress} suggestedId={suggestion.id} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ChapterTrail({ chapter, number, progress, suggestedId, onOpen }: {
  chapter: Chapter;
  number: number;
  progress: Progress;
  suggestedId: string;
  onOpen: (stepId: string) => void;
}) {
  const grades = [...new Set(chapter.steps.map((step) => step.grade))].join(" · ");
  const stars = chapter.steps.reduce((sum, step) => sum + (progress[step.id] ?? 0), 0);
  return (
    <section className={`m-chapter accent-${chapter.color}`} aria-labelledby={`chapter-${chapter.id}`}>
      <header>
        <span className="m-chapter-icon" aria-hidden="true">{chapter.icon}</span>
        <div>
          <small>Chapitre {number} · {grades}</small>
          <h2 id={`chapter-${chapter.id}`}>{chapter.title}</h2>
        </div>
        <span className="m-chapter-stars"><span aria-hidden="true">★</span> {stars}/{chapter.steps.length * 3}</span>
      </header>
      <ol className="m-trail">
        {chapter.steps.map((step, index) => {
          const done = progress[step.id];
          return (
            <li key={step.id}>
              <button
                className={`m-step ${done ? "is-done" : ""} ${step.id === suggestedId ? "is-next" : ""}`}
                onClick={() => onOpen(step.id)}
                aria-label={`${step.title}. ${step.goal}${done ? `. ${done} étoiles` : ""}`}
              >
                <span className="m-step-badge">{step.engine === "sprint" ? "⏱" : index + 1}</span>
                <span className="m-step-title">{step.title}</span>
                {done ? <Stars value={done} size="sm" /> : <span className="m-step-grade">{step.grade}</span>}
              </button>
              <button className="m-step-listen" onClick={() => speakFrench(step.goal)} aria-label={`Écouter : ${step.goal}`}>🔊</button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
