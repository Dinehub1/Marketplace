import { BrandHeader, BrandFooter } from "../brand-header";
import { LeadForm } from "./lead-form";
import { ClaimBox } from "./claim-box";
import { ReviewsBox } from "./reviews-box";
import { CITY_LABEL, categoryPath, cleanBusinessName, localityOf, titleize, telHref, waHref } from "@/lib/categories";
import { safeJsonLd } from "@/lib/json-ld";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { CategoryIcon } from "@/lib/icons";
import { CategoryCover } from "@/components/category-cover";

async function getBusiness(id: number) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const res = await fetch(`${url}/rest/v1/businesses?id=eq.${id}&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Others in the same category — gives the page somewhere to go instead of
 *  being a dead end for both the visitor and the crawler. */
async function getRelated(category: string | null, excludeId: number) {
  if (!category) return [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/businesses?select=id,name,area,rating,reviews_count,phone` +
        `&status=eq.active&category=eq.${encodeURIComponent(category)}` +
        `&id=neq.${excludeId}&order=rating.desc.nullslast&limit=6`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 1800 } },
    );
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

async function getBusinessReviews(id: number) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { reviews: [], avg: null, count: 0 };
    const res = await fetch(
      `${url}/rest/v1/reviews?business_id=eq.${id}&is_approved=eq.true` +
        `&select=id,reviewer_name,rating,comment,created_at&order=created_at.desc&limit=50`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" }, next: { revalidate: 120 } },
    );
    if (!res.ok) return { reviews: [], avg: null, count: 0 };
    const rows = (await res.json()) as any[];
    const reviews = rows.map((r) => ({
      id: r.id,
      author_name: r.reviewer_name,
      body: r.comment,
      rating: r.rating,
      created_at: r.created_at,
    }));
    const count = Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || reviews.length;
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    return { reviews, avg, count };
  } catch {
    return { reviews: [], avg: null, count: 0 };
  }
}

