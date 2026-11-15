import { useEffect, useState } from "react";
import { flashRound, type FlashConfig } from "../logic";
import { Hint, NumberChoices, Prompt } from "../ui";
import { useAnswer, type RoundProps } from "../hooks";
import { Dice, TenFrame } from "../visuals";

/**
 * Subitizing: the quantity is shown briefly so the child recognises its shape
 * (dice pattern, or "5 and some more" on a ten-frame) instead of counting one by one.
 */
export default function FlashGame({ config, onSolved }: RoundProps<FlashConfig>) {
  const [round] = useState(() => flashRound(config));
  const [visible, setVisible] = useState(true);
  const { pick, wrong, solved, hint } = useAnswer(round.count, onSolved, () =>
    config.pattern === "frame"
      ? "Regarde encore : une ligne pleine, c’est 5. Combien en plus ?"
      : "Regarde encore la forme des points.",
  );

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), config.showMs);
    return () => window.clearTimeout(timer);
  }, [visible, config.showMs]);

  const showing = visible || solved !== null;
  return (
    <div className="m-game flash-game" data-scene={JSON.stringify({ count: round.count, visible: showing })}>
      <Prompt text="Combien de points ? Regarde vite !" speech="Regarde bien. Combien de points ?" />
      <div className={`flash-card ${showing ? "is-showing" : "is-hidden"}`}>
        {showing
          ? config.pattern === "dice" ? <Dice value={round.count} /> : <TenFrame filled={round.count} />
          : <button className="m-secondary" onClick={() => setVisible(true)}>👀 Revoir</button>}
      </div>
      <NumberChoices values={round.choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </div>
  );
}
