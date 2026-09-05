import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { beep, fanfare } from "./audio";
import {
  activePlaces,
  bundleRound,
  carryExchanges,
  codeClue,
  counterRound,
  decimalNumber,
  detectiveRound,
  expandedParts,
  formatNumber,
  lineRound,
  machineRound,
  nearbyOptions,
  placeDigits,
  type Place,
} from "./decimalLogic";
import { type Complexity } from "./gameLogic";
import "./decimal.css";

type DecimalGameId = "bundles" | "abacus" | "cards" | "counter" | "compare" | "line" | "machine" | "detective" | "code";
type GameColor = "sky" | "sun" | "berry" | "leaf";
type DecimalGameInfo = { id: DecimalGameId; label: string; icon: string; color: GameColor };

const DISCOVER_GAMES: DecimalGameInfo[] = [
  { id: "bundles", label: "Les paquets", icon: "10", color: "leaf" },
  { id: "abacus", label: "L’abaque", icon: "▥", color: "sky" },
  { id: "cards", label: "Les cartes", icon: "≡", color: "sun" },
];

const TRAIN_GAMES: DecimalGameInfo[] = [
  { id: "counter", label: "Le compteur", icon: "+1", color: "berry" },
  { id: "compare", label: "Le plus grand", icon: "<", color: "leaf" },
  { id: "line", label: "La ligne", icon: "—", color: "sky" },
];

const MASTER_GAMES: DecimalGameInfo[] = [
  { id: "machine", label: "La machine", icon: "+10", color: "sun" },
  { id: "detective", label: "Le détective", icon: "!", color: "berry" },
  { id: "code", label: "Le code", icon: "#", color: "leaf" },
];

const ALL_DECIMAL_GAMES = [...DISCOVER_GAMES, ...TRAIN_GAMES, ...MASTER_GAMES];
const LEVELS: Array<{ value: Complexity; label: string; short: string }> = [
  { value: 1, label: "Dizaines et unités", short: "D · U" },
  { value: 2, label: "Avec les centaines", short: "C · D · U" },
  { value: 3, label: "Avec les milliers", short: "M · C · D · U" },
];

function useTimeouts() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return (callback: () => void, delay: number) => {
    timers.current.push(window.setTimeout(callback, delay));
  };
}

function DecimalFeedback({ message }: { message: string }) {
  return (
    <div className={`mistake-feedback ${message ? "is-visible" : ""}`} role="status" aria-live="polite">
      <span aria-hidden="true">↻</span><span>{message || "\u00a0"}</span>
    </div>
  );
}

