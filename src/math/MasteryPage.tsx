import { factSetUnlocks } from "./curriculum";
import { FACT_SET_INFO, factsIn, isMastered, masteryOf, MASTERED_BOX, type FactItem } from "./facts";
import type { Profile } from "./profiles";

/** Colour level of one fact: not seen yet, being learned, or known by heart. */
function level(profile: Profile, fact: FactItem): "new" | "learning" | "known" {
  const stat = profile.facts[fact.key];
  if (!stat) return "new";
  return isMastered(stat) ? "known" : "learning";
}

/** « Mes progrès »: every fact the adventure teaches, so a child (and an adult) can see what is known by heart. */
export default function MasteryPage({ profile, onBack, onOpen }: { profile: Profile; onBack: () => void; onOpen: (stepId: string) => void }) {
  return (
    <section className="game-stage m-stage accent-teal" aria-label="Mes progrès">
      <div className="m-stage-bar">
        <button className="m-back" onClick={onBack} aria-label="Retour à la carte">← Carte</button>
        <div className="m-stage-title"><small>{profile.avatar} {profile.name}</small><h2>Ce que je sais par cœur</h2></div>
      </div>
      <div className="m-mastery">
        <p className="m-legend">
          <span className="is-new">pas encore vu</span>
          <span className="is-learning">j’apprends</span>
          <span className="is-known">je sais par cœur</span>
        </p>
        <p className="m-note">Un calcul est su par cœur quand tu l’as trouvé vite, {MASTERED_BOX} jours différents.</p>
        {factSetUnlocks().map(({ set, step }) => {
          const unlocked = Boolean(profile.steps[step.id]);
          const { mastered, total } = masteryOf(set, profile.facts);
          const rows = groupRows(factsIn(set));
          return (
            <article key={set} className={`m-fact-set ${unlocked ? "" : "is-locked"}`}>
              <header>
                <h3><span aria-hidden="true">{FACT_SET_INFO[set].icon}</span> {FACT_SET_INFO[set].title}</h3>
                <span className="m-fact-count">{mastered} / {total}</span>
              </header>
              <div className="m-fact-bar" aria-hidden="true"><i style={{ width: `${(100 * mastered) / total}%` }} /></div>
              {unlocked
                ? (
                  <div className="m-fact-grid">
                    {rows.map((row) => (
                      <div className="m-fact-row" key={row[0].key}>
                        {row.map((fact) => (
                          <span key={fact.key} className={`m-fact is-${level(profile, fact)}`} title={`${fact.text} = ${fact.answer}`}>
                            {fact.text.replace(" = 10", "")}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )
                : <button className="m-secondary" onClick={() => onOpen(step.id)}>🔒 À débloquer avec « {step.title} »</button>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Facts sharing the same first number form a row, which turns the times tables into the classic grid. */
function groupRows(facts: FactItem[]): FactItem[][] {
  const rows = new Map<number, FactItem[]>();
  for (const fact of facts) rows.set(fact.a, [...(rows.get(fact.a) ?? []), fact]);
  const grouped = [...rows.values()];
  return grouped.every((row) => row.length === 1) ? [grouped.flat()] : grouped;
}
