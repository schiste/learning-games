import { type Complexity } from "./gameLogic";

export type Grade = "CP" | "CE1" | "CE2";
export type CoreSpaceId = "operations" | "multiplication" | "spelling" | "fractions" | "problems" | "time" | "money" | "grammar" | "measurement" | "geometry";
export type CoreStage = "discover" | "train" | "master";
export type CoreColor = "sky" | "leaf" | "coral" | "plum" | "sun";

export type CoreGameInfo = {
  id: string;
  label: string;
  icon: string;
  stage: CoreStage;
  timed?: boolean;
};

export type CoreSpace = {
  id: CoreSpaceId;
  label: string;
  shortLabel: string;
  icon: string;
  color: CoreColor;
  description: string;
  games: CoreGameInfo[];
};

export type CoreVisual = {
  kind: "equation" | "objects" | "groups" | "word" | "fraction" | "story" | "clock" | "coins" | "bars" | "shapes" | "calendar";
  text?: string;
  values?: number[];
  groups?: number;
  size?: number;
  numerator?: number;
  denominator?: number;
  hour?: number;
  minute?: number;
  symbols?: string[];
};

type RoundBase = {
  prompt: string;
  question: string;
  hint: string;
  narration?: string;
  visual: CoreVisual;
};

export type ChoiceRound = RoundBase & { mode: "choice"; options: string[]; answer: string };
export type BuildRound = RoundBase & {
  mode: "build";
  tokens: Array<{ label: string; value?: number }>;
  answer: string | number;
  rule: "text" | "sum";
};
export type OrderRound = RoundBase & { mode: "order"; tokens: string[]; answer: string[] };
export type SortRound = RoundBase & { mode: "sort"; categories: string[]; items: Array<{ label: string; category: string }> };
export type CounterRound = RoundBase & { mode: "counter"; start: number; target: number; steps: number[]; min: number; max: number };
export type CoreRound = ChoiceRound | BuildRound | OrderRound | SortRound | CounterRound;

const stage = (names: Array<[string, string, string, boolean?]>): CoreGameInfo[] => names.map(([id, label, icon, timed], index) => ({
  id,
  label,
  icon,
  stage: index < 3 ? "discover" : index < 6 ? "train" : "master",
  timed,
}));

export const CORE_SPACES: CoreSpace[] = [
  {
    id: "operations", label: "Additionner et soustraire", shortLabel: "Calculer", icon: "+−", color: "sky",
    description: "Ajouter, retirer, comparer et choisir une stratégie.",
    games: stage([
      ["wagons", "Les wagons", "▰"], ["towers", "Les tours", "▥"], ["elevator", "L’ascenseur", "↕"],
      ["bridge", "Le pont", "⌒"], ["families", "La famille", "◇"], ["op-balance", "La balance", "="],
      ["columns", "Les colonnes", "+"], ["op-maze", "Le labyrinthe", "±"], ["op-flash", "Calcul éclair", "60", true],
    ]),
  },
  {
    id: "multiplication", label: "Multiplier et partager", shortLabel: "Multiplier", icon: "×÷", color: "leaf",
    description: "Construire des groupes égaux, des rectangles et des partages.",
    games: stage([
      ["trays", "Les plateaux", "••"], ["garden", "Le jardin", "▦"], ["jumps", "Les bonds", "↗"],
      ["constellations", "Les constellations", "✦"], ["factor", "Le facteur caché", "?"], ["turn", "Le rectangle", "↻"],
      ["divide", "Le partage", "÷"], ["factory", "L’usine", "⚙"], ["table-flash", "Tables éclair", "60", true],
    ]),
  },
  {
    id: "spelling", label: "Orthographe et dictée", shortLabel: "Orthographe", icon: "abc", color: "coral",
    description: "Écouter, mémoriser et construire l’orthographe des mots.",
    games: stage([
      ["missing-letter", "La lettre cachée", "_"], ["silent-letter", "La lettre muette", "·"], ["accents", "Les accents", "^"],
      ["word-pieces", "Les morceaux", "ab"], ["word-family", "L’arbre des mots", "♧"], ["word-bricks", "Les briques", "▤"],
      ["flash-word", "Le mot flash", "◉"], ["dictation", "La dictée", "✎"], ["proofreader", "Le correcteur", "✓"],
    ]),
  },
  {
    id: "fractions", label: "Comprendre les fractions", shortLabel: "Fractions", icon: "½", color: "plum",
    description: "Partager un tout, comparer des parts et retrouver des équivalences.",
    games: stage([
      ["cake", "Le gâteau", "◔"], ["fold", "La bande pliée", "▭"], ["glass", "Le verre doseur", "▽"],
      ["fraction-twins", "Les jumelles", "="], ["fraction-line", "La ligne", "—"], ["fraction-battle", "La bataille", ">"],
      ["equivalent", "La machine", "↔"], ["fraction-puzzle", "Le puzzle", "+"], ["unequal-share", "Le partage impossible", "≠"],
    ]),
  },
  {
    id: "problems", label: "Résoudre des problèmes", shortLabel: "Problèmes", icon: "?", color: "sun",
    description: "Comprendre une situation, la représenter et organiser les étapes.",
    games: stage([
      ["animated-story", "L’histoire", "▶"], ["before-after", "Avant-après", "↔"], ["bar-model", "La barre", "▬"],
      ["right-question", "La bonne question", "?"], ["toolbox", "La boîte à outils", "±"], ["hidden-data", "La donnée cachée", "_"],
      ["plan", "Le plan", "1·2"], ["useless-data", "Le sac inutile", "⌫"], ["investigation", "L’enquête", "!"],
    ]),
  },
  {
    id: "time", label: "Se repérer dans le temps", shortLabel: "Le temps", icon: "◷", color: "sky",
    description: "Lire l’heure, mesurer des durées et utiliser le calendrier.",
    games: stage([
      ["clock", "L’horloge", "◷"], ["day", "Ma journée", "☀"], ["calendar", "Le calendrier", "▦"],
      ["clock-twins", "Les horloges jumelles", "="], ["duration", "Le ruban du temps", "—"], ["schedule", "L’emploi du temps", "▤"],
      ["journey", "Le voyage", "→"], ["mystery-date", "La date mystère", "?"], ["impossible-day", "La journée impossible", "!"],
    ]),
  },
  {
    id: "money", label: "Utiliser la monnaie", shortLabel: "La monnaie", icon: "€", color: "sun",
    description: "Composer, comparer et utiliser des montants dans de vrais choix.",
    games: stage([
      ["coin-exchange", "Les échanges", "↔"], ["wallet", "Le porte-monnaie", "●"], ["exact-payment", "Le paiement exact", "="],
      ["many-ways", "Plusieurs chemins", "≡"], ["wallets", "Les portefeuilles", ">"], ["cashier", "La caisse", "−"],
      ["shopping-list", "La liste de courses", "+"], ["budget", "Le budget", "≤"], ["receipt", "Le ticket", "!"],
    ]),
  },
  {
    id: "grammar", label: "Phrase et grammaire", shortLabel: "Grammaire", icon: "Aa", color: "coral",
    description: "Manipuler les mots, les accords et le temps des verbes.",
    games: stage([
      ["sentence-train", "Le train de la phrase", "…"], ["word-houses", "Les maisons des mots", "⌂"], ["who-does", "Qui fait quoi ?", "↔"],
      ["pronoun", "Le remplaçant", "↻"], ["agreement", "La fermeture éclair", "≋"], ["tense-wheel", "La roue du temps", "◌"],
      ["transform", "La transformation", "↔"], ["grammar-detective", "Le détective", "?"], ["sentence-repair", "L’atelier de réparation", "✓"],
    ]),
  },
  {
    id: "measurement", label: "Mesurer le monde", shortLabel: "Mesurer", icon: "↔", color: "leaf",
    description: "Comparer, mesurer, estimer et choisir la bonne unité.",
    games: stage([
      ["longest", "Le plus long", "↔"], ["mass-balance", "La balance", "⚖"], ["containers", "Les récipients", "▽"],
      ["ruler", "La règle", "▭"], ["right-unit", "La bonne unité", "?"], ["estimate", "Le pari", "≈"],
      ["unit-machine", "La machine à unités", "↔"], ["fence", "La clôture", "□"], ["building-site", "Le chantier", "+"],
    ]),
  },
  {
    id: "geometry", label: "Formes et espace", shortLabel: "Géométrie", icon: "△", color: "plum",
    description: "Observer les propriétés, construire et se déplacer dans l’espace.",
    games: stage([
      ["shape-sort", "Le tri des formes", "○△"], ["solids", "La boîte à solides", "◇"], ["where", "Où suis-je ?", "↖"],
      ["grid", "Le quadrillage", "▦"], ["set-square", "L’équerre", "∟"], ["mirror", "Le miroir", "◫"],
      ["tangram", "Le tangram", "△"], ["robot", "Le robot", "⌁"], ["constructor", "Le constructeur", "⌖"],
    ]),
  },
];

