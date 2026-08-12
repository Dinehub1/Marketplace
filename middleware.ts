import { NextRequest, NextResponse } from "next/server";
import { SITE_FOLDERS } from "./lib/site-folders";
import { isCategoryPath } from "./lib/categories";

const ADMIN_HOSTS = ["dashboard.cashcard.live", "admin.cashcard.live"];

// Hosts that should be proxied to the Hermes Dashboard (port 9300)
const HERMES_DASHBOARD_HOSTS = ["hermes.cashcard.live"];

// All dynamic app routes that should be handled by the brand router.
// Everything else on a brand subdomain falls through to the static site.
const APP_PATHS = [
  "/login", "/register", "/signup", "/forgot-password", "/reset-password",
  "/dashboard", "/profile", "/settings",
  "/notifications", "/orders", "/bookings",
  "/business-dashboard",
  "/about", "/services", "/products", "/pricing", "/features",
  "/marketplace", "/listings", "/business", "/categories",
  "/blog", "/news", "/careers", "/jobs",
  "/contact", "/faq", "/faqs", "/testimonials", "/reviews",
  "/gallery", "/portfolio",
  "/book", "/booking", "/schedule",
  "/quote", "/request-quote",
  "/checkout", "/pay",
  "/support", "/help", "/chat", "/ai-assistant",
  "/privacy", "/privacy-policy", "/terms", "/terms-conditions",
];

export async function middleware(request: NextRequest) {
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

  const parts = hostname.split(".");
  let brandSlug: string | null = null;

  // Local development: localhost has no brand subdomain, so default to
  // sarkarmarketplace (override with DEFAULT_BRAND in .env).
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    brandSlug = (process.env.DEFAULT_BRAND ?? "sarkarmarketplace").toLowerCase();
  }

  if (parts.length >= 3) {
    const root = parts[parts.length - 2];
    const tld = parts[parts.length - 1];
    const subdomain = parts[0];
    if (root === "cashcard" && tld === "live") {
      if (subdomain !== "www" && subdomain !== "dashboard" && subdomain.length > 0 && !ADMIN_HOSTS.includes(hostname)) {
        brandSlug = subdomain.toLowerCase();
      }
    }
  }

  if (!brandSlug) return NextResponse.next();

  // Legacy alias: sarkar.cashcard.live (old standalone marketplace) -> sarkarmarketplace
  if (brandSlug === "sarkar") {
    return NextResponse.redirect(`https://sarkarmarketplace.cashcard.live${pathname}${request.nextUrl.search}`, 308);
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
      `User-agent: *\nAllow: /\n\nSitemap: https://${brandSlug}.cashcard.live/sitemap.xml\n`,
      { headers: { "Content-Type": "text/plain" } },
    );
  }

  // /<category>-in-indore is dynamic, so it cannot live in the APP_PATHS list.
  const isAppPath =
    isCategoryPath(pathname) ||
    APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAppPath || !SITE_FOLDERS.has(brandSlug)) {
    const url = request.nextUrl.clone();
    url.searchParams.set("__brand_path", pathname);
    url.pathname = `/brand-router/${brandSlug}`;
    return NextResponse.rewrite(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/sites/${brandSlug}/index.html` : `/sites/${brandSlug}${pathname}`;
  url.searchParams.delete("__brand_path");
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
