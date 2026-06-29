import { NextRequest, NextResponse } from "next/server";

// Diagnostic endpoint for the WhatsApp OTP test page. Fires a real Nextel
// "auth" template send and reports the raw response so we can confirm the API
// key works and discover the correct recipient field name. Remove after wiring
// the real Supabase Send SMS Hook.

const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY ?? "";
const NEXTEL_ENDPOINT =
  process.env.NEXTEL_ENDPOINT ??
  "https://api.nextel.io/API_V2/Whatsapp/send_template/MFZPSnRHL3BiOHNsdnZMMTYwK0xrUT09";
const SENDER = process.env.NEXTEL_SENDER ?? "916263461179";

// Candidate keys Nextel might use for the recipient, tried in order.
const CANDIDATE_FIELDS = ["to", "number", "phone", "recipient", "mobile", "contact", "user_phone", "contact_number", "send_to"];

function toIndia(phone: string): string {
  const d = phone.replace(/[^\d]/g, "");
  if (d.length === 10) return `91${d}`;
  return d;
}

export async function POST(req: NextRequest) {
  const { apiKey, phone, code, recipientField, auto } = await req.json();
  if (!apiKey || !phone) {
    return NextResponse.json({ error: "apiKey and phone are required" }, { status: 400 });
  }

  const otp = (code && String(code).trim()) || String(Math.floor(100000 + Math.random() * 900000));
  const to = toIndia(phone);
  const fields: string[] = auto ? CANDIDATE_FIELDS : [recipientField || "to"];

  const attempts: any[] = [];
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
    } catch (e: any) {
      attempts.push({ recipientField: field, error: String(e?.message ?? e) });
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
