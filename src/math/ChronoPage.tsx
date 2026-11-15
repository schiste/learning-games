import { chronoReady, chronoSteps } from "./curriculum";
import { chronoRecord, type Profile } from "./profiles";
import { ChronoChart } from "./ui";

/**
 * « Défis chrono »: every timed minute in one place, each with the child's own record and
 * recent scores, and a clear sign of whether the facts behind it have been taught yet.
 */
export default function ChronoPage({ profile, onBack, onOpen }: { profile: Profile; onBack: () => void; onOpen: (stepId: string) => void }) {
  const finished = (stepId: string) => Boolean(profile.steps[stepId]);
  return (
    <section className="game-stage m-stage accent-berry" aria-label="Défis chrono" data-step="chrono">
      <div className="m-stage-bar">
        <button className="m-back" onClick={onBack} aria-label="Retour à la carte">← Carte</button>
        <div className="m-stage-title"><small>{profile.avatar} {profile.name}</small><h2>⏱ Défis chrono</h2></div>
      </div>
      <div className="chrono-hub">
        <p className="m-note">Une minute pour répondre juste, du premier coup. Bats ton propre record : tu ne te compares qu’à toi.</p>
        <div className="chrono-grid">
          {chronoSteps().map(({ step, chapter }) => {
            const history = profile.chrono[step.id] ?? [];
            const record = chronoRecord(profile, step.id);
            const { ready, missing } = chronoReady(step, finished);
            return (
              <article key={step.id} className={`chrono-card accent-${chapter.color} ${ready ? "is-ready" : "is-early"}`}>
                <header>
                  <span className="chrono-badge" aria-hidden="true">⏱ 60 s</span>
                  <div>
                    <h3>{step.title}</h3>
                    <small>{chapter.icon} {chapter.title} · {step.grade}</small>
                  </div>
                </header>
                {history.length
                  ? <ChronoChart scores={history} />
                  : <p className="chrono-empty">Pas encore joué</p>}
                <p className="chrono-record">{record ? <>🎯 Record : <strong>{record}</strong></> : " "}</p>
                {!ready && <p className="chrono-advice">Conseillé après « {missing[0].title} »</p>}
                <button className={ready ? "m-primary" : "m-secondary"} onClick={() => onOpen(step.id)}>{history.length ? "Rejouer" : "Jouer"}</button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
