/**
 * The ad vocabulary — the contract every network adapter and every screen shares.
 *
 * This file exists so that a screen, an adapter and the analytics buffer all
 * describe an ad the same way. Nothing here imports a network SDK; that is the
 * whole point. `components/ad-slot.tsx` is the only UI that speaks ad, the facade
 * is the only code that decides, and an adapter is the only code that knows a
 * network's name — so swapping AdMob for something else is one file, not fifteen
 * apps.
 */

/** The five formats the fleet uses. `appOpen` is loaded but not yet placed. */
export type AdFormat = "rewarded" | "interstitial" | "banner" | "native" | "appOpen";

/**
 * A placement is a *moment*, not a screen: `job.unlock-rewarded` is the paywall
 * fence, `game.roundover` is the break after a round. Named this way because the
 * same screen can hold two placements with different rules, and because the
 * measured eCPM we care about is per-placement, not per-screen.
 */
export type PlacementId = string;

/** A network we can route to. AdMob hosts; InMobi and AppLovin bid inside it. */
export type NetworkId = "admob" | "inmobi" | "applovin";

/**
 * What the user's consent actually is, as one of four states.
 *
 * Recorded with every event because "revenue per consent state" is a real number
 * that policy changes move, and because an ad request's legality depends on it.
 * `unknown` is the honest default before the UMP dialog has resolved — it is not
 * the same as `non-personalized`, and must never be treated as consent.
 */
export type ConsentState = "unknown" | "personalized" | "non-personalized" | "denied";

/** A rewarded view that completed. The reward is only ever granted from here. */
export type AdReward = {
  kind: "rewarded";
  network: NetworkId | "unknown";
  placement: PlacementId;
  format: AdFormat;
  /** Impression-level revenue for THIS impression. 0 when unreported. */
  revenueMicros: number;
  /** False when the network did not report a value — a zero is not a measurement. */
  revenueReported: boolean;
  currency: string;
};

/** The user closed the ad before completing it. No reward, ever. */
export type AdDismissed = {
  kind: "dismissed";
  network: NetworkId | "unknown";
  placement: PlacementId;
  format: AdFormat;
};

/** Nothing to show, or the show failed. Callers fall back to their own UI. */
export type AdFailed = {
  kind: "failed";
  network: NetworkId | "unknown";
  placement: PlacementId;
  format: AdFormat;
  code: string;
  message: string;
};

export type AdOutcome = AdReward | AdDismissed | AdFailed;

/**
 * One impression's revenue, from the network SDK's own callback.
 *
 * `valueMicros` is `null` — not 0 — when the network does not report revenue.
 * The distinction is the difference between "this impression earned nothing" and
 * "we did not measure this impression", and the Networks screen must never
 * average the second into the first.
 */
export type ImpressionRevenue = {
  network: NetworkId;
  placement: PlacementId;
  format: AdFormat;
  valueMicros: number | null;
  currency: string;
  /** The network's own precision string, kept for debugging only. */
  precision?: string;
  adUnitId?: string;
};

/**
 * What an ad SDK does for us, in the order a request travels through it.
 *
 * Deliberately minimal. There is no `pick winner` method: the auction host picks
 * the winner, and an interface that pretended otherwise would invite exactly the
 * client-side router the research ruled out.
 */
export interface AdNetworkAdapter {
  readonly id: NetworkId;
  /** False when this network cannot serve the format through the mediation host. */
  supports(format: AdFormat): boolean;
  /** Loads the SDK and, where required, the consent-state snapshot. Idempotent. */
  init(): Promise<boolean>;
  /** Preparing an ad. Safe to call repeatedly; a no-op while one is in flight. */
  preload(format: AdFormat, placement: PlacementId): Promise<void>;
  /** True only when a show would actually display something right now. */
  isReady(format: AdFormat, placement: PlacementId): boolean;
  /** Display. Resolves with the outcome; never rejects — a failure is an outcome. */
  show(format: AdFormat, placement: PlacementId): Promise<AdOutcome>;
  /** Subscribes to impression-level revenue. Returns an unsubscribe function. */
  onImpressionRevenue(cb: (e: ImpressionRevenue) => void): () => void;
}
