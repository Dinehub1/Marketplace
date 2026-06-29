import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_SERVICES: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
  sarkarconnect: [
    { icon: "🔗", title: "B2B कनेक्ट", desc: "सप्लायर, बायर और डिस्ट्रीब्यूटर से जुड़ें — अपने इंडस्ट्री के सबसे बड़े नेटवर्क में।" },
    { icon: "💼", title: "डिजिटल कार्ड", desc: "अपने व्यापार का प्रोफ़ेशनल डिजिटल कार्ड — QR कोड से शेयर करें, कनेक्ट करें।" },
    { icon: "📋", title: "प्रोडक्ट कैटलॉग", desc: "अपने उत्पादों को विस्तृत कैटलॉग में लिस्ट करें — इमेज, कीमत और विवरण के साथ।" },
    { icon: "📈", title: "डील मैनेजमेंट", desc: "हर लीड और डील ट्रैक करें — प्रपोज़ल से क्लोज़ तक पूरी प्रक्रिया।" },
    { icon: "🤖", title: "AI मैचिंग", desc: "हमारा AI आपकी ज़रूरत से मेल खाने वाले पार्टनर खोजता है — समय और पैसा बचाएं।" },
    { icon: "📊", title: "एनालिटिक्स डैशबोर्ड", desc: "आपके नेटवर्क की प्रदर्शन, डील की सफलता और ग्रोथ ट्रेंड्स देखें।" },
  ],
  sarkarhealth: [
    { icon: "🩺", title: "डॉक्टर कंसल्टेशन", desc: "MBBS, MD, Ayurvedic — किसी भी विशेषज्ञ से वीडियो या इन-पर्सन कंसल्टेशन बुक करें।" },
    { icon: "💊", title: "दवाई डिलीवरी", desc: "सभी ब्रांडेड और जनरिक दवाइयाँ — आपके दरवाजे पर, 40% तक बचत।" },
    { icon: "🏥", title: "लैब टेस्ट", desc: "ब्लड, यूरीन, ECG, X-Ray — आपके घर से सैंपल कलेक्शन और डिजिटल रिपोर्ट।" },
    { icon: "📋", title: "हेल्थ प्रोफ़ाइल", desc: "आपकी पूरी मेडिकल हिस्ट्री एक जगह — डॉक्टर को शेयर करें एक क्लिक में।" },
    { icon: "👨‍⚕️", title: "डॉक्टर खोज", desc: "स्पेशलिटी, अनुभव, रेटिंग और उपलब्धता के अनुसार सही डॉक्टर खोजें।" },
    { icon: "🚑", title: "एमरजेंसी", desc: "24/7 एमरजेंसी हेल्पलाइन — एम्बुलेंस बुकिंग और तत्काल मदद।" },
  ],
  sarkardost: [
    { icon: "🏪", title: "स्थानीय व्यापार लिस्टिंग", desc: "अपनी दुकान, कार्यालय या सेवा को इंदौर की सबसे बड़ी डिजिटल डायरेक्टरी पर लिस्ट करें।" },
    { icon: "📢", title: "लीड जनरेशन", desc: "संभावित ग्राहकों की जानकारी सीधे पाएं — WhatsApp और SMS पर तुरंत नोटिफिकेशन।" },
    { icon: "📊", title: "व्यापार एनालिटिक्स", desc: "आपकी लिस्टिंग के प्रदर्शन, ग्राहक इंटरैक्शन और प्रतिस्पर्धा की गहरी जानकारी।" },
    { icon: "🎯", title: "टार्गेटेड प्रचार", desc: "अपने इलाके और कैटेगरी के अनुसार ग्राहकों तक पहुंचें — बजट-फ्रेंडली विज्ञापन।" },
    { icon: "📱", title: "मोबाइल प्रोफ़ाइल", desc: "एक सुंदर मोबाइल-फ्रेंडली प्रोफ़ाइल पेज — आपकी डिजिटल पहचान।" },
    { icon: "🤝", title: "समुदाय नेटवर्किंग", desc: "अन्य स्थानीय व्यापारियों से जुड़ें, सहयोग बनाएं और एक-दूसरे को बढ़ावा दें।" },
  ],
};

const DEFAULT_SERVICES = [
  { icon: "⭐", title: "Premium Quality", desc: "Only the best for our customers. We never compromise on quality." },
  { icon: "🚀", title: "Fast Delivery", desc: "Quick and reliable service that respects your time." },
  { icon: "💬", title: "24/7 Support", desc: "Our team is always here to help you, any time of day." },
  { icon: "🔒", title: "Secure & Safe", desc: "Your data and transactions are protected with enterprise-grade security." },
  { icon: "💡", title: "Innovation First", desc: "We constantly improve our offerings with the latest technology." },
  { icon: "🤝", title: "Trusted by Thousands", desc: "Join our community of satisfied customers across India." },
];

export function ServicesPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const services = BRAND_SERVICES[brand.slug] ?? (brand.services_json ?? DEFAULT_SERVICES) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>हमारी सेवाएं</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>{brand.name} आपके लिए क्या कर सकता है?</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">
          Ghar baithe poora healthcare — doctor se milen, dawai payein, reports paayein — sab ek jagah.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s: any, i: number) => (
              <div key={i} className="card-lift rounded-2xl border bg-white p-6 h-full" style={{ borderColor: `${accent}30` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>{s.icon ?? "✦"}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{s.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{s.desc}</p>
                {s.price && <p className="mt-3 text-sm font-semibold" style={{ color: secondary }}>{s.price}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-caption mb-3" style={{ color: primary }}>यह कैसे काम करता है</p>
            <h2 className="heading-md mb-4" style={{ color: primary }}>सरल और सीधा प्रक्रिया</h2>
            <p className="text-body max-w-2xl mx-auto">कुछ ही चरणों में अपना व्यापार ऑनलाइन ले जाएं</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: "1", t: "साइन अप करें", d: "मोबाइल नंबर से मिनटों में अकाउंट बनाएं" },
              { n: "2", t: "विवरण भरें", d: "अपने व्यापार की जानकारी, फोटो और सेवाएं जोड़ें" },
              { n: "3", t: "सत्यापन पाएं", d: "हमारी टीम आपकी जानकारी सत्यापित करेगी — सुरक्षा के लिए" },
              { n: "4", t: "लाइव हो जाएं", d: "अब इंदौर में हर ग्राहक आपको खोज सकता है!" },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white mx-auto mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{step.n}</div>
                <h3 className="font-bold mb-1" style={{ color: primary }}>{step.t}</h3>
                <p className="text-sm opacity-60">{step.d}</p>
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
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">शुरू करने को तैयार?</h2>
              <p className="text-white/80 mb-8">Aaj hi apni family ka health profile banaayein — pehla consultation free!</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`https://${brand.slug}.cashcard.live/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>संपर्क करें →</a>
                <a href={`https://${brand.slug}.cashcard.live/pricing`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">प्राइसिंग देखें</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
