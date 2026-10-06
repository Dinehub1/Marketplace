// Server-only PayPal helper for international payments.
// Reads credentials from the app environment; never import this from a client component.
import type { PayPalOrder, CapturePayPalOrderResult, SupportedCurrency } from "@hermes/core";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";
const PAYPAL_ENV = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase();
const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID ?? "";

const PAYPAL_BASE =
  PAYPAL_ENV === "live" || PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export const paypalConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);

/** In-memory cache for OAuth bearer token */
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Retrieve an OAuth 2.0 access token from PayPal using client credentials.
 * Caches token until 60 seconds before expiration.
 */
async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured");
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`PayPal auth failed: ${res.status} ${errorText.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Create a PayPal v2 Checkout Order.
 *
 * @param opts.amount Decimal amount (e.g. 9.99)
 * @param opts.currency 3-letter currency code (e.g. "USD", "EUR", "GBP")
 * @param opts.referenceId Internal receipt/job ID for reconciliation
 */
export async function createPayPalOrder(opts: {
  amount: number;
  currency?: SupportedCurrency | string;
  referenceId?: string;
  description?: string;
  customId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<PayPalOrder> {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: opts.referenceId || `order_${Date.now()}`,
        description: (opts.description || "International Order").slice(0, 127),
        custom_id: opts.customId ? opts.customId.slice(0, 127) : undefined,
        amount: {
          currency_code: (opts.currency || "USD").toUpperCase(),
          value: Number(opts.amount).toFixed(2),
        },
      },
    ],
  };

  if (opts.returnUrl && opts.cancelUrl) {
    body.application_context = {
      return_url: opts.returnUrl,
      cancel_url: opts.cancelUrl,
      user_action: "PAY_NOW",
    };
  }

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal create order failed: ${res.status} ${detail.slice(0, 300)}`);
  }

  return (await res.json()) as PayPalOrder;
}

/**
 * Capture payment for an approved PayPal order.
 * This is the final step that moves funds into your PayPal account.
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<CapturePayPalOrderResult> {
  if (!paypalOrderId) {
    throw new Error("paypalOrderId is required");
  }

  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal capture failed: ${res.status} ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    id: string;
    status: string;
    payer?: {
      email_address?: string;
      payer_id?: string;
      name?: { given_name?: string; surname?: string };
    };
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          amount?: { currency_code: string; value: string };
        }>;
      };
    }>;
  };

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    id: capture?.id || data.id,
    orderId: data.id,
    status: (capture?.status || data.status) as "COMPLETED" | "FAILED" | "PENDING",
    payer: data.payer,
    capturedAmount: capture?.amount,
  };
}

/**
 * Verify a PayPal webhook event signature against PayPal's verification service.
 */
export async function verifyPayPalWebhookSignature(params: {
  authAlgo: string | null;
  certUrl: string | null;
  transmissionId: string | null;
  transmissionSig: string | null;
  transmissionTime: string | null;
  webhookEvent: Record<string, unknown>;
}): Promise<boolean> {
  if (!WEBHOOK_ID || !params.transmissionSig || !params.transmissionId) {
    return false;
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth_algo: params.authAlgo,
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id: WEBHOOK_ID,
        webhook_event: params.webhookEvent,
      }),
    });

    if (!res.ok) return false;
    const body = (await res.json()) as { verification_status?: string };
    return body.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal-webhook] Verification error:", err);
    return false;
  }
}
