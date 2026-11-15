import { useEffect, useRef, useState } from "react";
import { useFactMemory } from "../factMemory";
import { factByKey } from "../facts";
import { now, useAnswer, type RoundProps, type RoundResult } from "../hooks";
import { bridgeRound, type BridgeConfig, type BridgeRound } from "../logic";
import { nearbyChoices } from "../random";
import { Hint, NumberChoices, Prompt } from "../ui";
import { TenFrame } from "../visuals";

/**
 * Crossing ten in two steps, the strategy taught in class:
 * 8 + 5 → first complete the ten (8 + 2), then add what is left (10 + 3).
 * 13 − 5 → first go back to ten (13 − 3), then take away what is left (10 − 2).
 */
export default function BridgeGame({ config, onSolved }: RoundProps<BridgeConfig>) {
  const [round] = useState(() => bridgeRound(config));
  const [phase, setPhase] = useState<1 | 2>(1);
  const [firstMistakes, setFirstMistakes] = useState(0);
  const memory = useFactMemory();
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = now();
  }, []);

  const finish = (result: RoundResult) => {
    const mistakes = firstMistakes + result.mistakes;
    const key = `${round.op === "+" ? "add20" : "sub20"}:${round.a}:${round.b}`;
    if (factByKey(key)) memory.record(key, mistakes === 0, (result.solvedAt ?? now()) - shownAt.current);
    onSolved({ ...result, mistakes });
  };

  return (
    <div className="m-game bridge-game" data-scene={JSON.stringify({ ...round, phase })}>
      <Prompt text={`${round.a} ${round.op} ${round.b} = ?`} speech={`${round.a} ${round.op === "+" ? "plus" : "moins"} ${round.b}`} />
      <BridgeFrames round={round} phase={phase} />
      <p className="bridge-equation" aria-live="polite">
        {round.a} {round.op} {round.b}
        {phase === 2 && <> = <b>{round.a} {round.op} {round.toTen} {round.op} {round.rest}</b></>}
      </p>
      {phase === 1
        ? <StepOne round={round} onDone={(result) => { setFirstMistakes(result.mistakes); setPhase(2); }} />
        : <StepTwo round={round} onDone={finish} />}
    </div>
  );
}

function BridgeFrames({ round, phase }: { round: BridgeRound; phase: 1 | 2 }) {
  if (round.op === "+") {
    // Phase 1: a blue in the first frame, b yellow in the second. Phase 2: the gap is filled from the second frame.
    return (
      <div className="bridge-frames">
        <TenFrame filled={round.a} added={phase === 2 ? round.toTen : 0} label={`${phase === 2 ? 10 : round.a} dans la première boîte`} />
        <TenFrame filled={0} added={phase === 2 ? round.rest : round.b} label={`${phase === 2 ? round.rest : round.b} dans la deuxième boîte`} />
      </div>
    );
  }
  // Subtraction: a full ten plus some units; phase 2 has removed the units first.
  return (
    <div className="bridge-frames">
      <TenFrame filled={10} label="10 dans la première boîte" />
      <TenFrame filled={phase === 2 ? 0 : round.toTen} label={`${phase === 2 ? 0 : round.toTen} dans la deuxième boîte`} />
    </div>
  );
}

function StepOne({ round, onDone }: { round: BridgeRound; onDone: (result: RoundResult) => void }) {
  const { pick, wrong, solved, hint } = useAnswer(round.toTen, onDone, (picked) =>
    round.op === "+"
      ? `${round.a} et ${picked}, ça fait ${round.a + picked}. Compte les cases vides de la première boîte.`
      : `Il y a ${round.toTen} jetons après la dizaine, pas ${picked}.`,
  );
  return (
    <>
      <p className="m-note">{round.op === "+" ? "① Combien faut-il pour remplir la première boîte ?" : "① Combien faut-il enlever pour revenir à 10 ?"}</p>
      <NumberChoices values={[1, 2, 3, 4, 5, 6, 7, 8, 9]} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </>
  );
}

function StepTwo({ round, onDone }: { round: BridgeRound; onDone: (result: RoundResult) => void }) {
  const [choices] = useState(() => nearbyChoices(round.answer, 4, 0, 20));
  const text = round.op === "+" ? `10 + ${round.rest}` : `10 − ${round.rest}`;
  const { pick, wrong, solved, hint } = useAnswer(round.answer, onDone, () =>
    round.op === "+" ? `Une dizaine et ${round.rest} unités : on l’écrit 1 puis ${round.rest}.` : `Enlève encore ${round.rest} à 10.`,
  );
  return (
    <>
      <p className="m-note">② {round.op === "+" ? `Il reste ${round.rest} à ajouter` : `Il reste ${round.rest} à enlever`} : {text} = ?</p>
      <NumberChoices values={choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </>
  );
}
