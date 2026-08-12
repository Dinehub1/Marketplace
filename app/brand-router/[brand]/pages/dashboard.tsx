import { BrandHeader, BrandFooter } from "../brand-header";

export function UserDashboard({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";

  const stats = [
    { label: "Orders", value: "12", icon: "📦", change: "+3 this week" },
    { label: "Bookings", value: "3", icon: "📅", change: "1 upcoming" },
    { label: "Messages", value: "5", icon: "💬", change: "2 unread" },
    { label: "Points", value: "2,450", icon: "⭐", change: "Redeemable" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: primary }}>Welcome back! 👋</h1>
            <p className="text-sm opacity-60">Your activity on {brand.name}</p>
          </div>
          <a href={`/business-dashboard`} className="text-sm font-medium px-4 py-2 rounded-xl border hover:bg-gray-50 transition-colors" style={{ borderColor: `${accent}50`, color: primary }}>
            Business View →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="card-lift rounded-2xl border bg-white p-5 text-center" style={{ borderColor: `${accent}30` }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: primary }}>{s.value}</div>
              <div className="text-xs opacity-50">{s.label}</div>
              <div className="text-xs mt-1" style={{ color: secondary }}>{s.change}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <a href={`/orders`} className="card-lift rounded-2xl border bg-white p-5" style={{ borderColor: `${accent}30` }}>
            <p className="font-bold" style={{ color: primary }}>My Orders</p>
            <p className="text-xs opacity-50 mt-1">View order history</p>
          </a>
          <a href={`/booking`} className="card-lift rounded-2xl border bg-white p-5" style={{ borderColor: `${accent}30` }}>
            <p className="font-bold" style={{ color: primary }}>Book Appointment</p>
            <p className="text-xs opacity-50 mt-1">Schedule a visit</p>
          </a>
          <a href={`/support`} className="card-lift rounded-2xl border bg-white p-5" style={{ borderColor: `${accent}30` }}>
            <p className="font-bold" style={{ color: primary }}>Get Help</p>
            <p className="text-xs opacity-50 mt-1">Contact support</p>
          </a>
        </div>

        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${accent}30` }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: primary }}>Recent Activity</h2>
          <div className="space-y-3">
            {[
              { text: "Order #1234 confirmed", time: "2 hours ago", icon: "✅" },
              { text: "Appointment scheduled for tomorrow", time: "1 day ago", icon: "📅" },
              { text: "New message from support", time: "2 days ago", icon: "💬" },
              { text: "Profile updated successfully", time: "3 days ago", icon: "👤" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b last:border-0" style={{ borderColor: `${accent}10` }}>
                <span className="text-lg">{item.icon}</span>
                <span className="opacity-70 flex-1">{item.text}</span>
                <span className="text-xs opacity-40">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
