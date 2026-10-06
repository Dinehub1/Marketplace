// dinein-send-sms — Supabase Auth "Send SMS" hook that delivers sign-in codes over WhatsApp.
//
// Supabase Auth generates, stores, rate-limits and expires the OTP; this function only delivers
// it, through the Nextel WhatsApp "auth" template the app used to call directly (with the Nextel
// key bundled in the app). The key now lives here only.
//
// Setup (Dinehub):
//   1. Deploy with JWT verification off: hooks run before any session exists. The Standard
//      Webhooks signature checked below is the authentication.
//   2. Dashboard → Authentication → Hooks → Send SMS hook → HTTPS →
//        https://<project-ref>.supabase.co/functions/v1/dinein-send-sms
//      and generate a secret.
//   3. supabase secrets set SEND_SMS_HOOK_SECRETS='v1,whsec_...' NEXTEL_API_KEY=...
//   4. Enable the Phone provider (Authentication → Sign In / Providers → Phone).
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { nextelNumber } from '../_shared/phone.ts';

const NEXTEL_ENDPOINT = (Deno.env.get('NEXTEL_ENDPOINT') ?? 'https://api.nextel.io/API_V2/Whatsapp/send_template')
  .replace(/\/+$/, '');
const NEXTEL_API_KEY = Deno.env.get('NEXTEL_API_KEY') ?? '';
const HOOK_SECRET = (Deno.env.get('SEND_SMS_HOOK_SECRETS') ?? '').replace('v1,whsec_', '');

/** Auth hook error shape: Supabase shows `message` to the client and fails the sign-in request. */
const fail = (http_code: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code, message } }), {
    status: http_code,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'POST only');
  if (!HOOK_SECRET || !NEXTEL_API_KEY) return fail(500, 'Sign-in messages are not configured');

  const payload = await req.text();
  let event: { user: { phone?: string }; sms: { otp: string } };
  try {
    event = new Webhook(HOOK_SECRET).verify(payload, Object.fromEntries(req.headers)) as typeof event;
  } catch {
    return fail(401, 'Invalid hook signature');
  }

  const to = nextelNumber(event.user?.phone ?? '');
  if (!to) return fail(400, 'Please use a valid Indian mobile number');
  if (!/^\d{4,8}$/.test(event.sms?.otp ?? '')) return fail(500, 'Invalid code');

  try {
    const res = await fetch(`${NEXTEL_ENDPOINT}/${NEXTEL_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'buttonTemplate',
        templateId: 'auth',
        templateLanguage: 'en',
        sender_phone: to,
        templateArgs: [event.sms.otp],
      }),
    });
    const body = await res.json().catch(() => ({}));
    const accepted = res.ok && (body.status === '200' || body.status === '202' || Boolean(body.messageId));
    if (!accepted) {
      console.error('[dinein-send-sms] Nextel refused:', res.status, JSON.stringify(body).slice(0, 300));
      return fail(502, 'Could not send the code on WhatsApp. Please try again.');
    }
  } catch (err) {
    console.error('[dinein-send-sms] Nextel unreachable:', err instanceof Error ? err.message : err);
    return fail(502, 'Could not send the code on WhatsApp. Please try again.');
  }

  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
