import { BrandHeader, BrandFooter } from "../brand-header";

const PAGE_SIZE = 24;

const CATEGORY_ICONS: Record<string, string> = {
  "furniture store": "🛋️", "ac repair": "❄️", pharmacy: "💊", "chartered accountant": "📊",
  plumber: "🔧", dentist: "🦷", school: "🏫", "digital marketing agency": "📣",
  electrician: "💡", architect: "📐", salon: "💇", "home decor": "🏠", lawyer: "⚖️",
  hospital: "🏥", "car dealer": "🚗", gym: "🏋️", hotel: "🏨", cafe: "☕",
  "interior designer": "🎨", restaurant: "🍽️", "real estate agent": "🏘️", gynecologist: "🩺",
};

async function fetchDirectory(q: string, cat: string, page: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const filters: string[] = ["select=id,name,category,area,address,phone,rating,city"];
  if (q) {
    const term = encodeURIComponent(`*${q}*`);
    filters.push(`or=(name.ilike.${term},category.ilike.${term})`);
  }
  if (cat) filters.push(`category=eq.${encodeURIComponent(cat)}`);
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
      const res = await fetch(`${url}/rest/v1/businesses?select=category&order=id.asc`, {
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
  const bg = theme.bg ?? "#faf5ff";

  const q = String(sp.q ?? "").trim();
  const cat = String(sp.cat ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total }, categories] = await Promise.all([fetchDirectory(q, cat, page), fetchCategories()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = `https://${brand.slug}.cashcard.live/marketplace`;
  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    for (const [k, v] of Object.entries(over)) { if (v) p.set(k, String(v)); else p.delete(k); }
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1">
        <section className="px-6 py-12 text-center" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>
          <h1 className="text-4xl font-extrabold mb-2" style={{ color: primary }}>Business Directory</h1>
          <p className="text-lg opacity-60">{total.toLocaleString()} verified businesses in Indore</p>
          <form action={base} method="GET" className="mt-6 mx-auto flex max-w-xl gap-2">
            <input name="q" defaultValue={q} placeholder="Business ya category khojein — plumber, dentist, cafe..."
                   className="flex-1 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm" style={{ borderColor: `${accent}50` }} />
            {cat && <input type="hidden" name="cat" value={cat} />}
            <button type="submit" className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>Khojein</button>
          </form>
        </section>

        {/* Category chips */}
        {categories.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pt-8">
            <div className="flex flex-wrap gap-2">
              <a href={qs({ cat: "", page: "" })} className="rounded-full border px-4 py-1.5 text-xs font-medium"
                 style={cat === "" ? { backgroundColor: primary, color: "white", borderColor: primary } : { borderColor: `${accent}50`, color: primary, backgroundColor: "white" }}>
                Sab ({categories.reduce((s, c) => s + c.count, 0)})
              </a>
              {categories.map((c) => (
                <a key={c.category} href={qs({ cat: c.category, page: "" })} className="rounded-full border px-4 py-1.5 text-xs font-medium"
                   style={cat === c.category ? { backgroundColor: primary, color: "white", borderColor: primary } : { borderColor: `${accent}50`, color: primary, backgroundColor: "white" }}>
                  {CATEGORY_ICONS[c.category.toLowerCase()] ?? "🏢"} {c.category} ({c.count})
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6 py-8">
          {rows.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">Koi business nahi mila{q ? ` "${q}" ke liye` : ""}.</p>
              <a href={base} className="text-sm underline mt-2 inline-block" style={{ color: primary }}>Sab businesses dekhein</a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rows.map((b: any) => (
                  <a key={b.id} href={`https://${brand.slug}.cashcard.live/business/${b.id}`}
                     className="group rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                     style={{ borderColor: `${accent}30` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}12, ${secondary}08)` }}>
                        {CATEGORY_ICONS[(b.category ?? "").toLowerCase()] ?? "🏢"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm leading-snug group-hover:underline" style={{ color: primary }}>{b.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {b.rating && <span className="text-amber-500 font-semibold">★ {b.rating}</span>}
                          {b.category && <span className="opacity-50">{b.category}</span>}
                        </div>
                      </div>
                    </div>
                    {b.address && <p className="mt-3 text-xs opacity-40 line-clamp-2">📍 {b.address}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs opacity-40 capitalize">{[b.area, b.city].filter(Boolean).join(", ")}</span>
                      <span className="text-xs font-semibold" style={{ color: primary }}>Contact karein →</span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2 text-sm">
                  {page > 1 && <a href={qs({ page: page - 1 })} className="rounded-xl border bg-white px-4 py-2" style={{ borderColor: `${accent}40`, color: primary }}>← Pichla</a>}
                  <span className="opacity-50 px-3">Page {page} / {pages}</span>
                  {page < pages && <a href={qs({ page: page + 1 })} className="rounded-xl border bg-white px-4 py-2" style={{ borderColor: `${accent}40`, color: primary }}>Agla →</a>}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
