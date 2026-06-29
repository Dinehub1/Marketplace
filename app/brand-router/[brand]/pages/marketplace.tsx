import { BrandHeader, BrandFooter } from "../brand-header";
import { getBrandBusinesses } from "@/lib/brands";

export async function MarketplacePage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";
  const { rows, total } = await getBrandBusinesses(brand.slug, 50);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1">
        <section className="px-6 py-16 text-center" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: primary }}>
            {brand.category === "jobs" ? "Job Listings" : brand.category === "realestate" ? "Properties" : "Marketplace"}
          </h1>
          <p className="text-lg opacity-60">{total.toLocaleString()} listings available</p>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-12">
          {rows.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg">No listings yet.</p>
              <p className="text-sm mt-1">Check back soon or <a href={`https://${brand.slug}.cashcard.live/contact`} style={{ color: primary }}>contact us</a>.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((b: any) => (
                <div key={b.id} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: `${accent}30` }}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{b.name}</h3>
                    {b.rating && <span className="text-xs text-amber-500">★ {b.rating}</span>}
                  </div>
                  {b.category && <p className="mt-1 text-xs opacity-50">{b.category}</p>}
                  {b.address && <p className="mt-1 text-xs opacity-40">{b.address}</p>}
                  <p className="mt-2 text-xs opacity-40">{[b.area, b.city].filter(Boolean).join(", ")}</p>
                  {b.phone && <a href={`tel:${b.phone}`} className="mt-2 inline-block text-xs font-medium" style={{ color: primary }}>📞 {b.phone}</a>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
