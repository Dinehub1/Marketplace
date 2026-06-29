import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_ABOUT: Record<string, { story: string; mission: string; values: Array<{ icon: string; title: string; desc: string }> }> = {
  sarkardost: {
    story: "SarkarDost की शुरुआत इंदौर में हुई — जहाँ एक सामान्य चाय की दुकान से मिले दो दोस्तों ने देखा कि स्थानीय व्यापारियों को अपने ग्राहकों तक पहुंचने के लिए रोज़गार का संघर्ष करना पड़ता है।\n\n2024 में, हमने तय किया कि इंदौर के हर दुकानदार, सेवा प्रदाता और विशेषज्ञ को एक समान मंच मिलना चाहिए — जहाँ वे अपनी क्षमता से ग्राहक पा सकें, बिना बड़े प्लेटफ़ॉर्मों की भारी फीस चुकाए।\n\nआज SarkarDost इंदौर के 500+ स्थानीय व्यापारों, 25,000+ सक्रिय उपयोगकर्ताओं और 15+ इलाकों को जोड़ता है — एक समुदाय जहाँ भरोसा, स्थानीयता और तकनीक मिलती है।",
    mission: "हमारा मिशन इंदौर के हर व्यापार को डिजिटल रूप से सशक्त बनाना है — ताकि वे अपनी कार्यक्षेत्र से सीमित न रहें और पूरे शहर के ग्राहकों तक पहुंच सकें।",
    values: [
      { icon: "🤝", title: "भरोसा", desc: "हर लिस्टिंग और समीक्षा सत्यापित है — हम पारदर्शिता को प्राथमिकता देते हैं।" },
      { icon: "📍", title: "स्थानीयता", desc: "इंदौर पहले — हमारी हर विशेषता शहर की ज़रूरतों के अनुसार बनी है।" },
      { icon: "🚀", title: "सादगी", desc: "टेक्नोलॉजी आसान होनी चाहिए — हमारा प्लेटफ़ॉर्म किसी भी उम्र के व्यापारी को चला सके।" },
      { icon: "💚", title: "समुदाय", desc: "हम व्यापार नहीं, रिश्ते बनाते हैं — हर इंटरैक्शन को बराबरी का मानते हैं।" },
    ],
  },
};

export function AboutPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const team = (brand.team_json ?? []) as any[];
  const about = BRAND_ABOUT[brand.slug];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.04]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-2xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${secondary}, ${accent})`, animationDelay: "3s" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            {brand.name} के बारे में
          </div>
          <h1 className="heading-xl mb-6">
            <span style={{ color: primary }}>{brand.name}</span>{" "}
            <span className="gradient-text">— कहानी</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto leading-relaxed">{brand.tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`https://${brand.slug}.cashcard.live/contact`} className="btn-primary">संपर्क करें</a>
            <a href={`https://${brand.slug}.cashcard.live/services`} className="btn-secondary">हमारी सेवाएं</a>
          </div>
        </div>
      </section>

      {/* STORY */}
      {about && (
        <section className="section">
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-caption mb-3" style={{ color: primary }}>हमारी कहानी</p>
              <h2 className="heading-md mb-4" style={{ color: primary }}>इंदौर से, इंदौर के लिए</h2>
              <p className="text-body leading-relaxed whitespace-pre-line mb-4">
                {about.story}
              </p>
              {about.mission && (
                <div className="rounded-2xl p-5 border-l-4" style={{ borderColor: primary, backgroundColor: `${primary}05` }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: primary }}>हमारा मिशन</p>
                  <p className="text-sm opacity-70">{about.mission}</p>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">{brand.emoji ?? "🤝"}</div>
                    <p className="text-2xl font-bold" style={{ color: primary }}>{brand.name}</p>
                    <p className="text-sm opacity-50 mt-1">इंदौर का समुदाय नेटवर्क</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl shadow-lg flex items-center justify-center text-3xl animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>🏙️</div>
            </div>
          </div>
        </section>
      )}

      {/* VALUES */}
      {about && (
        <section className="section-tight">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-caption mb-3" style={{ color: primary }}>हमारे मूल्य</p>
              <h2 className="heading-md" style={{ color: primary }}>SarkarDost को अलग बनाने वाली चीज़ें</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {about.values.map((v, i) => (
                <div key={i} className="rounded-2xl border bg-white p-6 text-center" style={{ borderColor: `${accent}30` }}>
                  <div className="text-4xl mb-3">{v.icon}</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{v.title}</h3>
                  <p className="text-sm opacity-60">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="section-tight">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl p-8 md:p-12" style={{ background: `linear-gradient(135deg, ${primary}08, ${secondary}05)` }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { v: "500+", l: "स्थानीय व्यवसाय" },
                { v: "25,000+", l: "सक्रिय उपयोगकर्ता" },
                { v: "4.8★", l: "औसत रेटिंग" },
                { v: "15+", l: "इंदौर इलाके" },
              ].map((s) => (
                <div key={s.l} className="text-center rounded-2xl border p-6 bg-white" style={{ borderColor: `${accent}30` }}>
                  <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: primary }}>{s.v}</div>
                  <div className="text-sm opacity-50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      {team.length > 0 && (
        <section className="section">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <p className="text-caption mb-3" style={{ color: primary }}>लोग</p>
              <h2 className="heading-md mb-4" style={{ color: primary }}>हमारी टीम से मिलें</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {team.map((m: any, i: number) => (
                <div key={i} className="card-lift rounded-2xl border bg-white p-6 text-center" style={{ borderColor: `${accent}30` }}>
                  {m.photo ? <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover shadow-md" /> : <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-md" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{m.name?.charAt(0) ?? "?"}</div>}
                  <p className="font-bold">{m.name}</p>
                  {m.role && <p className="text-sm opacity-50">{m.role}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">साथ बढ़ने को तैयार?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                {brand.name} के साथ अपने व्यापार को नई ऊंचाई दें।
              </p>
              <a href={`https://${brand.slug}.cashcard.live/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>बातचीत शुरू करें →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
