import { BrandHeader, BrandFooter } from "../brand-header";
import { categoriesForBrand } from "@/lib/brand-categories";
import { categoryPath, CITY_LABEL, getAreaIndex, titleize } from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";
import { CategoryCover } from "@/components/category-cover";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { SectionHeading } from "@/components/directory/SectionHeading";

const PAGE_SIZE = 24;
// Yelp carries 1,500+ categories and surfaces 22 on its homepage. This page was
// rendering all ~320 as chips above the listings, so the first thing a visitor
// met was a wall of links and the actual businesses were below the fold.
const FEATURED_CATEGORIES = 12;

async function fetchDirectory(
  q: string,
  cat: string,
  area: string,
  rating: number,
  sort: string,
  page: number,
  allowed: string[] | null,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  if (allowed && allowed.length === 0) return { rows: [], total: 0 };
  // Defense in depth (C9): never let a category outside the brand's slice reach
  // the query, regardless of where the caller got its `cat`.
  if (allowed && cat && !allowed.includes(cat)) cat = "";
  const filters: string[] = ["select=id,name,category,area,address,phone,rating,reviews_count,city,featured", "status=eq.active"];
  if (q) {
    const term = encodeURIComponent(`*${q}*`);
    filters.push(`or=(name.ilike.${term},category.ilike.${term})`);
  }
  if (cat) filters.push(`category=eq.${encodeURIComponent(cat)}`);
  else if (allowed) {
    filters.push(`category=in.(${allowed.map((c) => encodeURIComponent(`"${c}"`)).join(",")})`);
  }
  if (area) filters.push(`area=eq.${encodeURIComponent(area)}`);
  if (rating > 0) filters.push(`rating=gte.${rating}`);
  // Featured/priority placement always wins, then the chosen sort. Expose the
  // new columns in select so cards can render the Featured badge too.
  const tail =
    sort === "reviews" ? "reviews_count.desc.nullslast,name.asc"
    : sort === "name" ? "name.asc"
    : "rating.desc.nullslast,name.asc";
  const order = `featured.desc,priority.desc,${tail}`;
  filters.push(`order=${order}`);
  const from = (page - 1) * PAGE_SIZE;
  const res = await fetch(`${url}/rest/v1/businesses?${filters.join("&")}`, {
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      Range: `${from}-${from + PAGE_SIZE - 1}`, Prefer: "count=exact",
    },
    cache: "no-store",
  });
  const rows = res.ok ? await res.json() : [];
  const total = Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || 0;
  return { rows, total };
}

