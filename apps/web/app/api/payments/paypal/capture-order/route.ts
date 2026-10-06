import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder, paypalConfigured } from "@/lib/paypal";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/paypal/capture-order
 *
 * Captures an approved PayPal order and marks payment completed.
 *
 * Body: {
 *   order_id: string
 * }
 */
export async function POST(req: NextRequest) {
  if (!paypalConfigured) {
    return NextResponse.json(
      { error: "PayPal payment gateway is not configured on this server." },
      { status: 503, headers: noStore }
    );
  }

  const rl = rateLimit(`capture_paypal_order:${clientIp(req)}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many capture attempts. Please wait a moment." },
      { status: 429, headers: noStore }
    );
  }

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order_id || "").trim();

  if (!orderId) {
    return NextResponse.json(
      { error: "order_id is required" },
      { status: 400, headers: noStore }
    );
  }

  try {
    const result = await capturePayPalOrder(orderId);

    if (result.status !== "COMPLETED") {
      return NextResponse.json(
        { ok: false, error: `Payment not completed (status: ${result.status})` },
        { status: 400, headers: noStore }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        verified: true,
        capture_id: result.id,
        order_id: result.orderId,
        status: result.status,
        payer: result.payer,
        amount: result.capturedAmount,
      },
      { status: 200, headers: noStore }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to capture PayPal order";
    console.error("[paypal-capture-order] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: noStore }
    );
  }
}
