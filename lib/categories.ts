/**
 * Category index for the SEO landing pages at /<category>-in-indore.
 *
 * These pages exist because the directory already holds ~19k active listings
 * across ~320 categories, and every one of those categories is a search real
 * people in Indore make ("plumber in indore"). The data was already there; only
 * the pages were missing.
 *
 * Counting has to page through the table because PostgREST cannot GROUP BY
 * without an RPC. That is why every fetch here sets a long `revalidate` — the
 * index is identical for every visitor and changes only when the scraper adds
 * rows, so it is computed a handful of times a day, not once per request.
 */

export type CategoryStat = {
  category: string; // the real value as stored, e.g. "Furniture Store"
  slug: string; // "furniture-store"
  count: number; // active listings only
};

export const CITY_SLUG = "indore";
export const CITY_LABEL = "Indore";

/** URL-safe form of a category name. Must be stable — it is the permalink. */
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The path for a category landing page, e.g. "/plumber-in-indore". */
export function categoryPath(category: string): string {
  return `/${slugifyCategory(category)}-in-${CITY_SLUG}`;
}

/** True for any path this feature owns. Used by the middleware and the router. */
export function isCategoryPath(pathname: string): boolean {
  return /^\/[a-z0-9-]+-in-indore\/?$/.test(pathname.toLowerCase());
}

/** Pull the category slug back out of "/furniture-store-in-indore". */
export function categorySlugFromPath(pathname: string): string | null {
  const m = pathname.toLowerCase().replace(/\/+$/, "").match(/^\/([a-z0-9-]+)-in-indore$/);
  return m ? m[1] : null;
}

function env() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}

/**
 * Every category with at least one ACTIVE listing, biggest first.
 *
 * Only `status=active` is counted. The marketplace page counts everything,
 * which is fine for a browsing UI, but a landing page that promises "244
 * furniture stores" and then renders 210 is a bounce — the number in the
 * heading and the number of cards below it have to be the same number.
 */
export async function getCategoryIndex(): Promise<CategoryStat[]> {
  const { url, key } = env();
  const counts = new Map<string, { category: string; count: number }>();
  try {
    for (let from = 0; ; from += 1000) {
      const res = await fetch(
        `${url}/rest/v1/businesses?select=category&status=eq.active&order=id.asc`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
          next: { revalidate: 3600 },
        },
      );
      if (!res.ok) return [];
      const page: { category: string | null }[] = await res.json();
      for (const row of page) {
        if (!row.category) continue;
        const k = row.category.toLowerCase();
        const hit = counts.get(k);
        if (hit) hit.count += 1;
        else counts.set(k, { category: row.category, count: 1 });
      }
      if (page.length < 1000) break;
    }
  } catch {
    return [];
  }

  const out: CategoryStat[] = [];
  const seenSlugs = new Set<string>();
  for (const { category, count } of counts.values()) {
    const slug = slugifyCategory(category);
    // Two different raw values can slugify identically ("Bar & Grill" /
    // "Bar and Grill"). First one wins so the permalink stays stable; the
    // loser is unreachable rather than serving a duplicate page to Google.
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    out.push({ category, slug, count });
  }
  return out.sort((a, b) => b.count - a.count);
}

/**
 * Total active listings.
 *
 * Not `sum(category counts)` — that silently drops rows whose category is NULL,
 * which is why the page heading said 19,361 while the <title> said 19,360. One
 * number, one source.
 */
