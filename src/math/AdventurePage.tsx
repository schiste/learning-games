import { useEffect, useState, type ReactNode } from "react";
import { speakFrench } from "../audio";
import { ALL_STEPS, CHAPTERS, chronoSteps, factSetUnlocks, findStep, unlockedFactSets, type Chapter } from "./curriculum";
import { FactMemoryContext, type FactMemory } from "./factMemory";
import { dueCount, reviewQueue, today, updateFact, type FactItem } from "./facts";
import ChronoPage from "./ChronoPage";
import MasteryPage from "./MasteryPage";
import ReviewPlayer from "./ReviewPlayer";
import {
  activeProfile,
  addPoints,
  chronoRecord,
  recordChrono,
  markPlayed,
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

  const setsInReview = unlockedFactSets((id) => Boolean(profile.steps[id]));
  const memory: FactMemory = {
    facts: profile.facts,
    sets: setsInReview,
    history: current ? profile.chrono[current.step.id] ?? [] : [],
    record: (key, firstTry, ms) => change((before) => updateProfile(before, profile.id, (player) => ({
      ...player,
      facts: { ...player.facts, [key]: updateFact(player.facts[key], firstTry, ms, today()) },
    }))),
  };
  const withMemory = (content: ReactNode) => <FactMemoryContext.Provider value={memory}>{content}</FactMemoryContext.Provider>;

  if (stepId === "revision") {
    return withMemory(
      <section className="game-stage m-stage accent-plum" aria-label="Révision du jour" data-step="revision" data-engine="review">
        <div className="m-stage-bar">
          <button className="m-back" onClick={() => onOpen(null)} aria-label="Retour à la carte">← Carte</button>
          <div className="m-stage-title"><small>🧠 Les bases</small><h2>Révision du jour</h2></div>
        </div>
        <div className="m-stage-body">
          <Review sets={setsInReview} facts={profile.facts} onBack={() => onOpen(null)}
            onFinish={(points) => change((before) => updateProfile(before, profile.id, (player) => markPlayed(addPoints(player, points), today())))} />
        </div>
      </section>,
    );
  }

  if (stepId === "chrono") {
    return <ChronoPage profile={profile} onBack={() => onOpen(null)} onOpen={onOpen} />;
  }

  if (stepId === "progres") {
    return <MasteryPage profile={profile} onBack={() => onOpen(null)} onOpen={onOpen} />;
  }

  if (current) {
    return withMemory(
      <StepPlayer
        key={current.step.id}
        step={current.step}
        chapter={current.chapter}
        previousBest={profile.steps[current.step.id]?.best ?? 0}
        history={profile.chrono[current.step.id] ?? []}
        onOpen={onOpen}
        onFinish={(stars, points, score) => change((before) => updateProfile(before, profile.id, (player) => {
          const recorded = markPlayed(recordStep(player, current.step.id, stars, points), today());
          return score === undefined ? recorded : recordChrono(recorded, current.step.id, score);
        }))}
      />,
    );
  }

  const suggestion = suggestedStep(profile);
  const suggestionChapter = findStep(suggestion.id)!.chapter;
  const started = Object.keys(profile.steps).length > 0;
  const due = dueCount(setsInReview, profile.facts, today());
  const streak = profile.lastDay >= today() - 1 ? profile.streak : 0;

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
              {streak > 0 && <span>🔥 {streak} jour{streak > 1 ? "s" : ""} de suite</span>}
            </div>
          </div>
        </div>
        <button className={`m-continue accent-${suggestionChapter.color}`} onClick={() => onOpen(suggestion.id)}>
          <span className="m-continue-icon" aria-hidden="true">{suggestionChapter.icon}</span>
          <span><small>{started ? "Continuer" : "Commencer"}</small><strong>{suggestion.title}</strong></span>
          <span aria-hidden="true">▶</span>
        </button>
      </div>
      <div className="m-basics">
        <button className="m-basics-card accent-plum" onClick={() => onOpen("revision")} disabled={setsInReview.length === 0}>
          <span className="m-basics-icon" aria-hidden="true">🧠</span>
          <span>
            <strong>Révision du jour</strong>
            <small>{setsInReview.length === 0 ? `Se débloque avec « ${factSetUnlocks()[0]?.step.title} »` : due > 0 ? `${due} calcul${due > 1 ? "s" : ""} à revoir aujourd’hui` : "Entretiens ta mémoire des calculs"}</small>
          </span>
          {due > 0 && <b className="m-due">{due}</b>}
        </button>
        <button className="m-basics-card accent-berry is-chrono" onClick={() => onOpen("chrono")}>
          <span className="m-basics-icon" aria-hidden="true">⏱</span>
          <span><strong>Défis chrono</strong><small>{chronoBest(profile)}</small></span>
        </button>
        <button className="m-basics-card accent-teal" onClick={() => onOpen("progres")}>
          <span className="m-basics-icon" aria-hidden="true">📊</span>
          <span><strong>Mes progrès</strong><small>Ce que je sais par cœur</small></span>
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
                className={`m-step ${record ? "is-done" : ""} ${step.id === suggestedId ? "is-next" : ""} ${step.engine === "sprint" ? "is-timed" : ""}`}
                onClick={() => onOpen(step.id)}
                aria-label={`${step.title}. ${step.goal}${record ? `. ${record.stars} étoiles, record ${record.best} points` : ""}`}
              >
                <span className="m-step-badge">{step.engine === "sprint" ? "⏱" : index + 1}</span>
                <span className="m-step-title">{step.title}</span>
                {record
                  ? <><Stars value={record.stars} size="sm" /><span className="m-step-best">🏆 {record.best}</span></>
                  : <span className="m-step-grade">{step.engine === "sprint" ? "⏱ 60 s · " : ""}{step.grade}</span>}
              </button>
              <button className="m-step-listen" onClick={() => speakFrench(step.goal)} aria-label={`Écouter : ${step.goal}`}>🔊</button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** One line for the chrono card: how many timed minutes have a record, or an invitation. */
function chronoBest(profile: Profile): string {
  const played = chronoSteps().filter(({ step }) => chronoRecord(profile, step.id) > 0).length;
  return played ? `${played} / ${chronoSteps().length} records à battre` : "Une minute pour aller vite et juste";
}

/** Picks today's review once, when the session opens, so answering does not reshuffle it. */
function Review({ sets, facts, onFinish, onBack }: {
  sets: Parameters<typeof reviewQueue>[0];
  facts: Parameters<typeof reviewQueue>[1];
  onFinish: (points: number) => void;
  onBack: () => void;
}) {
  const [queue] = useState<FactItem[]>(() => reviewQueue(sets, facts, today()));
  return <ReviewPlayer queue={queue} onFinish={onFinish} onBack={onBack} />;
}
