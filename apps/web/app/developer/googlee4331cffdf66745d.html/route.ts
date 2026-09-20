import { GOOGLE_VERIFICATION_TOKEN } from "../catalog";

/**
 * GET /googlee4331cffdf66745d.html — the Google Search Console ownership proof.
 *
 * Play Console refuses to verify the organisation website (`https://apps.dropby.co.in`)
 * until Search Console records us as its owner, and Search Console's HTML-file method
 * fetches this exact path at the **root** of that host. The root path is not where this
 * file lives: `proxy.ts` rewrites every request on the developer host to
 * `/developer<path>`, which is what maps `/googlee4331cffdf66745d.html` onto this route.
 *
 * It is a route and not a file in `public/` for that reason — `public/` is resolved after
 * the proxy has already rewritten the path, so a file put there answers 404 at the URL
 * Google actually requests, a failure that presents as "we couldn't find your file".
 *
 * The body is byte-for-byte what Search Console handed over: one line, no trailing
 * newline. The token itself lives in `catalog.ts` so the filename above and the body
 * below cannot drift apart; `check:developer` asserts they agree.
 *
 * Reference: https://support.google.com/webmasters/answer/9008080
 */
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(`google-site-verification: ${GOOGLE_VERIFICATION_TOKEN}.html`, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Search Console re-checks ownership, and re-verification issues a new token; a
      // long cache would keep an old proof alive after the file it names has changed.
      "Cache-Control": "public, max-age=300",
    },
  });
}
