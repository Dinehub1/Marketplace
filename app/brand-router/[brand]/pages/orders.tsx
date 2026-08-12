import { BrandHeader, BrandFooter } from "../brand-header";

const ORDERS = [
  { id: "#1234", item: "Pro Subscription", amount: "₹1,179", status: "Confirmed", date: "2026-06-28", timeline: [true, true, false, false] },
  { id: "#1230", item: "General Consultation", amount: "₹500", status: "Completed", date: "2026-06-25", timeline: [true, true, true, true] },
  { id: "#1225", item: "Premium Service", amount: "₹2,500", status: "Pending", date: "2026-06-20", timeline: [true, false, false, false] },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, any> = {
    Confirmed: { bg: "#dcfce7", text: "#166534" },
    Completed: { bg: "#dbeafe", text: "#1e40af" },
    Pending: { bg: "#fef3c7", text: "#92400e" },
    Cancelled: { bg: "#fee2e2", text: "#991b1b" },
  };
  const c = colors[status] ?? colors.Pending;
  return <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: c.bg, color: c.text }}>{status}</span>;
}

export function Orders({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <main className="flex-1 mx-auto max-w-3xl px-6 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: primary }}>My Orders</h1>
            <p className="text-sm opacity-50">{ORDERS.length} orders placed</p>
          </div>
          <a href={`/marketplace`} className="btn-primary text-xs py-2.5 px-5">
            Browse More →
          </a>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          {ORDERS.map((o) => (
            <div key={o.id} className="card-lift rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${accent}20` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-base" style={{ color: primary }}>{o.item}</p>
                  <p className="text-xs opacity-40 mt-0.5">{o.id} · {o.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl" style={{ color: primary }}>{o.amount}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 mt-4 pt-4 border-t" style={{ borderColor: `${accent}10` }}>
                {["Placed", "Confirmed", "Shipped", "Delivered"].map((step, i) => (
                  <div key={step} className="flex-1">
                    <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: o.timeline[i] ? "100%" : "0%", backgroundColor: primary }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs opacity-40">
                <span>Placed</span>
                <span>Confirmed</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