async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const counts = new Map<string, { category: string; count: number }>();
    for (let from = 0; ; from += 1000) {
      const res = await fetch(`${url}/rest/v1/businesses?select=category&status=eq.active&order=id.asc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
        next: { revalidate: 600 },
      });
      if (!res.ok) return [];
      const page: { category: string | null }[] = await res.json();
      for (const r of page) {
        if (!r.category) continue;
        const k = r.category.toLowerCase();
        const entry = counts.get(k);
        if (entry) entry.count += 1;
        else counts.set(k, { category: r.category, count: 1 });
      }
      if (page.length < 1000) break;
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  } catch { return []; }
}

export async function MarketplacePage({ brand, sp = {} }: { brand: any; sp?: Record<string, any> }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";

  const q = String(sp.q ?? "").trim();
  let cat = String(sp.cat ?? "").trim();
  const area = String(sp.area ?? "").trim();
  const rating = Math.min(5, Math.max(0, Number(sp.rating) || 0));
  const sort = String(sp.sort ?? "rating") === "reviews" ? "reviews" : String(sp.sort ?? "rating") === "name" ? "name" : "rating";
  const page = Math.max(1, Number(sp.page) || 1);

  const [allCategories, areas] = await Promise.all([fetchCategories(), getAreaIndex()]);
  const allowed = categoriesForBrand(brand.slug, allCategories.map((c) => c.category));
  const categories = allowed ? allCategories.filter((c) => allowed.includes(c.category)) : allCategories;
  // Tenant-isolation guard (C9): on a brand-scoped directory a direct ?cat= for
  // a category outside the brand's slice would otherwise bypass the filter and
  // surface the full multi-tenant directory. Drop it so it falls back to the
  // brand's own listings instead of leaking the parent directory's rows.
  if (allowed && cat && !allowed.includes(cat)) cat = "";
  const { rows, total } = await fetchDirectory(q, cat, area, rating, sort, page, allowed);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = "/marketplace";
  const filtered = Boolean(q || cat || area || rating);
  const quickCats = categories.slice(0, 8);

  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    if (area) p.set("area", area);
    if (rating) p.set("rating", String(rating));
    if (sort !== "rating") p.set("sort", sort);
    for (const [k, v] of Object.entries(over)) { if (v) p.set(k, String(v)); else p.delete(k); }
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <BrandHeader brand={brand} />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────────────
            Search is the primary action, so it lives in the hero. The mesh
            gradient is brand-tinted but stays quiet so the form reads first. */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                `radial-gradient(120% 90% at 15% 0%, ${primary}12 0%, transparent 55%),` +
                `radial-gradient(120% 90% at 85% 10%, ${secondary}10 0%, transparent 55%)`,
            }}
          />
          <div className="absolute inset-0 -z-10 opacity-[0.5] dot-pattern" />
          <div className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
            <div className="mb-4 text-4xl">📍</div>
            <h1
              className="text-[2.3rem] md:text-[3.25rem] font-extrabold text-neutral-900"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.04, textWrap: "balance" }}
            >
              Find a business in {CITY_LABEL}
            </h1>
            <p className="mt-3 text-base md:text-lg text-neutral-500" style={{ lineHeight: 1.55 }}>
              Plumbers, doctors, tutors and thousands more — with phone numbers you can call straight away.
            </p>

            <form action={base} method="GET" className="mt-8">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-[0_2px_10px_-2px_rgba(16,16,24,0.08),0_10px_40px_-12px_rgba(16,16,24,0.14)] ring-1 ring-black/[0.06] focus-within:ring-2 transition-shadow"
                   style={{ ["--tw-ring-color" as any]: `${primary}55` }}>
                <span className="pl-3.5 text-neutral-400" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                  </svg>
                </span>
                <input
                  name="q" defaultValue={q} aria-label="Search businesses"
                  placeholder={`Try “${quickCats[0]?.category ?? "plumber"}” or “dentist”`}
                  className="flex-1 bg-transparent px-2 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
                {cat && <input type="hidden" name="cat" value={cat} />}
                <button type="submit" className="press rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  Search
                </button>
              </div>
            </form>

            {/* Quick category picks — one tap to a filtered listing. */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {quickCats.map((c) => (
                <a
                  key={c.category}
                  href={`/marketplace?cat=${encodeURIComponent(c.category)}`}
                  className="press inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-black/[0.05] hover:bg-white"
                >
                  <CategoryIcon category={c.category} size={14} />
                  {titleize(c.category)}
                </a>
              ))}
            </div>

            {filtered && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-sm">
                <span className="text-neutral-500">
                  Showing results
                  {q ? ` for “${q}”` : ""}
                  {cat ? ` in ${titleize(cat)}` : ""}
                  {area ? ` near ${titleize(area)}` : ""}
                  {rating ? ` rated ${rating}★+` : ""}
                </span>
                <a href={base} className="press rounded-full bg-neutral-900/[0.05] px-3 py-1 text-xs font-semibold text-neutral-700">
                  Clear
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── POPULAR CATEGORIES ────────────────────────────────────────── */}
        {!filtered && categories.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pt-12">
            <SectionHeading
              title="Popular categories"
              subtitle="Browse Indore's most searched businesses"
              viewAllHref="/categories"
              viewAllLabel="Browse all"
              primary={primary}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.slice(0, FEATURED_CATEGORIES).map((c) => (
                <CategoryCard
                  key={c.category}
                  category={c.category}
                  count={c.count}
                  primary={primary}
                  secondary={secondary}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── LISTINGS ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          {/* Filter bar: a plain GET form so it works without JavaScript and
              keeps every choice in the URL (shareable, crawlable). */}
          <form action={base} method="GET" className="mb-7 flex flex-wrap items-center gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            {cat && <input type="hidden" name="cat" value={cat} />}
            <label className="sr-only" htmlFor="f-area">Area</label>
            <select
              id="f-area" name="area" defaultValue={area}
              className="press rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 ring-1 ring-black/[0.06] outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as any]: `${primary}55` }}
            >
              <option value="">All areas</option>
              {areas.slice(0, 30).map((a) => (
                <option key={a.slug} value={a.area}>{titleize(a.area)} ({a.count})</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="f-rating">Minimum rating</label>
            <select
              id="f-rating" name="rating" defaultValue={rating ? String(rating) : ""}
              className="press rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 ring-1 ring-black/[0.06] outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as any]: `${primary}55` }}
            >
              <option value="">Any rating</option>
              <option value="4">4★ &amp; up</option>
              <option value="4.5">4.5★ &amp; up</option>
            </select>

            <label className="sr-only" htmlFor="f-sort">Sort by</label>
            <select
              id="f-sort" name="sort" defaultValue={sort}
              className="press rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 ring-1 ring-black/[0.06] outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as any]: `${primary}55` }}
            >
              <option value="rating">Best rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="name">Name A–Z</option>
            </select>

            <button type="submit" className="press rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
              Apply
            </button>
            {filtered && (
              <a href={base} className="press rounded-xl bg-neutral-900/[0.04] px-4 py-2.5 text-sm font-semibold text-neutral-700">
                Reset
              </a>
            )}
          </form>

          <SectionHeading
            title={filtered ? "Results" : "Top rated businesses"}
            subtitle={filtered ? `${total.toLocaleString("en-IN")} ${total === 1 ? "result" : "results"}` : `${total.toLocaleString("en-IN")} verified businesses in ${CITY_LABEL}`}
          />
          {rows.length === 0 ? (
            <div className="rounded-2xl bg-white ring-1 ring-black/[0.05] px-6 py-16 text-center">
              <p className="text-lg font-semibold text-neutral-900">
                Nothing found{q ? ` for “${q}”` : ""}
              </p>
              <p className="mt-1.5 text-sm text-neutral-500">Check the spelling, or try one of these:</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 6).map((c) => (
                  <a key={c.category} href={categoryPath(c.category)}
                     className="press inline-flex items-center gap-2 rounded-full bg-neutral-900/[0.04] px-3.5 py-2 text-xs font-semibold text-neutral-700">
                    <span style={{ color: primary }}><CategoryIcon category={c.category} size={15} /></span>
                    {titleize(c.category)}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map((b: any) => (
                  <BusinessCard key={b.id} b={b} primary={primary} secondary={secondary} />
                ))}
              </div>

              {pages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2 text-sm">
                  {page > 1 && (
                    <a href={qs({ page: page - 1 })} rel="prev"
                       className="press rounded-xl bg-white px-4 py-2.5 font-semibold text-neutral-700 ring-1 ring-black/[0.06]">
                      ← Previous
                    </a>
                  )}
                  <span className="px-3 text-neutral-400">Page {page} of {pages}</span>
                  {page < pages && (
                    <a href={qs({ page: page + 1 })} rel="next"
                       className="press rounded-xl bg-white px-4 py-2.5 font-semibold text-neutral-700 ring-1 ring-black/[0.06]">
                      Next →
                    </a>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