export function shuffleCore<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function maxForGrade(grade: Grade) {
  return grade === "CP" ? 20 : grade === "CE1" ? 100 : 1000;
}

function choice(prompt: string, question: string, answer: string, distractors: string[], visual: CoreVisual, hint: string, complexity: Complexity, narration?: string): ChoiceRound {
  const distinctDistractors = [...new Set(distractors)].filter((value) => value !== answer);
  const count = Math.min(distinctDistractors.length, complexity + 1);
  return { mode: "choice", prompt, question, answer, options: shuffleCore([answer, ...distinctDistractors.slice(0, count)]), visual, hint, narration };
}

function numericDistractors(answer: number, max: number) {
  const values = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 10, Math.max(0, max - answer)]
    .filter((value) => value >= 0 && value <= max && value !== answer);
  return [...new Set(values)].map(String);
}

function operationRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const max = maxForGrade(grade);
  const a = randomInt(grade === "CP" ? 2 : 8, Math.max(5, Math.floor(max * .55)));
  const b = randomInt(1, Math.max(2, Math.min(a, Math.floor(max * .3))));
  const sum = a + b;
  const difference = a - b;
  if (game === "wagons") return choice("Ajoute les voyageurs", `${a} voyageurs, puis ${b} montent. Combien maintenant ?`, String(sum), numericDistractors(sum, max), { kind: "objects", values: [a, b], symbols: ["🚃", "+", "🧒"] }, "Recompte le premier groupe puis ceux qui montent.", complexity);
  if (game === "towers") return choice("Compare les deux tours", `Quelle est la différence entre ${a} et ${b} ?`, String(difference), numericDistractors(difference, max), { kind: "bars", values: [a, b] }, "Regarde seulement la partie qui dépasse.", complexity);
  if (game === "elevator") return { mode: "counter", prompt: "Monte ou descends jusqu’à l’étage cible", question: `De ${b} à ${sum}`, start: b, target: sum, steps: complexity === 1 ? [1, -1] : [1, -1, 5, -5], min: 0, max: Math.max(sum + 3, grade === "CP" ? 20 : 120), visual: { kind: "equation", text: `${b} → ${sum}` }, hint: "Regarde si la cible est au-dessus ou au-dessous." };
  if (game === "bridge") {
    const base = grade === "CP" ? 10 : grade === "CE1" ? 100 : 1000;
    const start = grade === "CP" ? randomInt(2, 9) : base - randomInt(2, 18);
    const target = base - start;
    return { mode: "build", prompt: "Construis le pont jusqu’au prochain nombre rond", question: `${start} + ? = ${base}`, tokens: shuffleCore([1, 2, 5, 10, target]).map((value) => ({ label: `+${value}`, value })), answer: target, rule: "sum", visual: { kind: "bars", values: [start, base] }, hint: `La partie ajoutée doit mesurer exactement ${target}.` };
  }
  if (game === "families") return choice("Retrouve l’opération de la même famille", `${a} + ${b} = ${sum}`, `${sum} − ${b} = ${a}`, [`${sum} + ${b} = ${a}`, `${a} − ${b} = ${sum}`, `${sum} − ${a} = ${sum}`], { kind: "equation", text: `${a}  ${b}  ${sum}` }, "Les trois nombres restent les mêmes ; seul leur rôle change.", complexity);
  if (game === "op-balance") return { mode: "build", prompt: "Pose assez de poids pour équilibrer", question: `${a} + ? = ${sum}`, tokens: shuffleCore([1, 2, 5, 10, b]).map((value) => ({ label: String(value), value })), answer: b, rule: "sum", visual: { kind: "bars", values: [sum, a] }, hint: `Il manque ${b} entre les deux plateaux.` };
  if (game === "columns") return choice("Calcule colonne après colonne", `${a} + ${b}`, String(sum), numericDistractors(sum, max), { kind: "equation", text: `${a}\n+ ${b}` }, "Commence par les unités et échange dix unités contre une dizaine.", complexity);
  if (game === "op-maze") return { mode: "counter", prompt: "Choisis les déplacements jusqu’à la cible", question: `${b} → ${sum}`, start: b, target: sum, steps: complexity === 1 ? [1, 2] : complexity === 2 ? [2, 5, -1] : [5, 10, -2], min: 0, max: sum + 12, visual: { kind: "bars", values: [b, sum] }, hint: "Tu peux revenir en arrière ; surveille la distance restante." };
  const subtract = Math.random() < .5;
  const timedAnswer = subtract ? difference : sum;
  const timedText = `${a} ${subtract ? "−" : "+"} ${b}`;
  return choice("Calcule avant la fin du temps", timedText, String(timedAnswer), numericDistractors(timedAnswer, max), { kind: "equation", text: timedText }, "Décompose pour rejoindre un nombre rond.", complexity);
}

function multiplicationRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const tableMax = grade === "CP" ? 5 : grade === "CE1" ? 7 : 10;
  const groups = randomInt(2, tableMax);
  const size = randomInt(2, grade === "CP" ? 5 : 10);
  const product = groups * size;
  const visual: CoreVisual = { kind: "groups", groups, size, values: [groups, size] };
  if (game === "trays") return choice("Observe les groupes égaux", `${groups} plateaux de ${size} objets`, String(product), numericDistractors(product, 100), visual, "Compte chaque groupe de la même taille.", complexity);
  if (game === "garden") return choice("Compte les cases du rectangle", `${groups} lignes et ${size} colonnes`, String(product), numericDistractors(product, 100), visual, "Une ligne contient toujours le même nombre de cases.", complexity);
  if (game === "jumps") return choice("Suis les bonds égaux", `${groups} bonds de ${size}`, String(product), numericDistractors(product, 100), { kind: "bars", values: Array.from({ length: groups + 1 }, (_, index) => index * size) }, "Additionne la longueur du bond à chaque arrivée.", complexity);
  if (game === "constellations") return choice("Reconnais la quantité groupée", `${groups} groupes de ${size}`, `${groups} × ${size}`, [`${groups} + ${size}`, `${groups} × ${Math.max(1, size - 1)}`, `${size} − ${groups}`], visual, "Le premier nombre dit combien de groupes sont présents.", complexity);
  if (game === "factor") return choice("Trouve le facteur caché", `${groups} × ? = ${product}`, String(size), numericDistractors(size, 10), visual, `Cherche combien d’objets contient chaque groupe.`, complexity);
  if (game === "turn") return choice("Retourne le rectangle", `${groups} × ${size}`, `${size} × ${groups}`, [`${size} + ${groups}`, `${product} × 1`, `${groups} × ${groups}`], visual, "Le rectangle contient autant de cases quand on le tourne.", complexity);
  if (game === "divide") return choice("Partage sans oublier personne", `${product} objets dans ${groups} boîtes`, String(size), numericDistractors(size, 12), { ...visual, symbols: ["📦"] }, "Distribue un objet dans chaque boîte, puis recommence.", complexity);
  if (game === "factory") return { mode: "build", prompt: "Fabrique exactement la commande", question: `Commande : ${product}`, tokens: shuffleCore([groups, size, product, 2, 5]).map((value) => ({ label: `${value}`, value })), answer: product, rule: "sum", visual: { kind: "groups", groups, size }, hint: "Additionne les lots déposés dans la machine." };
  return choice("Réponds avec la table connue", `${groups} × ${size}`, String(product), numericDistractors(product, 100), visual, "Imagine le rectangle de lignes et de colonnes.", complexity);
}

type WordTask = { word: string; pieces: string[]; family: string; wrong: string; missing: string; answer: string; accent?: string };
const WORDS: Record<Grade, WordTask[]> = {
  CP: [
    { word: "chat", pieces: ["ch", "at"], family: "chaton", wrong: "cha", missing: "ch_t", answer: "a" },
    { word: "loup", pieces: ["l", "ou", "p"], family: "louve", wrong: "lou", missing: "l_up", answer: "ou" },
    { word: "vélo", pieces: ["vé", "lo"], family: "vélos", wrong: "vèlo", missing: "v_lo", answer: "é", accent: "é" },
  ],
  CE1: [
    { word: "chant", pieces: ["ch", "an", "t"], family: "chanter", wrong: "chan", missing: "chan_", answer: "t" },
    { word: "grand", pieces: ["gr", "an", "d"], family: "grande", wrong: "gran", missing: "gran_", answer: "d" },
    { word: "forêt", pieces: ["f", "o", "r", "ê", "t"], family: "forestier", wrong: "foré", missing: "for_t", answer: "ê", accent: "ê" },
  ],
  CE2: [
    { word: "longtemps", pieces: ["long", "temps"], family: "temporel", wrong: "longtemp", missing: "longtemp_", answer: "s" },
    { word: "impossible", pieces: ["im", "poss", "ible"], family: "possible", wrong: "inpossible", missing: "impo__ible", answer: "ss" },
    { word: "précisément", pieces: ["pré", "cisé", "ment"], family: "précis", wrong: "précisement", missing: "pr_cisément", answer: "é", accent: "é" },
  ],
};

const SILENT_WORDS: Record<Grade, Array<{ word: string; family: string; answer: string }>> = {
  CP: [{ word: "chat", family: "chaton", answer: "t" }, { word: "loup", family: "louve", answer: "p" }],
  CE1: [{ word: "grand", family: "grande", answer: "d" }, { word: "chant", family: "chanter", answer: "t" }],
  CE2: [{ word: "long", family: "longue", answer: "g" }, { word: "bavard", family: "bavarde", answer: "d" }],
};

function spellingRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const task = WORDS[grade][randomInt(0, WORDS[grade].length - 1)];
  const listen = `Écoute : ${task.word}.`;
  if (game === "missing-letter") return choice("Écoute puis complète le mot", task.missing, task.answer, ["a", "e", "i", "o", "u", "on", "an"].filter((value) => value !== task.answer), { kind: "word", text: task.missing }, "Dis le mot très lentement et repère la place vide.", complexity, listen);
  if (game === "silent-letter") {
    const silent = SILENT_WORDS[grade][randomInt(0, SILENT_WORDS[grade].length - 1)];
    return choice("Trouve la lettre finale avec le mot de la même famille", `${silent.word.slice(0, -1)}_ → ${silent.family}`, silent.answer, ["s", "t", "d", "p", "g"], { kind: "word", text: silent.family }, "Le mot de la même famille fait entendre la lettre cachée.", complexity, `${silent.word}. ${silent.family}.`);
  }
  if (game === "accents") {
    const accentTask = WORDS[grade].find((word) => word.accent) ?? task;
    return choice("Place le bon accent", accentTask.word.replace(/[éèê]/, "e"), accentTask.accent ?? "é", ["è", "ê", "é"].filter((value) => value !== accentTask.accent), { kind: "word", text: accentTask.word.replace(/[éèê]/, "e") }, "Écoute le son de la voyelle accentuée.", complexity, `Écoute : ${accentTask.word}.`);
  }
  if (game === "word-pieces") return { mode: "order", prompt: "Range les morceaux du mot entendu", question: "Construis le mot", tokens: shuffleCore(task.pieces), answer: task.pieces, visual: { kind: "word", text: "♪" }, hint: "Repars du premier son du mot.", narration: listen };
  if (game === "word-family") return choice("Trouve le mot de la même famille", task.word, task.family, ["soleil", "table", "courir", task.wrong], { kind: "word", text: task.word }, "Les mots d’une famille partagent une partie et une idée.", complexity, `${task.word}. ${task.family}.`);
  if (game === "word-bricks") return choice("Repère la brique solide du mot", task.word, [...task.pieces].sort((a, b) => b.length - a.length)[0], ["on", "ette", "tion", "ment"].filter((value) => !task.word.includes(value)), { kind: "word", text: task.word }, "Cherche le groupe de lettres que tu peux mémoriser d’un seul bloc.", complexity, listen);
  if (game === "flash-word" || game === "dictation") return { mode: "build", prompt: game === "flash-word" ? "Observe, cache mentalement, puis reconstruis" : "Écoute et écris avec les touches", question: game === "flash-word" ? task.word : "♪", tokens: shuffleCore([...task.pieces, "e", "s"].map((label) => ({ label }))), answer: task.word, rule: "text", visual: { kind: "word", text: game === "flash-word" ? task.word : "♪" }, hint: "Compare chaque morceau depuis le début du mot.", narration: listen };
  return choice("Trouve puis répare l’erreur", task.wrong, task.word, [task.wrong, `${task.word}s`, task.word.replace(/[aeiouéèê]/, "e")].filter((value) => value !== task.word), { kind: "word", text: task.wrong }, "Lis le mot morceau par morceau et vérifie sa famille.", complexity, `${task.wrong}. ${task.word}.`);
}

function fractionSet(grade: Grade) {
  if (grade === "CP") return { n: 1, d: [2, 4][randomInt(0, 1)] };
  const denominators = grade === "CE1" ? [3, 4, 6] : [4, 6, 8, 10];
  const d = denominators[randomInt(0, denominators.length - 1)];
  return { n: randomInt(1, Math.min(grade === "CE1" ? 3 : 5, d - 1)), d };
}

function fractionRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const { n, d } = fractionSet(grade);
  const fraction = `${n}/${d}`;
  const distractors = [`${Math.min(d, n + 1)}/${d}`, `${n}/${Math.max(2, d - 1)}`, `${d}/${n}`];
  const visual: CoreVisual = { kind: "fraction", numerator: n, denominator: d };
  if (game === "cake") return choice("Compte les parts colorées", "Quelle fraction du gâteau est colorée ?", fraction, distractors, visual, "Le nombre du bas compte toutes les parts égales.", complexity);
  if (game === "fold") return choice("Plie en parts égales", `Combien de parts pour faire des ${d === 2 ? "demis" : d === 3 ? "tiers" : "quarts"} ?`, String(d), [String(d - 1), String(d + 1), String(d * 2)], { kind: "fraction", numerator: 1, denominator: d }, "Toutes les parts doivent avoir exactement la même taille.", complexity);
  if (game === "glass") return choice("Observe le niveau du verre", "Quelle quantité est remplie ?", fraction, distractors, visual, "Compare la hauteur colorée à la hauteur totale.", complexity);
  if (game === "fraction-twins") {
    const factor = 2;
    return choice("Trouve la fraction qui représente la même quantité", fraction, `${n * factor}/${d * factor}`, [`${n + 1}/${d * factor}`, `${n}/${d * factor}`, `${n * factor}/${d}`], visual, "Découper chaque part en deux double le nombre de parts prises et totales.", complexity);
  }
  if (game === "fraction-line") {
    const ratio = n / d;
    const position = ratio < .4 ? "près de 0" : ratio > .6 ? "près de 1" : "au milieu";
    return choice("Situe la fraction entre zéro et un", `Où placer ${fraction} ?`, position, ["près de 0", "au milieu", "près de 1"], { kind: "equation", text: "0  ─────  1" }, "Imagine la barre découpée en parts égales, puis compte les parts prises.", complexity);
  }
  if (game === "fraction-battle") {
    const other = Math.min(d, n + 1);
    return choice("Choisis la plus grande part", `${fraction} ou ${other}/${d}`, `${other}/${d}`, [fraction, "égales"], visual, "Avec le même dénominateur, compare les numérateurs.", complexity);
  }
  if (game === "equivalent") return choice("Transforme sans changer la quantité", fraction, `${n * 2}/${d * 2}`, [`${n + 2}/${d + 2}`, `${n}/${d * 2}`, `${n * 2}/${d}`], visual, "Multiplie le haut et le bas par le même nombre.", complexity);
  if (game === "fraction-puzzle") return { mode: "build", prompt: "Assemble les parts jusqu’à la quantité demandée", question: fraction, tokens: Array.from({ length: Math.max(n + 1, 4) }, () => ({ label: `1/${d}`, value: 1 })), answer: n, rule: "sum", visual, hint: `Il faut ${n} part${n > 1 ? "s" : ""} de taille 1/${d}.` };
  return choice("Trouve le découpage qui n’est pas équitable", "Quel partage est impossible ?", "3 parts différentes", [`${d} parts égales`, "2 moitiés égales", "4 quarts égaux"], { kind: "fraction", numerator: 1, denominator: d }, "Un partage équitable donne des parts de même taille.", complexity);
}

function problemRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const max = grade === "CP" ? 20 : grade === "CE1" ? 100 : 500;
  const a = randomInt(5, Math.floor(max * .6));
  const b = randomInt(2, Math.min(12, a));
  const result = a + b;
  const narration = `Lina a ${a} billes. On lui donne ${b} billes.`;
  const story: CoreVisual = { kind: "story", text: `${a} 🔵  +  ${b} 🔵`, values: [a, b], symbols: ["🧒", "🔵"] };
  if (game === "animated-story") return choice("Regarde ce qui change", "Combien de billes à la fin ?", String(result), numericDistractors(result, max), story, "Les nouvelles billes rejoignent celles déjà présentes.", complexity, narration);
  if (game === "before-after") return choice("Retrouve la quantité de départ", `? + ${b} = ${result}`, String(a), numericDistractors(a, max), story, "Pars de la fin et retire ce qui a été ajouté.", complexity, narration);
  if (game === "bar-model") return choice("Lis le schéma en barres", `${a} et ${b} réunis`, String(result), numericDistractors(result, max), { kind: "bars", values: [a, b, result] }, "Les deux petites barres forment la grande.", complexity, narration);
  if (game === "right-question") return choice("Choisis la question que les données permettent de résoudre", narration, "Combien Lina a-t-elle de billes maintenant ?", ["Quelle est sa couleur préférée ?", "Quel âge a Lina ?", "Combien coûte une bille ?"], story, "La bonne question utilise les deux quantités de l’histoire.", complexity, narration);
  if (game === "toolbox") return choice("Choisis l’opération qui raconte l’histoire", narration, `${a} + ${b}`, [`${a} − ${b}`, `${a} × ${b}`, `${a} ÷ ${b}`], story, "Les billes arrivent : la quantité augmente.", complexity, narration);
  if (game === "hidden-data") return choice("Trouve la donnée qui manque", `Lina a ${a} billes puis en reçoit. Elle en a ${result}.`, String(b), numericDistractors(b, max), { kind: "story", text: `${a} + ? = ${result}` }, "Compare la quantité finale à celle du début.", complexity);
  if (game === "plan") return { mode: "order", prompt: "Range les étapes du problème", question: `Lina reçoit ${b} billes puis en donne 2.`, tokens: shuffleCore([`Ajouter ${b}`, "Retirer 2", "Donner la réponse"]), answer: [`Ajouter ${b}`, "Retirer 2", "Donner la réponse"], visual: story, hint: "Suis l’ordre des actions racontées.", narration };
  if (game === "useless-data") return choice("Retire l’information inutile", `Lina a ${a} billes, un pull rouge et reçoit ${b} billes.`, "un pull rouge", [String(a), String(b), "des billes"], story, "La réponse ne change pas si cette information disparaît.", complexity);
  return choice("Trouve l’étape qui explique l’erreur", `${a} + ${b} = ${result + 1}`, `${a} + ${b} vaut ${result}`, [`Il faut soustraire ${b}`, `${a} vaut ${a + 1}`, "Il manque une unité au départ"], { kind: "equation", text: `${a} + ${b} = ${result + 1}` }, "Recompte séparément puis réunis les deux groupes.", complexity, narration);
}

function timeRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const hour = randomInt(7, 18);
  const minuteStep = grade === "CP" ? 30 : grade === "CE1" ? 15 : 5;
  const minute = randomInt(1, Math.floor(55 / minuteStep)) * minuteStep;
  const formatted = `${hour} h ${String(minute).padStart(2, "0")}`;
  const visual: CoreVisual = { kind: "clock", hour, minute };
  if (game === "clock") return { mode: "counter", prompt: "Fais tourner l’aiguille jusqu’à l’heure demandée", question: formatted, start: 0, target: minute / minuteStep, steps: [1, -1], min: 0, max: Math.floor(60 / minuteStep) - 1, visual, hint: `Chaque déplacement vaut ${minuteStep} minutes.` };
  if (game === "day") {
    const moments = grade === "CP" ? ["Se lever", "Déjeuner", "Dîner", "Se coucher"] : grade === "CE1" ? ["Se lever", "Aller en classe", "Déjeuner", "Goûter", "Se coucher"] : ["Petit-déjeuner", "Départ", "Classe", "Déjeuner", "Retour", "Dîner"];
    return { mode: "order", prompt: "Range les moments de la journée", question: "Du matin au soir", tokens: shuffleCore(moments), answer: moments, visual: { kind: "story", symbols: ["🌅", "☀️", "🌙"] }, hint: "Commence quand le soleil se lève et suis les événements dans ta tête." };
  }
  if (game === "calendar") {
    if (grade === "CP") return choice("Avance dans le calendrier", "Quel jour vient après mardi ?", "mercredi", ["lundi", "jeudi", "samedi"], { kind: "calendar", text: "mardi → ?" }, "Récite les jours de la semaine dans l’ordre.", complexity);
    if (grade === "CE1") return choice("Avance dans le calendrier", "Trois jours après mardi", "vendredi", ["jeudi", "samedi", "dimanche"], { kind: "calendar", text: "mar + 3 jours" }, "Avance d’une case pour chaque jour écoulé.", complexity);
    return choice("Avance dans le calendrier", "Deux semaines après le 4 juin", "le 18 juin", ["le 16 juin", "le 11 juin", "le 24 juin"], { kind: "calendar", text: "4 juin + 14 jours" }, "Une semaine vaut sept jours ; deux semaines en valent quatorze.", complexity);
  }
  if (game === "clock-twins") return choice("Associe les deux écritures de l’heure", formatted, `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, [`${hour + 1}:${String(minute).padStart(2, "0")}`, `${hour}:${String((minute + minuteStep) % 60).padStart(2, "0")}`, `${minute}:${hour}`], visual, "Avant les deux points se trouvent les heures ; après, les minutes.", complexity);
  const duration = grade === "CP" ? 1 : grade === "CE1" ? 2 : 3;
  if (game === "duration") return choice("Mesure la durée sur le ruban", `De ${hour} h à ${hour + duration} h`, `${duration} h`, [`${duration + 1} h`, `${Math.max(1, duration - 1)} h`, `${hour + duration} h`], { kind: "bars", values: [hour, hour + duration] }, "Compte les intervalles, pas les graduations.", complexity);
  if (game === "schedule") return choice("Lis l’emploi du temps", `Atelier de ${hour} h à ${hour + duration} h`, `${duration} h`, [`${hour} h`, `${hour + duration} h`, `${duration + 1} h`], { kind: "calendar", text: `${hour} h ━ ${hour + duration} h` }, "La durée est la distance entre le début et la fin.", complexity);
  if (game === "journey") return choice("Calcule l’heure d’arrivée", `Départ ${hour} h, trajet ${duration} h`, `${hour + duration} h`, [`${hour - duration} h`, `${hour + duration + 1} h`, `${duration} h`], { kind: "story", symbols: ["🚆"], text: `${hour} h + ${duration} h` }, "Avance depuis l’heure de départ.", complexity);
  if (game === "mystery-date") return choice("Retrouve la date cachée", "Deux jours après le 12", "le 14", ["le 10", "le 13", "le 15"], { kind: "calendar", text: "12  13  ?" }, "Avance d’un jour deux fois.", complexity);
  return choice("Trouve ce qui ne peut pas fonctionner", "Une activité de 10 h à 9 h le même matin", "La fin arrive avant le début", ["Elle dure une heure", "Elle commence à 10 h", "Elle finit à 9 h"], { kind: "clock", hour: 10, minute: 0 }, "Sur la même matinée, les heures avancent.", complexity);
}

function moneyRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const max = grade === "CP" ? 20 : grade === "CE1" ? 100 : 200;
  const price = randomInt(2, Math.min(30, max - 1));
  const paid = grade === "CP" ? Math.ceil(price / 10) * 10 : Math.ceil(price / 20) * 20;
  const change = paid - price;
  const coinValues = grade === "CP" ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50];
  const visual: CoreVisual = { kind: "coins", values: [price, paid], symbols: ["€"] };
  const makePaymentTokens = (target: number) => {
    const pieces: number[] = [];
    let remaining = target;
    for (const value of [...coinValues].reverse()) {
      while (value <= remaining) {
        pieces.push(value);
        remaining -= value;
      }
    }
    return shuffleCore([...pieces, ...coinValues.filter((value) => value <= Math.max(target, 2)).slice(0, 3)])
      .map((value) => ({ label: `${value} €`, value }));
  };
  if (game === "coin-exchange") {
    if (grade === "CP") return choice("Trouve une valeur équivalente", "Une pièce de 2 €", "deux pièces de 1 €", ["une pièce de 1 €", "trois pièces de 1 €", "deux pièces de 2 €"], { kind: "coins", values: [2, 1, 1] }, "Additionne la valeur des petites pièces.", complexity);
    if (grade === "CE1") return choice("Trouve une valeur équivalente", "Un billet de 10 €", "deux pièces de 5 €", ["deux pièces de 2 €", "cinq pièces de 1 €", "un billet de 20 €"], { kind: "coins", values: [10, 5, 5] }, "Compare la valeur totale, pas le nombre de pièces.", complexity);
    return choice("Trouve une valeur équivalente", "1 euro", "100 centimes", ["10 centimes", "50 centimes", "1 000 centimes"], { kind: "equation", text: "1 € = ? c" }, "Un euro est composé de cent centimes.", complexity);
  }
  if (game === "wallet") {
    const wallet = makePaymentTokens(price).slice(0, -Math.min(3, coinValues.length));
    return choice("Compte le porte-monnaie", "Combien contient ce porte-monnaie ?", `${price} €`, [`${price - 1} €`, `${price + 1} €`, `${price + 2} €`], { kind: "coins", values: wallet.map((coin) => coin.value) }, "Compte d’abord les plus grandes valeurs.", complexity);
  }
  if (game === "exact-payment") return { mode: "build", prompt: "Pose exactement le prix demandé", question: `${price} €`, tokens: makePaymentTokens(price), answer: price, rule: "sum", visual, hint: "Commence par la plus grande pièce qui ne dépasse pas le prix." };
  if (game === "many-ways") {
    const target = Math.min(price, 12);
    return { mode: "build", prompt: "Trouve une autre façon de payer", question: `${target} €`, tokens: makePaymentTokens(target), answer: target, rule: "sum", visual, hint: "Plusieurs assemblages peuvent avoir la même valeur." };
  }
  if (game === "wallets") return choice("Choisis le portefeuille le plus riche", `${price} € ou ${price + 2} €`, `${price + 2} €`, [`${price} €`, "même somme"], { kind: "coins", values: [price, price + 2] }, "Compare les euros avant le nombre de pièces.", complexity);
  if (game === "cashier") return { mode: "build", prompt: "Rends exactement la monnaie", question: `${paid} € − ${price} €`, tokens: makePaymentTokens(change), answer: change, rule: "sum", visual, hint: `La monnaie à rendre vaut ${change} €.` };
  if (game === "shopping-list") return choice("Additionne les achats", `${price} € + 3 €`, `${price + 3} €`, [`${price} €`, `${price - 3} €`, `${price + 2} €`], visual, "Réunis les deux prix.", complexity);
  if (game === "budget") return choice("Choisis ce que le budget permet", `Budget ${paid} €`, `${price} €`, [`${paid + 1} €`, `${paid + 5} €`, `${paid * 2} €`], visual, "Le prix doit être inférieur ou égal au budget.", complexity);
  return choice("Repère l’erreur sur le ticket", `Prix ${price} €, payé ${paid} €, rendu ${change + 1} €`, `Il faut rendre ${change} €`, [`Il faut rendre ${change + 2} €`, `Le prix est ${paid} €`, "Le ticket est juste"], visual, "Prix + monnaie rendue doit redonner la somme payée.", complexity);
}

const GRAMMAR_BANK: Record<Grade, { sentence: string; words: Array<{ label: string; category: string }>; subject: string; verb: string }> = {
  CP: { sentence: "Le chat dort.", words: [{ label: "Le", category: "déterminant" }, { label: "chat", category: "nom" }, { label: "dort", category: "verbe" }], subject: "Le chat", verb: "dort" },
  CE1: { sentence: "Les petits chats jouent.", words: [{ label: "Les", category: "déterminant" }, { label: "petits", category: "adjectif" }, { label: "chats", category: "nom" }, { label: "jouent", category: "verbe" }], subject: "Les petits chats", verb: "jouent" },
  CE2: { sentence: "Demain, les enfants construiront une cabane.", words: [{ label: "Demain", category: "adverbe" }, { label: "les", category: "déterminant" }, { label: "enfants", category: "nom" }, { label: "construiront", category: "verbe" }, { label: "une", category: "déterminant" }, { label: "cabane", category: "nom" }], subject: "les enfants", verb: "construiront" },
};

function grammarRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const bank = GRAMMAR_BANK[grade];
  const visual: CoreVisual = { kind: "word", text: bank.sentence };
  const narration = bank.sentence;
  if (game === "sentence-train") return { mode: "order", prompt: "Remets les wagons dans l’ordre", question: "Construis la phrase", tokens: shuffleCore(bank.sentence.replace(/[.,]/g, "").split(" ")), answer: bank.sentence.replace(/[.,]/g, "").split(" "), visual, hint: "Repère qui agit, ce qu’il fait et les mots qui complètent l’idée.", narration };
  if (game === "word-houses") return { mode: "sort", prompt: "Range chaque mot dans sa maison", question: bank.sentence, categories: [...new Set(bank.words.map((word) => word.category))], items: shuffleCore(bank.words), visual, hint: "Demande-toi si le mot nomme, accompagne ou dit l’action.", narration };
  if (game === "who-does") return choice("Relie qui fait à ce qui se passe", bank.sentence, `${bank.subject} → ${bank.verb}`, [`${bank.verb} → ${bank.subject}`, `Le chat → joue`, `Les mots → ${bank.verb}`], visual, "Le sujet répond à « qui est-ce qui ? » devant le verbe.", complexity, narration);
  if (game === "pronoun") return choice("Remplace le sujet sans changer le sens", bank.subject, grade === "CP" ? "il" : "ils", ["elle", "elles", "nous"], visual, "Regarde si le sujet est singulier ou pluriel.", complexity, narration);
  if (game === "agreement") return choice("Ferme la chaîne d’accords", grade === "CP" ? "un chat noir" : "des chat_ noir_", grade === "CP" ? "un chat noir" : "des chats noirs", ["des chat noir", "des chats noir", "des chat noirs"], visual, "Le déterminant donne le nombre au nom et à l’adjectif.", complexity);
  if (game === "tense-wheel") return choice("Place l’action au bon moment", grade === "CP" ? "Aujourd’hui, il joue." : "Demain, il …", grade === "CP" ? "présent" : "jouera", ["jouait", "joue", "a joué"], { kind: "story", symbols: ["⌛", "●", "→"] }, "Le mot qui indique le moment commande le temps du verbe.", complexity);
  if (game === "transform") return choice(grade === "CE2" ? "Mets la phrase à la forme interrogative" : "Mets la phrase à la forme négative", bank.sentence, grade === "CE2" ? `Est-ce que ${bank.subject} ${bank.verb} ?` : `${bank.subject} ne ${bank.verb} pas.`, [`${bank.subject} pas ${bank.verb}.`, `Ne ${bank.subject} ${bank.verb}.`, bank.sentence], visual, "Garde le sujet et le verbe, puis ajoute les marques demandées.", complexity, narration);
  if (game === "grammar-detective") return choice("Trouve le verbe", bank.sentence, bank.verb, bank.words.map((word) => word.label).filter((word) => word !== bank.verb), visual, "Change le moment de la phrase : le mot qui change est le verbe.", complexity, narration);
  return choice("Répare la phrase", grade === "CP" ? "le chat dort" : "Les petit chats joue.", grade === "CP" ? "Le chat dort." : "Les petits chats jouent.", ["Le chat dort", "les chats joue.", "Les petit chats jouent."], visual, "Vérifie la majuscule, le point et les accords.", complexity);
}

function measurementRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const unit = grade === "CP" ? "cm" : grade === "CE1" ? "m" : "km";
  const a = randomInt(3, grade === "CP" ? 15 : 40);
  const b = randomInt(2, a - 1);
  const visual: CoreVisual = { kind: "bars", values: [a, b] };
  if (game === "longest") return choice("Compare sans compter au hasard", `${a} ${unit} ou ${b} ${unit}`, `${a} ${unit}`, [`${b} ${unit}`, "même longueur"], visual, "Aligne les deux objets au même point de départ.", complexity);
  if (game === "mass-balance") return choice("Observe de quel côté penche la balance", `${a} g ou ${b} g`, `${a} g est plus lourd`, [`${b} g est plus lourd`, "même masse"], visual, "Le plateau le plus bas porte la plus grande masse.", complexity);
  if (game === "containers") return choice("Compare les contenances", `${a} cL ou ${b} cL`, `${a} cL`, [`${b} cL`, "même contenance"], { kind: "objects", values: [a, b], symbols: ["🥛"] }, "Transvase mentalement : le récipient qui peut contenir l’autre est plus grand.", complexity);
  if (game === "ruler") return choice("Lis la graduation atteinte", `De 0 à ${a} ${unit}`, `${a} ${unit}`, [`${a - 1} ${unit}`, `${a + 1} ${unit}`, `${b} ${unit}`], { kind: "bars", values: Array.from({ length: Math.min(a + 1, 16) }, (_, index) => index) }, "La mesure commence au zéro de la règle.", complexity);
  if (game === "right-unit") return choice("Choisis une unité réaliste", grade === "CP" ? "La longueur d’un crayon" : grade === "CE1" ? "La longueur de la classe" : "La distance entre deux villes", grade === "CP" ? "cm" : grade === "CE1" ? "m" : "km", ["g", "L", grade === "CP" ? "km" : "mm"], { kind: "story", symbols: ["✏️", "🏫", "🏙️"] }, "Demande-toi quelle unité donnerait un nombre facile à utiliser.", complexity);
  if (game === "estimate") {
    if (grade === "CP") return choice("Estime avant de mesurer", "Un crayon mesure environ…", "15 cm", ["15 m", "2 km", "1 mm"], { kind: "bars", values: [15] }, "Compare avec la largeur de ta main.", complexity);
    if (grade === "CE1") return choice("Estime avant de mesurer", "La porte de la classe mesure environ…", "2 m", ["2 cm", "20 m", "2 km"], { kind: "story", symbols: ["🚪"] }, "Compare avec la taille d’un adulte.", complexity);
    return choice("Estime avant de mesurer", "Un trajet à pied dans le quartier mesure environ…", "1 km", ["1 cm", "10 m", "100 km"], { kind: "story", symbols: ["🚶", "🏘️"] }, "Imagine le temps nécessaire pour parcourir cette distance à pied.", complexity);
  }
  if (game === "unit-machine") return choice("Change d’unité sans changer la longueur", grade === "CE2" ? "3 m" : "1 m", grade === "CE2" ? "300 cm" : "100 cm", ["30 cm", "3 cm", "1 000 cm"], { kind: "equation", text: grade === "CE2" ? "3 m = ? cm" : "1 m = ? cm" }, "Un mètre contient cent centimètres.", complexity);
  if (game === "fence") {
    const width = randomInt(2, 6); const height = randomInt(2, 5); const perimeter = 2 * (width + height);
    return choice("Fais le tour de la clôture", `Rectangle ${width} m × ${height} m`, `${perimeter} m`, numericDistractors(perimeter, 40).map((value) => `${value} m`), { kind: "shapes", text: "rectangle", values: [width, height] }, "Additionne les quatre côtés.", complexity);
  }
  return choice("Choisis les mesures utiles au chantier", `Deux planches de ${a} ${unit}`, `${a * 2} ${unit}`, [`${a + 2} ${unit}`, `${a} ${unit}`, `${a - 2} ${unit}`], visual, "Les deux planches ont la même longueur.", complexity);
}

function geometryRound(game: string, grade: Grade, complexity: Complexity): CoreRound {
  const shapes = grade === "CP" ? ["cercle", "carré", "triangle"] : grade === "CE1" ? ["carré", "rectangle", "triangle"] : ["rectangle", "losange", "triangle"];
  const visual: CoreVisual = { kind: "shapes", symbols: shapes };
  if (game === "shape-sort") return { mode: "sort", prompt: "Range les formes selon leur propriété", question: "Observe les côtés", categories: ["aucun côté", "3 côtés", "4 côtés"], items: [{ label: "cercle", category: "aucun côté" }, { label: "triangle", category: "3 côtés" }, { label: "carré", category: "4 côtés" }, { label: "rectangle", category: "4 côtés" }], visual, hint: "Fais le tour de la forme avec ton doigt." };
  if (game === "solids") {
    if (grade === "CP") return choice("Reconnais le solide", "Il ressemble à un dé", "cube", ["boule", "cylindre", "pyramide"], { kind: "shapes", symbols: ["▰", "🎲"] }, "Toutes les faces visibles ont la forme d’un carré.", complexity);
    if (grade === "CE1") return choice("Reconnais le solide", "Il peut rouler et possède deux faces rondes", "cylindre", ["cube", "boule", "pyramide"], { kind: "shapes", symbols: ["🥫"] }, "Imagine une boîte de conserve posée puis couchée.", complexity);
    return choice("Reconnais le solide", "Il a deux faces triangulaires et trois faces rectangulaires", "prisme triangulaire", ["cube", "pyramide", "cylindre"], { kind: "shapes", symbols: ["△", "▭"] }, "Compte les faces selon leur forme, sans oublier celles qui sont cachées.", complexity);
  }
  if (game === "where") return choice("Suis les indications de position", "Le cercle est à gauche du carré", "○  □", ["□  ○", "○ au-dessus de □", "□ dans ○"], { kind: "shapes", symbols: ["○", "□"] }, "Commence par repérer ta gauche.", complexity);
  if (game === "grid") return { mode: "order", prompt: "Reproduis le déplacement case par case", question: "Du départ au drapeau", tokens: shuffleCore(["→", "→", "↓", "→"]), answer: ["→", "→", "↓", "→"], visual: { kind: "shapes", symbols: ["▦", "⚑"] }, hint: "Suis une flèche à la fois depuis la case de départ." };
  if (game === "set-square") return choice("Trouve l’angle droit", "Quel symbole montre un angle droit ?", "∟", ["∠", "⌒", "○"], { kind: "shapes", symbols: ["∟", "∠", "⌒"] }, "Un angle droit épouse exactement le coin de l’équerre.", complexity);
  if (game === "mirror") return choice("Complète la figure de l’autre côté du miroir", "△ | ?", "| △", ["△ △", "▽ |", "| ○"], { kind: "shapes", symbols: ["△", "│"] }, "Chaque point garde la même distance au miroir.", complexity);
  if (game === "tangram") return choice("Choisis les pièces qui forment la silhouette", "Construire un carré", "2 grands triangles + les 5 autres pièces", ["un seul triangle", "deux cercles", "trois rectangles"], { kind: "shapes", symbols: ["△", "△", "◇", "▱"] }, "Toutes les pièces doivent être utilisées sans se chevaucher.", complexity);
  if (game === "robot") return { mode: "order", prompt: "Programme le robot jusqu’au trésor", question: "Construis le trajet", tokens: shuffleCore(["Avancer", "Tourner à droite", "Avancer"]), answer: ["Avancer", "Tourner à droite", "Avancer"], visual: { kind: "shapes", symbols: ["🤖", "→", "💎"] }, hint: "Le robot tourne sur place avant d’avancer." };
  return { mode: "order", prompt: "Range les étapes de la construction", question: "Tracer un rectangle", tokens: shuffleCore(["Tracer un côté", "Former un angle droit", "Tracer le côté suivant", "Fermer la figure"]), answer: ["Tracer un côté", "Former un angle droit", "Tracer le côté suivant", "Fermer la figure"], visual, hint: "Une construction commence par un premier segment précis." };
}

export function makeCoreRound(space: CoreSpaceId, game: string, grade: Grade, complexity: Complexity): CoreRound {
  if (space === "operations") return operationRound(game, grade, complexity);
  if (space === "multiplication") return multiplicationRound(game, grade, complexity);
  if (space === "spelling") return spellingRound(game, grade, complexity);
  if (space === "fractions") return fractionRound(game, grade, complexity);
  if (space === "problems") return problemRound(game, grade, complexity);
  if (space === "time") return timeRound(game, grade, complexity);
  if (space === "money") return moneyRound(game, grade, complexity);
  if (space === "grammar") return grammarRound(game, grade, complexity);
  if (space === "measurement") return measurementRound(game, grade, complexity);
  return geometryRound(game, grade, complexity);
}
