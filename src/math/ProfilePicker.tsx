import { useState } from "react";
import { speakFrench } from "../audio";
import { AVATARS, totalStars, type Profile } from "./profiles";

/** "Qui joue ?": each child keeps their own stars, points and fact memory in this browser. */
export default function ProfilePicker({ profiles, onPick, onCreate, onRemove }: {
  profiles: Profile[];
  onPick: (id: string) => void;
  onCreate: (name: string, avatar: string) => void;
  onRemove: (id: string) => void;
}) {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [avatar, setAvatar] = useState<string>(AVATARS.find((candidate) => !profiles.some((profile) => profile.avatar === candidate)) ?? AVATARS[0]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  if (creating) {
    return (
      <section className="m-profiles" aria-labelledby="new-player">
        <h1 id="new-player">Nouveau joueur</h1>
        <p>Choisis ton animal.</p>
        <div className="m-avatar-grid" role="radiogroup" aria-label="Animal">
          {AVATARS.map((candidate) => (
            <button key={candidate} role="radio" aria-checked={avatar === candidate} className={`m-avatar ${avatar === candidate ? "is-selected" : ""}`} onClick={() => setAvatar(candidate)}>
              {candidate}
            </button>
          ))}
        </div>
        <label className="m-name-field">
          <span>Ton prénom (si tu veux)</span>
          <input value={name} maxLength={20} onChange={(event) => setName(event.target.value)} autoComplete="off" />
        </label>
        <div className="m-done-actions">
          {profiles.length > 0 && <button className="m-secondary" onClick={() => setCreating(false)}>Annuler</button>}
          <button className="m-primary is-big" onClick={() => onCreate(name, avatar)}>{avatar} C’est parti !</button>
        </div>
      </section>
    );
  }

  return (
    <section className="m-profiles" aria-labelledby="who-plays">
      <h1 id="who-plays">Qui joue ?</h1>
      <div className="m-player-grid">
        {profiles.map((profile) => (
          <div key={profile.id} className="m-player">
            <button className="m-player-card" onClick={() => { speakFrench(`Bonjour ${profile.name} !`); onPick(profile.id); }}>
              <span className="m-player-avatar" aria-hidden="true">{profile.avatar}</span>
              <strong>{profile.name}</strong>
              <small>★ {totalStars(profile)} · 🏆 {profile.points}</small>
            </button>
            {editing && (
              confirming === profile.id
                ? <button className="m-player-remove is-confirm" onClick={() => { onRemove(profile.id); setConfirming(null); }}>Effacer {profile.name} ?</button>
                : <button className="m-player-remove" onClick={() => setConfirming(profile.id)} aria-label={`Supprimer ${profile.name}`}>✕</button>
            )}
          </div>
        ))}
        <button className="m-player-card is-new" onClick={() => setCreating(true)}>
          <span className="m-player-avatar" aria-hidden="true">＋</span>
          <strong>Nouveau joueur</strong>
        </button>
      </div>
      <button className="m-link" onClick={() => { setEditing(!editing); setConfirming(null); }}>{editing ? "Terminé" : "Gérer les joueurs (adulte)"}</button>
    </section>
  );
}
