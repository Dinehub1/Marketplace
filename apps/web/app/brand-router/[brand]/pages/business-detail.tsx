import { BrandHeader, BrandFooter } from "../brand-header";
import { LeadForm } from "./lead-form";
import { ClaimBox } from "./claim-box";
import { CITY_LABEL, categoryPath, cleanBusinessName, localityOf, titleize, telHref, waHref } from "@/lib/categories";
import { safeJsonLd } from "@/lib/json-ld";
import { BusinessCard, type BusinessCardData } from "@/components/directory/BusinessCard";
import { ReviewsBox } from "./reviews-box";
import { asRows } from "@/lib/postgrest";
import type { BusinessRow, ReviewRow } from "@/lib/db-types";
import { CategoryIcon } from "@/lib/icons";
import { CategoryCover } from "@/components/category-cover";
import { BusinessEventTracker } from "./business-event-tracker";
import type { Brand } from "@/lib/brands";

/**
 * Social profiles a business publishes on its own website, collected by
 * scripts/enrich-socials.py (they are absent from the Google Maps scrape).
 * Only high-confidence links render: the crawl found spam handles injected into
 * hacked sites, and printing those beside a business's name would be worse than
 * showing nothing at all.
 */
const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

function socialUrl(platform: string, handle: string): string {
  const h = handle.replace(/^@/, "");
  switch (platform) {
    case "instagram": return `https://instagram.com/${h}`;
    case "facebook": return `https://facebook.com/${h}`;
    case "youtube": return /^https?:/.test(handle) ? handle : `https://youtube.com/${h}`;
    case "x": return `https://x.com/${h}`;
    case "linkedin": return `https://linkedin.com/company/${h}`;
    case "whatsapp": return `https://wa.me/${h.replace(/\D/g, "")}`;
    default: return handle;
  }
}

/**
 * A socials entry as written by `scripts/enrich-socials.py`: either a bare URL or an
 * object carrying a confidence score. NOTE: no migration in this repo adds a `socials`
 * column to `businesses`, so this is read from a `select=*` in case the live database
 * has one. If it does not, the list is simply empty and the block does not render.
 */
type SocialValue = string | { handle?: string; confidence?: string } | null | undefined;
type SocialMap = Record<string, SocialValue>;

function socialLinksOf(socials: unknown): { platform: string; label: string; url: string }[] {
  if (!socials || typeof socials !== "object") return [];
  const out: { platform: string; label: string; url: string }[] = [];
  for (const [platform, v] of Object.entries(socials as SocialMap)) {
    const handle = typeof v === "string" ? v : v?.handle;
    const confidence = typeof v === "string" ? "high" : v?.confidence;
    const label = SOCIAL_LABELS[platform];
    if (!handle || !label || confidence === "low") continue;
    out.push({ platform, label, url: socialUrl(platform, String(handle)) });
  }
  return out;
}

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
    return (await asRows<BusinessRow & { socials?: SocialMap }>(res))[0] ?? null;
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
        `&status=eq.active&city=eq.${encodeURIComponent(CITY_LABEL)}&category=eq.${encodeURIComponent(category)}` +
        `&id=neq.${excludeId}&order=rating.desc.nullslast&limit=6`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 1800 } },
    );
    return res.ok ? await asRows<BusinessCardData>(res) : [];
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
    const rows = await asRows<ReviewRow>(res);
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

