import { useEffect, useRef, useState } from "react";
import { beep, fanfare } from "./audio";
import {
  answerOptions,
  basketRound,
  bowlingRound,
  holeQuestion,
  memoryDeck,
  randomInt,
  randomStart,
  type Complexity,
  type MemoryCard,
} from "./gameLogic";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (milliseconds: number) => void;
  }
}

type GameId = "box" | "hands" | "basket" | "frog" | "bowling" | "holes" | "pairs" | "timer";
type Color = "sky" | "sun" | "berry" | "leaf";
type GameInfo = { id: GameId; label: string; icon: string; color: Color; timed?: boolean };

const BEGINNER_GAMES: GameInfo[] = [
  { id: "box", label: "La boîte", icon: "●", color: "sky" },
  { id: "hands", label: "Les mains", icon: "✋", color: "sun" },
  { id: "basket", label: "Le panier", icon: "●●", color: "berry" },
  { id: "frog", label: "La grenouille", icon: "↗", color: "leaf" },
];

const EXPERT_GAMES: GameInfo[] = [
  { id: "bowling", label: "Les quilles", icon: "▲", color: "sun" },
  { id: "holes", label: "Les trous", icon: "?", color: "leaf" },
  { id: "pairs", label: "Les paires", icon: "◆", color: "sky" },
  { id: "timer", label: "Le chrono", icon: "60", color: "berry", timed: true },
];

const LEVELS: { value: Complexity; label: string; short: string }[] = [
  { value: 1, label: "Découverte", short: "Doux" },
  { value: 2, label: "Entraînement", short: "Malin" },
  { value: 3, label: "Défi", short: "Défi" },
];

const ALL_GAMES = [...BEGINNER_GAMES, ...EXPERT_GAMES];

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

function MistakeFeedback({ message }: { message: string }) {
  return (
    <div className={`mistake-feedback ${message ? "is-visible" : ""}`} role="status" aria-live="polite">
      <span aria-hidden="true">↻</span>
      <span>{message || "\u00a0"}</span>
    </div>
  );
}

