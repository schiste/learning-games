import { useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useAnswer, useTimeouts, type RoundProps } from "../hooks";
import { blocksHint, blocksRound, PLACES, placeDigits, placesFor, type BlocksConfig } from "../logic";
import { Hint, NumberChoices, Prompt } from "../ui";

const SINGULAR = ["unité", "dizaine", "centaine", "millier"] as const;
const ONE = ["une unité", "une dizaine", "une centaine", "un millier"] as const;

/** Base-ten blocks for one place: cubes, rods of ten, plates of a hundred, big cubes of a thousand. */
function PlaceColumn({ place, count, exchanging, onAdd, onRemove }: {
  place: number;
  count: number;
  exchanging?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className={`pv-column pv-place-${place} ${exchanging ? "is-exchanging" : ""}`}>
      <span className="pv-label">{PLACES[place]}</span>
      <div className="pv-blocks" aria-label={`${count} ${count > 1 ? PLACES[place] : SINGULAR[place]}`}>
        {Array.from({ length: count }, (_, index) => <i key={index} className={`pv-block pv-block-${place}`} />)}
      </div>
      <strong className="pv-digit">{count}</strong>
      {onAdd && (
        <div className="pv-buttons">
          <button className="m-round-button is-small" onClick={onRemove} disabled={count === 0} aria-label={`Enlever ${ONE[place]}`}>−</button>
          <button className="m-round-button is-small" onClick={onAdd} aria-label={`Ajouter ${ONE[place]}`}>+</button>
        </div>
      )}
    </div>
  );
}

export default function BlocksGame(props: RoundProps<BlocksConfig>) {
  return props.config.mode === "build" ? <BuildBlocks {...props} /> : <ReadBlocks {...props} />;
}

/** Read: blocks are shown, the child finds the written number among classic look-alikes (34 / 43). */
function ReadBlocks({ config, onSolved }: RoundProps<BlocksConfig>) {
  const [round] = useState(() => blocksRound(config));
  const places = placesFor(config.max);
  const digits = placeDigits(round.target, places);
  const { pick, wrong, solved, hint } = useAnswer(round.target, onSolved, (picked) => blocksHint(picked, round.target) || "Compte d’abord les grands blocs, puis les petits.");
  return (
    <div className="m-game blocks-game" data-scene={JSON.stringify({ target: round.target, mode: "read" })}>
      <Prompt text="Quel nombre est construit ?" speech="Quel nombre est construit ? Compte les grands blocs, puis les petits." />
      <div className="pv-table">
        {digits.map((count, place) => ({ count, place })).reverse().map(({ count, place }) => <PlaceColumn key={place} place={place} count={count} />)}
      </div>
      <NumberChoices values={round.choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </div>
  );
}

/**
 * Build: the child makes the number with blocks. Ten of a kind are exchanged automatically
 * for one block of the next place, with an animation and a spoken explanation.
 */
function BuildBlocks({ config, onSolved }: RoundProps<BlocksConfig>) {
  const [round] = useState(() => blocksRound(config));
  const places = placesFor(config.max);
  const [counts, setCounts] = useState<number[]>(() => Array(places).fill(0));
  const latest = useRef<number[]>(counts);
  const [exchanging, setExchanging] = useState<number | null>(null);
  // Mirrors `exchanging` synchronously so rapid taps during the animation are ignored.
  const busy = useRef(false);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState("");
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const value = counts.reduce((sum, count, place) => sum + count * 10 ** place, 0);

  const apply = (next: number[]) => {
    latest.current = next;
    setCounts(next);
    setHint("");
  };

  const add = (place: number) => {
    if (solved || busy.current) return;
    const next = [...latest.current];
    next[place] += 1;
    // The table cannot show more than 9 of its biggest place (99 has no room for a hundred).
    const canTrade = place + 1 < places && latest.current[place + 1] < 9;
    if (next[place] === 10 && canTrade) {
      // Show the ten blocks, then trade them for one of the next place.
      beep(500 + place * 120, 0.06);
      busy.current = true;
      apply(next);
      setExchanging(place);
      speakFrench(`10 ${PLACES[place]}, c’est ${ONE[place + 1]} !`, 0.95);
      later(() => {
        const traded = [...latest.current];
        traded[place] = 0;
        traded[place + 1] += 1;
        apply(traded);
        setExchanging(null);
        busy.current = false;
      }, 1100);
      return;
    }
    if (next[place] > 9) {
      setHint(`Tu ne peux pas mettre plus de 9 ${PLACES[place]} ici.`);
      return;
    }
    beep(500 + place * 120, 0.06);
    apply(next);
  };

  const remove = (place: number) => {
    if (solved || busy.current || latest.current[place] === 0) return;
    const next = [...latest.current];
    next[place] -= 1;
    beep(300, 0.06);
    apply(next);
  };

  const check = () => {
    if (solved || busy.current) return;
    if (value === round.target) {
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench(`Bravo, ${round.target} !`, 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1100);
    } else {
      setMistakes(mistakes + 1);
      setHint(blocksHint(value, round.target));
      beep(220, 0.14);
    }
  };

  return (
    <div className="m-game blocks-game" data-scene={JSON.stringify({ target: round.target, built: value, mode: "build" })}>
      <Prompt text={`Construis le nombre ${round.target.toLocaleString("fr-FR")}.`} speech={`Construis le nombre ${round.target}.`}>
        <strong className="m-target">{round.target.toLocaleString("fr-FR")}</strong>
      </Prompt>
      <div className={`pv-table ${solved ? "is-solved" : ""}`}>
        {counts.map((count, place) => ({ count, place })).reverse().map(({ count, place }) => (
          <PlaceColumn key={place} place={place} count={count} exchanging={exchanging === place} onAdd={() => add(place)} onRemove={() => remove(place)} />
        ))}
      </div>
      <button className="m-primary" onClick={check} disabled={solved || exchanging !== null}>C’est bon !</button>
      <Hint message={hint} />
    </div>
  );
}
