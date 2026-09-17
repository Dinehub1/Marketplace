import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";

const SECTIONS = [
  { id: "1", title: "Use of Platform", num: "1" },
  { id: "2", title: "Services", num: "2" },
  { id: "3", title: "Payments", num: "3" },
  { id: "4", title: "Refund Policy", num: "4" },
  { id: "5", title: "Prohibited Activities", num: "5" },
  { id: "6", title: "Limitation of Liability", num: "6" },
  { id: "7", title: "Governing Law", num: "7" },
  { id: "8", title: "Contact", num: "8" },
];

export function TermsPage({ brand }: { brand: Brand }) {

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
            📋 Legal
          </div>
          <h1 className="heading-xl mb-3">Terms & Conditions</h1>
          <p className="text-sm opacity-40">Last updated: June 28, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* TOC */}
          <div className="md:col-span-1 hidden md:block">
            <div className="sticky top-24 rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <p className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: "var(--brand-secondary)" }}>Contents</p>
              <div className="space-y-1.5">
                {SECTIONS.map((s) => (
                  <a key={s.id} href={`#section-${s.id}`} className="block text-sm opacity-60 hover:opacity-100 transition-opacity py-1">{s.num}. {s.title}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="rounded-3xl border bg-surface p-8 md:p-10 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <p className="text-sm opacity-70 mb-6">By accessing and using {brand.name} (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions.</p>
              <div className="space-y-8">
                <section id="section-1">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>1</span>
                    Use of Platform
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">You must be at least 18 years old to use this platform. You agree to provide accurate information and maintain the security of your account.</p>
                </section>

                <section id="section-2">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>2</span>
                    Services
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">{brand.name} provides {brand.description || "business services"} through our platform. Services are subject to availability and may change without notice.</p>
                </section>

                <section id="section-3">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>3</span>
                    Payments
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">All payments are processed securely through authorized payment gateways. Prices are listed in INR and include applicable taxes unless stated otherwise.</p>
                </section>

                <section id="section-4">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>4</span>
                    Refund Policy
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">Refund requests must be submitted within 7 days of purchase. Approved refunds will be processed within 5-7 business days to the original payment method.</p>
                </section>

                <section id="section-5">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>5</span>
                    Prohibited Activities
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">You agree not to misuse the platform, attempt unauthorized access, or engage in any activity that disrupts the service for others or violates applicable laws.</p>
                </section>

                <section id="section-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>6</span>
                    Limitation of Liability
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">{brand.name} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
                </section>

                <section id="section-7">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>7</span>
                    Governing Law
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of Indore courts.</p>
                </section>

                <section id="section-8">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>8</span>
                    Contact
                  </h2>
                  <p className="text-sm opacity-70 leading-relaxed">For questions about these terms, contact: {brand.contact_email || "legal@" + brand.slug + ".cashcard.live"}</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
