import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/nextel";
import { verifySsv } from "@/lib/ad-ssv";
import { asRow } from "@/lib/postgrest";

/**
 * GET /api/ad-ssv — AdMob's server-to-server callback, the new witness.
 *
 * This is the endpoint that removes the phone from the trust chain. AdMob calls it
 * after a rewarded ad is watched; the callback carries a signature over its own
 * query string, and nothing here is believed until that signature verifies against
 * Google's published key.
 *
 * ## What this route may and may not do
 *
 * - It **verifies** a callback and flips the matching claim from `pending` to
 *   `verified`. That is all. It does not release a file itself, so a forged call
 *   cannot open anything even if the verification had a hole — the release happens
 *   in `/ad-unlock`, which asks for a verified claim.
 * - It is **public by necessity** (AdMob's servers must reach it), so the signature
 *   is the entire access control. There is no rate limit that would not also drop
 *   real callbacks; unverified traffic can only write `rejected` rows, never grants.
 * - A callback that fails to verify still writes its reason. A forgery attempt is
 *   evidence worth keeping, and "how many callbacks failed today" should be a query.
 *
 * ## Why the raw query string, not parsed params
 *
 * The signature covers the query bytes exactly as sent, up to `&signature=`. Parsing
 * and re-serialising first would verify a string nobody signed. `req.nextUrl.search`
 * gives the raw remainder, which is why this route reads it directly.
 *
 * ## Response
 *
 * Always 200 once the callback has been processed, including for a forged one: the
 * retry would have the same signature and the same outcome, and a 500 would only
 * make AdMob retry a request that can never succeed. The `result` field is for our
 * own logs and for an operator testing the wiring by hand.
 */
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

type ClaimRow = {
  id: number;
  status: string;
  job_id: number;
  nonce: string;
};

export async function GET(req: NextRequest) {
  // Raw query, exactly as received — the bytes the signature covers.
  const rawQuery = req.nextUrl.search.startsWith("?") ? req.nextUrl.search.slice(1) : req.nextUrl.search;

  const verified = await verifySsv(rawQuery);

  if (!verified.ok) {
    // Record the refusal against the claim the callback names, if it names one we
    // know. `user_id` is attacker-controlled, so a miss is expected and harmless.
    const params = new URLSearchParams(rawQuery);
    const nonce = params.get("user_id");
    if (nonce) {
      const claim = await findClaim(nonce);
      if (claim && claim.status !== "verified") {
        await db(`ad_reward_claims?id=eq.${claim.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "rejected",
            reject_reason: verified.reason,
            signature_ok: false,
          }),
        }).catch(() => {});
      }
    }
    return NextResponse.json({ result: "rejected", reason: verified.reason }, { status: 200, headers: noStore });
  }

  const nonce = verified.userId;
  if (!nonce) {
    // A signed callback with no user_id cannot be tied to a claim. Valid signature,
    // nothing to unlock — most likely an ad unit whose SSV options we did not set.
    return NextResponse.json({ result: "no_nonce" }, { status: 200, headers: noStore });
  }

  const claim = await findClaim(nonce);
  if (!claim) {
    // AdMob retries, and a claim may not have been written yet on a very fast
    // callback. Not an error worth failing on; the unlock route will simply keep
    // waiting, and a retry lands here again.
    return NextResponse.json({ result: "unknown_nonce" }, { status: 200, headers: noStore });
  }

  if (claim.status === "verified") {
    // Replay of a genuine callback. The transaction already released its file; a
    // second grant is impossible because `product_unlocks` is unique per job.
    return NextResponse.json({ result: "already_verified" }, { status: 200, headers: noStore });
  }

  const patch = await db(`ad_reward_claims?id=eq.${claim.id}&status=eq.pending`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "verified",
      transaction_id: verified.transactionId,
      ad_unit_id: verified.adUnitId,
      ad_network: verified.adNetwork,
      reward_item: verified.rewardItem,
      reward_amount: verified.rewardAmount,
      ssv_timestamp: new Date(verified.timestampMs).toISOString(),
      verified_at: new Date().toISOString(),
      signature_ok: true,
      reject_reason: null,
    }),
  });

  if (!patch.ok) {
    return NextResponse.json({ result: "store_failed" }, { status: 200, headers: noStore });
  }

  return NextResponse.json({ result: "verified" }, { status: 200, headers: noStore });
}

async function findClaim(nonce: string): Promise<ClaimRow | null> {
  const res = await db(
    `ad_reward_claims?nonce=eq.${encodeURIComponent(nonce)}&select=id,status,job_id,nonce&limit=1`,
  );
  return asRow<ClaimRow>(res);
}
