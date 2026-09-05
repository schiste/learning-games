import { useEffect, useRef, useState, type ReactNode } from "react";
import { beep, fanfare } from "./audio";
import {
  activePlaces,
  bundleRound,
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

function DecimalCelebration({ title, onNext }: { title: string; onNext: () => void }) {
  useEffect(fanfare, []);
  return (
    <div className="celebration" aria-live="polite">
      <div className="decimal-confetti" aria-hidden="true"><span>1</span><span>10</span><span>100</span><span>1 000</span></div>
      <h2>{title}</h2>
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

function PlaceNumber({ number, complexity, hiddenIndex }: { number: number; complexity: Complexity; hiddenIndex?: number }) {
  const places = activePlaces(complexity);
  const digits = placeDigits(number, complexity);
  return (
    <div className={`place-number places-${places.length}`} aria-label={formatNumber(number)}>
      {places.map((place, index) => (
        <span className={`place-digit place-${place.color}`} key={place.value}>
          <small>{place.short}</small><strong>{hiddenIndex === index ? "?" : digits[index]}</strong>
        </span>
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
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const from = places[round.fromIndex];
  const to = places[round.toIndex];
  const singular = (name: string) => name === "unités" ? "unité" : name === "dizaines" ? "dizaine" : name === "centaines" ? "centaine" : "millier";
  const reset = () => {
    const next = bundleRound(complexity);
    setRound(next);
    setCounts(next.counts);
    setMessage("");
    setDone(false);
  };
  const bundle = () => {
    if (counts[round.fromIndex] < 10) {
      beep(200, 0.2);
      setMessage(`Il n’y a plus 10 ${from.name} à regrouper.`);
      return;
    }
    beep(620, 0.12);
    setCounts((values) => values.map((count, index) => (
      index === round.fromIndex ? count - 10 : index === round.toIndex ? count + 1 : count
    )));
    setMessage("");
  };
  const check = () => {
    if (counts[round.fromIndex] >= 10) {
      beep(200, 0.22);
      setMessage(`Tu peux encore échanger 10 ${from.name} contre 1 ${singular(to.name)}.`);
      return;
    }
    setDone(true);
  };
  if (done) return <DecimalCelebration title={`${formatNumber(round.target)} est bien rangé !`} onNext={reset} />;
  return (
    <section className="decimal-game-state bundles-game" data-scene={sceneData({ target: round.target, counts, places: places.map((place) => place.short) })}>
      <p className="instruction">Échange 10 {from.name} contre 1 {singular(to.name)}</p>
      <div className={`base-ten-workbench materials-${places.length}`}>
        {places.map((place, placeIndex) => (
          <div className={`place-material place-${place.color}`} key={place.value} aria-label={`${counts[placeIndex]} ${place.name}`}>
            <header><strong>{counts[placeIndex]}</strong><span>{place.name}</span></header>
            <div>
              {Array.from({ length: counts[placeIndex] }, (_, index) => <i className={`material material-${place.value}`} key={index}><span>{place.value}</span></i>)}
            </div>
          </div>
        ))}
      </div>
      <div className="bundle-actions">
        <button className="bundle-button" onClick={bundle}>Regrouper 10 {from.short}</button>
        <DecimalButton onClick={check}>J’ai fini</DecimalButton>
      </div>
      <DecimalFeedback message={message} />
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
    setDigits((values) => values.map((digit, digitIndex) => digitIndex === index ? (digit + amount + 10) % 10 : digit));
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
      <p className="instruction">Construis <strong>{formatNumber(target)}</strong> sur l’abaque</p>
      <div className={`decimal-abacus columns-${places.length}`}>
        {places.map((place, index) => (
          <div className={`abacus-column place-${place.color} ${wrong.includes(index) ? "is-wrong" : ""}`} key={place.value}>
            <button onClick={() => change(index, 1)} aria-label={`Ajouter une ${place.name.slice(0, -1)}`}>+</button>
            <strong>{digits[index]}</strong>
            <span>{place.short}</span>
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
    setMessage("Cette décomposition construit un autre nombre. Compare chaque position.");
  };
  if (done) return <DecimalCelebration title="Tu as retrouvé toutes les positions !" onNext={reset} />;
  return (
    <section className="decimal-game-state cards-game" data-scene={sceneData(round)}>
      <p className="instruction">Quelle carte fabrique <strong>{formatNumber(round.target)}</strong> ?</p>
      <PlaceNumber number={round.target} complexity={complexity} />
      <div className="expanded-cards">
        {round.options.map((option) => (
          <button key={option} className={wrong === option ? "is-wrong" : ""} onClick={() => pick(option)}>
            {expandedParts(option, complexity).map(formatNumber).join(" + ")}
          </button>
        ))}
      </div>
      <p className="decimal-help">Chaque zéro garde une position.</p>
      <DecimalFeedback message={message} />
    </section>
  );
}

function CounterGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => counterRound(complexity));
  const [done, setDone] = useState(false);
  const reset = () => { setRound(counterRound(complexity)); setDone(false); };
  if (done) return <DecimalCelebration title="Le compteur a bien avancé !" onNext={reset} />;
  return (
    <section className="decimal-game-state counter-game" data-scene={sceneData(round)}>
      <p className="instruction">Fais avancer le compteur</p>
      <div className="counter-machine"><PlaceNumber number={round.start} complexity={complexity} /><span>+ {round.operation}</span><strong>?</strong></div>
      <NumberChoices answer={round.answer} options={round.options} onCorrect={() => setDone(true)} hint="Observe quelle position change quand le compteur avance." />
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
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const reset = () => { setFirst(decimalNumber(complexity)); setWrong(null); setMessage(""); setDone(false); };
  const pick = (number: number) => {
    if (number === answer) { setDone(true); return; }
    beep(200, 0.23);
    setWrong(number);
    setMessage(`Compare d’abord les ${places[0].name}, puis avance vers la droite.`);
  };
  if (done) return <DecimalCelebration title={`${formatNumber(answer)} est bien le plus grand !`} onNext={reset} />;
  return (
    <section className="decimal-game-state compare-game" data-scene={sceneData({ first, second, answer })}>
      <p className="instruction">Tape le plus grand nombre</p>
      <div className="compare-board">
        {[first, second].map((number) => (
          <button key={number} className={wrong === number ? "is-wrong" : ""} onClick={() => pick(number)}><PlaceNumber number={number} complexity={complexity} /></button>
        ))}
      </div>
      <DecimalFeedback message={message} />
    </section>
  );
}

function LineGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => lineRound(complexity));
  const [done, setDone] = useState(false);
  const reset = () => { setRound(lineRound(complexity)); setDone(false); };
  if (done) return <DecimalCelebration title="La suite des nombres est complète !" onNext={reset} />;
  return (
    <section className="decimal-game-state number-line-game" data-scene={sceneData(round)}>
      <p className="instruction">Quel nombre manque sur la ligne ?</p>
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
  const current = history[history.length - 1];
  const moves = history.length - 1;
  const reset = () => {
    const next = machineRound(complexity);
    setRound(next); setHistory([next.start]); setWrong(null); setMessage(""); setDone(false);
  };
  const add = (operation: number) => {
    if (moves >= round.maxMoves) {
      setWrong(operation); setMessage("Tous les coups sont utilisés. Reviens en arrière pour changer."); beep(200, 0.2); return;
    }
    if (current + operation > round.target) {
      setWrong(operation); setMessage(`+ ${formatNumber(operation)} ferait dépasser la cible.`); beep(200, 0.2); return;
    }
    const next = current + operation;
    setHistory((values) => [...values, next]); setWrong(null); setMessage(""); beep(560, 0.08);
    if (next === round.target) setDone(true);
  };
  const undo = () => { setHistory((values) => values.length > 1 ? values.slice(0, -1) : values); setWrong(null); setMessage(""); };
  if (done) return <DecimalCelebration title="La machine est arrivée exactement au bon nombre !" onNext={reset} />;
  return (
    <section className="decimal-game-state machine-game" data-scene={sceneData({ start: round.start, current, target: round.target, moves, maxMoves: round.maxMoves })}>
      <p className="instruction">Transforme le nombre sans dépasser la cible</p>
      <div className="machine-display"><span>{formatNumber(current)}</span><i aria-hidden="true">→</i><strong>{formatNumber(round.target)}</strong></div>
      <PlaceNumber number={current} complexity={complexity} />
      <div className="machine-operations">
        {round.operations.map((operation) => <button key={operation} className={wrong === operation ? "is-wrong" : ""} onClick={() => add(operation)}>+ {formatNumber(operation)}</button>)}
      </div>
      <div className="machine-status">Coups <strong>{moves}/{round.maxMoves}</strong></div>
      <button className="undo-button" onClick={undo} disabled={history.length === 1}>↶ Revenir</button>
      <DecimalFeedback message={message} />
    </section>
  );
}

function DetectiveGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => detectiveRound(complexity));
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const pick = (index: number) => {
    if (!round.cards[index].correct) { setDone(true); return; }
    beep(200, 0.22); setWrong(index); setMessage("Cette carte dit vrai. Cherche celle qui change la valeur d’une position.");
  };
  const reset = () => { setRound(detectiveRound(complexity)); setWrong(null); setMessage(""); setDone(false); };
  if (done) return <DecimalCelebration title="Bien vu, l’erreur est démasquée !" onNext={reset} />;
  return (
    <section className="decimal-game-state detective-game" data-scene={sceneData({ number: round.number, falseCard: round.cards.findIndex((card) => !card.correct) })}>
      <p className="instruction">Trouve la seule carte fausse</p>
      <PlaceNumber number={round.number} complexity={complexity} />
      <div className="detective-cards">
        {round.cards.map((card, index) => <button key={card.text} className={wrong === index ? "is-wrong" : ""} onClick={() => pick(index)}>{card.text}</button>)}
      </div>
      <DecimalFeedback message={message} />
    </section>
  );
}

function CodeGame({ complexity }: { complexity: Complexity }) {
  const [target, setTarget] = useState(() => decimalNumber(complexity));
  const places = activePlaces(complexity);
  const targetDigits = placeDigits(target, complexity);
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const clues = codeClue(target, complexity);
  const enterDigit = (digit: string) => {
    if (input.length >= places.length) return;
    setInput((value) => value + digit); setWrong([]); setMessage(""); beep(520, 0.05);
  };
  const erase = () => { setInput((value) => value.slice(0, -1)); setWrong([]); setMessage(""); };
  const check = () => {
    if (input.length < places.length) { setMessage(`Il reste ${places.length - input.length} chiffre${places.length - input.length > 1 ? "s" : ""} à entrer.`); return; }
    const enteredDigits = input.split("").map(Number);
    const mismatches = enteredDigits.flatMap((digit, index) => digit === targetDigits[index] ? [] : [index]);
    if (mismatches.length) { beep(200, 0.24); setWrong(mismatches); setMessage(`Vérifie le chiffre des ${places[mismatches[0]].name}.`); return; }
    setDone(true);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) { event.preventDefault(); enterDigit(event.key); }
      else if (event.key === "Backspace") { event.preventDefault(); erase(); }
      else if (event.key === "Enter") { event.preventDefault(); check(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  const reset = () => { setTarget(decimalNumber(complexity)); setInput(""); setWrong([]); setMessage(""); setDone(false); };
  if (done) return <DecimalCelebration title={`${formatNumber(target)} : code trouvé !`} onNext={reset} />;
  return (
    <section className="decimal-game-state code-game" data-scene={sceneData({ target, input, clues })}>
      <p className="instruction">Écris le nombre décrit par le code</p>
      <div className="code-clues">{clues.map((clue, index) => <span className={`place-${places[index].color}`} key={clue}>{clue}</span>)}</div>
      <div className={`code-display places-${places.length}`} aria-label={`Code saisi : ${input || "vide"}`}>
        {places.map((place, index) => (
          <span className={`place-${place.color} ${wrong.includes(index) ? "is-wrong" : ""}`} key={place.value}><small>{place.short}</small><strong>{input[index] ?? "·"}</strong></span>
        ))}
      </div>
      <div className="digit-pad">
        {Array.from({ length: 10 }, (_, digit) => <button key={digit} onClick={() => enterDigit(String(digit))}>{digit}</button>)}
        <button className="erase-key" onClick={erase} aria-label="Effacer le dernier chiffre">⌫</button>
      </div>
      <DecimalButton onClick={check}>Vérifier le code</DecimalButton>
      <div className="keyboard-hint"><span aria-hidden="true">⌨</span>Tu peux aussi utiliser le clavier</div>
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
