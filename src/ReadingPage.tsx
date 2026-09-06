import { useEffect, useRef, useState, type ReactNode } from "react";
import { beep, fanfare, speakFrench } from "./audio";
import { type Complexity } from "./gameLogic";
import {
  clapWord,
  dictationTiles,
  intruderRound,
  sentenceRound,
  shuffleReading,
  soundRound,
  syllableCountOptions,
  syllableRound,
  wordRound,
  wordsForLevel,
  type ReadingWord,
} from "./readingLogic";
import "./reading.css";

type ReadingGameId = "piano" | "sounds" | "letters" | "syllables" | "picture" | "claps" | "sentence" | "intruder" | "dictation";
type ReadingColor = "plum" | "coral" | "teal" | "sun";
type ReadingGameInfo = { id: ReadingGameId; label: string; icon: string; color: ReadingColor };

const DISCOVER_GAMES: ReadingGameInfo[] = [
  { id: "piano", label: "Le piano", icon: "♫", color: "plum" },
  { id: "sounds", label: "J’entends", icon: "♪", color: "coral" },
  { id: "letters", label: "Les lettres", icon: "a", color: "teal" },
];

const TRAIN_GAMES: ReadingGameInfo[] = [
  { id: "syllables", label: "Les syllabes", icon: "la", color: "plum" },
  { id: "picture", label: "Le mot juste", icon: "☀", color: "sun" },
  { id: "claps", label: "Je frappe", icon: "●●", color: "coral" },
];

const MASTER_GAMES: ReadingGameInfo[] = [
  { id: "sentence", label: "La phrase", icon: "…", color: "teal" },
  { id: "intruder", label: "L’intrus", icon: "≠", color: "coral" },
  { id: "dictation", label: "La dictée", icon: "✎", color: "plum" },
];

const ALL_GAMES = [...DISCOVER_GAMES, ...TRAIN_GAMES, ...MASTER_GAMES];
const READING_LEVELS: Array<{ value: Complexity; label: string; short: string }> = [
  { value: 1, label: "Sons simples, avec beaucoup d’aide", short: "Guidé" },
  { value: 2, label: "Plus de lettres et de mots", short: "En route" },
  { value: 3, label: "Sons de plusieurs lettres", short: "Autonome" },
];

const VOWELS = new Set(["a", "e", "é", "i", "o", "u", "y"]);

function useTimeouts() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return (callback: () => void, delay: number) => timers.current.push(window.setTimeout(callback, delay));
}

function sceneData(scene: object) {
  return JSON.stringify(scene);
}

function soundVoice(sound: string) {
  if (sound.length > 1) return sound.repeat(2);
  if (VOWELS.has(sound)) return sound.repeat(3);
  return `${sound}${sound}${sound}${sound}`;
}

function graphemeKind(grapheme: string) {
  if (grapheme.length > 1) return "complex";
  return VOWELS.has(grapheme) ? "vowel" : "consonant";
}

function textGraphemes(text: string) {
  const complex = ["ch", "ou", "on", "oi", "an", "ai", "ss"];
  const result: string[] = [];
  for (let index = 0; index < text.length;) {
    const pair = text.slice(index, index + 2);
    if (complex.includes(pair)) { result.push(pair); index += 2; }
    else { result.push(text[index]); index += 1; }
  }
  return result;
}

function ColoredWord({ word, revealSyllables = false }: { word: ReadingWord; revealSyllables?: boolean }) {
  if (revealSyllables) {
    return <span className="colored-word syllable-word">{word.syllables.map((syllable, index) => <span className={`syllable-part part-${index % 2}`} key={`${syllable}-${index}`}>{syllable}</span>)}</span>;
  }
  return <span className="colored-word">{word.graphemes.map((grapheme, index) => <span className={`grapheme-${graphemeKind(grapheme)}`} key={`${grapheme}-${index}`}>{grapheme}</span>)}</span>;
}

function ReadingFeedback({ message }: { message: string }) {
  return <div className={`mistake-feedback reading-feedback ${message ? "is-visible" : ""}`} role="status" aria-live="polite"><span aria-hidden="true">↻</span><span>{message || "\u00a0"}</span></div>;
}

