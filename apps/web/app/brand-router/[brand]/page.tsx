import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Brand } from "@/lib/brands";
import { getBrand } from "@/lib/brands";
import { titleize } from "@/lib/categories";
import { brandPublishesDirectory, categoriesForBrand } from "@/lib/brand-categories";
import { matchBrandRoute } from "@/lib/brand-sitemap";
import { resolveCategoryRoute } from "@/lib/brand-sitemap-resolve";
import {
  DEFAULT_CITY,
  cityBySlug,
  citySlugFromPath,
  type City,
  categoryPath,
  categoryAreaPath,
  categorySlugFromPath,
  categoryAreaSlugFromPath,
  businessExists,
  cleanBusinessName,
  findCategory,
  getActiveListingCount,
  getCategoryIndex,
  getCategoryAreaIndex,
  localityOf,
} from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidate every 5 minutes (ISR cache)

/**
 * Per-page metadata.
 *
 * Without this every page on every brand inherited the root layout's
 * "SarkarDash — One Platform" title, which makes 320 category pages
 * indistinguishable to a search engine and effectively unrankable. The title
 * and description ARE the product here, so they are built from real counts.
 */
export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ brand: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> },
): Promise<Metadata> {
  const { brand: slug } = await params;
  const sp = await searchParams;
  const subPath = ((sp.__brand_path as string) || "/").toLowerCase();

  // City comes from the URL: "/plumber-in-mumbai" -> Mumbai. A path with no
  // known city token (including "/plumber-in-indore") stays the default city, so
  // every existing URL keeps its current meaning. (2026-09-19)
  const city = cityBySlug(citySlugFromPath(subPath)) ?? DEFAULT_CITY;
  const cityName = city.label;

  // Resolved after the city so the brand's copy is already city-correct here.
  const brand = await getBrand(slug.toLowerCase(), city);
  if (!brand) return {};

  // Canonical origin for meta/OG/JSON-LD: the brand's own domain (the new
  // domain), so canonical tags consolidate on the domain we want indexed rather
  // than the one being retired.
  const origin = (((brand as { domain?: string | null }).domain) ?? `https://${brand.slug}.dropby.co.in`).replace(/\/+$/, "");

  // Category within a neighbourhood: "/plumber-in-vijay-nagar". Checked before
  // the city-level category page so the area is picked out of the same slug.
  const caSlug = categoryAreaSlugFromPath(subPath);
  if (caSlug) {
    const category = await findCategory(caSlug.categorySlug, cityName);
    if (category) {
      const areaRaw = (await getCategoryAreaIndex(category.category, cityName)).find((a) => a.slug === caSlug.areaSlug)?.area;
      if (areaRaw) {
        const label = titleize(category.category);
        const areaLabel = titleize(areaRaw);
        const page = Math.max(1, Number(sp.page) || 1);
        const suffix = page > 1 ? ` — Page ${page}` : "";
        const canonical = `${origin}${categoryAreaPath(category.category, areaRaw)}`;
        return {
          title: `${category.count} Best ${label} in ${areaLabel}, ${cityName} (2026) | ${brand.name}${suffix}`,
          description:
            `Compare ${label.toLowerCase()} in ${areaLabel}, ${cityName} — ratings, ` +
            `addresses and phone numbers. Call directly, no signup needed.`,
          alternates: { canonical: page > 1 ? `${canonical}?page=${page}` : canonical },
          openGraph: {
            title: `${category.count} Best ${label} in ${areaLabel}, ${cityName}`,
            description: `Verified ${label.toLowerCase()} listings in ${areaLabel}, ${cityName} with ratings and phone numbers.`,
            url: canonical,
            type: "website",
          },
        };
      }
    }
  }

  const catSlug = categorySlugFromPath(subPath);
  if (catSlug) {
    const category = await findCategory(catSlug, cityName);
    if (category) {
      const label = titleize(category.category);
      const page = Math.max(1, Number(sp.page) || 1);
      const suffix = page > 1 ? ` — Page ${page}` : "";
      const canonical = `${origin}${categoryPath(category.category, city.slug)}`;
      return {
        title: `${category.count} Best ${label} in ${cityName} (2026) | ${brand.name}${suffix}`,
        description:
          `Compare ${label.toLowerCase()} in ${cityName}, ${city.state} — ratings, ` +
          `addresses and phone numbers. Call directly, no signup needed.`,
        alternates: { canonical: page > 1 ? `${canonical}?page=${page}` : canonical },
        openGraph: {
          title: `${category.count} Best ${label} in ${cityName}`,
          description: `Verified ${label.toLowerCase()} listings in ${cityName} with ratings and phone numbers.`,
          url: canonical,
          type: "website",
        },
      };
    }
  }

  // The two directory hubs earn their own titles rather than inheriting the
  // brand default — they are the pages that rank for "business directory
  // indore" and for the long tail of category browsing.
  if (subPath === "/marketplace" || subPath === "/listings") {
    const listings = await getActiveListingCount(cityName);
    return {
      title: `Business Directory in ${cityName} — ${listings.toLocaleString("en-IN")} Local Listings | ${brand.name}`,
      description:
        `Search ${listings.toLocaleString("en-IN")} businesses in ${cityName} — plumbers, electricians, ` +
        `doctors, tutors and more. Ratings, addresses and phone numbers you can call directly.`,
      alternates: { canonical: `${origin}/marketplace` },
    };
  }
  if (subPath === "/categories") {
    const index = await getCategoryIndex(cityName);
    return {
      title: `All Business Categories in ${cityName} | ${brand.name}`,
      description:
        `Browse every type of business listed in ${cityName}, A to Z — ${index.length} categories, ` +
        `each with the highest-rated local options and phone numbers you can call.`,
      alternates: { canonical: `${origin}/categories` },
    };
  }

  // Business detail: ~19k pages that all shared one title until now, which
  // makes them duplicates to a search engine. The name + locality + category
  // is exactly what someone types when looking for this specific business.
  if (subPath.startsWith("/business/")) {
    const id = Number(subPath.slice("/business/".length).split("/")[0]);
    if (Number.isFinite(id) && id > 0) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/businesses` +
            `?id=eq.${id}&select=name,category,area,city,phone,address`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}`,
            },
            next: { revalidate: 300 },
          },
        );
        const biz = res.ok ? (await res.json())[0] : null;
        if (biz) {
          const where = localityOf(biz);
          const cat = biz.category ? titleize(biz.category) : "Business";
          // Same cleaning as the page body — the raw scraped name leads with
          // stray quotes and emoji, and a <title> is the worst place for them.
          const name = cleanBusinessName(biz.name);
          return {
            title: `${name} — ${cat} in ${where} | ${brand.name}`,
            description:
              `${name}, ${cat.toLowerCase()} in ${where}.` +
              (biz.address ? ` ${biz.address}.` : "") +
              (biz.phone ? ` Phone ${biz.phone} — call directly.` : " Contact details and directions."),
            alternates: { canonical: `${origin}/business/${id}` },
          };
        }
      } catch {
        /* fall through to the brand default */
      }
    }
  }

  return {
    title: brand.seo_title ?? `${brand.name}${brand.tagline ? ` — ${brand.tagline}` : ""}`,
    description: brand.seo_description ?? brand.description ?? undefined,
    alternates: { canonical: `${origin}${subPath === "/" ? "" : subPath}` },
  };
}

