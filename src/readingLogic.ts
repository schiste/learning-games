import { type Complexity } from "./gameLogic";

export type ReadingWord = {
  text: string;
  emoji: string;
  syllables: string[];
  graphemes: string[];
  sounds: string[];
};

export type SyllableRound = {
  syllable: string;
  left: string;
  right: string;
  leftOptions: string[];
  rightOptions: string[];
};

export type SoundRound = { sound: string; answer: ReadingWord; options: ReadingWord[] };
export type WordRound = { answer: ReadingWord; options: ReadingWord[] };
export type SentenceRound = { sentence: string; words: string[] };
export type IntruderRound = { sound: string; answer: ReadingWord; options: ReadingWord[] };

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function shuffleReading<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = randomInt(0, index);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

const SIMPLE_WORDS: ReadingWord[] = [
  { text: "ami", emoji: "🧑‍🤝‍🧑", syllables: ["a", "mi"], graphemes: ["a", "m", "i"], sounds: ["a", "m", "i"] },
  { text: "lama", emoji: "🦙", syllables: ["la", "ma"], graphemes: ["l", "a", "m", "a"], sounds: ["l", "a", "m"] },
  { text: "mur", emoji: "🧱", syllables: ["mur"], graphemes: ["m", "u", "r"], sounds: ["m", "u", "r"] },
  { text: "fil", emoji: "🧵", syllables: ["fil"], graphemes: ["f", "i", "l"], sounds: ["f", "i", "l"] },
  { text: "riz", emoji: "🍚", syllables: ["riz"], graphemes: ["r", "i", "z"], sounds: ["r", "i", "z"] },
  { text: "salami", emoji: "🥓", syllables: ["sa", "la", "mi"], graphemes: ["s", "a", "l", "a", "m", "i"], sounds: ["s", "a", "l", "m", "i"] },
];

const EXTENDED_WORDS: ReadingWord[] = [
  { text: "moto", emoji: "🏍️", syllables: ["mo", "to"], graphemes: ["m", "o", "t", "o"], sounds: ["m", "o", "t"] },
  { text: "vélo", emoji: "🚲", syllables: ["vé", "lo"], graphemes: ["v", "é", "l", "o"], sounds: ["v", "é", "l", "o"] },
  { text: "domino", emoji: "🁫", syllables: ["do", "mi", "no"], graphemes: ["d", "o", "m", "i", "n", "o"], sounds: ["d", "o", "m", "i", "n"] },
  { text: "banane", emoji: "🍌", syllables: ["ba", "na", "ne"], graphemes: ["b", "a", "n", "a", "n", "e"], sounds: ["b", "a", "n"] },
  { text: "tomate", emoji: "🍅", syllables: ["to", "ma", "te"], graphemes: ["t", "o", "m", "a", "t", "e"], sounds: ["t", "o", "m", "a"] },
  { text: "pirate", emoji: "🏴‍☠️", syllables: ["pi", "ra", "te"], graphemes: ["p", "i", "r", "a", "t", "e"], sounds: ["p", "i", "r", "a", "t"] },
];

const COMPLEX_WORDS: ReadingWord[] = [
  { text: "chat", emoji: "🐈", syllables: ["chat"], graphemes: ["ch", "a", "t"], sounds: ["ch", "a"] },
  { text: "loup", emoji: "🐺", syllables: ["loup"], graphemes: ["l", "ou", "p"], sounds: ["l", "ou"] },
  { text: "mouton", emoji: "🐑", syllables: ["mou", "ton"], graphemes: ["m", "ou", "t", "on"], sounds: ["m", "ou", "t", "on"] },
  { text: "poisson", emoji: "🐟", syllables: ["pois", "son"], graphemes: ["p", "oi", "ss", "on"], sounds: ["p", "oi", "s", "on"] },
  { text: "maison", emoji: "🏠", syllables: ["mai", "son"], graphemes: ["m", "ai", "s", "on"], sounds: ["m", "ai", "z", "on"] },
  { text: "douche", emoji: "🚿", syllables: ["dou", "che"], graphemes: ["d", "ou", "ch", "e"], sounds: ["d", "ou", "ch"] },
];

export function wordsForLevel(complexity: Complexity): ReadingWord[] {
  if (complexity === 1) return SIMPLE_WORDS;
  if (complexity === 2) return [...SIMPLE_WORDS, ...EXTENDED_WORDS];
  return [...EXTENDED_WORDS, ...COMPLEX_WORDS];
}

