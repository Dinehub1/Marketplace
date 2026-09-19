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

/**
 * Brand → category ownership. Re-exported here so both apps reach it through the
 * package entry point rather than a deep path.
 *
 * It is the one table that must never disagree between web and native: it decides
 * both which /<category>-in-indore pages a brand site publishes AND which slice of
 * the directory an app shows. See the module for why it is keyword-based.
 *
 * The `.ts` extension is load-bearing, not a typo. This package ships raw TypeScript
 * and `src/index.test.mjs` is run by plain `node --test`, which strips types rather
 * than bundling — so every relative import here must name the file exactly. The test
 * already imports `./index.ts` for the same reason; see `allowImportingTsExtensions`
 * in tsconfig.base.json.
 */
export * from "./brand-scope.ts";

export type CategoryStat = {
  category: string; // the real value as stored, e.g. "Furniture Store"
  slug: string; // "furniture-store"
  count: number; // active listings only
};

export type City = { slug: string; label: string; state: string };

/**
 * Cities the directory covers. `slug` is the URL token in /<category>-in-<slug>;
 * `label` is the exact value stored in businesses.city. A city only becomes
 * linkable in the UI once it actually has listings.
 */
export const CITIES: City[] = [
  { slug: "indore", label: "Indore", state: "Madhya Pradesh" },
  { slug: "mumbai", label: "Mumbai", state: "Maharashtra" },
  { slug: "delhi", label: "Delhi", state: "Delhi" },
  { slug: "bengaluru", label: "Bengaluru", state: "Karnataka" },
  { slug: "hyderabad", label: "Hyderabad", state: "Telangana" },
  { slug: "chennai", label: "Chennai", state: "Tamil Nadu" },
  { slug: "pune", label: "Pune", state: "Maharashtra" },
  { slug: "kolkata", label: "Kolkata", state: "West Bengal" },
  { slug: "ahmedabad", label: "Ahmedabad", state: "Gujarat" },
  { slug: "jaipur", label: "Jaipur", state: "Rajasthan" },
  { slug: "surat", label: "Surat", state: "Gujarat" },
  { slug: "lucknow", label: "Lucknow", state: "Uttar Pradesh" },
  { slug: "chandigarh", label: "Chandigarh", state: "Chandigarh" },
  { slug: "kochi", label: "Kochi", state: "Kerala" },
  { slug: "nagpur", label: "Nagpur", state: "Maharashtra" },
];

const CITY_BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

/** Every unqualified URL resolves to this city. */
export const DEFAULT_CITY: City = CITY_BY_SLUG.get("indore")!;

/**
 * The historical single-city constants. Kept exported because a lot of copy and
 * metadata still reads them; DEFAULT_CITY is the same value, so behaviour is
 * unchanged until a caller resolves a city explicitly.
 */
export const CITY_SLUG = DEFAULT_CITY.slug;
export const CITY_LABEL = DEFAULT_CITY.label;

/**
 * Brand copy (tagline, description, about_text, seo_title) is authored ONCE, for
 * the default city, and rendered on every city's pages. Rather than duplicate
 * that copy per city in the database, the default city's name and state are
 * swapped for the resolved city's at render time — which is why a Mumbai page
 * used to read "Indore's business directory". Exact-string on names we control,
 * so it cannot mangle unrelated text. (2026-09-19)
 */
export function cityCopy(text: string | null | undefined, city: City): string | null {
  if (!text) return text ?? null;
  if (city.slug === DEFAULT_CITY.slug) return text;
  return text.split(DEFAULT_CITY.label).join(city.label).split(DEFAULT_CITY.state).join(city.state);
}

