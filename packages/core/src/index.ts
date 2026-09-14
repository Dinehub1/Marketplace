/**
 * @hermes/core — domain logic shared by the web app and the Expo app.
 *
 * What lives here is the part of the product that is genuinely the same on both
 * platforms: how a category becomes a URL slug, how a scraped business name is
 * cleaned for display, how an Indian phone number becomes a tel:/wa.me link.
 * Getting any of these subtly different between web and native would show up as
 * two products that disagree about their own data.
 *
 * What does NOT live here: anything that fetches. The web fetchers pass
 * `next: { revalidate }` to Next's extended fetch, which React Native has no
 * concept of, and the caching strategy for a server rendering 19k pages is not
 * the strategy for a phone on a 3G connection. Each app owns its own transport.
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

/**
 * Any "/<category>-in-<area>" path (the canonical -in-indore included) is a
 * dynamic directory page that must reach the brand router. The router then
 * decides whether the area is the city itself (a category page) or a
 * neighbourhood (a category+area page). Broadened from -in-indore only so
 * neighbourhood pages route to the router instead of 404-ing on the static site.
 */
export function isCategoryPath(pathname: string): boolean {
  return /^\/[a-z0-9-]+-in-[a-z0-9-]+\/?$/.test(pathname.toLowerCase());
}

/** Pull the category slug back out of "/furniture-store-in-indore". */
export function categorySlugFromPath(pathname: string): string | null {
  const m = pathname.toLowerCase().replace(/\/+$/, "").match(/^\/([a-z0-9-]+)-in-indore$/);
  return m ? m[1] : null;
}

/** "/plumber-in-vijay-nagar" → { categorySlug: "plumber", areaSlug: "vijay-nagar" }.
 *  Null when the area is the city itself (that is a plain category page). */
export function categoryAreaSlugFromPath(pathname: string): { categorySlug: string; areaSlug: string } | null {
  const m = pathname.toLowerCase().replace(/\/+$/, "").match(/^\/([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  if (!m) return null;
  if (m[2] === CITY_SLUG) return null;
  return { categorySlug: m[1], areaSlug: m[2] };
}

/** Permalink for a category within a neighbourhood, e.g. "/plumber-in-vijay-nagar". */
export function categoryAreaPath(category: string, area: string): string {
  return `/${slugifyCategory(category)}-in-${slugifyCategory(area)}`;
}

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

/**
 * Title-case a stored locality.
 *
 * `area` is stored lowercase (the importer lowercases the address component),
 * which is right for matching but wrong in a <title> and in a SERP snippet:
 * "Plumber in vijay nagar, Indore" is what a searcher reads. Cards carry a CSS
 * `capitalize`, so only the metadata path was visibly wrong.
 */
export function titleizeArea(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Human locality string for a listing, junk values removed. */
export function localityOf(
  biz: { area?: string | null; city?: string | null },
  fallback: string = CITY_LABEL,
): string {
  const area = cleanArea(biz.area);
  return [area ? titleizeArea(area) : null, biz.city].filter(Boolean).join(", ") || fallback;
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

/**
 * Acronyms that must never be title-cased into words: the catalogue contains
 * hundreds of "ac repair" / "cctv installer" / "it services company" listings,
 * and title-casing each word renders them as "Ac Repair", "Cctv Installer" and
 * "It Services Company" - visibly amateur next to the listing copy. (2026-09-14)
 */
const ACRONYMS = new Set([
  "ac", "cctv", "cng", "it", "seo", "atm", "pvc", "upvc", "led", "ro", "ca",
  "gst", "hvac", "ups", "erp", "crm", "nbfc", "gps", "lcd", "tv", "iso", "hiv",
  "id", "bi", "ip", "3d", "olx", "em", "pc", "stpi", "mpcb", "tds",
]);

/** Title-case a label for display, e.g. "furniture store" → "Furniture Store". */
export function titleize(s: string): string {
  return s.replace(/[\w]+/g, (w) =>
    ACRONYMS.has(w.toLowerCase())
      ? w.toUpperCase()
      : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

/** Build a tel: href that normalises Indian phone numbers (adds +91 when missing). */
export function telHref(phone: string): string {
  const d = phone.replace(/[^\d+]/g, "");
  return `tel:${d.startsWith("+") ? d : `+91${d.replace(/^0+/, "")}`}`;
}

/** Build a wa.me href (WhatsApp click-to-chat) with an optional prefilled message. */
export function waHref(phone: string, message?: string): string {
  const d = phone.replace(/[^\d+]/g, "");
  const num = d.startsWith("+") ? d.slice(1) : `91${d.replace(/^0+/, "")}`;
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
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

/** Indian digit grouping (1,00,000 not 100,000). Used wherever a count is shown
 *  next to a listing, so web and native never disagree about the same number. */
export function formatCount(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toLocaleString("en-IN");
}
