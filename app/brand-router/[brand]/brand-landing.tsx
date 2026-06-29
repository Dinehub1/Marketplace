import { BrandHeader, BrandFooter } from "./brand-header";
import { getBrandBusinesses } from "@/lib/brands";

export async function BrandLanding({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  const showListings = brand.features?.listings === true;
  const { rows, total } = showListings ? await getBrandBusinesses(brand.slug, 12) : { rows: [], total: 0 };

  // Brand-specific hero content
  const brandHero: Record<string, { headline: string; subheadline: string; highlights: string[] }> = {
    "sarkardost": {
      headline: "इंदौर की ताकत, आपकी जुड़ान",
      subheadline: "SarkarDost आपको आपने समुदाय से जोड़ता है — सेवाएं, अवसर और भरोसे के नेता, एक ही खिड़की पर।",
      highlights: [
        "📍 इंदौर की स्थानीय खोज — दूकान, सेवा, और विशेषज्ञ",
        "🤝 समुदाय भरोसा — समीक्षाएं, रेटिंग और वास्तविक फीडबैक",
        "📢 अवसर और सूचनाएं — रोज़गार, आयोजन और प्रशिक्षण की जानकारी",
      ],
    },
    "sarkarconnect": {
      headline: "B2B कनेक्शन जो काम करते हैं",
      subheadline: "SarkarConnect भारत के व्यापारियों को जोड़ता है — सप्लायर से लेकर डिस्ट्रीब्यूटर तक, एक ही प्लेटफ़ॉर्म पर।",
      highlights: [
        "🔗 वेरिफ़ाइड बिज़नेस नेटवर्क — हज़ारों सक्रिय व्यापारी",
        "📈 डील ट्रैकिंग — सीधे लीड से क्लोज़ तक का रिकॉर्ड",
        "💼 डिजिटल कार्ड — अपने व्यापार को प्रोफ़ेशनल तरीके से प्रेज़ेंट करें",
      ],
    },
    "sarkarhealth": {
      headline: "आपकी सेहत, हमारी ज़िम्मेदारी",
      subheadline: "SarkarHealth इंदौर के लिए पूर्ण हेल्थकेयर समाधान — डॉक्टर से लेकर दवाई तक, एक ही ऐप में।",
      highlights: [
        "🩺 वीडियो कंसल्टेशन — कहीं भी, कभी भी डॉक्टर से मिलें",
        "💊 ऑनलाइन दवाई ऑर्डर — घर बैठे दवाई पाएं",
        "📋 हेल्थ रिकॉर्ड — आपकी पूरी मेडिकल जानकारी सुरक्षित एक जगह",
      ],
    },
  };

  const hero = brandHero[brand.slug] || {
    headline: brand.tagline || brand.name,
    subheadline: brand.description || `${brand.name} — आपकी विश्वसनीय प्लेटफउर्म।`,
    highlights: [],
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 20%, ${primary} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${secondary} 0%, transparent 50%)` }} />
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})`, animationDelay: "3s" }} />

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mb-4 text-6xl">{brand.emoji ?? "🤝"}</div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: primary }}>
            {brand.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl font-semibold" style={{ color: secondary }}>
            {hero.headline}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base opacity-70 leading-relaxed">
            {hero.subheadline}
          </p>

          {/* Highlights */}
          {hero.highlights.length > 0 && (
            <div className="mt-8 mx-auto max-w-2xl space-y-3 text-left">
              {hero.highlights.map((h: string, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white/80 backdrop-blur-sm border px-5 py-3" style={{ borderColor: `${accent}30` }}>
                  <span className="text-lg mt-0.5">{h.split(" ")[0]}</span>
                  <span className="text-sm font-medium opacity-80">{h.substring(h.indexOf(" ") + 1)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {brand.features?.leads && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                📥 लीड कैप्चर
              </span>
            )}
            {brand.features?.payments && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                💳 UPI पेमेंट
              </span>
            )}
            {showListings && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                🗂️ {total.toLocaleString()} लिस्टिंग
              </span>
            )}
            {!brand.features?.leads && !brand.features?.payments && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                🏘️ इंदौर के {total > 0 ? `${total.toLocaleString()}+` : "हज़ारों"} स्थानीय व्यवसाय
              </span>
            )}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={`https://${brand.slug}.cashcard.live/login`}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
              style={{ backgroundColor: primary }}
            >
              शुरू करें →
            </a>
            <a
              href={`https://${brand.slug}.cashcard.live/about`}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold border-2 hover:bg-gray-50 transition-all"
              style={{ borderColor: accent, color: primary }}
            >
              और जानें
            </a>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="border-t" style={{ borderColor: `${accent}20` }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: "10,000+", label: "वेरिफ़ाइड बिज़नेस", icon: "🏢" },
              { v: "50,000+", label: "सक्रिय कनेक्शन", icon: "🔗" },
              { v: "500+", label: "मासिक डील्स", icon: "🤝" },
              { v: "25+", label: "इंडस्ट्री सेक्टर", icon: "📊" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-6 border bg-white" style={{ borderColor: `${accent}20` }}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-extrabold" style={{ color: primary }}>{s.v}</div>
                <div className="text-sm opacity-60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t" style={{ borderColor: `${accent}20`, backgroundColor: `${primary}04` }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>यह कैसे काम करता है</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>तीन आसान चरणों मं शुरू करें</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "डिजिटल कार्ड बनाएं", d: "अपने व्यापार का प्रोफ़ेशनल डिजिटल कार्ड बनाएं — QR कोड के साथ तुरंत शेयर करें।" },
              { n: "2", t: "B2B पार्टनर खोजें", d: "AI-आधारित मैचिंग से सही सप्लायर, बायर और डिस्ट्रीब्यूटर से जुड़ें।" },
              { n: "3", t: "डील क्लोज़ करें और बढ़ें", d: "लीड ट्रैक करें, प्रपोज़ल भेजें और सीधे डील क्लोज़ करें — पूरा रिकॉर्ड एक जगह।" },
            ].map((step) => (
              <div key={step.n} className="text-center relative">
                <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  {step.n}
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ color: primary }}>{step.t}</h3>
                <p className="text-sm opacity-60 leading-relaxed max-w-xs mx-auto">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Uses SarkarConnect */}
      <section className="border-t" style={{ borderColor: `${accent}20` }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>भारत के व्यापारियों का नेटवर्क</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>SarkarConnect का उपयोग कौन करता है?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🏭", t: "मैन्युफैक्चरर", d: "अपने उत्पादों को सही बायर तक पहुंचाएं — सीधे कनेक्शन" },
              { icon: "📦", t: "डिस्ट्रीब्यूटर", d: "नए मार्केट में विस्तार करें और रिटेयल नेटवर्क बनाएं" },
              { icon: "🛒", t: "रिटेयलर", d: "वेरिफ़ाइड सप्लायर खोजें और बेस्ट डील्स पाएं" },
              { icon: "💼", t: "सर्विस प्रोवाइडर", d: "B2B सेवाएं बेचें और कॉर्पोरेट क्लाइंट्स से जुड़ें" },
            ].map((u, i) => (
              <div key={i} className="rounded-2xl border bg-white p-6 text-center" style={{ borderColor: `${accent}30` }}>
                <div className="text-4xl mb-3">{u.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{u.t}</h3>
                <p className="text-sm opacity-60">{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      {showListings && rows.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12 w-full">
          <h2 className="mb-6 text-2xl font-bold" style={{ color: primary }}>
            Featured <span className="text-sm font-normal opacity-50">({total.toLocaleString()})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b: any) => (
              <div key={b.id} className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${accent}40` }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{b.name}</span>
                  {b.rating && <span className="text-xs text-amber-500">★ {b.rating}</span>}
                </div>
                {b.category && <p className="mt-1 text-xs opacity-50">{b.category}</p>}
                <p className="mt-2 text-xs opacity-40">{[b.area, b.city].filter(Boolean).join(", ")}</p>
                {b.phone && <a href={`tel:${b.phone}`} className="mt-1 inline-block text-xs font-medium" style={{ color: primary }}>📞 {b.phone}</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
            आज ही कनेक्ट करें — भारत के सबसे बड़े B2B नेटवर्क से
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            अपने व्यापार को मुफ्त में रजिस्टर करें और हज़ारों वेरिफ़ाइड पार्टनर्स तक पहुंचें।
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
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
