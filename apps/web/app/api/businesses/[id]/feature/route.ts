import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createOrder } from "@/lib/razorpay";

const noStore = { "Cache-Control": "no-store" };

/**
 * Feature/boost a listing for placement monetization. Same ownership proof as
 * claim/route.ts: the OTP-verified phone must match the business's stored phone
 * (last-10-digit comparison). On success we create a REAL Razorpay order and a
 * pending `payments` row; the listing is only featured once Razorpay's webhook
 * confirms the capture (see app/api/payments/webhook/route.ts).
 */
// Single source of truth for the boost price shown across the app.
const FEATURE_PRICE_INR = Number(process.env.FEATURE_PRICE_INR ?? "499");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const rl = rateLimit(`feature:${clientIp(req)}:${phone}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down and try again." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,name,phone,brand_id,featured,priority`);
  const biz = ((await bizRes.json()) as any[])[0];
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore });

  const bizPhone = toIndiaPhone(biz.phone ?? "");
  if (!bizPhone || bizPhone.slice(-10) !== phone.slice(-10)) {
    return NextResponse.json(
      { error: "Is number se boost nahi ho sakta — listing par jo phone hai wahi verify karein." },
      { status: 403, headers: noStore },
    );
  }

  // Already boosted (idempotent): don't create a second order. Return the
  // current state so the client can short-circuit to "already featured".
  if (biz.featured) {
    return NextResponse.json({ ok: true, already: true, featured: true, priority: Number(biz.priority) || 0, price_inr: FEATURE_PRICE_INR }, { headers: noStore });
  }

  // 1. Create a real Razorpay order (amount in paise inside createOrder).
  let order;
  try {
    order = await createOrder({
      amountInr: FEATURE_PRICE_INR,
      currency: "INR",
      receipt: `boost_${businessId}_${Date.now()}`,
      notes: { business_id: String(businessId), brand_id: String(biz.brand_id ?? "") },
    });
  } catch {
    return NextResponse.json({ error: "Payment gateway unavailable. Try again." }, { status: 502, headers: noStore });
  }

  // 2. Persist a pending payment row attributed to this listing.
  const ins = await db("payments", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: businessId,
      brand_id: biz.brand_id ?? null,
      amount: FEATURE_PRICE_INR,
      currency: "INR",
      method: "razorpay",
      status: "pending",
      payer_contact: phone,
      gateway_order_id: order.id,
      meta: { razorpay_order_id: order.id, business_name: biz.name },
    }),
  });
  if (!ins.ok) {
    return NextResponse.json({ error: "Boost save nahi ho saka" }, { status: 500, headers: noStore });
  }

  // 3. Hand the client what it needs to open Razorpay Checkout.
  return NextResponse.json(
    {
      ok: true,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID ?? "",
      price_inr: FEATURE_PRICE_INR,
    },
    { headers: noStore },
  );
}
