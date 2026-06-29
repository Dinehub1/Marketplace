import { BrandHeader, BrandFooter } from "../brand-header";

export function SupportPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-24">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-10 right-20 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            Help Center
          </div>
          <h1 className="heading-xl mb-4">
            How can we <span className="gradient-text">help?</span>
          </h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto mb-8">Find answers, get support, and connect with our team</p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <input type="text" placeholder="Search for help..." className="w-full rounded-2xl border bg-white px-5 py-4 pl-12 text-sm outline-none shadow-sm focus:border-transparent focus:ring-2" style={{ borderColor: `${accent}30` }} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40">🔍</span>
          </div>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="mx-auto max-w-4xl px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: "❓", title: "FAQ", desc: "Find quick answers to common questions", link: `/faq` },
            { icon: "💬", title: "WhatsApp", desc: "Chat with us instantly", link: `https://wa.me/${(brand.social || {}).whatsapp || brand.contact_phone || ""}` },
            { icon: "�", title: "Email", desc: "Send us a detailed message", link: `/contact` },
          ].map((c) => (
            <a key={c.title} href={`https://${brand.slug}.cashcard.live${c.link}`} className="card-lift rounded-2xl border bg-white p-6 text-center shadow-sm group" style={{ borderColor: `${accent}20` }}>
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
              <h3 className="font-bold mb-1" style={{ color: primary }}>{c.title}</h3>
              <p className="text-sm opacity-50">{c.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* POPULAR TOPICS */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="heading-md text-center mb-8" style={{ color: primary }}>Popular Topics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "How to place an order?",
            "Payment options & refunds",
            "Track my order status",
            "Account settings & password",
            "Contact the business",
            "Pricing & subscription plans",
            "Cancellation policy",
            "Privacy & data protection",
          ].map((topic) => (
            <a key={topic} href={`https://${brand.slug}.cashcard.live/faq`} className="card-lift flex items-center gap-3 px-5 py-4 rounded-xl border bg-white text-sm font-medium shadow-sm group" style={{ borderColor: `${accent}15` }}>
              <span style={{ color: primary }} className="group-hover:translate-x-1 transition-transform">→</span>
              <span className="opacity-70">{topic}</span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Still need help?</h2>
              <p className="text-white/80 mb-6 max-w-lg mx-auto">Our support team is available 24/7 to assist you with anything you need.</p>
              <a href={`https://${brand.slug}.cashcard.live/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg inline-block" style={{ color: primary }}>
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
