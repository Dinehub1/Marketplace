import { BrandHeader, BrandFooter } from "../brand-header";
import {
  CITY_LABEL,
  categoryPath,
  categoryAreaPath,
  getCategoryAreaIndex,
  getCategoryAreaListings,
  getCategoryIndex,
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

export async function CategoryAreaPage({
  brand,
  category,
  area,
  page,
}: {
  brand: any;
  category: CategoryStat;
  area: string;
  page: number;
}) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";

  const label = titleize(category.category);
  const areaLabel = titleize(area);
  const origin = ``;
  const base = `${origin}${categoryAreaPath(category.category, area)}`;

  const [{ rows, total }, index, areaIdx] = await Promise.all([
    getCategoryAreaListings(category.category, area, page, PAGE_SIZE),
    getCategoryIndex(),
    getCategoryAreaIndex(category.category),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const related = index.filter((c) => c.slug !== category.slug).slice(0, RELATED);
  const otherAreas = areaIdx.filter((a) => a.area !== area).slice(0, 12);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} in ${areaLabel}, ${CITY_LABEL}`,
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
      { "@type": "ListItem", position: 3, name: `${label} in ${CITY_LABEL}`, item: `${origin}${categoryPath(category.category)}` },
      { "@type": "ListItem", position: 4, name: `${label} in ${areaLabel}`, item: base },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }} />
      <BrandHeader brand={brand} />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-black/[0.06]">
          <div className="absolute inset-0 -z-10"
               style={{ background: `radial-gradient(110% 90% at 20% 0%, ${primary}12 0%, transparent 60%)` }} />
          <div className="mx-auto max-w-6xl px-6 pt-10 pb-9">
            <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
              <a href={origin} className="press hover:text-neutral-600">{brand.name}</a>
              <span aria-hidden="true">›</span>
              <a href={`${origin}/categories`} className="press hover:text-neutral-600">Categories</a>
              <span aria-hidden="true">›</span>
              <a href={`${origin}${categoryPath(category.category)}`} className="press hover:text-neutral-600">{label}</a>
              <span aria-hidden="true">›</span>
              <span className="text-neutral-500">{areaLabel}</span>
            </nav>

            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05]"
                    style={{ color: primary }}>
                <CategoryIcon category={category.category} size={26} />
              </span>
              <div className="min-w-0">
                <h1 className="text-[1.9rem] md:text-[2.7rem] font-extrabold text-neutral-900"
                    style={{ letterSpacing: "-0.034em", lineHeight: 1.06, textWrap: "balance" }}>
                  {label} in {areaLabel}
                </h1>
                <p className="mt-2.5 max-w-2xl text-base text-neutral-500" style={{ lineHeight: 1.6 }}>
                  {label.toLowerCase()} businesses in {areaLabel}, {CITY_LABEL}, sorted by rating — with phone numbers you can call straight away.
                </p>
              </div>
            </div>

            <form action={`${origin}/marketplace`} method="GET" className="mt-7 max-w-xl">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,16,24,0.05)]">
                <span className="pl-3 text-neutral-400" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                  </svg>
                </span>
                <input name="q" placeholder={`Search ${label.toLowerCase()} in ${areaLabel.toLowerCase()}`}
                       aria-label="Search businesses"
                       className="flex-1 bg-transparent px-1.5 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none" />
                <input type="hidden" name="cat" value={category.category} />
                <input type="hidden" name="area" value={area} />
                <button type="submit" className="press rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── LISTINGS ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-11">
          {rows.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-black/[0.05]">
              <p className="text-lg font-semibold text-neutral-900">No listings here yet</p>
              <a href={`${origin}${categoryPath(category.category)}`} className="press mt-3 inline-block text-sm font-semibold" style={{ color: primary }}>
                See all {label.toLowerCase()} in {CITY_LABEL} →
              </a>
            </div>
          ) : (
            <>
              <SectionHeading
                title={page > 1 ? `${label} in ${areaLabel} — page ${page}` : `${label} in ${areaLabel}`}
                subtitle={`${total.toLocaleString("en-IN")} ${total === 1 ? "business" : "businesses"} in ${areaLabel}`}
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
                       className="press rounded-xl bg-white px-4 py-2.5 font-semibold text-neutral-700 ring-1 ring-black/[0.06]">← Previous</a>
                  )}
                  <span className="px-3 text-neutral-400">Page {page} of {pages}</span>
                  {page < pages && (
                    <a href={`${base}?page=${page + 1}`} rel="next"
                       className="press rounded-xl bg-white px-4 py-2.5 font-semibold text-neutral-700 ring-1 ring-black/[0.06]">Next →</a>
                  )}
                </nav>
              )}
            </>
          )}
        </section>

        {/* ── OTHER AREAS ──────────────────────────────────────────────── */}
        {otherAreas.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-4">
            <SectionHeading title={`More areas for ${label.toLowerCase()}`} subtitle={`Browse ${label.toLowerCase()} across ${CITY_LABEL}`} />
            <div className="flex flex-wrap gap-2">
              {otherAreas.map((a) => (
                <a key={a.slug} href={categoryAreaPath(category.category, a.area)}
                   className="press inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 ring-1 ring-black/[0.05] hover:bg-neutral-50">
                  {titleize(a.area)} <span className="text-neutral-400">({a.count})</span>
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
