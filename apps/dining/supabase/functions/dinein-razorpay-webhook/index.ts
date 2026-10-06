// dinein-razorpay-webhook — confirms a dine-in booking when Razorpay reports the payment captured.
//
// The app's verify call normally confirms the booking first. This exists for when it never
// arrives (the app was closed, the network dropped after paying): Razorpay retries the webhook
// until it gets a 2xx, and confirmPaidBooking makes a second confirmation a no-op.
//
// Deploy with JWT verification off (Razorpay sends no Supabase token); the Razorpay signature is
// the authentication. Dashboard → Webhooks: URL
//   https://<project-ref>.supabase.co/functions/v1/dinein-razorpay-webhook
// active event payment.captured, secret = RAZORPAY_WEBHOOK_SECRET.
import { confirmPaidBooking, serviceClient } from '../_shared/dinein.ts';
import { type RazorpayPayment, verifyWebhookSignature } from '../_shared/razorpay.ts';

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: true, ...body }), { headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });

  // The signature covers the exact bytes, so read the body raw before parsing it.
  const raw = await req.text();
  if (!(await verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature')))) {
    return new Response('invalid signature', { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: RazorpayPayment } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  // Everything else is acknowledged so Razorpay stops retrying it.
  if (event.event !== 'payment.captured') return ok({ ignored: event.event ?? null });

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return ok({ ignored: 'no order_id' });

  const db = serviceClient();
  const { data: txn, error } = await db
    .from('restaurant_transactions')
    .select('id, booking_id, amount, status')
    .eq('razorpay_order_id', payment.order_id)
    .eq('purpose', 'advance_payment')
    .maybeSingle();
  if (error) return new Response('lookup failed', { status: 500 }); // 5xx: Razorpay retries
  if (!txn) return ok({ ignored: 'not a dine-in order' });

  if (payment.amount !== Math.round(Number(txn.amount) * 100) || payment.currency !== 'INR') {
    console.error('[dinein-webhook] amount mismatch for order', payment.order_id);
    return ok({ ignored: 'amount mismatch' });
  }

  try {
    const result = await confirmPaidBooking(db, txn, payment);
    return ok({ result });
  } catch (err) {
    console.error('[dinein-webhook]', err instanceof Error ? err.message : err);
    return new Response('confirm failed', { status: 500 });
  }
});
