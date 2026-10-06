/**
 * Dine-in table booking checkout through Razorpay.
 *
 * The app never decides what a booking costs. It sends the booking details to the dinein-checkout
 * edge function, which prices it from the offer row (party size × cover charge), saves it, and
 * returns either a confirmed booking (nothing to pay) or a Razorpay order. The app opens Razorpay's
 * own sheet (UPI, cards, netbanking, wallets) for that order and hands the result back to the
 * function, which verifies it with Razorpay before confirming the booking. The database refuses
 * to let the app confirm a booking or record a payment itself.
 *
 * Needs a development or store build: react-native-razorpay is a native module (not in Expo Go).
 */
import RazorpayCheckout from 'react-native-razorpay';

import { supabase } from '@/config/supabase';

export type DineInBookingRequest = {
  user_id: string | null;
  restaurant_id: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  party_size: number;
  meal_period?: string | null;
  special_requests?: string | null;
  offer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
};

export type DineInBooking = {
  id: string;
  status: string;
  advance_payment: number;
  total_cover_charge: number;
  [key: string]: unknown;
};

export type CheckoutResult =
  | { status: 'confirmed'; booking: DineInBooking; paymentId: string | null; amount: number }
  | { status: 'cancelled'; booking: DineInBooking }
  /** Paid, but the verify call did not get through; the webhook will confirm the booking. */
  | { status: 'confirming'; booking: DineInBooking; paymentId: string; amount: number };

/**
 * The booking day as the customer picked it, in their own timezone. The date param is an ISO
 * timestamp in UTC, and taking its date part turns an IST day picked at local midnight into the
 * day before.
 */
export function toLocalDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Razorpay's code for the customer closing the sheet (both platforms report 0 or 2 for this). */
const isUserCancel = (err: any) =>
  err?.code === 0 || err?.code === 2 || /cancel/i.test(String(err?.description ?? err?.error?.description ?? ''));

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('dinein-checkout', { body });
  if (error) {
    // FunctionsHttpError carries the function's JSON error body in `context`.
    let message = 'Could not reach the booking service. Please try again.';
    try {
      const payload = await (error as any).context?.json?.();
      if (payload?.error) message = payload.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return data as T;
}

/**
 * Create the booking and, when it has an advance to pay, take it through Razorpay.
 * Resolves `cancelled` if the customer closes the payment sheet (the booking stays pending and
 * is never confirmed); throws on any failure.
 */
export async function bookTableWithRazorpay(
  request: DineInBookingRequest,
  display: { restaurantName: string; themeColor?: string }
): Promise<CheckoutResult> {
  const created = await call<
    | { status: 'confirmed'; booking: DineInBooking }
    | {
        status: 'payment_required';
        booking: DineInBooking;
        order: { id: string; amount: number; currency: string };
        key_id: string;
      }
  >({ action: 'create', booking: request });

  if (created.status === 'confirmed') {
    return { status: 'confirmed', booking: created.booking, paymentId: null, amount: 0 };
  }

  let paid: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string };
  try {
    paid = await RazorpayCheckout.open({
      key: created.key_id,
      order_id: created.order.id,
      amount: created.order.amount,
      currency: created.order.currency,
      name: 'Swaad Ghar',
      description: `Table booking at ${display.restaurantName}`.slice(0, 255),
      prefill: {
        name: request.customer_name ?? undefined,
        email: request.customer_email ?? undefined,
        contact: request.customer_phone ?? undefined,
      },
      notes: { booking_id: created.booking.id },
      theme: { color: display.themeColor ?? '#10B981' },
    });
  } catch (err: any) {
    if (isUserCancel(err)) return { status: 'cancelled', booking: created.booking };
    throw new Error(err?.description || 'Payment failed. Please try again.');
  }

  // A captured payment is confirmed by the webhook even if this call never lands, so a failure
  // here is reported as "still confirming", not as a failed payment.
  try {
    await call<{ status: string }>({
      action: 'verify',
      booking_id: created.booking.id,
      razorpay_order_id: paid.razorpay_order_id ?? created.order.id,
      razorpay_payment_id: paid.razorpay_payment_id,
      razorpay_signature: paid.razorpay_signature ?? '',
    });
  } catch (err) {
    console.warn('[dinein-checkout] verify did not complete; webhook will confirm:', err);
    return {
      status: 'confirming',
      booking: created.booking,
      paymentId: paid.razorpay_payment_id,
      amount: created.order.amount / 100,
    };
  }

  return {
    status: 'confirmed',
    booking: { ...created.booking, status: 'confirmed' },
    paymentId: paid.razorpay_payment_id,
    amount: created.order.amount / 100,
  };
}