function ComplexityPicker({ value, onChange }: { value: Complexity; onChange: (value: Complexity) => void }) {
  return (
    <div className="complexity-picker" aria-label="Choisir le niveau">
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

function Question({ answer, onCorrect, complexity, prompt = "Combien en as-tu ajouté ?" }: {
  answer: number;
  onCorrect: () => void;
  complexity: Complexity;
  prompt?: string;
}) {
  const [options] = useState(() => answerOptions(answer, complexity + 1));
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
    setMessage("Presque ! Regarde encore et réessaie.");
    later(() => {
      setWrong(null);
      setMessage("");
    }, 1100);
  };

  return (
    <section className="question-panel">
      <p className="instruction">{prompt}</p>
      <div className="choice-row">
        {options.map((number) => (
          <button
            key={number}
            className={`number-choice ${wrong === number ? "is-wrong" : ""}`}
            onClick={() => pick(number)}
            aria-label={`${number}`}
          >
            <strong>{number}</strong>
            {complexity < 3 && (
              <span className="mini-dots" aria-hidden="true">
                {Array.from({ length: number }, (_, index) => <i key={index} />)}
              </span>
            )}
          </button>
        ))}
      </div>
      <MistakeFeedback message={message} />
    </section>
  );
}

function BoxGame({ complexity }: { complexity: Complexity }) {
  const [start, setStart] = useState(() => randomStart(complexity));
  const [filled, setFilled] = useState(0);
  const [done, setDone] = useState(false);
  const total = start + filled;

  const reset = () => {
    setStart(randomStart(complexity));
    setFilled(0);
    setDone(false);
  };

  if (done) return <Celebration onNext={reset} />;
  if (total === 10) return <Question answer={filled} onCorrect={() => setDone(true)} complexity={complexity} />;

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

function HandsGame({ complexity }: { complexity: Complexity }) {
  const [start, setStart] = useState(() => randomStart(complexity));
  const [added, setAdded] = useState(0);
  const [done, setDone] = useState(false);
  const total = start + added;
  const tap = () => {
    if (total >= 10) return;
    beep(400 + total * 50);
    setAdded((value) => value + 1);
  };
  const reset = () => {
    setStart(randomStart(complexity));
    setAdded(0);
    setDone(false);
  };

  if (done) return <Celebration onNext={reset} />;
  if (total === 10) return <Question answer={added} onCorrect={() => setDone(true)} complexity={complexity} />;

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

function BasketGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => basketRound(complexity));
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const later = useTimeouts();

  const pick = (number: number) => {
    if (number === round.need) {
      setDone(true);
      return;
    }
    beep(200, 0.25);
    setWrong(number);
    setMessage("Ce panier ne complète pas la boîte. Compte les places vides.");
    later(() => {
      setWrong(null);
      setMessage("");
    }, 1250);
  };

  if (done) return (
    <Celebration onNext={() => {
      setRound(basketRound(complexity));
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
      <MistakeFeedback message={message} />
      <AdultCounter a={round.start} b={round.need} hidden />
    </section>
  );
}

function FrogGame({ complexity }: { complexity: Complexity }) {
  const [start, setStart] = useState(() => randomStart(complexity));
  const [position, setPosition] = useState(start);
  const [done, setDone] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);
  const jumps = 10 - start;

  useEffect(() => {
    const centerCurrent = (behavior: ScrollBehavior) => {
      lineRef.current?.querySelector(".is-current")?.scrollIntoView({ behavior, block: "nearest", inline: "center" });
    };
    centerCurrent("smooth");
    const handleResize = () => centerCurrent("auto");
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  const reset = () => {
    const nextStart = randomStart(complexity);
    setStart(nextStart);
    setPosition(nextStart);
    setDone(false);
  };

  if (done) return <Celebration onNext={reset} title="La grenouille est arrivée !" />;
  if (position === 10) {
    return (
      <Question
        answer={jumps}
        complexity={complexity}
        prompt="Combien de bonds a-t-elle faits ?"
        onCorrect={() => setDone(true)}
      />
    );
  }

  return (
    <section className="game-content frog-game">
      <p className="instruction">Fais bondir la grenouille jusqu’à 10</p>
      <div className={`frog-pond complexity-${complexity}`} data-start={start} data-position={position} aria-label={`La grenouille est sur ${position}`}>
        <div className="pond-ripples" aria-hidden="true" />
        <div className="lily-line" ref={lineRef}>
          {Array.from({ length: 11 }, (_, number) => {
            const current = number === position;
            const next = number === position + 1;
            const showNumber = complexity === 1
              || number === start
              || number === 10
              || (complexity === 2 && number === 5);
            return (
              <button
                key={number}
                className={`lily-pad ${current ? "is-current" : ""} ${number < position ? "is-passed" : ""} ${next ? "is-next" : ""}`}
                disabled={!next}
                onClick={() => {
                  beep(460 + number * 32, 0.1);
                  setPosition(number);
                }}
                aria-label={next ? `Bondir sur ${number}` : `Case ${number}`}
              >
                {current && <span className="frog" aria-hidden="true">🐸</span>}
                {showNumber && <span className="lily-number">{number}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="frog-progress" aria-live="polite">
        <span>{position}</span><i aria-hidden="true">→</i><strong>10</strong>
      </div>
    </section>
  );
}

function BowlingGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => bowlingRound(complexity));
  const [phase, setPhase] = useState<"ready" | "settling" | "answer" | "done">("ready");
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const later = useTimeouts();

  const reset = () => {
    setRound(bowlingRound(complexity));
    setPhase("ready");
    setWrong(null);
    setMessage("");
  };

  const bowl = () => {
    beep(150, 0.35);
    setPhase("settling");
    later(() => setPhase("answer"), 720);
  };

  const pick = (number: number) => {
    if (number === round.standing) {
      beep(880, 0.14);
      setPhase("done");
      return;
    }
    beep(200, 0.25);
    setWrong(number);
    setMessage("Regarde les quilles encore debout, puis recompte.");
    later(() => {
      setWrong(null);
      setMessage("");
    }, 1200);
  };

  if (phase === "done") return <Celebration onNext={reset} title="Bien joué, joli lancer !" />;

  return (
    <section className="game-content bowling-game">
      <p className="instruction">
        {phase === "ready" ? "Fais rouler la boule" : phase === "settling" ? "Les quilles tombent…" : "Combien restent debout ?"}
      </p>
      <div className={`bowling-lane phase-${phase}`} data-phase={phase} data-standing={phase === "ready" ? 10 : round.standing} data-knocked={phase === "ready" ? 0 : round.knocked} aria-label={`${phase === "ready" ? 10 : round.standing} quilles debout`}>
        <div className="bowling-pins" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className={`bowling-pin pin-${index} ${phase !== "ready" && index >= round.standing ? "is-knocked" : ""}`}
            ><i /></span>
          ))}
        </div>
        {(phase === "ready" || phase === "settling") && (
          <button className={`bowling-ball ${phase === "settling" ? "is-rolling" : ""}`} onClick={bowl} disabled={phase !== "ready"} aria-label="Lancer la boule">
            <i /><i /><i />
          </button>
        )}
      </div>
      {phase === "answer" && (
        <>
          {complexity === 3 && <div className="bowling-equation">10 − {round.knocked} = ?</div>}
          <div className="answer-row">
            {round.options.map((number) => (
              <button
                key={number}
                className={`answer-choice ${wrong === number ? "is-wrong" : ""}`}
                onClick={() => pick(number)}
              >{number}</button>
            ))}
          </div>
        </>
      )}
      <MistakeFeedback message={message} />
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

function HolesGame({ complexity }: { complexity: Complexity }) {
  const [question, setQuestion] = useState(() => holeQuestion(complexity));
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState(false);
  const later = useTimeouts();

  const pick = (number: number) => {
    if (number === question.answer) {
      beep(880, 0.15);
      setScore((value) => value + 1);
      setRevealed(true);
      later(() => {
        setRevealed(false);
        setQuestion(holeQuestion(complexity));
      }, 550);
      return;
    }
    beep(200, 0.25);
    setWrong(number);
    setMessage("Ce nombre ne convient pas. Vérifie le calcul et réessaie.");
    later(() => {
      setWrong(null);
      setMessage("");
    }, 1100);
  };

  return (
    <section className="game-content">
      <p className="instruction">Trouve le nombre caché</p>
      <div className={`equation ${revealed ? "is-correct" : ""}`} aria-live="polite">
        {revealed ? question.text.replace("?", String(question.answer)) : question.text}
      </div>
      <NumberPad onPick={pick} wrong={wrong} />
      <MistakeFeedback message={message} />
      <div className="score">Réussites <strong>{score}</strong></div>
    </section>
  );
}

function PairsGame({ complexity }: { complexity: Complexity }) {
  const [cards, setCards] = useState(() => memoryDeck(complexity));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [locked, setLocked] = useState(false);
  const [mismatch, setMismatch] = useState<number[]>([]);
  const [message, setMessage] = useState("");
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
      setMismatch(next);
      setMessage("Ces deux cartes ne font pas 10. Essaie une autre paire.");
      later(() => {
        setOpen([]);
        setMismatch([]);
        setMessage("");
        setLocked(false);
      }, 900);
    }
  };

  if (done) return (
    <Celebration
      title={`Toutes les paires en ${tries} essais !`}
      onNext={() => {
        setCards(memoryDeck(complexity));
        setOpen([]);
        setFound([]);
        setTries(0);
      }}
    />
  );

  return (
    <section className="game-content">
      <p className="instruction">Retourne deux cartes qui font 10</p>
      <div className={`memory-grid cards-${cards.length}`}>
        {cards.map((card) => {
          const shown = open.includes(card.id) || found.includes(card.id);
          const matched = found.includes(card.id);
          return (
            <button
              key={card.id}
              className={`memory-card ${shown ? "is-open" : ""} ${matched ? "is-matched" : ""} ${mismatch.includes(card.id) ? "is-mismatch" : ""}`}
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
      <MistakeFeedback message={message} />
      <div className="score">Essais <strong>{tries}</strong></div>
    </section>
  );
}

function TimerGame({ complexity }: { complexity: Complexity }) {
  const duration = complexity === 1 ? 90 : complexity === 2 ? 60 : 45;
  const [state, setState] = useState<"idle" | "running" | "ended">("idle");
  const [time, setTime] = useState(duration);
  const [number, setNumber] = useState(() => randomInt(complexity === 1 ? 5 : 0, complexity === 1 ? 9 : 10));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(window.localStorage.getItem(`learning-games-best-${complexity}`) ?? 0));
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const later = useTimeouts();

  useEffect(() => {
    const handleAdvance = (event: Event) => {
      if (state !== "running") return;
      const milliseconds = (event as CustomEvent<number>).detail;
      const seconds = Math.max(0, Math.floor(milliseconds / 1000));
      if (seconds >= time) {
        setTime(0);
        setState("ended");
        setBest((current) => {
          const next = Math.max(current, score);
          window.localStorage.setItem(`learning-games-best-${complexity}`, String(next));
          return next;
        });
        fanfare();
      } else if (seconds > 0) {
        setTime(time - seconds);
      }
    };
    window.addEventListener("learning-games:advance-time", handleAdvance);
    return () => window.removeEventListener("learning-games:advance-time", handleAdvance);
  }, [complexity, score, state, time]);

  useEffect(() => {
    if (state !== "running") return;
    const timer = window.setTimeout(() => {
      const nextTime = time - 1;
      setTime(nextTime);
      if (nextTime === 0) {
        setState("ended");
        setBest((current) => {
          const next = Math.max(current, score);
          window.localStorage.setItem(`learning-games-best-${complexity}`, String(next));
          return next;
        });
        fanfare();
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [complexity, score, state, time]);

  const start = () => {
    setScore(0);
    setTime(duration);
    setNumber(randomInt(complexity === 1 ? 5 : 0, complexity === 1 ? 9 : 10));
    setState("running");
  };

  const pick = (answer: number) => {
    if (answer === 10 - number) {
      beep(880, 0.1);
      setScore((value) => value + 1);
      setNumber(randomInt(complexity === 1 ? 5 : 0, complexity === 1 ? 9 : 10));
      return;
    }
    beep(200, 0.25);
    setWrong(answer);
    setMessage("Pas encore. Cherche ce qu’il manque pour arriver à 10.");
    later(() => {
      setWrong(null);
      setMessage("");
    }, 900);
  };

  if (state !== "running") {
    return (
      <section className="timer-intro">
        <span className="timer-icon" aria-hidden="true">{duration}</span>
        {state === "ended" && <h2>{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""}</h2>}
        <p>Combien de compléments trouveras-tu avant la fin du temps ?</p>
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
      <MistakeFeedback message={message} />
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
            <span className="tab-icon" aria-hidden="true">{item.icon}</span>{item.label}
            {item.timed && <span className="timed-mark" title="Jeu chronométré" aria-label="Jeu chronométré">◷</span>}
          </button>
        ))}
      </div>
    </div>
  );
  return <nav className="game-nav" aria-label="Choisir un jeu">{group("Je découvre", BEGINNER_GAMES)}{group("Je m’entraîne", EXPERT_GAMES)}</nav>;
}

export default function App() {
  const [game, setGame] = useState<GameId>("box");
  const [complexities, setComplexities] = useState<Record<GameId, Complexity>>({
    box: 1,
    hands: 1,
    basket: 1,
    frog: 1,
    bowling: 1,
    holes: 1,
    pairs: 1,
    timer: 1,
  });
  const selected = ALL_GAMES.find((item) => item.id === game)!;
  const complexity = complexities[game];

  useEffect(() => {
    window.render_game_to_text = () => {
      const stage = document.querySelector(".game-stage");
      const frogPond = stage?.querySelector<HTMLElement>(".frog-pond");
      const bowlingLane = stage?.querySelector<HTMLElement>(".bowling-lane");
      const visibleButtons = [...(stage?.querySelectorAll("button:not([disabled])") ?? [])]
        .map((button) => button.getAttribute("aria-label") || button.textContent?.trim())
        .filter(Boolean);
      return JSON.stringify({
        coordinateSystem: "DOM layout; origin top-left; x right; y down",
        game,
        complexity,
        instruction: stage?.querySelector(".instruction")?.textContent?.trim() ?? null,
        equation: stage?.querySelector(".equation, .bowling-equation")?.textContent?.trim() ?? null,
        feedback: stage?.querySelector(".mistake-feedback.is-visible")?.textContent?.trim() ?? null,
        scene: frogPond
          ? { start: Number(frogPond.dataset.start), position: Number(frogPond.dataset.position), destination: 10 }
          : bowlingLane
            ? { phase: bowlingLane.dataset.phase, standing: Number(bowlingLane.dataset.standing), knocked: Number(bowlingLane.dataset.knocked) }
            : null,
        availableActions: visibleButtons,
      });
    };
    window.advanceTime = (milliseconds: number) => {
      window.dispatchEvent(new CustomEvent("learning-games:advance-time", { detail: milliseconds }));
    };
    return () => {
      delete (window as Partial<Window>).render_game_to_text;
      delete (window as Partial<Window>).advanceTime;
    };
  }, [complexity, game]);

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
          <div className="stage-title">
            <div className="stage-name"><span>{selected.icon}</span><h2>{selected.label}</h2>{selected.timed && <span className="timed-badge">◷ Chronométré</span>}</div>
            <ComplexityPicker
              value={complexity}
              onChange={(value) => setComplexities((current) => ({ ...current, [game]: value }))}
            />
          </div>
          <div className="stage-body" key={`${game}-${complexity}`} data-game={game} data-complexity={complexity}>
            {game === "box" && <BoxGame complexity={complexity} />}
            {game === "hands" && <HandsGame complexity={complexity} />}
            {game === "basket" && <BasketGame complexity={complexity} />}
            {game === "frog" && <FrogGame complexity={complexity} />}
            {game === "bowling" && <BowlingGame complexity={complexity} />}
            {game === "holes" && <HolesGame complexity={complexity} />}
            {game === "pairs" && <PairsGame complexity={complexity} />}
            {game === "timer" && <TimerGame complexity={complexity} />}
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
