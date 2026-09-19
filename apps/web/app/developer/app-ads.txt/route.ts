import { appAdsTxtLines, PUBLISHER } from "../catalog";

/**
 * GET /app-ads.txt — the file AdMob crawls at the developer domain's root.
 *
 * Required, not optional: since January 2025 Google requires new AdMob apps to be
 * verified against an `app-ads.txt`, and an app that is not verified does not fully
 * serve ads. The file has to be plain text at the **root** of the developer website
 * named in the store listing — which is why `apps.dropby.co.in/app-ads.txt` is served
 * here and why the same host is the organisation website in Play Console.
 *
 * Before the AdMob account exists this answers with a comment-only file. That is the
 * honest state: a placeholder publisher id would be a claim about who is authorised to
 * sell this inventory, and a wrong claim is worse than an absent one. Once
 * `ADMOB_PUBLISHER_ID` is set in the environment, the real seller line appears with no
 * code change.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const lines = appAdsTxtLines();
  const body = [
    ...lines,
    ...(lines.length === 0
      ? [
          "# No seller line yet: the AdMob account has not been created for this",
          "# developer domain. Set ADMOB_PUBLISHER_ID to publish the real entry.",
          "#",
          "# Reference: https://support.google.com/admob/answer/9363762",
        ]
      : []),
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      // AdMob re-crawls; a cached copy would delay a corrected seller list.
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      // The publisher id is public by design, but the file is only meaningful when the
      // request arrived at the canonical host.
      "X-Developer-Site": PUBLISHER.site,
    },
  });
}
