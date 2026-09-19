/**
 * The AdMob adapter — the one file in the fleet that knows a network's name.
 *
 * AdMob is the **mediation host**: networks that have joined our mediation
 * (InMobi, AppLovin MAX, later Meta) do not get their own SDK calls here, because
 * they bid *inside* AdMob's auction. Running a second mediation host on the same
 * impression is how fill collapses. Their adapters exist so the Networks screen
 * and the analytics can name them, and so enabling one is a config change rather
 * than a code change.
 *
 * ## Why every import of the SDK is lazy
 *
 * `react-native-google-mobile-ads` is a native module. A build that has not linked
 * it — Expo Go, the web export, a screenshot run, or any build before the AdMob
 * account exists — throws at import time. So this file does not import it at the
 * top: it resolves the module inside `init()`, and a build without it degrades to
 * "ads unavailable" instead of a red screen. That is also what keeps
 * `EXPO_PUBLIC_ADS_ENABLED` genuinely safe to leave off.
 *
 * ## The auction, in one sentence
 *
 * This file asks the host for an ad; the host runs the auction among the ad sources
 * configured in the AdMob console (including InMobi and AppLovin as bidders); the
 * highest bid for THIS impression wins; the winning price comes back through
 * impression-level revenue and becomes a row in `ad_events`. Nothing here picks a
 * winner, which is exactly right — see the design doc §3.
 *
 * ## P0 scope, stated honestly
 *
 * `show()` is load-and-wait: it creates a request, waits for the auction to answer,
 * displays, and resolves once the ad closes. `isReady()` therefore returns false —
 * there is no preloaded instance held between calls yet, so the facade keeps
 * showing the placeholder until P1 adds a preload-and-hold cache. A rewarded tap
 * that waits for a load is a bad experience, and P0 is not the phase that claims
 * otherwise.
 */
import { unitFor } from "./config";
import { setConsentState } from "./consent";
import { recordAdEvent } from "./events";
import type {
  AdFormat,
  AdNetworkAdapter,
  AdOutcome,
  ImpressionRevenue,
  NetworkId,
  PlacementId,
} from "./types";

/** The subset of the SDK this adapter uses. Kept local so the import stays lazy. */
type NativeAd = {
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (event: string, cb: (payload?: unknown) => void) => () => void;
  paidEventHandler?: (cb: (payload: unknown) => void) => () => void;
};

type AdsModule = {
  default: () => { initialize: () => Promise<unknown[]> };
  RewardedAd: { createForAdRequest: (unit: string) => NativeAd };
  InterstitialAd: { createForAdRequest: (unit: string) => NativeAd };
  AppOpenAd: { createForAdRequest: (unit: string) => NativeAd };
  AdEventType: Record<string, string>;
  RewardedAdEventType: Record<string, string>;
  AdsConsent: {
    requestInfoUpdate: (opts?: unknown) => Promise<{ canRequestAds: boolean }>;
  };
};

/** How long to wait for the auction before giving up on a placement. */
const LOAD_TIMEOUT_MS = 15_000;

const revenueSubscribers = new Set<(e: ImpressionRevenue) => void>();
let sdk: AdsModule | null = null;
let initialised = false;
let initFailed = false;

/**
 * Resolve the native module once. Returns null when it is not in this build.
 *
 * `require` rather than `import` on purpose: Metro inlines a static `import` into
 * the bundle graph at build time, so the module would be loaded even in builds that
 * must not have it. A runtime `require` in a try/catch lets one codebase serve both.
 */
function resolveSdk(): AdsModule | null {
  if (sdk || initFailed) return sdk;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sdk = require("react-native-google-mobile-ads") as AdsModule;
  } catch {
    initFailed = true;
    recordAdEvent({
      placement: "sdk.init",
      format: "rewarded",
      event: "error",
      network: "admob",
      error_code: "sdk_missing",
      error_message: "react-native-google-mobile-ads is not in this build",
    });
  }
  return sdk;
}

/** Which class holds which unit type. Banner/native are view-based and not here yet. */
function adClassFor(mod: AdsModule, format: AdFormat): { createForAdRequest: (unit: string) => NativeAd } | null {
  switch (format) {
    case "rewarded":
      return mod.RewardedAd;
    case "interstitial":
      return mod.InterstitialAd;
    case "appOpen":
      return mod.AppOpenAd;
    default:
      return null;
  }
}

/** The SDK reports revenue in currency units; the column stores micros. */
function toRevenue(
  placement: PlacementId,
  format: AdFormat,
  payload: unknown,
  adUnitId: string,
): ImpressionRevenue {
  const p = (payload ?? {}) as { value?: number; currency?: string; precision?: string };
  const raw = typeof p.value === "number" ? p.value : null;
  return {
    network: "admob",
    placement,
    format,
    // A missing value stays null: "not measured" is not "earned nothing".
    valueMicros: raw === null ? null : Math.round(raw * 1_000_000),
    currency: p.currency ?? "USD",
    precision: p.precision,
    adUnitId,
  };
}

function publishRevenue(e: ImpressionRevenue): void {
  for (const sub of revenueSubscribers) {
    try {
      sub(e);
    } catch {
      // A subscriber must never break the ad path.
    }
  }
}

