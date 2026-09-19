/**
 * The ad event buffer — how a winning impression becomes a number we own.
 *
 * Every network shows you its own dashboard, aggregated across all its publishers,
 * some time later. That is not enough to answer the only question this system
 * exists to answer: **for this app, this placement and this country, which network
 * actually paid more?** So every stage of an ad's life is recorded here, including
 * the winning price from the SDK's impression-level revenue callback, and sent to
 * our own table.
 *
 * Design choices worth defending:
 *
 *   - **Fire-and-forget, never blocking.** An ad that showed must never be held up
 *     by logging, and a network failure must never turn into a failed ad. Sends are
 *     detached; failures are retried, not thrown.
 *   - **Bounded.** A phone in aeroplane mode could otherwise accumulate thousands of
 *     rows in memory. The buffer drops the oldest, because recent telemetry is what
 *     drives the config loop.
 *   - **`is_test` on every row.** A demo-unit impression is recorded so the pipeline
 *     can be proven end-to-end before an account exists, and labelled so it can
 *     never be averaged into the eCPM that decides where money goes.
 *   - **`revenue_micros` null vs 0.** Null means the network did not report a value.
 *     Averaging that in as zero would make a good network look like a bad one.
 */
import { appTarget, eventsEndpoint, isTestUnit } from "./config";
import { consentState } from "./consent";
import { sessionId } from "./session";
import type { AdFormat, NetworkId, PlacementId } from "./types";

/** Mirrors the `ad_events` columns; see supabase/migrations for the source of truth. */
export type AdEventRecord = {
  app_target: string;
  platform: string;
  placement: PlacementId;
  format: AdFormat;
  event: "request" | "fill" | "impression" | "click" | "reward" | "error" | "cap_blocked";
  network?: NetworkId | "unknown" | null;
  ad_unit_id?: string | null;
  revenue_micros?: number | null;
  currency?: string | null;
  latency_ms?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  is_test: boolean;
  consent_state: string;
  session_id: string;
  country?: string | null;
};

/** How many rows may sit unsent before the oldest are dropped. */
const MAX_BUFFERED = 500;

/** Rows per request. Small enough that one failure loses little. */
const BATCH_SIZE = 25;

const buffer: AdEventRecord[] = [];
let flushing = false;

function platform(): string {
  // Not `react-native`'s Platform import: this file is also bundled for the web
  // export, where the platform is the browser and the row should say so.
  const os = (globalThis as { navigator?: { product?: string } }).navigator?.product;
  if (os) return "web";
  return (globalThis as { process?: { env?: Record<string, string>> }).process?.env?.EXPO_OS ?? "unknown";
}

/**
 * Record one ad event.
 *
 * `is_test` is derived from the ad unit, not passed in by the caller: a caller that
 * could label a production impression as a test could hide a real problem, and a
 * caller that forgot to would poison the eCPM average. The unit id knows.
 */
export function recordAdEvent(
  partial: Omit<AdEventRecord, "app_target" | "platform" | "is_test" | "consent_state" | "session_id" | "currency"> &
    Partial<Pick<AdEventRecord, "currency">>,
): void {
  const fmt = partial.format;
  buffer.push({
    app_target: appTarget(),
    platform: platform(),
    currency: partial.currency ?? "USD",
    is_test: isTestUnit(fmt),
    consent_state: consentState(),
    session_id: sessionId(),
    ...partial,
  });
  if (buffer.length > MAX_BUFFERED) buffer.splice(0, buffer.length - MAX_BUFFERED);
  void flush();
}

/**
 * Send what is buffered, oldest first.
 *
 * One flush at a time. A failed request puts its rows back at the front so the next
 * flush retries them in order, and drops them if the buffer has since filled —
 * losing the oldest telemetry is the correct trade when the alternative is
 * unbounded memory on a user's phone.
 */
export async function flush(): Promise<void> {
  if (flushing || buffer.length === 0) return;
  const endpoint = eventsEndpoint();
  if (!endpoint || endpoint === "/api/ad-events") {
    // No server configured: drop rather than accumulate forever. A build in this
    // state is a development build and its telemetry has nowhere to go.
    buffer.length = 0;
    return;
  }

  flushing = true;
  try {
    while (buffer.length > 0) {
      const batch = buffer.slice(0, BATCH_SIZE);
      let ok = false;
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: batch }),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      if (!ok) {
        // Leave the batch in place for a later attempt, unless it is all we have
        // ever had and the buffer is full (handled by the cap above).
        break;
      }
      buffer.splice(0, batch.length);
    }
  } finally {
    flushing = false;
  }
}

/** Test seam, and the hook a "clear telemetry" setting would use. */
export function resetEvents(): void {
  buffer.length = 0;
}

export function pendingEventCount(): number {
  return buffer.length;
}
