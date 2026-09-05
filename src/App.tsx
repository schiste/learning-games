import { useEffect, useRef, useState } from "react";
import { beep, fanfare } from "./audio";
import {
  answerOptions,
  basketRound,
  holeQuestion,
  memoryDeck,
  randomInt,
  randomStart,
  type MemoryCard,
} from "./gameLogic";

type GameId = "box" | "hands" | "basket" | "holes" | "pairs" | "timer";
type Color = "sky" | "sun" | "berry" | "leaf";
type GameInfo = { id: GameId; label: string; icon: string; color: Color };

const BEGINNER_GAMES: GameInfo[] = [
  { id: "box", label: "La boîte", icon: "●", color: "sky" },
  { id: "hands", label: "Les mains", icon: "✋", color: "sun" },
  { id: "basket", label: "Le panier", icon: "●●", color: "berry" },
];

const EXPERT_GAMES: GameInfo[] = [
  { id: "holes", label: "Les trous", icon: "?", color: "leaf" },
  { id: "pairs", label: "Les paires", icon: "◆", color: "sky" },
  { id: "timer", label: "Le chrono", icon: "60", color: "berry" },
];

function useTimeouts() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  };
}

function PrimaryButton({ children, onClick, color = "leaf" }: {
  children: React.ReactNode;
  onClick: () => void;
  color?: Color;
}) {
  return <button className={`primary-button color-${color}`} onClick={onClick}>{children}</button>;
}

function Celebration({ onNext, title = "Bravo, ça fait 10 !" }: { onNext: () => void; title?: string }) {
  useEffect(fanfare, []);
  return (
    <div className="celebration" aria-live="polite">
      <div className="stars" aria-hidden="true"><span>★</span><span>★</span><span>★</span></div>
      <h2>{title}</h2>
      <PrimaryButton onClick={onNext}>Encore !</PrimaryButton>
    </div>
  );
}

function AdultCounter({ a, b, hidden = false }: { a: number; b: number; hidden?: boolean }) {
  return <div className="adult-counter" aria-label="Repère pour l’adulte">{hidden ? `${a} + ? = 10` : `${a} + ${b}`}</div>;
}

