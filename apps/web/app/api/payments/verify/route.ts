import { NextRequest, NextResponse } from "next/server";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/verify
 *
 * Universal signature verification endpoint for all monorepo apps
 * (web, dining, gatted, quick-driver, etc.)
 *
 * Body: {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string
 * }
 */
export async function POST(req: NextRequest) {
  if (!razorpayConfigured) {
    return NextResponse.json(
      { error: "Razorpay payment gateway is not configured on this server." },
      { status: 503, headers: noStore }
    );
  }

  const rl = rateLimit(`verify_payment:${clientIp(req)}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait a moment." },
      { status: 429, headers: noStore }
    );
  }

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.razorpay_order_id || "").trim();
  const paymentId = String(body.razorpay_payment_id || "").trim();
  const signature = String(body.razorpay_signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" },
      { status: 400, headers: noStore }
    );
  }

  const isValid = verifyPaymentSignature(orderId, paymentId, signature);

  if (!isValid) {
    return NextResponse.json(
      { ok: false, error: "Invalid payment signature" },
      { status: 400, headers: noStore }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      verified: true,
      order_id: orderId,
      payment_id: paymentId,
    },
    { status: 200, headers: noStore }
  );
}
