import { BrandHeader, BrandFooter } from "../brand-header";

const DEFAULT_TESTIMONIALS = [
  { name: "Rahul S.", text: "Amazing service! Highly recommended to everyone.", rating: 5 },
  { name: "Priya M.", text: "Best experience ever. Will definitely come back.", rating: 5 },
  { name: "Amit K.", text: "Great quality and fast delivery. Very satisfied.", rating: 4 },
  { name: "Sneha R.", text: "Professional team, excellent results.", rating: 5 },
  { name: "Vikram P.", text: "They transformed our business completely.", rating: 5 },
  { name: "Neha T.", text: "Outstanding support and service quality.", rating: 4 },
];

export function TestimonialsPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const testimonials = (brand.testimonials_json ?? DEFAULT_TESTIMONIALS) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>Testimonials</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>What Our Customers Say</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">Real reviews from real people who trust {brand.name}</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item: any, i: number) => (
              <div key={i} className="card-lift rounded-2xl border bg-white p-6 h-full flex flex-col" style={{ borderColor: `${accent}30` }}>
                <div className="flex items-center gap-1 mb-4">{[1,2,3,4,5].map((s) => <span key={s} className={s <= (item.rating ?? 5) ? "text-amber-400" : "text-gray-200"}>★</span>)}</div>
                <p className="text-sm opacity-70 italic leading-relaxed flex-1">"{item.text}"</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: `${accent}20` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{item.name?.charAt(0) ?? "?"}</div>
                  <div><p className="font-semibold text-sm">{item.name}</p>{item.role && <p className="text-xs opacity-50">{item.role}</p>}</div>
                </div>
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
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Join our happy customers</h2>
              <p className="text-white/80 mb-8">Experience the {brand.name} difference today.</p>
              <a href={`https://${brand.slug}.cashcard.live/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>Get Started →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
