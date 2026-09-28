import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/nextel";
import { publicUrlFor } from "@/lib/r2";
import { asRow } from "@/lib/postgrest";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { IAP_PRODUCT_FOR, fetchSubscriber, matchPurchase } from "@/lib/revenuecat";
import type { ProductJobRow } from "@/lib/db-types";

/**
 * POST /api/job/<id>/iap-unlock — release ONE clean file for ONE verified store purchase.
 *
 * Body: { app_user_id, transaction_id, product_id }.
 *
 * Why this exists: inside the iOS/Android apps a digital file must be sold through the
 * store's own billing (Apple 3.1.1, Play Payments policy). The browser paywall
 * (`/unlock/<job>`, Razorpay) stays for the website; the apps buy through RevenueCat and
 * land here.
 *
 * ## The rules
 *
 * - **RevenueCat is the witness, not the phone.** The route looks the transaction up with
 *   the secret key, under the product this job needs. A transaction the customer does not
 *   hold, or one for another product, releases nothing.
 * - **One purchase, one file.** `product_unlocks.store_transaction_id` is unique, keyed on
 *   RevenueCat's own id (never the client's string), so a purchase that already opened one
 *   job cannot open a second. A retry for the *same* job answers with the file again.
 * - **One file, one unlock row.** `product_unlocks` is unique on `job_id`. A job that is
 *   already open (ad, earlier purchase) answers with the file and leaves this purchase
 *   unspent, so the app can apply it to the next photo instead of charging again.
 * - The clean URL is derived here from `product_jobs.output_key`; it is never stored.
 */
const noStore = { "Cache-Control": "no-store" };

type UnlockRow = { id: number; job_id: number; source: string; store_transaction_id: string | null };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400, headers: noStore });
  }

  const rl = rateLimit(`iapunlock:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: noStore });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const appUserId = String(body.app_user_id ?? "").trim().slice(0, 200);
  const transactionId = String(body.transaction_id ?? "").trim().slice(0, 200);
  const productId = String(body.product_id ?? "").trim();
  if (!appUserId || !transactionId || !productId) {
    return NextResponse.json({ error: "app_user_id, transaction_id and product_id are required" }, { status: 400, headers: noStore });
  }

  const job = await asRow<ProductJobRow>(await db(`product_jobs?id=eq.${jobId}&select=id,product,status,output_key`));
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404, headers: noStore });
  if (job.status !== "done" || !job.output_key) {
    return NextResponse.json({ error: "This file is not ready", status: job.status }, { status: 409, headers: noStore });
  }

  const expectedProduct = IAP_PRODUCT_FOR[job.product];
  if (!expectedProduct) {
    return NextResponse.json({ error: "This product is not sold in the app" }, { status: 400, headers: noStore });
  }
  if (productId !== expectedProduct) {
    return NextResponse.json({ error: "That purchase is for a different product" }, { status: 400, headers: noStore });
  }

  const cleanUrl = publicUrlFor(job.output_key);

  // Ask the store's witness before anything else, so every decision below is keyed on
  // RevenueCat's id for the transaction rather than whatever string the phone sent.
  const sub = await fetchSubscriber(appUserId);
  if (!sub.ok) {
    return NextResponse.json({ error: "Could not confirm the purchase right now", detail: sub.error }, { status: 503, headers: noStore });
  }
  const match = matchPurchase(sub.subscriber, expectedProduct, transactionId);
  if (!match.ok) {
    // 402 rather than 403: the app may retry once RevenueCat has the receipt.
    return NextResponse.json({ ok: false, state: match.reason, error: "The store has no record of that purchase." }, { status: 402, headers: noStore });
  }
  const purchase = match.purchase;

  // Has this purchase already been spent?
  const spent = await asRow<UnlockRow>(
    await db(`product_unlocks?store_transaction_id=eq.${encodeURIComponent(purchase.id)}&select=id,job_id,source,store_transaction_id&limit=1`),
  );
  if (spent) {
    if (Number(spent.job_id) === jobId) {
      return NextResponse.json({ ok: true, already: true, job_id: jobId, source: spent.source, output_url: cleanUrl }, { headers: noStore });
    }
    return NextResponse.json(
      { ok: false, state: "spent", error: "That purchase already unlocked another photo." },
      { status: 409, headers: noStore },
    );
  }

  // Is this job already open some other way? Then keep the purchase unspent.
  const existing = await asRow<UnlockRow>(await db(`product_unlocks?job_id=eq.${jobId}&select=id,job_id,source,store_transaction_id&limit=1`));
  if (existing) {
    return NextResponse.json(
      { ok: true, already: true, unspent: true, job_id: jobId, source: existing.source, output_url: cleanUrl },
      { headers: noStore },
    );
  }

  const ins = await db("product_unlocks", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      job_id: jobId,
      product: job.product,
      source: purchase.store,
      store_transaction_id: purchase.id,
      iap_product_id: purchase.productId,
      is_sandbox: purchase.isSandbox,
    }),
  });

  if (!ins.ok) {
    const detail = await ins.text().catch(() => "");
    // Lost a race: either this job was opened meanwhile, or this purchase was spent on it.
    if (detail.includes("duplicate key") || detail.includes("product_unlocks_one_per_job") || detail.includes("product_unlocks_store_txn")) {
      const now = await asRow<UnlockRow>(await db(`product_unlocks?job_id=eq.${jobId}&select=id,job_id,source,store_transaction_id&limit=1`));
      if (now) {
        return NextResponse.json(
          { ok: true, already: true, unspent: now.store_transaction_id !== purchase.id, job_id: jobId, source: now.source, output_url: cleanUrl },
          { headers: noStore },
        );
      }
      return NextResponse.json({ ok: false, state: "spent", error: "That purchase already unlocked another photo." }, { status: 409, headers: noStore });
    }
    return NextResponse.json({ error: "Could not record the unlock", detail: detail.slice(0, 300) }, { status: 502, headers: noStore });
  }

  return NextResponse.json(
    { ok: true, already: false, job_id: jobId, source: purchase.store, sandbox: purchase.isSandbox, output_url: cleanUrl },
    { status: 201, headers: noStore },
  );
}