function Question({ answer, onCorrect }: { answer: number; onCorrect: () => void }) {
  const [options] = useState(() => answerOptions(answer));
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const later = useTimeouts();

  const pick = (number: number) => {
    if (number === answer) {
      beep(880, 0.14);
      onCorrect();
      return;
    }
    beep(200, 0.25);
    setWrong(number);
    setMessage("Essaie encore.");
    later(() => setWrong(null), 450);
  };

  return (
    <section className="question-panel">
      <p className="instruction">Combien en as-tu ajouté ?</p>
      <div className="choice-row">
        {options.map((number) => (
          <button
            key={number}
            className={`number-choice ${wrong === number ? "is-wrong" : ""}`}
            onClick={() => pick(number)}
            aria-label={`${number}`}
          >
            <strong>{number}</strong>
            <span className="mini-dots" aria-hidden="true">
              {Array.from({ length: number }, (_, index) => <i key={index} />)}
            </span>
          </button>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">{message}</span>
    </section>
  );
}

function BoxGame() {
  const [start, setStart] = useState(randomStart);
  const [filled, setFilled] = useState(0);
  const [done, setDone] = useState(false);
  const total = start + filled;

  const reset = () => {
    setStart(randomStart());
    setFilled(0);
    setDone(false);
  };

  if (done) return <Celebration onNext={reset} />;
  if (total === 10) return <Question answer={filled} onCorrect={() => setDone(true)} />;

  return (
    <section className="game-content">
      <p className="instruction">Remplis la boîte jusqu’à 10</p>
      <div className="ten-frame" aria-label={`${total} jetons sur 10`}>
        {Array.from({ length: 10 }, (_, index) => {
          const starter = index < start;
          const added = index >= start && index < total;
          return (
            <button
              key={index}
              className="ten-cell"
              disabled={starter || added}
              onClick={() => {
                beep(500 + total * 40);
                setFilled((value) => value + 1);
              }}
              aria-label={starter || added ? "Case remplie" : "Ajouter un jeton"}
            >
              {(starter || added) && <span className={`counter ${starter ? "blue" : "yellow"}`} />}
            </button>
          );
        })}
      </div>
      <AdultCounter a={start} b={filled} />
    </section>
  );
}

function Hand({ raised, side, onTap }: { raised: number; side: "gauche" | "droite"; onTap: () => void }) {
  const heights = [58, 78, 88, 80, 64];
  const order = side === "gauche" ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
  return (
    <svg className="hand" viewBox="0 0 190 200" role="img" aria-label={`Main ${side}, ${raised} doigts levés`}>
      <rect x="40" y="110" width="110" height="80" rx="30" className="palm" />
      {order.map((finger, index) => {
        const isRaised = finger < raised;
        const height = isRaised ? heights[finger] : 27;
        const x = 45 + index * 22;
        return (
          <g
            key={finger}
            className={isRaised ? "finger raised" : "finger"}
            onClick={() => !isRaised && onTap()}
            role={isRaised ? undefined : "button"}
            tabIndex={isRaised ? undefined : 0}
            aria-label={isRaised ? undefined : "Lever ce doigt"}
            onKeyDown={(event) => {
              if (!isRaised && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onTap();
              }
            }}
          >
            <rect x={x} y={125 - height} width="18" height={height + 10} rx="9" />
          </g>
        );
      })}
    </svg>
  );
}

function HandsGame() {
  const [start, setStart] = useState(randomStart);
  const [added, setAdded] = useState(0);
  const [done, setDone] = useState(false);
  const total = start + added;
  const tap = () => {
    if (total >= 10) return;
    beep(400 + total * 50);
    setAdded((value) => value + 1);
  };
  const reset = () => {
    setStart(randomStart());
    setAdded(0);
    setDone(false);
  };

  if (done) return <Celebration onNext={reset} />;
  if (total === 10) return <Question answer={added} onCorrect={() => setDone(true)} />;

  return (
    <section className="game-content">
      <p className="instruction">Lève les doigts jusqu’à 10</p>
      <div className="hands-wrap">
        <Hand raised={Math.min(5, total)} side="gauche" onTap={tap} />
        <Hand raised={Math.max(0, total - 5)} side="droite" onTap={tap} />
      </div>
      <AdultCounter a={start} b={added} />
    </section>
  );
}

function AppleBasket({ number, onClick, wrong }: { number: number; onClick: () => void; wrong: boolean }) {
  return (
    <button
      className={`apple-basket ${wrong ? "is-wrong" : ""}`}
      onClick={onClick}
      aria-label={`Panier de ${number} pommes`}
    >
      {Array.from({ length: number }, (_, index) => <span className="apple" key={index} />)}
      <span className="basket-weave" aria-hidden="true" />
    </button>
  );
}

function BasketGame() {
  const [round, setRound] = useState(basketRound);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const later = useTimeouts();

  const pick = (number: number) => {
    if (number === round.need) {
      setDone(true);
      return;
    }
    beep(200, 0.25);
    setWrong(number);
    later(() => setWrong(null), 450);
  };

  if (done) return (
    <Celebration onNext={() => {
      setRound(basketRound());
      setDone(false);
    }} />
  );

  return (
    <section className="game-content">
      <p className="instruction">Quel panier remplit la boîte ?</p>
      <div className="ten-frame compact" aria-label={`${round.start} jetons sur 10`}>
        {Array.from({ length: 10 }, (_, index) => (
          <span className="ten-cell" key={index}>
            {index < round.start && <span className="counter blue" />}
          </span>
        ))}
      </div>
      <div className="basket-row">
        {round.options.map((number) => (
          <AppleBasket key={number} number={number} onClick={() => pick(number)} wrong={wrong === number} />
        ))}
      </div>
      <AdultCounter a={round.start} b={round.need} hidden />
    </section>
  );
}

function NumberPad({ onPick, wrong }: { onPick: (number: number) => void; wrong: number | null }) {
  return (
    <div className="number-pad">
      {Array.from({ length: 11 }, (_, number) => (
        <button
          key={number}
          className={wrong === number ? "is-wrong" : ""}
          onClick={() => onPick(number)}
        >{number}</button>
      ))}
    </div>
  );
}

function HolesGame() {
  const [question, setQuestion] = useState(holeQuestion);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const later = useTimeouts();

  const pick = (number: number) => {
    if (number === question.answer) {
      beep(880, 0.15);
      setScore((value) => value + 1);
      setRevealed(true);
      later(() => {
        setRevealed(false);
        setQuestion(holeQuestion());
      }, 550);
      return;
    }
    beep(200, 0.25);
    setWrong(number);
    later(() => setWrong(null), 450);
  };

  return (
    <section className="game-content">
      <p className="instruction">Trouve le nombre caché</p>
      <div className={`equation ${revealed ? "is-correct" : ""}`} aria-live="polite">
        {revealed ? question.text.replace("?", String(question.answer)) : question.text}
      </div>
      <NumberPad onPick={pick} wrong={wrong} />
      <div className="score">Réussites <strong>{score}</strong></div>
    </section>
  );
}

function PairsGame() {
  const [cards, setCards] = useState(memoryDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [locked, setLocked] = useState(false);
  const later = useTimeouts();
  const done = found.length === cards.length;

  const flip = (card: MemoryCard) => {
    if (locked || open.includes(card.id) || found.includes(card.id)) return;
    beep(600, 0.08);
    const next = [...open, card.id];
    setOpen(next);
    if (next.length !== 2) return;
    setLocked(true);
    setTries((value) => value + 1);
    const first = cards.find((item) => item.id === next[0])!;
    if (first.value + card.value === 10) {
      later(() => {
        beep(900, 0.15);
        setFound((value) => [...value, first.id, card.id]);
        setOpen([]);
        setLocked(false);
      }, 420);
    } else {
      later(() => {
        setOpen([]);
        setLocked(false);
      }, 900);
    }
  };

  if (done) return (
    <Celebration
      title={`Toutes les paires en ${tries} essais !`}
      onNext={() => {
        setCards(memoryDeck());
        setOpen([]);
        setFound([]);
        setTries(0);
      }}
    />
  );

  return (
    <section className="game-content">
      <p className="instruction">Retourne deux cartes qui font 10</p>
      <div className="memory-grid">
        {cards.map((card) => {
          const shown = open.includes(card.id) || found.includes(card.id);
          const matched = found.includes(card.id);
          return (
            <button
              key={card.id}
              className={`memory-card ${shown ? "is-open" : ""} ${matched ? "is-matched" : ""}`}
              onClick={() => flip(card)}
              aria-label={shown ? `${card.value}` : "Carte cachée"}
              disabled={matched}
            >
              <span className="card-back" aria-hidden="true">✦</span>
              <span className="card-front">{card.value}</span>
            </button>
          );
        })}
      </div>
      <div className="score">Essais <strong>{tries}</strong></div>
    </section>
  );
}

function TimerGame() {
  const [state, setState] = useState<"idle" | "running" | "ended">("idle");
  const [time, setTime] = useState(60);
  const [number, setNumber] = useState(() => randomInt(0, 10));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(window.localStorage.getItem("learning-games-best") ?? 0));
  const [wrong, setWrong] = useState<number | null>(null);
  const later = useTimeouts();

  useEffect(() => {
    if (state !== "running") return;
    const timer = window.setTimeout(() => {
      const nextTime = time - 1;
      setTime(nextTime);
      if (nextTime === 0) {
        setState("ended");
        setBest((current) => {
          const next = Math.max(current, score);
          window.localStorage.setItem("learning-games-best", String(next));
          return next;
        });
        fanfare();
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [score, state, time]);

  const start = () => {
    setScore(0);
    setTime(60);
    setNumber(randomInt(0, 10));
    setState("running");
  };

  const pick = (answer: number) => {
    if (answer === 10 - number) {
      beep(880, 0.1);
      setScore((value) => value + 1);
      setNumber(randomInt(0, 10));
      return;
    }
    beep(200, 0.25);
    setWrong(answer);
    later(() => setWrong(null), 400);
  };

  if (state !== "running") {
    return (
      <section className="timer-intro">
        <span className="timer-icon" aria-hidden="true">60</span>
        {state === "ended" && <h2>{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""}</h2>}
        <p>Combien de compléments trouveras-tu en une minute ?</p>
        {best > 0 && <div className="record">Ton record · {best}</div>}
        <PrimaryButton color="berry" onClick={start}>{state === "ended" ? "Rejouer" : "C’est parti !"}</PrimaryButton>
      </section>
    );
  }

  return (
    <section className="game-content">
      <div className="timer-status"><span>Temps <strong>{time}</strong></span><span>Score <strong>{score}</strong></span></div>
      <div className="equation">{number} + ? = 10</div>
      <NumberPad onPick={pick} wrong={wrong} />
    </section>
  );
}

function GameNav({ game, onSelect }: { game: GameId; onSelect: (game: GameId) => void }) {
  const group = (label: string, games: GameInfo[]) => (
    <div className="nav-group">
      <span className="nav-label">{label}</span>
      <div className="nav-options">
        {games.map((item) => (
          <button
            key={item.id}
            className={`game-tab color-${item.color} ${game === item.id ? "is-active" : ""}`}
            onClick={() => onSelect(item.id)}
            aria-pressed={game === item.id}
          >
            <span aria-hidden="true">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
    </div>
  );
  return <nav className="game-nav" aria-label="Choisir un jeu">{group("Je découvre", BEGINNER_GAMES)}{group("Je m’entraîne", EXPERT_GAMES)}</nav>;
}

export default function App() {
  const [game, setGame] = useState<GameId>("box");
  const selected = [...BEGINNER_GAMES, ...EXPERT_GAMES].find((item) => item.id === game)!;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./" aria-label="Dix sur dix, accueil">
          <span className="brand-mark" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
          </span>
          <span><strong>Dix sur dix</strong><small>Jouer · comprendre · grandir</small></span>
        </a>
        <a className="source-link" href="https://github.com/schiste/learning-games">Projet libre <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="intro">
          <p className="eyebrow">Les compléments à 10</p>
          <h1>À toi de jouer !</h1>
          <p>Choisis une activité et découvre les nombres avec tes mains, tes yeux et tes idées.</p>
        </section>
        <GameNav game={game} onSelect={setGame} />
        <section className={`game-stage accent-${selected.color}`} aria-label={selected.label}>
          <div className="stage-title"><span>{selected.icon}</span><h2>{selected.label}</h2></div>
          <div className="stage-body" key={game}>
            {game === "box" && <BoxGame />}
            {game === "hands" && <HandsGame />}
            {game === "basket" && <BasketGame />}
            {game === "holes" && <HolesGame />}
            {game === "pairs" && <PairsGame />}
            {game === "timer" && <TimerGame />}
          </div>
        </section>
      </main>

      <footer>
        <p>Des jeux gratuits, sans publicité et sans compte.</p>
        <p>Code partagé sous licence <a href="https://www.gnu.org/licenses/agpl-3.0.html">AGPL-3.0</a>.</p>
      </footer>
    </div>
  );
}
