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
 * ## Why the SDK is loaded lazily, and typed statically
 *
 * `react-native-google-mobile-ads` is a native module. A build that has not linked
 * it — the web export, a screenshot run, or any build before the AdMob account
 * exists — throws when the native module registry is touched. So this file does not
 * import it as a value: it `require`s it inside `init()`, inside a try/catch, and a
 * build without it degrades to "ads unavailable" instead of a red screen.
 *
 * **But a `require` is still a bundle dependency.** Metro collects it at build time
 * whatever the runtime branch, so this file cannot be what a web bundle resolves —
 * it would pull the native SDK into the web graph and break `expo export`. Web gets
 * `admob.web.ts` through Metro's platform extension instead; read its header for the
 * failure that made that necessary. Native behaviour is unchanged.
 *
 * The *types*, though, come from the package with `import type`, which TypeScript
 * erases completely. That is what keeps this adapter honest: the shapes below are
 * the real `RewardedAd`/`InterstitialAd`/`AppOpenAd`/`AdsConsent` types, not a
 * hand-written approximation, so a breaking change in the SDK fails `tsc` here
 * rather than at runtime on a user's phone.
 *
 * ## The auction, in one sentence
 *
 * This file asks the host for an ad; the host runs the auction among the ad sources
 * configured in the AdMob console (including InMobi and AppLovin as bidders); the
 * highest bid for THIS impression wins; the winning price arrives on
 * `AdEventType.PAID` and becomes a row in `ad_events`. Nothing here picks a winner,
 * which is exactly right — see the design doc §3.
 *
 * ## Preload and hold
 *
 * One loaded instance per full-screen format is held between calls, so a tap on a
 * rewarded button displays at once instead of waiting on the auction. The cache is
 * keyed by **format**, not placement, because the ad unit is per format: two
 * placements asking for a rewarded ad are asking the same unit. After every display
 * the next instance is requested, and a held instance older than
 * `HELD_MAX_AGE_MS` is thrown away — Google expires a loaded ad after an hour, and
 * showing a stale one is a guaranteed failure that looks like a fill problem.
 *
 * The one request that cannot come from the cache is a rewarded ad carrying an SSV
 * handshake: the nonce must ride on the ad *request*, and this SDK version has no
 * way to attach it after load. That path stays load-and-wait on purpose.
 *
 * ## Consent before the first request
 *
 * `init()` runs Google's UMP flow (`gatherConsent`: fetch the status, and show the
 * form where the law requires one) **before** initialising the SDK, which is the
 * order Google documents. On iOS, the ATT prompt is shown by UMP itself once the
 * IDFA explainer message is switched on in the AdMob console — so no second tracking
 * module is linked, and the prompt is always preceded by an explanation.
 */
import type {
  AdsConsentInfo,
  AppOpenAd,
  InterstitialAd,
  RewardedAd as RewardedAdType,
} from "react-native-google-mobile-ads";
import { HAS_LIVE_UNITS, unitFor } from "../config";
import { setConsentState, setPrivacyOptions } from "../consent";
import { recordAdEvent } from "../events";
import type {
  AdFormat,
  AdNetworkAdapter,
  AdOutcome,
  ConsentState,
  ImpressionRevenue,
  NetworkId,
  PlacementId,
} from "../types";

/**
 * The exact module surface this adapter uses, derived from the SDK's own classes.
 *
 * Every member is a `typeof import(...)` query or a type reference, so nothing here
 * makes the package load at build time — only `resolveSdk()` does that, at runtime,
 * and only in a build that has the package.
 */
type AdsModule = {
  default: () => { initialize: () => Promise<unknown[]> };
  RewardedAd: typeof RewardedAdType;
  InterstitialAd: typeof InterstitialAd;
  AppOpenAd: typeof AppOpenAd;
  AdEventType: typeof import("react-native-google-mobile-ads").AdEventType;
  RewardedAdEventType: typeof import("react-native-google-mobile-ads").RewardedAdEventType;
  AdsConsent: typeof import("react-native-google-mobile-ads").AdsConsent;
};

/** The full-screen ad classes share a base; this is the part this adapter uses. */
type FullScreenAd = RewardedAdType | InterstitialAd | AppOpenAd;

/**
 * The union of the three ad classes cannot be called as one value: each declares
 * `addAdEventListener` with its own generic constraint (`RewardedAd` accepts the
 * rewarded event names, the other two do not), and TypeScript refuses to call a
 * union of generic signatures.
 *
 * They are in fact callable identically — the difference is only which event names
 * the type allows — so this narrow view says exactly what this adapter relies on.
 * The alternative would be three near-identical `show` implementations, which is
 * how a codebase ends up with three subtly different reward paths.
 */