function ListenButton({ text, label = "Écouter" }: { text: string; label?: string }) {
  return <button className="listen-button" onClick={() => speakFrench(text)} aria-label={`${label} : ${text}`}><span aria-hidden="true">▶</span>{label}</button>;
}

function ReadingButton({ children, onClick, color = "teal", disabled = false }: { children: ReactNode; onClick: () => void; color?: ReadingColor; disabled?: boolean }) {
  return <button className={`reading-primary color-${color}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function ReadingCelebration({ title, word, onNext }: { title: string; word?: string; onNext: () => void }) {
  useEffect(fanfare, []);
  return (
    <div className="reading-celebration" aria-live="polite">
      <div className="celebration-notes" aria-hidden="true"><span>♪</span><span>★</span><span>♫</span></div>
      {word && <strong>{word}</strong>}
      <h2>{title}</h2>
      <ReadingButton onClick={onNext}>Encore !</ReadingButton>
    </div>
  );
}

function ReadingLevelPicker({ value, onChange }: { value: Complexity; onChange: (level: Complexity) => void }) {
  return (
    <div className="complexity-picker reading-levels" aria-label="Choisir le niveau d’aide">
      <span className="complexity-label">Niveau</span>
      {READING_LEVELS.map((level) => (
        <button key={level.value} className={value === level.value ? "is-active" : ""} onClick={() => onChange(level.value)} aria-pressed={value === level.value} aria-label={`Niveau ${level.value} : ${level.label}`} title={level.label}>
          <span>{level.value}</span><small>{level.short}</small>
        </button>
      ))}
    </div>
  );
}

function ReadingKey({ value, kind, selected, wrong, onClick }: { value: string; kind: "left" | "right"; selected: boolean; wrong: boolean; onClick: () => void }) {
  return <button className={`piano-key key-${kind} ${selected ? "is-selected" : ""} ${wrong ? "is-wrong" : ""}`} onClick={onClick} aria-pressed={selected}><span>{value}</span><i aria-hidden="true" /></button>;
}

function letterOptions(round: ReturnType<typeof syllableRound>, complexity: Complexity) {
  return shuffleReading([
    round.syllable,
    ...round.leftOptions
      .flatMap((left) => round.rightOptions.map((right) => `${left}${right}`))
      .filter((value) => value !== round.syllable)
      .slice(0, complexity === 1 ? 1 : 3),
  ]);
}

function PianoGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => syllableRound(complexity));
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [joining, setJoining] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const later = useTimeouts();
  const play = () => {
    if (!left || !right || joining) { setMessage("Pose un doigt de chaque côté du piano."); return; }
    setJoining(true); setWrong(false); setMessage(""); beep(540, 0.08);
    later(() => {
      speakFrench(`${left}${right}`, 0.68);
      if (left === round.left && right === round.right) setDone(true);
      else { beep(200, 0.2); setWrong(true); setJoining(false); setMessage(`Tu as formé « ${left}${right} ». Réécoute puis change une touche.`); }
    }, 650);
  };
  const reset = () => { setRound(syllableRound(complexity)); setLeft(""); setRight(""); setJoining(false); setWrong(false); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title="Tu as chanté la syllabe !" word={round.syllable} onNext={reset} />;
  return (
    <section className="reading-game-state piano-game" data-scene={sceneData({ target: round.syllable, left, right, joining })}>
      <p className="instruction">Écoute, puis joue la syllabe avec deux touches</p>
      <ListenButton text={round.syllable} label="Écouter la syllabe" />
      {complexity === 1 && <div className="piano-guide" aria-label={`La syllabe à former est ${round.syllable}`}><span>{round.left}</span><i>+</i><span>{round.right}</span></div>}
      <div className={`reading-piano ${joining ? "is-joining" : ""}`}>
        <div className="piano-side consonant-side"><small>Je commence</small>{round.leftOptions.map((value) => <ReadingKey key={value} value={value} kind="left" selected={left === value} wrong={wrong && left === value} onClick={() => { setLeft(value); setWrong(false); setMessage(""); beep(420, .07); }} />)}</div>
        <div className="fusion-stage" aria-live="polite"><span>{left || "·"}</span><i aria-hidden="true">+</i><span>{right || "·"}</span><strong>{joining ? `${left}${right}` : ""}</strong></div>
        <div className="piano-side vowel-side"><small>Je termine</small>{round.rightOptions.map((value) => <ReadingKey key={value} value={value} kind="right" selected={right === value} wrong={wrong && right === value} onClick={() => { setRight(value); setWrong(false); setMessage(""); beep(660, .07); }} />)}</div>
      </div>
      <ReadingButton onClick={play} color="sun" disabled={!left || !right}>Chanter les deux touches</ReadingButton>
      <ReadingFeedback message={message} />
    </section>
  );
}

function SoundGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => soundRound(complexity));
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const pick = (word: ReadingWord) => {
    speakFrench(word.text);
    if (word === round.answer) { beep(860, .12); setDone(true); }
    else { beep(200, .2); setWrong(word.text); setMessage(`On entend « ${round.sound} » ailleurs. Écoute lentement chaque mot.`); }
  };
  const reset = () => { setRound(soundRound(complexity)); setWrong(null); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title={`Oui, on entend « ${round.sound} » !`} word={round.answer.text} onNext={reset} />;
  return (
    <section className="reading-game-state sound-game" data-scene={sceneData({ sound: round.sound, answer: round.answer.text, options: round.options.map((word) => word.text) })}>
      <p className="instruction">Quel mot contient ce son ?</p>
      <button className={`sound-orb grapheme-${graphemeKind(round.sound)}`} onClick={() => speakFrench(soundVoice(round.sound), .58)} aria-label={`Écouter le son ${round.sound}`}><span aria-hidden="true">♪</span><strong>{round.sound}</strong><small>touche pour écouter</small></button>
      <div className="picture-choices">
        {round.options.map((word) => <button key={word.text} className={wrong === word.text ? "is-wrong" : ""} onClick={() => pick(word)} aria-label={`${word.text}, écouter et choisir`}><span aria-hidden="true">{word.emoji}</span>{complexity === 1 ? <ColoredWord word={word} /> : <small>écouter</small>}</button>)}
      </div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function LettersGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => syllableRound(complexity));
  const [options, setOptions] = useState(() => letterOptions(round, complexity));
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const pick = (value: string) => {
    speakFrench(value, .66);
    if (value === round.syllable) { beep(860, .12); setDone(true); }
    else { beep(200, .2); setWrong(value); setMessage(`Ces lettres chantent « ${value} ». Réécoute la syllabe demandée.`); }
  };
  const reset = () => { const next = syllableRound(complexity); setRound(next); setOptions(letterOptions(next, complexity)); setWrong(null); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title="Tu as reconnu les lettres !" word={round.syllable} onNext={reset} />;
  return (
    <section className="reading-game-state letters-game" data-scene={sceneData({ target: round.syllable, options })}>
      <p className="instruction">Trouve les lettres qui écrivent la syllabe entendue</p>
      <ListenButton text={round.syllable} label="Écouter encore" />
      <div className="written-choices">{options.map((value) => <button key={value} className={wrong === value ? "is-wrong" : ""} onClick={() => pick(value)}>{textGraphemes(value).map((grapheme, index) => <span className={`grapheme-${graphemeKind(grapheme)}`} key={`${grapheme}-${index}`}>{grapheme}</span>)}</button>)}</div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function SyllablesGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => wordRound(complexity));
  const [tiles, setTiles] = useState(() => shuffleReading(round.answer.syllables).map((value, id) => ({ value, id })));
  const [chosen, setChosen] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const built = chosen.map((id) => tiles.find((tile) => tile.id === id)!.value).join("");
  const check = () => {
    if (chosen.length < tiles.length) { setMessage("Place toutes les syllabes avant de vérifier."); return; }
    if (built === round.answer.text) { speakFrench(round.answer.text); setDone(true); }
    else { beep(200, .2); setWrong(true); setMessage("Les syllabes sont là, mais pas encore dans l’ordre. Retire la dernière et recommence."); }
  };
  const reset = () => { const next = wordRound(complexity); setRound(next); setTiles(shuffleReading(next.answer.syllables).map((value, id) => ({ value, id }))); setChosen([]); setWrong(false); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title="Les syllabes forment le mot !" word={round.answer.text} onNext={reset} />;
  return (
    <section className="reading-game-state syllables-game" data-scene={sceneData({ word: round.answer.text, syllables: tiles.map((tile) => tile.value), chosen: chosen.map((id) => tiles.find((tile) => tile.id === id)!.value) })}>
      <p className="instruction">Range les syllabes pour écrire le mot</p>
      <div className="word-picture"><span aria-hidden="true">{round.answer.emoji}</span><ListenButton text={round.answer.text} /></div>
      <div className={`word-building-line ${wrong ? "is-wrong" : ""}`}>{chosen.length ? chosen.map((id, index) => <span className={`part-${index % 2}`} key={id}>{tiles.find((tile) => tile.id === id)!.value}</span>) : <small>le mot se construit ici</small>}</div>
      <div className="syllable-bank">{tiles.map((tile) => <button key={tile.id} disabled={chosen.includes(tile.id)} onClick={() => { setChosen((current) => [...current, tile.id]); setWrong(false); setMessage(""); beep(560, .06); }}>{tile.value}</button>)}</div>
      <div className="reading-actions"><button className="reading-undo" onClick={() => setChosen((current) => current.slice(0, -1))} disabled={!chosen.length}>↶ Retirer</button><ReadingButton onClick={check}>Vérifier</ReadingButton></div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function PictureGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => wordRound(complexity));
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const pick = (word: ReadingWord) => {
    if (word === round.answer) { speakFrench(word.text); setDone(true); }
    else { beep(200, .2); setWrong(word.text); setMessage("Lis jusqu’au bout : le début ressemble, mais ce n’est pas le mot de l’image."); }
  };
  const reset = () => { setRound(wordRound(complexity)); setWrong(null); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title="Tu as lu le bon mot !" word={round.answer.text} onNext={reset} />;
  return (
    <section className="reading-game-state picture-word-game" data-scene={sceneData({ picture: round.answer.emoji, answer: round.answer.text, options: round.options.map((word) => word.text) })}>
      <p className="instruction">Lis et trouve le mot de l’image</p>
      <div className="hero-picture"><span aria-hidden="true">{round.answer.emoji}</span><ListenButton text={round.answer.text} label="Écouter l’image" /></div>
      <div className="word-choices">{round.options.map((word) => <button key={word.text} className={wrong === word.text ? "is-wrong" : ""} onClick={() => pick(word)}><ColoredWord word={word} revealSyllables={complexity === 1} /></button>)}</div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function ClapsGame({ complexity }: { complexity: Complexity }) {
  const [word, setWord] = useState(() => clapWord(complexity));
  const [options, setOptions] = useState(() => syllableCountOptions(word));
  const [wrong, setWrong] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const answer = word.syllables.length;
  const pick = (count: number) => {
    if (count === answer) { speakFrench(word.syllables.join(". "), .63); setDone(true); }
    else { beep(200, .2); setWrong(count); setMessage(`Frappe dans tes mains en disant « ${word.text} » très lentement.`); }
  };
  const reset = () => { const next = clapWord(complexity); setWord(next); setOptions(syllableCountOptions(next)); setWrong(null); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title={`${answer} syllabe${answer > 1 ? "s" : ""}, bien frappé !`} word={word.syllables.join(" · ")} onNext={reset} />;
  return (
    <section className="reading-game-state claps-game" data-scene={sceneData({ word: word.text, answer, options })}>
      <p className="instruction">Combien de morceaux entends-tu dans ce mot ?</p>
      <div className="clap-word"><span aria-hidden="true">{word.emoji}</span><strong>{complexity === 1 ? word.text : "?"}</strong><ListenButton text={word.text} /></div>
      <div className="clap-choices">{options.map((count) => <button key={count} className={wrong === count ? "is-wrong" : ""} onClick={() => pick(count)} aria-label={`${count} syllabe${count > 1 ? "s" : ""}`}><span>{Array.from({ length: count }, (_, index) => <i key={index} />)}</span><strong>{count}</strong></button>)}</div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function SentenceGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => sentenceRound(complexity));
  const [tiles, setTiles] = useState(() => shuffleReading(round.words).map((value, id) => ({ value, id })));
  const [chosen, setChosen] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);
  const built = chosen.map((id) => tiles.find((tile) => tile.id === id)!.value).join(" ");
  const target = round.words.join(" ");
  const check = () => {
    if (chosen.length < tiles.length) { setMessage("La phrase a encore besoin de tous ses mots."); return; }
    if (built === target) { speakFrench(round.sentence); setDone(true); }
    else { beep(200, .2); setWrong(true); setMessage("Commence par la majuscule. Puis cherche qui fait l’action."); }
  };
  const reset = () => { const next = sentenceRound(complexity); setRound(next); setTiles(shuffleReading(next.words).map((value, id) => ({ value, id }))); setChosen([]); setMessage(""); setWrong(false); setDone(false); };
  if (done) return <ReadingCelebration title="La phrase raconte quelque chose !" word={round.sentence} onNext={reset} />;
  return (
    <section className="reading-game-state sentence-game" data-scene={sceneData({ target: round.sentence, words: tiles.map((tile) => tile.value), chosen: chosen.map((id) => tiles.find((tile) => tile.id === id)!.value) })}>
      <p className="instruction">Range les mots pour construire la phrase</p>
      {complexity === 1 && <ListenButton text={round.sentence} label="Écouter la phrase" />}
      <div className={`sentence-line ${wrong ? "is-wrong" : ""}`}>{chosen.map((id) => <span key={id}>{tiles.find((tile) => tile.id === id)!.value}</span>)}<i>.</i></div>
      <div className="sentence-bank">{tiles.map((tile) => <button key={tile.id} disabled={chosen.includes(tile.id)} onClick={() => { setChosen((current) => [...current, tile.id]); setWrong(false); setMessage(""); }}>{tile.value}</button>)}</div>
      <div className="reading-actions"><button className="reading-undo" onClick={() => setChosen((current) => current.slice(0, -1))} disabled={!chosen.length}>↶ Retirer</button><ReadingButton onClick={check}>Lire la phrase</ReadingButton></div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function IntruderGame({ complexity }: { complexity: Complexity }) {
  const [round, setRound] = useState(() => intruderRound(complexity));
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const pick = (word: ReadingWord) => {
    speakFrench(word.text);
    if (word === round.answer) setDone(true);
    else { beep(200, .2); setWrong(word.text); setMessage(`On entend bien « ${round.sound} » dans ce mot. Cherche celui qui chante autrement.`); }
  };
  const reset = () => { setRound(intruderRound(complexity)); setWrong(null); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title="Cet intrus ne chante pas pareil !" word={round.answer.text} onNext={reset} />;
  return (
    <section className="reading-game-state intruder-game" data-scene={sceneData({ familySound: round.sound, intruder: round.answer.text, options: round.options.map((word) => word.text) })}>
      <p className="instruction">Trois mots contiennent le son, un seul est différent</p>
      <button className={`family-sound grapheme-${graphemeKind(round.sound)}`} onClick={() => speakFrench(soundVoice(round.sound), .58)}><span>La famille</span><strong>{round.sound}</strong><small>♪ écouter</small></button>
      <div className="intruder-choices">{round.options.map((word) => <button key={word.text} className={wrong === word.text ? "is-wrong" : ""} onClick={() => pick(word)}><span aria-hidden="true">{word.emoji}</span><ColoredWord word={word} /></button>)}</div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function DictationGame({ complexity }: { complexity: Complexity }) {
  const create = () => {
    const candidates = wordsForLevel(complexity).filter((word) => word.graphemes.length <= (complexity === 1 ? 4 : 6));
    const answer = candidates[Math.floor(Math.random() * candidates.length)];
    return { answer, tiles: dictationTiles(answer, complexity).map((value, id) => ({ value, id })) };
  };
  const [round, setRound] = useState(create);
  const [chosen, setChosen] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const built = chosen.map((id) => round.tiles.find((tile) => tile.id === id)!.value).join("");
  const check = () => {
    if (built === round.answer.text) { speakFrench(round.answer.text); setDone(true); }
    else { beep(200, .2); setWrong(true); setMessage(built.length < round.answer.text.length ? "Le mot n’est pas fini. Réécoute et ajoute les lettres qui manquent." : "Réécoute depuis le début, puis retire la dernière lettre qui ne convient pas."); }
  };
  const reset = () => { setRound(create()); setChosen([]); setWrong(false); setMessage(""); setDone(false); };
  if (done) return <ReadingCelebration title="Tu as écrit le mot entendu !" word={round.answer.text} onNext={reset} />;
  return (
    <section className="reading-game-state dictation-game" data-scene={sceneData({ answer: round.answer.text, tiles: round.tiles.map((tile) => tile.value), chosen: chosen.map((id) => round.tiles.find((tile) => tile.id === id)!.value) })}>
      <p className="instruction">Écoute le mot et écris-le avec les touches</p>
      <div className="dictation-prompt"><span aria-hidden="true">{round.answer.emoji}</span><ListenButton text={round.answer.text} label="Écouter le mot" /></div>
      <div className={`dictation-line ${wrong ? "is-wrong" : ""}`}>{chosen.length ? chosen.map((id) => { const tile = round.tiles.find((candidate) => candidate.id === id)!; return <span className={`grapheme-${graphemeKind(tile.value)}`} key={id}>{tile.value}</span>; }) : <small>pose les lettres ici</small>}</div>
      <div className="letter-bank">{round.tiles.map((tile) => <button key={tile.id} disabled={chosen.includes(tile.id)} className={`grapheme-${graphemeKind(tile.value)}`} onClick={() => { setChosen((current) => [...current, tile.id]); setWrong(false); setMessage(""); beep(560, .05); }}>{tile.value}</button>)}</div>
      <div className="reading-actions"><button className="reading-undo" onClick={() => setChosen((current) => current.slice(0, -1))} disabled={!chosen.length}>↶ Retirer</button><ReadingButton onClick={check}>Vérifier</ReadingButton></div>
      <ReadingFeedback message={message} />
    </section>
  );
}

function ReadingNav({ game, onSelect }: { game: ReadingGameId; onSelect: (game: ReadingGameId) => void }) {
  const group = (label: string, games: ReadingGameInfo[]) => (
    <div className="nav-group">
      <span className="nav-label">{label}</span>
      <div className="nav-options">{games.map((item) => <button key={item.id} className={`game-tab reading-tab color-${item.color} ${game === item.id ? "is-active" : ""}`} onClick={() => onSelect(item.id)} aria-pressed={game === item.id}><span className="tab-icon" aria-hidden="true">{item.icon}</span>{item.label}</button>)}</div>
    </div>
  );
  return <nav className="game-nav reading-game-nav" aria-label="Choisir un jeu de lecture">{group("Je découvre", DISCOVER_GAMES)}{group("Je m’entraîne", TRAIN_GAMES)}{group("Je maîtrise", MASTER_GAMES)}</nav>;
}

export default function ReadingPage() {
  const [game, setGame] = useState<ReadingGameId>("piano");
  const [levels, setLevels] = useState<Record<ReadingGameId, Complexity>>({ piano: 1, sounds: 1, letters: 1, syllables: 1, picture: 1, claps: 1, sentence: 1, intruder: 1, dictation: 1 });
  const selected = ALL_GAMES.find((item) => item.id === game)!;
  const complexity = levels[game];
  return (
    <>
      <ReadingNav game={game} onSelect={setGame} />
      <section className={`game-stage reading-stage accent-${selected.color}`} aria-label={selected.label} data-reading-game={game} data-complexity={complexity}>
        <div className="stage-title"><div className="stage-name"><span>{selected.icon}</span><h2>{selected.label}</h2></div><ReadingLevelPicker value={complexity} onChange={(level) => setLevels((current) => ({ ...current, [game]: level }))} /></div>
        <div className="reading-key" aria-label="Code couleur des lettres"><span className="grapheme-consonant">Consonne</span><span className="grapheme-vowel">Voyelle</span><span className="grapheme-complex">Son de plusieurs lettres</span></div>
        <div className="stage-body reading-stage-body" key={`${game}-${complexity}`}>
          {game === "piano" && <PianoGame complexity={complexity} />}
          {game === "sounds" && <SoundGame complexity={complexity} />}
          {game === "letters" && <LettersGame complexity={complexity} />}
          {game === "syllables" && <SyllablesGame complexity={complexity} />}
          {game === "picture" && <PictureGame complexity={complexity} />}
          {game === "claps" && <ClapsGame complexity={complexity} />}
          {game === "sentence" && <SentenceGame complexity={complexity} />}
          {game === "intruder" && <IntruderGame complexity={complexity} />}
          {game === "dictation" && <DictationGame complexity={complexity} />}
        </div>
      </section>
    </>
  );
}
