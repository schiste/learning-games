import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useAnswer, useTimeouts, type RoundProps } from "../hooks";
import { LINE_TICKS, lineRound, type LineConfig, type LineRound } from "../logic";
import { Hint, NumberChoices, Prompt } from "../ui";

/** Ticks with labels only where they help: both ends, the middle, and the frog's starting point. */
function NumberLine({ round, labelled, frogAt, onTap, marks }: {
  round: LineRound;
  labelled: (value: number) => boolean;
  frogAt?: number;
  onTap?: (value: number) => void;
  marks?: Record<number, "wrong" | "right">;
}) {
  const ticks = Array.from({ length: LINE_TICKS }, (_, index) => round.from + index * round.step);
  return (
    <div className="nl" role="group" aria-label={`Ligne des nombres de ${round.from} à ${ticks.at(-1)}`}>
      <div className="nl-track" aria-hidden="true" />
      {ticks.map((value) => {
        const content = (
          <>
            {frogAt === value && <span className="nl-frog" aria-hidden="true">🐸</span>}
            <i className="nl-tick" />
            <span className="nl-label">{labelled(value) || marks?.[value] ? value : ""}</span>
          </>
        );
        const mark = marks?.[value] ? `is-${marks[value]}` : "";
        return onTap
          ? <button key={value} className={`nl-point ${mark}`} onClick={() => onTap(value)} aria-label={labelled(value) ? String(value) : "graduation"}>{content}</button>
          : <span key={value} className={`nl-point ${mark}`}>{content}</span>;
      })}
    </div>
  );
}

export default function LineGame(props: RoundProps<LineConfig>) {
  return props.config.mode === "place" ? <PlaceOnLine {...props} /> : <HopOnLine {...props} />;
}

/** Place a number: only some ticks are labelled, so the child reasons from the ends and the middle. */
function PlaceOnLine({ config, onSolved }: RoundProps<LineConfig>) {
  const [round] = useState(() => lineRound(config));
  const [marks, setMarks] = useState<Record<number, "wrong" | "right">>({});
  const [hint, setHint] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const done = useRef(false);
  const later = useTimeouts();
  const end = round.from + (LINE_TICKS - 1) * round.step;
  const middle = round.from + 5 * round.step;

  const tap = (value: number) => {
    if (done.current || marks[value]) return;
    if (value === round.target) {
      done.current = true;
      const solvedAt = now();
      setMarks({ ...marks, [value]: "right" });
      setHint("");
      beep(880, 0.12);
      speakFrench(`Oui, ${value} !`, 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1100);
      return;
    }
    setMarks({ ...marks, [value]: "wrong" });
    setMistakes(mistakes + 1);
    beep(220, 0.14);
    setHint(`Là, c’est ${value}. ${round.target} est plus ${round.target > value ? "loin, vers la droite" : "près, vers la gauche"}.`);
  };

  return (
    <div className="m-game line-game" data-scene={JSON.stringify({ target: round.target, from: round.from, step: round.step })}>
      <Prompt text={`Touche le nombre ${round.target} sur la ligne.`} speech={`Où est ${round.target} ?`}>
        <strong className="m-target">{round.target}</strong>
      </Prompt>
      <NumberLine round={round} labelled={(value) => value === round.from || value === end || value === middle} onTap={tap} marks={marks} />
      <p className="m-note">{round.step === 1 ? "Chaque trait avance de 1." : `Chaque trait avance de ${round.step}.`}</p>
      <Hint message={hint} />
    </div>
  );
}

/** Adding is moving forward, subtracting is moving back: the frog hops, then the child says where it landed. */
function HopOnLine({ config, onSolved }: RoundProps<LineConfig>) {
  const [round] = useState(() => lineRound(config));
  const [hopped, setHopped] = useState(0);
  const latest = useRef(0);
  const finished = hopped === round.hops;
  const direction = round.op === "+" ? 1 : -1;
  const frogAt = round.start + direction * hopped * round.step;
  const { pick, wrong, solved, hint } = useAnswer(round.target, onSolved, (picked) =>
    `Regarde où est la grenouille. ${round.start} ${round.op} ${round.hops * round.step}, ce n’est pas ${picked}.`,
  );

  const hop = () => {
    if (latest.current >= round.hops) return;
    latest.current += 1;
    setHopped(latest.current);
    beep(500 + latest.current * 40, 0.07);
    speakFrench(String(round.step === 1 ? latest.current : latest.current * round.step), 1.05);
  };

  const amount = round.hops * round.step;
  return (
    <div className="m-game line-game" data-scene={JSON.stringify({ start: round.start, hops: round.hops, step: round.step, op: round.op, hopped, target: round.target })}>
      <Prompt text={`${round.start} ${round.op} ${amount} = ?`} speech={`${round.start} ${round.op === "+" ? "plus" : "moins"} ${amount}`} />
      <NumberLine round={round} frogAt={frogAt} labelled={(value) => value === round.from || value === round.start || value === round.from + 10 * round.step} />
      {!finished
        ? (
          <button className="m-primary is-big" onClick={hop}>
            {round.op === "+" ? `Saute ! (+${round.step})` : `Recule ! (−${round.step})`}
            <span className="nl-hops" aria-label={`${round.hops - hopped} sauts restants`}>{"●".repeat(round.hops - hopped)}{"○".repeat(hopped)}</span>
          </button>
        )
        : (
          <>
            <p className="m-note">Où est arrivée la grenouille ?</p>
            <NumberChoices values={round.choices} onPick={pick} wrong={wrong} solved={solved} />
          </>
        )}
      <Hint message={hint} />
    </div>
  );
}
