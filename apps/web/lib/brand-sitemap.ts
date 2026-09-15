/**
 * Per-brand sitemaps.
 *
 * One config, 26 brands, no shared template: each brand's navigation and its
 * semantic routes are authored from what that brand actually covers, and each
 * route resolves to REAL data through the category index.
 *
 * Route kinds:
 *   category  — a listing page for the categories whose names match `match`
 *               (matched against the live category index, so a rename in the
 *               database cannot silently produce an empty page).
 *   detail    — /<something>/<id>, the real business page under a name this
 *               brand's visitors would look for.
 *   alias     — a route that genuinely is another page (e.g. /get-quote -> the
 *               quote form), rewritten internally rather than redirected.
 *   form      — a lead/booking form that already exists in the app.
 *
 * Deliberately NOT included: routes that cannot be backed by real data or real
 * copy. sarkarjobs has no jobs table, sarkarsarkar has no scheme data, and the
 * SaaS brands have no authored documentation. Inventing those would break the
 * "no fake functionality, no fake claims" rule, so they are omitted rather than
 * shipped as empty pages. See docs/brand-plan-vs-reality.md.
 */

export type BrandRoute =
  | { path: string; label: string; kind: "category"; match: string[]; blurb?: string }
  | { path: string; label: string; kind: "detail"; prefix: string }
  | { path: string; label: string; kind: "alias"; to: string }
  | { path: string; label: string; kind: "form" };

const home = { path: "/", label: "Home", kind: "alias" as const, to: "/" };