type ListenableAd = {
  load: () => void;
  show: () => Promise<void>;
  /** Both event enums are string-valued; the caller passes one of their members. */
  addAdEventListener: (type: string, listener: (payload?: unknown) => void) => () => void;
  loaded: boolean;
};

function asListenable(ad: FullScreenAd): ListenableAd {
  return ad as unknown as ListenableAd;
}

/** How long to wait for the auction before giving up on a placement. */
const LOAD_TIMEOUT_MS = 15_000;

/**
 * How long a loaded instance may be held. Google expires rewarded and interstitial
 * ads an hour after load; five minutes of margin keeps us off the edge.
 */
const HELD_MAX_AGE_MS = 55 * 60 * 1000;

const revenueSubscribers = new Set<(e: ImpressionRevenue) => void>();
const readySubscribers = new Set<() => void>();

/**
 * The SSV handshake for the next rewarded request, set by the caller immediately
 * before `show()`.
 *
 * It has to be attached to the ad request itself: AdMob echoes these two values back
 * to our server in the signed callback, which is what ties one signature to one job.
 * Module state rather than a `show()` argument because the adapter interface is
 * deliberately format-agnostic — only the rewarded path has a receipt.
 */
let ssvOptions: { userId: string; customData?: string } | null = null;

/** Attach the SSV handshake for the next rewarded request. Pass null to clear it. */
export function setSsvOptions(options: { userId: string; customData?: string } | null): void {
  ssvOptions = options;
}
let sdk: AdsModule | null = null;
let initialised = false;
let initFailed = false;
/** True once `initialize()` has resolved; no request is made before it. */
let sdkReady = false;

/** A loaded instance waiting for its `show()`. */
type Held = { ad: ListenableAd; unit: string; loadedAt: number };

const held: Partial<Record<AdFormat, Held>> = {};
const loading = new Set<AdFormat>();

function notifyReady(): void {
  for (const sub of readySubscribers) {
    try {
      sub();
    } catch {
      // A subscriber must never break the ad path.
    }
  }
}

/**
 * Resolve the native module once. Returns null when it is not in this build.
 *
 * `require` rather than `import` on purpose: a static value import is inlined into
 * the bundle graph, so the module would be evaluated — and its native registry
 * touched — even in builds that must not have it. A runtime `require` in a
 * try/catch lets one codebase serve both a build with the SDK and one without.
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

/**
 * The "loaded" event for a format's class.
 *
 * Not interchangeable: `RewardedAd.addAdEventListener` throws on `AdEventType.LOADED`
 * and demands `RewardedAdEventType.LOADED`. The throw happens inside the load
 * promise, so it surfaces as an uncaught rejection — the preload never holds an ad
 * and a tap waits on a load that was never listened for.
 */
function loadedEventFor(mod: AdsModule, format: AdFormat): string {
  return format === "rewarded" ? mod.RewardedAdEventType.LOADED : mod.AdEventType.LOADED;
}

