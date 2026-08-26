// Server-only Razorpay helper. Reads keys from the app environment; never import
// this from a client component (it would leak the secret key).
import { createHmac, timingSafeEqual } from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

export type RazorpayOrder = {
  id: string;
  amount: number; // paise
  currency: string;
  receipt: string;
  status: string;
};

/** Create a Razorpay order. `amountInr` is rupees; Razorpay wants paise. */
export async function createOrder(opts: {
  amountInr: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured");
  }
  const res = await fetch(`${RAZORPAY_BASE}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(opts.amountInr * 100),
      currency: opts.currency ?? "INR",
      receipt: opts.receipt,
      notes: opts.notes ?? {},
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify a Razorpay webhook signature. The dashboard sends
 * `X-Razorpay-Signature` (HMAC-SHA256 hex of the raw body over the webhook
 * secret). Timing-safe so a malformed request can't be used to fish out bytes.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
