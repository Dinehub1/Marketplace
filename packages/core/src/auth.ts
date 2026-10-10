/**
 * @brandcollabs/core Auth — Universal authentication client for WhatsApp, SMS, and Email.
 *
 * Supported delivery rails:
 * - 'whatsapp': Nextel WhatsApp API
 * - 'sms': Firebase SMS Auth
 * - 'email': Supabase Email Auth
 */

export type AuthChannel = "whatsapp" | "sms" | "email";

export interface SendOtpParams {
  /** Phone number (10 or 12 digits) or Email address */
  identifier: string;
  /** Delivery channel: "whatsapp" | "sms" | "email". Auto-detected if omitted. */
  channel?: AuthChannel;
  /** Optional custom base URL for the backend API */
  baseUrl?: string;
}

export interface VerifyOtpParams {
  /** Phone number or Email address */
  identifier: string;
  /** 6-digit OTP code received */
  code: string;
  /** Delivery channel: "whatsapp" | "sms" | "email" */
  channel?: AuthChannel;
  /** Optional custom base URL */
  baseUrl?: string;
}

export interface SendOtpResult {
  ok: boolean;
  channel: AuthChannel;
  identifier: string;
  message: string;
  delivered?: boolean;
  devCode?: string;
  deliveryError?: string;
}

export interface VerifyOtpResult {
  ok: boolean;
  identifier: string;
  channel: AuthChannel;
  token: string;
  phone?: string;
  supabaseSession?: unknown;
  firebaseUser?: unknown;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Automatically determine whether the identifier is an email address or phone number.
 */
export function detectAuthChannel(identifier: string): AuthChannel {
  if (EMAIL_REGEX.test(identifier.trim())) return "email";
  return "whatsapp";
}

/**
 * Resolve API base URL based on runtime environment (browser relative URL, Expo env, or production).
 */
export function resolveApiBaseUrl(customBaseUrl?: string): string {
  if (customBaseUrl) return customBaseUrl.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const envUrl =
    (typeof process !== "undefined" &&
      (process.env?.EXPO_PUBLIC_WEB_BASE_URL ||
        process.env?.NEXT_PUBLIC_WEB_BASE_URL ||
        process.env?.WEB_BASE_URL)) ||
    "https://sheharbazaar.dropby.co.in";
  return envUrl.replace(/\/+$/, "");
}

/**
 * Send an OTP via WhatsApp, SMS, or Email.
 */
export async function sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
  const identifier = params.identifier.trim();
  if (!identifier) throw new Error("Identifier (phone or email) is required");
  const channel = params.channel || detectAuthChannel(identifier);
  const baseUrl = resolveApiBaseUrl(params.baseUrl);

  const res = await fetch(`${baseUrl}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, channel }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !data.ok) {
    throw new Error(
      (typeof data.error === "string" && data.error) ||
        `Failed to send verification code via ${channel}`
    );
  }

  return data as unknown as SendOtpResult;
}

/**
 * Verify an OTP code and obtain an authenticated session token.
 */
export async function verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
  const identifier = params.identifier.trim();
  const code = params.code.trim();
  if (!identifier) throw new Error("Identifier is required");
  if (!code) throw new Error("Verification code is required");
  const channel = params.channel || detectAuthChannel(identifier);
  const baseUrl = resolveApiBaseUrl(params.baseUrl);

  const res = await fetch(`${baseUrl}/api/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, code, channel }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !data.ok) {
    throw new Error(
      (typeof data.error === "string" && data.error) ||
        "Invalid or expired verification code"
    );
  }

  return data as unknown as VerifyOtpResult;
}
