/**
 * Ad configuration: what is on, what the units are, and what the caps are.
 *
 * Two things are true at once here, and keeping them apart is the design:
 *
 *   1. **Build-time.** Whether the SDK is compiled in and which ad unit ids it
 *      uses. Demo units by default — Google's own test ids are not associated
 *      with any account, so a dev build cannot generate invalid traffic on a real
 *      one. A live unit id only ever arrives through the build environment.
 *   2. **Run-time.** Floors, enabled networks and caps come from remote config
 *      (`ad_config`), because changing them must not need a store release. This
 *      file holds the *compiled defaults* that a first install runs before it has
 *      ever reached the server.
 *
 * The switch that "gives the impression to whoever pays more" lives in (2): the
 * auction picks the winner per impression, and remote config changes the
 * conditions it picks under. See docs/ad-monetisation/ad-sdk-and-placement-design.md §7.
 */
import Constants from "expo-constants";
import type { AdFormat, NetworkId, PlacementId } from "./types";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

/**
 * Ads are OFF unless a build explicitly turns them on.
 *
 * The default is off for a concrete reason: `react-native-google-mobile-ads` is a
 * native module, so a build without it linked (Expo Go, the web export, any
 * screenshot run) throws at import. Off-by-default means every existing surface —
 * including `npm run shots` — keeps working untouched, and the placeholder in
 * `components/ad-slot.tsx` is what a disabled build shows. That is not a stub for
 * missing code; it is the honest state of a build with no ad network in it.
 */
export const ADS_ENABLED =
  String(process.env.EXPO_PUBLIC_ADS_ENABLED ?? "0") === "1" ||
  extra.adsEnabled === true;

/**
 * Google's documented demo unit ids. They always fill, they cost nothing, and
 * Google states they cannot generate invalid traffic — which is why they are the
 * only ids this file will use when no live id is configured.
 *
 * Live ids are per-app and per-format, so they cannot be committed: they arrive as
 * `EXPO_PUBLIC_ADMOB_*` build variables, one per format, and fall back to the demo
 * id of the same format.
 */
const DEMO_UNITS: Record<AdFormat, string> = {
  // https://developers.google.com/admob/android/test-ads
  rewarded: "ca-app-pub-3940256099942544/5224354917",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  banner: "ca-app-pub-3940256099942544/6300978111",
  native: "ca-app-pub-3940256099942544/2247696110",
  appOpen: "ca-app-pub-3940256099942544/9257395921",
};

const LIVE_UNITS: Record<AdFormat, string | undefined> = {
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT,
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT,
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT,
  native: process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT,
  appOpen: process.env.EXPO_PUBLIC_ADMOB_APPOPEN_UNIT,
};

/** True when at least one live unit id was supplied, i.e. this is a real build. */
export const HAS_LIVE_UNITS = Object.values(LIVE_UNITS).some((v) => Boolean(v));

/** The ad unit id an adapter should load for a format. */
export function unitFor(format: AdFormat): string {
  return LIVE_UNITS[format] ?? DEMO_UNITS[format];
}

/** True when the unit for this format is the demo unit. Recorded on every event. */
export function isTestUnit(format: AdFormat): boolean {
  return !LIVE_UNITS[format];
}

/**
 * The Android/iOS AdMob application id. Google's demo app id is used unless a real
 * one is configured, so a debug build never claims to be a production app.
 */
export const ADMOB_APP_ID =
  process.env.EXPO_PUBLIC_ADMOB_APP_ID ?? "ca-app-pub-3940256099942544~3347511713";

/** Which networks participate, before remote config says otherwise. */
export const DEFAULT_SOURCES: Record<NetworkId, boolean> = {
  admob: true,
  // Bidders join the AdMob auction once the accounts exist; until then enabling
  // them would only produce load errors, so the compiled default is off and remote
  // config turns them on per app.
  inmobi: false,
  applovin: false,
};

/** Formats each network can serve through the AdMob mediation host. */
export const SOURCE_FORMATS: Record<NetworkId, AdFormat[]> = {
  admob: ["rewarded", "interstitial", "banner", "native", "appOpen"],
  inmobi: ["rewarded", "interstitial", "banner", "native"],
  applovin: ["rewarded", "interstitial", "banner", "native"],
};

/**
 * Placements that must never receive an ad, whatever config says.
 *
 * Compiled in rather than configurable — the policy research is unambiguous that
 * an ad on a dead-end screen, app launch or app exit is a suspension risk, and a
 * remote config that could re-enable one is a foot-gun, not a feature.
 */
export const FORBIDDEN_PLACEMENTS: readonly string[] = [
  "app.launch",
  "app.exit",
  "job.done",
  "job.exported",
  "job.error",
  "game.over",
];

export function isForbidden(placement: PlacementId): boolean {
  return FORBIDDEN_PLACEMENTS.includes(placement);
}

/** Frequency rules. Interstitial gaps mirror Google's own stated placement rules. */
export const CAPS = {
  /** Google: no more than one interstitial per two user actions. */
  interstitialMinGapSeconds: 30,
  maxInterstitialsPerSession: 3,
  /** Rewarded is user-initiated, so it is deliberately uncapped. */
  rewardedMinGapSeconds: 0,
  /** A banner is passive; the only cap that matters is "not on every screen". */
  maxBannerLoadsPerSession: 20,
} as const;

/**
 * Where ad events are sent. Empty string means "do not send" — the buffer then
 * keeps nothing, so a build with no server configured does not accumulate
 * unbounded telemetry in memory.
 */
export function eventsEndpoint(): string {
  const base = String(extra.webBaseUrl ?? "https://sarkarmarketplace.dropby.co.in").replace(/\/+$/, "");
  return `${base}/api/ad-events`;
}

/** The target id this binary was built as, for the `app_target` column. */
export function appTarget(): string {
  const target = extra.target as { id?: string } | undefined;
  return target?.id ?? "unknown";
}
