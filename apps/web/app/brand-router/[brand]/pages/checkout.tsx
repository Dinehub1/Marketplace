import { BrandHeader, BrandFooter } from "../brand-header";

export function CheckoutPage({ brand }: { brand: any }) {

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="px-6 py-12 text-center">
        <h1 className="heading-xl mb-2">Secure <span className="gradient-text">Checkout</span></h1>
        <p className="opacity-60">Complete your purchase in seconds</p>
      </section>

      {/* STEPS INDICATOR */}
      <section className="mx-auto max-w-3xl px-6 pb-6">
        <div className="flex items-center justify-center gap-3">
          {["Cart", "Details", "Payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 2 ? 'text-white' : 'border opacity-40'}`} style={i === 2 ? { background: "var(--brand-gradient)" } : { borderColor: "var(--hairline)" }}>{i + 1}</div>
              <span className={`text-sm font-medium ${i === 2 ? '' : 'opacity-40'}`} style={i === 2 ? { color: "var(--brand-secondary)" } : {}}>{s}</span>
              {i < 2 && <div className="w-8 h-px bg-surface-sunken" />}
            </div>
          ))}
        </div>
      </section>

      {/* MAIN */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Payment Form */}
          <div className="md:col-span-3 rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: "var(--brand-secondary)" }}>Payment Method</h2>

            {/* UPI */}
            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 mb-3" style={{ borderColor: "var(--brand-secondary)", background: "var(--brand-tint)" }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "var(--brand-secondary)" }}><div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--brand-primary)" }} /></div>
                <span className="font-bold text-sm">UPI</span>
                <span className="text-xs opacity-50 ml-auto">GPay, PhonePe, Paytm</span>
              </div>
              <input type="text" placeholder="yourname@upi" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2" style={{ borderColor: "var(--hairline)" }} />
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-surface-sunken" />
              <span className="text-xs opacity-40 font-medium">or pay with card</span>
              <div className="flex-1 h-px bg-surface-sunken" />
            </div>

            {/* Card */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium opacity-70 mb-1">Expiry</label><input type="text" placeholder="MM/YY" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} /></div>
                <div><label className="block text-sm font-medium opacity-70 mb-1">CVV</label><input type="text" placeholder="123" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} /></div>
                <div><label className="block text-sm font-medium opacity-70 mb-1">Name</label><input type="text" placeholder="Name" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} /></div>
              </div>
            </div>

            <button className="btn-primary w-full mt-5 py-3.5 text-sm">
              Pay ₹1,179 →
            </button>
            <div className="flex items-center justify-center gap-3 text-xs opacity-40 mt-3">
              <span>🔒 256-bit SSL</span><span>•</span><span>Razorpay</span><span>•</span><span>PCI DSS</span>
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-surface p-6 shadow-sm sticky top-24" style={{ borderColor: "var(--hairline)" }}>
              <h2 className="font-bold mb-4" style={{ color: "var(--brand-secondary)" }}>Order Summary</h2>
              <div className="space-y-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
                <div className="flex justify-between"><span className="text-sm opacity-60">Pro Plan (Monthly)</span><span className="text-sm font-medium">₹999</span></div>
                <div className="flex justify-between"><span className="text-sm opacity-60">GST (18%)</span><span className="text-sm font-medium">₹180</span></div>
              </div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span style={{ color: "var(--brand-secondary)" }}>₹1,179</span></div>
              <div className="mt-4 text-xs opacity-40 text-center">Cancel anytime · No hidden charges</div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
