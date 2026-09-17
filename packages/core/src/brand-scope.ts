/**
 * Brand → category ownership: the ONE table that decides which business listings
 * belong to which brand.
 *
 * This lives in `@hermes/core` because two independent surfaces have to agree about
 * it and must never be able to drift:
 *
 *   • the 28 brand websites, which render /<category>-in-indore landing pages and
 *     must not publish a category twice (two of our own pages competing for one
 *     query is the self-cannibalisation this file exists to prevent);
 *   • the directory apps on iOS and Android, which filter the same `businesses`
 *     table down to their own slice so SarkarHealth lists doctors and SarkarCars
 *     lists garages instead of all of them listing the same 24,048 rows.
 *
 * Before this module existed the mobile scope was retyped by hand in
 * `apps/mobile/targets.mjs`, so the web and the app could — and did — disagree about
 * what "Car Service & Dealers Indore" is. One table, two views.
 *
 * WHY KEYWORDS AND NOT `businesses.brand_id`:
 * `brand_id` is a single column, so a row can belong to exactly ONE brand. The
 * product rule is that a business appears on its vertical brand AND always on the
 * marketplace brands — a many-to-many relationship that a single FK cannot express.
 * Backfilling brand_id would force each business into one brand and empty out the
 * marketplace. So the directory filters by category at query time instead. No data
 * migration, no schema change, and a business can appear on as many brands as fit it.
 *
 * Matching is substring, case-insensitive, against `businesses.category` (Google
 * Maps' own classification — 425 distinct values and growing, which is why this is
 * keyword-based rather than an exhaustive list).
 *
 * A brand not listed here (sarkarmarketplace, sarkarbazaar, and the non-directory
 * brands) shows the FULL directory — that is the intended fallback, not an oversight.
 * Categories matching nothing still appear on those brands, so no business is ever
 * hidden everywhere.
 */

