import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { countRound, type CountConfig } from "../logic";
import { Hint, NumberChoices, Prompt } from "../ui";
import { useAnswer, type RoundProps } from "../hooks";

/**
 * Counting with one-to-one correspondence: each tap marks an object and says the next number.
 * When everything is marked, the last number spoken is the answer (cardinality).
 */
export default function CountGame({ config, onSolved }: RoundProps<CountConfig>) {
  const [round] = useState(() => countRound(config));
  const [tapped, setTapped] = useState<number[]>([]);
  const allCounted = tapped.length === round.count;
  const { pick, wrong, solved, hint } = useAnswer(round.count, onSolved, () =>
    allCounted
      ? `Tu as compté jusqu’à ${round.count}. Le dernier nombre dit combien il y en a.`
      : "Touche chaque objet une seule fois en comptant : un, deux, trois…",
  );

  // The ref sees every tap immediately, so quick successive taps each count.
  const latest = useRef<number[]>([]);
  const tap = (cell: number) => {
    if (latest.current.includes(cell)) return;
    latest.current = [...latest.current, cell];
    setTapped(latest.current);
    beep(440 + latest.current.length * 30, 0.06);
    speakFrench(String(latest.current.length), 1);
  };

  return (
    <div className="m-game count-game" data-scene={JSON.stringify({ count: round.count, tapped: tapped.length })}>
      <Prompt text={`Combien y a-t-il de ${round.thing} ?`} speech="Combien y en a-t-il ? Touche chaque objet pour compter." />
      <div className="count-field" role="group" aria-label="Objets à compter">
        {Array.from({ length: round.gridSize }, (_, cell) => {
          if (!round.cells.includes(cell)) return <span key={cell} className="count-cell" />;
          const order = tapped.indexOf(cell);
          return (
            <button key={cell} className={`count-cell count-thing ${order >= 0 ? "is-counted" : ""}`} onClick={() => tap(cell)} aria-label={order >= 0 ? `compté : ${order + 1}` : "objet à compter"}>
              <span aria-hidden="true">{round.thing}</span>
              {order >= 0 && <b>{order + 1}</b>}
            </button>
          );
        })}
      </div>
      <p className="m-note" aria-live="polite">{allCounted && solved === null ? "Tout est compté ! Quel est le dernier nombre ?" : " "}</p>
      <NumberChoices values={round.choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </div>
  );
}
