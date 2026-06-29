"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

const DEFAULT_FAQ = [
  { q: "How do I get started?", a: "Simply sign up and you can start using our services immediately. The process takes less than 2 minutes." },
  { q: "Is there a free plan?", a: "Yes! We offer a free tier with basic features. You can upgrade anytime for more advanced capabilities." },
  { q: "How do I contact support?", a: "You can reach us via email, WhatsApp, or the contact form. Our team responds within 24 hours." },
  { q: "Can I cancel anytime?", a: "Absolutely. No long-term contracts. Cancel anytime from your settings without any penalties." },
  { q: "Is my data secure?", a: "Yes, we use industry-standard encryption and follow best practices to keep your data safe at all times." },
  { q: "Do you offer custom solutions?", a: "Yes! For enterprise customers, we offer custom integrations and dedicated support. Contact us to learn more." },
];

export function FAQPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const faqs = (brand.faq_json ?? DEFAULT_FAQ) as any[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>FAQ</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>Frequently Asked Questions</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">Got questions? We've got answers. Can't find what you're looking for? Contact us.</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq: any, i: number) => (
            <div key={i} className="rounded-xl border overflow-hidden transition-all duration-300" style={{ borderColor: open === i ? primary : `${accent}30`, boxShadow: open === i ? `0 4px 20px -5px ${primary}20` : "none" }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-sm" style={{ color: primary }}>
                {faq.q}
                <span className="text-xl transition-transform duration-300" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-96" : "max-h-0"}`}>
                <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed border-t pt-3" style={{ borderColor: `${accent}20` }}>{faq.a}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center rounded-2xl p-8" style={{ backgroundColor: `${primary}08` }}>
          <p className="opacity-70 mb-2">Still have questions?</p>
          <a href={`https://${brand.slug}.cashcard.live/contact`} className="font-bold" style={{ color: primary }}>Contact us →</a>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
