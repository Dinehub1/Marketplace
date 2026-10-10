import { db, phoneToken, sendTemplate, toIndiaPhone } from "@/lib/nextel";
import { asRow, asRows } from "@/lib/postgrest";
import type { OtpCodeRow } from "@/lib/db-types";

export type AuthChannel = "whatsapp" | "sms" | "email";

export interface SendOtpRequest {
  identifier?: string;
  phone?: string;
  email?: string;
  channel?: AuthChannel;
}

export interface VerifyOtpRequest {
  identifier?: string;
  phone?: string;
  email?: string;
  code?: string;
  channel?: AuthChannel;
}

export interface SendOtpResult {
  ok: boolean;
  channel: AuthChannel;
  message: string;
  devCode?: string;
  deliveryError?: string;
}

export interface VerifyOtpResult {
  ok: boolean;
  identifier: string;
  channel: AuthChannel;
  token: string;
  supabaseSession?: unknown;
  firebaseUser?: unknown;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function detectChannel(input: string): AuthChannel {
  if (EMAIL_REGEX.test(input.trim())) return "email";
  return "whatsapp";
}

/**
 * Send an OTP through the requested delivery channel:
 * - 'whatsapp': Nextel WhatsApp API (auth template)
 * - 'sms': Firebase Phone SMS Verification API
 * - 'email': Supabase Auth built-in OTP
 */
export async function sendUnifiedOtp(
  req: SendOtpRequest,
  options?: { allowDevCode?: boolean }
): Promise<{ status: number; data: Record<string, unknown> }> {
  const rawTarget = (req.identifier ?? req.phone ?? req.email ?? "").trim();
  const channel: AuthChannel = req.channel ?? detectChannel(rawTarget);

  if (channel === "email") {
    if (!EMAIL_REGEX.test(rawTarget)) {
      return { status: 400, data: { error: "Valid email address required" } };
    }
    const cleanEmail = rawTarget.toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { status: 500, data: { error: "Supabase email authentication not configured" } };
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ email: cleanEmail, create_user: true }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.msg || errData.message || errData.error_description || "Could not send email OTP";
        return { status: res.status || 400, data: { error: msg } };
      }

      return {
        status: 200,
        data: {
          ok: true,
          channel: "email",
          identifier: cleanEmail,
          message: "OTP code sent to your email",
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting email provider";
      return { status: 502, data: { error: msg } };
    }
  }

  // Phone-based channels: WhatsApp or SMS
  const phone = toIndiaPhone(rawTarget);
  if (!phone) {
    return { status: 400, data: { error: "Valid 10-digit Indian mobile number required" } };
  }

  // Rate limit: max 3 requests per phone per 10 minutes
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await db(`otp_codes?phone=eq.${phone}&created_at=gte.${since}&select=id`);
  if ((await asRows<OtpCodeRow>(recent)).length >= 3) {
    return { status: 429, data: { error: "Too many codes requested. Try again in 10 minutes." } };
  }

  if (channel === "sms") {
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      return { status: 500, data: { error: "Firebase SMS configuration missing" } };
    }

    try {
      const e164Phone = `+${phone}`;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${firebaseApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: e164Phone }),
        }
      );

      const fbData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || typeof fbData.sessionInfo !== "string") {
        const errMsg =
          (fbData.error as Record<string, unknown> | undefined)?.message ||
          "Firebase could not deliver SMS OTP";
        return { status: res.status || 502, data: { error: String(errMsg) } };
      }

      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await db("otp_codes", {
        method: "POST",
        body: JSON.stringify({
          phone,
          code: fbData.sessionInfo,
          purpose: "firebase_sms",
          expires_at: expires,
        }),
        headers: { Prefer: "return=representation" },
      });

      return {
        status: 200,
        data: {
          ok: true,
          channel: "sms",
          identifier: phone,
          message: "OTP sent via SMS",
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reach SMS provider";
      return { status: 502, data: { error: msg } };
    }
  }

  // WhatsApp channel (default)
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const ins = await db("otp_codes", {
    method: "POST",
    body: JSON.stringify({ phone, code, purpose: "whatsapp", expires_at: expires }),
    headers: { Prefer: "return=representation" },
  });
  const insRow = ins.ok ? await asRow<OtpCodeRow>(ins) : null;
  if (!insRow) {
    return { status: 500, data: { error: "Could not create code" } };
  }

  const sent = await sendTemplate(phone, "auth", [code, code]);
  const allowDevCode =
    (options?.allowDevCode ?? false) ||
    (process.env.ALLOW_DEV_CODE === "true" && process.env.NODE_ENV !== "production");

  if (insRow.id != null) {
    db(`otp_codes?id=eq.${insRow.id}`, {
      method: "PATCH",
      body: JSON.stringify({ delivered: sent.ok, nextel_detail: sent.detail }),
      headers: { Prefer: "return=minimal" },
    }).catch(() => {});
  }

  const devCodePayload = allowDevCode ? { devCode: code } : {};
  const extra = allowDevCode && !sent.ok ? { nextelDetail: sent.detail } : {};

  return {
    status: 200,
    data: {
      ok: true,
      channel: "whatsapp",
      identifier: phone,
      delivered: sent.ok,
      message: sent.ok ? "OTP sent via WhatsApp" : "Failed to deliver WhatsApp message",
      ...devCodePayload,
      ...extra,
      ...(sent.ok ? {} : { deliveryError: "WhatsApp delivery failed — see logs" }),
    },
  };
}

