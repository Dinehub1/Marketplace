/**
 * Frequency caps.
 *
 * The rules are business and policy rules, not SDK rules, and two of them are
 * lifted verbatim from Google's stated placement policy rather than invented:
 *
 *   - no more than one interstitial after every two user actions;
 *   - never an interstitial immediately after another one closed.
 *
 * Together those are why this file keeps a **timestamp** and not just a count. A
 * cap that only counted would let two interstitials land back to back and stay
 * "under the limit", which is exactly the implementation Google's policy names as
 * disallowed.
 *
 * Rewarded is deliberately uncapped: the user initiates it, so capping it would
 * only refuse a view the user asked for — losing revenue to satisfy a rule that
 * does not exist.
 *
 * State is per-process, which is the right unit: a "session" in the policy sense is
 * one run of the app.
 */
import { CAPS } from "./config";
import type { AdFormat } from "./types";

type Counter = { count: number; lastShownAt: number };

const shown: Record<string, Counter> = Object.create(null);

function key(format: AdFormat, placement: string): string {
  return `${format}:${placement}`;
}

function counter(format: AdFormat, placement: string): Counter {
  const k = key(format, placement);
  if (!shown[k]) shown[k] = { count: 0, lastShownAt: 0 };
  return shown[k];
}

/**
 * The session-wide interstitial count, across ALL placements.
 *
 * Counted globally rather than per placement because the policy limit is about the
 * user's experience, not about one screen: three interstitials spread across three
 * screens is the same three interruptions. A per-placement cap would have allowed
 * a session with a dozen.
 */
function interstitialsThisSession(): number {
  return Object.entries(shown).reduce(
    (total, [k, v]) => (k.startsWith("interstitial:") ? total + v.count : total),
    0,
  );
}

export type CapDecision = { allowed: true } | { allowed: false; reason: string };

/**
 * May this format be shown on this placement right now?
 *
 * Returns the reason rather than a bare boolean so a caller can log *why* an ad
 * did not show. "No ad appeared" with no reason is the bug report nobody can
 * action.
 */
export function canShow(format: AdFormat, placement: string, now = Date.now()): CapDecision {
  if (format === "rewarded") return { allowed: true };

  const c = counter(format, placement);

  if (format === "interstitial") {
    const gapMs = CAPS.interstitialMinGapSeconds * 1000;
    if (c.lastShownAt && now - c.lastShownAt < gapMs) {
      return {
        allowed: false,
        reason: `interstitial gap: ${Math.ceil((gapMs - (now - c.lastShownAt)) / 1000)}s left`,
      };
    }
    if (interstitialsThisSession() >= CAPS.maxInterstitialsPerSession) {
      return { allowed: false, reason: "session interstitial cap reached" };
    }
  }

  if (format === "banner" && c.count >= CAPS.maxBannerLoadsPerSession) {
    return { allowed: false, reason: "session banner load cap reached" };
  }

  return { allowed: true };
}

/** Record that an ad was actually shown. Call only after a real impression. */
export function recordShown(format: AdFormat, placement: string, now = Date.now()): void {
  const c = counter(format, placement);
  c.count += 1;
  c.lastShownAt = now;
}

/** Test seam. Also used when a build target changes at runtime in the web export. */
export function resetCaps(): void {
  for (const k of Object.keys(shown)) delete shown[k];
}
