// Razorpay over its REST API, for Supabase Edge Functions (Deno). Server-only: the key secret and
// the webhook secret never leave this runtime.
//
// Secrets (set with `supabase secrets set` on the Dinehub project):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET  — Dashboard → Account & Settings → API Keys
//   RAZORPAY_WEBHOOK_SECRET               — the secret typed when the webhook was created

const API = 'https://api.razorpay.com/v1';

export const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';

export const razorpayConfigured = Boolean(KEY_ID && KEY_SECRET);

function auth() {
  return `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: auth(), 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = (body as { error?: { description?: string } })?.error?.description ?? res.statusText;
    throw new Error(`Razorpay ${path} failed: ${res.status} ${reason}`);
  }
  return body as T;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };
export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method?: string;
};

/** `amountPaise` is an integer: ₹49 is 4900. */
export function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return call<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: receipt.slice(0, 40), notes }),
  });
}

export function fetchPayment(paymentId: string) {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

/** Capture an authorized payment, for accounts without automatic capture. */
export function capturePayment(paymentId: string, amountPaise: number) {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST',
    body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
  });
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare without leaking how many leading characters matched. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The checkout handler's signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export async function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  if (!KEY_SECRET || !signature) return false;
  return safeEqual(await hmacHex(KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

/** A webhook's X-Razorpay-Signature: HMAC-SHA256 of the raw body with the webhook secret. */
export async function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!WEBHOOK_SECRET || !signature) return false;
  return safeEqual(await hmacHex(WEBHOOK_SECRET, rawBody), signature);
}