/**
 * Verify an OTP across WhatsApp, SMS, or Email
 */
export async function verifyUnifiedOtp(
  req: VerifyOtpRequest
): Promise<{ status: number; data: Record<string, unknown> }> {
  const rawTarget = (req.identifier ?? req.phone ?? req.email ?? "").trim();
  const code = String(req.code ?? "").trim();
  const channel: AuthChannel = req.channel ?? detectChannel(rawTarget);

  if (!code) {
    return { status: 400, data: { error: "Verification code required" } };
  }

  if (channel === "email") {
    if (!EMAIL_REGEX.test(rawTarget)) {
      return { status: 400, data: { error: "Valid email address required" } };
    }
    const cleanEmail = rawTarget.toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { status: 500, data: { error: "Supabase email configuration missing" } };
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ type: "email", email: cleanEmail, token: code }),
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg = data.msg || data.message || data.error_description || "Invalid or expired OTP code";
        return { status: 400, data: { error: String(msg) } };
      }

      return {
        status: 200,
        data: {
          ok: true,
          channel: "email",
          identifier: cleanEmail,
          token: phoneToken(cleanEmail),
          supabaseSession: data,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error verifying email OTP";
      return { status: 502, data: { error: msg } };
    }
  }

  // Phone-based channels
  const phone = toIndiaPhone(rawTarget);
  if (!phone) {
    return { status: 400, data: { error: "Phone and code required" } };
  }

  const now = new Date().toISOString();

  if (channel === "sms") {
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      return { status: 500, data: { error: "Firebase SMS configuration missing" } };
    }

    const res = await db(
      `otp_codes?phone=eq.${phone}&purpose=eq.firebase_sms&expires_at=gte.${now}&verified_at=is.null&attempts=lt.5&order=created_at.desc&limit=1&select=id,code,attempts`
    );
    const rows = await asRows<OtpCodeRow>(res);
    const row = rows[0];
    if (!row) {
      return { status: 400, data: { error: "Code expired or not requested — request a new one" } };
    }

    try {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${firebaseApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionInfo: row.code, code }),
        }
      );

      const fbData = (await fbRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (!fbRes.ok) {
        await db(`otp_codes?id=eq.${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ attempts: (row.attempts ?? 0) + 1 }),
          headers: { Prefer: "return=minimal" },
        });
        return { status: 400, data: { error: "Incorrect or expired SMS code" } };
      }

      await db(`otp_codes?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ verified_at: now }),
        headers: { Prefer: "return=minimal" },
      });

      return {
        status: 200,
        data: {
          ok: true,
          channel: "sms",
          identifier: phone,
          phone,
          token: phoneToken(phone),
          firebaseUser: fbData,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error verifying SMS code";
      return { status: 502, data: { error: msg } };
    }
  }

  // WhatsApp verification
  if (!/^\d{6}$/.test(code)) {
    return { status: 400, data: { error: "6-digit code required" } };
  }

  const res = await db(
    `otp_codes?phone=eq.${phone}&expires_at=gte.${now}&verified_at=is.null&attempts=lt.5&order=created_at.desc&limit=1&select=id,code,attempts`
  );
  const rows = await asRows<OtpCodeRow>(res);
  const row = rows[0];
  if (!row) {
    return { status: 400, data: { error: "Code expired — request a new one" } };
  }

  if (row.code !== code) {
    await db(`otp_codes?id=eq.${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ attempts: (row.attempts ?? 0) + 1 }),
      headers: { Prefer: "return=minimal" },
    });
    return { status: 400, data: { error: "Incorrect code" } };
  }

  await db(`otp_codes?id=eq.${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({ verified_at: now }),
    headers: { Prefer: "return=minimal" },
  });

  return {
    status: 200,
    data: {
      ok: true,
      channel: "whatsapp",
      identifier: phone,
      phone,
      token: phoneToken(phone),
    },
  };
}
