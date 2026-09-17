import { NextRequest, NextResponse } from "next/server";
import { db, sendTemplate } from "@/lib/nextel";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { asRow } from "@/lib/postgrest";
import type { PaymentRow, OrderRow, BusinessRow } from "@/lib/db-types";

/**
 * The slice of Razorpay's webhook envelope this route reads. Razorpay sends a much
 * larger body; naming the part we depend on is what keeps the rest of the route typed.
 */
type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: { order_id?: string; id?: string; amount?: number; status?: string };
    };
  };
};

// Razorpay posts raw JSON here. We must read the BODY AS-IS (not parsed) to
// verify the HMAC signature, then parse it.
export const dynamic = "force-dynamic";

const BOOST_TEMPLATE = process.env.NEXTEL_BOOST_TEMPLATE;
const FEATURE_PRICE_INR = Number(process.env.FEATURE_PRICE_INR ?? "499");

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // We only act on successful payment captures.
  if (event?.event !== "payment.captured") {
    // Acknowledge everything else (refunds, auth, etc.) so Razorpay stops retrying.
    return NextResponse.json({ ok: true, ignored: event?.event }, { status: 200 });
  }

  const orderId: string | undefined = event?.payload?.payment?.entity?.order_id;
  if (!orderId) return NextResponse.json({ ok: true, ignored: "no order_id" }, { status: 200 });

  // Idempotency: find the pending payment for this gateway order. If already
  // paid, acknowledge without re-flipping the listing (Razorpay retries).
  const payRes = await db(`payments?gateway_order_id=eq.${encodeURIComponent(orderId)}&select=id,business_id,status,amount&limit=1`);
  const pay = await asRow<PaymentRow>(payRes);

  if (!pay) {
    // Not a listing boost — check the product orders (per-job paywall). Both
    // kinds of payment arrive on this one endpoint, so the same signature and the
    // same idempotency rules cover them.
    const ordRes = await db(
      `orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,job_id,product,phone,status&limit=1`,
    );
    const ord = await asRow<OrderRow>(ordRes);
    if (!ord) return NextResponse.json({ ok: true, ignored: "unknown order" }, { status: 200 });
    if (ord.status === "paid") return NextResponse.json({ ok: true, already: true }, { status: 200 });

    const paymentId = event?.payload?.payment?.entity?.id ?? null;
    const patch = await db(`orders?id=eq.${ord.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "paid", razorpay_payment_id: paymentId }),
    });
    if (!patch.ok) return NextResponse.json({ error: "order save failed" }, { status: 500 });

    // No WhatsApp message here: sending one needs an approved template id, and
    // inventing one would be worse than not notifying.
    return NextResponse.json({ ok: true, product_order: true, job_id: ord.job_id, product: ord.product }, { status: 200 });
  }
  if (pay.status === "paid") return NextResponse.json({ ok: true, already: true }, { status: 200 });

  const businessId = Number(pay.business_id);
  if (!businessId) return NextResponse.json({ error: "payment has no business_id" }, { status: 422 });

  // Flip the listing: featured = true, priority bumped so it floats up.
  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,name,phone,featured,priority`);
  const biz = await asRow<BusinessRow>(bizRes);
  if (!biz) return NextResponse.json({ error: "business not found" }, { status: 422 });

  const priority = (Number(biz.priority) || 0) + 10;
  const patch = await db(`businesses?id=eq.${businessId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ featured: true, priority }),
  });
  if (!patch.ok) return NextResponse.json({ error: "boost save failed" }, { status: 500 });

  // Mark the payment captured.
  await db(`payments?id=eq.${pay.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "paid", method: "razorpay" }),
  });

  // Best-effort WhatsApp confirmation to the owner.
  if (BOOST_TEMPLATE && biz.phone) {
    await sendTemplate(biz.phone, BOOST_TEMPLATE, [biz.name ?? "aapka", String(FEATURE_PRICE_INR)]).catch(() => {});
  }

  return NextResponse.json({ ok: true, featured: true, priority }, { status: 200 });
}
