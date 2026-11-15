import { ALL_STEPS, type Chapter, type Step } from "./curriculum";

export type Stars = 1 | 2 | 3;
/** Best result on one step: stars and points are both "best ever", plays counts every finish. */
export type StepRecord = { stars: Stars; best: number; plays: number };
/** Spaced-repetition state of one number fact (see facts.ts). `due` is a day number. */
export type FactStat = { box: number; right: number; wrong: number; due: number };
export type Profile = {
  id: string;
  name: string;
  avatar: string;
  /** Lifetime points: every finished step adds its score, so practice always counts. */
  points: number;
  steps: Record<string, StepRecord>;
  facts: Record<string, FactStat>;
  /** Scores of each timed minute, oldest first (last 20 kept), so the child can meet or beat their own record. */
  chrono: Record<string, number[]>;
  /** Consecutive days with at least one finished step or review, and the last such day. */
  streak: number;
  lastDay: number;
};
export type ProfileStore = { activeId: string | null; profiles: Profile[] };

export const AVATARS = ["🦊", "🐼", "🐸", "🦁", "🐰", "🐙", "🐯", "🦄", "🐧", "🐢"] as const;

const KEY = "dix-sur-dix:profiles:v1";
const LEGACY_PROGRESS_KEY = "dix-sur-dix:progress:v1";

type Reader = Pick<Storage, "getItem">;
type Writer = Pick<Storage, "setItem">;

/** Everything lives only in this browser. Storage can be missing, full or blocked, so every access is guarded. */
export function loadStore(storage: Reader | undefined = safeStorage()): ProfileStore {
  try {
    const raw = storage?.getItem(KEY);
    if (raw) return sanitizeStore(JSON.parse(raw));
    const legacy = storage?.getItem(LEGACY_PROGRESS_KEY);
    if (legacy) return migrateLegacy(JSON.parse(legacy));
  } catch {
    // Fall through to an empty store.
  }
  return { activeId: null, profiles: [] };
}

export function saveStore(store: ProfileStore, storage: Writer | undefined = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(store));
  } catch {
    // Playing still works; only what was remembered is lost.
  }
}

export function createProfile(store: ProfileStore, name: string, avatar: string, id = newId()): ProfileStore {
  const profile: Profile = { id, name: name.trim().slice(0, 20) || avatarName(avatar), avatar, points: 0, steps: {}, facts: {}, chrono: {}, streak: 0, lastDay: 0 };
  return { activeId: id, profiles: [...store.profiles, profile] };
}

export function removeProfile(store: ProfileStore, id: string): ProfileStore {
  const profiles = store.profiles.filter((profile) => profile.id !== id);
  return { activeId: store.activeId === id ? null : store.activeId, profiles };
}

export function activeProfile(store: ProfileStore): Profile | null {
  return store.profiles.find((profile) => profile.id === store.activeId) ?? null;
}

export function updateProfile(store: ProfileStore, id: string, change: (profile: Profile) => Profile): ProfileStore {
  return { ...store, profiles: store.profiles.map((profile) => (profile.id === id ? change(profile) : profile)) };
}

/** A finished step: keep the best stars and best score, count the play, and add the points to the lifetime total. */
export function recordStep(profile: Profile, stepId: string, stars: Stars, score: number): Profile {
  const before = profile.steps[stepId];
  const record: StepRecord = {
    stars: Math.max(before?.stars ?? 0, stars) as Stars,
    best: Math.max(before?.best ?? 0, score),
    plays: (before?.plays ?? 0) + 1,
  };
  return { ...profile, points: profile.points + score, steps: { ...profile.steps, [stepId]: record } };
}

export const CHRONO_HISTORY = 20;

/** Add a timed-minute score to the child's private history. */
export function recordChrono(profile: Profile, stepId: string, score: number): Profile {
  const history = [...(profile.chrono[stepId] ?? []), score].slice(-CHRONO_HISTORY);
  return { ...profile, chrono: { ...profile.chrono, [stepId]: history } };
}

export function chronoRecord(profile: Profile, stepId: string): number {
  return Math.max(0, ...(profile.chrono[stepId] ?? []));
}

/** Count today as a playing day: playing again tomorrow grows the streak, skipping a day restarts it. */
export function markPlayed(profile: Profile, day: number): Profile {
  if (profile.lastDay === day) return profile;
  return { ...profile, streak: profile.lastDay === day - 1 ? profile.streak + 1 : 1, lastDay: day };
}

/** Lifetime points earned outside the steps (daily review). */
export function addPoints(profile: Profile, points: number): Profile {
  return { ...profile, points: profile.points + points };
}

export function totalStars(profile: Profile): number {
  return Object.values(profile.steps).reduce((sum, record) => sum + record.stars, 0);
}

/** A chapter's score is the sum of its best step scores: replaying a step improves it, never inflates it. */
export function chapterScore(profile: Profile, chapter: Chapter): { stars: number; best: number; done: number } {
  return chapter.steps.reduce(
    (sum, step) => {
      const record = profile.steps[step.id];
      return record ? { stars: sum.stars + record.stars, best: sum.best + record.best, done: sum.done + 1 } : sum;
    },
    { stars: 0, best: 0, done: 0 },
  );
}

/** Where "Continuer" leads: the first step not finished yet, or the first step once everything is done. */
export function suggestedStep(profile: Profile, steps: Step[] = ALL_STEPS): Step {
  return steps.find((step) => !profile.steps[step.id]) ?? steps[0];
}

function migrateLegacy(raw: unknown): ProfileStore {
  const store = createProfile({ activeId: null, profiles: [] }, "", AVATARS[0]);
  const steps: Record<string, StepRecord> = {};
  if (raw && typeof raw === "object") {
    for (const [id, value] of Object.entries(raw)) {
      if (value === 1 || value === 2 || value === 3) steps[id] = { stars: value, best: 0, plays: 1 };
    }
  }
  store.profiles[0].steps = steps;
  return store;
}

function sanitizeStore(raw: unknown): ProfileStore {
  if (!raw || typeof raw !== "object") return { activeId: null, profiles: [] };
  const candidate = raw as Partial<ProfileStore>;
  const profiles = Array.isArray(candidate.profiles)
    ? candidate.profiles.filter((profile): profile is Profile => Boolean(profile && typeof profile.id === "string" && typeof profile.name === "string"))
      .map((profile) => ({ ...profile, points: Number(profile.points) || 0, steps: profile.steps ?? {}, facts: profile.facts ?? {}, chrono: profile.chrono ?? {}, streak: Number(profile.streak) || 0, lastDay: Number(profile.lastDay) || 0 }))
    : [];
  const activeId = profiles.some((profile) => profile.id === candidate.activeId) ? candidate.activeId ?? null : null;
  return { activeId, profiles };
}

function avatarName(avatar: string): string {
  const names: Record<string, string> = { "🦊": "Renard", "🐼": "Panda", "🐸": "Grenouille", "🦁": "Lion", "🐰": "Lapin", "🐙": "Pieuvre", "🐯": "Tigre", "🦄": "Licorne", "🐧": "Pingouin", "🐢": "Tortue" };
  return names[avatar] ?? "Moi";
}

function newId(): string {
  return `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
