import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { paidOrderFor } from "@/lib/product-orders";
import { asRow } from "@/lib/postgrest";
import type { ProductJobRow } from "@/lib/db-types";

/**
 * POST /api/job/<id>/ad-claim — open a reward claim and get the nonce the ad request
 * will carry.
 *
 * ## Why a claim exists before the ad is shown
 *
 * AdMob's SSV callback identifies the reward by the `user_id` + `custom_data` our own
 * app attached to the ad request. So the handshake has to start here: the app asks
 * for a nonce, requests the ad carrying it, and AdMob's signed callback returns it.
 * That is what binds one signature to one job without the client ever being believed:
 * the client can invent a nonce, but it cannot invent AdMob's signature over one.
 *
 * ## This route grants nothing
 *
 * It writes a `pending` row. That is deliberate and is the whole P3 change: the
 * P1 route released the file when the app said "I watched it", and the app is not a
 * witness. Now the file is released only by `/ad-unlock` finding a claim that
 * AdMob's own server has signed for.
 *
 * The limits stay: one claim per job is not required (a claim may be retried), but a
 * per-address daily cap bounds how many nonces may be minted, and a job that was paid
 * for is refused so the free path can never shadow a paid one.
 */
const noStore = { "Cache-Control": "no-store" };

const DAILY_CLAIM_LIMIT = 20;

type ClaimRow = { id: number; nonce: string; status: string; job_id: number };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400, headers: noStore });
  }

  const body = await req.json().catch(() => ({}));
  const placement = String(body.placement ?? "").trim().slice(0, 96) || "job.unlock-rewarded";

  const ip = clientIp(req);
  const rl = rateLimit(`adclaim:${ip}`, DAILY_CLAIM_LIMIT, 24 * 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Daily limit reached", detail: `This address has opened ${DAILY_CLAIM_LIMIT} unlock claims today.` },
      { status: 429, headers: noStore },
    );
  }

  const jobRes = await db(`product_jobs?id=eq.${jobId}&select=id,product,phone,status,output_key`);
  const job = await asRow<ProductJobRow>(jobRes);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404, headers: noStore });
  if (job.status !== "done" || !job.output_key) {
    return NextResponse.json({ error: "This file is not ready", status: job.status }, { status: 409, headers: noStore });
  }

  if (job.phone && (await paidOrderFor(jobId, job.phone))) {
    return NextResponse.json(
      { error: "Already paid", detail: "This file was paid for; fetch it with the phone that paid." },
      { status: 409, headers: noStore },
    );
  }

  // The nonce is our own random id, not derived from the job: `user_id` travels
  // through AdMob and back, and a guessable value there would let one job's
  // signature be pointed at another.
  const nonce = `c_${crypto.randomBytes(16).toString("hex")}`;

  const ins = await db("ad_reward_claims", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      nonce,
      job_id: jobId,
      product: job.product,
      placement,
      app_target: String(body.app_target ?? "unknown").slice(0, 64),
      session_id: String(body.session_id ?? "").trim().slice(0, 64) || null,
      status: "pending",
    }),
  });

  if (!ins.ok) {
    const detail = await ins.text().catch(() => "");
    return NextResponse.json(
      { error: "Could not open the claim", detail: detail.slice(0, 300) },
      { status: 502, headers: noStore },
    );
  }

  // `custom_data` is limited to 256 characters by AdMob, and carries only what the
  // callback needs to be matched by a human reading logs. The nonce travels in
  // `user_id`, which is the documented place for it.
  const claim = (await ins.json().catch(() => [])) as ClaimRow[];
  return NextResponse.json(
    {
      ok: true,
      claim_id: claim[0]?.id ?? null,
      nonce,
      // Echoed so the client attaches exactly these to the ad request.
      ssv: { userId: nonce, customData: `job=${jobId}` },
    },
    { status: 201, headers: noStore },
  );
}
