import { useEffect, useRef, useState } from "react";
import { beep, fanfare } from "./audio";
import DecimalPage from "./DecimalPage";
import {
  answerOptions,
  balanceRound,
  basketRound,
  bowlingRound,
  cashRound,
  holeQuestion,
  memoryDeck,
  pathRound,
  randomStart,
  shareRound,
  timerQuestion,
  type Complexity,
  type MemoryCard,
} from "./gameLogic";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (milliseconds: number) => void;
  }
}

type GameId = "box" | "hands" | "basket" | "frog" | "bowling" | "holes" | "pairs" | "timer" | "cash" | "balance" | "path" | "share";
type TopicId = "ten" | "decimal";
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

const MASTER_GAMES: GameInfo[] = [
  { id: "cash", label: "La caisse", icon: "€", color: "berry" },
  { id: "balance", label: "La balance", icon: "=", color: "leaf" },
  { id: "path", label: "Le chemin", icon: "±", color: "sky" },
  { id: "share", label: "Le partage", icon: "•••", color: "sun" },
];

const LEVELS: { value: Complexity; label: string; short: string }[] = [
  { value: 1, label: "Découverte", short: "Doux" },
  { value: 2, label: "Entraînement", short: "Malin" },
  { value: 3, label: "Défi", short: "Défi" },
];

const ALL_GAMES = [...BEGINNER_GAMES, ...EXPERT_GAMES, ...MASTER_GAMES];
const ALL_NUMBERS = Array.from({ length: 11 }, (_, number) => number);

function useTimeouts() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  };
}

function useKeyboardNumbers(onPick: (number: number) => void, allowed: number[], enabled = true) {
  const [typed, setTyped] = useState("");
  const pickRef = useRef(onPick);
  const allowedKey = allowed.join(",");

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!enabled) return;
    const allowedValues = allowedKey.split(",").filter(Boolean).map(Number);
    let buffer = "";
    let timer: number | undefined;
    const reset = () => {
      buffer = "";
      setTyped("");
      if (timer) window.clearTimeout(timer);
      timer = undefined;
    };
    const commit = () => {
      const value = Number(buffer);
      if (buffer && allowedValues.includes(value)) {
        reset();
        pickRef.current(value);
      } else {
        reset();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "Escape" || event.key === "Backspace") {
        reset();
        return;
      }
      if (event.key === "Enter" && buffer) {
        event.preventDefault();
        commit();
        return;
      }
      if (!/^\d$/.test(event.key)) return;

      event.preventDefault();
      let candidate = `${buffer}${event.key}`;
      let matches = allowedValues.filter((value) => String(value).startsWith(candidate));
      if (!matches.length) {
        candidate = event.key;
        matches = allowedValues.filter((value) => String(value).startsWith(candidate));
      }
      if (!matches.length) {
        reset();
        return;
      }

      buffer = candidate;
      setTyped(candidate);
      if (timer) window.clearTimeout(timer);
      const exact = allowedValues.includes(Number(candidate));
      const hasLongerMatch = matches.some((value) => String(value).length > candidate.length);
      if (exact && !hasLongerMatch) {
        commit();
      } else {
        timer = window.setTimeout(commit, 450);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (timer) window.clearTimeout(timer);
    };
  }, [allowedKey, enabled]);

  return enabled ? typed : "";
}

function KeyboardHint({ typed }: { typed: string }) {
  return (
    <div className="keyboard-hint" aria-live="polite">
      <span aria-hidden="true">⌨</span>
      {typed ? <>Saisie <kbd>{typed}</kbd></> : "Tu peux aussi taper le nombre"}
    </div>
  );
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
  const typed = useKeyboardNumbers(pick, options);

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
      <KeyboardHint typed={typed} />
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
  const typed = useKeyboardNumbers(pick, round.options, phase === "answer");

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
          <KeyboardHint typed={typed} />
        </>
      )}
      <MistakeFeedback message={message} />
    </section>
  );
}