/** Brand slug -> substring patterns matched against `businesses.category`. */
export const BRAND_CATEGORY_KEYWORDS: Record<string, string[]> = {
  sarkarhealth: [
    "hospital", "clinic", "dental", "dentist", "pharma", "doctor", "medical",
    "nursing", "physio", "diagnos", "radiolog", "oncolog", "dialysis",
    "optometr", "orthoped", "psychiat", "psycholog", "surgery", "ultrasound",
    "veterinar", "immunis", "rehabilit", "speech therap", "fertility", "eye ",
    "gynec", "ayurved", "homeopath", "pathology", "blood bank",
    // Medical aesthetics belongs to the medical brand: sarkarwellness owns
    // salons and spas, not clinics. "skin" and "cosmetic" on their own used to
    // pull "skin clinic" / "cosmetic clinic" onto wellness - see the note there.
    "cosmetic clinic", "skin clinic", "derma",
  ],
  // Home services and interiors. The property-transaction keywords
  // ("real estate", "property", "realty", "builder") moved to
  // hyperframes-realestate on 2026-08-10 — two brands cannot both own
  // /real-estate-agency-in-indore without competing with each other.
  sarkarghar: [
    "plumb", "electric", "furniture", "interior", "architect",
    "carpenter", "mason", "tile", "paint",
    // "roof" alone matched "rooftop restaurant", which belongs to sarkarfood.
    "roofing", "roof repair", "roof waterproofing",
    "civil contractor",
    "construction", "glass", "sanitary",
    "home decor", "drywall", "plaster", "concrete", "plywood",
    // home services - these were falling through to no brand at all
    "cable tv", "water purifier", "water tank", "pvc pipe", "pest control",
    "security alarm", "safety equipment", "lamination", "cctv", "door lock",
    "kitchen cabinet", "home automation", "cleaning service", "maid service",
    "disinfection", "shower fitting", "router installer",
    // orphan sweep 2026-09-14: services that happen at a home
    "packers", "movers", "carpet cleaning", "sofa cleaning", "deep cleaning",
    "housekeeping",
  ],
  sarkarfood: [
    "restaurant", "cafe", "coffee", "bakery", "dhaba", "biryani", "pizza",
    "ice cream", "juice", "food", "kebab", "sweet", "caterer", "catering",
    "bar &", "lounge", "tandoor", "dessert", "microbrewery",
    // orphan sweep 2026-09-14: street food and tea, unclaimed at 72+ listings
    "tea stall", "chaat", "food court", "cloud kitchen",
  ],
  // Salons, spas, fitness. NOT clinics and NOT shops: bare "skin"/"cosmetic"
  // matched "skin clinic" (sarkarhealth) and "cosmetics store" (sarkardukaan),
  // and "sports academy" matched coaching academies owned by sarkared. Every
  // one of those was two brands publishing the same category page.
  sarkarwellness: [
    // "=spa" is whole-word: as a bare substring it matched "spare parts",
    // putting vehicle parts on the wellness brand.
    "salon", "gym", "=spa", "yoga", "beauty", "massage", "wellness", "fitness",
    "nail", "tattoo", "hair", "pilates", "martial arts",
    "chiropractor", "beauty parlour", "beauty salon", "skincare", "skin care",
    "makeup artist", "hair studio", "unisex salon",
  ],
  // Electronics and appliance retail/repair.
  // Bare "store" and "shop" were removed on 2026-08-10: they matched ANY
  // category containing those words, so sarkarmart was silently co-claiming
  // furniture store, glass shop, ice cream shop, coffee shop, dessert shop,
  // sanitaryware shop, electrical goods store and home decor store from
  // sarkarghar and sarkarfood — eight categories with two owners each.
  // Bare "computer"/"laptop" came out the same way on 2026-09-14: they matched
  // "computer training institute", which sarkared owns.
  sarkarmart: [
    "ac repair", "air conditioner", "appliance", "mobile phone", "electronics",
    "computer repair", "computer store", "computer shop", "laptop repair",
    "laptop store", "printer repair", "printer store", "repair shop",
    "hardware store", "mobile repair", "smartphone repair", "tablet repair",
    "refrigerator", "white goods", "electronic components",
    // orphan sweep 2026-09-14: electronics retail nobody claimed
    "battery shop", "electrical goods", "electrical store", "mobile accessories",
    "gaming store", "electronic",
    // orphan sweep: telecom retail sat unclaimed while mobile retail was ours
    "telecom",
  ],

  // Property transactions — agencies, agents, developers, realty firms.
  // Distinct from sarkarghar, which owns the trades that work ON a home.
  "hyperframes-realestate": [
    "real estate", "property", "realty", "estate agent", "apartment builder",
    "housing",
  ],

  // Everyday retail — the local dukaan. Drawn from categories no other brand
  // claimed. Manufacturers are deliberately excluded: "bag manufacturer" and
  // "garment manufacturer" are factories, not shops, and this brand is about
  // shops going online.
  sarkardukaan: [
    "grocery", "supermarket", "clothing", "boutique", "jewell", "footwear",
    "shoe store", "stationery", "gift shop", "toy store", "book store",
    "perfume", "watch store", "department store", "general store",
    "sports goods", "pet store", "music store", "handicraft",
    // "cosmetics" alone also matched "cosmetics store" AND "cosmetic clinic";
    // the shop form is named explicitly so the clinic stays with sarkarhealth.
    "cosmetics store", "cosmetic store", "cosmetics shop", "cosmetic shop",
    // orphan sweep 2026-09-14: retail the dukaan should own.
    // "sweet shop" is deliberately NOT here - sarkarfood owns sweets, and both
    // brands listing it meant two of our pages competing for one query.
    "candle", "utensil", "household", "dry fruit", "kirana", "fancy store",
    "gift center", "cake shop", "ice cream parlour",
  ],
  sarkartravel: [
    "hotel", "guest house", "hostel", "travel", "tour ", "resort", "lodge",
    // orphan sweep 2026-09-14: local mobility a visitor books
    "cab service", "taxi", "cabs", "travel agency", "tour operator",
  ],

  // The booking vertical: car wash, detailing and service. This is the one
  // brand whose listings carry a live slot-booking flow (/book), so it owns
  // every category a customer would book a vehicle into. Deliberately tight —
  // bare "dealer", "showroom", "garage" (parking garages!) and spare-parts
  // retail stay unowned rather than leaking non-bookable businesses into the
  // booking funnel.
  // Bare "painting" was removed on 2026-09-14: it matched "painting
  // contractor", "interior painting service" and "painting restoration
  // service", all of which are sarkarghar's.
  sarkarcars: [
    "car wash", "car cleaning", "car detail", "vehicle detail", "detailing",
    "car service", "vehicle service", "car repair", "auto repair",
    "automobile repair", "mechanic", "denting", "car painting", "car care",
    "bike wash", "bike service",
    // orphan sweep 2026-09-14: vehicle businesses a customer books or rents
    "car rental", "bike rental", "car dealer", "car accessories", "tyre",
    "wheel alignment", "car stereo", "car audio",
  ],
  sarkarfinance: [
    "bank", "insurance", "stock brok", "mutual fund", "chartered account",
    "accounting", "tax ", "financial", "money transfer", "loan", "paytm",
    "credit", "nbfc", "fintech",
  ],
  sarkarlegal: [
    "law firm", "legal", "advocate", "notary", "lawyer",
  ],
  sarkared: [
    "school", "college", "university", "institute", "academy", "coaching",
    "tutor", "education", "training", "preschool", "language school",
    "driving school",
    // orphan sweep 2026-09-14: learning nobody claimed.
    // "e‑learning" carries a non-breaking hyphen (U+2011) in the source data,
    // so both spellings are listed or half those listings stay unreachable.
    "e-learning", "e‑learning", "e-learning centre", "e‑learning centre",
    "tuition", "library", "study centre", "computer training",
  ],
  sarkarjobs: [
    "recruit", "human resources", "staffing", "placement", "hr ",
  ],

  /**
   * Professional and B2B services. This was 144 unclaimed categories / ~5,863
   * listings that appeared ONLY on the full-directory brand: a marketing agency,
   * an IT firm or a printing press had no vertical home and no landing page.
   * Deliberately excluded from every other brand's keywords so no category ends
   * up with two owners (the whole point of this file).
   */
  sarkarconnect: [
    "digital marketing", "marketing agency", "advertising", "seo service",
    "it services", "software", "web design", "web development", "app develop",
    "graphic design", "3d printing", "printing press", "printing service",
    "screen printing", "flex printing", "offset printing", "sign board",
    "photo studio", "photograph", "videograph", "event management",
    "event planner", "event lighting", "event venue", "banquet", "wedding",
    "logistics", "cargo", "courier", "transport service", "security service",
    "manpower", "call center", "bpo", "translation", "data entry",
    "business consultant", "consultancy", "interior decorator",
    // orphan sweep: coworking was the largest remaining unclaimed category
    "coworking",
  ],

  /**
   * Manufacturers, wholesalers and industrial supply - the B2B supply side of
   * the same orphan sweep. A "garment manufacturer" is a factory, not a
   * sarkardukaan shop, which is why it belongs here and not in retail.
   */
  sarkarbazaar: [
    "manufacturer", "manufacturing", "wholesale", "wholesaler", "distributor",
    "supplier", "trading company", "traders", "mill", "factory", "industry",
    "industrial", "packaging", "plastic", "steel", "iron", "metal",
    "pipe", "chemical", "textile", "fabric", "garment", "building material",
    "cement", "marble", "granite", "timber", "plywood", "glass wholesale",
    "electrical wholesale", "hardware wholesale", "auto parts", "spare parts",
    "scrap", "recycling", "agro", "seeds", "fertilizer", "farm equipment",
  ],
};

