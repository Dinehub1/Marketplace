// Product-order helpers shared by the paywall routes.
//
// The rule the whole product rests on: an order row with status 'paid' is the
// ONLY thing that releases a clean file. Nothing here is decided on the client,
// and no route returns the clean key because a caller asked nicely.
import { db } from "@/lib/nextel";

export type PaidOrder = {
  id: number;
  amount_paise: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

/** The paid order that unlocks this job for this phone, or null. */
export async function paidOrderFor(jobId: number, phone: string): Promise<PaidOrder | null> {
  const res = await db(
    `orders?job_id=eq.${jobId}&phone=eq.${encodeURIComponent(phone)}&status=eq.paid` +
      `&select=id,amount_paise,razorpay_order_id,razorpay_payment_id,created_at&order=created_at.desc&limit=1`,
  );
  if (!res.ok) return null;
  return ((await res.json()) as PaidOrder[])[0] ?? null;
}

/** Price from the `products` row — one source of truth for the app and the order. */
const PRICE_FALLBACK: Record<string, number> = { "passport-photo": 4900, "bg-remove": 9900 };

export async function productPrice(slug: string): Promise<number> {
  try {
    const res = await db(`products?slug=eq.${encodeURIComponent(slug)}&select=price_paise`);
    const row = ((await res.json()) as any[])[0];
    if (row?.price_paise) return Number(row.price_paise);
  } catch {
    // fall through
  }
  // Never 0: a missing row must not make a product free.
  return PRICE_FALLBACK[slug] ?? 4900;
}

/** Razorpay keys present? Without them the paywall can be shown but not charged. */
export const paymentsConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
