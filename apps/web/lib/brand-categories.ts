/**
 * Category -> brand routing for the business directory.
 *
 * WHY KEYWORDS AND NOT `businesses.brand_id`:
 * `brand_id` is a single column, so a row can belong to exactly ONE brand. The
 * product rule (see config/brand-map.json) is that a business appears on its
 * vertical brand AND always on the marketplace brands - a many-to-many
 * relationship that a single FK cannot express. Backfilling brand_id would
 * force each business into one brand and empty out the marketplace. So the
 * directory filters by category at query time instead. No data migration, no
 * schema change, and a business can appear on as many brands as fit it.
 *
 * Matching is substring, case-insensitive, against `businesses.category`
 * (Google Maps' own classification - 321 distinct values and growing, which is
 * why this is keyword-based rather than an exhaustive list).
 *
 * A brand not listed here (sarkarmarketplace, sarkarbazaar, and the non-directory
 * brands) shows the FULL directory - that is the intended fallback, not an
 * oversight. Categories matching nothing still appear on those brands, so no
 * business is ever hidden everywhere.
 */

/** Brand slug -> substring patterns matched against `businesses.category`. */
export const BRAND_CATEGORY_KEYWORDS: Record<string, string[]> = {
  sarkarhealth: [
    "hospital", "clinic", "dental", "dentist", "pharma", "doctor", "medical",
    "nursing", "physio", "diagnos", "radiolog", "oncolog", "dialysis",
    "optometr", "orthoped", "psychiat", "psycholog", "surgery", "ultrasound",
    "veterinar", "immunis", "rehabilit", "speech therap", "fertility", "eye ",
    "gynec", "ayurved", "homeopath", "pathology", "blood bank",
  ],
  // Home services and interiors. The property-transaction keywords
  // ("real estate", "property", "realty", "builder") moved to
  // hyperframes-realestate on 2026-08-10 — two brands cannot both own
  // /real-estate-agency-in-indore without competing with each other.
  sarkarghar: [
    "plumb", "electric", "furniture", "interior", "architect",
    "carpenter", "mason", "tile", "paint", "roof", "civil contractor",
    "construction", "glass", "sanitary",
    "home decor", "drywall", "plaster", "concrete", "plywood",
    // home services - these were falling through to no brand at all
    "cable tv", "water purifier", "water tank", "pvc pipe", "pest control",
    "security alarm", "safety equipment", "lamination", "cctv", "door lock",
    "kitchen cabinet", "home automation", "cleaning service", "maid service",
    "disinfection", "shower fitting", "router installer",
  ],
  sarkarfood: [
    "restaurant", "cafe", "coffee", "bakery", "dhaba", "biryani", "pizza",
    "ice cream", "juice", "food", "kebab", "sweet", "caterer", "catering",
    "bar &", "lounge", "tandoor", "dessert", "microbrewery",
  ],
  sarkarwellness: [
    "salon", "gym", "spa", "yoga", "beauty", "massage", "wellness", "fitness",
    "nail", "tattoo", "skin", "cosmetic", "hair", "pilates", "martial arts",
    "chiropractor", "sports academy",
  ],
  // Electronics and appliance retail/repair.
  // Bare "store" and "shop" were removed on 2026-08-10: they matched ANY
  // category containing those words, so sarkarmart was silently co-claiming
  // furniture store, glass shop, ice cream shop, coffee shop, dessert shop,
  // sanitaryware shop, electrical goods store and home decor store from
  // sarkarghar and sarkarfood — eight categories with two owners each.
  sarkarmart: [
    "ac repair", "air conditioner", "appliance", "mobile phone", "electronics",
    "computer", "laptop", "printer", "repair shop", "hardware store",
    "mobile repair", "smartphone repair", "tablet repair", "refrigerator",
    "white goods", "electronic components",
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
    "cosmetics", "perfume", "watch store", "department store", "general store",
    "sports goods", "pet store", "music store", "handicraft",
  ],
  sarkartravel: [
    "hotel", "guest house", "hostel", "travel", "tour ", "resort", "lodge",
  ],

  // The booking vertical: car wash, detailing and service. This is the one
  // brand whose listings carry a live slot-booking flow (/book), so it owns
  // every category a customer would book a vehicle into. Deliberately tight —
  // bare "dealer", "showroom", "garage" (parking garages!) and spare-parts
  // retail stay unowned rather than leaking non-bookable businesses into the
  // booking funnel.
  sarkarcars: [
    "car wash", "car cleaning", "car detail", "vehicle detail", "detailing",
    "car service", "vehicle service", "car repair", "auto repair",
    "automobile repair", "mechanic", "denting", "painting", "car care",
    "bike wash", "bike service",
  ],
  sarkarfinance: [
    "bank", "insurance", "stock brok", "mutual fund", "chartered account",
    "accounting", "tax ", "financial", "money transfer", "loan", "paytm",
  ],
  sarkarlegal: [
    "law firm", "legal", "advocate", "notary", "lawyer",
  ],
  sarkared: [
    "school", "college", "university", "institute", "academy", "coaching",
    "tutor", "education", "training", "preschool", "language school",
    "driving school",
  ],
  sarkarjobs: [
    "recruit", "human resources", "staffing", "placement", "hr ",
  ],
};

/**
 * Does this brand publish the business directory at all?
 *
 * `features.listings` already governs whether "Listings" appears in the nav,
 * but the ROUTES were never gated — so all 16 brands with the flag off still
 * served /marketplace, /categories and every /<category>-in-indore page. That
 * put the same ~19k listings and ~320 category pages on 27 hostnames: roughly
 * 8,600 near-duplicate URLs competing with each other, with each brand's
 * sitemap dutifully submitting its copy to Google. The flag now gates the
 * routes as well as the nav.
 */
export function brandPublishesDirectory(
  brand: { slug?: string; features?: any } | null,
): boolean {
  if (!Boolean((brand?.features ?? {}).listings)) return false;
  const slug = (brand?.slug ?? "").toLowerCase();
  // The flag alone is not enough: a brand also needs something to show. Only
  // the full-directory owner or a brand with its own keyword slice qualifies,
  // so an unmapped brand 404s instead of rendering an empty directory.
  return FULL_DIRECTORY_BRANDS.has(slug) || Boolean(BRAND_CATEGORY_KEYWORDS[slug]);
}

/**
 * The single brand that publishes the entire directory.
 *
 * Was {sarkarmarketplace, sarkarbazaar, justdial-agent}. Three brands serving
 * the identical 320 category pages meant /plumber-in-indore existed three times
 * over, competing with itself — Google picks one canonical and can suppress the
 * others, which risks suppressing the one you actually want ranking. Narrowed
 * to one owner on 2026-08-10 at the user's direction.
 */
export const FULL_DIRECTORY_BRANDS = new Set([
  "sarkarmarketplace",
]);

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
  // means "no directory", and `brandPublishesDirectory` turns that into a 404
  // rather than an empty page. Add a keyword list above to give a brand a slice.
  if (!keywords) return [];
  return allCategories.filter((c) => {
    const lc = (c ?? "").toLowerCase();
    return keywords.some((k) => lc.includes(k));
  });
}
