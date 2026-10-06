// dinein-checkout — create a dine-in booking and take its advance through Razorpay.
//
//   POST { action: "create", booking: {...} }
//     Prices the booking on the server (party size × the offer's cover charge), inserts it, and
//     either confirms it at once (nothing to pay) or creates a Razorpay order for the app to open.
//     → { status: "confirmed", booking }
//     → { status: "payment_required", booking, order: { id, amount, currency }, key_id }
//
//   POST { action: "verify", booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }
//     Checks the checkout signature, then asks Razorpay for the payment itself and requires its
//     order, amount and currency to match what this function charged before confirming.
//     → { status: "confirmed" | "already_confirmed", booking_id }
//
// The app calls this with its anon key (supabase.functions.invoke). The database guards in
// migrations/20261006120000_dinein_razorpay.sql stop that key from confirming bookings or recording
// advance payments directly, so this function, holding the service role, is the only way in.
import {
  bookingEndTime,
  confirmPaidBooking,
  coverChargeOf,
  type Offer,
  recordRedemption,
  serviceClient,
} from '../_shared/dinein.ts';
import {
  capturePayment,
  createOrder,
  fetchPayment,
  KEY_ID,
  razorpayConfigured,
  verifyCheckoutSignature,
} from '../_shared/razorpay.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MEAL_PERIODS = new Set(['breakfast', 'lunch', 'dinner']);
const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const body = await req.json().catch(() => null);
  try {
    if (body?.action === 'create') return await create(body.booking ?? {});
    if (body?.action === 'verify') return await verify(body);
    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('[dinein-checkout]', err instanceof Error ? err.message : err);
    return json({ error: 'Could not complete the booking. Please try again.' }, 500);
  }
});

async function create(input: Record<string, unknown>) {
  const restaurantId = String(input.restaurant_id ?? '');
  const offerId = input.offer_id ? String(input.offer_id) : null;
  const userId = input.user_id ? String(input.user_id) : null;
  const date = String(input.booking_date ?? '');
  const time = String(input.booking_time ?? '');
  const partySize = Number(input.party_size);

  if (!UUID.test(restaurantId)) return json({ error: 'Invalid restaurant' }, 400);
  if (offerId && !UUID.test(offerId)) return json({ error: 'Invalid offer' }, 400);
  if (!userId || !UUID.test(userId)) return json({ error: 'Please sign in to book a table' }, 401);
  if (!DATE.test(date) || !TIME.test(time)) return json({ error: 'Invalid date or time' }, 400);
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 50) {
    return json({ error: 'Invalid party size' }, 400);
  }

  const db = serviceClient();

  const { data: restaurant } = await db
    .from('restaurants')
    .select('id, name, is_active')
    .eq('id', restaurantId)
    .maybeSingle();
  if (!restaurant || restaurant.is_active === false) return json({ error: 'Restaurant not available' }, 400);

  // Name and phone are required columns. Prefer the user's own profile over what the app sends.
  const { data: profile } = await db
    .from('users')
    .select('id, full_name, phone_number, email')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return json({ error: 'Please sign in to book a table' }, 401);
  const customerName = text(profile.full_name, 120) ?? text(input.customer_name, 120) ?? 'Guest';
  const customerPhone = text(profile.phone_number, 20) ?? text(input.customer_phone, 20);
  if (!customerPhone) return json({ error: 'Add a phone number to your profile to book a table' }, 400);
  const mealPeriod = text(input.meal_period, 20)?.toLowerCase() ?? null;

  let offer: Offer | null = null;
  if (offerId) {
    const { data } = await db
      .from('dinein_offers')
      .select('id, restaurant_id, discount_type, conditions, is_active')
      .eq('id', offerId)
      .maybeSingle();
    if (!data || data.restaurant_id !== restaurantId || data.is_active === false) {
      return json({ error: 'This offer is no longer available' }, 400);
    }
    offer = data as Offer;
  }

  const perGuest = coverChargeOf(offer);
  const amount = Math.round(perGuest * partySize * 100) / 100; // rupees
  const amountPaise = Math.round(amount * 100);
  if (amountPaise > 0 && !razorpayConfigured) {
    return json({ error: 'Payments are not available right now. Please try again later.' }, 503);
  }

  const { data: booking, error: bookingError } = await db
    .from('restaurant_booking')
    .insert({
      user_id: userId,
      restaurant_id: restaurantId,
      booking_date: date,
      booking_time: time,
      booking_end_time: bookingEndTime(time),
      party_size: partySize,
      duration_minutes: 120,
      meal_period: MEAL_PERIODS.has(mealPeriod ?? '') ? mealPeriod : null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: text(profile.email, 200) ?? text(input.customer_email, 200),
      special_requests: text(input.special_requests, 500),
      offer_id: offerId,
      advance_payment: amount,
      total_cover_charge: amount,
      cover_charge_per_person: perGuest,
      status: 'pending',
    })
    .select()
    .single();
  if (bookingError) throw bookingError;

  if (amountPaise === 0) {
    const { data: confirmed, error } = await db
      .from('restaurant_booking')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', booking.id)
      .select()
      .single();
    if (error) throw error;
    await recordRedemption(db, confirmed);
    return json({ status: 'confirmed', booking: confirmed });
  }

  const order = await createOrder(amountPaise, booking.id, {
    project: 'dining',
    booking_id: booking.id,
    restaurant: String(restaurant.name ?? '').slice(0, 200),
  });

  const { error: txnError } = await db.from('restaurant_transactions').insert({
    user_id: userId,
    booking_id: booking.id,
    amount,
    currency: 'INR',
    status: 'pending',
    purpose: 'advance_payment',
    razorpay_order_id: order.id,
  });
  if (txnError) throw txnError;

  return json({
    status: 'payment_required',
    booking,
    order: { id: order.id, amount: order.amount, currency: order.currency },
    key_id: KEY_ID,
  });
}