const SYLLABLES: Record<Complexity, Array<[string, string]>> = {
  1: [["l", "a"], ["m", "i"], ["r", "u"], ["s", "o"], ["f", "é"]],
  2: [["p", "a"], ["t", "i"], ["n", "o"], ["v", "é"], ["d", "u"], ["b", "a"]],
  3: [["ch", "a"], ["m", "ou"], ["p", "on"], ["v", "oi"], ["l", "an"], ["r", "ai"]],
};

export function syllableRound(complexity: Complexity): SyllableRound {
  const pairs = SYLLABLES[complexity];
  const [left, right] = pairs[randomInt(0, pairs.length - 1)];
  const otherLeft = shuffleReading(pairs.map((pair) => pair[0]).filter((value) => value !== left));
  const otherRight = shuffleReading(pairs.map((pair) => pair[1]).filter((value) => value !== right));
  return {
    syllable: `${left}${right}`,
    left,
    right,
    leftOptions: shuffleReading([left, ...otherLeft.slice(0, complexity === 1 ? 1 : 2)]),
    rightOptions: shuffleReading([right, ...otherRight.slice(0, complexity === 1 ? 1 : 2)]),
  };
}

export function soundRound(complexity: Complexity): SoundRound {
  const words = wordsForLevel(complexity);
  const preferredSounds = complexity === 1 ? ["l", "m", "r", "s", "f"] : complexity === 2 ? ["p", "t", "n", "v", "d", "b"] : ["ou", "on", "oi", "ch"];
  const sound = preferredSounds[randomInt(0, preferredSounds.length - 1)];
  const matches = words.filter((word) => word.sounds.includes(sound));
  const answer = matches[randomInt(0, matches.length - 1)];
  const distractors = shuffleReading(words.filter((word) => word !== answer && !word.sounds.includes(sound))).slice(0, 2);
  return { sound, answer, options: shuffleReading([answer, ...distractors]) };
}

export function wordRound(complexity: Complexity): WordRound {
  const words = wordsForLevel(complexity);
  const answer = words[randomInt(0, words.length - 1)];
  const distractors = shuffleReading(words.filter((word) => word !== answer)).slice(0, complexity === 1 ? 1 : 2);
  return { answer, options: shuffleReading([answer, ...distractors]) };
}

export function clapWord(complexity: Complexity): ReadingWord {
  const unambiguous = wordsForLevel(complexity).filter((word) => !["banane", "tomate", "pirate"].includes(word.text));
  return unambiguous[randomInt(0, unambiguous.length - 1)];
}

const SENTENCES: Record<Complexity, string[]> = {
  1: ["Lila a lu.", "Rémi a ri.", "Sam a lu."],
  2: ["Lina a vu la moto.", "Papa a lavé le vélo.", "Tom a vu le lama."],
  3: ["Le chat joue.", "Le loup va à la maison.", "Le mouton mange."],
};

export function sentenceRound(complexity: Complexity): SentenceRound {
  const sentence = SENTENCES[complexity][randomInt(0, SENTENCES[complexity].length - 1)];
  return { sentence, words: sentence.replace(".", "").split(" ") };
}

export function intruderRound(complexity: Complexity): IntruderRound {
  const words = wordsForLevel(complexity);
  const candidates = complexity === 1 ? ["a", "i", "m", "l"] : complexity === 2 ? ["o", "a", "t", "n"] : ["ou", "on", "ch"];
  const viable = candidates.filter((sound) => words.filter((word) => word.sounds.includes(sound)).length >= 3 && words.some((word) => !word.sounds.includes(sound)));
  const sound = viable[randomInt(0, viable.length - 1)];
  const family = shuffleReading(words.filter((word) => word.sounds.includes(sound))).slice(0, 3);
  const answer = shuffleReading(words.filter((word) => !word.sounds.includes(sound)))[0];
  return { sound, answer, options: shuffleReading([...family, answer]) };
}

export function syllableCountOptions(word: ReadingWord): number[] {
  const answer = word.syllables.length;
  return shuffleReading([1, 2, 3].filter((count) => count !== answer).slice(0, 2).concat(answer));
}

export function dictationTiles(word: ReadingWord, complexity: Complexity): string[] {
  const pools: Record<Complexity, string[]> = {
    1: ["a", "i", "o", "u", "l", "m", "r", "s", "f"],
    2: ["a", "i", "o", "u", "é", "p", "t", "n", "v", "d", "b", "e"],
    3: ["ou", "on", "oi", "ch", "ai", "a", "e", "l", "m", "p", "t", "s"],
  };
  const needed = [...word.graphemes];
  const distractor = shuffleReading(pools[complexity].filter((tile) => !needed.includes(tile)))[0];
  return shuffleReading([...needed, distractor]);
}
