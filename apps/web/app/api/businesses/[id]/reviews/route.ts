import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { asRow, asRows } from "@/lib/postgrest";
import type { ReviewRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

/** Public list of approved reviews for a business, plus the aggregate. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ reviews: [], avg: null, count: 0 }, { headers: noStore });

  const res = await fetch(
    `${url}/rest/v1/reviews?business_id=eq.${businessId}&is_approved=eq.true` +
      `&select=id,reviewer_name,rating,comment,created_at&order=created_at.desc&limit=50`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" }, next: { revalidate: 120 } },
  );
  if (!res.ok) return NextResponse.json({ reviews: [], avg: null, count: 0 }, { headers: noStore });
  const rows = await asRows<ReviewRow>(res);
  const reviews = rows.map((r) => ({
    id: r.id,
    author_name: r.reviewer_name,
    body: r.comment,
    rating: r.rating,
    created_at: r.created_at,
  }));
  const count = Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || reviews.length;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  return NextResponse.json({ reviews, avg, count }, { headers: noStore });
}

/** Submit a review. Reviewer must OTP-verify their WhatsApp number. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const rl = rateLimit(`review:${clientIp(req)}:${phone}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down and try again." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const name = String(body.name ?? "").trim().slice(0, 80) || "Anonymous";
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating))));
  const text = String(body.body ?? "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "Review likhein" }, { status: 400, headers: noStore });

  const ins = await db("reviews", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ business_id: businessId, reviewer_name: name, rating, comment: text }),
  });
  if (!ins.ok) return NextResponse.json({ error: "Review save nahi ho saki" }, { status: 500, headers: noStore });
  const row = await asRow<ReviewRow>(ins);
  if (!row) return NextResponse.json({ error: "Review save nahi ho saki" }, { status: 500, headers: noStore });
  const review = { id: row.id, author_name: row.reviewer_name, body: row.comment, rating: row.rating, created_at: row.created_at };
  return NextResponse.json({ ok: true, review }, { headers: noStore });
}
