// Server-side WhatsApp sending via Nextel + shared phone/token helpers.
import { createHmac } from "crypto";

const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY ?? "";
const NEXTEL_ENDPOINT = process.env.NEXTEL_ENDPOINT ?? "https://api.nextel.io/API_V2/Whatsapp/send_template";
const NEXTEL_SENDER = (process.env.NEXTEL_SENDER ?? "6263461179").replace(/\D/g, "").replace(/^91(\d{10})$/, "$1");

// Nextel deployments differ on the recipient field name; try in order.
const RECIPIENT_FIELDS = ["to", "number", "phone", "recipient", "mobile"];

/** Normalize an Indian phone number to 12-digit 91XXXXXXXXXX form. */
export function toIndiaPhone(raw: string): string | null {
  const d = (raw ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  return null;
}

/** Stateless proof that `phone` completed OTP verification (HMAC over the service key). */
export function phoneToken(phone: string): string {
  const secret = require('./keyLoader').loadKey() ?? "";
  return createHmac("sha256", secret).update(`verified:${phone}`).digest("hex").slice(0, 40);
}

export function checkPhoneToken(phone: string, token: string): boolean {
  return !!token && token === phoneToken(phone);
}

/** Send a WhatsApp template message. Returns { ok, detail } and never throws. */
export async function sendTemplate(
  phone: string,
  templateId: string,
  templateArgs: string[],
): Promise<{ ok: boolean; detail: string }> {
  if (!NEXTEL_API_KEY) return { ok: false, detail: "NEXTEL_API_KEY not configured" };
  const to = toIndiaPhone(phone);
  if (!to) return { ok: false, detail: "invalid phone" };
  let lastDetail = "";
  for (const field of RECIPIENT_FIELDS) {
    try {
      const res = await fetch(`${NEXTEL_ENDPOINT}/${NEXTEL_API_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "buttonTemplate",
          templateId,
          templateLanguage: "en",
          sender_phone: NEXTEL_SENDER,
          templateArgs,
          [field]: to,
        }),
      });
      const text = await res.text();
      lastDetail = `${field}: ${res.status} ${text.slice(0, 200)}`;
      if (res.ok && !/error|invalid|fail/i.test(text)) return { ok: true, detail: lastDetail };
    } catch (e: any) {
      lastDetail = `${field}: ${e?.message ?? "network error"}`;
    }
  }
  return { ok: false, detail: lastDetail };
}

/** Service-role PostgREST fetch (server only). */
export async function db(pathAndQuery: string, init?: RequestInit): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = require('./keyLoader').loadKey()!;
  return fetch(`${url}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
