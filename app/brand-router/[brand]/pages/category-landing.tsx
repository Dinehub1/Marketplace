import { BrandHeader, BrandFooter } from "../brand-header";
import {
  CITY_LABEL,
  categoryPath,
  cleanArea,
  cleanBusinessName,
  getCategoryIndex,
  getCategoryListings,
  type CategoryStat,
  type Listing,
} from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";
import { CategoryCover } from "@/components/category-cover";

const PAGE_SIZE = 30;
const RELATED = 10;

function titleize(category: string): string {
  return category.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function telHref(phone: string): string {
  const d = phone.replace(/[^\d+]/g, "");
  return `tel:${d.startsWith("+") ? d : `+91${d.replace(/^0+/, "")}`}`;
}

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
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
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
              <span className="text-neutral-500">{label}</span>
            </nav>

            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05]"
                    style={{ color: primary }}>
                <CategoryIcon category={category.category} size={26} />
              </span>
              <div className="min-w-0">
                <h1 className="text-[1.9rem] md:text-[2.7rem] font-extrabold text-neutral-900"
                    style={{ letterSpacing: "-0.034em", lineHeight: 1.06, textWrap: "balance" }}>
                  {label} in {CITY_LABEL}
                </h1>
                <p className="mt-2.5 max-w-2xl text-base text-neutral-500" style={{ lineHeight: 1.6 }}>
                  Sorted by rating, with phone numbers you can call straight away.
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
                <input name="q" placeholder={`Search ${label.toLowerCase()} or anything else`}
                       aria-label="Search businesses"
                       className="flex-1 bg-transparent px-1.5 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none" />
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
              <p className="text-lg font-semibold text-neutral-900">No listings in this category yet</p>
              <a href={`${origin}/categories`} className="press mt-3 inline-block text-sm font-semibold" style={{ color: primary }}>
                Browse all categories →
              </a>
            </div>
          ) : (
            <>
              <h2 className="mb-5 text-lg font-bold text-neutral-900" style={{ letterSpacing: "-0.015em" }}>
                {page > 1 ? `${label} — page ${page}` : `Top rated ${label.toLowerCase()}`}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map((b: Listing) => (
                  <article key={b.id}
                    className="card-lift group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(16,16,24,0.04)]">
                    <CategoryCover category={b.category ?? category.category} primary={primary} secondary={secondary} className="-mx-5 -mt-5 mb-4 h-28 w-full" />
                    <div className="flex items-start gap-3 px-5">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${primary}10`, color: primary }}>
                        <CategoryIcon category={b.category ?? category.category} size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold leading-snug text-neutral-900">
                          <a href={`${origin}/business/${b.id}`} className="after:absolute after:inset-0">{cleanBusinessName(b.name)}</a>
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                          {b.rating != null && (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" />
                              </svg>
                              {b.rating}
                              {b.reviews_count != null && (
                                <span className="font-medium text-neutral-400">({b.reviews_count.toLocaleString("en-IN")})</span>
                              )}
                            </span>
                          )}
                          {cleanArea(b.area) && <span className="truncate capitalize">{cleanArea(b.area)}</span>}
                        </div>
                      </div>
                    </div>

                    {b.address && <p className="mt-3 px-5 line-clamp-2 text-xs leading-relaxed text-neutral-500">{b.address}</p>}

                    <div className="mt-auto flex gap-2 px-5 pb-5 pt-4">
                      {b.phone ? (
                        <a href={telHref(b.phone)}
                           className="press relative z-10 inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                           style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z" />
                          </svg>
                          {b.phone}
                        </a>
                      ) : (
                        <span className="flex-1 rounded-xl bg-neutral-900/[0.04] px-3 py-2.5 text-center text-xs font-semibold text-neutral-400">
                          No phone listed
                        </span>
                      )}
                      {b.website && (
                        <a href={b.website} target="_blank" rel="noopener nofollow noreferrer"
                           className="press relative z-10 inline-flex items-center justify-center rounded-xl bg-neutral-900/[0.04] px-3 py-2.5 text-xs font-semibold text-neutral-600"
                           aria-label={`${cleanBusinessName(b.name)} website`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </article>
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

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <div className="rounded-2xl bg-white p-6 md:p-8 ring-1 ring-black/[0.05]">
            <h2 className="mb-3 text-base font-bold text-neutral-900">
              Finding {label.toLowerCase()} in {CITY_LABEL}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-neutral-500">
              This page lists {label.toLowerCase()} businesses operating in {CITY_LABEL} and the
              surrounding areas of Madhya Pradesh, ordered by their public customer rating.
              Details come from publicly available Google Maps listings and may be out of date —
              please confirm with the business before travelling.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-500">
              Own one of these businesses?{" "}
              <a href={`${origin}/contact`} className="press font-semibold underline" style={{ color: primary }}>
                Claim or correct your listing
              </a>.
            </p>
          </div>
        </section>

        {/* ── RELATED ──────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-11">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-bold text-neutral-900" style={{ letterSpacing: "-0.015em" }}>
                Other categories
              </h2>
              <a href={`${origin}/categories`} className="press text-sm font-semibold" style={{ color: primary }}>
                Browse all →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {related.map((c) => (
                <a key={c.slug} href={`${origin}${categoryPath(c.category)}`}
                   className="card-lift flex items-center gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.05]">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${primary}10`, color: primary }}>
                    <CategoryIcon category={c.category} size={17} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-700">
                    {titleize(c.category)}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
