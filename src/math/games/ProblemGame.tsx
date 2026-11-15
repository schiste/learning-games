import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { problemOps, problemRound, SCHEMA, type ProblemConfig, type ProblemRound } from "../everyday";
import { useAnswer, type RoundProps } from "../hooks";
import { Hint, NumberChoices, Prompt } from "../ui";

type Segment = { value: number | null; size: number };

/** The bar model: the top row and the bottom row have the same length, and "?" marks the unknown. */
function barModel(round: ProblemRound): { top: Segment[]; bottom: Segment[] } {
  const { a, b, answer } = round;
  switch (round.kind) {
    case "join": return { top: [{ value: a, size: a }, { value: b, size: b }], bottom: [{ value: null, size: a + b }] };
    case "separate": return { top: [{ value: a, size: a }], bottom: [{ value: b, size: b }, { value: null, size: answer }] };
    case "compare": return { top: [{ value: a, size: a }], bottom: [{ value: b, size: b }, { value: null, size: answer }] };
    case "groups": return { top: Array.from({ length: a }, () => ({ value: b, size: b })), bottom: [{ value: null, size: answer }] };
    case "share": return { top: [{ value: a, size: a }], bottom: Array.from({ length: b }, () => ({ value: null, size: answer })) };
  }
}

const OP_HINT: Record<ProblemRound["kind"], string> = {
  join: "On en ajoute : à la fin, il y en a plus qu’au début.",
  separate: "On en enlève : il en reste moins qu’au début.",
  compare: "Pour savoir combien de plus, on cherche l’écart : le grand moins le petit.",
  groups: "Des boîtes toutes pareilles : on multiplie.",
  share: "On partage en parts égales : on divise.",
};

const OP_WORD: Record<ProblemRound["op"], string> = { "+": "plus", "−": "moins", "×": "fois", "÷": "divisé par" };

/**
 * Word problems in two steps: first choose the operation the story calls for (with the bar model
 * to see which quantity is unknown), then compute. Understanding comes before calculating.
 */
export default function ProblemGame({ config, onSolved }: RoundProps<ProblemConfig>) {
  const [round] = useState(() => problemRound(config));
  const [op, setOp] = useState<ProblemRound["op"] | null>(null);
  const [wrongOps, setWrongOps] = useState<ProblemRound["op"][]>([]);
  const model = barModel(round);
  const total = Math.max(...[model.top, model.bottom].map((row) => row.reduce((sum, segment) => sum + segment.size, 0)));
  const { pick, wrong, solved, hint } = useAnswer(round.answer, (result) => onSolved({ ...result, mistakes: result.mistakes + wrongOps.length }),
    () => `Calcule ${round.a} ${round.op} ${round.b}.`);
  const schema = SCHEMA[round.kind];
  const schemaVisible = config.showSchema || op !== null;

  const chooseOp = (candidate: ProblemRound["op"]) => {
    if (op || wrongOps.includes(candidate)) return;
    if (candidate === round.op) {
      setOp(candidate);
      beep(760, 0.1);
      speakFrench(`Oui ! ${round.a} ${OP_WORD[candidate]} ${round.b}.`, 0.95);
    } else {
      setWrongOps([...wrongOps, candidate]);
      beep(220, 0.14);
    }
  };

  const row = (segments: Segment[], kind: "top" | "bottom") => (
    <div className={`b-row is-${kind}`}>
      {segments.map((segment, index) => (
        <span key={index} className={`b-segment ${segment.value === null ? "is-unknown" : ""}`} style={{ flexGrow: segment.size }}>
          {segment.value === null ? (solved ?? "?") : segment.value}
        </span>
      ))}
    </div>
  );

  return (
    <div className="m-game problem-game" data-scene={JSON.stringify({ op: round.op, answer: round.answer, kind: round.kind })}>
      <Prompt text={round.story} speech={`${round.story} ${round.question}`} />
      <p className="b-question">{round.question}</p>
      {schemaVisible && <p className="b-schema"><span aria-hidden="true">{schema.icon}</span> {schema.name}</p>}
      <div className="b-model" aria-hidden="true" style={{ width: `${Math.min(100, 50 + total * 2)}%` }}>
        {row(model.top, "top")}
        {row(model.bottom, "bottom")}
      </div>
      {!op
        ? (
          <>
            <p className="m-note">① Quel calcul faut-il faire ?</p>
            <div className="m-choices">
              {problemOps(config.kinds).map((candidate) => (
                <button key={candidate} className={`m-choice ${wrongOps.includes(candidate) ? "is-wrong" : ""}`} onClick={() => chooseOp(candidate)} disabled={wrongOps.includes(candidate)} aria-label={OP_WORD[candidate]}>
                  {candidate}
                </button>
              ))}
            </div>
            <Hint message={wrongOps.length ? `${config.showSchema ? "" : `${schema.sentence} `}${OP_HINT[round.kind]}${round.extra !== null ? ` Attention : le nombre ${round.extra} ne sert à rien ici.` : ""}` : ""} />
          </>
        )
        : (
          <>
            <p className="b-equation">② {round.a} {round.op} {round.b} = {solved ?? "?"}</p>
            <NumberChoices values={round.choices} onPick={pick} wrong={wrong} solved={solved} />
            <Hint message={hint} />
          </>
        )}
    </div>
  );
}
