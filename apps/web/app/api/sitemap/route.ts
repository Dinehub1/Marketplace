import { CITY_LABEL } from '@hermes/core';
import { NextRequest } from "next/server";
import { categoryPath, getCategoryIndex } from "@/lib/categories";
import { brandPublishesDirectory, categoriesForBrand } from "@/lib/brand-categories";
import { getBrand, brandSlugFromHost, originForBrand } from "@/lib/brands";

// Static pages worth submitting alongside the category set.
const CORE_PATHS = ["/", "/marketplace", "/categories", "/about", "/contact", "/faq"];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Resolve the brand from the Host header first.
 *
 * The middleware rewrites /sitemap.xml here with ?brand=<slug>, but after a
 * middleware rewrite `req.nextUrl` still reflects the ORIGINAL request URL, so
 * that query parameter is not readable here. The hostname is, and it is the
 * same source of truth the rest of the app routes on, so it is used first and
 * the query parameter is kept only as a fallback for direct calls.
 */
function resolveBrand(req: NextRequest): string | null {
  const hostname = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  // Any base domain this platform answers on (dropby.co.in and cashcard.live).
  const fromHost = brandSlugFromHost(hostname);
  if (fromHost) return fromHost;
  const q = (new URL(req.url).searchParams.get("brand") ?? "").toLowerCase();
  if (/^[a-z0-9-]+$/.test(q)) return q;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return (process.env.DEFAULT_BRAND ?? "sarkarmarketplace").toLowerCase();
  }
  return null;
}

type SitemapUrl = { loc: string; priority?: string };

/**
 * All active business detail pages this brand serves.
 *
 * The detail route serves any active listing on any directory brand, but a
 * vertical brand only owns its own categories — so the same filter that scopes
 * the category pages also scopes the business pages, otherwise every directory
 * hostname would submit the full ~21k set and compete with itself.
 *
 * `allowedLower` is `null` for the full-directory brand (include everything) and
 * a Set of lowercased categories for a vertical brand.
 */
async function collectBusinessUrls(
  base: string,
  key: string,
  origin: string,
  allowedLower: Set<string> | null,
): Promise<SitemapUrl[]> {
  const out: SitemapUrl[] = [];
  // ~21k active rows paged 1000 at a time; the cap guards against a runaway
  // table. `cache: "no-store"` on purpose: the sitemap response is already
  // cached at the edge for 5 minutes, and Next's fetch cache would otherwise
  // freeze this page's business set for an hour after the first crawl.
  for (let from = 0; from < 100_000; from += 1000) {
    const res = await fetch(
      `${base}/rest/v1/businesses?select=id,category&status=eq.active&city=eq.${encodeURIComponent(CITY_LABEL)}&order=id.asc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
        cache: "no-store",
      },
    );
    if (!res.ok) break;
    const page: { id: number; category: string | null }[] = await res.json();
    for (const b of page) {
      if (allowedLower && !allowedLower.has((b.category ?? "").toLowerCase())) continue;
      out.push({ loc: `${origin}/business/${b.id}` });
    }
    if (page.length < 1000) break;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const brand = resolveBrand(req);
  if (!brand || !/^[a-z0-9-]+$/.test(brand)) {
    return new Response("bad brand", { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);

  // Only submit what this brand actually serves. Every brand used to publish
  // all ~320 category URLs regardless of whether it had a directory at all,
  // which asked Google to index the same pages 27 times over.
  const record = await getBrand(brand);
  // Every URL in this sitemap uses the brand's own domain, so crawlers are
  // pointed at the domain we want indexed rather than the one being retired.
  // (The old hardcoded origin kept submitting cashcard.live URLs from the new
  // domain, which is exactly the signal that stalls a domain migration.)
  const origin = originForBrand(brand, record?.domain);
  const publishes = brandPublishesDirectory(record);
  const all = publishes ? await getCategoryIndex() : [];
  const allowed = publishes ? categoriesForBrand(brand, all.map((c) => c.category)) : [];
  const categories = allowed ? all.filter((c) => allowed.includes(c.category)) : all;

  const corePaths = publishes ? CORE_PATHS : CORE_PATHS.filter((p) => p !== "/marketplace" && p !== "/categories");

  // Business detail pages — the biggest free-traffic lever (previously ~21k
  // pages Google could only reach by crawling 30-per-page category listings).
  let businessUrls: SitemapUrl[] = [];
  if (publishes) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const allowedLower = allowed ? new Set(allowed.map((c) => c.toLowerCase())) : null;
    businessUrls = await collectBusinessUrls(base, key, origin, allowedLower);
  }

  const urls: SitemapUrl[] = [
    ...corePaths.map((p) => ({ loc: `${origin}${p}`, priority: p === "/" ? "1.0" : "0.7" })),
    // Bigger categories first and weighted higher — with ~320 URLs the crawl
    // budget is finite, so the pages with the most listings should be found
    // first rather than being buried behind categories with three entries.
    ...categories.map((c) => ({
      loc: `${origin}${categoryPath(c.category)}`,
      priority: c.count >= 100 ? "0.9" : c.count >= 20 ? "0.8" : "0.6",
    })),
    ...businessUrls,
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => {
        // Business pages carry only a loc (21k × minimal markup); the core and
        // category pages keep their lastmod/changefreq/priority.
        const extras = u.priority
          ? `<lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u.priority}</priority>`
          : "";
        return `  <url><loc>${xmlEscape(u.loc)}</loc>${extras}</url>`;
      })
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Five minutes at the edge, not an hour. This is cheap to generate (the
      // category index behind it is itself cached for 30-60 min at the data
      // layer), and a long edge TTL meant a routing change left Cloudflare
      // advertising ~320 URLs per brand that had already started returning 404
      // — for a full hour, with no way to purge from this box.
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
