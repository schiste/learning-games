import { useEffect, useState } from "react";
import { speakFrench } from "../audio";
import { ALL_STEPS, CHAPTERS, findStep, type Chapter } from "./curriculum";
import {
  activeProfile,
  chapterScore,
  createProfile,
  loadStore,
  recordStep,
  removeProfile,
  saveStore,
  suggestedStep,
  totalStars,
  updateProfile,
  type Profile,
  type ProfileStore,
} from "./profiles";
import ProfilePicker from "./ProfilePicker";
import StepPlayer from "./StepPlayer";
import { Stars } from "./ui";
import "./math.css";

/** The math adventure: one map, steps in teaching order, the next one always suggested but none locked. */
export default function AdventurePage({ stepId, onOpen }: { stepId: string | null; onOpen: (stepId: string | null) => void }) {
  const [store, setStore] = useState<ProfileStore>(loadStore);
  const profile = activeProfile(store);
  const current = stepId ? findStep(stepId) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stepId, profile?.id]);

  const change = (next: (before: ProfileStore) => ProfileStore) => setStore((before) => {
    const after = next(before);
    saveStore(after);
    return after;
  });

  if (!profile) {
    return (
      <ProfilePicker
        profiles={store.profiles}
        onPick={(id) => change((before) => ({ ...before, activeId: id }))}
        onCreate={(name, avatar) => change((before) => createProfile(before, name, avatar))}
        onRemove={(id) => change((before) => removeProfile(before, id))}
      />
    );
  }

  if (current) {
    return (
      <StepPlayer
        key={current.step.id}
        step={current.step}
        chapter={current.chapter}
        previousBest={profile.steps[current.step.id]?.best ?? 0}
        onOpen={onOpen}
        onFinish={(stars, points) => change((before) => updateProfile(before, profile.id, (player) => recordStep(player, current.step.id, stars, points)))}
      />
    );
  }

  const suggestion = suggestedStep(profile);
  const suggestionChapter = findStep(suggestion.id)!.chapter;
  const started = Object.keys(profile.steps).length > 0;

  return (
    <div className="m-map">
      <div className="m-hero">
        <div className="m-who">
          <button className="m-who-avatar" onClick={() => change((before) => ({ ...before, activeId: null }))} aria-label={`${profile.name} — changer de joueur`}>{profile.avatar}</button>
          <div>
            <h1>L’aventure de {profile.name}</h1>
            <div className="m-scoreboard" aria-label="Mes scores">
              <span>★ {totalStars(profile)} / {ALL_STEPS.length * 3}</span>
              <span>🏆 {profile.points} points</span>
              <span>✅ {Object.keys(profile.steps).length} / {ALL_STEPS.length} étapes</span>
            </div>
          </div>
        </div>
        <button className={`m-continue accent-${suggestionChapter.color}`} onClick={() => onOpen(suggestion.id)}>
          <span className="m-continue-icon" aria-hidden="true">{suggestionChapter.icon}</span>
          <span><small>{started ? "Continuer" : "Commencer"}</small><strong>{suggestion.title}</strong></span>
          <span aria-hidden="true">▶</span>
        </button>
      </div>
      {CHAPTERS.map((chapter, index) => (
        <ChapterTrail key={chapter.id} chapter={chapter} number={index + 1} profile={profile} suggestedId={suggestion.id} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ChapterTrail({ chapter, number, profile, suggestedId, onOpen }: {
  chapter: Chapter;
  number: number;
  profile: Profile;
  suggestedId: string;
  onOpen: (stepId: string) => void;
}) {
  const grades = [...new Set(chapter.steps.map((step) => step.grade))].join(" · ");
  const score = chapterScore(profile, chapter);
  return (
    <section className={`m-chapter accent-${chapter.color}`} aria-labelledby={`chapter-${chapter.id}`}>
      <header>
        <span className="m-chapter-icon" aria-hidden="true">{chapter.icon}</span>
        <div>
          <small>Chapitre {number} · {grades}</small>
          <h2 id={`chapter-${chapter.id}`}>{chapter.title}</h2>
        </div>
        <span className="m-chapter-stars" aria-label={`${score.stars} étoiles, meilleur total ${score.best} points`}>
          <span aria-hidden="true">★</span> {score.stars}/{chapter.steps.length * 3} · 🏆 {score.best}
        </span>
      </header>
      <ol className="m-trail">
        {chapter.steps.map((step, index) => {
          const record = profile.steps[step.id];
          return (
            <li key={step.id}>
              <button
                className={`m-step ${record ? "is-done" : ""} ${step.id === suggestedId ? "is-next" : ""}`}
                onClick={() => onOpen(step.id)}
                aria-label={`${step.title}. ${step.goal}${record ? `. ${record.stars} étoiles, record ${record.best} points` : ""}`}
              >
                <span className="m-step-badge">{step.engine === "sprint" ? "⏱" : index + 1}</span>
                <span className="m-step-title">{step.title}</span>
                {record
                  ? <><Stars value={record.stars} size="sm" /><span className="m-step-best">🏆 {record.best}</span></>
                  : <span className="m-step-grade">{step.grade}</span>}
              </button>
              <button className="m-step-listen" onClick={() => speakFrench(step.goal)} aria-label={`Écouter : ${step.goal}`}>🔊</button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
