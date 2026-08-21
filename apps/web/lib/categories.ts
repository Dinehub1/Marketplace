/**
 * Web-side category data access.
 *
 * The pure half of this file — slugs, paths, name cleaning, tel:/wa.me links —
 * moved to @hermes/core so the Expo app derives identical values from identical
 * code. It is re-exported here rather than deleted: every call site in the app
 * imports from "@/lib/categories", and rewriting forty imports to prove a point
 * about module boundaries would be churn, not clarity.
 *
 * The fetchers below stay web-only. They pass `next: { revalidate }` to Next's
 * extended fetch, which React Native has no concept of, and a server rendering
 * 19k pages does not want the same caching as a phone on a 3G connection.
 */
export {
  CITY_SLUG,
  CITY_LABEL,
  slugifyCategory,
  categoryPath,
  isCategoryPath,
  categorySlugFromPath,
  categoryAreaSlugFromPath,
  categoryAreaPath,
  cleanArea,
  localityOf,
  cleanBusinessName,
  titleize,
  telHref,
  waHref,
} from "@hermes/core";
export type { CategoryStat, Listing } from "@hermes/core";

import {
  CITY_SLUG,
  CITY_LABEL,
  slugifyCategory,
  cleanArea,
  type CategoryStat,
  type Listing,
} from "@hermes/core";

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

export type AreaStat = { area: string; slug: string; count: number };

/**
 * Every locality with at least one active listing, biggest first.
 * Powers the marketplace area filter. Junk values are stripped by cleanArea so
 * "testcity" and "Plumber in indore" never become selectable neighbourhoods.
 */
export async function getAreaIndex(): Promise<AreaStat[]> {
  const { url, key } = env();
  const counts = new Map<string, AreaStat>();
  try {
    for (let from = 0; ; from += 1000) {
      const res = await fetch(
        `${url}/rest/v1/businesses?select=area&status=eq.active&order=id.asc`,
        { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` }, next: { revalidate: 3600 } },
      );
      if (!res.ok) return [];
      const page: { area: string | null }[] = await res.json();
      for (const r of page) {
        const a = cleanArea(r.area);
        if (!a) continue;
        const slug = slugifyCategory(a);
        const hit = counts.get(slug);
        if (hit) hit.count += 1;
        else counts.set(slug, { area: a, count: 1, slug });
      }
      if (page.length < 1000) break;
    }
  } catch {
    return [];
  }
  return [...counts.values()].sort((x, y) => y.count - x.count);
}

/** Localities within a single category — powers the "browse by area" links. */
export async function getCategoryAreaIndex(category: string): Promise<AreaStat[]> {
  const { url, key } = env();
  const counts = new Map<string, AreaStat>();
  try {
    for (let from = 0; ; from += 1000) {
      const res = await fetch(
        `${url}/rest/v1/businesses?select=area&status=eq.active&category=eq.${encodeURIComponent(category)}&order=id.asc`,
        { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` }, next: { revalidate: 3600 } },
      );
      if (!res.ok) return [];
      const page: { area: string | null }[] = await res.json();
      for (const r of page) {
        const a = cleanArea(r.area);
        if (!a) continue;
        const slug = slugifyCategory(a);
        const hit = counts.get(slug);
        if (hit) hit.count += 1;
        else counts.set(slug, { area: a, count: 1, slug });
      }
      if (page.length < 1000) break;
    }
  } catch {
    return [];
  }
  return [...counts.values()].sort((x, y) => y.count - x.count);
}

/** One page of active listings for a category within a locality. */
export async function getCategoryAreaListings(
  category: string,
  area: string,
  page: number,
  pageSize: number,
): Promise<{ rows: Listing[]; total: number }> {
  const { url, key } = env();
  const from = (page - 1) * pageSize;
  try {
    const res = await fetch(
      `${url}/rest/v1/businesses` +
        `?select=id,name,category,area,address,phone,rating,reviews_count,city,website` +
        `&status=eq.active&category=eq.${encodeURIComponent(category)}&area=eq.${encodeURIComponent(area)}` +
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
