import { BrandHeader, BrandFooter } from "../brand-header";

export function ForgotPassword({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Floating blobs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-10 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-10 animate-float" style={{ background: `linear-gradient(135deg, ${accent}, ${primary})`, animationDelay: "2s" }} />

          <div className="relative">
            <div className="text-center mb-8 animate-scale-in">
              <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                �
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: primary }}>Reset Password</h1>
              <p className="text-sm opacity-60">Enter your WhatsApp number and we'll send you a reset link</p>
            </div>

            <div className="rounded-3xl border bg-white p-8 shadow-lg animate-scale-in" style={{ borderColor: `${accent}20`, animationDelay: "0.1s" }}>
              <form className="space-y-5" action={`https://${brand.slug}.cashcard.live/login`} method="GET">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">WhatsApp Number</label>
                  <input type="tel" required placeholder="+91 98765 43210" className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none focus:border-transparent focus:ring-2 shadow-sm" style={{ borderColor: `${accent}50` }} />
                </div>
                <button type="submit" className="btn-primary w-full py-3.5 text-sm">
                  Send Reset Link →
                </button>
              </form>
              <p className="text-xs text-center mt-5 opacity-50">
                Remember your password? <a href={`https://${brand.slug}.cashcard.live/login`} style={{ color: primary }} className="font-medium">Login →</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
