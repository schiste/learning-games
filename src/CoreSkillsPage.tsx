import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { beep, fanfare, speakFrench } from "./audio";
import { type Complexity } from "./gameLogic";
import {
  CORE_SPACES,
  makeCoreRound,
  type BuildRound,
  type ChoiceRound,
  type CoreGameInfo,
  type CoreRound,
  type CoreSpace,
  type CoreStage,
  type CoreVisual,
  type CounterRound,
  type Grade,
  type OrderRound,
  type SortRound,
} from "./coreSkillsLogic";
import "./core-skills.css";

const GRADES: Array<{ value: Grade; note: string }> = [
  { value: "CP", note: "premiers repères" },
  { value: "CE1", note: "je consolide" },
  { value: "CE2", note: "je vais plus loin" },
];

const SUPPORTS: Array<{ value: Complexity; label: string }> = [
  { value: 1, label: "Guidé" },
  { value: 2, label: "Repères" },
  { value: 3, label: "Autonome" },
];

const STAGE_LABELS: Record<CoreStage, string> = {
  discover: "Je découvre",
  train: "Je m’entraîne",
  master: "Je maîtrise",
};

function sceneData(value: object) {
  return JSON.stringify(value);
}

function CoreFeedback({ message }: { message: string }) {
  return <div className={`core-feedback ${message ? "is-visible" : ""}`} role="status" aria-live="polite"><span aria-hidden="true">↻</span><span>{message || "\u00a0"}</span></div>;
}

