import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { bondsHint, bondsRound, type BondsConfig } from "../logic";
import { Hint, NumberChoices, Prompt } from "../ui";
import { useAnswer, type RoundProps } from "../hooks";
import { TenFrame } from "../visuals";

/**
 * Number houses: a whole split into two parts. With the frame, missing cells can be tapped
 * to fill them (and counted aloud); without it, the child works from memory.
 */
export default function BondsGame({ config, onSolved }: RoundProps<BondsConfig>) {
  const [round] = useState(() => bondsRound(config));
  const [added, setAdded] = useState(0);
  const { pick, wrong, solved, hint } = useAnswer(round.missing, onSolved, (picked) => bondsHint(round.part, picked, round.total, config.frame));
  const choices = round.choices.filter((value) => value >= 1 && value < round.total);

  // The ref sees every tap immediately, so quick successive taps each count.
  const latest = useRef(0);
  const fill = () => {
    if (latest.current >= round.missing) return;
    latest.current += 1;
    setAdded(latest.current);
    beep(580 + latest.current * 30, 0.06);
    speakFrench(String(latest.current), 1);
  };

  return (
    <div className="m-game bonds-game" data-scene={JSON.stringify({ total: round.total, part: round.part, added })}>
      <Prompt text={`${round.part} et combien font ${round.total} ?`} speech={`${round.part} et combien, pour faire ${round.total} ?`} />
      <div className="m-house" aria-label={`Maison du ${round.total}`}>
        <div className="m-house-roof"><strong>{round.total}</strong></div>
        <div className="m-house-rooms">
          <span className="m-house-room">{round.part}</span>
          <span className={`m-house-room is-missing ${solved !== null ? "is-found" : ""}`}>{solved ?? "?"}</span>
        </div>
      </div>
      {config.frame && (
        <>
          <TenFrame size={round.total <= 5 ? 5 : 10} limit={round.total} filled={round.part} added={solved !== null ? round.missing : added} onTapEmpty={solved === null ? fill : undefined} />
          <p className="m-note">{added === 0 && solved === null ? "Touche les cases vides pour les remplir." : " "}</p>
        </>
      )}
      <NumberChoices values={choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </div>
  );
}
