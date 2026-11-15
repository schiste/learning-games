import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { useAnswer, type RoundProps, type RoundResult } from "../hooks";
import { shareRound, type ShareConfig } from "../logic";
import { nearbyChoices } from "../random";
import { Hint, NumberChoices, Prompt } from "../ui";

const FRIENDS = ["🧒", "👧", "🧑", "👦", "🧒🏽", "👧🏾"];

/**
 * Division as fair sharing: deal the objects one by one (or a round at a time) until
 * there are not enough left for everyone, then say how many each friend got —
 * and, from CE2, how many are left over.
 */
export default function ShareGame({ config, onSolved }: RoundProps<ShareConfig>) {
  const [round] = useState(() => shareRound(config));
  const [plates, setPlates] = useState<number[]>(() => Array(round.friends).fill(0));
  const latest = useRef(plates);
  const [phase, setPhase] = useState<"deal" | "each" | "left">("deal");
  const [firstMistakes, setFirstMistakes] = useState(0);
  const [hint, setHint] = useState("");
  const given = plates.reduce((sum, count) => sum + count, 0);
  const pile = round.total - given;
  const fair = plates.every((count) => count === plates[0]);
  const dealtOut = pile < round.friends && fair;

  const apply = (next: number[]) => {
    latest.current = next;
    setPlates(next);
    setHint("");
  };

  const give = (friend: number) => {
    const current = latest.current;
    if (phase !== "deal" || round.total - current.reduce((a, b) => a + b, 0) === 0) return;
    const next = [...current];
    next[friend] += 1;
    beep(520 + next[friend] * 25, 0.05);
    apply(next);
  };

  const dealRound = () => {
    const current = latest.current;
    const left = round.total - current.reduce((a, b) => a + b, 0);
    if (phase !== "deal" || left < round.friends) return;
    beep(660, 0.08);
    speakFrench("Un pour chacun !", 1.05);
    apply(current.map((count) => count + 1));
  };

  const restart = () => apply(Array(round.friends).fill(0));

  const done = () => {
    if (!fair) {
      setHint("Ce n’est pas juste : chaque ami doit avoir la même chose.");
      return;
    }
    if (pile >= round.friends) {
      setHint(`Il en reste ${pile} : on peut encore en donner un à chacun.`);
      return;
    }
    setPhase("each");
  };

  return (
    <div className="m-game share-game" data-scene={JSON.stringify({ ...round, plates, phase })}>
      <Prompt text={`Partage ${round.total} ${round.thing} entre ${round.friends} amis.`} speech={`Partage ${round.total} entre ${round.friends} amis, pour que chacun ait la même chose.`} />
      <div className="s-pile" aria-label={`Il reste ${pile}`}>
        {Array.from({ length: pile }, (_, index) => <span key={index} aria-hidden="true">{round.thing}</span>)}
        {pile === 0 && <small>plus rien !</small>}
      </div>
      <div className="s-friends">
        {plates.map((count, friend) => (
          <button key={friend} className="s-friend" onClick={() => give(friend)} disabled={phase !== "deal" || pile === 0} aria-label={`Ami ${friend + 1} : ${count}`}>
            <span className="s-face" aria-hidden="true">{FRIENDS[friend % FRIENDS.length]}</span>
            <span className="s-plate" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index}>{round.thing}</i>)}</span>
            <b>{count}</b>
          </button>
        ))}
      </div>
      {phase === "deal" && (
        <div className="m-done-actions">
          <button className="m-secondary" onClick={restart} disabled={given === 0}>↺</button>
          <button className="m-secondary" onClick={dealRound} disabled={pile < round.friends}>Un à chacun</button>
          <button className={`m-primary ${dealtOut ? "is-big" : ""}`} onClick={done}>J’ai fini</button>
        </div>
      )}
      {phase === "each" && <Answer key="each" question="Combien chacun en a-t-il ?" answer={round.each} max={round.each + 4} hint={() => "Compte ce qu’il y a dans une assiette."}
        onDone={(result) => { if (config.remainder) { setFirstMistakes(result.mistakes); setPhase("left"); } else onSolved(result); }} />}
      {phase === "left" && <Answer key="left" question="Combien en reste-t-il ?" answer={round.left} max={round.friends} hint={() => "Regarde ce qui n’a pas pu être partagé."}
        onDone={(result) => onSolved({ ...result, mistakes: result.mistakes + firstMistakes })} />}
      <Hint message={hint} />
    </div>
  );
}

function Answer({ question, answer, max, hint, onDone }: { question: string; answer: number; max: number; hint: () => string; onDone: (result: RoundResult) => void }) {
  const [choices] = useState(() => nearbyChoices(answer, 4, 0, max));
  const { pick, wrong, solved, hint: message } = useAnswer(answer, onDone, hint);
  return (
    <>
      <p className="m-note"><strong>{question}</strong></p>
      <NumberChoices values={choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={message} />
    </>
  );
}
