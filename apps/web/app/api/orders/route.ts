import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createOrder } from "@/lib/razorpay";
import { paymentsConfigured, productPrice } from "@/lib/product-orders";

/**
 * POST /api/orders — buy the clean file for one job.
 *
 * Body: { job_id, phone, token }.
 *
 * This is the step that needs a verified phone (WhatsApp OTP): identity is the
 * phone number everywhere on this platform, and the money trail has to name
 * somebody. It also CLAIMS an unclaimed job — the first phone to pay for a job
 * owns it, which is what makes GET /api/job/<id> safe to answer.
 *
 * The order row is created as 'pending'. Nothing is released here: the clean file
 * opens only once Razorpay confirms the capture (the webhook) or the checkout
 * signature verifies (POST /api/orders/verify).
 */
const noStore = { "Cache-Control": "no-store" };

/** A pending gateway order stays usable for this long before a new one is made. */
const PENDING_REUSE_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const jobId = Number(body.job_id);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400, headers: noStore });
  }

  const rl = rateLimit(`order:${phone}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const jobRes = await db(`product_jobs?id=eq.${jobId}&select=id,product,phone,status,output_key`);
  const job = ((await jobRes.json()) as any[])[0];
  // A job that is not finished has nothing to sell; a job of another number is
  // indistinguishable from a missing one on purpose (ids are sequential).
  if (!job || job.status !== "done" || !job.output_key) {
    return NextResponse.json({ error: "Job not found or not ready" }, { status: 404, headers: noStore });
  }

  if (!job.phone) {
    // Atomic claim: the filter `phone=is.null` means the row is only taken if it
    // is still unclaimed, so two phones cannot both pay for one sheet.
    const claim = await db(`product_jobs?id=eq.${jobId}&phone=is.null`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ phone }),
    });
    const claimed = claim.ok ? ((await claim.json()) as any[]) : [];
    if (claimed.length === 0) {
      const again = await db(`product_jobs?id=eq.${jobId}&select=phone`);
      const row = ((await again.json()) as any[])[0];
      if (!row || row.phone !== phone) {
        return NextResponse.json({ error: "This photo belongs to another number" }, { status: 403, headers: noStore });
      }
    }
  } else if (job.phone !== phone) {
    return NextResponse.json({ error: "This photo belongs to another number" }, { status: 403, headers: noStore });
  }

  const pricePaise = await productPrice(job.product);

  // Already paid: hand back the state instead of taking money twice.
  const paidRes = await db(`orders?job_id=eq.${jobId}&phone=eq.${encodeURIComponent(phone)}&status=eq.paid&select=id&limit=1`);
  if (paidRes.ok && ((await paidRes.json()) as any[]).length > 0) {
    return NextResponse.json(
      { ok: true, already: true, paid: true, job_id: jobId, product: job.product, price_paise: pricePaise },
      { headers: noStore },
    );
  }

  if (!paymentsConfigured) {
    // Deliberately explicit: the paywall path is built and reachable, it just
    // cannot charge anyone until the gateway keys exist.
    return NextResponse.json(
      { error: "Payments are not switched on yet. Please try again later.", configured: false },
      { status: 503, headers: noStore },
    );
  }

  // Reuse a recent pending order rather than spamming a row per tap.
  const pendingRes = await db(
    `orders?job_id=eq.${jobId}&phone=eq.${encodeURIComponent(phone)}&status=eq.pending` +
      `&select=id,razorpay_order_id,amount_paise,created_at&order=created_at.desc&limit=1`,
  );
  const pending = ((await pendingRes.json()) as any[])[0];
  if (pending?.razorpay_order_id && Date.now() - new Date(pending.created_at).getTime() < PENDING_REUSE_MS) {
    return NextResponse.json(
      {
        ok: true,
        reused: true,
        job_id: jobId,
        product: job.product,
        order_id: pending.razorpay_order_id,
        amount_paise: Number(pending.amount_paise),
        currency: "INR",
        key_id: process.env.RAZORPAY_KEY_ID ?? "",
        price_paise: pricePaise,
      },
      { headers: noStore },
    );
  }

  // Create the real gateway order at the price the `products` row states.
  let gateway;
  try {
    gateway = await createOrder({
      amountInr: pricePaise / 100,
      currency: "INR",
      receipt: `job_${jobId}_${Date.now()}`,
      notes: { job_id: String(jobId), product: String(job.product), phone },
    });
  } catch {
    return NextResponse.json({ error: "Payment gateway unavailable. Try again." }, { status: 502, headers: noStore });
  }

  const ins = await db("orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      product: job.product,
      phone,
      amount_paise: pricePaise,
      razorpay_order_id: gateway.id,
      status: "pending",
      credits_granted: 1,
      job_id: jobId,
    }]),
  });
  if (!ins.ok) {
    return NextResponse.json({ error: "Could not record the order" }, { status: 500, headers: noStore });
  }

  return NextResponse.json(
    {
      ok: true,
      job_id: jobId,
      product: job.product,
      order_id: gateway.id,
      amount_paise: gateway.amount,
      currency: gateway.currency,
      key_id: process.env.RAZORPAY_KEY_ID ?? "",
      price_paise: pricePaise,
    },
    { headers: noStore },
  );
}

/**
 * GET /api/orders?job_id=<id> — order state for this job and phone.
 * Used by the app to poll after the checkout browser closes.
 */
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

  const res = await db(
    `orders?job_id=eq.${jobId}&phone=eq.${encodeURIComponent(phone)}` +
      `&select=id,product,amount_paise,razorpay_order_id,razorpay_payment_id,status,created_at&order=created_at.desc`,
  );
  return NextResponse.json({ ok: true, job_id: jobId, orders: await res.json() }, { headers: noStore });
}
