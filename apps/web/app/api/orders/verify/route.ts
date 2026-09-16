import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publicUrlFor } from "@/lib/r2";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { paidOrderFor, paymentsConfigured } from "@/lib/product-orders";

/**
 * POST /api/orders/verify — confirm a Checkout payment and release the clean file.
 *
 * Body: { job_id, phone, token, razorpay_order_id, razorpay_payment_id, razorpay_signature }.
 *
 * Razorpay signs `${order_id}|${payment_id}` with the key secret. Only a caller
 * that has been through Checkout can produce that signature, so this route is not
 * a "mark it paid" endpoint — it is a proof-of-payment endpoint. The webhook does
 * the same flip independently for cases where the browser never comes back.
 */
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const rl = rateLimit(`orderverify:${clientIp(req)}:${phone}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429, headers: noStore });
  }

  if (!paymentsConfigured) {
    return NextResponse.json({ error: "Payments are not switched on yet.", configured: false }, { status: 503, headers: noStore });
  }

  const orderId = String(body.razorpay_order_id ?? "").trim();
  const paymentId = String(body.razorpay_payment_id ?? "").trim();
  const signature = body.razorpay_signature ? String(body.razorpay_signature) : null;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "razorpay_order_id and razorpay_payment_id are required" }, { status: 400, headers: noStore });
  }

  // The order must belong to this phone: a signature proves *a* payment, not that
  // this caller made it.
  const res = await db(
    `orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&phone=eq.${encodeURIComponent(phone)}` +
      `&select=id,job_id,product,status,amount_paise&limit=1`,
  );
  const order = ((await res.json()) as any[])[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404, headers: noStore });
  }

  const jobId = Number(order.job_id);
  const jobRes = jobId ? await db(`product_jobs?id=eq.${jobId}&select=output_key,status`) : null;
  const job = jobRes ? ((await jobRes.json()) as any[])[0] : null;
  const outputUrl = job?.output_key ? publicUrlFor(job.output_key) : null;

  if (order.status === "paid") {
    return NextResponse.json({ ok: true, already: true, paid: true, job_id: jobId, output_url: outputUrl }, { headers: noStore });
  }

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment signature mismatch" }, { status: 400, headers: noStore });
  }

  const patch = await db(`orders?id=eq.${order.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "paid", razorpay_payment_id: paymentId }),
  });
  if (!patch.ok) {
    return NextResponse.json({ error: "Could not record the payment" }, { status: 500, headers: noStore });
  }

  return NextResponse.json({ ok: true, paid: true, job_id: jobId, output_url: outputUrl }, { headers: noStore });
}

/** GET — has this job been paid for? Same answer as GET /api/job/<id>, cheaper. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? url.searchParams.get("phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? url.searchParams.get("token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }
  const jobId = Number(url.searchParams.get("job_id"));
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400, headers: noStore });
  }
  const order = await paidOrderFor(jobId, phone);
  return NextResponse.json({ ok: true, job_id: jobId, paid: Boolean(order), paid_at: order?.created_at ?? null }, { headers: noStore });
}
