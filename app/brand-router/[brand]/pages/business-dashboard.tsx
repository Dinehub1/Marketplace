import { BrandHeader, BrandFooter } from "../brand-header";

export function BusinessDashboard({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <main className="flex-1 mx-auto max-w-6xl px-6 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: primary }}>{brand.name} Dashboard</h1>
          <p className="text-sm opacity-60">Manage your business presence and track performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Views", value: "1,234", change: "+12%", icon: "👁️" },
            { label: "New Leads", value: "45", change: "+5%", icon: "📥" },
            { label: "Orders", value: "23", change: "+8%", icon: "�" },
            { label: "Revenue", value: "�45K", change: "+15%", icon: "💰" },
          ].map((s) => (
            <div key={s.label} className="card-lift rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${accent}20` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: primary }}>{s.value}</p>
              <p className="text-xs opacity-50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: primary }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>�</span>
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { icon: "✏️", label: "Edit Services", link: "/services" },
                { icon: "🖼️", label: "Update Gallery", link: "/gallery" },
                { icon: "📝", label: "Write Blog Post", link: "/blog" },
                { icon: "💰", label: "Update Pricing", link: "/pricing" },
                { icon: "📋", label: "Manage Listings", link: "/marketplace" },
              ].map((a) => (
                <a key={a.label} href={`https://${brand.slug}.cashcard.live${a.link}`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className="text-lg group-hover:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-sm font-medium opacity-70">{a.label}</span>
                  <span className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: primary }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>📥</span>
            </h2>
            <div className="space-y-3">
              {[
                { name: "Rahul S.", msg: "Interested in your services", time: "1h ago", status: "new" },
                { name: "Priya M.", msg: "Asked about pricing plans", time: "3h ago", status: "new" },
                { name: "Amit K.", msg: "Wants a callback", time: "5h ago", status: "pending" },
                { name: "Sneha R.", msg: "Bulk order inquiry", time: "1d ago", status: "contacted" },
              ].map((lead, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs opacity-50 truncate">{lead.msg}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs opacity-40">{lead.time}</p>
                    {lead.status === "new" && <span className="inline-block w-2 h-2 rounded-full bg-green-400 mt-1" />}
                    {lead.status === "pending" && <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mt-1" />}
                    {lead.status === "contacted" && <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
          <h2 className="font-bold mb-4" style={{ color: primary }}>Weekly Activity</h2>
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%`, background: `linear-gradient(to top, ${primary}, ${secondary})`, opacity: 0.7 + (i * 0.05) }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs opacity-40">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
