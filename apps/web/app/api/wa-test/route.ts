import { NextRequest, NextResponse } from "next/server";
import { errorMessage } from "@/lib/errors";

// Diagnostic endpoint for the WhatsApp OTP test page. Fires a real Nextel
// "auth" template send and reports the raw response so we can confirm the API
// key works and discover the correct recipient field name. Remove after wiring
// the real Supabase Send SMS Hook.
//
// SECURITY: this endpoint sends REAL WhatsApp messages and echoes the code.
// It is disabled by default. It only responds when BOTH the env flag
// ALLOW_WA_TEST="true" is set AND the app is not running in production, so a
// stale deployment can never be turned into a spam/SMS-bombing vector.

const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY ?? "";
const NEXTEL_ENDPOINT =
  process.env.NEXTEL_API_URL ??
  process.env.NEXTEL_ENDPOINT ??
  "https://api.nextel.io/API_V2/Whatsapp/send_template";
// Meta's WhatsApp Business API REQUIRES sender_phone as bare 10-digit (no country code).
// Strip any leading "91" if someone stored the 12-digit format in the env var.
function normalizeSender(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
const SENDER = normalizeSender(process.env.NEXTEL_SENDER ?? "6263461179");

// Candidate keys Nextel might use for the recipient, tried in order.
const CANDIDATE_FIELDS = ["to", "number", "phone", "recipient", "mobile", "contact", "user_phone", "contact_number", "send_to"];

function toIndia(phone: string): string {
  const d = phone.replace(/[^\d]/g, "");
  if (d.length === 10) return `91${d}`;
  return d;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_WA_TEST !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { apiKey, phone, code, recipientField, auto } = await req.json();
  if (!apiKey || !phone) {
    return NextResponse.json({ error: "apiKey and phone are required" }, { status: 400 });
  }

  const otp = (code && String(code).trim()) || String(Math.floor(100000 + Math.random() * 900000));
  const to = toIndia(phone);
  const fields: string[] = auto ? CANDIDATE_FIELDS : [recipientField || "to"];

  /** One delivery probe, kept so the caller can see every field name tried. */
  type WaAttempt = { recipientField: string; status?: number; ok?: boolean; response?: string; error?: string };
  const attempts: WaAttempt[] = [];
  for (const field of fields) {
    const body: Record<string, unknown> = {
      type: "buttonTemplate",
      templateId: "auth",
      templateLanguage: "en",
      sender_phone: SENDER,
      templateArgs: [otp],
      [field]: to,
    };
    try {
      const url = `${NEXTEL_ENDPOINT}/${apiKey || NEXTEL_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      attempts.push({ recipientField: field, status: res.status, ok: res.ok, response: text.slice(0, 1000) });
      // Stop at first clearly-successful send to avoid duplicate messages.
      if (res.ok) break;
    } catch (e) {
      attempts.push({ recipientField: field, error: errorMessage(e, "unknown") });
    }
  }

  const winner = attempts.find((a) => a.ok);
  return NextResponse.json({
    sent_code: otp,
    sender: SENDER,
    to,
    working_recipient_field: winner?.recipientField ?? null,
    attempts,
  });
}