export async function getActiveListingCount(): Promise<number> {
  const { url, key } = env();
  try {
    const res = await fetch(`${url}/rest/v1/businesses?select=id&status=eq.active`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: "0-0",
        Prefer: "count=exact",
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return 0;
    return Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Does this listing still exist? Used to answer a real 404 for deleted rows. */
export async function businessExists(id: number): Promise<boolean> {
  const { url, key } = env();
  try {
    const res = await fetch(`${url}/rest/v1/businesses?select=id&id=eq.${id}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return false;
    return ((await res.json()) as unknown[]).length > 0;
  } catch {
    return false;
  }
}

export async function findCategory(slug: string): Promise<CategoryStat | null> {
  const index = await getCategoryIndex();
  return index.find((c) => c.slug === slug) ?? null;
}

/**
 * Placeholder values sitting in the scraped `area` column.
 *
 * 25 rows carry `area = 'testcity'` from an early scraper run. Harmless while
 * it was buried in a card, but the business page now puts locality in the
 * <title> — "Furniture Store in testcity, Indore" is what a searcher would
 * see. Filtered at render rather than deleted, because the underlying rows are
 * the user's data to clean, and a guard also catches whatever junk the next
 * scrape introduces.
 */
const JUNK_AREAS = new Set(["testcity", "test", "n/a", "na", "null", "undefined", "-"]);

export function cleanArea(area: string | null | undefined): string | null {
  if (!area) return null;
  const a = area.trim();
  if (!a || JUNK_AREAS.has(a.toLowerCase())) return null;
  // The scraper sometimes drops a search phrase into `area` rather than a
  // locality — "Carpenter in indore", "best dentist in indore". A real
  // neighbourhood is short and does not contain " in ", and it never repeats
  // the city, which is rendered next to it anyway.
  if (/\s+in\s+/i.test(a)) return null;
  if (a.length > 30) return null;
  if (a.toLowerCase() === CITY_SLUG) return null;
  return a;
}

/** Human locality string for a listing, junk values removed. */
export function localityOf(
  biz: { area?: string | null; city?: string | null },
  fallback: string = CITY_LABEL,
): string {
  return [cleanArea(biz.area), biz.city].filter(Boolean).join(", ") || fallback;
}

/**
 * Tidy a scraped business name for display.
 *
 * Google Maps names are a dumping ground for local SEO. Real examples from this
 * table:
 *   "✅Dr. Vipin Sharma | Best Urologist in Indore | Kidney Stone Doctor | ..."
 *   "“Vishwakarma Furniture Works – Carpenter in Indore"
 * Rendered raw they wrap to four lines, blow out the card grid, and lead with a
 * green tick that reads as a verification badge the platform never granted.
 * Keep the part before the first pipe/bullet, drop leading junk, and collapse
 * SHOUTING to title case.
 */
export function cleanBusinessName(name: string | null | undefined): string {
  if (!name) return "";
  let s = String(name).split(/\s*[|•·]\s*/)[0];
  // Leading emoji, ticks, stars, quotes and dashes.
  s = s.replace(/^[\s\p{Extended_Pictographic} -⁯←-⯿"'`\-–—*]+/u, "");
  s = s.replace(/[\s"'`\-–—*]+$/u, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  // ALL CAPS names are shouting; title-case anything 4+ chars that is all caps.
  if (s.length > 3 && s === s.toUpperCase() && /[A-Z]{4,}/.test(s)) {
    s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  return s || String(name).trim();
}

export type Listing = {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  reviews_count: number | null;
  city: string | null;
  website: string | null;
};

/** One page of active listings for a category, best-rated first. */
export async function getCategoryListings(
  category: string,
  page: number,
  pageSize: number,
): Promise<{ rows: Listing[]; total: number }> {
  const { url, key } = env();
  const from = (page - 1) * pageSize;
  try {
    const res = await fetch(
      `${url}/rest/v1/businesses` +
        `?select=id,name,category,area,address,phone,rating,reviews_count,city,website` +
        `&status=eq.active&category=eq.${encodeURIComponent(category)}` +
        `&order=rating.desc.nullslast,name.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Range: `${from}-${from + pageSize - 1}`,
          Prefer: "count=exact",
        },
        next: { revalidate: 1800 },
      },
    );
    if (!res.ok) return { rows: [], total: 0 };
    const rows = (await res.json()) as Listing[];
    const total = Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || 0;
    return { rows, total };
  } catch {
    return { rows: [], total: 0 };
  }
}
