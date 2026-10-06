import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/paypal/webhook
 *
 * Handles asynchronous PayPal webhook notifications.
 *
 * Every event must carry a valid PayPal signature, in every environment: an unsigned body is
 * anyone's. Nothing is fulfilled here yet. capture-order is the synchronous source of truth and
 * there is no PayPal orders table to update, so verified events are logged and acknowledged
 * (a 2xx stops PayPal retrying). Fulfilment that must survive a closed browser tab belongs here
 * once orders are persisted.
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

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = String(event.event_type || "");

  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.REFUNDED":
      console.log(`[paypal-webhook] ${eventType}`, String(event.id || ""));
      return NextResponse.json({ ok: true, logged: eventType }, { status: 200 });

    default:
      return NextResponse.json({ ok: true, ignored: eventType }, { status: 200 });
  }
}
