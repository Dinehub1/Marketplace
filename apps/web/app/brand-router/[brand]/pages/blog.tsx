import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { BlogPost } from "@/lib/brand-content";

const DEFAULT_POSTS: BlogPost[] = [
  { title: "Welcome to our blog", excerpt: "Latest news and updates from our team. Discover what's happening and how we're growing every day.", date: "2026-06-28", tag: "News", featured: true },
  { title: "Tips for getting started", excerpt: "Everything you need to know to make the most of our platform and services.", date: "2026-06-20", tag: "Guide", featured: false },
  { title: "Customer success story", excerpt: "See how our customers are achieving great results with our solutions.", date: "2026-06-15", tag: "Story", featured: false },
  { title: "Industry insights 2026", excerpt: "Key trends and insights shaping the industry this year and beyond.", date: "2026-06-10", tag: "Insights", featured: false },
  { title: "Behind the scenes", excerpt: "A look at how our team builds and delivers world-class experiences.", date: "2026-06-05", tag: "Culture", featured: false },
  { title: "Product updates", excerpt: "New features and improvements we've shipped recently.", date: "2026-06-01", tag: "Product", featured: false },
];

export function BlogPage({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const posts = (brand.blog_json ?? DEFAULT_POSTS);
  const tags = [...new Set(posts.map(p => p.tag).filter(Boolean))];
  const featured = posts.find(p => p.featured) ?? posts[0];
  const rest = posts.filter(p => p !== featured);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            Blog & News
          </div>
          <h1 className="heading-xl mb-4">
            Stories from <span className="gradient-text">{brand.name}</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">Insights, updates, and behind-the-scenes from our team</p>
        </div>
      </section>

      {/* TAG FILTER */}
      {tags.length > 1 && (
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <div className="flex flex-wrap justify-center gap-2">
            <button className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-sm" style={{ background: "var(--brand-gradient)" }}>All</button>
            {tags.map(tag => (
              <button key={tag} className="px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:opacity-80" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>{tag}</button>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED POST */}
      {featured && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="card-lift rounded-3xl overflow-hidden border bg-surface shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "var(--brand-gradient)" }}>Featured</span>
                  {featured.tag && <span className="text-xs opacity-40">{featured.tag}</span>}
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: "var(--brand-secondary)" }}>{featured.title}</h2>
                <p className="opacity-60 mb-6 leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center gap-4">
                  <a href="#" className="btn-primary">Read Article →</a>
                  {featured.date && <span className="text-xs opacity-40">{featured.date}</span>}
                </div>
              </div>
              <div className="relative min-h-[250px] md:min-h-full" style={{ background: `linear-gradient(135deg, ${primary}12, ${secondary}08)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl mb-3">📰</div>
                    <p className="text-sm font-bold" style={{ color: "var(--brand-secondary)" }}>{featured.tag}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* POST GRID */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="heading-md" style={{ color: "var(--brand-secondary)" }}>Latest Articles</h2>
          <span className="text-sm opacity-40">{rest.length} articles</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post, i: number) => (
            <article key={i} className="card-lift group rounded-2xl border bg-surface overflow-hidden shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <div className="h-40 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}10, ${secondary}05)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-500">
                    {post.tag === "Guide" ? "📘" : post.tag === "Story" ? "⭐" : post.tag === "News" ? "📰" : post.tag === "Insights" ? "💡" : post.tag === "Culture" ? "🎭" : post.tag === "Product" ? "🚀" : "📝"}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}>{post.tag}</span>
                  <span className="text-xs opacity-40">{post.date}</span>
                </div>
                <h3 className="font-bold mb-2 group-hover:opacity-70 transition-opacity" style={{ color: "var(--brand-secondary)" }}>{post.title}</h3>
                <p className="text-sm opacity-50 leading-relaxed line-clamp-2">{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Stay in the loop</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">Get the latest articles, tips, and updates delivered straight to your inbox.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" placeholder="your@email.com" className="flex-1 px-5 py-3.5 rounded-xl text-sm border-0 outline-none shadow-lg" />
                <button className="px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg hover:translate-y-[-2px] transition-transform" style={{ background: "var(--brand-tint)", border: "2px solid rgba(255,255,255,0.3)" }}>Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