/**
 * Categories a brand must NOT claim, even though one of its keywords matches.
 *
 * Substring matching cannot express "bank but not blood bank". Without this,
 * `blood bank` sat on sarkarfinance (via "bank"), `auto repair shop` on
 * sarkarmart (via "repair shop") and `martial arts academy` on sarkared (via
 * "academy") *as well as* on the brand that should own them — two of our own
 * pages competing for one query, which is the self-cannibalisation this table
 * exists to prevent. Exclusions are evaluated before the keyword match counts.
 */
export const BRAND_CATEGORY_EXCLUDES: Record<string, string[]> = {
  sarkarmart: ["auto repair", "computer training", "laptop training"],
  sarkared: ["martial arts"],
  sarkarfinance: ["blood bank"],
  // An electrician is a trade (sarkarghar); the shop selling the goods is
  // sarkarmart's. "electric" matched "electrical goods store" for both.
  // "paint" likewise matched "car denting painting" - the paintshop that works
  // on a vehicle is sarkarcars'.
  sarkarghar: [
    "electrical goods", "electrical store",
    "car denting", "car painting", "vehicle painting",
  ],
  // A clinic named "legal aid clinic" is sarkarlegal's, not a medical one.
  sarkarhealth: ["legal aid clinic", "ayurvedic spa"],
};

