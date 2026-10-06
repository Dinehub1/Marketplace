// deno test --allow-env supabase/functions/_shared/
import { assert, assertFalse } from 'jsr:@std/assert@1';

// The module reads its secrets at import time, so set them first and import dynamically.
Deno.env.set('RAZORPAY_KEY_ID', 'rzp_test_key');
Deno.env.set('RAZORPAY_KEY_SECRET', 'test_secret');
Deno.env.set('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');
const { verifyCheckoutSignature, verifyWebhookSignature } = await import('./razorpay.ts');

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.test('checkout signature: order_id|payment_id signed with the key secret', async () => {
  const good = await hmac('test_secret', 'order_1|pay_1');
  assert(await verifyCheckoutSignature('order_1', 'pay_1', good));
  // The same signature must not vouch for another payment or order.
  assertFalse(await verifyCheckoutSignature('order_1', 'pay_2', good));
  assertFalse(await verifyCheckoutSignature('order_2', 'pay_1', good));
  // Nor does one made with a different secret, or none at all.
  assertFalse(await verifyCheckoutSignature('order_1', 'pay_1', await hmac('other', 'order_1|pay_1')));
  assertFalse(await verifyCheckoutSignature('order_1', 'pay_1', ''));
});

Deno.test('webhook signature covers the exact raw body', async () => {
  const body = '{"event":"payment.captured"}';
  const good = await hmac('webhook_secret', body);
  assert(await verifyWebhookSignature(body, good));
  assertFalse(await verifyWebhookSignature(body + ' ', good));
  assertFalse(await verifyWebhookSignature(body, null));
});