function NumberPad({ onPick, wrong, values = ALL_NUMBERS }: { onPick: (number: number) => void; wrong: number | null; values?: number[] }) {
  const typed = useKeyboardNumbers(onPick, values);
  return (
    <>
      <div className="number-pad">
        {values.map((number) => (
          <button
            key={number}
            className={wrong === number ? "is-wrong" : ""}
            onClick={() => onPick(number)}
          >{number}</button>
        ))}
      </div>
      <KeyboardHint typed={typed} />
    </>
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
  const duration = 60;
  const [state, setState] = useState<"idle" | "running" | "ended">("idle");
  const [time, setTime] = useState(duration);
  const [question, setQuestion] = useState(() => timerQuestion(complexity));
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
    setQuestion(timerQuestion(complexity));
    setState("running");
  };

  const pick = (answer: number) => {
    if (answer === question.answer) {
      beep(880, 0.1);
      setScore((value) => value + 1);
      setQuestion(timerQuestion(complexity));
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
  const progress = state === "ended" ? 1 : Math.max(0, Math.min(1, (duration - time) / duration));
  const timeFill = <div className="timer-background-fill" data-progress={progress} style={{ height: `${progress * 100}%` }} aria-hidden="true" />;

  if (state !== "running") {
    return (
      <>
        {timeFill}
        <section className="timer-intro timer-foreground">
          <span className="timer-icon" aria-hidden="true">60</span>
          {state === "ended" && <h2>{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""}</h2>}
          <p>Combien de compléments trouveras-tu en une minute ?</p>
          {best > 0 && <div className="record">Ton record · {best}</div>}
          <PrimaryButton color="berry" onClick={start}>{state === "ended" ? "Rejouer" : "C’est parti !"}</PrimaryButton>
        </section>
      </>
    );
  }

  return (
    <>
      {timeFill}
      <section className="game-content timer-foreground">
        <div className="timer-status"><span>Temps <strong>{time}</strong></span><span>Score <strong>{score}</strong></span></div>
        <div className="equation">{question.text}</div>
        <NumberPad onPick={pick} wrong={wrong} values={question.inputValues} />
        <MistakeFeedback message={message} />
      </section>
    </>
  );
}

function CashGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => cashRound(complexity));
  const [coins, setCoins] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);
  const current = coins.reduce((sum, coin) => sum + coin, 0);

  const reset = () => {
    setRound(cashRound(complexity));
    setCoins([]);
    setMessage("");
    setWrong(false);
    setDone(false);
  };
  const addCoin = (coin: number) => {
    if (current + coin > 10) {
      beep(200, 0.2);
      setWrong(true);
      setMessage("La monnaie ne peut pas dépasser 10. Retire une pièce pour continuer.");
      return;
    }
    beep(520 + coin * 45, 0.08);
    setCoins((value) => [...value, coin]);
    setMessage("");
    setWrong(false);
  };
  const removeCoin = (index: number) => {
    setCoins((value) => value.filter((_, coinIndex) => coinIndex !== index));
    setMessage("");
    setWrong(false);
  };
  const check = () => {
    if (current !== round.change) {
      beep(200, 0.25);
      setWrong(true);
      const difference = Math.abs(round.change - current);
      setMessage(current < round.change
        ? `Il manque encore ${difference}. Garde tes pièces et complète.`
        : `Il y a ${difference} de trop. Retire une pièce et réessaie.`);
      return;
    }
    if (round.maxCoins && coins.length > round.maxCoins) {
      beep(240, 0.2);
      setWrong(true);
      setMessage(`Le montant est juste ! Essaie maintenant avec ${round.maxCoins} pièce${round.maxCoins > 1 ? "s" : ""}.`);
      return;
    }
    beep(880, 0.14);
    setDone(true);
  };

  if (done) return <Celebration onNext={reset} title="La monnaie est juste !" />;

  return (
    <section
      className="game-content cash-game"
      data-change={round.change}
      data-total={round.total}
      data-current={current}
      data-coins={coins.length}
    >
      <p className="instruction">Rends la monnaie sur 10</p>
      <div className="shop-counter">
        <div className="purchase" aria-label={`Achats pour ${round.total}`}>
          {round.prices.map((price, index) => (
            <div className="shop-item" key={`${price}-${index}`}>
              <span aria-hidden="true">{index === 0 ? "▲" : "●"}</span>
              <strong>{price}</strong>
            </div>
          ))}
          {round.prices.length > 1 && <div className="purchase-total">Total <strong>{round.total}</strong></div>}
        </div>
        <div className="paid-coin" aria-label="Payé 10"><span>10</span><small>payé</small></div>
      </div>
      <div className="cash-equation">10 − {round.prices.length > 1 ? `(${round.prices.join(" + ")})` : round.total} = ?</div>
      {round.maxCoins && <div className="cash-rule">Avec {round.maxCoins} pièce{round.maxCoins > 1 ? "s" : ""} au plus</div>}
      <div className={`cash-tray ${wrong ? "is-wrong" : ""}`} aria-label={`Monnaie préparée : ${current}`}>
        <span className="tray-total">{current}</span>
        <div className="prepared-coins">
          {coins.length === 0 && <span className="empty-tray">Choisis des pièces</span>}
          {coins.map((coin, index) => (
            <button key={`${coin}-${index}`} className={`coin coin-${coin}`} onClick={() => removeCoin(index)} aria-label={`Retirer la pièce de ${coin}`}>{coin}</button>
          ))}
        </div>
      </div>
      <div className="coin-bank">
        {round.denominations.map((coin) => (
          <button key={coin} className={`coin coin-${coin}`} onClick={() => addCoin(coin)} aria-label={`Ajouter une pièce de ${coin}`}>+ {coin}</button>
        ))}
      </div>
      <PrimaryButton color="berry" onClick={check}>Donner la monnaie</PrimaryButton>
      <MistakeFeedback message={message} />
    </section>
  );
}

function BalanceGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => balanceRound(complexity));
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);
  const leftTotal = round.leftWeights.reduce((sum, weight) => sum + weight, 0);
  const selectedTotal = selected.reduce((sum, index) => sum + round.tiles[index], 0);
  const rightTotal = round.rightBase + selectedTotal;
  const difference = rightTotal - leftTotal;
  const angle = Math.max(-8, Math.min(8, difference * 1.8));

  const reset = () => {
    setRound(balanceRound(complexity));
    setSelected([]);
    setMessage("");
    setWrong(false);
    setDone(false);
  };
  const toggle = (index: number) => {
    setSelected((value) => value.includes(index) ? value.filter((item) => item !== index) : [...value, index]);
    setMessage("");
    setWrong(false);
    beep(560 + round.tiles[index] * 35, 0.08);
  };
  const check = () => {
    if (difference !== 0) {
      beep(200, 0.25);
      setWrong(true);
      setMessage(difference < 0
        ? `Le plateau de droite est trop léger : il manque ${Math.abs(difference)}.`
        : `Le plateau de droite est trop lourd de ${difference}. Retire un poids.`);
      return;
    }
    if (complexity === 3 && selected.length !== 3) {
      beep(240, 0.2);
      setWrong(true);
      setMessage("La balance est juste. Trouve maintenant trois poids qui l’équilibrent.");
      return;
    }
    beep(880, 0.14);
    setDone(true);
  };

  if (done) return <Celebration onNext={reset} title="La balance est en équilibre !" />;

  return (
    <section
      className="game-content balance-game"
      data-left={leftTotal}
      data-right={rightTotal}
      data-selected={selected.length}
    >
      <p className="instruction">Choisis les poids qui équilibrent 10</p>
      {complexity === 3 && <div className="balance-rule">Utilise exactement trois poids</div>}
      <div className={`balance-scene ${wrong ? "is-wrong" : ""}`}>
        <div className="balance-beam" style={{ transform: `rotate(${angle}deg)` }}>
          <div className="balance-pan pan-left" style={{ transform: `rotate(${-angle}deg)` }}>
            {round.leftWeights.map((weight, index) => <span className="weight fixed" key={`${weight}-${index}`}>{weight}</span>)}
          </div>
          <div className="balance-pan pan-right" style={{ transform: `rotate(${-angle}deg)` }}>
            {round.rightBase > 0 && <span className="weight fixed">{round.rightBase}</span>}
            {selected.map((index) => <span className="weight chosen" key={index}>{round.tiles[index]}</span>)}
          </div>
        </div>
        <div className="balance-stand" aria-hidden="true"><span /></div>
      </div>
      <div className="weight-bank" aria-label="Poids disponibles">
        {round.tiles.map((weight, index) => (
          <button
            key={index}
            className={`weight-tile ${selected.includes(index) ? "is-selected" : ""}`}
            onClick={() => toggle(index)}
            aria-pressed={selected.includes(index)}
            aria-label={`${selected.includes(index) ? "Retirer" : "Ajouter"} le poids ${weight}`}
          >{weight}</button>
        ))}
      </div>
      <PrimaryButton onClick={check}>Vérifier l’équilibre</PrimaryButton>
      <MistakeFeedback message={message} />
    </section>
  );
}

function PathGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => pathRound(complexity));
  const [history, setHistory] = useState(() => [round.start]);
  const [message, setMessage] = useState("");
  const [wrongOperation, setWrongOperation] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const position = history[history.length - 1];
  const moves = history.length - 1;

  useEffect(() => {
    trackRef.current?.querySelector(".is-current")?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [position]);

  const reset = () => {
    const nextRound = pathRound(complexity);
    setRound(nextRound);
    setHistory([nextRound.start]);
    setMessage("");
    setWrongOperation(null);
    setDone(false);
  };
  const move = (operation: number) => {
    if (moves >= round.maxMoves) {
      beep(200, 0.25);
      setWrongOperation(operation);
      setMessage("Tous les coups sont utilisés. Reviens d’un pas pour essayer autrement.");
      return;
    }
    const next = position + operation;
    if (next < 0 || next > round.maxPosition) {
      beep(200, 0.25);
      setWrongOperation(operation);
      setMessage(next < 0 ? "Ce chemin passerait avant 0." : `Ce chemin dépasserait ${round.maxPosition}.`);
      return;
    }
    beep(operation > 0 ? 650 : 360, 0.1);
    setHistory((value) => [...value, next]);
    setWrongOperation(null);
    if (next === 10) {
      setDone(true);
      return;
    }
    if (moves + 1 === round.maxMoves) setMessage("Tu n’es pas encore sur 10. Reviens d’un pas et change de chemin.");
    else setMessage("");
  };
  const undo = () => {
    setHistory((value) => value.length > 1 ? value.slice(0, -1) : value);
    setMessage("");
    setWrongOperation(null);
  };

  if (done) return <Celebration onNext={reset} title="Tu as trouvé le chemin de 10 !" />;

  return (
    <section
      className="game-content path-game"
      data-position={position}
      data-moves={moves}
      data-max-moves={round.maxMoves}
      data-max-position={round.maxPosition}
    >
      <p className="instruction">Atteins 10 avec les bons déplacements</p>
      <div className="path-track" ref={trackRef} aria-label={`Position ${position}, objectif 10`}>
        {Array.from({ length: round.maxPosition + 1 }, (_, number) => (
          <span
            key={number}
            className={`path-space ${number === position ? "is-current" : ""} ${number === 10 ? "is-goal" : ""} ${history.includes(number) ? "is-visited" : ""}`}
          >
            {number === position && <i aria-hidden="true">◆</i>}
            <strong>{number}</strong>
          </span>
        ))}
      </div>
      <div className="path-status"><span>Départ <strong>{round.start}</strong></span><span>Coups <strong>{moves}/{round.maxMoves}</strong></span></div>
      <div className="operation-bank">
        {round.operations.map((operation) => (
          <button
            key={operation}
            className={wrongOperation === operation ? "is-wrong" : ""}
            onClick={() => move(operation)}
            aria-label={`Déplacement ${operation > 0 ? "plus" : "moins"} ${Math.abs(operation)}`}
          >{operation > 0 ? "+" : "−"}{Math.abs(operation)}</button>
        ))}
      </div>
      <button className="undo-button" onClick={undo} disabled={history.length === 1}>↶ Revenir d’un pas</button>
      <MistakeFeedback message={message} />
    </section>
  );
}

const SHARE_NAMES = ["Rose", "Bleu", "Vert"];

function ShareGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => shareRound(complexity));
  const [counts, setCounts] = useState(() => round.targets.map(() => 0));
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const remaining = 10 - counts.reduce((sum, count) => sum + count, 0);

  const reset = () => {
    const nextRound = shareRound(complexity);
    setRound(nextRound);
    setCounts(nextRound.targets.map(() => 0));
    setMessage("");
    setWrong([]);
    setDone(false);
  };
  const add = (index: number) => {
    if (remaining === 0) {
      beep(200, 0.2);
      setMessage("Les 10 trésors sont déjà placés. Retire-en un pour changer le partage.");
      return;
    }
    setCounts((value) => value.map((count, countIndex) => countIndex === index ? count + 1 : count));
    setMessage("");
    setWrong([]);
    beep(520 + index * 80, 0.08);
  };
  const remove = (index: number) => {
    setCounts((value) => value.map((count, countIndex) => countIndex === index ? Math.max(0, count - 1) : count));
    setMessage("");
    setWrong([]);
  };
  const check = () => {
    if (remaining > 0) {
      beep(200, 0.22);
      setMessage(`Place encore ${remaining} trésor${remaining > 1 ? "s" : ""}.`);
      return;
    }
    const mismatches = counts.flatMap((count, index) => count === round.targets[index] ? [] : [index]);
    if (mismatches.length === 0) {
      beep(880, 0.14);
      setDone(true);
      return;
    }
    beep(200, 0.25);
    if (complexity < 3) {
      const visibleMismatch = mismatches.find((index) => round.visibleTargets[index]) ?? mismatches[0];
      const delta = counts[visibleMismatch] - round.targets[visibleMismatch];
      setWrong(mismatches);
      setMessage(`${SHARE_NAMES[visibleMismatch]} a ${Math.abs(delta)} trésor${Math.abs(delta) > 1 ? "s" : ""} ${delta > 0 ? "de trop" : "en moins"}.`);
      return;
    }
    const failed = round.relations.find((relation) => counts[relation.left] !== counts[relation.right] + relation.offset)!;
    setWrong([failed.left, failed.right]);
    setMessage(failed.offset === 0
      ? `${SHARE_NAMES[failed.left]} et ${SHARE_NAMES[failed.right]} doivent avoir le même nombre.`
      : `${SHARE_NAMES[failed.left]} doit avoir ${failed.offset} de plus que ${SHARE_NAMES[failed.right]}.`);
  };

  if (done) return <Celebration onNext={reset} title="Les 10 trésors sont bien partagés !" />;

  return (
    <section
      className="game-content share-game"
      data-counts={counts.join(",")}
      data-remaining={remaining}
      data-visible-targets={round.targets.map((target, index) => round.visibleTargets[index] ? target : "?").join(",")}
    >
      <p className="instruction">Partage exactement 10 trésors</p>
      {round.relations.length > 0 && (
        <div className="share-clues">
          {round.relations.map((relation, index) => (
            <span key={index}>
              {SHARE_NAMES[relation.left]} = {SHARE_NAMES[relation.right]}{relation.offset > 0 ? ` + ${relation.offset}` : ""}
            </span>
          ))}
        </div>
      )}
      <div className="treasure-pile" aria-label={`${remaining} trésors à placer`}>
        <strong>{remaining}</strong>
        <div>{Array.from({ length: remaining }, (_, index) => <i key={index} />)}</div>
      </div>
      <div className={`share-chests chests-${counts.length}`}>
        {counts.map((count, index) => (
          <div className={`share-chest chest-${index} ${wrong.includes(index) ? "is-wrong" : ""}`} key={index}>
            <button className="chest-drop" onClick={() => add(index)} aria-label={`Ajouter un trésor au coffre ${SHARE_NAMES[index]}`}>
              <span className="chest-name">{SHARE_NAMES[index]}</span>
              <strong>{count}</strong>
              {complexity < 3 && <span className="chest-target">Objectif {round.visibleTargets[index] ? round.targets[index] : "?"}</span>}
              <span className="chest-gems" aria-hidden="true">{Array.from({ length: count }, (_, gem) => <i key={gem} />)}</span>
            </button>
            <button className="chest-remove" onClick={() => remove(index)} disabled={count === 0} aria-label={`Retirer un trésor du coffre ${SHARE_NAMES[index]}`}>− Retirer</button>
          </div>
        ))}
      </div>
      <PrimaryButton color="sun" onClick={check}>Vérifier le partage</PrimaryButton>
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
  return <nav className="game-nav" aria-label="Choisir un jeu">{group("Je découvre", BEGINNER_GAMES)}{group("Je m’entraîne", EXPERT_GAMES)}{group("Je maîtrise", MASTER_GAMES)}</nav>;
}

