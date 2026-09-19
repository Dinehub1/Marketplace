import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Ad telemetry ingest — the write end of `apps/mobile/lib/ads`.
 *
 * This route is what makes the whole design measurable: the app records every ad
 * request, fill, impression, reward and error, plus the **winning price** the
 * mediation host reported for each impression, and this is where those rows land.
 * The Networks screen then answers "which network actually paid more, for this app,
 * this placement and this country" from our own data rather than a vendor report.
 *
 * Posture, because this is an unauthenticated public endpoint:
 *
 *   - **Batched and capped.** The client sends up to 25 rows per request; anything
 *     larger than 100 events or ~64 KB is rejected rather than parsed.
 *   - **Fully allow-listed.** Every enum is checked against the same values the SQL
 *     `check` constraints use, so a malformed client cannot put a value in the
 *     table that a query would later misinterpret.
 *   - **Never fails the app.** A bad row is dropped, not 500'd: telemetry that can
 *     break a client is worse than telemetry that is missing. The response counts
 *     what was accepted so a client can tell "rejected" from "never arrived".
 *   - **Service-role write.** `ad_events` has RLS default-deny and no anon grant, so
 *     the publishable key inside a shipped binary cannot read or forge revenue.
 */

const noStore = { "Cache-Control": "no-store" };

const FORMATS = new Set(["rewarded", "interstitial", "banner", "native", "appOpen"]);
const EVENTS = new Set(["request", "fill", "impression", "click", "reward", "error", "cap_blocked"]);
const CONSENT = new Set(["unknown", "personalized", "non-personalized", "denied"]);

const MAX_EVENTS = 100;
const MAX_BODY_BYTES = 64 * 1024;

/** Trim to a column-safe length. `null` when absent, so the column stays NULL. */
function text(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

/** A number, or null. Kept separate from `Number(...)` so "" is null, not 0. */
function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type CleanRow = Record<string, unknown>;

/**
 * Turn one client event into a row, or null when it is not usable.
 *
 * Rejecting rather than repairing is deliberate for the enums: an event whose
 * `format` we do not recognise is a client/schema mismatch that should be visible
 * in the counts, not silently stored as something else.
 */
function cleanRow(raw: unknown): CleanRow | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;

  const appTarget = text(e.app_target, 64);
  const format = text(e.format, 24);
  const event = text(e.event, 24);
  const placement = text(e.placement, 96);

  if (!appTarget || !format || !event || !placement) return null;
  if (!FORMATS.has(format) || !EVENTS.has(event)) return null;

  const consent = text(e.consent_state, 24);

  return {
    app_target: appTarget,
    platform: text(e.platform, 24) ?? "unknown",
    placement,
    format,
    event,
    network: text(e.network, 32),
    ad_unit_id: text(e.ad_unit_id, 128),
    // Micros are an integer; a fractional value would mean a client bug, so round.
    revenue_micros: num(e.revenue_micros) === null ? null : Math.round(num(e.revenue_micros)!),
    currency: text(e.currency, 8) ?? "USD",
    latency_ms: num(e.latency_ms) === null ? null : Math.round(num(e.latency_ms)!),
    error_code: text(e.error_code, 64),
    error_message: text(e.error_message, 300),
    is_test: e.is_test === true,
    consent_state: consent && CONSENT.has(consent) ? consent : "unknown",
    session_id: text(e.session_id, 64),
    country: text(e.country, 8),
  };
}

export async function POST(req: NextRequest) {
  // A shipped client retries on failure, so the limit is generous: this stops a
  // runaway loop, not normal use.
  const rl = rateLimit(`ad-events:${clientIp(req)}`, 240, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
      },
    );
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: noStore });
  }

  const body = await req.json().catch(() => null);
  const events = (body as { events?: unknown } | null)?.events;
  if (!Array.isArray(events)) {
    return NextResponse.json({ error: "events[] required" }, { status: 400, headers: noStore });
  }
  if (events.length > MAX_EVENTS) {
    return NextResponse.json({ error: `at most ${MAX_EVENTS} events per request` }, { status: 413, headers: noStore });
  }

  const rows = events.map(cleanRow).filter((r): r is CleanRow => r !== null);
  if (rows.length === 0) {
    // Nothing usable is not a server error — it is a client bug, and it is reported
    // as such so the client can stop retrying a batch that will never land.
    return NextResponse.json({ accepted: 0, rejected: events.length }, { status: 200, headers: noStore });
  }

  const res = await db("ad_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    // The client keeps the batch buffered and retries; it does not lose it.
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "Could not store ad events", detail: detail.slice(0, 300) },
      { status: 502, headers: noStore },
    );
  }

  return NextResponse.json({ accepted: rows.length, rejected: events.length - rows.length }, { status: 202, headers: noStore });
}