export const admobAdapter: AdNetworkAdapter = {
  id: "admob",

  supports(format: AdFormat): boolean {
    return ["rewarded", "interstitial", "banner", "native", "appOpen"].includes(format);
  },

  /** Load the SDK and resolve the consent state. Idempotent; true once usable. */
  async init(): Promise<boolean> {
    if (initialised) return !initFailed;
    initialised = true;

    const mod = resolveSdk();
    if (!mod) return false;

    try {
      await mod.default().initialize();
    } catch (e) {
      initFailed = true;
      recordAdEvent({
        placement: "sdk.init",
        format: "rewarded",
        event: "error",
        network: "admob",
        error_code: "init_failed",
        error_message: String(e).slice(0, 300),
      });
      return false;
    }

    // Consent: ask UMP for the state it holds. A build with no CMP wired returns
    // `canRequestAds: false`, which the facade turns into the placeholder rather
    // than an unlawful request. The full UMP + ATT dialog flow lands in P3, when
    // there is an account whose policy requires it.
    try {
      const info = await mod.AdsConsent.requestInfoUpdate();
      setConsentState(info.canRequestAds ? "non-personalized" : "denied");
    } catch {
      // No CMP in this build: leave consent `unknown`, which blocks live units and
      // allows demo units. That is the honest state.
    }

    return true;
  },

  /**
   * No preloaded instance is held in P0, so there is nothing to prepare and
   * nothing that can be ready. The facade reads `isReady` before offering a
   * rewarded view, so this keeps the placeholder in place rather than promising an
   * instant ad that is really a load-and-wait.
   */
  async preload(format: AdFormat, placement: PlacementId): Promise<void> {
    void format;
    void placement;
  },

  isReady(format: AdFormat, placement: PlacementId): boolean {
    void format;
    void placement;
    return false;
  },

  async show(format: AdFormat, placement: PlacementId): Promise<AdOutcome> {
    const mod = resolveSdk();
    const base = { network: "admob" as const, placement, format };
    if (!mod) {
      return { ...base, kind: "failed", code: "sdk_missing", message: "Ad SDK is not in this build" };
    }
    const cls = adClassFor(mod, format);
    const unit = unitFor(format);
    if (!cls) {
      return { ...base, kind: "failed", code: "format_unsupported", message: `${format} is not wired yet` };
    }

    const startedAt = Date.now();
    const ad = cls.createForAdRequest(unit);
    const unsubs: Array<() => void> = [];

    const outcome = await new Promise<AdOutcome>((resolve) => {
      let settled = false;
      let rewarded = false;

      const finish = (o: AdOutcome) => {
        if (settled) return;
        settled = true;
        resolve(o);
      };

      const cleanup = () => {
        for (const u of unsubs) {
          try {
            u();
          } catch {
            // Unsubscribing must never affect the outcome the user already got.
          }
        }
      };

      // The auction answers, or it does not. A load that never completes must not
      // leave a screen waiting forever, so the timeout resolves a failure and the
      // caller falls back to its own UI.
      const timer = setTimeout(() => {
        finish({ ...base, kind: "failed", code: "load_timeout", message: "The ad did not load in time" });
      }, LOAD_TIMEOUT_MS);

      const settle = (o: AdOutcome) => {
        clearTimeout(timer);
        finish(o);
        cleanup();
      };

      unsubs.push(
        ad.addAdEventListener(mod.AdEventType.LOADED, () => {
          recordAdEvent({
            placement,
            format,
            event: "fill",
            network: "admob",
            ad_unit_id: unit,
            latency_ms: Date.now() - startedAt,
          });
          ad.show().catch((e: unknown) => {
            settle({ ...base, kind: "failed", code: "show_failed", message: String(e).slice(0, 300) });
          });
        }),
      );

      unsubs.push(
        ad.addAdEventListener(mod.AdEventType.ERROR, (payload?: unknown) => {
          const p = (payload ?? {}) as { code?: string; message?: string };
          settle({
            ...base,
            kind: "failed",
            code: p.code ?? "load_error",
            message: p.message ?? "Ad failed to load",
          });
        }),
      );

      // CLOSED fires whether the user earned the reward or dismissed early, so the
      // flag — not the event — decides the outcome. That is what makes "reward only
      // on a completed view" true rather than hopeful.
      unsubs.push(
        ad.addAdEventListener(mod.AdEventType.CLOSED, () => {
          settle(
            rewarded
              ? { ...base, kind: "rewarded", revenueMicros: 0, revenueReported: false, currency: "USD" }
              : { ...base, kind: "dismissed" },
          );
        }),
      );

      if (format === "rewarded") {
        unsubs.push(
          ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => {
            rewarded = true;
          }),
        );
      }

      // Impression-level revenue: the actual winning price, for this impression.
      if (typeof ad.paidEventHandler === "function") {
        unsubs.push(
          ad.paidEventHandler((payload: unknown) => {
            publishRevenue(toRevenue(placement, format, payload, unit));
          }),
        );
      }

      ad.load();
    });

    return outcome;
  },

  onImpressionRevenue(cb: (e: ImpressionRevenue) => void): () => void {
    revenueSubscribers.add(cb);
    return () => {
      revenueSubscribers.delete(cb);
    };
  },
};

/** Re-exported so the Networks screen can name the host without importing the SDK. */
export const HOST: NetworkId = "admob";
