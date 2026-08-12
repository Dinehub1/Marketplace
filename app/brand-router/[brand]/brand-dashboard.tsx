import { BrandHeader, BrandFooter } from "./brand-header";
import { getBrandBusinesses } from "@/lib/brands";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function BrandDashboard({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const bg = theme.bg ?? "#f9fafb";

  // Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login`);

  const { rows, total } = await getBrandBusinesses(brand.slug, 8);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: primary }}>Dashboard</h1>
          <p className="text-sm opacity-60">Welcome back! Here&apos;s your brand overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <StatCard label="Listings" value={total.toString()} color={primary} />
          <StatCard label="Leads" value="0" color={secondary} />
          <StatCard label="Views" value="—" color={primary} />
          <StatCard label="Status" value="Active" color="#38a169" />
        </div>

        {/* Recent listings */}
        {rows.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: primary }}>Your Listings</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rows.map((b: any) => (
                <div key={b.id} className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: `${primary}20` }}>
                  <span className="font-medium text-sm">{b.name}</span>
                  <p className="text-xs opacity-50">{b.category} • {b.area}</p>
                  {b.rating && <span className="text-xs text-amber-500">★ {b.rating}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {!user && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            You are viewing the demo dashboard. <a href={`/login`} className="underline">Log in</a> for full access.
          </div>
        )}
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: `${color}20` }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs opacity-50">{label}</div>
    </div>
  );
}