async function verify(input: Record<string, unknown>) {
  const bookingId = String(input.booking_id ?? '');
  const orderId = String(input.razorpay_order_id ?? '');
  const paymentId = String(input.razorpay_payment_id ?? '');
  const signature = String(input.razorpay_signature ?? '');
  if (!UUID.test(bookingId) || !orderId || !paymentId || !signature) {
    return json({ error: 'Missing payment details' }, 400);
  }

  if (!(await verifyCheckoutSignature(orderId, paymentId, signature))) {
    return json({ error: 'Payment could not be verified' }, 400);
  }

  const db = serviceClient();
  const { data: txn } = await db
    .from('restaurant_transactions')
    .select('id, booking_id, amount, status')
    .eq('booking_id', bookingId)
    .eq('razorpay_order_id', orderId)
    .eq('purpose', 'advance_payment')
    .maybeSingle();
  if (!txn) return json({ error: 'Payment does not belong to this booking' }, 400);
  if (txn.status === 'success') return json({ status: 'already_confirmed', booking_id: bookingId });

  // The signature proves Razorpay issued this payment for this order; the payment record proves
  // what was actually paid. Both must agree with the amount charged at create time.
  const expectedPaise = Math.round(Number(txn.amount) * 100);
  let payment = await fetchPayment(paymentId);
  if (payment.order_id !== orderId || payment.amount !== expectedPaise || payment.currency !== 'INR') {
    return json({ error: 'Payment does not match this booking' }, 400);
  }
  if (payment.status === 'authorized') payment = await capturePayment(paymentId, expectedPaise);
  if (payment.status !== 'captured') {
    return json({ error: `Payment not completed (${payment.status})` }, 400);
  }

  const result = await confirmPaidBooking(db, txn, payment);
  return json({ status: result === 'confirmed' ? 'confirmed' : 'already_confirmed', booking_id: bookingId });
}