/**
 * Ownership precedence: when several brands' keywords match one category, the
 * FIRST brand here wins and the others drop it.
 *
 * This is what actually guarantees single ownership. Exclusions alone were a
 * losing game: as soon as generic words arrived ("supplier", "wholesale",
 * "spare parts", "interior decorator"), a category like "medical equipment
 * supplier" or "pvc pipe supplier" matched two or three brands at once, and a
 * category owned twice is two of our own pages competing for one query. The
 * specialist verticals are listed first, the catch-all B2B brands last, so
 * sarkarconnect and sarkarbazaar only ever receive what nobody else claims.
 */
export const BRAND_PRECEDENCE: readonly string[] = [
  "sarkarhealth", "sarkarghar", "sarkarfood", "sarkarwellness", "sarkarmart",
  "sarkardukaan", "sarkartravel", "sarkarcars", "sarkarfinance", "sarkarlegal",
  "sarkared", "sarkarjobs", "hyperframes-realestate", "sarkarconnect",
  "sarkarbazaar",
];

/**
 * The single brand that publishes the entire directory.
 *
 * Was {sarkarmarketplace, sarkarbazaar, justdial-agent}. Three brands serving
 * the identical 320 category pages meant /plumber-in-indore existed three times
 * over, competing with itself — Google picks one canonical and can suppress the
 * others, which risks suppressing the one you actually want ranking. Narrowed
 * to one owner on 2026-08-10 at the user's direction.
 */
export const FULL_DIRECTORY_BRANDS: ReadonlySet<string> = new Set([
  "sarkarmarketplace",
]);

/**
 * Keyword match. A keyword may be written "=word" to mean whole-word only -
 * without it, substring matching maps "spare parts" onto wellness (via "spa")
 * and "marketing" onto nothing useful. Prefixes stay the default so "plumb"
 * still finds plumber and "jewell" still finds jewellery.
 */
