import { BrandHeader, BrandFooter } from "../brand-header";
import { categoriesForBrand } from "@/lib/brand-categories";
import { categoryPath, cleanBusinessName } from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";

const PAGE_SIZE = 24;
// Yelp carries 1,500+ categories and surfaces 22 on its homepage. This page was
// rendering all ~320 as chips above the listings, so the first thing a visitor
// met was a wall of links and the actual businesses were below the fold.
const FEATURED_CATEGORIES = 12;

async function fetchDirectory(q: string, cat: string, page: number, allowed: string[] | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  if (allowed && allowed.length === 0) return { rows: [], total: 0 };
  const filters: string[] = ["select=id,name,category,area,address,phone,rating,city", "status=eq.active"];
  if (q) {
    const term = encodeURIComponent(`*${q}*`);
    filters.push(`or=(name.ilike.${term},category.ilike.${term})`);
  }
  if (cat) filters.push(`category=eq.${encodeURIComponent(cat)}`);
  else if (allowed) {
    filters.push(`category=in.(${allowed.map((c) => encodeURIComponent(`"${c}"`)).join(",")})`);
  }
  filters.push("order=rating.desc.nullslast,name.asc");
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

function titleize(s: string) {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function telHref(phone: string) {
  const d = phone.replace(/[^\d+]/g, "");
  return `tel:${d.startsWith("+") ? d : `+91${d.replace(/^0+/, "")}`}`;
}

export async function MarketplacePage({ brand, sp = {} }: { brand: any; sp?: Record<string, any> }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";

  const q = String(sp.q ?? "").trim();
  const cat = String(sp.cat ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const allCategories = await fetchCategories();
  const allowed = categoriesForBrand(brand.slug, allCategories.map((c) => c.category));
  const categories = allowed ? allCategories.filter((c) => allowed.includes(c.category)) : allCategories;
  const { rows, total } = await fetchDirectory(q, cat, page, allowed);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const origin = `https://${brand.slug}.cashcard.live`;
  const base = `${origin}/marketplace`;
  const filtered = Boolean(q || cat);
  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    for (const [k, v] of Object.entries(over)) { if (v) p.set(k, String(v)); else p.delete(k); }
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    /* Neutral ground. The page used to be washed in the brand's mint `bg`,
       which flattened everything to one tone — cards, chrome and background all
       reading at the same weight. White surfaces on a near-white ground let the
       brand colour work as an accent instead of a tint. */
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <BrandHeader brand={brand} />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────────────
            Search is the primary action, so it lives in the hero rather than
            in a separate band beneath it. */}
        <section className="relative overflow-hidden border-b border-black/[0.06]">
          <div
            className="absolute inset-0 -z-10"
            style={{ background: `radial-gradient(120% 100% at 50% 0%, ${primary}14 0%, transparent 62%)` }}
          />
          <div className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
            <h1
              className="text-[2.1rem] md:text-[3rem] font-extrabold text-neutral-900"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.05, textWrap: "balance" }}
            >
              Find a business in Indore
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
                  placeholder="Try “plumber” or “dentist”"
                  className="flex-1 bg-transparent px-2 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
                {cat && <input type="hidden" name="cat" value={cat} />}
                <button type="submit" className="press rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  Search
                </button>
              </div>
            </form>

            {filtered && (
              <div className="mt-4 flex items-center justify-center gap-2.5 text-sm">
                <span className="text-neutral-500">
                  Showing results{q ? ` for “${q}”` : ""}{cat ? ` in ${titleize(cat)}` : ""}
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
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="text-lg font-bold text-neutral-900" style={{ letterSpacing: "-0.015em" }}>
                Popular categories
              </h2>
              <a href={`${origin}/categories`} className="press text-sm font-semibold" style={{ color: primary }}>
                Browse all →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.slice(0, FEATURED_CATEGORIES).map((c) => (
                <a
                  key={c.category}
                  href={`${origin}${categoryPath(c.category)}`}
                  className="card-lift group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(16,16,24,0.04)]"
                >
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${primary}12`, color: primary }}
                  >
                    <CategoryIcon category={c.category} size={19} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-neutral-800">
                    {titleize(c.category)}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── LISTINGS ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-lg font-bold text-neutral-900 mb-5" style={{ letterSpacing: "-0.015em" }}>
            {filtered ? "Results" : "Top rated businesses"}
          </h2>

          {rows.length === 0 ? (
            <div className="rounded-2xl bg-white ring-1 ring-black/[0.05] px-6 py-16 text-center">
              <p className="text-lg font-semibold text-neutral-900">
                Nothing found{q ? ` for “${q}”` : ""}
              </p>
              <p className="mt-1.5 text-sm text-neutral-500">Check the spelling, or try one of these:</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 6).map((c) => (
                  <a key={c.category} href={`${origin}${categoryPath(c.category)}`}
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
                  <article key={b.id}
                    className="card-lift group relative flex flex-col rounded-2xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(16,16,24,0.04)]">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${primary}10`, color: primary }}>
                        <CategoryIcon category={b.category ?? ""} size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold leading-snug text-neutral-900">
                          {/* Stretched link: the whole card is the target, but
                              only one link is in the accessibility tree. */}
                          <a href={`${origin}/business/${b.id}`} className="after:absolute after:inset-0">
                            {cleanBusinessName(b.name)}
                          </a>
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                          {b.rating != null && (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" />
                              </svg>
                              {b.rating}
                            </span>
                          )}
                          {b.category && <span className="truncate">{titleize(b.category)}</span>}
                        </div>
                      </div>
                    </div>

                    {b.address && (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-neutral-500">{b.address}</p>
                    )}

                    {/* Above the stretched link so it stays independently
                        tappable — calling is the conversion. */}
                    {b.phone && (
                      <a href={telHref(b.phone)}
                         className="press relative z-10 mt-auto pt-4 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-white"
                         style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z" />
                        </svg>
                        {b.phone}
                      </a>
                    )}
                  </article>
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
