import { NextRequest, NextResponse } from "next/server";
import { missingAdmobEnv, syncAdSourceDaily } from "@/lib/admob-report";
import { errorMessage } from "@/lib/errors";

/**
 * POST|GET /api/admin/ad-source-sync?days=7 — pull AdMob's mediation report into
 * `ad_source_daily`, so per-network revenue (AdMob vs AppLovin vs InMobi) is queryable.
 *
 * Run it once a day. It re-pulls a rolling window because AdMob revises estimated
 * earnings for a few days, and it upserts, so running it twice is harmless.
 *
 *   curl -X POST -H "x-admin-token: $ADMIN_TOKEN" https://<host>/api/admin/ad-source-sync
 *
 * GET is accepted for schedulers that can only issue a GET (a Vercel cron sends
 * `Authorization: Bearer $CRON_SECRET`, which is honoured alongside the admin token).
 */

const noStore = { "Cache-Control": "no-store" };

/** Default window; enough to cover AdMob's revisions of recent days. */
const DEFAULT_DAYS = 7;
/** Upper bound for a manual backfill. */
const MAX_DAYS = 90;

// Same gate as the other admin routes, plus the cron bearer. With ADMIN_TOKEN unset,
// only non-production is open, so a local run works without a secret.
function adminOk(req: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  if (cron && req.headers.get("authorization") === `Bearer ${cron}`) return true;
  const token = process.env.ADMIN_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return req.headers.get("x-admin-token") === token;
}

async function run(req: NextRequest) {
  if (!adminOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const missing = missingAdmobEnv();
  if (missing.length) {
    // Not a failure of this route: the AdMob account or its API credentials do not
    // exist yet. Say exactly which, so the fix is obvious.
    return NextResponse.json(
      { error: "AdMob API credentials are not configured", missing },
      { status: 503, headers: noStore },
    );
  }

  const asked = Number(req.nextUrl.searchParams.get("days") ?? DEFAULT_DAYS);
  const days = Number.isInteger(asked) && asked >= 1 ? Math.min(asked, MAX_DAYS) : DEFAULT_DAYS;

  try {
    const result = await syncAdSourceDaily(days);
    return NextResponse.json({ ok: true, ...result }, { headers: noStore });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502, headers: noStore });
  }
}

export const POST = run;
export const GET = run;
