import { BrandHeader, BrandFooter } from "../brand-header";
import {
  CITY_LABEL,
  categoryPath,
  categoryAreaPath,
  getCategoryIndex,
  getCategoryAreaIndex,
  getCategoryListings,
  titleize,
  type CategoryStat,
  type Listing,
} from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";
import { safeJsonLd } from "@/lib/json-ld";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { SectionHeading } from "@/components/directory/SectionHeading";

const PAGE_SIZE = 30;
const RELATED = 10;

export async function CategoryLandingPage({
  brand,
  category,
  page,
}: {
  brand: any;
  category: CategoryStat;
  page: number;
}) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";

  const label = titleize(category.category);
  const origin = ``;
  const base = `${origin}${categoryPath(category.category)}`;

  const [{ rows, total }, index] = await Promise.all([
    getCategoryListings(category.category, page, PAGE_SIZE),
    getCategoryIndex(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Ten related categories, not twenty-four. Enough to keep the crawl graph
  // connected without turning the foot of every page into another link wall.
  const related = index.filter((c) => c.slug !== category.slug).slice(0, RELATED);
  // Localities this category actually exists in — used for the "by area" links
  // that point at the neighbourhood landing pages.
  const areaIdx = await getCategoryAreaIndex(category.category);
  const topAreas = areaIdx.slice(0, 10);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} in ${CITY_LABEL}`,
    numberOfItems: total,
    itemListElement: rows.slice(0, 20).map((b: Listing, i: number) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + i + 1,
      item: {
        "@type": "LocalBusiness",
        name: b.name,
        ...(b.address ? { address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city ?? CITY_LABEL, addressRegion: "Madhya Pradesh", addressCountry: "IN" } } : {}),
        ...(b.phone ? { telephone: b.phone } : {}),
        ...(b.website ? { url: b.website } : {}),
        ...(b.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: b.rating, bestRating: 5, ...(b.reviews_count != null ? { reviewCount: b.reviews_count } : {}) } } : {}),
      },
    })),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: brand.name, item: origin },
      { "@type": "ListItem", position: 2, name: "Directory", item: `${origin}/marketplace` },
      { "@type": "ListItem", position: 3, name: `${label} in ${CITY_LABEL}`, item: base },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }} />
      <BrandHeader brand={brand} />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden" style={{ borderBottom: "1px solid var(--hairline)" }}>
          <div className="aurora" />
          <div className="mx-auto max-w-6xl px-6 pt-10 pb-9">
            <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
              <a href={origin} className="press hover:text-ink-2">{brand.name}</a>
              <span aria-hidden="true">›</span>
              <a href={`${origin}/categories`} className="press hover:text-ink-2">Categories</a>
              <span aria-hidden="true">›</span>
              <span className="text-ink-3">{label}</span>
            </nav>

            <div className="flex items-start gap-4">
              <span
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "var(--surface-raised)", color: "var(--brand-secondary)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-2)" }}
              >
                <CategoryIcon category={category.category} size={26} />
              </span>
              <div className="min-w-0">
                <h1 className="heading-xl">
                  {label} in {CITY_LABEL}
                </h1>
                <p className="text-lede mt-3 max-w-2xl">
                  Sorted by rating, with phone numbers you can call straight away.
                </p>
              </div>
            </div>

            <form action={`${origin}/marketplace`} method="GET" className="mt-7 max-w-xl">
              <div
                className="flex items-center gap-2 rounded-2xl border p-1.5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", boxShadow: "var(--shadow-2)" }}
              >
                <span className="pl-3 text-ink-3" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                  </svg>
                </span>
                <input name="q" placeholder={`Search ${label.toLowerCase()} or anything else`}
                       aria-label="Search businesses"
                       className="flex-1 bg-transparent px-1.5 py-2.5 text-[1rem] text-ink outline-none placeholder:text-ink-4" />
                <button type="submit" className="btn-primary btn-sm">
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── LISTINGS ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-11">
          {rows.length === 0 ? (
            <div className="card px-6 py-16 text-center">
              <p className="heading-sm">No listings in this category yet</p>
              <a href={`${origin}/categories`} className="press mt-3 inline-block text-sm font-semibold" style={{ color: "var(--brand-secondary)" }}>
                Browse all categories →
              </a>
            </div>
          ) : (
            <>
              <SectionHeading
                title={page > 1 ? `${label} — page ${page}` : `Top rated ${label.toLowerCase()}`}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map((b: Listing) => (
                  <BusinessCard key={b.id} b={b} primary={primary} secondary={secondary} />
                ))}
              </div>

              {pages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2 text-sm">
                  {page > 1 && (
                    <a href={page === 2 ? base : `${base}?page=${page - 1}`} rel="prev"
                       className="btn-secondary btn-sm">← Previous</a>
                  )}
                  <span className="px-3 text-ink-3">Page {page} of {pages}</span>
                  {page < pages && (
                    <a href={`${base}?page=${page + 1}`} rel="next"
                       className="btn-secondary btn-sm">Next →</a>
                  )}
                </nav>
              )}
            </>
          )}
        </section>

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <div className="card p-6 md:p-8">
            <h2 className="heading-sm mb-3">
              Finding {label.toLowerCase()} in {CITY_LABEL}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-ink-3">
              This page lists {label.toLowerCase()} businesses operating in {CITY_LABEL} and the
              surrounding areas of Madhya Pradesh, ordered by their public customer rating.
              Details come from publicly available Google Maps listings and may be out of date —
              please confirm with the business before travelling.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-3">
              Own one of these businesses?{" "}
              <a href={`${origin}/contact`} className="press font-semibold underline" style={{ color: "var(--brand-secondary)" }}>
                Claim or correct your listing
              </a>.
            </p>
          </div>
        </section>

        {/* ── AREAS ───────────────────────────────────────────────────── */}
        {topAreas.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-4">
            <SectionHeading
              title={`${label} by area`}
              subtitle={`Browse ${label.toLowerCase()} across neighbourhoods in ${CITY_LABEL}`}
            />
            <div className="flex flex-wrap gap-2">
              {topAreas.map((a) => (
                <a
                  key={a.slug}
                  href={categoryAreaPath(category.category, a.area)}
                  className="chip"
                >
                  {titleize(a.area)} <span className="text-ink-3">({a.count})</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── RELATED ──────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-11">
            <SectionHeading title="Other categories" viewAllHref="/categories" viewAllLabel="Browse all" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {related.map((c) => (
                <CategoryCard key={c.slug} category={c.category} count={c.count} primary={primary} secondary={secondary} />
              ))}
            </div>
          </section>
        )}
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
