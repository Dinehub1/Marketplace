import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_PLANS: Record<string, Array<{ name: string; price: string; period: string; features: string[]; highlighted: boolean; tagline?: string }>> = {
  sarkarconnect: [
    {
      name: "स्टार्टर",
      price: "मुफ्त",
      period: "",
      features: [
        "बेसिक डिजिटल कार्ड",
        "5 कनेक्ट/माह",
        "कैटलॉग में 3 प्रोडक्ट",
        "कम्युनिटी एक्सेस",
      ],
      highlighted: false,
      tagline: "नए व्यापारियों के लिए शुरुआत",
    },
    {
      name: "बिज़नेस",
      price: "₹799",
      period: "/माह",
      features: [
        "सब कुछ स्टार्टर में",
        "असीमित कनेक्ट",
        "असीमित प्रोडक्ट कैटलॉग",
        "डील ट्रैकिंग डैशबोर्ड",
        "प्राथमिकता समर्थन",
        "WhatsApp बिज़नेस बैज",
      ],
      highlighted: true,
      tagline: "⭐ सबसे लोकप्रिय — बढ़ते व्यापारों के लिए",
    },
    {
      name: "एंटरप्राइज",
      price: "₹2,499",
      period: "/माह",
      features: [
        "सब कुछ बिज़नेस में",
        "AI पार्टनर मैचिंग",
        "टीम मेंबर (5 तक)",
        "API एक्सेस",
        "कस्टम ब्रांडिंग",
        "समर्पित अकाउंट मैनेजर",
      ],
      highlighted: false,
      tagline: "बड़े व्यापारों के लिए",
    },
  ],
  sarkarhealth: [
    {
      name: "बेसिक",
      price: "मुफ्त",
      period: "",
      features: [
        "डॉक्टर खोज और प्रोफ़ाइल देखना",
        "2 अपॉइंटमेंट/माह",
        "बेसिक हेल्थ रिकॉर्ड",
        "कम्युनिटी फ़ोरम एक्सेस",
      ],
      highlighted: false,
      tagline: "शुरुआती स्वास्थ्य देखभाल",
    },
    {
      name: "हेल्थ प्रो",
      price: "₹299",
      period: "/माह",
      features: [
        "सब कुछ बेसिक में",
        "असीमित वीडियो कंसल्टेशन",
        "दवाई डिलीवरी (15% छूट)",
        "लैब टेस्ट बुकिंग (10% छूट)",
        "प्राथमिकता अपॉइंटमेंट",
        "हेल्थ रिपोर्ट डाउनलोड",
      ],
      highlighted: true,
      tagline: "⭐ सबसे लोकप्रिय — परिवार की सेहत",
    },
    {
      name: "फैमिली प्लान",
      price: "₹699",
      period: "/माह",
      features: [
        "सब कुछ हेल्थ प्रो में",
        "6 सदस्यों के लिए कवर",
        "असीमित कंसल्टेशन सभी के लिए",
        "मुफ्त लैब सैंपल कलेक्शन",
        "डॉक्टर होम विज़िट (मासिक 1)",
        "एमरजेंसी हेल्पलाइन 24/7",
      ],
      highlighted: false,
      tagline: "पूरे परिवार के लिए पूर्ण सुरक्षा",
    },
  ],
  sarkardost: [
    {
      name: "नीडी व्यवसाय",
      price: "मुफ्त",
      period: "",
      features: [
        "बेसिक लिस्टिंग (नाम, फोन, पता)",
        "समुदाय खोज में दिखना",
        "5 लीड/माह",
        "मोबाइल नंबर सत्यापन",
      ],
      highlighted: false,
      tagline: "शुरुआत करें — बिना किसी खर्च के",
    },
    {
      name: "प्रो व्यवसाय",
      price: "₹499",
      period: "/माह",
      features: [
        "सब कुछ नीडी में",
        "प्राथमिकता खोज में (टॉप पर)",
        "असीमित लीड",
        "WhatsApp नोटिफिकेशन",
        "फोटो गैलरी (10 फोटो)",
        "कैटेगरी विशेषज्ञता बैज",
        "एनालिटिक्स डैशबोर्ड",
      ],
      highlighted: true,
      tagline: "सबसे लोकप्रिय — तेज़ी से बढ़ें",
    },
    {
      name: "प्रीमियम पार्टनर",
      price: "₹1,499",
      period: "/माह",
      features: [
        "सब कुछ प्रो में",
        "विज्ञापन बैनर प्रदर्शन",
        "API एक्सेस (CRM इंटीग्रेशन)",
        "समर्पित अकाउंट मैनेजर",
        "कस्टम ब्रांड प्रोफ़ाइल पेज",
        "सीधे ग्राहक के संपर्क में",
        "प्राइसींग में 20% छूट",
      ],
      highlighted: false,
      tagline: "बड़े व्यापारों के लिए",
    },
  ],
};