/** Which class holds which unit type. Banner and native are view-based, so they are not here. */
function adClassFor(
  mod: AdsModule,
  format: AdFormat,
): { createForAdRequest: (unit: string, options?: Record<string, unknown>) => FullScreenAd } | null {
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

/**
 * Turn what UMP knows into the one word every event carries.
 *
 * - `canRequestAds` false → `denied`: no request may be made at all.
 * - `NOT_REQUIRED` → `personalized`: the user is outside a consent regime (most of
 *   India), so personalised serving is the default. On iOS the SDK still drops the
 *   IDFA when ATT was not granted; that is its decision, not a consent state.
 * - `OBTAINED` → what the user actually chose for "personalised ads". Recording
 *   every consented user as non-personalised — as P0 did — under-reported the
 *   state and mislabelled every row.
 * - anything else → `unknown`, which blocks live units.
 */
async function consentFrom(mod: AdsModule, info: AdsConsentInfo): Promise<ConsentState> {
  if (!info.canRequestAds) return "denied";
  if (info.status === "NOT_REQUIRED") return "personalized";
  if (info.status === "OBTAINED") {
    try {
      const choices = await mod.AdsConsent.getUserChoices();
      return choices.selectPersonalisedAds ? "personalized" : "non-personalized";
    } catch {
      // Consent was given but the choices could not be read: the safe reading is
      // the narrower one.
      return "non-personalized";
    }
  }
  return "unknown";
}

/** Apply a UMP answer to the shared consent state and the privacy-options entry. */
async function applyConsent(mod: AdsModule, info: AdsConsentInfo): Promise<void> {
  setConsentState(await consentFrom(mod, info));
  setPrivacyOptions(info.privacyOptionsRequirementStatus === "REQUIRED", async () => {
    const next = await mod.AdsConsent.showPrivacyOptionsForm();
    await applyConsent(mod, next);
    // A changed choice changes what may be requested; drop what was loaded under
    // the old one so the next show is requested under the new state.
    for (const f of Object.keys(held) as AdFormat[]) delete held[f];
    notifyReady();
  });
}

/**
 * The SDK reports revenue in currency units; the column stores micros.
 *
 * A missing value stays null: "not measured" is not the same as "earned nothing",
 * and averaging the two together is the one way this data could mislead.
 */
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

/** The held instance for a format, if it is loaded and still inside its lifetime. */
function freshHeld(format: AdFormat): Held | null {
  const h = held[format];
  if (!h) return null;
  if (!h.ad.loaded || Date.now() - h.loadedAt > HELD_MAX_AGE_MS) {
    delete held[format];
    return null;
  }
  return h;
}

/**
 * Display an ad and resolve with what the user did.
 *
 * Shared by the held path and the load-and-wait path so there is exactly one place
 * that decides "rewarded" versus "dismissed". `loadFirst` is true when the instance
 * has not loaded yet: the load, fill row and timeout then belong to this call.
 */
function present(
  mod: AdsModule,
  ad: ListenableAd,
  unit: string,
  format: AdFormat,
  placement: PlacementId,
  loadFirst: boolean,
): Promise<AdOutcome> {
  const base = { network: "admob" as const, placement, format };
  const unsubs: (() => void)[] = [];
  const startedAt = Date.now();

  return new Promise<AdOutcome>((resolve) => {
    let settled = false;
    let rewarded = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function settle(o: AdOutcome) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      for (const u of unsubs) {
        try {
          u();
        } catch {
          // Unsubscribing must never affect the outcome the user already got.
        }
      }
      resolve(o);
    }

    function display() {
      ad.show().catch((e: unknown) => {
        settle({ ...base, kind: "failed", code: "show_failed", message: String(e).slice(0, 300) });
      });
    }

    if (loadFirst) {
      // The auction answers, or it does not. A load that never completes must not
      // leave a screen waiting forever, so the timeout resolves a failure and the
      // caller falls back to its own UI.
      timer = setTimeout(() => {
        settle({ ...base, kind: "failed", code: "load_timeout", message: "The ad did not load in time" });
      }, LOAD_TIMEOUT_MS);

      unsubs.push(
        ad.addAdEventListener(loadedEventFor(mod, format), () => {
          if (timer) clearTimeout(timer);
          timer = null;
          recordAdEvent({
            placement,
            format,
            event: "fill",
            network: "admob",
            ad_unit_id: unit,
            latency_ms: Date.now() - startedAt,
          });
          display();
        }),
      );
    }

    unsubs.push(
      ad.addAdEventListener(mod.AdEventType.ERROR, (payload?: unknown) => {
        const err = (payload ?? {}) as { code?: string | number; message?: string };
        settle({
          ...base,
          kind: "failed",
          code: String(err.code ?? "load_error"),
          message: err.message ?? "Ad failed to load",
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
    // This is the number the whole measurement loop runs on.
    unsubs.push(
      ad.addAdEventListener(mod.AdEventType.PAID, (payload?: unknown) => {
        publishRevenue(toRevenue(placement, format, payload, unit));
      }),
    );

    if (loadFirst) ad.load();
    else display();
  });
}

export const admobAdapter: AdNetworkAdapter = {
  id: "admob",

  supports(format: AdFormat): boolean {
    return ["rewarded", "interstitial", "banner", "native", "appOpen"].includes(format);
  },

  /**
   * Gather consent, then load the SDK. Idempotent; true once usable.
   *
   * Consent comes first because Google's order is "consent, then initialise, then
   * request". A build whose UMP call fails — no account, so no message configured —
   * leaves consent `unknown`: live units are blocked and demo units still work,
   * which is the honest state of a build with no account.
   */
  async init(): Promise<boolean> {
    if (initialised) return !initFailed;
    initialised = true;

    const mod = resolveSdk();
    if (!mod) return false;

    try {
      await applyConsent(mod, await mod.AdsConsent.gatherConsent());
    } catch (e) {
      recordAdEvent({
        placement: "sdk.consent",
        format: "rewarded",
        event: "error",
        network: "admob",
        error_code: "consent_unavailable",
        error_message: String(e).slice(0, 300),
      });
    }

    // With live units, initialising before consent allows a request would be the
    // exact silent violation the consent gate exists to stop.
    const info = await mod.AdsConsent.getConsentInfo().catch(() => null);
    if (HAS_LIVE_UNITS && !info?.canRequestAds) return false;

    try {
      await mod.default().initialize();
      sdkReady = true;
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

    notifyReady();
    return true;
  },

  /**
   * Request an instance and hold it until `show()`.
   *
   * A no-op when one is already held or in flight, so screens may call it on every
   * mount. A failed load records an error and leaves nothing held; the next call
   * tries again, which is all the retry a user-paced surface needs.
   */
  async preload(format: AdFormat, placement: PlacementId): Promise<void> {
    if (!sdkReady || loading.has(format) || freshHeld(format)) return;
    const mod = resolveSdk();
    const cls = mod ? adClassFor(mod, format) : null;
    if (!mod || !cls) return;

    const unit = unitFor(format);
    const ad = asListenable(cls.createForAdRequest(unit));
    const startedAt = Date.now();
    loading.add(format);

    await new Promise<void>((resolve) => {
      const unsubs: (() => void)[] = [];
      const done = () => {
        clearTimeout(timer);
        for (const u of unsubs) u();
        loading.delete(format);
        resolve();
      };
      const timer = setTimeout(() => {
        recordAdEvent({
          placement,
          format,
          event: "error",
          network: "admob",
          ad_unit_id: unit,
          error_code: "load_timeout",
          error_message: "Preload did not complete in time",
        });
        done();
      }, LOAD_TIMEOUT_MS);

      unsubs.push(
        ad.addAdEventListener(loadedEventFor(mod, format), () => {
          held[format] = { ad, unit, loadedAt: Date.now() };
          recordAdEvent({
            placement,
            format,
            event: "fill",
            network: "admob",
            ad_unit_id: unit,
            latency_ms: Date.now() - startedAt,
          });
          done();
          notifyReady();
        }),
      );
      unsubs.push(
        ad.addAdEventListener(mod.AdEventType.ERROR, (payload?: unknown) => {
          const err = (payload ?? {}) as { code?: string | number; message?: string };
          recordAdEvent({
            placement,
            format,
            event: "error",
            network: "admob",
            ad_unit_id: unit,
            error_code: String(err.code ?? "load_error"),
            error_message: err.message ?? "Ad failed to load",
          });
          done();
        }),
      );

      ad.load();
    });
  },

  isReady(format: AdFormat, placement: PlacementId): boolean {
    void placement;
    // An SSV-bound rewarded request never comes from the cache, so a held instance
    // does not make that show instant.
    if (format === "rewarded" && ssvOptions) return false;
    return freshHeld(format) !== null;
  },

  async show(format: AdFormat, placement: PlacementId): Promise<AdOutcome> {
    const mod = resolveSdk();
    const base = { network: "admob" as const, placement, format };
    if (!mod) {
      return { ...base, kind: "failed", code: "sdk_missing", message: "Ad SDK is not in this build" };
    }
    if (!sdkReady) {
      return { ...base, kind: "failed", code: "sdk_not_ready", message: "The ad SDK has not started" };
    }
    const cls = adClassFor(mod, format);
    if (!cls) {
      return { ...base, kind: "failed", code: "format_unsupported", message: `${format} is not wired yet` };
    }

    let outcome: AdOutcome;
    const withSsv = format === "rewarded" && ssvOptions !== null;
    const h = withSsv ? null : freshHeld(format);

    if (h) {
      // Taken out of the cache before display: a held ad can be shown once.
      delete held[format];
      notifyReady();
      outcome = await present(mod, h.ad, h.unit, format, placement, false);
    } else {
      // The SSV handshake rides on the request, so AdMob can echo it back in the
      // signed callback. Attached only to rewarded ads — the other formats have no
      // reward to verify.
      const unit = unitFor(format);
      const requestOptions = withSsv
        ? { serverSideVerificationOptions: { userId: ssvOptions!.userId, customData: ssvOptions!.customData } }
        : undefined;
      const ad = asListenable(cls.createForAdRequest(unit, requestOptions));
      outcome = await present(mod, ad, unit, format, placement, true);
    }

    // The next tap should be instant too.
    void admobAdapter.preload(format, placement);
    return outcome;
  },

  onImpressionRevenue(cb: (e: ImpressionRevenue) => void): () => void {
    revenueSubscribers.add(cb);
    return () => {
      revenueSubscribers.delete(cb);
    };
  },

  onReadyChange(cb: () => void): () => void {
    readySubscribers.add(cb);
    return () => {
      readySubscribers.delete(cb);
    };
  },
};

/** Re-exported so the Networks screen can name the host without importing the SDK. */
export const HOST: NetworkId = "admob";