export async function BusinessDetailPage({ brand, businessId }: { brand: any; businessId: number }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const origin = ``;

  const biz = await getBusiness(businessId);

  if (!biz) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
        <BrandHeader brand={brand} />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-sm">
            <div className="mb-4 flex justify-center text-neutral-300"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg></div>
            <h1 className="heading-md mb-2" style={{ color: primary }}>Business not found</h1>
            {/* An error should say what to do next, not just what went wrong. */}
            <p className="text-sm opacity-60 mb-6">
              This listing may have been removed. Browse similar businesses in the directory.
            </p>
            <a href={`${origin}/marketplace`} className="btn-primary">Open directory</a>
          </div>
        </main>
        <BrandFooter brand={brand} />
      </div>
    );
  }

  const related = await getRelated(biz.category, biz.id);
  const { reviews, avg, count: reviewCount } = await getBusinessReviews(biz.id);
  const mapsUrl =
    biz.lat && biz.lng
      ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}`
      : biz.address
        ? `https://www.google.com/maps/search/${encodeURIComponent(`${biz.name} ${biz.address}`)}`
        : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: biz.name,
    ...(biz.category ? { additionalType: biz.category } : {}),
    ...(biz.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: biz.address,
            addressLocality: biz.city ?? CITY_LABEL,
            addressRegion: "Madhya Pradesh",
            postalCode: biz.pincode ?? undefined,
            addressCountry: "IN",
          },
        }
      : {}),
    ...(biz.phone ? { telephone: biz.phone } : {}),
    ...(biz.website ? { url: biz.website } : {}),
    ...(biz.lat && biz.lng ? { geo: { "@type": "GeoCoordinates", latitude: biz.lat, longitude: biz.lng } } : {}),
    ...(biz.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: biz.rating, bestRating: 5, ...(biz.reviews_count != null ? { reviewCount: biz.reviews_count } : {}) } } : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: brand.name, item: origin },
      { "@type": "ListItem", position: 2, name: "Directory", item: `${origin}/marketplace` },
      ...(biz.category
        ? [{ "@type": "ListItem", position: 3, name: `${titleize(biz.category)} in ${CITY_LABEL}`, item: `${origin}${categoryPath(biz.category)}` }]
        : []),
      { "@type": "ListItem", position: biz.category ? 4 : 3, name: biz.name, item: `${origin}/business/${biz.id}` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }} />
      <BrandHeader brand={brand} />

      <section className="border-b border-black/[0.06] px-6 pt-8 pb-7" style={{ background: `linear-gradient(135deg, ${primary}10, ${secondary}06)` }}>
        <CategoryCover category={biz.category} primary={primary} secondary={secondary} className="-mx-6 -mt-8 mb-6 h-36 w-full rounded-b-2xl" />
        <div className="mx-auto max-w-5xl">
          {/* Wayfinding: the trail leads back to the category the visitor most
              likely arrived from, not just to the directory root. */}
          <nav className="text-xs opacity-55 flex flex-wrap items-center gap-1.5">
            <a href={`${origin}/marketplace`} className="press hover:underline">Directory</a>
            {biz.category && (
              <>
                <span aria-hidden="true">›</span>
                <a href={`${origin}${categoryPath(biz.category)}`} className="press hover:underline">
                  {titleize(biz.category)} in {CITY_LABEL}
                </a>
              </>
            )}
          </nav>

          <div className="mt-4 flex items-start gap-4 md:gap-5">
            <span className="flex h-16 w-16 md:h-20 md:w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05]" style={{ color: primary }}>
              <CategoryIcon category={biz.category ?? ""} size={30} />
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="heading-md text-neutral-900">{cleanBusinessName(biz.name)}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {biz.category && (
                  <a href={`${origin}${categoryPath(biz.category)}`} className="press rounded-full border px-3 py-1 text-xs font-medium bg-white" style={{ borderColor: `${accent}40`, color: primary }}>
                    {titleize(biz.category)}
                  </a>
                )}
                {biz.rating != null && <span className="text-amber-500 font-semibold">★ {biz.rating}{biz.reviews_count != null && <span className="font-normal text-neutral-400"> ({biz.reviews_count.toLocaleString("en-IN")})</span>}</span>}
                {reviewCount > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {reviewCount} review{reviewCount === 1 ? "" : "s"} on {brand.name}
                  </span>
                )}
                {/* Verified is data-driven: only renders once a business has been
                    claimed and verified (Phase 3). No fake "✓ Verified" badges —
                    those were removed because every row carried one. */}
                {biz.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.5 16.2 4.8 11.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4z"/></svg>
                    Verified
                  </span>
                )}
                {biz.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z"/></svg>
                    Featured
                  </span>
                )}
                {(biz.area || biz.city) && <span className="text-xs opacity-50 capitalize">{localityOf(biz)}</span>}
              </div>
            </div>
          </div>

          {/* Calling IS the conversion on a local directory, so it is the
              primary action at the top of the page — not the fourth row of an
              info list, which is where it used to sit. */}
          {biz.phone && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href={telHref(biz.phone)} className="btn-primary" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/></svg> {biz.phone}
              </a>
              <a
                href={waHref(biz.phone, `Hi ${biz.name}, I found you on ${brand.name} and would like to enquire.`)}
                target="_blank" rel="noopener noreferrer"
                className="btn-secondary"
                style={{ borderColor: "#25D366", color: "#1faa52" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.37a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.13c-.25.69-1.45 1.32-1.99 1.36-.53.04-1.07.24-3.62-.75-2.99-1.13-4.9-4.02-5.05-4.21-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.51.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.45.5-.15.14-.3.3-.13.58.17.28.75 1.24 1.61 2.01 1.11 1.11 2.04 1.45 2.32 1.61.28.16.44.14.6-.09.17-.23.71-.83.9-1.11.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.69-.18 1.38z"/></svg> WhatsApp
              </a>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ borderColor: accent, color: primary }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 4 6 2 5-2v14l-5 2-6-2-5 2V6z"/><path d="M9 4v14M15 6v14"/></svg> Directions
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-7 md:py-9">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
          <div className="md:col-span-3 space-y-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}30` }}>
              <h2 className="font-bold mb-4" style={{ color: primary }}>Business details</h2>
              <div className="space-y-4 text-sm">
                {biz.address && (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 text-neutral-400"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg></span>
                    <div>
                      <p className="opacity-75">{biz.address}</p>
                      {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="press text-xs underline" style={{ color: primary }}>Open in Google Maps</a>}
                    </div>
                  </div>
                )}
                {biz.phone && (
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 text-neutral-400"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/></svg></span>
                    <a href={telHref(biz.phone)} className="press font-semibold" style={{ color: primary }}>{biz.phone}</a>
                  </div>
                )}
                {biz.website && (
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 text-neutral-400"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg></span>
                    <a href={biz.website} target="_blank" rel="noopener nofollow noreferrer" className="press font-medium break-all" style={{ color: primary }}>
                      {biz.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {biz.rating != null && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z"/></svg>
                    </span>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {biz.rating} <span className="font-normal text-neutral-400">/ 5</span>
                        {biz.reviews_count != null && <span className="ml-1 font-normal text-neutral-500">· {biz.reviews_count.toLocaleString("en-IN")} reviews</span>}
                      </p>
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="press text-xs underline" style={{ color: primary }}>
                          Read reviews on Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Honesty: the old badge read "✓ Verified listing" whenever the
                  `source` column was set — which is every single row. Nothing
                  had been verified by anyone. Saying where the data actually
                  came from keeps the trust the badge was borrowing. */}
              <p className="mt-5 pt-4 border-t text-xs opacity-45 leading-relaxed" style={{ borderColor: `${accent}25` }}>
                This listing comes from publicly available Google Maps data and may be out of date.
                Please confirm with the business before travelling.
                {" "}
                <a href={`${origin}/contact`} className="underline" style={{ color: primary }}>Report incorrect information</a>.
              </p>
            </div>

            {biz.phone ? (
              <ClaimBox
                businessId={biz.id}
                businessName={biz.name}
                businessPhone={biz.phone}
                primary={primary}
                secondary={secondary}
                accent={accent}
              />
            ) : (
              <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}30` }}>
                <h2 className="font-bold mb-2" style={{ color: primary }}>Own this business?</h2>
                <p className="text-sm opacity-60 mb-3">See your leads and manage this listing — sign in with your WhatsApp number.</p>
                <a href={`${origin}/business-dashboard`} className="press inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: `${accent}50`, color: primary }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg> Open business dashboard
                </a>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm md:sticky md:top-24" style={{ borderColor: `${accent}30` }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: primary }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg> Get in touch</h2>
              <p className="text-xs opacity-50 mb-5">Verify with WhatsApp and the business receives your enquiry straight away.</p>
              <LeadForm businessId={biz.id} businessName={biz.name} primary={primary} secondary={secondary} accent={accent} />
            </div>
          </div>
        </div>

        <section className="mt-12">
          <ReviewsBox
            businessId={biz.id}
            initialReviews={reviews}
            avg={avg}
            count={reviewCount}
            primary={primary}
            secondary={secondary}
            accent={accent}
            brandName={brand.name}
          />
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-bold mb-4" style={{ color: primary }}>
              More {biz.category ? titleize(biz.category) : "businesses"} in {CITY_LABEL}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r: any) => (
                <BusinessCard key={r.id} b={r} primary={primary} secondary={secondary} />
              ))}
            </div>
            {biz.category && (
              <a href={`${origin}${categoryPath(biz.category)}`} className="press mt-5 inline-block text-sm font-semibold underline" style={{ color: primary }}>
                See all {titleize(biz.category)} in {CITY_LABEL} →
              </a>
            )}
          </section>
        )}
      </main>

      {/* Mobile action bar. On a phone the call button scrolls out of reach as
          soon as you read the address; this keeps the primary action anchored
          without stealing a fixed strip on desktop. */}
      {/* The bar is solid, not translucent. A blurred material is the nicer
          surface, but backdrop-filter is unevenly composited and missing
          altogether in some embedded webviews — page text was reading straight
          through the bar behind the primary call button. Legibility of the one
          control that converts beats material fidelity. */}
      {biz.phone && (
        <div className="md:hidden sticky bottom-0 z-40 flex items-stretch gap-2.5 border-t border-black/[0.08] bg-white px-4 py-3 shadow-[0_-6px_20px_-8px_rgba(16,16,24,0.16)]" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <a href={telHref(biz.phone)} className="btn-primary flex-1" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/></svg> Call
          </a>
          <a
            href={waHref(biz.phone, `Hi ${biz.name}, I found you on ${brand.name} and would like to enquire.`)}
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary" style={{ borderColor: "#25D366", color: "#1faa52" }} aria-label="WhatsApp"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.37a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.13c-.25.69-1.45 1.32-1.99 1.36-.53.04-1.07.24-3.62-.75-2.99-1.13-4.9-4.02-5.05-4.21-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.51.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.45.5-.15.14-.3.3-.13.58.17.28.75 1.24 1.61 2.01 1.11 1.11 2.04 1.45 2.32 1.61.28.16.44.14.6-.09.17-.23.71-.83.9-1.11.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.69-.18 1.38z"/></svg>
          </a>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ borderColor: accent, color: primary }} aria-label="Directions"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 4 6 2 5-2v14l-5 2-6-2-5 2V6z"/><path d="M9 4v14M15 6v14"/></svg></a>
          )}
        </div>
      )}

      <BrandFooter brand={brand} />
    </div>
  );
}
