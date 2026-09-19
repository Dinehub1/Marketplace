import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/nextel";
import { publicUrlFor } from "@/lib/r2";
import { asRow } from "@/lib/postgrest";
import type { ProductJobRow } from "@/lib/db-types";

/**
 * GET|POST /api/job/<id>/ad-unlock — release ONE clean file, only for an SSV-verified
 * claim.
 *
 * ## The rule, after P3
 *
 * A file is released when, and only when, a **verified** claim exists for this job.
 * "Verified" means AdMob's own server called `/api/ad-ssv` with a signature that
 * checked out against Google's published key. The phone's opinion is not part of the
 * test any more.
 *
 * ## Why this replaced the P1 route
 *
 * P1 accepted the app's word and granted. That was one HTTP request away from a free
 * file for anyone who knew the route. The difference is worth stating plainly:
 *
 * ```
 *   P1   POST /ad-unlock  { "I watched it" }        → 201 + clean URL
 *   P3   POST /ad-unlock  { claim: <nonce> }        → 202 "waiting"  … until
 *        GET  /ad-ssv    (signed by AdMob)          → claim verified … then
 *        POST /ad-unlock  { claim: <nonce> }        → 200 + clean URL
 * ```
 *
 * ## What is still true from P1
 *
 * - **One file per job, ever** — `product_unlocks` is unique on `job_id`, so a
 *   second verified claim on the same job cannot hand over a second file.
 * - A paid job is refused, so the free path cannot shadow a paid one.
 * - The clean URL is derived server-side; the client never holds it before this
 *   returns, so there is nothing to spoof locally.
 *
 * ## A pending claim is a 202, not a failure
 *
 * The callback usually lands within a second or two of the ad closing, but it is a
 * separate server-to-server request and can lag. The app polls; a 202 says "keep
 * waiting", which is a different thing from "refused" and must not be rendered as an
 * error.
 */
const noStore = { "Cache-Control": "no-store" };

type ClaimRow = {
  id: number;
  nonce: string;
  status: string;
  job_id: number;
  transaction_id: string | null;
  verified_at: string | null;
  reject_reason: string | null;
};

type UnlockRow = { id: number; source: string; created_at: string };

/** Read the claim named by the request, or the newest claim for this job. */
async function findClaim(req: NextRequest, jobId: number): Promise<ClaimRow | null> {
  const url = new URL(req.url);
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const nonce = String((body as Record<string, unknown>)?.claim ?? url.searchParams.get("claim") ?? "").trim();

  const query = nonce
    ? `ad_reward_claims?nonce=eq.${encodeURIComponent(nonce)}&select=id,nonce,status,job_id,transaction_id,verified_at,reject_reason&limit=1`
    : `ad_reward_claims?job_id=eq.${jobId}&select=id,nonce,status,job_id,transaction_id,verified_at,reject_reason&order=created_at.desc&limit=1`;

  return asRow<ClaimRow>(await db(query));
}

async function handle(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400, headers: noStore });
  }

  const jobRes = await db(`product_jobs?id=eq.${jobId}&select=id,product,status,output_key`);
  const job = await asRow<ProductJobRow>(jobRes);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404, headers: noStore });
  if (job.status !== "done" || !job.output_key) {
    return NextResponse.json({ error: "This file is not ready", status: job.status }, { status: 409, headers: noStore });
  }

  const cleanUrl = publicUrlFor(job.output_key);

  // Already released? Answer with the file. This covers a retry, a reloaded screen,
  // and a claim that was verified between two polls.
  const existingRes = await db(`product_unlocks?job_id=eq.${jobId}&select=id,source,created_at&limit=1`);
  const existing = await asRow<UnlockRow>(existingRes);
  if (existing) {
    return NextResponse.json(
      { ok: true, already: true, job_id: jobId, source: existing.source, output_url: cleanUrl },
      { headers: noStore },
    );
  }

  const claim = await findClaim(req, jobId);
  if (!claim) {
    return NextResponse.json(
      { ok: false, state: "no_claim", error: "No unlock claim for this file." },
      { status: 409, headers: noStore },
    );
  }

  if (claim.status === "rejected") {
    return NextResponse.json(
      { ok: false, state: "rejected", reason: claim.reject_reason, error: "The ad platform did not confirm that reward." },
      { status: 403, headers: noStore },
    );
  }

  if (claim.status !== "verified") {
    // Waiting on AdMob's callback. Not an error — the app should poll.
    return NextResponse.json(
      { ok: false, state: "pending", claim: claim.nonce },
      { status: 202, headers: noStore },
    );
  }

  // Verified. Release the file, recording which claim did it.
  const ins = await db("product_unlocks", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      job_id: jobId,
      product: job.product,
      source: "rewarded_ad_ssv",
      placement: claim.nonce,
      claim_id: claim.id,
    }),
  });

  if (!ins.ok) {
    const detail = await ins.text().catch(() => "");
    // The unique constraint means another request won the race — the file is open.
    if (detail.includes("product_unlocks_one_per_job") || detail.includes("duplicate key")) {
      return NextResponse.json(
        { ok: true, already: true, job_id: jobId, source: "rewarded_ad_ssv", output_url: cleanUrl },
        { headers: noStore },
      );
    }
    return NextResponse.json(
      { error: "Could not record the unlock", detail: detail.slice(0, 300) },
      { status: 502, headers: noStore },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      already: false,
      job_id: jobId,
      source: "rewarded_ad_ssv",
      transaction_id: claim.transaction_id,
      output_url: cleanUrl,
    },
    { status: 201, headers: noStore },
  );
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, ctx);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, ctx);
}
