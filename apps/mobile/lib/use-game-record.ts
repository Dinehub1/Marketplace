import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  EMPTY_RECORD,
  loadGameScores,
  recordRound as persistRound,
  type GameRecord,
  type RoundResult,
} from "@/lib/game-scores";

/**
 * The device record for one game, with the read-on-mount dance done once.
 *
 * `lib/game-scores.ts` has always owned the storage and the rules; what every game
 * screen repeated around it was the wiring: a `record` state seeded from `EMPTY_RECORD`,
 * a `recordRead` flag, a mount effect that loads and guards against setting state after
 * unmount, and a round-over effect that persists and folds the result back in. That is
 * four things per screen across seven screens, and the repetition had already cost a
 * real bug — `crossword.tsx` imported `recordRound` but never `loadGameScores`, so its
 * record stayed `EMPTY_RECORD` forever and "New best" could never appear. It wrote a
 * score and never read one back.
 *
 * Two things about this hook are load-bearing rather than stylistic:
 *
 *   • `ready` exists because `record.best` is `0` both "before the read finishes" and
 *     "genuinely no score yet". A screen that reads `record.best` to decide whether a
 *     round was a record needs to tell those apart, or the first round of a fresh
 *     install gets celebrated as a record. `ready` is set in a `finally`, so a storage
 *     failure still unblocks the screen — a game must not be stuck behind its own
 *     scoreboard.
 *
 *   • `onNewBest` is called from the persist result, not from comparing numbers in the
 *     screen. `recordRound` is the only thing that knows the stored best, so it is the
 *     only honest source for "was this actually a record" — the rule the old comment in
 *     `tap-sprint.tsx` was already asserting.
 *
 * Returns `best` as `ready ? record.best : null` so a caller cannot accidentally render
 * the pre-read zero as a real score.
 */
export type UseGameRecordResult = {
  /** The stored record. `EMPTY_RECORD` until the first read completes. */
  record: GameRecord;
  /** True once the stored scores have been read (or the read failed). */
  ready: boolean;
  /** `record.best` once ready, else `null` — never a misleading `0`. */
  best: number | null;
  /** Persist a finished round and fold the result into `record`. */
  saveRound: (score: number, line: string) => Promise<RoundResult>;
  /**
   * The best *before* the most recent `saveRound`, so a win screen can say "was 480"
   * without recomputing it. `null` until a round has been saved this session.
   */
  previousBest: number | null;
};

export function useGameRecord(
  game: string,
  onNewBest?: (result: RoundResult) => void,
): UseGameRecordResult {
  const [record, setRecord] = useState<GameRecord>(EMPTY_RECORD);
  const [ready, setReady] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  // Held in a ref so an inline arrow prop does not have to be memoised by the caller
  // before `saveRound` can stay stable. Updated in an effect rather than during render:
  // writing a ref while rendering breaks under React's concurrent renderer, which may
  // render a component and never commit it — and it is the `react-hooks/refs` rule this
  // repo currently carries 274 warnings for, so it is not a rule to add to.
  const onNewBestRef = useRef(onNewBest);
  useEffect(() => {
    onNewBestRef.current = onNewBest;
  }, [onNewBest]);

  useEffect(() => {
    let live = true;
    loadGameScores()
      .then((scores) => {
        if (live) setRecord(scores[game] ?? EMPTY_RECORD);
      })
      // `finally`, not `then`: an unreadable store must still open the game.
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [game]);

  const saveRound = useCallback(
    async (score: number, line: string): Promise<RoundResult> => {
      const result = await persistRound(game, score, line);
      setRecord(result.record);
      setPreviousBest(result.previousBest);
      if (result.isNewBest) onNewBestRef.current?.(result);
      return result;
    },
    [game],
  );

  const best = useMemo(() => (ready ? record.best : null), [ready, record.best]);

  return { record, ready, best, saveRound, previousBest };
}
