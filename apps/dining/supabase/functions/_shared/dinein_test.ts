// deno test --allow-env supabase/functions/_shared/
import { assertEquals } from 'jsr:@std/assert@1';
import { bookingEndTime, coverChargeOf, type Offer } from './dinein.ts';

const offer = (discount_type: string | null, conditions: Offer['conditions']): Offer => ({
  id: 'o',
  restaurant_id: 'r',
  discount_type,
  conditions,
  is_active: true,
});

Deno.test('cover charge is read from the offer type the app displays', () => {
  assertEquals(coverChargeOf(offer('percentage', { percentage: { cover_charge: 200 } })), 200);
  assertEquals(coverChargeOf(offer('flat', { flat: { cover_charge: '150' } })), 150);
  // Another type's charge is not this offer's charge.
  assertEquals(coverChargeOf(offer('bogo', { percentage: { cover_charge: 200 } })), 0);
});

Deno.test('a missing, negative or junk cover charge is free, never a negative price', () => {
  assertEquals(coverChargeOf(null), 0);
  assertEquals(coverChargeOf(offer(null, null)), 0);
  assertEquals(coverChargeOf(offer('flat', { flat: {} })), 0);
  assertEquals(coverChargeOf(offer('flat', { flat: { cover_charge: -50 } })), 0);
  assertEquals(coverChargeOf(offer('flat', { flat: { cover_charge: 'abc' } })), 0);
});

Deno.test('booking end time is six hours later and wraps past midnight', () => {
  assertEquals(bookingEndTime('12:30'), '18:30:00');
  assertEquals(bookingEndTime('19:45:00'), '01:45:00');
  assertEquals(bookingEndTime('00:00'), '06:00:00');
});
