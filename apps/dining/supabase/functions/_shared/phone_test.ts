// deno test supabase/functions/_shared/
import { assertEquals } from 'jsr:@std/assert@1';
import { nextelNumber } from './phone.ts';

Deno.test('Auth phone formats become the 12-digit number Nextel expects', () => {
  assertEquals(nextelNumber('+919876543210'), '919876543210');
  assertEquals(nextelNumber('919876543210'), '919876543210');
  assertEquals(nextelNumber('9876543210'), '919876543210');
  assertEquals(nextelNumber('+91-98765 43210'), '919876543210');
});

Deno.test('non-Indian or malformed numbers are refused rather than guessed', () => {
  assertEquals(nextelNumber('+14155550123'), null);
  assertEquals(nextelNumber('12345'), null);
  assertEquals(nextelNumber('+910123456789'), null); // Indian mobiles start 6-9
  assertEquals(nextelNumber(''), null);
});
