import { BrandHeader, BrandFooter } from "../brand-header";
import { categoriesForBrand } from "@/lib/brand-categories";
import { categoryPath, CITY_LABEL, getAreaIndex, titleize } from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";
import { BusinessCard, type BusinessCardData } from "@/components/directory/BusinessCard";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { SectionHeading } from "@/components/directory/SectionHeading";
import type { Brand } from "@/lib/brands";

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
  const filters: string[] = ["select=id,name,category,area,address,phone,rating,reviews_count,city,featured", "status=eq.active", `city=eq.${encodeURIComponent(CITY_LABEL)}`];
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
  const rows: BusinessCardData[] = res.ok ? await res.json() : [];
  const total = Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || 0;
  return { rows, total };
}

async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const counts = new Map<string, { category: string; count: number }>();
    for (let from = 0; ; from += 1000) {
      const res = await fetch(`${url}/rest/v1/businesses?select=category&status=eq.active&city=eq.${encodeURIComponent(CITY_LABEL)}&order=id.asc`, {
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

export async function MarketplacePage({ brand, sp = {} }: { brand: Brand; sp?: Record<string, string | string[] | undefined> }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";

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
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────────────
            Search is the primary action, so it lives in the hero. The mesh
            gradient is brand-tinted but stays quiet so the form reads first. */}
        <section className="relative isolate overflow-hidden">
          <div className="aurora" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-60" />
          <div className="mx-auto max-w-3xl px-6 pb-14 pt-16 text-center">
            <p className="eyebrow mb-4">{CITY_LABEL} directory</p>
            <h1 className="heading-xl">Find a business in {CITY_LABEL}</h1>
            <p className="text-lede mx-auto mt-4 max-w-xl">
              Plumbers, doctors, tutors and thousands more — with phone numbers you can call straight away.
            </p>

            <form action={base} method="GET" className="mt-8">
              <div
                className="flex items-center gap-2 rounded-2xl border p-1.5 transition-shadow"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--hairline)",
                  boxShadow: "var(--shadow-3)",
                }}
              >
                <span className="pl-3.5 text-ink-3" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                  </svg>
                </span>
                <input
                  name="q" defaultValue={q} aria-label="Search businesses"
                  placeholder={`Try “${quickCats[0]?.category ?? "plumber"}” or “dentist”`}
                  className="flex-1 bg-transparent px-2 py-3 text-[1rem] text-ink placeholder:text-ink-4 outline-none"
                />
                {cat && <input type="hidden" name="cat" value={cat} />}
                <button type="submit" className="btn-primary">Search</button>
              </div>
            </form>

            {/* Quick category picks — one tap to a filtered listing. */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {quickCats.map((c) => (
                <a
                  key={c.category}
                  href={`/marketplace?cat=${encodeURIComponent(c.category)}`}
                  className="chip"
                >
                  <CategoryIcon category={c.category} size={14} />
                  {titleize(c.category)}
                </a>
              ))}
            </div>

            {filtered && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-sm">
                <span className="text-ink-3">
                  Showing results
                  {q ? ` for “${q}”` : ""}
                  {cat ? ` in ${titleize(cat)}` : ""}
                  {area ? ` near ${titleize(area)}` : ""}
                  {rating ? ` rated ${rating}★+` : ""}
                </span>
                <a href={base} className="chip">Clear</a>
              </div>
            )}
          </div>
        </section>

        {/* ── POPULAR CATEGORIES ────────────────────────────────────────── */}
        {!filtered && categories.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pt-12">
            <SectionHeading
              eyebrow="Categories"
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
              className="input w-auto py-2.5 text-[0.875rem] font-[560]"
            >
              <option value="">All areas</option>
              {areas.slice(0, 30).map((a) => (
                <option key={a.slug} value={a.area}>{titleize(a.area)} ({a.count})</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="f-rating">Minimum rating</label>
            <select
              id="f-rating" name="rating" defaultValue={rating ? String(rating) : ""}
              className="input w-auto py-2.5 text-[0.875rem] font-[560]"
            >
              <option value="">Any rating</option>
              <option value="4">4★ &amp; up</option>
              <option value="4.5">4.5★ &amp; up</option>
            </select>

            <label className="sr-only" htmlFor="f-sort">Sort by</label>
            <select
              id="f-sort" name="sort" defaultValue={sort}
              className="input w-auto py-2.5 text-[0.875rem] font-[560]"
            >
              <option value="rating">Best rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="name">Name A–Z</option>
            </select>

            <button type="submit" className="btn-primary btn-sm">Apply</button>
            {filtered && <a href={base} className="btn-ghost btn-sm">Reset</a>}
          </form>

          <SectionHeading
            title={filtered ? "Results" : "Top rated businesses"}
            subtitle={filtered ? `${total.toLocaleString("en-IN")} ${total === 1 ? "result" : "results"}` : `${total.toLocaleString("en-IN")} verified businesses in ${CITY_LABEL}`}
          />
          {rows.length === 0 ? (
            <div className="card px-6 py-16 text-center">
              <span
                className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl"
                style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}
                aria-hidden="true"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                </svg>
              </span>
              <p className="heading-sm">Nothing found{q ? ` for “${q}”` : ""}</p>
              <p className="mt-2 text-[0.9375rem]" style={{ color: "var(--ink-2)" }}>
                Check the spelling, or try one of these:
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 6).map((c) => (
                  <a key={c.category} href={categoryPath(c.category)} className="chip">
                    <span style={{ color: "var(--brand-secondary)" }}>
                      <CategoryIcon category={c.category} size={15} />
                    </span>
                    {titleize(c.category)}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map((b) => (
                  <BusinessCard key={b.id} b={b} primary={primary} secondary={secondary} />
                ))}
              </div>

              {pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <a href={qs({ page: page - 1 })} rel="prev" className="btn-secondary btn-sm">
                      ← Previous
                    </a>
                  )}
                  <span className="tabular px-3 text-[0.875rem]" style={{ color: "var(--ink-3)" }}>
                    Page {page} of {pages}
                  </span>
                  {page < pages && (
                    <a href={qs({ page: page + 1 })} rel="next" className="btn-secondary btn-sm">
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