export async function BusinessDetailPage({ brand, businessId }: { brand: Brand; businessId: number }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const origin = ``;

  const biz = await getBusiness(businessId);

  if (!biz) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader brand={brand} />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-sm">
            <div className="mb-4 flex justify-center text-ink-4"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg></div>
            <h1 className="heading-md mb-2">Business not found</h1>
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
  const socialLinks = socialLinksOf((biz as { socials?: SocialMap }).socials);
  // A review count of 444,080 on an Indore listing is a parser artefact, not a
  // fact (the source writes "44408.0" and the importer used to strip the dot).
  // Beyond this ceiling the number is withheld instead of displayed.
  const PLAUSIBLE_REVIEWS = 20000;
  const reviewsShown =
    biz.reviews_count != null && biz.reviews_count > 0 && biz.reviews_count <= PLAUSIBLE_REVIEWS
      ? biz.reviews_count
      : null;
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
    ...((biz as any).description ? { description: (biz as any).description } : {}),
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
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }} />
      <BusinessEventTracker businessId={biz.id} brandSlug={brand.slug} city={biz.city} />
      <BrandHeader brand={brand} />

      <section className="px-6 pb-8 pt-8" style={{ background: "var(--brand-gradient-soft)", borderBottom: "1px solid var(--hairline)" }}>
        <CategoryCover category={biz.category} primary={primary} secondary={secondary} className="-mx-6 -mt-8 mb-6 h-36 w-full rounded-b-2xl" />
        <div className="mx-auto max-w-5xl">
          {/* Wayfinding: the trail leads back to the category the visitor most
              likely arrived from, not just to the directory root. */}
          <nav className="flex flex-wrap items-center gap-1.5 text-[0.75rem]" style={{ color: "var(--ink-3)" }}>
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
            <span
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl md:h-20 md:w-20"
              style={{ background: "var(--surface-raised)", color: "var(--brand-secondary)", boxShadow: "var(--shadow-2)", border: "1px solid var(--hairline)" }}
            >
              <CategoryIcon category={biz.category ?? ""} size={30} />
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="heading-lg">{cleanBusinessName(biz.name)}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {biz.category && (
                  <a href={`${origin}${categoryPath(biz.category)}`} className="chip chip-brand">
                    {titleize(biz.category)}
                  </a>
                )}
                {biz.rating != null && (
                  <span className="badge badge-gold tabular">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z"/></svg>
                    {Number(biz.rating).toFixed(1)}
                    {biz.reviews_count != null && (
                      <span style={{ opacity: 0.66, fontWeight: 520 }}>({biz.reviews_count.toLocaleString("en-IN")})</span>
                    )}
                  </span>
                )}
                {reviewCount > 0 && (
                  <span className="badge badge-brand tabular">
                    {reviewCount} review{reviewCount === 1 ? "" : "s"} on {brand.name}
                  </span>
                )}
                {/* Verified is data-driven: only renders once a business has been
                    claimed and verified (Phase 3). No fake "✓ Verified" badges —
                    those were removed because every row carried one. */}
                {biz.verified && (
                  <span className="badge badge-positive">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.5 16.2 4.8 11.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4z"/></svg>
                    Verified
                  </span>
                )}
                {biz.featured && (
                  <span className="badge badge-gold">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z"/></svg>
                    Featured
                  </span>
                )}
                {(biz.area || biz.city) && (
                  <span className="text-[0.75rem] capitalize" style={{ color: "var(--ink-3)" }}>{localityOf(biz)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Calling IS the conversion on a local directory, so it is the
              primary action at the top of the page — not the fourth row of an
              info list, which is where it used to sit. */}
          {biz.phone && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href={telHref(biz.phone)} data-track="call_click" className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/></svg> {biz.phone}
              </a>
              <a
                href={waHref(biz.phone, `Hi ${biz.name}, I found you on ${brand.name} and would like to enquire.`)}
                target="_blank" rel="noopener noreferrer"
                data-track="whatsapp_click"
                className="btn-secondary"
                style={{ color: "var(--whatsapp)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.37a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.13c-.25.69-1.45 1.32-1.99 1.36-.53.04-1.07.24-3.62-.75-2.99-1.13-4.9-4.02-5.05-4.21-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.51.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.45.5-.15.14-.3.3-.13.58.17.28.75 1.24 1.61 2.01 1.11 1.11 2.04 1.45 2.32 1.61.28.16.44.14.6-.09.17-.23.71-.83.9-1.11.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.69-.18 1.38z"/></svg> WhatsApp
              </a>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-track="directions_click" className="btn-secondary">
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
            {/* About: the only prose on the page, and it is written from this listing's
                own row by the ₹0 router path (product `listing-description` in
                apps/web/app/api/job/route.ts) — name, category, area, phone, rating and
                nothing else. The line underneath says so, because a template must not
                read as if a model had visited the shop. Rows with no description render
                nothing at all rather than a placeholder. */}
            {typeof (biz as any).description === "string" && (biz as any).description.trim() !== "" && (
              <div className="card p-6">
                <h2 className="heading-sm mb-3">About {cleanBusinessName(biz.name)}</h2>
                <p className="text-sm leading-relaxed opacity-80">{(biz as any).description}</p>
                <p className="mt-3 text-xs opacity-55">
                  Written from this business’s own details — the name, category, area, phone and rating
                  shown on this page. A fixed sentence shape filled from those facts, not a model’s account.
                </p>
              </div>
            )}
            <div className="card p-6">
              <h2 className="heading-sm mb-5">Business details</h2>
              <div className="space-y-4 text-sm">
                {biz.address && (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 text-ink-3"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg></span>
                    <div>
                      <p className="opacity-75">{biz.address}</p>
                      {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-track="directions_click" className="press text-xs underline" style={{ color: "var(--brand-secondary)" }}>Open in Google Maps</a>}
                    </div>
                  </div>
                )}
                {biz.phone && (
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 text-ink-3"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/></svg></span>
                    <a href={telHref(biz.phone)} data-track="call_click" className="press font-[620] tabular" style={{ color: "var(--brand-secondary)" }}>{biz.phone}</a>
                  </div>
                )}
                {biz.website && (
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 text-ink-3"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg></span>
                    <a href={biz.website} target="_blank" rel="noopener nofollow noreferrer" data-track="website_click" className="press break-all font-[560]" style={{ color: "var(--brand-secondary)" }}>
                      {biz.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {/* Social profiles the business publishes on its own site, from
                    scripts/enrich-socials.py. Low-confidence links are hidden. */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2" aria-label="Social profiles">
                    {socialLinks.map((s) => (
                      <a
                        key={s.platform}
                        href={s.url}
                        target="_blank"
                        rel="noopener nofollow noreferrer"
                        data-track={`social_${s.platform}_click`}
                        className="press rounded-lg border border-line px-3 py-1.5 text-xs font-[560]"
                        style={{ color: "var(--brand-secondary)" }}
                        aria-label={`${biz.name} on ${s.label}`}
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
                {biz.email && (
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 text-ink-3"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span>
                    <a href={`mailto:${biz.email}`} className="press break-all font-[560]" style={{ color: "var(--brand-secondary)" }}>{biz.email}</a>
                  </div>
                )}
                {biz.rating != null && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gold-tint)", color: "var(--gold)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z"/></svg>
                    </span>
                    <div>
                      <p className="font-semibold text-ink">
                        {biz.rating} <span className="font-normal text-ink-3">/ 5</span>
                        {reviewsShown != null && <span className="ml-1 font-normal text-ink-3">· {reviewsShown.toLocaleString("en-IN")} reviews</span>}
                      </p>
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-track="directions_click" className="press text-xs underline" style={{ color: "var(--brand-secondary)" }}>
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
              <p className="mt-6 border-t pt-4 text-[0.75rem] leading-relaxed" style={{ borderColor: "var(--hairline)", color: "var(--ink-3)" }}>
                This listing comes from publicly available Google Maps data and may be out of date.
                Please confirm with the business before travelling.
                {" "}
                <a href={`${origin}/contact`} className="underline" style={{ color: "var(--brand-secondary)" }}>Report incorrect information</a>.
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
              <div className="card p-6">
                <h2 className="heading-sm mb-2">Own this business?</h2>
                <p className="mb-4 text-[0.9375rem]" style={{ color: "var(--ink-2)" }}>See your leads and manage this listing — sign in with your WhatsApp number.</p>
                <a href={`${origin}/business-dashboard`} className="btn-secondary btn-sm">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg> Open business dashboard
                </a>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="card p-6 md:sticky md:top-24">
              <h2 className="heading-sm mb-1 flex items-center gap-2" style={{ color: "var(--ink)" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg> Get in touch</h2>
              <p className="mb-5 text-[0.8125rem]" style={{ color: "var(--ink-3)" }}>Verify with WhatsApp and the business receives your enquiry straight away.</p>
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
            <h2 className="heading-md mb-5">
              More {biz.category ? titleize(biz.category) : "businesses"} in {CITY_LABEL}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <BusinessCard key={r.id} b={r} primary={primary} secondary={secondary} />
              ))}
            </div>
            {biz.category && (
              <a href={`${origin}${categoryPath(biz.category)}`} className="press mt-6 inline-block text-[0.875rem] font-[600] underline" style={{ color: "var(--brand-secondary)" }}>
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
        <div className="sticky bottom-0 z-40 flex items-stretch gap-2.5 px-4 py-3 md:hidden"
          data-solid-bar
          style={{
            background: "var(--surface-raised)",
            borderTop: "1px solid var(--hairline)",
            boxShadow: "0 -6px 24px -10px rgba(11,11,15,0.18)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}>
          <a href={telHref(biz.phone)} data-track="call_click" className="btn-primary flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/></svg> Call
          </a>
          <a
            href={waHref(biz.phone, `Hi ${biz.name}, I found you on ${brand.name} and would like to enquire.`)}
            target="_blank" rel="noopener noreferrer"
            data-track="whatsapp_click"
            className="btn-secondary" style={{ color: "var(--whatsapp)" }} aria-label="WhatsApp"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.37a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.13c-.25.69-1.45 1.32-1.99 1.36-.53.04-1.07.24-3.62-.75-2.99-1.13-4.9-4.02-5.05-4.21-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.51.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.45.5-.15.14-.3.3-.13.58.17.28.75 1.24 1.61 2.01 1.11 1.11 2.04 1.45 2.32 1.61.28.16.44.14.6-.09.17-.23.71-.83.9-1.11.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.69-.18 1.38z"/></svg>
          </a>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-track="directions_click" className="btn-secondary" aria-label="Directions"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 4 6 2 5-2v14l-5 2-6-2-5 2V6z"/><path d="M9 4v14M15 6v14"/></svg></a>
          )}
        </div>
      )}

      <BrandFooter brand={brand} />
    </div>
  );
}
