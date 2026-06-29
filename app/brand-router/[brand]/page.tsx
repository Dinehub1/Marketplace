import { existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brands";

export const dynamic = "force-dynamic";

function ComingSoon({ brand, pageName }: { brand: any; pageName: string }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const bg = theme.bg ?? "#faf5ff";
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: primary }}>{pageName}</h1>
          <p className="opacity-60 mb-6">This page is coming soon for {brand.name}.</p>
          <a href={`https://${brand.slug}.cashcard.live/`} className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow" style={{ backgroundColor: primary }}>← Back to Home</a>
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
  if (subPath === "/marketplace" || subPath === "/listings") { if (!isEnabled(brand, "marketplace")) return <ComingSoon brand={brand} pageName="Marketplace" />; const { MarketplacePage } = await import("./pages/marketplace"); return <MarketplacePage brand={brand} />; }
  if (subPath === "/blog" || subPath === "/news") { if (!isEnabled(brand, "blog")) return <ComingSoon brand={brand} pageName="Blog" />; const { BlogPage } = await import("./pages/blog"); return <BlogPage brand={brand} />; }
  if (subPath === "/careers" || subPath === "/jobs") { if (!isEnabled(brand, "careers")) return <ComingSoon brand={brand} pageName="Careers" />; const { CareersPage } = await import("./pages/careers"); return <CareersPage brand={brand} />; }
  if (subPath === "/contact") { if (!isEnabled(brand, "contact")) return <ComingSoon brand={brand} pageName="Contact" />; const { ContactPage } = await import("./pages/contact"); return <ContactPage brand={brand} />; }
  if (subPath === "/faq" || subPath === "/faqs") { if (!isEnabled(brand, "faq")) return <ComingSoon brand={brand} pageName="FAQ" />; const { FAQPage } = await import("./pages/faq"); return <FAQPage brand={brand} />; }
  if (subPath === "/testimonials") { if (!isEnabled(brand, "testimonials")) return <ComingSoon brand={brand} pageName="Testimonials" />; const { TestimonialsPage } = await import("./pages/testimonials"); return <TestimonialsPage brand={brand} />; }
  if (subPath === "/reviews") { if (!isEnabled(brand, "reviews")) return <ComingSoon brand={brand} pageName="Reviews" />; const { ReviewsPage } = await import("./pages/reviews"); return <ReviewsPage brand={brand} />; }
  if (subPath === "/gallery" || subPath === "/portfolio") { if (!isEnabled(brand, "gallery")) return <ComingSoon brand={brand} pageName="Gallery" />; const { GalleryPage } = await import("./pages/gallery"); return <GalleryPage brand={brand} />; }
  if (subPath === "/book" || subPath === "/booking" || subPath === "/schedule") { if (!brand.booking_enabled) return <ComingSoon brand={brand} pageName="Book Appointment" />; const { BookingPage } = await import("./pages/booking"); return <BookingPage brand={brand} />; }
  if (subPath === "/quote" || subPath === "/request-quote") { if (!brand.quote_enabled) return <ComingSoon brand={brand} pageName="Request Quote" />; const { QuotePage } = await import("./pages/quote"); return <QuotePage brand={brand} />; }
  if (subPath === "/checkout" || subPath === "/pay") { if (!brand.checkout_enabled) return <ComingSoon brand={brand} pageName="Checkout" />; const { CheckoutPage } = await import("./pages/checkout"); return <CheckoutPage brand={brand} />; }
  if (subPath === "/support" || subPath === "/help") { if (!isEnabled(brand, "support")) return <ComingSoon brand={brand} pageName="Support" />; const { SupportPage } = await import("./pages/support"); return <SupportPage brand={brand} />; }
  if (subPath === "/chat" || subPath === "/ai-assistant") { if (!brand.chat_enabled) return <ComingSoon brand={brand} pageName="AI Assistant" />; const { AIChatPage } = await import("./pages/ai-chat"); return <AIChatPage brand={brand} />; }
  if (subPath === "/privacy" || subPath === "/privacy-policy") { const { PrivacyPage } = await import("./pages/privacy"); return <PrivacyPage brand={brand} />; }
  if (subPath === "/terms" || subPath === "/terms-conditions") { const { TermsPage } = await import("./pages/terms"); return <TermsPage brand={brand} />; }

  // Root: serve static site if folder exists
  const folder = brand.folder;
  if (folder) {
    const sitePath = path.join(process.cwd(), "public", "sites", folder, "index.html");
    if (existsSync(sitePath)) {
      const { BrandStaticSite } = await import("./brand-static");
      return <BrandStaticSite brand={brand} />;
    }
  }
  const { BrandLanding } = await import("./brand-landing");
  return <BrandLanding brand={brand} />;
}