export default function App() {
  const [topic, setTopic] = useState<TopicId>(() => window.location.hash === "#nombres" ? "decimal" : "ten");
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
    cash: 1,
    balance: 1,
    path: 1,
    share: 1,
  });
  const selected = ALL_GAMES.find((item) => item.id === game)!;
  const complexity = complexities[game];

  useEffect(() => {
    const readTopic = () => setTopic(window.location.hash === "#nombres" ? "decimal" : "ten");
    window.addEventListener("hashchange", readTopic);
    return () => window.removeEventListener("hashchange", readTopic);
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => {
      const stage = document.querySelector(".game-stage");
      const frogPond = stage?.querySelector<HTMLElement>(".frog-pond");
      const bowlingLane = stage?.querySelector<HTMLElement>(".bowling-lane");
      const timerFill = stage?.querySelector<HTMLElement>(".timer-background-fill");
      const cashGame = stage?.querySelector<HTMLElement>(".cash-game");
      const balanceGame = stage?.querySelector<HTMLElement>(".balance-game");
      const pathGame = stage?.querySelector<HTMLElement>(".path-game");
      const shareGame = stage?.querySelector<HTMLElement>(".share-game");
      const decimalStage = stage?.matches(".decimal-stage") ? stage as HTMLElement : null;
      const decimalState = stage?.querySelector<HTMLElement>(".decimal-game-state");
      const visibleButtons = [...(stage?.querySelectorAll("button:not([disabled])") ?? [])]
        .map((button) => button.getAttribute("aria-label") || button.textContent?.trim())
        .filter(Boolean);
      return JSON.stringify({
        coordinateSystem: "DOM layout; origin top-left; x right; y down",
        topic,
        game: decimalStage?.dataset.decimalGame ?? game,
        complexity: Number(decimalStage?.dataset.complexity ?? complexity),
        instruction: stage?.querySelector(".instruction")?.textContent?.trim() ?? null,
        equation: stage?.querySelector(".equation, .bowling-equation, .cash-equation")?.textContent?.trim() ?? null,
        feedback: stage?.querySelector(".mistake-feedback.is-visible")?.textContent?.trim() ?? null,
        scene: decimalState
          ? JSON.parse(decimalState.dataset.scene ?? "null")
          : frogPond
          ? { start: Number(frogPond.dataset.start), position: Number(frogPond.dataset.position), destination: 10 }
          : bowlingLane
            ? { phase: bowlingLane.dataset.phase, standing: Number(bowlingLane.dataset.standing), knocked: Number(bowlingLane.dataset.knocked) }
            : timerFill
              ? {
                  progress: Number(timerFill.dataset.progress),
                  time: Number(stage?.querySelector(".timer-status strong")?.textContent ?? 60),
                  score: Number(stage?.querySelectorAll(".timer-status strong")[1]?.textContent ?? 0),
                }
              : cashGame
                ? { purchase: Number(cashGame.dataset.total), change: Number(cashGame.dataset.change), current: Number(cashGame.dataset.current), coins: Number(cashGame.dataset.coins) }
                : balanceGame
                  ? { left: Number(balanceGame.dataset.left), right: Number(balanceGame.dataset.right), selected: Number(balanceGame.dataset.selected) }
                  : pathGame
                    ? { position: Number(pathGame.dataset.position), moves: Number(pathGame.dataset.moves), maxMoves: Number(pathGame.dataset.maxMoves), maxPosition: Number(pathGame.dataset.maxPosition), goal: 10 }
                    : shareGame
                      ? {
                          counts: shareGame.dataset.counts?.split(",").map(Number),
                          remaining: Number(shareGame.dataset.remaining),
                          visibleTargets: shareGame.dataset.visibleTargets,
                          clues: stage?.querySelector(".share-clues")?.textContent?.trim() ?? null,
                          total: 10,
                        }
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
  }, [complexity, game, topic]);

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

      <nav className="topic-switch" aria-label="Choisir un parcours">
        <a href="#faire-10" className={topic === "ten" ? "is-active" : ""} aria-current={topic === "ten" ? "page" : undefined}>Faire 10</a>
        <a href="#nombres" className={topic === "decimal" ? "is-active" : ""} aria-current={topic === "decimal" ? "page" : undefined}>Construire les nombres</a>
      </nav>

      <main>
        {topic === "decimal" ? <DecimalPage /> : (
          <>
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
                {game === "cash" && <CashGame complexity={complexity} />}
                {game === "balance" && <BalanceGame complexity={complexity} />}
                {game === "path" && <PathGame complexity={complexity} />}
                {game === "share" && <ShareGame complexity={complexity} />}
              </div>
            </section>
          </>
        )}
      </main>

      <footer>
        <p>Des jeux gratuits, sans publicité et sans compte.</p>
        <p>Code partagé sous licence <a href="https://www.gnu.org/licenses/agpl-3.0.html">AGPL-3.0</a>.</p>
      </footer>
    </div>
  );
}
