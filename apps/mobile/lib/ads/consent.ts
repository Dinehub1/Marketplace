/**
 * Consent state, recorded rather than assumed.
 *
 * Three separate facts are collapsed into the one word every event carries:
 *
 *   - **UMP** (Google's consent SDK) decides whether personalised ads are allowed
 *     from the app's own dialog. `canRequestAds()` false means we must not ask for
 *     an ad at all.
 *   - **ATT** on iOS decides whether the ad id may be used. A denied ATT is not an
 *     error — the SDK simply serves non-personalised — but it changes what the
 *     impression is worth, which is exactly why it is recorded per event.
 *   - **The ad-serving mode** Google picks from the two, which is the state that
 *     actually shipped: `personalized`, `non-personalized` or `denied`.
 *
 * No SDK is imported here. The UMP/ATT calls that *set* these values belong to the
 * AdMob adapter (P3, once the account exists); this module is the single place the
 * rest of the app reads them from, so no screen has to know what a TCF string is.
 *
 * Honest default is `unknown`: before a consent dialog has resolved, the app has no
 * consent, and treating "we have not asked" as "non-personalized" would be a lie
 * that hides a real compliance gap. The facade refuses to request an ad unless the
 * state is `personalized` or `non-personalized`.
 */
import type { ConsentState } from "./types";

let state: ConsentState = "unknown";

/** What the last ad request was made under. Read by the event buffer. */
export function consentState(): ConsentState {
  return state;
}

/** Set by the adapter once UMP and ATT have resolved. */
export function setConsentState(next: ConsentState): void {
  state = next;
}

/**
 * May we ask for an ad right now?
 *
 * `unknown` is a no for a **live** ad unit. That is a deliberate gate: a real ad
 * request made before the consent dialog resolves is the exact failure the
 * compliance research flags, and it is silent — nothing throws, the request is
 * simply unlawful. A build whose consent stack is not wired yet therefore shows
 * the placeholder, which is the correct visible behaviour rather than a
 * plausible-looking violation.
 *
 * `isTest` is the one exception, and it is narrow on purpose: Google's demo units
 * are not real ads, carry no personalization and pay nothing, so exercising the
 * facade on them before the account and CMP exist cannot violate anything. Every
 * other request goes through the state gate.
 */
export function canRequestAds(isTest: boolean): boolean {
  if (isTest) return true;
  return state === "personalized" || state === "non-personalized";
}
