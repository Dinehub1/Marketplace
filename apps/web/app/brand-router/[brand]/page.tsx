import { existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBrand } from "@/lib/brands";
import { titleize } from "@/lib/categories";
import { brandPublishesDirectory, categoriesForBrand } from "@/lib/brand-categories";
import {
  CITY_LABEL,
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
  const brand = await getBrand(slug.toLowerCase());
  if (!brand) return {};

  const sp = await searchParams;
  const subPath = ((sp.__brand_path as string) || "/").toLowerCase();
  const origin = `https://${brand.slug}.cashcard.live`;

  // Category within a neighbourhood: "/plumber-in-vijay-nagar". Checked before
  // the city-level category page so the area is picked out of the same slug.
  const caSlug = categoryAreaSlugFromPath(subPath);
  if (caSlug) {
    const category = await findCategory(caSlug.categorySlug);
    if (category) {
      const areaRaw = (await getCategoryAreaIndex(category.category)).find((a) => a.slug === caSlug.areaSlug)?.area;
      if (areaRaw) {
        const label = titleize(category.category);
        const areaLabel = titleize(areaRaw);
        const page = Math.max(1, Number(sp.page) || 1);
        const suffix = page > 1 ? ` — Page ${page}` : "";
        const canonical = `${origin}${categoryAreaPath(category.category, areaRaw)}`;
        return {
          title: `${category.count} Best ${label} in ${areaLabel}, ${CITY_LABEL} (2026) | ${brand.name}${suffix}`,
          description:
            `Compare ${label.toLowerCase()} in ${areaLabel}, ${CITY_LABEL} — ratings, ` +
            `addresses and phone numbers. Call directly, no signup needed.`,
          alternates: { canonical: page > 1 ? `${canonical}?page=${page}` : canonical },
          openGraph: {
            title: `${category.count} Best ${label} in ${areaLabel}, ${CITY_LABEL}`,
            description: `Verified ${label.toLowerCase()} listings in ${areaLabel}, ${CITY_LABEL} with ratings and phone numbers.`,
            url: canonical,
            type: "website",
          },
        };
      }
    }
  }

  const catSlug = categorySlugFromPath(subPath);
  if (catSlug) {
    const category = await findCategory(catSlug);
    if (category) {
      const label = titleize(category.category);
      const page = Math.max(1, Number(sp.page) || 1);
      const suffix = page > 1 ? ` — Page ${page}` : "";
      const canonical = `${origin}${categoryPath(category.category)}`;
      return {
        title: `${category.count} Best ${label} in ${CITY_LABEL} (2026) | ${brand.name}${suffix}`,
        description:
          `Compare ${label.toLowerCase()} in ${CITY_LABEL}, Madhya Pradesh — ratings, ` +
          `addresses and phone numbers. Call directly, no signup needed.`,
        alternates: { canonical: page > 1 ? `${canonical}?page=${page}` : canonical },
        openGraph: {
          title: `${category.count} Best ${label} in ${CITY_LABEL}`,
          description: `Verified ${label.toLowerCase()} listings in ${CITY_LABEL} with ratings and phone numbers.`,
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
    const listings = await getActiveListingCount();
    return {
      title: `Business Directory in ${CITY_LABEL} — ${listings.toLocaleString("en-IN")} Local Listings | ${brand.name}`,
      description:
        `Search ${listings.toLocaleString("en-IN")} businesses in ${CITY_LABEL} — plumbers, electricians, ` +
        `doctors, tutors and more. Ratings, addresses and phone numbers you can call directly.`,
      alternates: { canonical: `${origin}/marketplace` },
    };
  }
  if (subPath === "/categories") {
    const index = await getCategoryIndex();
    return {
      title: `All Business Categories in ${CITY_LABEL} | ${brand.name}`,
      description:
        `Browse every type of business listed in ${CITY_LABEL}, A to Z — ${index.length} categories, ` +
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

function ComingSoon({ brand, pageName }: { brand: any; pageName: string }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const bg = theme.bg ?? "#faf5ff";
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--brand-secondary)" }}>{pageName}</h1>
          <p className="opacity-60 mb-6">This page is coming soon for {brand.name}.</p>
          <a href={`/`} className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow" style={{ background: "var(--brand-primary)" }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}

function isEnabled(brand: any, key: string): boolean {
  const flags = (brand.page_flags ?? {}) as Record<string, boolean>;
  if (flags[key] === false) return false;
  return true;
}

export default async function BrandRouter({ params, searchParams }: { params: Promise<{ brand: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { brand: slug } = await params;
  const brand = await getBrand(slug.toLowerCase());
  if (!brand) notFound();
  const sp = await searchParams;
  const subPath = ((sp.__brand_path as string) || "/").toLowerCase();

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
  if (subPath === "/marketplace" || subPath === "/listings") { if (!brandPublishesDirectory(brand)) notFound(); if (!isEnabled(brand, "marketplace")) return <ComingSoon brand={brand} pageName="Marketplace" />; const { MarketplacePage } = await import("./pages/marketplace"); return <MarketplacePage brand={brand} sp={sp} />; }
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
    return <CategoriesPage brand={brand} />;
  }
  // Category within a neighbourhood: "/plumber-in-vijay-nagar". Same slug
  // shape as the city-level category page but with a real locality, so it is
  // checked first.
  {
    const caSlug = categoryAreaSlugFromPath(subPath);
    if (caSlug) {
      if (!brandPublishesDirectory(brand)) notFound();
      const category = await findCategory(caSlug.categorySlug);
      if (!category) notFound();
      // A vertical brand only owns its own categories.
      const index = await getCategoryIndex();
      const allowed = categoriesForBrand(brand.slug, index.map((c) => c.category));
      if (allowed && !allowed.includes(category.category)) notFound();
      const areaRaw = (await getCategoryAreaIndex(category.category)).find((a) => a.slug === caSlug.areaSlug)?.area ?? null;
      if (!areaRaw) notFound();
      const page = Math.max(1, Number(sp.page) || 1);
      const { CategoryAreaPage } = await import("./pages/category-area");
      return <CategoryAreaPage brand={brand} category={category} area={areaRaw} page={page} />;
    }
  }

  // SEO landing pages: /<category>-in-indore, one per directory category.
  // Checked before the generic page list because the shape is dynamic.
  {
    const catSlug = categorySlugFromPath(subPath);
    if (catSlug) {
      if (!brandPublishesDirectory(brand)) notFound();
      const category = await findCategory(catSlug);
      if (!category) notFound();
      // A vertical brand only owns its own categories. Without this,
      // sarkarfood served /plumber-in-indore — the same page as ten other
      // brands, competing with all of them for the same query.
      const index = await getCategoryIndex();
      const allowed = categoriesForBrand(brand.slug, index.map((c) => c.category));
      if (allowed && !allowed.includes(category.category)) notFound();
      const page = Math.max(1, Number(sp.page) || 1);
      const { CategoryLandingPage } = await import("./pages/category-landing");
      return <CategoryLandingPage brand={brand} category={category} page={page} />;
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
  if (subPath === "/quote" || subPath === "/request-quote") { if (!brand.quote_enabled) return <ComingSoon brand={brand} pageName="Request Quote" />; const { QuotePage } = await import("./pages/quote"); return <QuotePage brand={brand} />; }
  if (subPath === "/checkout" || subPath === "/pay") { if (!brand.checkout_enabled) return <ComingSoon brand={brand} pageName="Checkout" />; const { CheckoutPage } = await import("./pages/checkout"); return <CheckoutPage brand={brand} />; }
  if (subPath === "/support" || subPath === "/help") { if (!isEnabled(brand, "support")) return <ComingSoon brand={brand} pageName="Support" />; const { SupportPage } = await import("./pages/support"); return <SupportPage brand={brand} />; }
  if (subPath === "/chat" || subPath === "/ai-assistant") { if (!brand.chat_enabled) return <ComingSoon brand={brand} pageName="AI Assistant" />; const { AIChatPage } = await import("./pages/ai-chat"); return <AIChatPage brand={brand} />; }
  if (subPath === "/privacy" || subPath === "/privacy-policy") { const { PrivacyPage } = await import("./pages/privacy"); return <PrivacyPage brand={brand} />; }
  if (subPath === "/terms" || subPath === "/terms-conditions") { const { TermsPage } = await import("./pages/terms"); return <TermsPage brand={brand} />; }

  // Root: directory-publishing brands render the dynamic directory homepage
  // (live listings); other brands with a static folder keep their prebuilt
  // marketing site. Brands with neither fall back to the generic landing.
  const folder = brand.folder;
  if (folder && !brandPublishesDirectory(brand)) {
    const sitePath = path.join(process.cwd(), "public", "sites", folder, "index.html");
    if (existsSync(sitePath)) {
      const { BrandStaticSite } = await import("./brand-static");
      return <BrandStaticSite brand={brand} />;
    }
  }
  const { BrandLanding } = await import("./brand-landing");
  return <BrandLanding brand={brand} />;
}
