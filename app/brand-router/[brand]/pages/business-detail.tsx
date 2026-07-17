import { BrandHeader, BrandFooter } from "../brand-header";
import { LeadForm } from "./lead-form";

async function getBusiness(id: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const res = await fetch(`${url}/rest/v1/businesses?id=eq.${id}&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

const CATEGORY_ICONS: Record<string, string> = {
  "furniture store": "🛋️", "ac repair": "❄️", pharmacy: "💊", "chartered accountant": "📊",
  plumber: "🔧", dentist: "🦷", school: "🏫", "digital marketing agency": "📣",
  electrician: "💡", architect: "📐", salon: "💇", "home decor": "🏠", lawyer: "⚖️",
  hospital: "🏥", "car dealer": "🚗", gym: "🏋️", hotel: "🏨", cafe: "☕",
  "interior designer": "🎨", restaurant: "🍽️", "real estate agent": "🏘️", gynecologist: "🩺",
};

export async function BusinessDetailPage({ brand, businessId }: { brand: any; businessId: number }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";

  const biz = await getBusiness(businessId);

  if (!biz) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
        <BrandHeader brand={brand} />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: primary }}>Business nahi mila</h1>
            <a href={`https://${brand.slug}.cashcard.live/marketplace`} className="text-sm underline" style={{ color: primary }}>← Directory par wapas jaayein</a>
          </div>
        </main>
        <BrandFooter brand={brand} />
      </div>
    );
  }

  const icon = CATEGORY_ICONS[(biz.category ?? "").toLowerCase()] ?? "🏢";
  const mapsUrl = biz.lat && biz.lng
    ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}`
    : biz.address
      ? `https://www.google.com/maps/search/${encodeURIComponent(`${biz.name} ${biz.address}`)}`
      : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="px-6 pt-10 pb-6" style={{ background: `linear-gradient(135deg, ${primary}12, ${secondary}08)` }}>
        <div className="mx-auto max-w-5xl">
          <a href={`https://${brand.slug}.cashcard.live/marketplace`} className="text-xs opacity-50 hover:opacity-80">← Directory</a>
          <div className="mt-4 flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-white shadow-sm border" style={{ borderColor: `${accent}30` }}>{icon}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: primary }}>{biz.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {biz.category && <span className="rounded-full border px-3 py-1 text-xs font-medium bg-white" style={{ borderColor: `${accent}40`, color: primary }}>{biz.category}</span>}
                {biz.rating && <span className="text-amber-500 font-semibold">★ {biz.rating}</span>}
                {biz.source && <span className="text-xs opacity-40">✓ Verified listing</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Info column */}
          <div className="md:col-span-3 space-y-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}30` }}>
              <h2 className="font-bold mb-4" style={{ color: primary }}>Business ki jankari</h2>
              <div className="space-y-4 text-sm">
                {biz.address && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="opacity-70">{biz.address}</p>
                      {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: primary }}>Google Maps par dekhein</a>}
                    </div>
                  </div>
                )}
                {(biz.area || biz.city) && (
                  <div className="flex items-center gap-3"><span className="text-lg">🏙️</span><p className="opacity-70 capitalize">{[biz.area, biz.city].filter(Boolean).join(", ")}</p></div>
                )}
                {biz.phone && (
                  <div className="flex items-center gap-3"><span className="text-lg">📞</span><a href={`tel:${biz.phone}`} className="font-medium" style={{ color: primary }}>{biz.phone}</a></div>
                )}
                {biz.website && (
                  <div className="flex items-center gap-3"><span className="text-lg">🌐</span><a href={biz.website} target="_blank" rel="noopener noreferrer" className="font-medium break-all" style={{ color: primary }}>{biz.website.replace(/^https?:\/\//, "")}</a></div>
                )}
                {biz.rating && (
                  <div className="flex items-center gap-3"><span className="text-lg">⭐</span><p className="opacity-70">{biz.rating} rating — Google Maps reviews par aadharit</p></div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}30` }}>
              <h2 className="font-bold mb-2" style={{ color: primary }}>Is business ke owner hain?</h2>
              <p className="text-sm opacity-60 mb-3">Apne leads dekhein aur listing manage karein — WhatsApp number se login karein.</p>
              <a href={`https://${brand.slug}.cashcard.live/business-dashboard`} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: `${accent}50`, color: primary }}>
                📊 Business Dashboard kholen
              </a>
            </div>
          </div>

          {/* Lead form column */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm sticky top-6" style={{ borderColor: `${accent}30` }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: primary }}>💬 Contact karein</h2>
              <p className="text-xs opacity-50 mb-5">WhatsApp se verify karein — business ko turant lead milegi.</p>
              <LeadForm businessId={biz.id} businessName={biz.name} primary={primary} secondary={secondary} accent={accent} />
            </div>
          </div>
        </div>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
