import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/paypal/webhook
 *
 * Handles asynchronous PayPal webhook notifications.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event: Record<string, unknown>;

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isValid = await verifyPayPalWebhookSignature({
    authAlgo: req.headers.get("paypal-auth-algo"),
    certUrl: req.headers.get("paypal-cert-url"),
    transmissionId: req.headers.get("paypal-transmission-id"),
    transmissionSig: req.headers.get("paypal-transmission-sig"),
    transmissionTime: req.headers.get("paypal-transmission-time"),
    webhookEvent: event,
  });

  if (!isValid && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = String(event.event_type || "");

  // Acknowledge events
  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
    case "CHECKOUT.ORDER.APPROVED":
      // Valid capture or approval received
      return NextResponse.json({ ok: true, handled: eventType }, { status: 200 });

    default:
      return NextResponse.json({ ok: true, ignored: eventType }, { status: 200 });
  }
}
