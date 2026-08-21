import { BrandHeader, BrandFooter } from "../brand-header";

export function SupportPage({ brand }: { brand: any }) {

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-24">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            Help Center
          </div>
          <h1 className="heading-xl mb-4">
            How can we <span className="gradient-text">help?</span>
          </h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto mb-8">Find answers, get support, and connect with our team</p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <input type="text" placeholder="Search for help..." className="w-full rounded-2xl border bg-surface px-5 py-4 pl-12 text-sm outline-none shadow-sm focus:border-transparent focus:ring-2" style={{ borderColor: "var(--hairline)" }} />
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
            { icon: "✉️", title: "Email", desc: "Send us a detailed message", link: `/contact` },
          ].map((c) => (
            <a key={c.title} href={`${c.link}`} className="card-lift rounded-2xl border bg-surface p-6 text-center shadow-sm group" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
              <h3 className="font-bold mb-1" style={{ color: "var(--brand-secondary)" }}>{c.title}</h3>
              <p className="text-sm opacity-50">{c.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* POPULAR TOPICS */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="heading-md text-center mb-8" style={{ color: "var(--brand-secondary)" }}>Popular Topics</h2>
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
            <a key={topic} href={`/faq`} className="card-lift flex items-center gap-3 px-5 py-4 rounded-xl border bg-surface text-sm font-medium shadow-sm group" style={{ borderColor: "var(--hairline)" }}>
              <span style={{ color: "var(--brand-secondary)" }} className="group-hover:translate-x-1 transition-transform">→</span>
              <span className="opacity-70">{topic}</span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Still need help?</h2>
              <p className="text-white/80 mb-6 max-w-lg mx-auto">Our support team is available 24/7 to assist you with anything you need.</p>
              <a href={`/contact`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg inline-block" style={{ color: "var(--brand-secondary)" }}>
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
