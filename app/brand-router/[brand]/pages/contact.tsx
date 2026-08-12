import { BrandHeader, BrandFooter } from "../brand-header";

export function ContactPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const social = (brand.social ?? {}) as Record<string, string>;
  const isCustomerSite = !!brand.features?.listings;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>Contact</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>{isCustomerSite ? "We're here to help" : "Your business is our priority"}</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">{isCustomerSite ? "Have a question or need help finding a business or service? Our team replies within 24 hours." : "Reach out to us to join SarkarConnect, build connections, or with any question. Our team replies within 24 hours."}</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info */}
          <div>
            <h2 className="heading-md mb-6" style={{ color: primary }}>Contact information</h2>
            <div className="space-y-5">
              {brand.contact_email && (
                <div className="flex items-start gap-4 card-lift rounded-xl border bg-white p-4" style={{ borderColor: `${accent}30` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>📧</div>
                  <div><p className="text-xs opacity-50 mb-0.5">Email</p><a href={`mailto:${brand.contact_email}`} className="font-medium text-sm" style={{ color: primary }}>{brand.contact_email}</a></div>
                </div>
              )}
              {brand.contact_phone && (
                <div className="flex items-start gap-4 card-lift rounded-xl border bg-white p-4" style={{ borderColor: `${accent}30` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>📞</div>
                  <div><p className="text-xs opacity-50 mb-0.5">Phone</p><a href={`tel:${brand.contact_phone}`} className="font-medium text-sm" style={{ color: primary }}>{brand.contact_phone}</a></div>
                </div>
              )}
              {social.whatsapp && (
                <div className="flex items-start gap-4 card-lift rounded-xl border bg-white p-4" style={{ borderColor: `${accent}30` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>💬</div>
                  <div><p className="text-xs opacity-50 mb-0.5">WhatsApp</p><a href={`https://wa.me/${social.whatsapp}`} className="font-medium text-sm" style={{ color: primary }}>{social.whatsapp}</a></div>
                </div>
              )}
              {social.instagram && (
                <div className="flex items-start gap-4 card-lift rounded-xl border bg-white p-4" style={{ borderColor: `${accent}30` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>📸</div>
                  <div><p className="text-xs opacity-50 mb-0.5">Instagram</p><a href={`https://instagram.com/${social.instagram}`} className="font-medium text-sm" style={{ color: primary }}>@{social.instagram}</a></div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}30` }}>
            <h2 className="text-xl font-bold mb-5" style={{ color: primary }}>Send a message</h2>
            <form className="space-y-4" method="POST" action={`https://formsubmit.co/${brand.contact_email || ''}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium opacity-70 mb-1">{isCustomerSite ? "Your name" : "Business name"}</label><input type="text" name="business_name" required className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} /></div>
                <div><label className="block text-sm font-medium opacity-70 mb-1">Contact</label><input type="text" name="contact" required placeholder="Email or Phone" className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} /></div>
              </div>
              <div><label className="block text-sm font-medium opacity-70 mb-1">Subject</label><input type="text" name="subject" placeholder={isCustomerSite ? "Question / Feedback / Other" : "Join / Partnership / Other"} className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} /></div>
              <div><label className="block text-sm font-medium opacity-70 mb-1">Message</label><textarea name="message" rows={4} required className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} /></div>
              <button type="submit" className="btn-primary w-full">Send message</button>
              <p className="text-xs text-center opacity-40">We usually reply within 24 hours</p>
            </form>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
