import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { coinsRound, fewestCoins, type CoinsConfig } from "../everyday";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { Hint, Prompt } from "../ui";

function Money({ value, small = false }: { value: number; small?: boolean }) {
  const note = value >= 5;
  return <span className={`money ${note ? "is-note" : "is-coin"} money-${value} ${small ? "is-small" : ""}`}>{value} €</span>;
}

/** Pay the exact price with coins and notes; afterwards, see the way with the fewest pieces. */
export default function CoinsGame({ config, onSolved }: RoundProps<CoinsConfig>) {
  const [round] = useState(() => coinsRound(config));
  const [paid, setPaid] = useState<number[]>([]);
  const latest = useRef<number[]>([]);
  const [hint, setHint] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const total = paid.reduce((sum, value) => sum + value, 0);

  const apply = (next: number[]) => {
    latest.current = next;
    setPaid(next);
    setHint("");
  };

  const add = (value: number) => {
    if (solved) return;
    beep(600, 0.05);
    apply([...latest.current, value]);
  };

  const remove = (index: number) => {
    if (solved) return;
    beep(320, 0.05);
    apply(latest.current.filter((_, position) => position !== index));
  };

  const pay = () => {
    if (solved) return;
    if (total === round.price) {
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench(`Merci ! Tu as payé ${round.price} euros.`, 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1800);
      return;
    }
    setMistakes(mistakes + 1);
    beep(220, 0.14);
    setHint(total < round.price ? `Tu as donné ${total} €. Il manque ${round.price - total} €.` : `Tu as donné ${total} €, c’est ${total - round.price} € de trop.`);
  };

  const best = fewestCoins(round.price, config.values);
  return (
    <div className="m-game coins-game" data-scene={JSON.stringify({ price: round.price, total })}>
      <Prompt text={`Paie exactement ${round.price} €.`} speech={`Ça coûte ${round.price} euros. Paie exactement ${round.price} euros.`}>
        <span className="shop-tag"><span aria-hidden="true">{round.item}</span><strong>{round.price} €</strong></span>
      </Prompt>
      <div className={`money-tray ${solved ? "is-solved" : ""}`} aria-label={`Payé : ${total} euros`}>
        {paid.length === 0 && <small>Touche les pièces et les billets pour payer.</small>}
        {paid.map((value, index) => (
          <button key={index} className="money-button" onClick={() => remove(index)} aria-label={`Reprendre ${value} euros`}><Money value={value} small /></button>
        ))}
        <b className="money-total">{total} €</b>
      </div>
      <div className="money-bank">
        {config.values.map((value) => (
          <button key={value} className="money-button" onClick={() => add(value)} aria-label={`Donner ${value} euros`} disabled={solved}><Money value={value} /></button>
        ))}
      </div>
      <button className="m-primary" onClick={pay} disabled={solved}>Payer</button>
      {solved && best.length < paid.length && <p className="m-note">Astuce : avec {best.length} pièce{best.length > 1 ? "s" : ""} seulement : {best.join(" € + ")} €.</p>}
      <Hint message={hint} />
    </div>
  );
}
