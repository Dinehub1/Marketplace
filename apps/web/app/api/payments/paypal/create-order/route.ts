import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder, paypalConfigured, paypalSku } from "@/lib/paypal";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/paypal/create-order
 *
 * Universal PayPal order creator for international customers across all monorepo projects
 * (web, dining, doctor-appointment, etc.)
 *
 * Body: {
 *   sku: string,              // a key of PAYPAL_SKUS in lib/paypal.ts, e.g. "dining:event-pass"
 *   receipt?: string
 * }
 *
 * The price, currency and description come from PAYPAL_SKUS, never from the body: this route is
 * public, and an amount the caller sends is an amount the buyer picks.
 */
export async function POST(req: NextRequest) {
  if (!paypalConfigured) {
    return NextResponse.json(
      { error: "PayPal payment gateway is not configured on this server." },
      { status: 503, headers: noStore }
    );
  }

  const rl = rateLimit(`create_paypal_order:${clientIp(req)}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many order requests. Please try again in a few moments." },
      { status: 429, headers: noStore }
    );
  }

  const body = await req.json().catch(() => ({}));
  const sku = String(body.sku || "").trim();
  const item = paypalSku(sku);

  if (!item) {
    return NextResponse.json(
      { error: "Unknown sku: nothing is sold under that code" },
      { status: 400, headers: noStore }
    );
  }

  const project = sku.split(":")[0] || "web";
  const receipt = String(body.receipt || `pp_${project}_${Date.now()}`).slice(0, 127);

  try {
    const order = await createPayPalOrder({
      amount: Number(item.amount),
      currency: item.currency,
      referenceId: receipt,
      description: item.description,
      // capture-order prices the order again from this, so it must be the sku and only the sku.
      customId: sku,
    });

    return NextResponse.json(
      {
        ok: true,
        order_id: order.id,
        status: order.status,
        sku,
        currency: item.currency,
        amount: item.amount,
        links: order.links,
      },
      { status: 200, headers: noStore }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create PayPal order";
    console.error("[paypal-create-order] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: noStore }
    );
  }
}
