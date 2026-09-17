import { NextRequest, NextResponse } from "next/server";
import { db, sendTemplate, toIndiaPhone } from "@/lib/nextel";
import { asRow, asRows } from "@/lib/postgrest";
import type { OtpCodeRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const { phone: rawPhone } = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(rawPhone ?? "");
  if (!phone) return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400, headers: noStore });

  // Rate limit: max 3 codes per phone per 10 minutes.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await db(`otp_codes?phone=eq.${phone}&created_at=gte.${since}&select=id`);
  if ((await asRows<OtpCodeRow>(recent)).length >= 3) {
    return NextResponse.json({ error: "Too many codes requested. Try again in 10 minutes." }, { status: 429, headers: noStore });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const ins = await db("otp_codes", {
    method: "POST",
    body: JSON.stringify({ phone, code, expires_at: expires }),
    headers: { Prefer: "return=representation" },
  });
  const insRow = ins.ok ? await asRow<OtpCodeRow>(ins) : null;
  if (!insRow) return NextResponse.json({ error: "Could not create code" }, { status: 500, headers: noStore });

  const sent = await sendTemplate(phone, "auth", [code]);
  // Visibility: log the raw Nextel response so delivery failures are observable
  // in the dev terminal and .next/dev/logs/next-development.log.
  // Log the code in dev only — never leak OTPs in production logs. Dev-code
  // privileged access (logging + echoing in the response) additionally requires
  // the ALLOW_DEV_CODE="true" env flag so a prod build run in NODE_ENV=development
  // still cannot echo codes.
  const allowDevCode = process.env.ALLOW_DEV_CODE === "true" && process.env.NODE_ENV !== "production";
  const logCode = allowDevCode ? code : "<redacted>";
  console.log(`[otp/send] phone=${phone} code=${logCode} delivered=${sent.ok} nextel=${sent.detail}`);
  // Best-effort: persist delivery status once the migration columns exist; never
  // let a missing column break the OTP flow.
  if (insRow.id != null) {
    db(`otp_codes?id=eq.${insRow.id}`, {
      method: "PATCH",
      body: JSON.stringify({ delivered: sent.ok, nextel_detail: sent.detail }),
      headers: { Prefer: "return=minimal" },
    }).catch(() => {});
  }

  const devCode = allowDevCode ? { devCode: code } : {};
  const extra =
    allowDevCode && !sent.ok ? { nextelDetail: sent.detail } : {};
  return NextResponse.json(
    {
      ok: true,
      delivered: sent.ok,
      ...devCode,
      ...extra,
      ...(sent.ok ? {} : { deliveryError: "WhatsApp delivery failed — see logs / otp_codes.nextel_detail" }),
    },
    { headers: noStore },
  );
}
