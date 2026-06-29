// Supabase "Send SMS Hook" — delivers the auth OTP over WhatsApp via Nextel.
//
// Supabase Auth generates, stores, rate-limits and verifies the OTP itself.
// This hook only takes the code Supabase produced and hands it to Nextel's
// "auth" WhatsApp template, so the client can use the standard
// signInWithOtp / verifyOtp flow and get a real Supabase session.
//
// Configure in Supabase Dashboard → Authentication → Hooks → "Send SMS hook"
// → point it at this Edge Function. Set these Function secrets:
//   NEXTEL_API_KEY        – key from app.nextel.io (goes in URL path, NOT as Bearer header)
//   NEXTEL_SENDER         – your sender as BARE 10-DIGIT only (e.g. 6263461179, NO country code!)
//   NEXTEL_ENDPOINT       – base URL WITHOUT token: https://api.nextel.io/API_V2/Whatsapp/send_template
//   NEXTEL_RECIPIENT_FIELD– recipient JSON key Nextel expects (default "to")
//   SEND_SMS_HOOK_SECRET  – the signing secret Supabase shows when you create the hook (v1,whsec_...)

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET") ?? "";
const NEXTEL_API_KEY = Deno.env.get("NEXTEL_API_KEY") ?? "MFZPSnRHL3BiOHNsdnZMMTYwK0xrUT09";
// Meta's WhatsApp Business API REQUIRES sender_phone as bare 10-digit (no country code).
// Strip any leading "91" if someone stored the 12-digit format in the env var.
function normalizeSender(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
const NEXTEL_SENDER = normalizeSender(Deno.env.get("NEXTEL_SENDER") ?? "6263461179");
// NEXTEL_ENDPOINT must be the base URL WITHOUT the token. Strip any trailing token
// if someone stored the full URL in the env var (avoids double-token URL bug).
function normalizeEndpoint(raw: string): string {
  // If the URL ends with /send_template/<TOKEN>, strip the token part
  const base = "https://api.nextel.io/API_V2/Whatsapp/send_template";
  if (raw.length > base.length) return base;
  return raw;
}
const NEXTEL_ENDPOINT = normalizeEndpoint(
  Deno.env.get("NEXTEL_ENDPOINT") ?? "https://api.nextel.io/API_V2/Whatsapp/send_template"
);
// Nextel's request body in the dashboard sample omits the recipient key; set
// this to whatever Nextel expects ("to" | "number" | "recipient" | "mobile").
const RECIPIENT_FIELD = Deno.env.get("NEXTEL_RECIPIENT_FIELD") ?? "to";

function toE164Digits(phone: string): string {
  // Nextel wants the number without "+". Keep digits only.
  return phone.replace(/[^\d]/g, "");
}

Deno.serve(async (req) => {
  const payload = await req.text();

  // 1) Verify the request really came from Supabase Auth. Supabase hands the
  //    secret as "v1,whsec_<base64>"; standardwebhooks wants the base64 part.
  let data: { user: { phone?: string }; sms: { otp: string } };
  try {
    const secret = HOOK_SECRET.replace(/^v1,whsec_/, "");
    const wh = new Webhook(secret);
    data = wh.verify(payload, Object.fromEntries(req.headers)) as typeof data;
  } catch (err) {
    console.error("hook signature verification failed", err);
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const phone = data?.user?.phone;
  const otp = data?.sms?.otp;
  if (!phone || !otp) {
    return new Response(JSON.stringify({ error: "missing phone or otp" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // 2) Hand the code to Nextel's "auth" template.
  //    Body {{1}} = code → templateArgs:[otp].
  const body: Record<string, unknown> = {
    type: "buttonTemplate",
    templateId: "auth",
    templateLanguage: "en",
    sender_phone: NEXTEL_SENDER,
    templateArgs: [otp],
    [RECIPIENT_FIELD]: toE164Digits(phone),
  };

  const url = `${NEXTEL_ENDPOINT}/${NEXTEL_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("nextel send failed", res.status, text);
    return new Response(JSON.stringify({ error: "delivery failed", detail: text }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  });
});