export function cityBySlug(slug: string | null | undefined): City | null {
  if (!slug) return null;
  return CITY_BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

/** Resolve a slug OR a stored label to the canonical label; falls back to Indore. */
export function cityLabel(slugOrLabel: string | null | undefined): string {
  const s = (slugOrLabel || "").trim();
  if (!s) return DEFAULT_CITY.label;
  const bySlug = CITY_BY_SLUG.get(s.toLowerCase());
  if (bySlug) return bySlug.label;
  const byLabel = CITIES.find((c) => c.label.toLowerCase() === s.toLowerCase());
  return byLabel ? byLabel.label : DEFAULT_CITY.label;
}

/** The city token in "/plumber-in-mumbai", or null when it is not a city. */
export function citySlugFromPath(pathname: string): string | null {
  const m = pathname.toLowerCase().replace(/\/+$/, "").match(/^\/([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  return m ? (cityBySlug(m[2])?.slug ?? null) : null;
}

/** URL-safe form of a category name. Must be stable — it is the permalink. */
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The path for a category landing page, e.g. "/plumber-in-indore".
 *  Pass a city slug to build another city's page ("/plumber-in-mumbai"). */
export function categoryPath(category: string, citySlug: string = CITY_SLUG): string {
  return `/${slugifyCategory(category)}-in-${citySlug || CITY_SLUG}`;
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
  // Was pinned to "-in-indore"; now any KNOWN city token is the city, so
  // "/plumber-in-mumbai" is a Mumbai category page rather than a
  // category+neighbourhood page for a place called "mumbai".
  const m = pathname.toLowerCase().replace(/\/+$/, "").match(/^\/([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  if (!m) return null;
  return cityBySlug(m[2]) ? m[1] : null;
}

/** "/plumber-in-vijay-nagar" → { categorySlug: "plumber", areaSlug: "vijay-nagar" }.
 *  Null when the area is the city itself (that is a plain category page). */
export function categoryAreaSlugFromPath(pathname: string): { categorySlug: string; areaSlug: string } | null {
  const m = pathname.toLowerCase().replace(/\/+$/, "").match(/^\/([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  if (!m) return null;
  if (cityBySlug(m[2])) return null;  // a city token is never an area
  return { categorySlug: m[1], areaSlug: m[2] };
}

/** Permalink for a category within a neighbourhood, e.g. "/plumber-in-vijay-nagar". */
export function categoryAreaPath(category: string, area: string): string {
  return `/${slugifyCategory(category)}-in-${slugifyCategory(area)}`;
}

const JUNK_AREAS = new Set(["testcity", "test", "n/a", "na", "null", "undefined", "-"]);


export function cleanArea(area: string | null | undefined, city?: string | null): string | null {
  if (!area) return null;
  const a = area.trim();
  if (!a || JUNK_AREAS.has(a.toLowerCase())) return null;
  // The scraper sometimes drops a search phrase into `area` rather than a
  // locality — "Carpenter in indore", "best dentist in indore". A real
  // neighbourhood is short and does not contain " in ", and it never repeats
  // the city, which is rendered next to it anyway.
  if (/\s+in\s+/i.test(a)) return null;
  if (a.length > 30) return null;
  const al = a.toLowerCase();
  // The area is rendered BESIDE the city, so it must never repeat it. This was
  // hardcoded to the single CITY_SLUG ("indore"), which meant a Mumbai row whose
  // scraped area came back as the fallback sentinel would keep the literal
  // "indore" in its raw row. `city` is the row's own city when known; the
  // CITY_SLUG check stays so historical Indore behaviour is unchanged.
  if (al === CITY_SLUG) return null;
  if (city && al === city.trim().toLowerCase()) return null;
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
  const area = cleanArea(biz.area, biz.city);
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

/**
 * pdfcpu's own page-selection grammar — the one thing the web route and the app
 * screen must agree on, so it lives here instead of in either of them.
 *
 * Read off pdfcpu v0.15.0's `pdfcpu selectedpages`, not assumed, because the
 * obvious `\d+([-,\s]\d+)*` is *narrower than the engine*: pdfcpu really does
 * accept `odd`, `even`, `l` / `l-3` (last page), `3-` and `-4` (open ends) and
 * `!5` / `n5` (exclude). A guard written from the guess refuses values the engine
 * handles correctly — which is exactly what the app's own PDF screen did: it hid
 * `odd`, `even`, `l`, `3-`, `-4` and `!5` from the user, while letting `1 - 3`
 * through, a value pdfcpu calls a syntax error.
 *
 * What it refuses is that syntax error (`abc`, `1;2`, `1--2`, `1.5`, `1 - 3`), so
 * a bad range is answered before a 30 MB scan is uploaded rather than after.
 * Imported by `apps/web/app/api/job/route.ts` (its 400) and by
 * `apps/mobile/app/tools/pdf.tsx` (the field's own guard).
 */
export const PDF_PAGE_EXPR = /^(?:even|odd)$|^[!n]?(?:l(?:-\+?\d+)?|\+?\d+)$|^[!n]?(?:l(?:-\+?\d+)?|\+?\d*)-(?:l(?:-\+?\d+)?|\+?\d*)$|^[!n]?-(?:l(?:-\+?\d+)?|\+?\d+)$/;

/** A comma-separated list of the expressions above, e.g. `1-3,7,!4`. */
export function isPageRange(value: string): boolean {
  const parts = value.split(",");
  // `l` and a digit are the only characters a real expression needs; this is what
  // keeps a bare `-` or `,` (which the grammar above would otherwise allow) out.
  return parts.every((p) => PDF_PAGE_EXPR.test(p) && /[0-9l]|^(?:even|odd)$/.test(p));
}

/** The sentence a caller gets when their range cannot be read (the route's 400).
 *
 *  The exclusion is shown *attached to an inclusion* here too, not as a bare `!5`:
 *  the two sentences in this file are the only place a caller learns the grammar,
 *  and a bare exclusion is the one form pdfcpu parses and then aborts on (measured,
 *  item 25: `trim -p '!5'` prints `missing page numbers` and writes a 0-byte file,
 *  while `1-,!5` is really pages 1-4 of 5). Teaching a form the engine refuses is
 *  how a caller ends up with a 400 it cannot act on. */
export const PDF_PAGES_HELP =
  "pages must select pages, e.g. 1-3,7 — also odd, even, l (last page), 3- (from page 3), -4 (up to page 4), 1-,!5 (all but page 5)";

/** The same grammar said for a screen rather than an API — one line a person reads.
 *
 *  The exclusion form is shown *attached to an inclusion*, because that is the only
 *  way it works: measured on a 5-page file, `1-,!5` really is pages 1-4 and
 *  `odd,n1` is pages 3 and 5, while a bare `!5` makes pdfcpu abort with
 *  `missing page numbers` and a 0-byte file — an exclusion subtracts from an
 *  inclusion, it does not select on its own. */
export const PDF_PAGES_HINT =
  "1-3, 7, odd, even, l (the last page), 3- (to the end), -4 (up to page 4), l-3- (the last 3), 1-,!5 (all but page 5)";

/* ---------------------------------------------------------------------------
 * Bill numbering (the invoice screen's own business, not the renderer's).
 *
 * The bill number used to be typed from memory every time, so the same number
 * could be printed on two bills — a tax problem for the shop, not a cosmetic
 * one. The rules below are pure so both the screen and its tests can read them;
 * where the counter is *kept* (device storage today, a server row later) is the
 * caller's decision, and the engine keeps taking whatever bill number it is
 * sent.
 *
 * What the rules deliberately do NOT do: invent a series the shop never used.
 * A number this cannot parse (`INV/26/07-A`) advances nothing, and the screen
 * says so rather than promising a next number it cannot follow.
 * ------------------------------------------------------------------------- */

/** A parsed bill number: `INV-014` → prefix `INV-`, digits 14, width 3. */
export type BillNo = {
  /** Everything before the trailing digit run, exactly as typed (`""`, `"INV-"`, `"No. "`). */
  prefix: string;
  /** The trailing digit run as a number. */
  digits: number;
  /** How many digits were typed, so `014` can be followed by `015` and not `15`. */
  width: number;
};

/**
 * Read a bill number the way a shop writes one: a trailing run of digits, with
 * whatever prefix the shop prefers in front of it. Returns null when there is
 * no trailing digit run to follow (`INV/26/07-A`), which is the honest answer —
 * a counter cannot continue a series it cannot parse.
 */
export function parseBillNo(value: string | null | undefined): BillNo | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  const digitsText = m[2];
  // A ten-digit "bill number" is a phone number or a typo, not a series step.
  if (digitsText.length > 9) return null;
  const digits = Number(digitsText);
  if (!Number.isFinite(digits)) return null;
  return { prefix: m[1], digits, width: digitsText.length };
}

/**
 * Which shop a counter belongs to. A real GSTIN (15 characters, nowhere to
 * mistype increasingly as the user types) is the strongest identity; otherwise
 * the shop name, case- and space-folded. Null when neither is known, which
 * means "do not count yet" rather than "count under an empty name".
 */
export function shopKeyOf(name: string | null | undefined, gstin?: string | null): string | null {
  const g = String(gstin ?? "").replace(/\s+/g, "").toUpperCase();
  if (/^[0-9A-Z]{15}$/.test(g)) return `gstin:${g}`;
  const n = String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return n ? `shop:${n}` : null;
}

/** What the device remembers for one shop: the highest number used, and its shape. */
export type InvoiceCounter = {
  /** Highest bill number recorded on this device for this shop. */
  last: number;
  /** Digit width of `last` as typed, so `014` suggests `015`. */
  width: number;
  /** The prefix that came with it (`""`, `"INV-"`), so the series stays recognisable. */
  prefix: string;
};

export type BillAdvance = {
  /** The counter after this bill; unchanged when the number could not be read. */
  counter: InvoiceCounter;
  /** True when this bill moved the counter forward. */
  moved: boolean;
  /** True when the number was at or below the last one used on this device. */
  alreadyUsed: boolean;
  /** The parsed form, or null when the number is not one this can follow. */
  parsed: BillNo | null;
};

/**
 * Record a bill number and return the counter afterwards.
 *
 * Forward only: printing bill 20 and then re-printing bill 7 does not rewind the
 * counter, because the next *new* bill is still 21. A number that cannot be
 * parsed leaves the counter exactly as it was.
 */
export function advanceCounter(
  counter: InvoiceCounter | null,
  billNo: string | null | undefined,
): BillAdvance {
  const current: InvoiceCounter = counter ?? { last: 0, width: 1, prefix: "" };
  const parsed = parseBillNo(billNo);
  if (!parsed) return { counter: current, moved: false, alreadyUsed: false, parsed: null };
  const moved = parsed.digits > current.last;
  return {
    counter: moved
      ? { last: parsed.digits, width: parsed.width, prefix: parsed.prefix }
      : current,
    moved,
    alreadyUsed: parsed.digits <= current.last,
    parsed,
  };
}

/** The number to offer next: last + 1, padded to the width of the last one, in
 *  the same prefix. With no counter yet, `1` — the first bill of the series. */
export function nextBillNo(counter: InvoiceCounter | null | undefined): string {
  if (!counter || counter.last <= 0) return "1";
  const n = counter.last + 1;
  const text = String(n);
  return `${counter.prefix}${text.padStart(Math.min(Math.max(counter.width, text.length), 9), "0")}`;
}

/** The last number used, for a sentence that says what it is counting from. */
export function counterLabel(counter: InvoiceCounter | null | undefined): string | null {
  if (!counter || counter.last <= 0) return null;
  return `${counter.prefix}${String(counter.last).padStart(Math.min(Math.max(counter.width, String(counter.last).length), 9), "0")}`;
}

/* ---------------------------------------------------------------------------
 * Document translation: the languages the product offers.
 *
 * Kept here, and not in the two places that need it, because they are the ones that
 * drifted the last time a grammar was owned twice (item 25: the PDF screen's own range
 * guard hid `odd`/`l` from the user while letting `1 - 3` through to a 400).
 * `apps/web/app/api/job/route.ts` answers "not one of the languages this tool
 * translates" and `apps/mobile/app/tools/translate-doc.tsx` draws the picker, so a code
 * that works in the app but not at the route would be a screen offering a 400 — and a
 * code the route grew but the picker never showed would be a dead feature.
 *
 * The list is the one that passed a **round trip**, not a catalogue of codes the model
 * claims: `gu` (Gujarati) answered five probes with five wrong numbers and `te`
 * (Telugu) came back empty from the LLM while m2m100 refused the code outright, so
 * neither is offered. Re-run that probe before adding one — see item 15 in
 * docs/hourly-queue.md and TRANSLATE_LANG_NAMES in services/tools/worker.py (written
 * separately because the Python half cannot import this file).
 */
export const TRANSLATE_LANGS: readonly string[] = ["en", "hi", "bn", "mr", "ta", "ml", "kn", "pa", "or", "as", "ur"];

/** The languages in words, for a sentence rather than a picker. */
export const TRANSLATE_LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil",
  ml: "Malayalam", kn: "Kannada", pa: "Punjabi", or: "Odia", as: "Assamese", ur: "Urdu",
};

/** `English, Hindi, Bengali …` — what both the route's 400 and the screen's help say. */
export const TRANSLATE_LANGS_HELP = TRANSLATE_LANGS.map((c) => TRANSLATE_LANG_NAMES[c] ?? c).join(", ");
