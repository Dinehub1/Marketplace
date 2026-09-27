// Server-side WhatsApp sending via Nextel + shared phone/token helpers.
import { createHmac } from "crypto";
import { loadKey } from "./keyLoader";
import { errorMessage } from "@/lib/errors";

const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY ?? "";

/**
 * The template-send endpoint. `NEXTEL_API_URL` may be given as the bare API host
 * (`https://api.nextel.io`, the form Nextel's dashboard shows) or as the full path;
 * either way the request goes to `.../API_V2/Whatsapp/send_template/<key>`.
 */
const NEXTEL_ENDPOINT = (() => {
  const raw = (process.env.NEXTEL_ENDPOINT ?? process.env.NEXTEL_API_URL ?? "https://api.nextel.io").replace(/\/+$/, "");
  return /\/send_template$/.test(raw) ? raw : `${raw}/API_V2/Whatsapp/send_template`;
})();

// How long a phone-verification token stays valid. Bounded on purpose: a token
// in a URL or a stale localStorage slot must not be a permanent session. The
// client re-verifies (WhatsApp OTP) after expiry, which is the same trust model
// the rest of the app already uses.
const TOKEN_TTL_MS = Number(process.env.PHONE_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000);

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

/**
 * Send a WhatsApp template message through Nextel. Never throws.
 *
 * Nextel's own API page (Settings → WhatsApp → API & Logs) defines the body, and one
 * field name there is counter-intuitive: **`sender_phone` is the recipient** — the
 * customer's number, `91XXXXXXXXXX`. Our business number is implied by the API key.
 * An earlier version put the business number in `sender_phone` and guessed a separate
 * recipient field, so every OTP went to our own number and failed.
 *
 * Success is read from the *body*, not the HTTP status: Nextel answers HTTP 200 for
 * everything and reports `{"status":"500","statusText":"Mobile not correct!"}` or
 * `{"status":"202","statusText":"Accepted","messageId":"wamid…"}` inside it. Only an
 * accepted status with a message id counts. The id is returned so a send can be found
 * in Nextel's Single Logs, which is where the final delivered/failed status lives.
 *
 * `templateArgs` fill the template in order. An authentication template with a
 * "Copy code" button takes the code twice — once for the body, once for the button.
 */
export async function sendTemplate(
  phone: string,
  templateId: string,
  templateArgs: string[],
): Promise<{ ok: boolean; detail: string; messageId?: string }> {
  if (!NEXTEL_API_KEY) return { ok: false, detail: "NEXTEL_API_KEY not configured" };
  const to = toIndiaPhone(phone);
  if (!to) return { ok: false, detail: "invalid phone" };
  try {
    const res = await fetch(`${NEXTEL_ENDPOINT}/${NEXTEL_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "buttonTemplate",
        templateId,
        templateLanguage: "en",
        sender_phone: to,
        templateArgs,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let body: { status?: string | number; statusText?: string; messageId?: string } = {};
    try {
      body = JSON.parse(text);
    } catch {
      /* not JSON: reported below as-is */
    }
    const status = String(body.status ?? res.status);
    const accepted = res.ok && (status === "200" || status === "202") && Boolean(body.messageId);
    const detail = `${status} ${body.statusText ?? text.slice(0, 160)}${body.messageId ? ` ${body.messageId}` : ""}`;
    return accepted ? { ok: true, detail, messageId: body.messageId } : { ok: false, detail };
  } catch (e) {
    return { ok: false, detail: errorMessage(e, "network error") };
  }
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
