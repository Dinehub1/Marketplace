import { NextRequest } from "next/server";
import { categoryPath, getCategoryIndex } from "@/lib/categories";
import { brandPublishesDirectory, categoriesForBrand } from "@/lib/brand-categories";
import { getBrand } from "@/lib/brands";

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
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[parts.length - 2] === "cashcard" && parts[parts.length - 1] === "live") {
    const sub = parts[0];
    if (sub && sub !== "www" && sub !== "dashboard") return sub;
  }
  const q = (new URL(req.url).searchParams.get("brand") ?? "").toLowerCase();
  if (/^[a-z0-9-]+$/.test(q)) return q;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return (process.env.DEFAULT_BRAND ?? "sarkarmarketplace").toLowerCase();
  }
  return null;
}

export async function GET(req: NextRequest) {
  const brand = resolveBrand(req);
  if (!brand || !/^[a-z0-9-]+$/.test(brand)) {
    return new Response("bad brand", { status: 400 });
  }
  const origin = `https://${brand}.cashcard.live`;
  const today = new Date().toISOString().slice(0, 10);

  // Only submit what this brand actually serves. Every brand used to publish
  // all ~320 category URLs regardless of whether it had a directory at all,
  // which asked Google to index the same pages 27 times over.
  const record = await getBrand(brand);
  const publishes = brandPublishesDirectory(record);
  const all = publishes ? await getCategoryIndex() : [];
  const allowed = publishes ? categoriesForBrand(brand, all.map((c) => c.category)) : [];
  const categories = allowed ? all.filter((c) => allowed.includes(c.category)) : all;

  const corePaths = publishes ? CORE_PATHS : CORE_PATHS.filter((p) => p !== "/marketplace" && p !== "/categories");

  const urls = [
    ...corePaths.map((p) => ({ loc: `${origin}${p}`, priority: p === "/" ? "1.0" : "0.7" })),
    // Bigger categories first and weighted higher — with ~320 URLs the crawl
    // budget is finite, so the pages with the most listings should be found
    // first rather than being buried behind categories with three entries.
    ...categories.map((c) => ({
      loc: `${origin}${categoryPath(c.category)}`,
      priority: c.count >= 100 ? "0.9" : c.count >= 20 ? "0.8" : "0.6",
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${xmlEscape(u.loc)}</loc><lastmod>${today}</lastmod>` +
          `<changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`,
      )
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
