import { BrandHeader, BrandFooter } from "../brand-header";

const SECTIONS = [
  { id: "1", title: "Information We Collect", num: "1" },
  { id: "2", title: "How We Use Your Information", num: "2" },
  { id: "3", title: "Information Sharing", num: "3" },
  { id: "4", title: "Data Security", num: "4" },
  { id: "5", title: "Cookies", num: "5" },
  { id: "6", title: "Your Rights", num: "6" },
  { id: "7", title: "Contact Us", num: "7" },
];

export function PrivacyPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-10 right-20 w-64 h-64 rounded-full blur-3xl opacity-10 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            🔒 Legal
          </div>
          <h1 className="heading-xl mb-3">Privacy Policy</h1>
          <p className="text-sm opacity-40">Last updated: June 28, 2026</p>
        </div>
      </section>

      <div className="max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* TOC */}
          <div className="md:col-span-1 hidden md:block">
            <div className="sticky top-24 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${accent}15` }}>
              <p className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: primary }}>Contents</p>
              <div className="space-y-1.5">
                {SECTIONS.map((s) => (
                  <a key={s.id} href={`#section-${s.id}`} className="block text-sm opacity-60 hover:opacity-100 transition-opacity py-1">{s.num}. {s.title}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="rounded-3xl border bg-white p-8 md:p-10 shadow-sm" style={{ borderColor: `${accent}15` }}>
              <div className="space-y-8">
                <section id="section-1">
                  <h2 className="text-xl font-bold mt-0 mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>1</span>
                    Information We Collect
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">We collect information you provide directly, including name, phone number, email, and usage data when you interact with {brand.name}. We may also collect device information and browsing data to improve our services.</p>
                </section>

                <section id="section-2">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>2</span>
                    How We Use Your Information
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">We use your information to provide and improve our services, process transactions, send notifications, ensure security, and personalize your experience on our platform.</p>
                </section>

                <section id="section-3">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>3</span>
                    Information Sharing
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">We do not sell your personal data. We may share information with service providers who help us operate our platform, or when required by law to comply with legal obligations.</p>
                </section>

                <section id="section-4">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>4</span>
                    Data Security
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">We implement industry-standard security measures including 256-bit encryption, secure data centers, and regular security audits to protect your personal information against unauthorized access.</p>
                </section>

                <section id="section-5">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>5</span>
                    Cookies
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences in your browser settings.</p>
                </section>

                <section id="section-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>6</span>
                    Your Rights
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">You have the right to access, correct, or delete your personal data. You may also request data portability or object to certain processing activities. Contact us for any requests.</p>
                </section>

                <section id="section-7">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>7</span>
                    Contact Us
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">For privacy concerns, contact us at: {brand.contact_email || "privacy@" + brand.slug + ".cashcard.live"}</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BrandFooter brand={brand} />
    </div>
  );
}
