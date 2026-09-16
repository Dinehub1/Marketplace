import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Per-game round records, stored on the device.
 *
 * Both games used to say "Best score this session", which is not a score anyone
 * can beat: it resets to 0 every time the app is opened, so the number on the
 * start screen is almost always the round you just played. The record now
 * survives the app being closed, and it keeps the last few rounds with it, so
 * the end-of-round screen can show what actually happened rather than a single
 * number.
 *
 * It is device-local on purpose (AsyncStorage, not the account, not a Supabase
 * table): there is no server-side score table, and a score labelled as global
 * when it is one phone's would be a lie on the screen. Every label that shows
 * one of these numbers says "on this device".
 *
 * Stored shape, under one key so a game added later needs no migration:
 *   { "<game>": { best, rounds, recent: [{ score, line, at }] } }
 */
const KEY = "hermes-game-scores";

/** Rounds kept per game. The last five are what the summary screen lists. */
const RECENT_MAX = 5;

export type GameRound = {
  score: number;
  /** What the round looked like, in the game's own words (e.g. "9 dots hit"). */
  line: string;
  /** Epoch ms. */
  at: number;
};

export type GameRecord = {
  /** Highest score ever recorded on this device. */
  best: number;
  /** Finished rounds recorded on this device. */
  rounds: number;
  /** Newest first. */
  recent: GameRound[];
};

export type GameScores = Record<string, GameRecord>;

export const EMPTY_RECORD: GameRecord = { best: 0, rounds: 0, recent: [] };

export type RoundResult = {
  record: GameRecord;
  /** True when this round beat the stored best — the badge's only honest source. */
  isNewBest: boolean;
  /** The best before this round, for "was 480" style copy. */
  previousBest: number;
};

/** Storage can hold anything (an older build, a hand-edited value); a record is
 *  only usable when its fields are the right shape, so a corrupt entry is
 *  treated as absent rather than crashing a game on launch. */
function saneRecord(value: unknown): GameRecord {
  if (!value || typeof value !== "object") return { ...EMPTY_RECORD };
  const v = value as Partial<GameRecord>;
  const best = typeof v.best === "number" && Number.isFinite(v.best) ? v.best : 0;
  const rounds = typeof v.rounds === "number" && Number.isFinite(v.rounds) ? v.rounds : 0;
  const recent = Array.isArray(v.recent)
    ? v.recent
        .filter(
          (r): r is GameRound =>
            !!r && typeof r === "object" && typeof (r as GameRound).score === "number",
        )
        .map((r) => ({
          score: r.score,
          line: typeof r.line === "string" ? r.line : "",
          at: typeof r.at === "number" ? r.at : 0,
        }))
        .slice(0, RECENT_MAX)
    : [];
  return { best, rounds, recent };
}

export async function loadGameScores(): Promise<GameScores> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: GameScores = {};
    for (const [game, value] of Object.entries(parsed)) out[game] = saneRecord(value);
    return out;
  } catch {
    // Corrupt or unreadable: start empty. A lost score is better than a game
    // that will not open.
    return {};
  }
}

/**
 * Records one finished round and returns the game's record afterwards.
 *
 * Called once per game over. Reads the stored scores first so two games (or a
 * round played while storage was still answering) cannot overwrite each other.
 */
export async function recordRound(
  game: string,
  score: number,
  line: string,
): Promise<RoundResult> {
  const scores = await loadGameScores();
  const before = scores[game] ?? EMPTY_RECORD;
  const round: GameRound = {
    score: Math.max(0, Math.round(score)),
    line,
    at: Date.now(),
  };
  const record: GameRecord = {
    best: Math.max(before.best, round.score),
    rounds: before.rounds + 1,
    recent: [round, ...before.recent].slice(0, RECENT_MAX),
  };
  const next: GameScores = { ...scores, [game]: record };
  // Failing to save must not break the summary screen, which already has the
  // numbers it needs in memory.
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  return { record, isNewBest: round.score > before.best, previousBest: before.best };
}

/** How long ago a round was played, in words a player reads rather than parses.
 *  `now` is a parameter so the wording is testable without freezing the clock. */
export function sinceLabel(at: number, now: number = Date.now()): string {
  if (!at) return "earlier";
  const ms = Math.max(0, now - at);
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
