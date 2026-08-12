import { BrandHeader, BrandFooter } from "../brand-header";

const DEFAULT_REVIEWS = [
  { name: "Rahul S.", text: "Excellent quality and service! The team went above and beyond to help us. Highly recommend to anyone looking for professional solutions.", rating: 5, date: "2026-06-15", city: "Indore" },
  { name: "Priya M.", text: "Very happy with the experience. Quick response, great communication, and the result exceeded my expectations.", rating: 5, date: "2026-06-10", city: "Bhopal" },
  { name: "Amit K.", text: "Good value for money. The team is professional and delivers on time. Would definitely work with them again.", rating: 4, date: "2026-06-05", city: "Mumbai" },
  { name: "Sneha R.", text: "Fast and reliable. They understood our requirements perfectly and delivered exactly what we needed.", rating: 5, date: "2026-05-28", city: "Pune" },
  { name: "Vikram P.", text: "Great experience overall. Minor delays but the quality of work was outstanding. Very professional team.", rating: 4, date: "2026-05-20", city: "Delhi" },
  { name: "Anita D.", text: "Absolutely fantastic! From start to finish, everything was smooth and professional. 10/10 would recommend.", rating: 5, date: "2026-05-15", city: "Bangalore" },
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm";
  return (
    <div className={`flex gap-0.5 ${cls}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </div>
  );
}

export function ReviewsPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";
  const reviews = (brand.reviews_json ?? DEFAULT_REVIEWS) as any[];
  const avg = reviews.length ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO WITH BIG RATING */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-10 right-20 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            Customer Reviews
          </div>
          <h1 className="heading-xl mb-4">
            Loved by <span className="gradient-text">{reviews.length}+ customers</span>
          </h1>
          <p className="text-lg opacity-60 mb-8">See what people are saying about their experience with {brand.name}</p>

          {/* Big Rating Display */}
          <div className="inline-flex items-center gap-4 rounded-2xl bg-white shadow-lg px-8 py-5 border" style={{ borderColor: `${accent}20` }}>
            <div className="text-5xl font-extrabold" style={{ color: primary }}>{avg}</div>
            <div className="text-left">
              <StarRating rating={Math.round(Number(avg))} size="md" />
              <p className="text-sm opacity-50 mt-1">Based on {reviews.length} reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* RATING BREAKDOWN */}
      <section className="mx-auto max-w-2xl px-6 py-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-8 text-right" style={{ color: primary }}>{star}★</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: star >= 4 ? "#10b981" : star >= 3 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span className="text-xs opacity-40 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REVIEWS GRID */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r: any, i: number) => (
            <div key={i} className="card-lift rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
              <StarRating rating={r.rating} />
              <p className="text-sm mt-3 opacity-70 leading-relaxed">"{r.text}"</p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: `${accent}15` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  {r.name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className="text-xs opacity-40">{[r.city, r.date].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="text-green-500 text-xs font-medium flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                  Verified
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Share your experience</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">Your feedback helps us improve and helps others discover {brand.name}</p>
              <a href={`/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg inline-block" style={{ color: primary }}>
                Write a Review →
              </a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
