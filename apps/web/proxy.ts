import { NextRequest, NextResponse } from "next/server";
import {
  CANONICAL_BASE,
  HERMES_DASHBOARD_HOSTS,
  brandSlugFromHost,
} from "@/lib/base-domains";

/**
 * The brand router's front door.
 *
 * Every base domain this platform answers on is declared once, in
 * `lib/base-domains.ts`. This file used to keep its own copy of the domain list,
 * the admin hosts and the Hermes hosts — which is exactly how `sarkar.<domain>`
 * and the role subdomains drift apart between the two files. It now imports them.
 *
 * `dropby.co.in` is the domain the platform is moving to; `cashcard.live` is kept
 * resolving during the migration so existing links, sitemaps already submitted to
 * Google and the SEO built on it do not go dark overnight.
 */

/** Paths that are infrastructure, not brand content, and never reach the brand router. */
const BYPASS_PREFIXES = [
  "/_next",
  "/api",
  // /unlock/<job_id> is the standalone product paywall (passport photo and
  // friends). It is not brand content, it has nothing to do with the directory
  // brands, and /pay is already taken by the brand checkout — so it bypasses the
  // brand router entirely.
  "/unlock",
  "/favicon.ico",
  // Retired prebuilt sites, kept on disk and served directly rather than routed.
  "/sites/",
];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  // Proxy Hermes Dashboard requests to port 9300.
  if (HERMES_DASHBOARD_HOSTS.includes(hostname)) {
    const targetUrl = `http://localhost:9300${pathname}${request.nextUrl.search}`;
    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : undefined,
      });
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    } catch {
      return NextResponse.json({ error: "Hermes Dashboard unavailable" }, { status: 502 });
    }
  }

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Local development: localhost has no brand subdomain, so default to
  // sarkarmarketplace (override with DEFAULT_BRAND in .env). Every other host
  // derives its brand from the subdomain — one helper, shared with the server
  // components and the Supabase client that need the same answer.
  const brandSlug =
    hostname === "localhost" || hostname === "127.0.0.1"
      ? (process.env.DEFAULT_BRAND ?? "sarkarmarketplace").toLowerCase()
      : brandSlugFromHost(hostname);

  if (!brandSlug) return NextResponse.next();

  // Legacy alias: sarkar.<base> (old standalone marketplace) -> sarkarmarketplace
  if (brandSlug === "sarkar") {
    return NextResponse.redirect(
      `https://sarkarmarketplace.${CANONICAL_BASE}${pathname}${request.nextUrl.search}`,
      308,
    );
  }

  // Crawler entry points. Every brand has its own sitemap, and robots.txt has to
  // point at it, or 320 category pages have no way for Google to discover them.
  if (pathname === "/sitemap.xml") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/sitemap";
    url.searchParams.set("brand", brandSlug);
    return NextResponse.rewrite(url);
  }
  if (pathname === "/robots.txt") {
    return new NextResponse(
      `User-agent: *\nAllow: /\n\nSitemap: https://${brandSlug}.${CANONICAL_BASE}/sitemap.xml\n`,
      { headers: { "Content-Type": "text/plain" } },
    );
  }

  // Every path on a brand host is served by the app.
  //
  // The prebuilt pages in public/sites are retired: they were landing pages with
  // dead # links and no live data, and worse, they hijacked brand-semantic routes
  // (/doctors on sarkarhealth resolved to /sites/sarkarhealth/doctors, a file that
  // does not exist, so the route answered 404 no matter what the app defined).
  // Requests under /sites/ itself still pass straight through (see BYPASS_PREFIXES).
  const url = request.nextUrl.clone();
  url.searchParams.set("__brand_path", pathname);
  url.pathname = `/brand-router/${brandSlug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