function CoreButton({ children, onClick, secondary = false, disabled = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className={`core-primary ${secondary ? "is-secondary" : ""}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Celebration({ onNext, title = "Bien joué !" }: { onNext: () => void; title?: string }) {
  useEffect(fanfare, []);
  return (
    <div className="core-celebration" aria-live="polite">
      <div aria-hidden="true"><span>★</span><span>★</span><span>★</span></div>
      <h3>{title}</h3>
      <p>Tu as trouvé une stratégie qui fonctionne.</p>
      <CoreButton onClick={onNext}>Un nouveau défi</CoreButton>
    </div>
  );
}

function Listen({ text }: { text?: string }) {
  if (!text) return null;
  return <button className="core-listen" onClick={() => speakFrench(text)} aria-label={`Écouter : ${text}`}><span aria-hidden="true">▶</span> Écouter</button>;
}

function CoreGuide({ hint, support }: { hint: string; support: Complexity }) {
  if (support !== 1) return null;
  return <div className="core-guide"><span aria-hidden="true">✦</span><span>{hint}</span></div>;
}

function CoreVisualDisplay({ visual, current }: { visual: CoreVisual; current?: number }) {
  if (visual.kind === "equation") return <div className="core-equation">{visual.text}</div>;
  if (visual.kind === "word") return <div className="core-word-card">{visual.text}</div>;
  if (visual.kind === "objects") {
    return <div className="core-object-groups">{(visual.values ?? []).map((value, group) => <div key={`${value}-${group}`}><strong>{value}</strong><span>{Array.from({ length: Math.min(value, 20) }, (_, index) => <i key={index}>{visual.symbols?.[0] ?? "●"}</i>)}</span></div>)}</div>;
  }
  if (visual.kind === "groups") {
    const groups = visual.groups ?? 1;
    const size = visual.size ?? 1;
    return <div className="core-groups" aria-label={`${groups} groupes de ${size}`}>{Array.from({ length: Math.min(groups, 10) }, (_, group) => <div key={group}>{Array.from({ length: Math.min(size, 10) }, (_, item) => <i key={item} />)}</div>)}</div>;
  }
  if (visual.kind === "fraction") {
    const numerator = visual.numerator ?? 1;
    const denominator = visual.denominator ?? 2;
    const angle = Math.min(360, (numerator / denominator) * 360);
    return <div className="core-fraction"><div className="fraction-disc" style={{ "--fraction-angle": `${angle}deg` } as CSSProperties}>{Array.from({ length: denominator }, (_, index) => <i key={index} style={{ transform: `rotate(${index * 360 / denominator}deg)` }} />)}</div><strong>{numerator}<span />{denominator}</strong></div>;
  }
  if (visual.kind === "story") return <div className="core-story"><span aria-hidden="true">{visual.symbols?.join("  ")}</span>{visual.text && <strong>{visual.text}</strong>}</div>;
  if (visual.kind === "clock") {
    const hour = visual.hour ?? 12;
    const minute = current === undefined ? visual.minute ?? 0 : current;
    return <div className="core-clock" aria-label={`${hour} heures ${minute}`}><span className="clock-center" /><i className="hour-hand" style={{ transform: `rotate(${hour * 30 + minute * .5}deg)` }} /><i className="minute-hand" style={{ transform: `rotate(${minute * 6}deg)` }} />{[12, 3, 6, 9].map((number) => <b className={`clock-${number}`} key={number}>{number}</b>)}</div>;
  }
  if (visual.kind === "coins") return <div className="core-coins">{(visual.values ?? []).map((value, index) => <span key={`${value}-${index}`}><strong>{value}</strong><small>€</small></span>)}</div>;
  if (visual.kind === "bars") {
    const values = visual.values ?? [];
    const largest = Math.max(...values, 1);
    return <div className="core-bars">{values.slice(0, 16).map((value, index) => <div key={`${value}-${index}`}><i style={{ width: `${Math.max(10, value / largest * 100)}%` }} /><span>{value}</span></div>)}</div>;
  }
  if (visual.kind === "calendar") return <div className="core-calendar"><span>lun</span><span>mar</span><span>mer</span><strong>{visual.text ?? "Aujourd’hui"}</strong></div>;
  return <div className="core-shapes" aria-hidden="true">{(visual.symbols ?? ["○", "△", "□"]).map((shape, index) => <span key={`${shape}-${index}`}>{shape}</span>)}{visual.text && <strong>{visual.text}</strong>}</div>;
}

function useNumericKeyboard(options: string[], onPick: (option: string) => void, enabled = true) {
  const callback = useRef(onPick);
  const [typed, setTyped] = useState("");
  useEffect(() => { callback.current = onPick; }, [onPick]);
  useEffect(() => {
    if (!enabled) return;
    const numeric = options.filter((option) => /^\d/.test(option));
    if (!numeric.length) return;
    let buffer = "";
    let timer: number | undefined;
    const reset = () => { buffer = ""; setTyped(""); if (timer) window.clearTimeout(timer); };
    const commit = () => {
      const match = numeric.find((option) => Number.parseInt(option, 10) === Number(buffer));
      if (match) callback.current(match);
      reset();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || !/^\d$/.test(event.key)) return;
      event.preventDefault();
      buffer += event.key;
      setTyped(buffer);
      if (timer) window.clearTimeout(timer);
      const candidates = numeric.filter((option) => String(Number.parseInt(option, 10)).startsWith(buffer));
      if (!candidates.length) { buffer = event.key; setTyped(buffer); }
      const exact = numeric.find((option) => Number.parseInt(option, 10) === Number(buffer));
      const longer = numeric.some((option) => String(Number.parseInt(option, 10)).startsWith(buffer) && String(Number.parseInt(option, 10)).length > buffer.length);
      if (exact && !longer) commit();
      else timer = window.setTimeout(commit, 500);
    };
    window.addEventListener("keydown", keydown);
    return () => { window.removeEventListener("keydown", keydown); if (timer) window.clearTimeout(timer); };
  }, [enabled, options]);
  return typed;
}

function ChoiceActivity({ round, onSuccess, support, continuous = false }: { round: ChoiceRound; onSuccess: () => void; support: Complexity; continuous?: boolean }) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const pick = (option: string) => {
    if (option === round.answer) { beep(860, .12); onSuccess(); return; }
    beep(190, .22); setWrong(option); setMessage(`${option} ne convient pas encore. ${round.hint}`);
  };
  const typed = useNumericKeyboard(round.options, pick);
  return (
    <section className="core-game-state" data-scene={sceneData({ mode: round.mode, answer: round.answer, options: round.options, wrong })}>
      <p className="instruction">{round.prompt}</p>
      <Listen text={round.narration} />
      <CoreVisualDisplay visual={round.visual} />
      <h3 className="core-question">{round.question}</h3><CoreGuide hint={round.hint} support={support} />
      <div className="core-choices">{round.options.map((option) => <button className={wrong === option ? "is-wrong" : ""} key={option} onClick={() => pick(option)}>{option}</button>)}</div>
      {round.options.some((option) => /^\d/.test(option)) && <div className="core-keyboard-hint"><span aria-hidden="true">⌨</span>{typed ? `Saisie : ${typed}` : continuous ? "Tu peux répondre au clavier" : "Les nombres peuvent aussi être tapés au clavier"}</div>}
      <CoreFeedback message={message} />
    </section>
  );
}

function BuildActivity({ round, onDone, support }: { round: BuildRound; onDone: () => void; support: Complexity }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState(false);
  const result = round.rule === "sum" ? selected.reduce((total, index) => total + (round.tokens[index].value ?? 0), 0) : selected.map((index) => round.tokens[index].label).join("");
  const add = (index: number) => { setSelected((current) => [...current, index]); setMessage(""); setWrong(false); beep(510, .07); };
  const check = () => {
    if (String(result) === String(round.answer)) { beep(860, .12); onDone(); return; }
    beep(190, .22); setWrong(true);
    if (round.rule === "sum" && Number(result) > Number(round.answer)) setMessage(`Tu as ${result} : c’est trop. Retire une pièce et ajuste.`);
    else setMessage(`Ta construction donne ${result || "rien"}. ${round.hint}`);
  };
  return (
    <section className="core-game-state" data-scene={sceneData({ mode: round.mode, answer: round.answer, selected: selected.map((index) => round.tokens[index].label), result })}>
      <p className="instruction">{round.prompt}</p><Listen text={round.narration} /><CoreVisualDisplay visual={round.visual} />
      <h3 className="core-question">{round.question}</h3><CoreGuide hint={round.hint} support={support} />
      <div className={`core-build-zone ${wrong ? "is-wrong" : ""}`}><small>Ma construction</small><strong>{selected.length ? selected.map((index) => round.tokens[index].label).join(round.rule === "sum" ? " + " : "") : "…"}</strong>{round.rule === "sum" && <span>Total : {result}</span>}</div>
      <div className="core-tokens">{round.tokens.map((token, index) => <button key={`${token.label}-${index}`} disabled={selected.includes(index)} onClick={() => add(index)}>{token.label}</button>)}</div>
      <div className="core-actions"><CoreButton secondary disabled={!selected.length} onClick={() => { setSelected((current) => current.slice(0, -1)); setWrong(false); setMessage(""); }}>Retirer</CoreButton><CoreButton onClick={check}>Vérifier</CoreButton></div>
      <CoreFeedback message={message} />
    </section>
  );
}

function OrderActivity({ round, onDone, support }: { round: OrderRound; onDone: () => void; support: Complexity }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState(false);
  const values = selected.map((index) => round.tokens[index]);
  const check = () => {
    if (values.length === round.answer.length && values.every((value, index) => value === round.answer[index])) { beep(860, .12); onDone(); return; }
    beep(190, .22); setWrong(true); setMessage(`L’ordre raconte autre chose. ${round.hint}`);
  };
  return (
    <section className="core-game-state" data-scene={sceneData({ mode: round.mode, answer: round.answer, order: values })}>
      <p className="instruction">{round.prompt}</p><Listen text={round.narration} /><CoreVisualDisplay visual={round.visual} /><h3 className="core-question">{round.question}</h3><CoreGuide hint={round.hint} support={support} />
      <div className={`core-order-zone ${wrong ? "is-wrong" : ""}`}>{values.length ? values.map((value, index) => <span key={`${value}-${index}`}>{index + 1}<strong>{value}</strong></span>) : <small>Choisis le premier élément</small>}</div>
      <div className="core-tokens">{round.tokens.map((token, index) => <button key={`${token}-${index}`} disabled={selected.includes(index)} onClick={() => { setSelected((current) => [...current, index]); setWrong(false); setMessage(""); beep(510, .07); }}>{token}</button>)}</div>
      <div className="core-actions"><CoreButton secondary disabled={!selected.length} onClick={() => setSelected((current) => current.slice(0, -1))}>Retirer</CoreButton><CoreButton disabled={selected.length !== round.answer.length} onClick={check}>Vérifier</CoreButton></div>
      <CoreFeedback message={message} />
    </section>
  );
}

function SortActivity({ round, onDone, support }: { round: SortRound; onDone: () => void; support: Complexity }) {
  const [remaining, setRemaining] = useState(round.items);
  const [sorted, setSorted] = useState<Record<string, string[]>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const item = remaining[0];
  const sort = (category: string) => {
    if (category !== item.category) { beep(190, .22); setWrong(category); setMessage(`« ${item.label} » n’habite pas ici. ${round.hint}`); return; }
    beep(720, .09); setSorted((current) => ({ ...current, [category]: [...(current[category] ?? []), item.label] }));
    if (remaining.length === 1) onDone();
    else { setRemaining((current) => current.slice(1)); setWrong(null); setMessage(""); }
  };
  return (
    <section className="core-game-state" data-scene={sceneData({ mode: round.mode, current: item?.label, remaining: remaining.length, sorted })}>
      <p className="instruction">{round.prompt}</p><CoreVisualDisplay visual={round.visual} /><h3 className="core-question">{round.question}</h3><CoreGuide hint={round.hint} support={support} />
      {item && <div className="core-sort-item">{item.label}</div>}
      <div className="core-sort-houses">{round.categories.map((category) => <button className={wrong === category ? "is-wrong" : ""} key={category} onClick={() => sort(category)}><span aria-hidden="true">⌂</span><strong>{category}</strong><small>{(sorted[category] ?? []).join(" · ") || "vide"}</small></button>)}</div>
      <CoreFeedback message={message} />
    </section>
  );
}

function CounterActivity({ round, onDone, support }: { round: CounterRound; onDone: () => void; support: Complexity }) {
  const [current, setCurrent] = useState(round.start);
  const [message, setMessage] = useState("");
  const move = (step: number) => {
    const next = current + step;
    if (next < round.min || next > round.max) { beep(190, .2); setMessage("Ce déplacement sort du chemin. Essaie un pas dans l’autre sens."); return; }
    beep(460 + Math.max(0, step) * 20, .08); setCurrent(next); setMessage("");
    if (next === round.target) window.setTimeout(onDone, 220);
  };
  const minute = round.visual.kind === "clock" ? current * (60 / (round.max + 1)) : undefined;
  return (
    <section className="core-game-state" data-scene={sceneData({ mode: round.mode, current, target: round.target, steps: round.steps })}>
      <p className="instruction">{round.prompt}</p><CoreVisualDisplay visual={round.visual} current={minute} /><h3 className="core-question">{round.question}</h3><CoreGuide hint={round.hint} support={support} />
      <div className="core-counter-readout"><span>Je suis ici</span><strong>{round.visual.kind === "clock" ? `${round.visual.hour} h ${String(minute).padStart(2, "0")}` : current}</strong></div>
      <div className="core-step-buttons">{round.steps.map((step) => <button key={step} onClick={() => move(step)}>{step > 0 ? "+" : ""}{step}</button>)}</div>
      {current === round.target && <CoreButton onClick={onDone}>C’est la cible</CoreButton>}
      <CoreFeedback message={message} />
    </section>
  );
}

function UntimedActivity({ round, nextRound, support }: { round: CoreRound; nextRound: () => void; support: Complexity }) {
  const [done, setDone] = useState(false);
  if (done) return <Celebration onNext={nextRound} />;
  if (round.mode === "choice") return <ChoiceActivity round={round} support={support} onSuccess={() => setDone(true)} />;
  if (round.mode === "build") return <BuildActivity round={round} support={support} onDone={() => setDone(true)} />;
  if (round.mode === "order") return <OrderActivity round={round} support={support} onDone={() => setDone(true)} />;
  if (round.mode === "sort") return <SortActivity round={round} support={support} onDone={() => setDone(true)} />;
  return <CounterActivity round={round} support={support} onDone={() => setDone(true)} />;
}

function TimedActivity({ makeRound, support }: { makeRound: () => ChoiceRound; support: Complexity }) {
  const [state, setState] = useState<"idle" | "run" | "end">("idle");
  const [remaining, setRemaining] = useState(60);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [round, setRound] = useState(makeRound);
  useEffect(() => {
    if (state !== "run") return;
    const tick = window.setInterval(() => setRemaining((time) => Math.max(0, time - 1)), 1000);
    const advance = (event: Event) => setRemaining((time) => Math.max(0, time - Math.ceil((event as CustomEvent<number>).detail / 1000)));
    window.addEventListener("learning-games:advance-time", advance);
    return () => { window.clearInterval(tick); window.removeEventListener("learning-games:advance-time", advance); };
  }, [state]);
  useEffect(() => {
    if (state !== "run" || remaining !== 0) return;
    const finish = window.setTimeout(() => { setState("end"); setBest((value) => Math.max(value, score)); fanfare(); }, 0);
    return () => window.clearTimeout(finish);
  }, [remaining, score, state]);
  const start = () => { setRound(makeRound()); setRemaining(60); setScore(0); setState("run"); };
  if (state !== "run") return (
    <div className="core-timer-intro">
      <div className="core-stopwatch" aria-hidden="true">60</div>
      {state === "end" && <h3>{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""}</h3>}
      <p>Le décor se colore pendant 60 secondes. Le temps reste identique à tous les niveaux.</p>
      {best > 0 && <strong>Record : {best}</strong>}
      <CoreButton onClick={start}>{state === "end" ? "Rejouer" : "Démarrer"}</CoreButton>
    </div>
  );
  return (
    <div className="core-timed-shell">
      <div className="core-time-fill" data-progress={60 - remaining} style={{ height: `${(60 - remaining) / 60 * 100}%` }} />
      <div className="core-timed-content"><div className="core-timer-status"><span>Temps <strong>{remaining}</strong></span><span>Score <strong>{score}</strong></span></div><ChoiceActivity key={`${round.question}-${score}`} round={round} support={support} continuous onSuccess={() => { setScore((value) => value + 1); setRound(makeRound()); }} /></div>
    </div>
  );
}

function SupportPicker({ value, onChange }: { value: Complexity; onChange: (value: Complexity) => void }) {
  return <div className="core-support-picker" aria-label="Choisir le niveau d’aide"><span>Aide</span>{SUPPORTS.map((support) => <button key={support.value} className={value === support.value ? "is-active" : ""} onClick={() => onChange(support.value)} aria-pressed={value === support.value}><b>{support.value}</b><small>{support.label}</small></button>)}</div>;
}

function SpaceRail({ active, onSelect }: { active: CoreSpace; onSelect: (space: CoreSpace) => void }) {
  return <><nav className="core-space-rail" aria-label="Choisir un apprentissage">{CORE_SPACES.map((space, index) => <button key={space.id} className={`color-${space.color} ${active.id === space.id ? "is-active" : ""}`} onClick={() => onSelect(space)} aria-pressed={active.id === space.id}><small>{index + 1}</small><span aria-hidden="true">{space.icon}</span><strong>{space.shortLabel}</strong></button>)}</nav><p className="core-rail-hint" aria-hidden="true">Fais glisser pour voir les 10 espaces →</p></>;
}

function GameNav({ space, active, onSelect }: { space: CoreSpace; active: CoreGameInfo; onSelect: (game: CoreGameInfo) => void }) {
  return <nav className="core-game-nav" aria-label={`Jeux : ${space.label}`}>{(["discover", "train", "master"] as CoreStage[]).map((stage) => <div key={stage}><span>{STAGE_LABELS[stage]}</span><div>{space.games.filter((game) => game.stage === stage).map((game) => <button key={game.id} className={active.id === game.id ? "is-active" : ""} onClick={() => onSelect(game)} aria-pressed={active.id === game.id}><i aria-hidden="true">{game.icon}</i>{game.label}{game.timed && <b title="Jeu chronométré" aria-label="Jeu chronométré">◷</b>}</button>)}</div></div>)}</nav>;
}

export default function CoreSkillsPage() {
  const [space, setSpace] = useState(CORE_SPACES[0]);
  const [game, setGame] = useState(space.games[0]);
  const [grade, setGrade] = useState<Grade>("CP");
  const [supports, setSupports] = useState<Record<string, Complexity>>({});
  const [roundNumber, setRoundNumber] = useState(0);
  const key = `${space.id}/${game.id}`;
  const support = supports[key] ?? 1;
  const round = useMemo(() => {
    void roundNumber;
    return makeCoreRound(space.id, game.id, grade, support);
  }, [space.id, game.id, grade, support, roundNumber]);
  const chooseSpace = (next: CoreSpace) => { setSpace(next); setGame(next.games[0]); setRoundNumber(0); };
  const chooseGame = (next: CoreGameInfo) => { setGame(next); setRoundNumber(0); };
  const newRound = () => setRoundNumber((value) => value + 1);
  const makeTimedRound = () => makeCoreRound(space.id, game.id, grade, support) as ChoiceRound;
  return (
    <div className={`core-page core-color-${space.color}`}>
      <SpaceRail active={space} onSelect={chooseSpace} />
      <section className="core-space-heading">
        <div><span aria-hidden="true">{space.icon}</span><div><small>Espace {CORE_SPACES.findIndex((item) => item.id === space.id) + 1} sur 10</small><h1>{space.label}</h1><p>{space.description}</p></div></div>
        <div className="core-grade-picker" aria-label="Choisir la classe">{GRADES.map((item) => <button key={item.value} className={grade === item.value ? "is-active" : ""} onClick={() => { setGrade(item.value); setRoundNumber((value) => value + 1); }} aria-pressed={grade === item.value}><strong>{item.value}</strong><small>{item.note}</small></button>)}</div>
      </section>
      <GameNav space={space} active={game} onSelect={chooseGame} />
      <section className={`game-stage core-stage accent-${space.color}`} data-core-game={game.id} data-core-space={space.id} data-grade={grade} data-complexity={support} aria-label={`${space.label} : ${game.label}`}>
        <div className="stage-title"><div className="stage-name"><span>{game.icon}</span><div><small>{STAGE_LABELS[game.stage]} · {grade}</small><h2>{game.label}</h2></div>{game.timed && <span className="timed-badge">◷ 60 secondes</span>}</div><SupportPicker value={support} onChange={(value) => { setSupports((current) => ({ ...current, [key]: value })); setRoundNumber((number) => number + 1); }} /></div>
        <div className="stage-body" key={`${key}-${grade}-${support}-${roundNumber}`}>{game.timed ? <TimedActivity makeRound={makeTimedRound} support={support} /> : <UntimedActivity round={round} nextRound={newRound} support={support} />}</div>
      </section>
    </div>
  );
}
