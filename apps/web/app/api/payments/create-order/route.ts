import { NextRequest, NextResponse } from "next/server";
import { createOrder, razorpayConfigured } from "@/lib/razorpay";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/create-order
 *
 * Universal Razorpay order creator for all monorepo projects
 * (web, dining, gatted, quick-driver, cycle-tracker, doctor-appointment, etc.)
 *
 * Body: {
 *   amountInr: number,
 *   receipt?: string,
 *   project?: string,
 *   currency?: string,
 *   notes?: Record<string, string>
 * }
 */
export async function POST(req: NextRequest) {
  if (!razorpayConfigured) {
    return NextResponse.json(
      { error: "Razorpay payment gateway is not configured on this server." },
      { status: 503, headers: noStore }
    );
  }

  const rl = rateLimit(`create_order:${clientIp(req)}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many order requests. Please try again in a few moments." },
      { status: 429, headers: noStore }
    );
  }

  const body = await req.json().catch(() => ({}));
  const amountInr = Number(body.amountInr);

  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    return NextResponse.json(
      { error: "Invalid amount: amountInr must be greater than 0" },
      { status: 400, headers: noStore }
    );
  }

  const project = String(body.project || "web").toLowerCase().trim();
  const receipt = String(body.receipt || `rcpt_${project}_${Date.now()}`);
  const currency = String(body.currency || "INR").toUpperCase();

  const notes: Record<string, string> = {
    project,
    platform: "marketplace_monorepo",
    created_at: new Date().toISOString(),
    ...(body.notes || {}),
  };

  try {
    const order = await createOrder({
      amountInr,
      currency,
      receipt,
      notes,
    });

    return NextResponse.json(
      {
        ok: true,
        key_id: process.env.RAZORPAY_KEY_ID,
        order,
      },
      { status: 200, headers: noStore }
    );
  } catch (err: any) {
    console.error("[create-order] Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to create Razorpay order" },
      { status: 500, headers: noStore }
    );
  }
}