function ComingSoon({ brand, pageName }: { brand: Brand; pageName: string }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const bg = theme.bg ?? "#faf5ff";
  const emoji = brand.emoji ?? "🗂️";
  // A page that is switched off should read as "not yet", not as "broken" — and it
  // must not be indexed, or Google fills its view of the brand with thin pages.
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <meta name="robots" content="noindex, follow" />
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-lg">
          <div className="text-5xl mb-4" aria-hidden>{emoji}</div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--brand-secondary)" }}>{pageName}</h1>
          <p className="opacity-70 mb-2">
            {brand.name} is live in Indore — this page is still being prepared.
          </p>
          <p className="opacity-60 mb-8 text-sm">
            Everything else on {brand.name} is open: browse businesses by category and locality, or
            list your own business free.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow"
               style={{ background: "var(--brand-primary)" }}>← Browse {brand.name}</Link>
            <a href="https://wa.me/916263461179" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold border"
               style={{ borderColor: "var(--brand-primary)", color: "var(--brand-secondary)" }}>
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function isEnabled(brand: Brand, key: string): boolean {
  const flags = (brand.page_flags ?? {}) as Record<string, boolean>;
  if (flags[key] === false) return false;
  return true;
}

export default async function BrandRouter({ params, searchParams }: { params: Promise<{ brand: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { brand: slug } = await params;
  const sp = await searchParams;
  let subPath = ((sp.__brand_path as string) || "/").toLowerCase();

  // Resolved once, then used by every fetch and passed to every page below, so
  // a rendered page can never mix two cities. (2026-09-19)
  const city: City = cityBySlug(citySlugFromPath(subPath)) ?? DEFAULT_CITY;

  // Brand fetched after the city, so its copy (footer tagline, about, default
  // metadata) is already swapped for this city.
  const brand = await getBrand(slug.toLowerCase(), city);
  if (!brand) notFound();

  // Per-brand sitemap (lib/brand-sitemap.ts): the semantic routes a visitor
  // expects from this brand - /doctors, /plumbers, /used-cars - resolved onto
  // real category listings and real business pages. An alias is rewritten
  // internally rather than redirected: the URL stays what the user clicked and
  // no round trip is spent proving it.
  {
    const sitemapRoute = matchBrandRoute(brand.slug, subPath);
    if (sitemapRoute) {
      if (sitemapRoute.kind === "alias") {
        subPath = sitemapRoute.to;
      } else if (sitemapRoute.kind === "detail") {
        const detailId = Number(subPath.slice(sitemapRoute.prefix.length + 1).split("/")[0]);
        if (!Number.isFinite(detailId) || detailId <= 0) notFound();
        if (!(await businessExists(detailId))) notFound();
        const { BusinessDetailPage } = await import("./pages/business-detail");
        return <BusinessDetailPage brand={brand} businessId={detailId} />;
      } else if (sitemapRoute.kind === "category") {
        const sitemapCategory = await resolveCategoryRoute(sitemapRoute.match);
        if (!sitemapCategory) notFound();
        const sitemapPageNo = Math.max(1, Number(sp.page) || 1);
        const { CategoryLandingPage } = await import("./pages/category-landing");
        return <CategoryLandingPage brand={brand} category={sitemapCategory} page={sitemapPageNo} city={city} />;
      }
    }
  }

  if (subPath === "/galaxy") { const { GalaxyPage } = await import("./pages/galaxy"); return <GalaxyPage />; }
  if (subPath === "/login") { const { WhatsAppLogin } = await import("./whatsapp-login"); return <WhatsAppLogin brand={brand} />; }
  if (subPath === "/register" || subPath === "/signup") { const { BrandRegister } = await import("./pages/register"); return <BrandRegister brand={brand} />; }
  if (subPath === "/forgot-password" || subPath === "/reset-password") { const { ForgotPassword } = await import("./pages/forgot-password"); return <ForgotPassword brand={brand} />; }
  if (subPath === "/dashboard") { const { UserDashboard } = await import("./pages/dashboard"); return <UserDashboard brand={brand} />; }
  if (subPath === "/profile") { const { BrandProfile } = await import("./brand-profile"); return <BrandProfile brand={brand} />; }
  if (subPath === "/settings") { const { BrandSettings } = await import("./brand-settings"); return <BrandSettings brand={brand} />; }
  if (subPath === "/notifications") { const { Notifications } = await import("./pages/notifications"); return <Notifications brand={brand} />; }
  if (subPath === "/orders" || subPath === "/bookings") { const { Orders } = await import("./pages/orders"); return <Orders brand={brand} />; }
  if (subPath === "/business-dashboard") { const { BusinessDashboard } = await import("./pages/business-dashboard"); return <BusinessDashboard brand={brand} />; }
  if (subPath === "/about") { if (!isEnabled(brand, "about")) return <ComingSoon brand={brand} pageName="About" />; const { AboutPage } = await import("./pages/about"); return <AboutPage brand={brand} />; }
  if (subPath === "/services" || subPath === "/products") { if (!isEnabled(brand, "services")) return <ComingSoon brand={brand} pageName="Services" />; const { ServicesPage } = await import("./pages/services"); return <ServicesPage brand={brand} />; }
  if (subPath === "/pricing") { if (!isEnabled(brand, "pricing")) return <ComingSoon brand={brand} pageName="Pricing" />; const { PricingPage } = await import("./pages/pricing"); return <PricingPage brand={brand} />; }
  if (subPath === "/features") { if (!isEnabled(brand, "features")) return <ComingSoon brand={brand} pageName="Features" />; const { FeaturesPage } = await import("./pages/features"); return <FeaturesPage brand={brand} />; }
  if (subPath === "/marketplace" || subPath === "/listings") { if (!brandPublishesDirectory(brand)) notFound(); if (!isEnabled(brand, "marketplace")) return <ComingSoon brand={brand} pageName="Marketplace" />; const { MarketplacePage } = await import("./pages/marketplace"); return <MarketplacePage brand={brand} sp={sp} city={city} />; }
  if (subPath.startsWith("/business/")) {
    const businessId = Number(subPath.slice("/business/".length).split("/")[0]);
    if (Number.isFinite(businessId) && businessId > 0) {
      // A deleted or unknown listing must answer 404, not 200 with a
      // "not found" body. A soft 404 keeps the URL indexed, and with ~19k
      // listing pages that churn as the scraper runs, that is a lot of dead
      // results pointing at this site.
      const exists = await businessExists(businessId);
      if (!exists) notFound();
      const { BusinessDetailPage } = await import("./pages/business-detail");
      return <BusinessDetailPage brand={brand} businessId={businessId} />;
    }
  }
  if (subPath === "/categories") {
    if (!brandPublishesDirectory(brand)) notFound();
    const { CategoriesPage } = await import("./pages/categories");
    return <CategoriesPage brand={brand} city={city} />;
  }
  // Category within a neighbourhood: "/plumber-in-vijay-nagar". Same slug
  // shape as the city-level category page but with a real locality, so it is
  // checked first.
  {
    const caSlug = categoryAreaSlugFromPath(subPath);
    if (caSlug) {
      if (!brandPublishesDirectory(brand)) notFound();
      const category = await findCategory(caSlug.categorySlug, city.label);
      if (!category) notFound();
      // A vertical brand only owns its own categories.
      const index = await getCategoryIndex(city.label);
      const allowed = categoriesForBrand(brand.slug, index.map((c) => c.category));
      if (allowed && !allowed.includes(category.category)) notFound();
      const areaRaw = (await getCategoryAreaIndex(category.category, city.label)).find((a) => a.slug === caSlug.areaSlug)?.area ?? null;
      if (!areaRaw) notFound();
      const page = Math.max(1, Number(sp.page) || 1);
      const { CategoryAreaPage } = await import("./pages/category-area");
      return <CategoryAreaPage brand={brand} category={category} area={areaRaw} page={page} city={city} />;
    }
  }

  // SEO landing pages: /<category>-in-indore, one per directory category.
  // Checked before the generic page list because the shape is dynamic.
  {
    const catSlug = categorySlugFromPath(subPath);
    if (catSlug) {
      if (!brandPublishesDirectory(brand)) notFound();
      const category = await findCategory(catSlug, city.label);
      if (!category) notFound();
      // A vertical brand only owns its own categories. Without this,
      // sarkarfood served /plumber-in-indore — the same page as ten other
      // brands, competing with all of them for the same query.
      const index = await getCategoryIndex(city.label);
      const allowed = categoriesForBrand(brand.slug, index.map((c) => c.category));
      if (allowed && !allowed.includes(category.category)) notFound();
      const page = Math.max(1, Number(sp.page) || 1);
      const { CategoryLandingPage } = await import("./pages/category-landing");
      return <CategoryLandingPage brand={brand} category={category} page={page} city={city} />;
    }
  }
  if (subPath === "/blog" || subPath === "/news") { if (!isEnabled(brand, "blog")) return <ComingSoon brand={brand} pageName="Blog" />; const { BlogPage } = await import("./pages/blog"); return <BlogPage brand={brand} />; }
  if (subPath === "/careers" || subPath === "/jobs") { if (!isEnabled(brand, "careers")) return <ComingSoon brand={brand} pageName="Careers" />; const { CareersPage } = await import("./pages/careers"); return <CareersPage brand={brand} />; }
  if (subPath === "/contact") { if (!isEnabled(brand, "contact")) return <ComingSoon brand={brand} pageName="Contact" />; const { ContactPage } = await import("./pages/contact"); return <ContactPage brand={brand} />; }
  if (subPath === "/faq" || subPath === "/faqs") { if (!isEnabled(brand, "faq")) return <ComingSoon brand={brand} pageName="FAQ" />; const { FAQPage } = await import("./pages/faq"); return <FAQPage brand={brand} />; }
  if (subPath === "/testimonials") { if (!isEnabled(brand, "testimonials")) return <ComingSoon brand={brand} pageName="Testimonials" />; const { TestimonialsPage } = await import("./pages/testimonials"); return <TestimonialsPage brand={brand} />; }
  if (subPath === "/reviews") { if (!isEnabled(brand, "reviews")) return <ComingSoon brand={brand} pageName="Reviews" />; const { ReviewsPage } = await import("./pages/reviews"); return <ReviewsPage brand={brand} />; }
  if (subPath === "/gallery" || subPath === "/portfolio") { if (!isEnabled(brand, "gallery")) return <ComingSoon brand={brand} pageName="Gallery" />; const { GalleryPage } = await import("./pages/gallery"); return <GalleryPage brand={brand} />; }
  if (subPath === "/book" || subPath === "/booking" || subPath === "/schedule") {
    if (!brand.booking_enabled) return <ComingSoon brand={brand} pageName="Book Appointment" />;
    const { BookingPage } = await import("./pages/booking");
    // /book?vendor=<id> deep-links straight into one vendor's flow (linked from
    // business detail pages); without it the page shows the vendor picker.
    const vendorParam = Number(sp.vendor);
    return <BookingPage brand={brand} initialVendorId={Number.isFinite(vendorParam) && vendorParam > 0 ? vendorParam : null} />;
  }
  if (subPath === "/vendor-bookings") {
    if (!brand.booking_enabled) return <ComingSoon brand={brand} pageName="Dukaan Dashboard" />;
    const { VendorBookingsPage } = await import("./pages/vendor-bookings");
    return <VendorBookingsPage brand={brand} />;
  }
  // The Request Quote page (`/quote`, `/request-quote`, and sarkarghar's
  // `/get-quote` alias) was removed on 2026-09-19. It was a four-step form that
  // collected a name, an email and a phone number and then said a quote would
  // arrive in 24 hours — nothing behind it sent, stored or priced anything, so
  // every route that reached it resolved to a promise the repo could not keep.
  if (subPath === "/checkout" || subPath === "/pay") { if (!brand.checkout_enabled) return <ComingSoon brand={brand} pageName="Checkout" />; const { CheckoutPage } = await import("./pages/checkout"); return <CheckoutPage brand={brand} />; }
  if (subPath === "/support" || subPath === "/help") { if (!isEnabled(brand, "support")) return <ComingSoon brand={brand} pageName="Support" />; const { SupportPage } = await import("./pages/support"); return <SupportPage brand={brand} />; }
  if (subPath === "/chat" || subPath === "/ai-assistant") { if (!brand.chat_enabled) return <ComingSoon brand={brand} pageName="AI Assistant" />; const { AIChatPage } = await import("./pages/ai-chat"); return <AIChatPage brand={brand} />; }
  if (subPath === "/privacy" || subPath === "/privacy-policy") { const { PrivacyPage } = await import("./pages/privacy"); return <PrivacyPage brand={brand} />; }
  if (subPath === "/terms" || subPath === "/terms-conditions") { const { TermsPage } = await import("./pages/terms"); return <TermsPage brand={brand} />; }

  // Root: directory-publishing brands render the dynamic directory homepage
  // (live listings); other brands with a static folder keep their prebuilt
  // marketing site. Brands with neither fall back to the generic landing.
  // A brand homepage is the app, not the prebuilt mockup in public/sites: the
  // mockup has dead # links and shows no live data, which is what made every
  // brand read as a demo. The static folders are kept on disk, unreferenced.
  const { BrandLanding } = await import("./brand-landing");
  return <BrandLanding brand={brand} />;
}
