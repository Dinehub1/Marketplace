// Server-side WhatsApp sending via Nextel + shared phone/token helpers.
import { createHmac } from "crypto";
import { loadKey } from "./keyLoader";

const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY ?? "";
const NEXTEL_ENDPOINT =
  process.env.NEXTEL_API_URL ??
  process.env.NEXTEL_ENDPOINT ??
  "https://api.nextel.io/API_V2/Whatsapp/send_template";
const NEXTEL_SENDER = (process.env.NEXTEL_SENDER ?? "6263461179").replace(/\D/g, "").replace(/^91(\d{10})$/, "$1");

// How long a phone-verification token stays valid. Bounded on purpose: a token
// in a URL or a stale localStorage slot must not be a permanent session. The
// client re-verifies (WhatsApp OTP) after expiry, which is the same trust model
// the rest of the app already uses.
const TOKEN_TTL_MS = Number(process.env.PHONE_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000);

// Nextel deployments differ on the recipient field name; try in order.
const RECIPIENT_FIELDS = ["to", "number", "phone", "recipient", "mobile"];

/** Normalize an Indian phone number to 12-digit 91XXXXXXXXXX form. */
export function toIndiaPhone(raw: string): string | null {
  const d = (raw ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  return null;
}

/** Stateless proof that `phone` completed OTP verification.
 *
 *  Format: `${expiryEpochMs}.${hex}` — the HMAC covers the phone AND the
 *  expiry, so a token can be neither replayed forever nor forged with an old
 *  signature. Default TTL is 24h (see TOKEN_TTL_MS). */
export function phoneToken(phone: string): string {
  const secret = loadKey() ?? "";
  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = createHmac("sha256", secret).update(`verified:${phone}:${exp}`).digest("hex").slice(0, 40);
  return `${exp}.${sig}`;
}

export function checkPhoneToken(phone: string, token: string): boolean {
  if (!token || !phone) return false;
  const sep = token.lastIndexOf(".");
  if (sep <= 0) return false; // reject the legacy non-expiring format outright
  const exp = Number(token.slice(0, sep));
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const sig = token.slice(sep + 1);
  const secret = loadKey() ?? "";
  const expected = createHmac("sha256", secret).update(`verified:${phone}:${exp}`).digest("hex").slice(0, 40);
  // Constant-time compare so a timing attack can't fish out the signature.
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
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
  const key = loadKey()!;
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
