import { NextRequest, NextResponse } from "next/server";
import { db, phoneToken, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {asRows } from "@/lib/postgrest";
import type { OtpCodeRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const { phone: rawPhone, code } = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(rawPhone ?? "");
  if (!phone || !/^\d{6}$/.test(String(code ?? ""))) {
    return NextResponse.json({ error: "Phone and 6-digit code required" }, { status: 400, headers: noStore });
  }

  // Brute-force guard on top of the per-row `attempts` cap.
  const rl = rateLimit(`verify:${clientIp(req)}:${phone}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const now = new Date().toISOString();
  const res = await db(
    `otp_codes?phone=eq.${phone}&expires_at=gte.${now}&verified_at=is.null&attempts=lt.5&order=created_at.desc&limit=1&select=id,code,attempts`,
  );
  const rows = await asRows<OtpCodeRow>(res);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Code expired — request a new one" }, { status: 400, headers: noStore });

  if (row.code !== String(code)) {
    // `attempts` is nullable in the schema and defaults to 0. The old `any` typing let
    // `null + 1` through, which happens to be 1 — say it explicitly instead.
    await db(`otp_codes?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ attempts: (row.attempts ?? 0) + 1 }), headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ error: "Incorrect code" }, { status: 400, headers: noStore });
  }

  await db(`otp_codes?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ verified_at: now }), headers: { Prefer: "return=minimal" } });
  return NextResponse.json({ ok: true, phone, token: phoneToken(phone) }, { headers: noStore });
}
