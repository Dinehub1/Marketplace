import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { ReviewCard } from "@/lib/brand-content";

const DEFAULT_REVIEWS: ReviewCard[] = [
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
        <span key={s} className={s <= rating ? "tone-gold" : "text-ink-4"}>★</span>
      ))}
    </div>
  );
}

export function ReviewsPage({ brand }: { brand: Brand }) {
  const reviews = brand.reviews_json ?? DEFAULT_REVIEWS;
  const avg = reviews.length ? (reviews.reduce((s: number, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO WITH BIG RATING */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            Customer Reviews
          </div>
          <h1 className="heading-xl mb-4">
            Loved by <span className="gradient-text">{reviews.length}+ customers</span>
          </h1>
          <p className="text-lg opacity-60 mb-8">See what people are saying about their experience with {brand.name}</p>

          {/* Big Rating Display */}
          <div className="inline-flex items-center gap-4 rounded-2xl bg-surface shadow-lg px-8 py-5 border" style={{ borderColor: "var(--hairline)" }}>
            <div className="text-5xl font-extrabold" style={{ color: "var(--brand-secondary)" }}>{avg}</div>
            <div className="text-left">
              <StarRating rating={Math.round(Number(avg))} size="md" />
              <p className="text-sm opacity-50 mt-1">Based on {reviews.length} reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* RATING BREAKDOWN */}
      <section className="mx-auto max-w-2xl px-6 py-4">
        <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-8 text-right" style={{ color: "var(--brand-secondary)" }}>{star}★</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-surface-sunken">
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
          {reviews.map((r, i) => (
            <div key={i} className="card-lift rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <StarRating rating={r.rating} />
              <p className="text-sm mt-3 opacity-70 leading-relaxed">&quot;{r.text}&quot;</p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--brand-gradient)" }}>
                  {r.name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className="text-xs opacity-40">{[r.city, r.date].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="tone-positive text-xs font-medium flex items-center gap-1">
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
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Share your experience</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">Your feedback helps us improve and helps others discover {brand.name}</p>
              <a href={`/contact`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg inline-block" style={{ color: "var(--brand-secondary)" }}>
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