function keywordMatches(lc: string, keyword: string): boolean {
  if (keyword.startsWith("=")) {
    return new RegExp(`(^|[^a-z])${keyword.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(lc);
  }
  return lc.includes(keyword);
}

/** Every brand whose keywords claim this category, exclusions applied. */
function ownersOf(lc: string): string[] {
  const out: string[] = [];
  for (const [brand, keywords] of Object.entries(BRAND_CATEGORY_KEYWORDS)) {
    const excludes = BRAND_CATEGORY_EXCLUDES[brand] ?? [];
    if (excludes.some((x) => lc.includes(x))) continue;
    if (keywords.some((k) => keywordMatches(lc, k))) out.push(brand);
  }
  return out;
}

/** Position in BRAND_PRECEDENCE; unbranded entries rank last. */
function rank(brand: string): number {
  const i = BRAND_PRECEDENCE.indexOf(brand);
  return i === -1 ? BRAND_PRECEDENCE.length : i;
}

/**
 * Resolve which of `allCategories` belong to `brandSlug`.
 * Returns `null` when the brand shows the full directory (no filter to apply).
 * Returns `[]` when the brand is mapped but nothing matched - callers must treat
 * that as "show nothing" rather than "show everything", or a mapped brand would
 * silently fall back to the full directory.
 */
export function categoriesForBrand(
  brandSlug: string,
  allCategories: string[],
): string[] | null {
  const slug = (brandSlug ?? "").toLowerCase();
  if (FULL_DIRECTORY_BRANDS.has(slug)) return null;
  const keywords = BRAND_CATEGORY_KEYWORDS[slug];
  // An unmapped brand used to fall through to the FULL directory. That was a
  // reasonable default before category landing pages existed; afterwards it
  // silently gave five brands a duplicate copy of all 320 pages. Unmapped now
  // means "no directory", and the caller turns that into a 404 rather than an
  // empty page. Add a keyword list above to give a brand a slice.
  if (!keywords) return [];
  const excludes = BRAND_CATEGORY_EXCLUDES[slug] ?? [];
  return allCategories.filter((c) => {
    const lc = (c ?? "").toLowerCase();
    if (excludes.some((x) => lc.includes(x))) return false;
    const owners = ownersOf(lc);
    if (owners.length === 0) return false;
    // Single owner by construction: the most specific vertical in
    // BRAND_PRECEDENCE wins, so a category is never published by two brands.
    const winner = owners.slice().sort((a, b) => rank(a) - rank(b))[0];
    return winner === slug;
  });
}

/** The brand that owns this one category, or null when nobody claims it. */
export function ownerOfCategory(category: string | null | undefined): string | null {
  const lc = (category ?? "").toLowerCase();
  if (!lc) return null;
  const owners = ownersOf(lc);
  if (owners.length === 0) return null;
  return owners.slice().sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

/**
 * Does `brandSlug` own this one category?
 *
 * The per-row form of `categoriesForBrand`. The directory apps use it where they
 * already hold a row and only need to know whether it belongs to them.
 */
export function brandOwnsCategory(brandSlug: string, category: string | null | undefined): boolean {
  const slug = (brandSlug ?? "").toLowerCase();
  if (FULL_DIRECTORY_BRANDS.has(slug)) return true;
  if (!BRAND_CATEGORY_KEYWORDS[slug]) return false;
  return ownerOfCategory(category) === slug;
}

/** What a single-surface client needs to narrow a listing feed to one brand. */
export type BrandScope = {
  /** Substrings to INCLUDE (`category ilike *term*`). */
  include: string[];
  /** Substrings to carve back out after the include match. */
  exclude: string[];
};

/**
 * A brand's ownership expressed as an approximate query filter.
 *
 * This is the *view* of the ownership table that a client which filters a feed
 * server-side can apply — the directory apps turn it into a PostgREST `or=`/`and=`
 * expression (see `apps/mobile/lib/api.ts`). It is deliberately lossy in one
 * direction: whole-word keywords (`=spa`) lose their anchoring, because PostgREST's
 * `ilike` has no word-boundary operator. A caller that needs the exact answer for a
 * row it already holds should use `brandOwnsCategory` instead.
 *
 * Returns `null` for the full-directory brand and for any brand that owns nothing
 * but is allowed to show everything — the caller reads that as "no filter".
 */
export function scopeForBrand(brandSlug: string): BrandScope | null {
  const slug = (brandSlug ?? "").toLowerCase();
  if (FULL_DIRECTORY_BRANDS.has(slug)) return null;
  const keywords = BRAND_CATEGORY_KEYWORDS[slug];
  if (!keywords || keywords.length === 0) return null;
  return {
    include: keywords.map((k) => (k.startsWith("=") ? k.slice(1) : k)),
    exclude: BRAND_CATEGORY_EXCLUDES[slug] ?? [],
  };
}
