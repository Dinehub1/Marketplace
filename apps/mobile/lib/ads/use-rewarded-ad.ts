/**
 * `useRewardedAd` — a slot's view of the facade, kept current.
 *
 * Two answers, deliberately separate:
 *
 *   - `allowed` — policy, consent and caps say this placement may have an ad. When
 *     false the slot shows its placeholder (games) or refuses (a strict unlock).
 *   - `ready` — a loaded instance is held, so a tap displays at once. When allowed
 *     but not ready, a tap still works; it loads first.
 *
 * Mounting asks for a preload, and the hook re-renders whenever the adapter reports
 * that readiness changed — an instance finished loading, was taken for display, or
 * the SDK finished starting after this screen had already mounted.
 */
import { useEffect, useReducer } from "react";
import { isRewardedReady, mayShow, preload, subscribeAdReady } from "./index";
import type { PlacementId } from "./types";

export function useRewardedAd(placement: PlacementId): { allowed: boolean; ready: boolean } {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    preload("rewarded", placement);
    return subscribeAdReady(() => {
      // The preload is a no-op while one is held or in flight, so asking again on
      // every change is how a slot that mounted before the SDK started gets its ad.
      preload("rewarded", placement);
      bump();
    });
  }, [placement]);

  return {
    allowed: mayShow("rewarded", placement).ok,
    ready: isRewardedReady(placement),
  };
}
