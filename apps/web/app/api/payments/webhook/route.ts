import { NextRequest, NextResponse } from "next/server";
import { db, sendTemplate } from "@/lib/nextel";
import { verifyWebhookSignature } from "@/lib/razorpay";

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

  let event: any;
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
  const pay = ((await payRes.json()) as any[])[0];
  if (!pay) return NextResponse.json({ ok: true, ignored: "unknown order" }, { status: 200 });
  if (pay.status === "paid") return NextResponse.json({ ok: true, already: true }, { status: 200 });

  const businessId = Number(pay.business_id);
  if (!businessId) return NextResponse.json({ error: "payment has no business_id" }, { status: 422 });

  // Flip the listing: featured = true, priority bumped so it floats up.
  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,name,phone,featured,priority`);
  const biz = ((await bizRes.json()) as any[])[0];
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
