import { BrandHeader, BrandFooter } from "../brand-header";

export function ForgotPassword({ brand }: { brand: any }) {

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="text-center mb-8 animate-scale-in">
              <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl animate-pulse-glow" style={{ background: "var(--brand-gradient)" }}>
                🔑
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: "var(--brand-secondary)" }}>Reset Password</h1>
              <p className="text-sm opacity-60">Enter your WhatsApp number and we'll send you a reset link</p>
            </div>

            <div className="rounded-3xl border bg-surface p-8 shadow-lg animate-scale-in" style={{ borderColor: "var(--hairline)", animationDelay: "0.1s" }}>
              <form className="space-y-5" action={`/login`} method="GET">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">WhatsApp Number</label>
                  <input type="tel" required placeholder="+91 98765 43210" className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none focus:border-transparent focus:ring-2 shadow-sm" style={{ borderColor: "var(--hairline)" }} />
                </div>
                <button type="submit" className="btn-primary w-full py-3.5 text-sm">
                  Send Reset Link →
                </button>
              </form>
              <p className="text-xs text-center mt-5 opacity-50">
                Remember your password? <a href={`/login`} style={{ color: "var(--brand-secondary)" }} className="font-medium">Login →</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
