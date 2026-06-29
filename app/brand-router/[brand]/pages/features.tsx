import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_FEATURES: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
  sarkardost: [
    { icon: "📍", title: "स्थानीय खोज", desc: "इंदौर के हर इलाके की दुकान, सेवा और विशेषज्ञ एक ही खिड़की पर — आसान और तेज़।" },
    { icon: "⭐", title: "सत्यापित समीक्षा", desc: "वास्तविक ग्राहकों की रेटिंग और समीक्षा — भरोसे का निर्णय लें सही सेवा चुनने में।" },
    { icon: "📢", title: "लाइव अपडेट", desc: "रोज़गार के अवसर, स्थानीय आयोजन और प्रशिक्षम की ताज़ा जानकारी सीधे आप तक।" },
    { icon: "💬", title: "सीधा संपर्क", desc: "मध्यस्थ के बिना सीधे सेवा प्रदाता से बात करें — WhatsApp, कॉल या संदेश से।" },
    { icon: "🏆", title: "समुदाय रैंकिंग", desc: "टॉप सेवा प्रदाताओं की रैंकिंग और बैज — सर्वोत्तम अनुभव की गारंटी।" },
    { icon: "📊", title: "व्यापार एनालिटिक्स", desc: "अपनी लिस्टिंग की प्रदर्शन जानें — व्यूज़, लीड और ग्राहक इंटरैक्शन का डैशबोर्ड।" },
  ],
  sarkarconnect: [
    { icon: "🔗", title: "B2B नेटवर्किंग", desc: "सप्लायर, मैन्युफैक्चरर, डिस्ट्रीब्यूटर और रिटेयर — सबसे जुड़ें व्यावसायिक नेटवर्क में।" },
    { icon: "💼", title: "डिजिटल कार्ड", desc: "अपने व्यापार का प्रोफ़ेशनल डिजिटल कार्ड बनाएं — शेयर करें, कनेक्ट करें, बढ़ें।" },
    { icon: "📈", title: "डील ट्रैकिंग", desc: "हर लीड, प्रपोज़ल और क्लोज़ डील का पूरा रिकॉर्ड — आपकी ग्रोथ का डेटा।" },
    { icon: "🤝", title: "बिज़नेस मैचिंग", desc: "AI-आधारित मैचिंग आपको सही पार्टनर से मिलाती है — ज़रूरत से मेल खाने वाले व्यापार।" },
    { icon: "📋", title: "प्रोडक्ट कैटलॉग", desc: "अपने उत्पादों और सेवाओं को कैटलॉग में लिस्ट करें — पूरे भारत में दिखाएं।" },
    { icon: "🔔", title: "रियल-टाइम नोटिफिकेशन", desc: "नए कनेक्ट रिक्वेस्ट, मैसेज और डील अपडेट — तुरंत सूचना।" },
  ],
  sarkarhealth: [
    { icon: "🩺", title: "वीडियो कंसल्टेशन", desc: "MBBS/MD डॉक्टरों से वीडियो कॉल पर मिलें — घर बैठे, 24/7 उपलब्ध।" },
    { icon: "💊", title: "दवाई डिलीवरी", desc: "सभी दवाइयाँ आपके दरवाजे पर — जनरिक विकल्प से 40% तक बचत।" },
    { icon: "📋", title: "हेल्थ रिकॉर्ड", desc: "आपकी पूरी मेडिकल हिस्ट्री सुरक्षित — रिपोर्ट, प्रिस्क्रिप्शन और अपॉइंटमेंट।" },
    { icon: "🏥", title: "लैब टेस्ट बुकिंग", desc: "ब्लड टेस्ट, X-Ray, ECG — आपके पास से सैंपल कलेक्शन और ऑनलाइन रिपोर्ट।" },
    { icon: "👨‍⚕️", title: "डॉक्टर खोज", desc: "स्पेशलिटी, अनुभव और रेटिंग के अनुसार सही डॉक्टर खोजें — क्लिक में।" },
    { icon: "🔔", title: "अपॉइंटमेंट रिमाइंडर", desc: "मिस न करें कोई अपॉइंटमेंट — SMS और WhatsApp रिमाइंडर।" },
  ],
};