function DecimalButton({ children, onClick, color = "leaf", disabled = false }: {
  children: ReactNode;
  onClick: () => void;
  color?: GameColor;
  disabled?: boolean;
}) {
  return <button className={`primary-button color-${color}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function DecimalCelebration({ title, onNext, children }: { title: string; onNext: () => void; children?: ReactNode }) {
  useEffect(fanfare, []);
  return (
    <div className="celebration" aria-live="polite">
      <div className="decimal-confetti" aria-hidden="true"><span>1</span><span>10</span><span>100</span><span>1 000</span></div>
      <h2>{title}</h2>
      {children}
      <DecimalButton onClick={onNext}>Encore !</DecimalButton>
    </div>
  );
}

function DecimalLevelPicker({ value, onChange }: { value: Complexity; onChange: (level: Complexity) => void }) {
  return (
    <div className="complexity-picker decimal-levels" aria-label="Choisir les positions travaillées">
      <span className="complexity-label">Niveau</span>
      {LEVELS.map((level) => (
        <button
          key={level.value}
          className={value === level.value ? "is-active" : ""}
          onClick={() => onChange(level.value)}
          aria-pressed={value === level.value}
          aria-label={`Niveau ${level.value} : ${level.label}`}
          title={level.label}
        >
          <span>{level.value}</span><small>{level.short}</small>
        </button>
      ))}
    </div>
  );
}

function sceneData(scene: object) {
  return JSON.stringify(scene);
}

function singularPlace(name: string) {
  if (name === "unités") return "unité";
  if (name === "dizaines") return "dizaine";
  if (name === "centaines") return "centaine";
  return "millier";
}

function PlaceKey({ complexity }: { complexity: Complexity }) {
  return (
    <div className="place-key" aria-label="Couleurs des positions">
      {activePlaces(complexity).map((place) => (
        <span className={`place-${place.color}`} key={place.value}><strong>{place.short}</strong> {place.name}</span>
      ))}
    </div>
  );
}

function PlaceNumber({ number, complexity, hiddenIndex, highlighted = [] }: {
  number: number;
  complexity: Complexity;
  hiddenIndex?: number;
  highlighted?: number[];
}) {
  const places = activePlaces(complexity);
  const digits = placeDigits(number, complexity);
  return (
    <div className={`place-number places-${places.length}`} aria-label={formatNumber(number)}>
      {places.map((place, index) => (
        <span className={`place-digit place-${place.color} ${highlighted.includes(index) ? "is-highlighted" : ""}`} key={place.value}>
          <small>{place.name}</small><strong>{hiddenIndex === index ? "?" : digits[index]}</strong>
        </span>
      ))}
    </div>
  );
}

type ExchangeStep = { from: Place; to: Place };

function ExchangeAnimation({ steps }: { steps: ExchangeStep[] }) {
  return (
    <div className="exchange-animation" role="status" aria-live="assertive">
      {steps.map((step, stepIndex) => (
        <div
          className={`exchange-step from-${step.from.color} to-${step.to.color} ${stepIndex === steps.length - 1 ? "is-last" : ""}`}
          style={{ "--step-delay": `${stepIndex * 1.15}s` } as CSSProperties}
          key={`${step.from.value}-${step.to.value}`}
        >
          <div className="exchange-objects" aria-hidden="true">
            <span className="exchange-one"><i className={`material material-${step.to.value}`}><span>{formatNumber(step.to.value)}</span></i></span>
            <span className="exchange-arrow">←</span>
            <span className="exchange-ten">
              {Array.from({ length: 10 }, (_, index) => <i className={`material material-${step.from.value}`} key={index}><span>{formatNumber(step.from.value)}</span></i>)}
            </span>
          </div>
          <strong>10 {step.from.name} deviennent 1 {singularPlace(step.to.name)}</strong>
        </div>
      ))}
    </div>
  );
}

function NumberChoices({ answer, options, onCorrect, hint }: {
  answer: number;
  options: number[];
  onCorrect: () => void;
  hint: string;
}) {
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const later = useTimeouts();
  const pick = (number: number) => {
    if (number === answer) {
      beep(880, 0.14);
      onCorrect();
      return;
    }
    beep(200, 0.24);
    setWrong(number);
    setMessage(hint);
    later(() => setWrong(null), 500);
  };
  return (
    <>
      <div className="decimal-choice-row">
        {options.map((number) => (
          <button key={number} className={wrong === number ? "is-wrong" : ""} onClick={() => pick(number)}>{formatNumber(number)}</button>
        ))}
      </div>
      <DecimalFeedback message={message} />
    </>
  );
}

function BundlesGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => bundleRound(complexity));
  const places = activePlaces(complexity);
  const [counts, setCounts] = useState(round.counts);
  const [exchanging, setExchanging] = useState(false);
  const [exchanged, setExchanged] = useState(false);
  const later = useTimeouts();
  const from = places[round.fromIndex];
  const to = places[round.toIndex];
  const reset = () => {
    const next = bundleRound(complexity);
    setRound(next);
    setCounts(next.counts);
    setExchanging(false);
    setExchanged(false);
  };
  const bundle = () => {
    if (exchanged || exchanging) return;
    beep(620, 0.12);
    setExchanging(true);
    later(() => {
      setCounts((values) => values.map((count, index) => (
        index === round.fromIndex ? count - 10 : index === round.toIndex ? count + 1 : count
      )));
      setExchanging(false);
      setExchanged(true);
      fanfare();
    }, 1400);
  };
  return (
    <section className="decimal-game-state bundles-game" data-scene={sceneData({ target: round.target, counts, exchanging, exchanged, places: places.map((place) => place.short) })}>
      <p className="instruction">{exchanging ? "Regarde l’échange" : `Touche le paquet de 10 ${from.name}`}</p>
      <div className="value-invariant"><span>La quantité vaut</span><strong>{formatNumber(round.target)}</strong><span>avant et après</span></div>
      {exchanging ? <ExchangeAnimation steps={[{ from, to }]} /> : (
        <div className={`base-ten-workbench materials-${places.length}`}>
          {places.map((place, placeIndex) => (
            <button
              className={`place-material place-${place.color} ${placeIndex === round.fromIndex && !exchanged ? "is-actionable" : ""}`}
              key={place.value}
              aria-label={`${counts[placeIndex]} ${place.name}${placeIndex === round.fromIndex && !exchanged ? ", toucher pour regrouper" : ""}`}
              onClick={placeIndex === round.fromIndex ? bundle : undefined}
              disabled={placeIndex !== round.fromIndex || exchanged}
            >
              <header><strong>{counts[placeIndex]}</strong><span>{place.name}</span></header>
              <div>
                {Array.from({ length: counts[placeIndex] }, (_, index) => (
                  <i className={`material material-${place.value} ${placeIndex === round.fromIndex && !exchanged && index < 10 ? "is-in-bundle" : ""}`} key={index}>
                    <span>{place.value}</span>
                  </i>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="bundle-actions">
        {!exchanged && !exchanging ? (
          <button className="bundle-button" onClick={bundle}>Transformer ces 10 {from.name}</button>
        ) : exchanged ? (
          <div className="exchange-result" role="status">
            <strong>10 {from.name} = 1 {singularPlace(to.name)}</strong>
            <span>La quantité vaut toujours {formatNumber(round.target)}.</span>
          </div>
        ) : null}
        {exchanged && <DecimalButton onClick={reset}>Un autre paquet</DecimalButton>}
      </div>
    </section>
  );
}

function AbacusGame({ complexity }: { complexity: Complexity }) {
  const [target, setTarget] = useState(() => decimalNumber(complexity));
  const places = activePlaces(complexity);
  const targetDigits = placeDigits(target, complexity);
  const [digits, setDigits] = useState(() => places.map(() => 0));
  const [wrong, setWrong] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const current = digits.reduce((sum, digit, index) => sum + digit * places[index].value, 0);
  const reset = () => {
    setTarget(decimalNumber(complexity));
    setDigits(places.map(() => 0));
    setWrong([]);
    setMessage("");
    setDone(false);
  };
  const change = (index: number, amount: number) => {
    const nextDigit = Math.min(9, Math.max(0, digits[index] + amount));
    if (nextDigit === digits[index]) {
      beep(200, 0.16);
      setMessage(`La colonne des ${places[index].name} reste entre 0 et 9.`);
      return;
    }
    setDigits((values) => values.map((digit, digitIndex) => digitIndex === index ? nextDigit : digit));
    setWrong([]);
    setMessage("");
    beep(500 + index * 70, 0.07);
  };
  const check = () => {
    const mismatches = digits.flatMap((digit, index) => digit === targetDigits[index] ? [] : [index]);
    if (mismatches.length) {
      beep(200, 0.24);
      setWrong(mismatches);
      setMessage(`Regarde la colonne des ${places[mismatches[0]].name}.`);
      return;
    }
    setDone(true);
  };
  if (done) return <DecimalCelebration title={`${formatNumber(target)} est bien construit !`} onNext={reset} />;
  return (
    <section className="decimal-game-state abacus-game" data-scene={sceneData({ target, current, digits })}>
      <p className="instruction">Reproduis ce nombre sur l’abaque</p>
      <div className="number-model"><span>Modèle</span><PlaceNumber number={target} complexity={complexity} /></div>
      <div className={`decimal-abacus columns-${places.length}`}>
        {places.map((place, index) => (
          <div className={`abacus-column place-${place.color} ${wrong.includes(index) ? "is-wrong" : ""}`} key={place.value}>
            <button onClick={() => change(index, 1)} aria-label={`Ajouter une ${place.name.slice(0, -1)}`}>+</button>
            <strong>{digits[index]}</strong>
            <span>{place.name}</span>
            <div className="abacus-beads" aria-hidden="true">{Array.from({ length: digits[index] }, (_, bead) => <i key={bead} />)}</div>
            <button onClick={() => change(index, -1)} aria-label={`Retirer une ${place.name.slice(0, -1)}`}>−</button>
          </div>
        ))}
      </div>
      <div className="current-number">Tu as construit <strong>{formatNumber(current)}</strong></div>
      <DecimalButton color="sky" onClick={check}>Vérifier l’abaque</DecimalButton>
      <DecimalFeedback message={message} />
    </section>
  );
}

function CardsGame({ complexity }: { complexity: Complexity }) {
  const makeRound = () => {
    const target = decimalNumber(complexity);
    return { target, options: nearbyOptions(target, complexity, complexity + 1) };
  };
  const [round, setRound] = useState(makeRound);
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const reset = () => {
    setRound(makeRound());
    setWrong(null);
    setMessage("");
    setDone(false);
  };
  const pick = (option: number) => {
    if (option === round.target) { setDone(true); return; }
    beep(200, 0.22);
    setWrong(option);
    setMessage(`Cette carte fabrique ${formatNumber(option)}, pas ${formatNumber(round.target)}. Compare les couleurs une par une.`);
  };
  if (done) return <DecimalCelebration title="Tu as retrouvé toutes les positions !" onNext={reset} />;
  return (
    <section className="decimal-game-state cards-game" data-scene={sceneData(round)}>
      <p className="instruction">Quelle carte fabrique <strong>{formatNumber(round.target)}</strong> ?</p>
      <PlaceNumber number={round.target} complexity={complexity} />
      <div className="expanded-cards">
        {round.options.map((option) => (
          <button key={option} className={wrong === option ? "is-wrong" : ""} onClick={() => pick(option)} aria-label={`${formatNumber(option)} décomposé`}>
            <span className="expanded-card-parts">
              {expandedParts(option, complexity).map((part, index) => (
                <span className={`place-${activePlaces(complexity)[index].color}`} key={`${option}-${index}`}>
                  <strong>{formatNumber(part)}</strong>
                  <small>{placeDigits(option, complexity)[index]} {activePlaces(complexity)[index].short}</small>
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
      <p className="decimal-help">Additionne les morceaux de couleur.</p>
      <DecimalFeedback message={message} />
    </section>
  );
}

function CounterGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => counterRound(complexity));
  const [advanced, setAdvanced] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [exchangeSteps, setExchangeSteps] = useState<ExchangeStep[]>([]);
  const later = useTimeouts();
  const places = activePlaces(complexity);
  const startDigits = placeDigits(round.start, complexity);
  const answerDigits = placeDigits(round.answer, complexity);
  const changed = answerDigits.flatMap((digit, index) => digit === startDigits[index] ? [] : [index]);
  const operationIndex = places.findIndex((place) => place.value === round.operation);
  const rolledIndex = operationIndex > 0 && startDigits[operationIndex] === 9 ? operationIndex : -1;
  const explanation = rolledIndex >= 0 && changed.length > 2
    ? "Chaque 9 devient 0 et fait avancer la colonne juste à sa gauche."
    : rolledIndex >= 0
    ? `9 ${places[rolledIndex].name} deviennent 0 : 1 ${singularPlace(places[rolledIndex - 1].name)} avance.`
    : `La colonne des ${places[operationIndex].name} avance de 1.`;
  const reset = () => { setRound(counterRound(complexity)); setAdvanced(false); setAnimating(false); setExchangeSteps([]); };
  const advance = () => {
    if (advanced || animating) return;
    beep(680, 0.13);
    const exchanges = carryExchanges(round.start, round.operation, complexity).map(({ fromIndex, toIndex }) => ({ from: places[fromIndex], to: places[toIndex] }));
    if (!exchanges.length) {
      setAdvanced(true);
      return;
    }
    setExchangeSteps(exchanges);
    setAnimating(true);
    const animationDuration = exchanges.length * 1150;
    later(() => setAdvanced(true), animationDuration - 160);
    later(() => { setAnimating(false); setExchangeSteps([]); }, animationDuration + 650);
  };
  return (
    <section className="decimal-game-state counter-game" data-scene={sceneData({ ...round, current: advanced ? round.answer : round.start, advanced, changed, animating, exchanges: exchangeSteps.map((step) => `${step.from.short}->${step.to.short}`) })}>
      <p className="instruction">{animating ? "Regarde la retenue avancer vers la gauche" : "Fais tourner le compteur d’un cran"}</p>
      <div className="counter-demo">
        <span className="counter-caption">{advanced ? "Après" : "Avant"}</span>
        <PlaceNumber number={advanced ? round.answer : round.start} complexity={complexity} highlighted={advanced ? changed : []} />
      </div>
      {animating ? <ExchangeAnimation steps={exchangeSteps} /> : !advanced ? (
        <button className="counter-action" onClick={advance}><span>Appuie ici</span><strong>+ {formatNumber(round.operation)}</strong></button>
      ) : (
        <div className="carry-explanation" role="status"><strong>{formatNumber(round.start)} + {formatNumber(round.operation)} = {formatNumber(round.answer)}</strong><span>{explanation}</span></div>
      )}
      {advanced && !animating && <DecimalButton color="berry" onClick={reset}>Faire avancer un autre compteur</DecimalButton>}
    </section>
  );
}

function CompareGame({ complexity }: { complexity: Complexity }) {
  const [first, setFirst] = useState(() => decimalNumber(complexity));
  const places = activePlaces(complexity);
  const maximum = 10 ** (complexity + 1) - 1;
  const delta = places[0].value - places[1].value;
  const second = first + delta <= maximum ? first + delta : first - delta;
  const answer = Math.max(first, second);
  const firstDigits = placeDigits(first, complexity);
  const secondDigits = placeDigits(second, complexity);
  const firstDifference = firstDigits.findIndex((digit, index) => digit !== secondDigits[index]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const reset = () => { setFirst(decimalNumber(complexity)); setWrong(null); setMessage(""); setDone(false); };
  const pick = (number: number) => {
    if (number === answer) { setDone(true); return; }
    beep(200, 0.23);
    setWrong(number);
    const equalPrefix = firstDifference > 0 ? `Les ${places.slice(0, firstDifference).map((place) => place.name).join(" et les ")} sont identiques. ` : "";
    setMessage(`${equalPrefix}Compare maintenant les ${places[firstDifference].name} : ${firstDigits[firstDifference]} et ${secondDigits[firstDifference]}.`);
  };
  if (done) return (
    <DecimalCelebration title={`${formatNumber(answer)} est bien le plus grand !`} onNext={reset}>
      <div className="comparison-proof">
        <strong>{formatNumber(answer)}</strong><span>&gt;</span><strong>{formatNumber(Math.min(first, second))}</strong>
        <small>Dans la colonne des {places[firstDifference].name}, {Math.max(firstDigits[firstDifference], secondDigits[firstDifference])} est plus grand que {Math.min(firstDigits[firstDifference], secondDigits[firstDifference])}.</small>
      </div>
    </DecimalCelebration>
  );
  return (
    <section className="decimal-game-state compare-game" data-scene={sceneData({ first, second, answer })}>
      <p className="instruction">Tape le plus grand nombre</p>
      <div className="compare-board">
        {[first, second].map((number) => (
          <button key={number} className={wrong === number ? "is-wrong" : ""} onClick={() => pick(number)}>
            <PlaceNumber number={number} complexity={complexity} highlighted={wrong !== null ? [firstDifference] : []} />
          </button>
        ))}
      </div>
      <DecimalFeedback message={message} />
    </section>
  );
}

function LineGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => lineRound(complexity));
  const [done, setDone] = useState(false);
  const step = round.values[1] - round.values[0];
  const reset = () => { setRound(lineRound(complexity)); setDone(false); };
  if (done) return <DecimalCelebration title="La suite des nombres est complète !" onNext={reset} />;
  return (
    <section className="decimal-game-state number-line-game" data-scene={sceneData(round)}>
      <p className="instruction">Quel nombre manque sur la ligne ?</p>
      <div className="line-rule">Chaque saut avance de <strong>+ {formatNumber(step)}</strong></div>
      <div className="decimal-number-line">
        {round.values.map((number, index) => <span className={index === round.missingIndex ? "is-missing" : ""} key={number}>{index === round.missingIndex ? "?" : formatNumber(number)}</span>)}
      </div>
      <NumberChoices answer={round.answer} options={round.options} onCorrect={() => setDone(true)} hint="Regarde le même saut entre chaque nombre." />
    </section>
  );
}

function MachineGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => machineRound(complexity));
  const [history, setHistory] = useState(() => [round.start]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [exchangeSteps, setExchangeSteps] = useState<ExchangeStep[]>([]);
  const [pending, setPending] = useState(false);
  const later = useTimeouts();
  const current = history[history.length - 1];
  const moves = history.length - 1;
  const places = activePlaces(complexity);
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const changedPlaces = previous === null ? [] : placeDigits(current, complexity).flatMap((digit, index) => (
    digit === placeDigits(previous, complexity)[index] ? [] : [index]
  ));
  const orderedOperations = [...round.operations].sort((first, second) => second - first);
  const reset = () => {
    const next = machineRound(complexity);
    setRound(next); setHistory([next.start]); setWrong(null); setMessage(""); setDone(false); setExchangeSteps([]); setPending(false);
  };
  const add = (operation: number) => {
    if (pending) return;
    if (moves >= round.maxMoves) {
      setWrong(operation); setMessage("Tous les coups sont utilisés. Reviens en arrière pour changer."); beep(200, 0.2); return;
    }
    if (current + operation > round.target) {
      setWrong(operation); setMessage(`+ ${formatNumber(operation)} ferait dépasser la cible.`); beep(200, 0.2); return;
    }
    const next = current + operation;
    const carries = carryExchanges(current, operation, complexity).map(({ fromIndex, toIndex }) => ({ from: places[fromIndex], to: places[toIndex] }));
    setWrong(null); setMessage(""); beep(560, 0.08);
    if (!carries.length) {
      setHistory((values) => [...values, next]);
      if (next === round.target) later(() => setDone(true), 550);
      return;
    }
    setPending(true);
    setExchangeSteps(carries);
    const animationDuration = carries.length * 1150;
    later(() => {
      setHistory((values) => [...values, next]);
    }, animationDuration - 160);
    later(() => {
      setPending(false);
      setExchangeSteps([]);
      if (next === round.target) setDone(true);
    }, animationDuration + 650);
  };
  const undo = () => {
    if (pending) return;
    setHistory((values) => values.length > 1 ? values.slice(0, -1) : values); setWrong(null); setMessage("");
  };
  if (done) return <DecimalCelebration title="La machine est arrivée exactement au bon nombre !" onNext={reset} />;
  return (
    <section className="decimal-game-state machine-game" data-scene={sceneData({ start: round.start, current, target: round.target, moves, maxMoves: round.maxMoves, pending, exchanges: exchangeSteps.map((step) => `${step.from.short}->${step.to.short}`) })}>
      <p className="instruction">Atteins la cible en {round.maxMoves} coups maximum</p>
      <div className="machine-display">
        <div><span>Tu es ici</span><PlaceNumber number={current} complexity={complexity} highlighted={changedPlaces} /></div>
        <i aria-hidden="true">→</i>
        <div><span>Cible</span><PlaceNumber number={round.target} complexity={complexity} /></div>
      </div>
      <div className="machine-distance">Il reste <strong>{formatNumber(round.target - current)}</strong> à ajouter</div>
      {pending ? <ExchangeAnimation steps={exchangeSteps} /> : (
        <div className={`machine-operations operations-${orderedOperations.length}`} aria-label="Ajouter par position, des milliers vers les unités">
          {orderedOperations.map((operation) => {
            const place = places.find((candidate) => candidate.value === operation)!;
            return <button key={operation} className={`place-${place.color} ${wrong === operation ? "is-wrong" : ""}`} onClick={() => add(operation)}><strong>+ {formatNumber(operation)}</strong><small>1 {singularPlace(place.name)}</small></button>;
          })}
        </div>
      )}
      <div className="machine-status" aria-label={`${moves} coups utilisés sur ${round.maxMoves}`}>
        {Array.from({ length: round.maxMoves }, (_, index) => <i className={index < moves ? "is-used" : ""} key={index} />)}
        <span>{round.maxMoves - moves} coup{round.maxMoves - moves > 1 ? "s" : ""} encore disponible{round.maxMoves - moves > 1 ? "s" : ""}</span>
      </div>
      <button className="undo-button" onClick={undo} disabled={history.length === 1 || pending}>↶ Revenir</button>
      <DecimalFeedback message={message} />
    </section>
  );
}

function DetectiveGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => detectiveRound(complexity));
  const places = activePlaces(complexity);
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const pick = (index: number) => {
    if (!round.cards[index].correct) { setDone(true); return; }
    beep(200, 0.22); setWrong(index); setMessage("Cette carte dit vrai. Cherche celle qui change la valeur d’une position.");
  };
  const reset = () => { setRound(detectiveRound(complexity)); setWrong(null); setMessage(""); setDone(false); };
  const cardLabel = (digits: number[]) => digits.map((digit, index) => `${digit} ${places[index].name}`).join(", ");
  if (done) return <DecimalCelebration title="Bien vu, l’erreur est démasquée !" onNext={reset} />;
  return (
    <section className="decimal-game-state detective-game" data-scene={sceneData({ number: round.number, falseCard: round.cards.findIndex((card) => !card.correct) })}>
      <p className="instruction">Trouve la seule carte fausse</p>
      <PlaceNumber number={round.number} complexity={complexity} />
      <div className="detective-cards">
        {round.cards.map((card, index) => (
          <button key={`${card.kind}-${index}`} className={wrong === index ? "is-wrong" : ""} onClick={() => pick(index)} aria-label={cardLabel(card.digits)}>
            <span className="detective-card-mark" aria-hidden="true">?</span>
            <span className={`detective-representation is-${card.kind}`}>
              {card.digits.map((digit, placeIndex) => (
                <span className={`place-${places[placeIndex].color}`} key={places[placeIndex].value}>
                  {card.kind === "products" ? (
                    <><strong>{digit} × {formatNumber(places[placeIndex].value)}</strong><small>{places[placeIndex].name}</small></>
                  ) : (
                    <><strong>{digit}</strong><small>{places[placeIndex].name}</small></>
                  )}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
      <DecimalFeedback message={message} />
    </section>
  );
}

function CodeGame({ complexity }: { complexity: Complexity }) {
  const [target, setTarget] = useState(() => decimalNumber(complexity));
  const places = activePlaces(complexity);
  const targetDigits = placeDigits(target, complexity);
  const [input, setInput] = useState<string[]>(() => places.map(() => ""));
  const [cursor, setCursor] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const clues = codeClue(target, complexity);
  const enterDigit = (digit: string) => {
    setInput((value) => value.map((current, index) => index === cursor ? digit : current));
    setCursor((current) => Math.min(places.length - 1, current + 1));
    setWrong([]); setMessage(""); beep(520, 0.05);
  };
  const erase = () => {
    if (input[cursor]) {
      setInput((value) => value.map((digit, index) => index === cursor ? "" : digit));
    } else if (cursor > 0) {
      setInput((value) => value.map((digit, index) => index === cursor - 1 ? "" : digit));
      setCursor((current) => current - 1);
    }
    setWrong([]); setMessage("");
  };
  const check = () => {
    const emptyIndex = input.findIndex((digit) => digit === "");
    if (emptyIndex >= 0) {
      const missing = input.filter((digit) => digit === "").length;
      setCursor(emptyIndex);
      setMessage(`Il reste ${missing} chiffre${missing > 1 ? "s" : ""} à placer. La case vide est prête.`);
      return;
    }
    const enteredDigits = input.map(Number);
    const mismatches = enteredDigits.flatMap((digit, index) => digit === targetDigits[index] ? [] : [index]);
    if (mismatches.length) {
      beep(200, 0.24); setWrong(mismatches); setCursor(mismatches[0]);
      setMessage(`Touche la case des ${places[mismatches[0]].name} et remplace son chiffre.`);
      return;
    }
    setDone(true);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) { event.preventDefault(); enterDigit(event.key); }
      else if (event.key === "Backspace") { event.preventDefault(); erase(); }
      else if (event.key === "Enter") { event.preventDefault(); check(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); setCursor((current) => Math.max(0, current - 1)); }
      else if (event.key === "ArrowRight") { event.preventDefault(); setCursor((current) => Math.min(places.length - 1, current + 1)); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  const reset = () => { setTarget(decimalNumber(complexity)); setInput(places.map(() => "")); setCursor(0); setWrong([]); setMessage(""); setDone(false); };
  if (done) return <DecimalCelebration title={`${formatNumber(target)} : code trouvé !`} onNext={reset} />;
  return (
    <section className="decimal-game-state code-game" data-scene={sceneData({ target, input: input.join(""), cursor, clues })}>
      <p className="instruction">Écris le nombre décrit par le code</p>
      <div className="code-clues">{clues.map((clue, index) => <span className={`place-${places[index].color}`} key={clue}>{clue}</span>)}</div>
      <div className={`code-display places-${places.length}`} aria-label={`Code saisi : ${input.join("") || "vide"}`}>
        {places.map((place, index) => (
          <button
            className={`place-${place.color} ${cursor === index ? "is-current" : ""} ${wrong.includes(index) ? "is-wrong" : ""}`}
            key={place.value}
            onClick={() => setCursor(index)}
            aria-label={`Modifier les ${place.name}${input[index] ? `, chiffre ${input[index]}` : ", case vide"}`}
          >
            <small>{place.name}</small><strong>{input[index] || "·"}</strong>
          </button>
        ))}
      </div>
      <div className="code-current-cue">Choisis le chiffre des <strong>{places[cursor].name}</strong></div>
      <div className="digit-pad">
        {Array.from({ length: 10 }, (_, digit) => <button key={digit} onClick={() => enterDigit(String(digit))}>{digit}</button>)}
        <button className="erase-key" onClick={erase} aria-label="Effacer le dernier chiffre">⌫</button>
      </div>
      <DecimalButton onClick={check}>Vérifier le code</DecimalButton>
      <div className="keyboard-hint"><span aria-hidden="true">⌨</span>Clavier : chiffres, flèches et Entrée</div>
      <DecimalFeedback message={message} />
    </section>
  );
}

function DecimalNav({ game, onSelect }: { game: DecimalGameId; onSelect: (game: DecimalGameId) => void }) {
  const group = (label: string, games: DecimalGameInfo[]) => (
    <div className="nav-group">
      <span className="nav-label">{label}</span>
      <div className="nav-options">
        {games.map((item) => (
          <button key={item.id} className={`game-tab color-${item.color} ${game === item.id ? "is-active" : ""}`} onClick={() => onSelect(item.id)} aria-pressed={game === item.id}>
            <span className="tab-icon" aria-hidden="true">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
    </div>
  );
  return <nav className="game-nav decimal-game-nav" aria-label="Choisir un jeu sur les nombres">{group("Je découvre", DISCOVER_GAMES)}{group("Je m’entraîne", TRAIN_GAMES)}{group("Je maîtrise", MASTER_GAMES)}</nav>;
}

export default function DecimalPage() {
  const [game, setGame] = useState<DecimalGameId>("bundles");
  const [levels, setLevels] = useState<Record<DecimalGameId, Complexity>>({
    bundles: 1, abacus: 1, cards: 1, counter: 1, compare: 1, line: 1, machine: 1, detective: 1, code: 1,
  });
  const selected = ALL_DECIMAL_GAMES.find((item) => item.id === game)!;
  const complexity = levels[game];
  return (
    <>
      <DecimalNav game={game} onSelect={setGame} />
      <section className={`game-stage decimal-stage accent-${selected.color}`} aria-label={selected.label} data-decimal-game={game} data-complexity={complexity}>
        <div className="stage-title">
          <div className="stage-name"><span>{selected.icon}</span><h2>{selected.label}</h2></div>
          <DecimalLevelPicker value={complexity} onChange={(level) => setLevels((current) => ({ ...current, [game]: level }))} />
        </div>
        <PlaceKey complexity={complexity} />
        <div className="stage-body decimal-stage-body" key={`${game}-${complexity}`}>
          {game === "bundles" && <BundlesGame complexity={complexity} />}
          {game === "abacus" && <AbacusGame complexity={complexity} />}
          {game === "cards" && <CardsGame complexity={complexity} />}
          {game === "counter" && <CounterGame complexity={complexity} />}
          {game === "compare" && <CompareGame complexity={complexity} />}
          {game === "line" && <LineGame complexity={complexity} />}
          {game === "machine" && <MachineGame complexity={complexity} />}
          {game === "detective" && <DetectiveGame complexity={complexity} />}
          {game === "code" && <CodeGame complexity={complexity} />}
        </div>
      </section>
    </>
  );
}