const DEFAULT_PLANS = [
  { name: "Starter", price: "Free", period: "", features: ["Basic listing", "Community support", "1 project", "Email notifications"], highlighted: false },
  { name: "Pro", price: "₹999", period: "/mo", features: ["Everything in Starter", "Priority support", "10 projects", "Analytics dashboard", "Custom domain", "API access"], highlighted: true },
  { name: "Enterprise", price: "₹4,999", period: "/mo", features: ["Everything in Pro", "Dedicated manager", "Unlimited projects", "Advanced analytics", "SLA guarantee", "White-label"], highlighted: false },
];

export function PricingPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const plans = BRAND_PLANS[brand.slug] ?? (brand.pricing_json ?? DEFAULT_PLANS) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>प्राइसिंग</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>साफ़ और सीधी कीमतें</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">
            अपने व्यापार के हिसाब से प्लान चुनें। कोई छुपी फीस नहीं, कभी भी रद्द कर सकते हैं।
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan: any, i: number) => (
              <div key={i} className={`card-lift rounded-2xl p-6 flex flex-col ${plan.highlighted ? "md:scale-105 shadow-2xl" : "shadow-sm"}`} style={plan.highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { border: `1px solid ${accent}30` }}>
                {plan.highlighted && <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">⭐ सबसे लोकप्रिय</div>}
                {plan.tagline && <div className={`text-xs font-medium mb-2 ${plan.highlighted ? "text-white/70" : "opacity-50"}`}>{plan.tagline}</div>}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-white" : ""}`} style={!plan.highlighted ? { color: primary } : {}}>{plan.name}</h3>
                <div className="mb-4">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : ""}`} style={!plan.highlighted ? { color: primary } : {}}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.highlighted ? "text-white/70" : "opacity-50"}`}>{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {(plan.features ?? []).map((f: string, j: number) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-white/90" : "opacity-70"}`}>
                      <span style={!plan.highlighted ? { color: primary } : {}}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={`https://${brand.slug}.cashcard.live/register`} className={`block text-center rounded-xl py-3 text-sm font-bold transition-all hover:translate-y-[-2px] ${plan.highlighted ? "bg-white" : "text-white"}`} style={!plan.highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { color: primary }}>
                  {plan.price === "मुफ्त" ? "अभी शुरू करें" : "सब्सक्राइब करें"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="heading-md" style={{ color: primary }}>अक्सर पूछे जाने वाले सवाल</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Kya main free mein doctor se baat kar sakta hoon?", a: "Pehla consultation free hai! Uske baad Health Pro plan mein unlimited video consultations milte hain sirf �299/maheene." },
              { q: "Kya doctor ghar par aayega?", a: "Haan, Family Plan (₹699/mein) mein monthly 1 doctor home visit shamil hai — specialist physician aapke ghar aayega." },
              { q: "Dawai kaise order karein?", a: "Prescription upload karein ya direct order karein — generic options mein 40% tak bachat. Same-day delivery Indore mein." },
              { q: "Kya insurance claim hoga?", a: "Hum TPA tie-up ke saath hain — cashless claims aram se process hoti hain. Billing documents milte hain directly app mein." },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5" style={{ borderColor: `${accent}30` }}>
                <h3 className="font-bold mb-2" style={{ color: primary }}>{faq.q}</h3>
                <p className="text-sm opacity-60">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Custom Plan Chahiye?</h2>
          <p className="text-white/80 mb-8">Badho hospitals, clinics aur chains ke liye special pricing available hai.</p>
              <a href={`https://${brand.slug}.cashcard.live/quote`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>कस्टम कोट मांगें →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