const DEFAULT_FEATURES = [
  { icon: "⚡", title: "Lightning Fast", desc: "Optimized for speed and performance. Every interaction feels instant." },
  { icon: "📱", title: "Mobile First", desc: "Designed for the way you work — flawless on every device." },
  { icon: "🔒", title: "Secure by Default", desc: "Enterprise-grade security protecting your data 24/7." },
  { icon: "📊", title: "Smart Analytics", desc: "Real-time insights that help you make better decisions." },
  { icon: "🔗", title: "Easy Integrations", desc: "Connect with the tools you already use seamlessly." },
  { icon: "🌐", title: "Global Scale", desc: "Serve customers anywhere in the world without limits." },
  { icon: "🤖", title: "AI Powered", desc: "Smart automation that saves you time and effort." },
  { icon: "💳", title: "Easy Payments", desc: "UPI, cards, net banking — pay however you prefer." },
];

export function FeaturesPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";
  const features = BRAND_FEATURES[brand.slug] ?? (brand.features_json ?? DEFAULT_FEATURES) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.04]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-10 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})`, animationDelay: "3s" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            {brand.name} की विशेषताएं
          </div>
          <h1 className="heading-xl mb-4">
            {brand.name} क्यों <span className="gradient-text">अलग</span> है?
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">
            इंदौर के समुदाय के लिए बनाई गई विशेष सुविधाएं — आपके व्यापार और जीवन को आसान बनाने के लिए।
          </p>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f: any, i: number) => (
            <div
              key={i}
              className={`card-lift group rounded-2xl border bg-white p-6 shadow-sm ${i === 0 || i === 4 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
              style={{ borderColor: `${accent}25` }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform ${i === 0 || i === 4 ? 'w-16 h-16 text-3xl' : ''}`} style={{ background: `linear-gradient(135deg, ${primary}12, ${secondary}08)` }}>
                {f.icon ?? "✦"}
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{f.title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="section-tight">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
              {[
                { v: "500+", l: "स्थानीय व्यवसाय" },
                { v: "25,000+", l: "सक्रिय उपयोगकर्ता" },
                { v: "4.8★", l: "औसत रेटिंग" },
                { v: "24/7", l: "समर्थन" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl md:text-4xl font-extrabold mb-1">{s.v}</div>
                  <div className="text-sm opacity-70">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-caption mb-3" style={{ color: primary }}>यह कैसे काम करता है</p>
            <h2 className="heading-md" style={{ color: primary }}>तीन आसान चरणों मं शुरू करें</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { t: "मुफ्त में साइन अप", d: "किसी क्रेडिट कार्ड के बिना अपना अकाउंट बनाएं — बस मोबाइल नंबर चाहिए।" },
              { t: "अपनी लिस्टिंग जोड़ें", d: "अपनी दुकान, सेवा या कौशल की जानकारी भरें और तुरंत लाइव हो जाएं।" },
              { t: "ग्राहक पाएं और बढ़ें", d: "लीड प्राप्त करें, समीक्षाएं इकट्ठा करें और अपने समुदाय में प्रसिद्ध बनें।" },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{step.t}</h3>
                <p className="text-sm opacity-50">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
                {brand.name} के साथ आज ही जुड़ें
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                इंदौर के हज़ारों स्थानीय व्यवसाय पहले से जुड़ चुके हैं — आप अब कब रहेंगे?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`https://${brand.slug}.cashcard.live/register`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>
                  मुफ्त में शुरू करें →
                </a>
                <a href={`https://${brand.slug}.cashcard.live/contact`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                  संपर्क करें
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
