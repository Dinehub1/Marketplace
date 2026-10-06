// Dine-in booking rules shared by dinein-checkout and dinein-razorpay-webhook.
//
// The price is decided here, from the offer row: party size × the offer's per-guest cover charge,
// read from conditions[discount_type].cover_charge exactly as app/book-table/[id].tsx displays it.
// Nothing the app sends about money is used.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { RazorpayPayment } from './razorpay.ts';

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

export type Offer = {
  id: string;
  restaurant_id: string;
  discount_type: string | null;
  conditions: Record<string, { cover_charge?: number | string } | undefined> | null;
  is_active: boolean | null;
};

/** Per-guest cover charge in rupees; 0 when the offer has none. Never negative, never NaN. */
export function coverChargeOf(offer: Offer | null): number {
  if (!offer || !offer.discount_type) return 0;
  const raw = offer.conditions?.[offer.discount_type]?.cover_charge;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** The same 6-hour window app/config/supabase.js calculateBookingEndTime writes. */
export function bookingEndTime(bookingTime: string): string {
  const [h, m] = bookingTime.split(':').map((x) => parseInt(x, 10));
  const total = ((h * 60 + m + 6 * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
}

/**
 * Mark the advance paid and the booking confirmed, once.
 *
 * Both the app's verify call and the payment.captured webhook end here, possibly at the same time.
 * The conditional update (status still 'pending') is the lock: only the caller that flips the row
 * goes on to confirm the booking and record the offer redemption, so neither is done twice.
 */
export async function confirmPaidBooking(
  db: SupabaseClient,
  txn: { id: string; booking_id: string },
  payment: RazorpayPayment,
): Promise<'confirmed' | 'already'> {
  const { data: flipped, error } = await db
    .from('restaurant_transactions')
    .update({
      status: 'success',
      razorpay_payment_id: payment.id,
      transaction_id: payment.id,
      gateway_response: {
        gateway: 'razorpay',
        payment_id: payment.id,
        order_id: payment.order_id,
        method: payment.method ?? null,
        status: payment.status,
      },
    })
    .eq('id', txn.id)
    .neq('status', 'success')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!flipped) return 'already';

  const now = new Date().toISOString();
  const { data: booking, error: bookingError } = await db
    .from('restaurant_booking')
    .update({ status: 'confirmed', confirmed_at: now })
    .eq('id', txn.booking_id)
    .select('id, user_id, offer_id, booking_date, party_size')
    .single();
  if (bookingError) throw bookingError;

  await recordRedemption(db, booking);
  return 'confirmed';
}

/** The offer redemption the app used to write itself after a successful payment. */
export async function recordRedemption(
  db: SupabaseClient,
  booking: { offer_id: string | null; user_id: string | null; booking_date: string; party_size: number },
) {
  if (!booking.offer_id || !booking.user_id) return;
  const { error } = await db.from('dinein_offer_redemptions').insert({
    offer_id: booking.offer_id,
    user_id: booking.user_id,
    redemption_date: booking.booking_date,
    slot_label: 'All Day',
    // The app's createOfferRedemption call never passed a party size, so it recorded 1; keep that
    // until offer capacity is deliberately changed to count guests.
    quantity: 1,
  });
  // A failed redemption record must not undo a paid booking; log it for follow-up.
  if (error) console.error('[dinein] offer redemption insert failed:', error.message);
}
