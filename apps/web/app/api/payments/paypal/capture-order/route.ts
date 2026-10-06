import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder, getPayPalOrder, paypalConfigured, paypalSku } from "@/lib/paypal";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/paypal/capture-order
 *
 * Captures an approved PayPal order and marks payment completed.
 *
 * Before any money moves, the order is read back from PayPal and priced again from the sku in its
 * custom_id. An order whose amount or currency does not match PAYPAL_SKUS (one created elsewhere
 * with the same credentials, or one predating a price change) is refused rather than captured.
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
    const order = await getPayPalOrder(orderId);
    const item = order.customId ? paypalSku(order.customId) : null;
    if (!item || !order.amount || !sameAmount(order.amount, item)) {
      return NextResponse.json(
        { ok: false, error: "Order does not match a current price" },
        { status: 400, headers: noStore }
      );
    }
    if (order.status !== "APPROVED") {
      return NextResponse.json(
        { ok: false, error: `Order is not ready to capture (status: ${order.status})` },
        { status: 400, headers: noStore }
      );
    }

    const result = await capturePayPalOrder(orderId);

    if (result.status !== "COMPLETED" || !result.capturedAmount || !sameAmount(result.capturedAmount, item)) {
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
        sku: order.customId,
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

/** PayPal sends money as a decimal string; compare in cents so "9.9" and "9.90" agree. */
function sameAmount(got: { currency_code: string; value: string }, want: { amount: string; currency: string }) {
  return (
    got.currency_code.toUpperCase() === want.currency.toUpperCase() &&
    Math.round(Number(got.value) * 100) === Math.round(Number(want.amount) * 100)
  );
}
