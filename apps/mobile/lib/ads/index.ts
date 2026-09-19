/**
 * The facade — the only ad API the 15 apps are allowed to call.
 *
 * ## The boundary this file draws
 *
 * The auction layer (AdMob mediation, with InMobi and AppLovin MAX bidding inside
 * it) decides **which network wins one impression and at what price**. That is not
 * our code and must not be. This file decides everything *around* that:
 *
 *   - whether an ad may be requested at all (compiled policy + consent + caps);
 *   - which placement is asking, so the measurement is per-moment not per-screen;
 *   - that a reward is granted only on a verified completion;
 *   - that the winning price is recorded before anyone forgets it.
 *
 * ## Why a guard returns a reason
 *
 * "No ad appeared" is the bug report nobody can action. Every refusal here names
 * itself — `forbidden_placement`, `no_consent`, `cap_blocked`, `sdk_unavailable` —
 * and each one is logged to `ad_events`. A drop in fill is then a query, not a
 * mystery.
 *
 * ## What P0 deliberately does not do
 *
 * `isReady` is false until P1 holds a preloaded instance, so `showRewarded` refuses
 * with `sdk_unavailable` and every screen keeps its placeholder. That is the
 * correct behaviour for a build with no account: the integration is complete and
 * observable, and nothing pretends an ad is coming.
 */
import { admobAdapter } from "./adapters/admob";
import { ADS_ENABLED, isForbidden, isTestUnit } from "./config";
import { canRequestAds, consentState } from "./consent";
import { canShow, recordShown } from "./caps";
import { flush, recordAdEvent } from "./events";
import { startSession } from "./session";
import type {
  AdFormat,
  AdNetworkAdapter,
  AdOutcome,
  NetworkId,
  PlacementId,
} from "./types";

/** The adapters this build knows. AdMob hosts; the bidders are not wired in P0. */
const ADAPTERS: Partial<Record<NetworkId, AdNetworkAdapter>> = {
  admob: admobAdapter,
};

let booted = false;

/**
 * Boot the ad subsystem. Call once, from the root layout.
 *
 * Safe to call when ads are disabled, when the native module is missing, and more
 * than once — the whole point is that no caller has to know which of those is true.
 * Never throws: an ad system that can break app launch is worse than no ad system.
 */
export async function prepareAds(): Promise<void> {
  if (booted) return;
  booted = true;

  // The session id is what joins an impression to "that particular time and
  // audience", so it is created before the first ad can be requested.
  void startSession();

  if (!ADS_ENABLED) return;

  const adapter = ADAPTERS.admob;
  if (!adapter) return;
  try {
    await adapter.init();
  } catch {
    // Recorded inside the adapter; boot must continue regardless.
  }

  // Every winning price the host reports becomes a row. Subscribed once, here,
  // because if a screen owned this subscription an impression that arrived after
  // the screen unmounted would be lost — and that is the exact number the whole
  // slow loop runs on.
  adapter.onImpressionRevenue((e) => {
    recordAdEvent({
      placement: e.placement,
      format: e.format,
      event: "impression",
      network: e.network,
      ad_unit_id: e.adUnitId ?? null,
      // null stays null: not measured is not the same as earned nothing.
      revenue_micros: e.valueMicros,
      currency: e.currency,
    });
    void flush();
  });
}

export type PlacementDecision =
  | { ok: true }
  | { ok: false; reason: "disabled" | "forbidden" | "no_consent" | "cap_blocked" | "sdk_unavailable"; detail?: string };

/**
 * May this format be shown on this placement?
 *
 * The order matters: policy before plumbing. A forbidden placement is refused even
 * on a test build, because the guard exists to make the unsafe thing hard to write,
 * not merely hard to ship.
 */
export function mayShow(format: AdFormat, placement: PlacementId): PlacementDecision {
  if (!ADS_ENABLED) return { ok: false, reason: "disabled" };
  if (isForbidden(placement)) return { ok: false, reason: "forbidden" };

  const test = isTestUnit(format);
  if (!canRequestAds(test)) {
    return { ok: false, reason: "no_consent", detail: consentState() };
  }

  const cap = canShow(format, placement);
  if (!cap.allowed) return { ok: false, reason: "cap_blocked", detail: cap.reason };

  const adapter = ADAPTERS.admob;
  if (!adapter || !adapter.supports(format)) {
    return { ok: false, reason: "sdk_unavailable", detail: `${format} is not wired yet` };
  }

  return { ok: true };
}

/**
 * Ready for an instant show?
 *
 * Separate from `mayShow` because a caller often needs to *lay out* differently:
 * a rewarded button that is ready can promise a reward, and one that is not must
 * say so. P0 answers false until P1 holds a preloaded instance.
 */
export function isRewardedReady(placement: PlacementId): boolean {
  if (!mayShow("rewarded", placement).ok) return false;
  const adapter = ADAPTERS.admob;
  return adapter ? adapter.isReady("rewarded", placement) : false;
}

/**
 * Show a rewarded ad.
 *
 * Resolves with an outcome in every case, including every refusal, so a caller
 * never needs a try/catch to find out that no ad was available. The reward is the
 * caller's to grant, and only from `kind: "rewarded"`.
 */
export async function showRewarded(placement: PlacementId): Promise<AdOutcome> {
  const decide = mayShow("rewarded", placement);
  if (!decide.ok) {
    recordAdEvent({
      placement,
      format: "rewarded",
      event: decide.reason === "cap_blocked" ? "cap_blocked" : "error",
      network: null,
      error_code: decide.reason,
      error_message: decide.detail ?? null,
    });
    return {
      kind: "failed",
      network: "unknown",
      placement,
      format: "rewarded",
      code: decide.reason,
      message: decide.detail ?? "The ad could not be shown",
    };
  }

  const adapter = ADAPTERS.admob!;
  const outcome = await adapter.show("rewarded", placement);
  if (outcome.kind === "rewarded" || outcome.kind === "dismissed") {
    // Counted only after a real display, so a failed load never consumes a cap.
    recordShown("rewarded", placement);
  }
  if (outcome.kind === "rewarded") {
    recordAdEvent({
      placement,
      format: "rewarded",
      event: "reward",
      network: outcome.network,
    });
  }
  if (outcome.kind === "failed") {
    recordAdEvent({
      placement,
      format: "rewarded",
      event: "error",
      network: outcome.network,
      error_code: outcome.code,
      error_message: outcome.message,
    });
  }
  void flush();
  return outcome;
}

/**
 * Prepare the next ad for a placement.
 *
 * Best-effort by contract: a caller preparing an offer must never be delayed or
 * failed by the ad system, so this never throws and never blocks a render.
 */
export function preload(format: AdFormat, placement: PlacementId): void {
  if (!mayShow(format, placement).ok) return;
  const adapter = ADAPTERS.admob;
  if (!adapter) return;
  void adapter.preload(format, placement).catch(() => {});
}

/** The host's name, for the Networks screen copy. */
export const MEDIATION_HOST: NetworkId = "admob";

/** Re-exported so screens import ad concepts from one place, never from a network. */
export type { AdOutcome, AdFormat, PlacementId } from "./types";
