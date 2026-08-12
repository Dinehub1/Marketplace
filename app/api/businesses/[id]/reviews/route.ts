import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";

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
    `${url}/rest/v1/reviews?business_id=eq.${businessId}&status=eq.approved` +
      `&select=id,author_name,rating,body,created_at&order=created_at.desc&limit=50`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" }, next: { revalidate: 120 } },
  );
  if (!res.ok) return NextResponse.json({ reviews: [], avg: null, count: 0 }, { headers: noStore });
  const reviews = (await res.json()) as any[];
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

  const name = String(body.name ?? "").trim().slice(0, 80) || "Anonymous";
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating))));
  const text = String(body.body ?? "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "Review likhein" }, { status: 400, headers: noStore });

  const ins = await db("reviews", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ business_id: businessId, author_name: name, rating, body: text, author_phone: phone, status: "approved" }),
  });
  if (!ins.ok) return NextResponse.json({ error: "Review save nahi ho saki" }, { status: 500, headers: noStore });
  const row = ((await ins.json()) as any[])[0];
  return NextResponse.json({ ok: true, review: row }, { headers: noStore });
}
