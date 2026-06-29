"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  sarkarhealth: [
    { q: "Video consultation kaise book karein?", a: "App ya Website par jaayein, doctor choose karein, samay choose karein aur UPI se payment karein. Link mil jayega — click karein aur consult karein." },
    { q: "Kya dawai asli hoti hai?", a: "100%! Hum sirf licensed chemists aur authorized distributors se lete hain. Har dawai ka batch number aur expiry check kar sakte hain." },
    { q: "Lab test kaise hota hai?", a: "Aapke ghar se technician aata hai — sample collect karta hai. Report 24-48 ghanton mein online aa jaati hai." },
    { q: "Kya emergency mein madad milti hai?", a: "Haan! 24/7 helpline — ambulance bhi book kar sakte hain. Nearest hospital ki bhi jaankari milti hai." },
    { q: "Doctor kaun hain?", a: "Sabhi MBBS/MD/BAMS doctors — verified, experienced aur registered practitioners." },
    { q: "Kya mera health data secure hai?", a: "Bilkul. End-to-end encrypted — sirf aap aur aapka doctor dekh sakte hain." },
  ],
};

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
  const faqs = BRAND_FAQ[brand.slug] ?? (brand.faq_json ?? DEFAULT_FAQ) as any[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>FAQ</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>�क्सर प�छे जाने वा�े सवाल</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">SarkarHealth के बारे में कुछ सवा�ों के जवा�</p>
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
          <p className="opacity-70 mb-2">Aur sawal hain? Hamare doctor se baat karein.</p>
          <a href={`https://${brand.slug}.cashcard.live/contact`} className="font-bold" style={{ color: primary }}>Contact us →</a>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
