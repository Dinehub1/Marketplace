import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// The only event types the measurement layer accepts. Anything else is dropped
// at the edge of the route so a stray client cannot pollute the analytics with
// arbitrary strings that would only have to be filtered out again downstream.
const ALLOWED_TYPES = new Set([
  "view",
  "call_click",
  "whatsapp_click",
  "directions_click",
  "website_click",
  "lead",
]);

const noStore = { "Cache-Control": "no-store" };

type EventType = "view" | "call_click" | "whatsapp_click" | "directions_click" | "website_click" | "lead";

/** A per-business (and aggregate) counter with every type present, so the owner
 *  dashboard can render zeros instead of treating a missing key as "no data". */
function zeroCounts(): Record<EventType, number> {
  return { view: 0, call_click: 0, whatsapp_click: 0, directions_click: 0, website_click: 0, lead: 0 };
}

type Incoming = {
  business_id?: unknown;
  brand_slug?: unknown;
  type?: unknown;
  session_id?: unknown;
  referrer?: unknown;
  city?: unknown;
};

/** Trim an optional string field to a sane length; null when empty/invalid. */
function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s || null;
}

/** Fire-and-forget engagement tracking. Unauthenticated (it is analytics), but
 *  rate-limited and whitelisted so it cannot be used to flood the database. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad request" }, { status: 400, headers: noStore });

  // Accept one event or a small batch (capped so one request cannot queue an
  // unbounded insert).
  const incoming: Incoming[] = Array.isArray(body) ? body.slice(0, 20) : [body];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "no events" }, { status: 400, headers: noStore });
  }

  const rl = rateLimit(`events:${clientIp(req)}`, 120, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } },
    );
  }

  const rows = incoming
    .map((it) => {
      const id = Number(it?.business_id);
      const type = typeof it?.type === "string" ? it.type : "";
      return {
        business_id: Number.isFinite(id) && id > 0 ? Math.trunc(id) : null,
        type: ALLOWED_TYPES.has(type) ? type : null,
        brand_slug: str(it?.brand_slug, 80),
        session_id: str(it?.session_id, 80),
        referrer: str(it?.referrer, 500),
        city: str(it?.city, 80),
      };
    })
    .filter((r) => r.business_id !== null && r.type !== null);

  if (rows.length === 0) {
    return NextResponse.json({ error: "invalid events" }, { status: 400, headers: noStore });
  }

  const res = await db("business_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  return NextResponse.json(
    { ok: res.ok, inserted: res.ok ? rows.length : 0 },
    { status: res.ok ? 200 : 500, headers: noStore },
  );
}

/** Engagement stats for a business owner, authenticated by their verified phone
 *  token (same trust model as GET /api/leads). Returns per-business and
 *  aggregate counts for the last 30 days. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Token travels in a header, never the query string (referrer/log leakage).
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? url.searchParams.get("phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? url.searchParams.get("token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  // Businesses whose stored phone ends with the owner's 10-digit number — the
  // same ownership inference used by the leads endpoint.
  const last10 = phone.slice(-10);
  const bizRes = await db(`businesses?phone=like.*${last10}&select=id,name,category,rating,address`);
  const businesses = ((await bizRes.json()) as { id: number; name: string }[]) ?? [];
  if (businesses.length === 0) {
    return NextResponse.json({ ok: true, businesses: [], stats: {}, totals: zeroCounts() }, { headers: noStore });
  }

  const ids = businesses.map((b) => b.id).join(",");
  const since = new Date(Date.now() - 30 * 86400e3).toISOString();

  const stats: Record<string, Record<string, number>> = {};
  for (const b of businesses) stats[String(b.id)] = zeroCounts();
  const totals = zeroCounts();

  // Page through the owner's events — a single business can accumulate far more
  // than PostgREST's default 1000-row cap in a month, so rely on Range, not the
  // default limit. The cap bounds the loop against a runaway table.
  for (let from = 0; from < 50_000; from += 1000) {
    const evRes = await db(
      `business_events?business_id=in.(${ids})&created_at=gte.${since}` +
        `&select=business_id,type&order=created_at.desc`,
      { headers: { Range: `${from}-${from + 999}` } },
    );
    if (!evRes.ok) break;
    const events = ((await evRes.json()) as { business_id: number; type: string }[]) ?? [];
    for (const e of events) {
      const bucket = stats[String(e.business_id)];
      if (!bucket || !ALLOWED_TYPES.has(e.type)) continue;
      bucket[e.type] = (bucket[e.type] ?? 0) + 1;
      totals[e.type as EventType] += 1;
    }
    if (events.length < 1000) break;
  }

  return NextResponse.json({ ok: true, businesses, stats, totals }, { headers: noStore });
}
