import { NextRequest, NextResponse } from "next/server";

/**
 * Base domains the brand router answers on.
 *
 * dropby.co.in is the domain this platform is moving to; cashcard.live is kept
 * resolving during the migration so existing links, sitemaps already submitted
 * to Google and the SEO built on it do not go dark overnight. The app derives
 * the brand from whichever of these the request arrived on, so no other code
 * change is needed when the old domain is finally retired.
 */
const BRAND_BASE_DOMAINS = ["dropby.co.in", "cashcard.live"];
const CANONICAL_BASE = BRAND_BASE_DOMAINS[0];

const ADMIN_HOSTS = [
  `dashboard.${CANONICAL_BASE}`, `admin.${CANONICAL_BASE}`,
  "dashboard.cashcard.live", "admin.cashcard.live",
];

// Hosts that should be proxied to the Hermes Dashboard (port 9300)
const HERMES_DASHBOARD_HOSTS = [`hermes.${CANONICAL_BASE}`, "hermes.cashcard.live"];

// All dynamic app routes that should be handled by the brand router.
// Everything else on a brand subdomain falls through to the static site.
const APP_PATHS = [
  "/login", "/register", "/signup", "/forgot-password", "/reset-password",
  "/dashboard", "/profile", "/settings",
  "/notifications", "/orders", "/bookings",
  "/business-dashboard", "/vendor-bookings",
  "/about", "/services", "/products", "/pricing", "/features",
  "/marketplace", "/listings", "/business", "/categories",
  "/blog", "/news", "/careers", "/jobs",
  "/contact", "/faq", "/faqs", "/testimonials", "/reviews",
  "/gallery", "/portfolio",
  "/galaxy",
  "/book", "/booking", "/schedule",
  "/quote", "/request-quote",
  "/checkout", "/pay",
  "/support", "/help", "/chat", "/ai-assistant",
  "/privacy", "/privacy-policy", "/terms", "/terms-conditions",
];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  // Proxy Hermes Dashboard requests to port 9300
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

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/sites/")
  ) {
    return NextResponse.next();
  }

  let brandSlug: string | null = null;

  // Local development: localhost has no brand subdomain, so default to
  // sarkarmarketplace (override with DEFAULT_BRAND in .env).
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    brandSlug = (process.env.DEFAULT_BRAND ?? "sarkarmarketplace").toLowerCase();
  }

  // Derive the brand from the subdomain, on any of the base domains this
  // platform answers on. Earlier this hardcoded `root === "cashcard" && tld ===
  // "live"`, which silently matched nothing on any other domain - so every
  // request to the new domain fell through to the dashboard instead of the
  // directory.
  for (const base of BRAND_BASE_DOMAINS) {
    if (hostname === base || hostname.endsWith(`.${base}`)) {
      const sub = hostname.slice(0, hostname.length - base.length).replace(/\.$/, "");
      if (sub && sub !== "www" && sub !== "dashboard" && !ADMIN_HOSTS.includes(hostname)) {
        brandSlug = sub.toLowerCase();
      }
      break;
    }
  }

  if (!brandSlug) return NextResponse.next();

  // Legacy alias: sarkar.<base> (old standalone marketplace) -> sarkarmarketplace
  if (brandSlug === "sarkar") {
    return NextResponse.redirect(`https://sarkarmarketplace.${CANONICAL_BASE}${pathname}${request.nextUrl.search}`, 308);
  }

  // Crawler entry points. Every brand has a static folder, so without these two
  // the requests would be rewritten to /sites/<brand>/sitemap.xml and 404 —
  // leaving 320 category pages with no way for Google to discover them.
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
  // The prebuilt pages in public/sites are retired. They were landing pages with
  // dead # links and no live data, and worse, they hijacked brand-semantic routes:
  // /doctors on sarkarhealth was rewritten to /sites/sarkarhealth/doctors, a file
  // that does not exist, so the route answered 404 no matter what the app defined.
  // Requests under /sites/ itself still pass straight through (guarded above).
  const url = request.nextUrl.clone();
  url.searchParams.set("__brand_path", pathname);
  url.pathname = `/brand-router/${brandSlug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