export const BRAND_SITEMAP: Record<string, BrandRoute[]> = {
  sarkarhealth: [
    home,
    { path: "/doctors", label: "Doctors", kind: "category", match: ["doctor", "dental", "eye clinic", "clinic"], blurb: "Consult a doctor in Indore" },
    { path: "/hospitals", label: "Hospitals", kind: "category", match: ["hospital", "nursing home"], blurb: "Hospitals and nursing homes" },
    { path: "/diagnostics", label: "Diagnostics", kind: "category", match: ["diagnostic", "patholog", "scan"], blurb: "Labs, scans and diagnostics" },
    { path: "/pharmacies", label: "Pharmacies", kind: "category", match: ["pharmacy", "medical store", "pharma wholesale"], blurb: "Pharmacies and medical stores" },
    { path: "/doctor", label: "Doctor", kind: "detail", prefix: "/doctor" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarghar: [
    home,
    { path: "/plumbers", label: "Plumbers", kind: "category", match: ["plumber"], blurb: "Plumbers near you" },
    { path: "/electricians", label: "Electricians", kind: "category", match: ["electrician"], blurb: "Electricians near you" },
    { path: "/carpenters", label: "Carpenters", kind: "category", match: ["carpenter", "furniture"], blurb: "Carpenters and furniture work" },
    { path: "/painters", label: "Painters", kind: "category", match: ["painter", "denting", "painting"], blurb: "Painting and denting work" },
    { path: "/service", label: "Service", kind: "detail", prefix: "/service" },
    { path: "/get-quote", label: "Get a quote", kind: "alias", to: "/quote" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarcars: [
    home,
    { path: "/used-cars", label: "Cars & dealers", kind: "category", match: ["car dealer", "tyre", "car accessories"], blurb: "Car dealers in Indore" },
    { path: "/services", label: "Service & repair", kind: "category", match: ["auto repair", "garage", "car wash"], blurb: "Repair, denting and detailing" },
    { path: "/car-details", label: "Car", kind: "detail", prefix: "/car-details" },
    { path: "/sell-your-car", label: "Sell your car", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarfood: [
    home,
    { path: "/restaurants", label: "Restaurants", kind: "category", match: ["restaurant", "fast food", "ice cream", "dessert", "cafe"], blurb: "Where to eat in Indore" },
    { path: "/sweets", label: "Sweets", kind: "category", match: ["sweet", "dessert"], blurb: "Sweet shops and mithai" },
    { path: "/caterers", label: "Caterers", kind: "category", match: ["caterer", "baker"], blurb: "Caterers for functions" },
    { path: "/restaurant", label: "Restaurant", kind: "detail", prefix: "/restaurant" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkardukaan: [
    home,
    { path: "/shops", label: "Shops", kind: "category", match: ["shop", "store", "market"], blurb: "Shops and stores in Indore" },
    { path: "/grocery", label: "Grocery", kind: "category", match: ["grocery", "kirana"], blurb: "Grocery and daily needs" },
    { path: "/jewellery", label: "Jewellery", kind: "category", match: ["jewellery", "watch"], blurb: "Jewellers and watch stores" },
    { path: "/shop", label: "Shop", kind: "detail", prefix: "/shop" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarmart: [
    home,
    { path: "/products", label: "Products", kind: "category", match: ["shop", "store", "wholesale"], blurb: "Products and suppliers" },
    { path: "/furniture", label: "Furniture", kind: "category", match: ["furniture"], blurb: "Furniture stores" },
    { path: "/store", label: "Store", kind: "detail", prefix: "/store" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarwellness: [
    home,
    { path: "/gyms", label: "Gyms", kind: "category", match: ["gym", "fitness"], blurb: "Gyms and fitness centres" },
    { path: "/salons", label: "Salons", kind: "category", match: ["salon", "nail"], blurb: "Salons and beauty parlours" },
    { path: "/spas", label: "Spas", kind: "category", match: ["spa", "wellness"], blurb: "Spas and wellness centres" },
    { path: "/clinics", label: "Clinics", kind: "category", match: ["cosmetic clinic", "clinic"], blurb: "Clinics and treatments" },
    { path: "/centre", label: "Centre", kind: "detail", prefix: "/centre" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkared: [
    home,
    { path: "/schools", label: "Schools", kind: "category", match: ["school", "preschool"], blurb: "Schools in Indore" },
    { path: "/coaching", label: "Coaching", kind: "category", match: ["coaching", "training"], blurb: "Coaching and training centres" },
    { path: "/colleges", label: "Colleges", kind: "category", match: ["college", "institute", "university"], blurb: "Colleges and institutes" },
    { path: "/institute", label: "Institute", kind: "detail", prefix: "/institute" },
    { path: "/enquiry", label: "Enquiry", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarskills: [
    home,
    { path: "/courses", label: "Courses", kind: "category", match: ["computer training", "training", "institute", "coaching"], blurb: "Skill courses in Indore" },
    { path: "/trainers", label: "Trainers", kind: "category", match: ["training", "coaching"], blurb: "Trainers and institutes" },
    { path: "/course", label: "Course", kind: "detail", prefix: "/course" },
    { path: "/enrol", label: "Enrol", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sikshahub: [
    home,
    { path: "/courses", label: "Courses", kind: "category", match: ["computer training", "training", "institute"], blurb: "Courses in Indore" },
    { path: "/institutes", label: "Institutes", kind: "category", match: ["institute", "school", "college"], blurb: "Institutes in Indore" },
    { path: "/course", label: "Course", kind: "detail", prefix: "/course" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarlegal: [
    home,
    { path: "/advocates", label: "Advocates", kind: "category", match: ["lawyer", "advocate", "legal"], blurb: "Advocates and lawyers" },
    { path: "/notaries", label: "Notaries", kind: "category", match: ["notary", "stamp"], blurb: "Notary services" },
    { path: "/services", label: "Services", kind: "alias", to: "/services" },
    { path: "/advocate", label: "Advocate", kind: "detail", prefix: "/advocate" },
    { path: "/consult", label: "Consult", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarfinance: [
    home,
    { path: "/loans", label: "Loans", kind: "category", match: ["loan", "financial"], blurb: "Loans and finance" },
    { path: "/insurance", label: "Insurance", kind: "category", match: ["insurance"], blurb: "Insurance agents and brokers" },
    { path: "/advisors", label: "Advisors", kind: "category", match: ["financial advis", "tax", "account"], blurb: "Financial and tax advisors" },
    { path: "/advisor", label: "Advisor", kind: "detail", prefix: "/advisor" },
    { path: "/apply", label: "Apply", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkartravel: [
    home,
    { path: "/packages", label: "Packages", kind: "category", match: ["travel", "tour"], blurb: "Tour and travel packages" },
    { path: "/hotels", label: "Hotels", kind: "category", match: ["hotel", "guest house", "resort"], blurb: "Hotels and stays" },
    { path: "/agents", label: "Agents", kind: "category", match: ["travel"], blurb: "Travel agents in Indore" },
    { path: "/agent", label: "Agent", kind: "detail", prefix: "/agent" },
    { path: "/enquiry", label: "Enquiry", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarconnect: [
    home,
    { path: "/industries", label: "Industries", kind: "category", match: ["manufactur", "industrial"], blurb: "Manufacturers and industrial suppliers" },
    { path: "/suppliers", label: "Suppliers", kind: "category", match: ["wholesal", "distributor", "supplier"], blurb: "Wholesalers and distributors" },
    { path: "/directory", label: "Directory", kind: "alias", to: "/marketplace" },
    { path: "/company", label: "Company", kind: "detail", prefix: "/company" },
    { path: "/post-requirement", label: "Post requirement", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarbazaar: [
    home,
    { path: "/manufacturers", label: "Manufacturers", kind: "category", match: ["manufactur"], blurb: "Manufacturers in Indore" },
    { path: "/wholesalers", label: "Wholesalers", kind: "category", match: ["wholesal", "distributor"], blurb: "Wholesale and distribution" },
    { path: "/packaging", label: "Packaging", kind: "category", match: ["packaging", "plastic"], blurb: "Packaging and plastics" },
    { path: "/company", label: "Company", kind: "detail", prefix: "/company" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkardost: [
    home,
    { path: "/services", label: "Services", kind: "alias", to: "/services" },
    { path: "/professionals", label: "Professionals", kind: "category", match: ["service", "consultant", "agency"], blurb: "Local professionals" },
    { path: "/pro", label: "Professional", kind: "detail", prefix: "/pro" },
    { path: "/book", label: "Book", kind: "alias", to: "/booking" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarsarkar: [
    home,
    { path: "/services", label: "Services", kind: "alias", to: "/services" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
  ],
  yaadrakh: [
    home,
    { path: "/places", label: "Places", kind: "category", match: ["temple", "church", "gurudwara", "mosque"], blurb: "Places of worship and heritage" },
    { path: "/temples", label: "Temples", kind: "category", match: ["hindu temple", "temple", "mandir"], blurb: "Temples in Indore" },
    { path: "/churches", label: "Churches", kind: "category", match: ["church"], blurb: "Churches in Indore" },
    { path: "/place", label: "Place", kind: "detail", prefix: "/place" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  ayurvedicwebsite: [
    home,
    { path: "/treatments", label: "Treatments", kind: "category", match: ["ayurved", "homeopathy", "panchakarma"], blurb: "Ayurvedic treatments" },
    { path: "/doctors", label: "Doctors", kind: "category", match: ["doctor", "ayurved", "homeopathy"], blurb: "Ayurvedic doctors" },
    { path: "/centres", label: "Centres", kind: "category", match: ["clinic", "hospital"], blurb: "Treatment centres" },
    { path: "/bookings", label: "Bookings", kind: "alias", to: "/booking" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  "hyperframes-realestate": [
    home,
    { path: "/projects", label: "Projects", kind: "category", match: ["apartment builder", "property developer", "builder"], blurb: "Builders and projects" },
    { path: "/properties", label: "Properties", kind: "category", match: ["real estate", "property", "estate agent"], blurb: "Property and estate agents" },
    { path: "/property", label: "Property", kind: "detail", prefix: "/property" },
    { path: "/enquiry", label: "Enquiry", kind: "alias", to: "/contact" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  sarkarmarketplace: [
    home,
    { path: "/categories", label: "Categories", kind: "alias", to: "/categories" },
    { path: "/directory", label: "All businesses", kind: "alias", to: "/marketplace" },
    { path: "/galaxy", label: "Galaxy", kind: "alias", to: "/galaxy" },
    { path: "/about", label: "About", kind: "alias", to: "/about" },
    { path: "/contact", label: "Contact", kind: "alias", to: "/contact" },
  ],
  // Product brands: the routes that can be backed by real capability copy.
  paisaflow: [home, { path: "/features", label: "Features", kind: "alias", to: "/features" }, { path: "/pricing", label: "Pricing", kind: "alias", to: "/pricing" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
  sarkarpay: [home, { path: "/features", label: "Features", kind: "alias", to: "/features" }, { path: "/pricing", label: "Pricing", kind: "alias", to: "/pricing" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
  followup: [home, { path: "/features", label: "Features", kind: "alias", to: "/features" }, { path: "/how-it-works", label: "How it works", kind: "alias", to: "/features" }, { path: "/pricing", label: "Pricing", kind: "alias", to: "/pricing" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
  cloudplayer: [home, { path: "/features", label: "Features", kind: "alias", to: "/features" }, { path: "/pricing", label: "Pricing", kind: "alias", to: "/pricing" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
  "sarkar-ai": [home, { path: "/capabilities", label: "Capabilities", kind: "alias", to: "/features" }, { path: "/use-cases", label: "Use cases", kind: "alias", to: "/features" }, { path: "/pricing", label: "Pricing", kind: "alias", to: "/pricing" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
  "justdial-agent": [home, { path: "/features", label: "Features", kind: "alias", to: "/features" }, { path: "/how-it-works", label: "How it works", kind: "alias", to: "/features" }, { path: "/pricing", label: "Pricing", kind: "alias", to: "/pricing" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
  sarkarjobs: [home, { path: "/employers", label: "Employers", kind: "category", match: ["coworking", "consultant"], blurb: "Employers and recruiters" }, { path: "/about", label: "About", kind: "alias", to: "/about" }, { path: "/contact", label: "Contact", kind: "alias", to: "/contact" }],
};

/** Routes for a brand, or an empty list where no real-data sitemap is defined yet. */
export function routesFor(slug: string): BrandRoute[] {
  return BRAND_SITEMAP[slug] ?? [];
}

/** Does this path belong to the brand's sitemap? Returns the definition. */
export function matchBrandRoute(slug: string, subPath: string): BrandRoute | null {
  const path = subPath === "" ? "/" : subPath;
  for (const r of routesFor(slug)) {
    if (r.kind === "detail") {
      if (path.startsWith(r.prefix + "/")) return r;
      continue;
    }
    if (r.path === path) return r;
  }
  return null;
}
