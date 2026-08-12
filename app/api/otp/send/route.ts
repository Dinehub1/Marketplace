import { NextRequest, NextResponse } from "next/server";
import { db, sendTemplate, toIndiaPhone } from "@/lib/nextel";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const { phone: rawPhone } = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(rawPhone ?? "");
  if (!phone) return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400, headers: noStore });

  // Rate limit: max 3 codes per phone per 10 minutes.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await db(`otp_codes?phone=eq.${phone}&created_at=gte.${since}&select=id`);
  if (((await recent.json()) as any[]).length >= 3) {
    return NextResponse.json({ error: "Too many codes requested. Try again in 10 minutes." }, { status: 429, headers: noStore });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const ins = await db("otp_codes", {
    method: "POST",
    body: JSON.stringify({ phone, code, expires_at: expires }),
    headers: { Prefer: "return=minimal" },
  });
  if (!ins.ok) return NextResponse.json({ error: "Could not create code" }, { status: 500, headers: noStore });

  const sent = await sendTemplate(phone, "auth", [code]);
  // Dev convenience: surface the code so local e2e tests can verify without
  // intercepting WhatsApp. Never sent in production.
  const devCode = process.env.NODE_ENV !== "production" ? { devCode: code } : {};
  return NextResponse.json(
    { ok: true, delivered: sent.ok, ...devCode, ...(sent.ok ? {} : { deliveryError: "WhatsApp delivery failed — try again shortly" }) },
    { headers: noStore },
  );
}
