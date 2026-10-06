import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { SupportedCurrency } from "@hermes/core";

const noStore = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/paypal/create-order
 *
 * Universal PayPal order creator for international customers across all monorepo projects
 * (web, dining, doctor-appointment, etc.)
 *
 * Body: {
 *   amount: number,           // e.g. 9.99
 *   currency?: string,        // "USD", "EUR", "GBP" (default "USD")
 *   receipt?: string,
 *   project?: string,
 *   description?: string,
 *   notes?: Record<string, string>
 * }
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
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid amount: amount must be greater than 0" },
      { status: 400, headers: noStore }
    );
  }

  const project = String(body.project || "web").toLowerCase().trim();
  const receipt = String(body.receipt || `pp_${project}_${Date.now()}`);
  const currency = (String(body.currency || "USD").toUpperCase()) as SupportedCurrency;
  const description = String(body.description || `Payment for ${project}`);

  try {
    const order = await createPayPalOrder({
      amount,
      currency,
      referenceId: receipt,
      description,
      customId: JSON.stringify({ project, ...(body.notes || {}) }),
    });

    return NextResponse.json(
      {
        ok: true,
        order_id: order.id,
        status: order.status,
        currency,
        amount,
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
