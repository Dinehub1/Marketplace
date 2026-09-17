import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";

export function BrandRegister({ brand }: { brand: Brand }) {

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left - Brand Side */}
          <div className="hidden md:block rounded-3xl p-10 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <div className="text-7xl mb-6">{brand.emoji ?? "🏢"}</div>
              <h2 className="text-3xl font-extrabold text-white mb-3">Join {brand.name}</h2>
              <p className="text-white/80 leading-relaxed mb-8">{brand.tagline}</p>
              <div className="space-y-3 text-left">
                {["Instant setup · No credit card required", "Access to all powerful features", "Priority 24/7 support included"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/90 text-sm">
                    <div className="w-5 h-5 rounded-full bg-surface/20 flex items-center justify-center text-xs">✓</div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div>
            <div className="text-center mb-6 md:hidden">
              <div className="text-5xl mb-2">{brand.emoji ?? "🏢"}</div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--brand-secondary)" }}>Join {brand.name}</h1>
              <p className="text-sm opacity-60 mt-1">Create your free account</p>
            </div>
            <div className="rounded-2xl border bg-surface p-6 md:p-8 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <h2 className="hidden md:block text-xl font-bold mb-6" style={{ color: "var(--brand-secondary)" }}>Create your account</h2>
              <form className="space-y-4" action={`/login`} method="GET">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Full Name</label>
                  <input type="text" required placeholder="Your full name" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2" style={{ borderColor: "var(--hairline)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">WhatsApp Number</label>
                  <input type="tel" required placeholder="+91 98765 43210" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Email (optional)</label>
                  <input type="email" placeholder="your@email.com" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Password</label>
                  <input type="password" required minLength={6} placeholder="Min 6 characters" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} />
                </div>
                <button type="submit" className="btn-primary w-full py-3 text-sm">
                  Create Account →
                </button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-surface-sunken" /></div>
                <div className="relative flex justify-center"><span className="bg-surface px-3 text-xs opacity-40">or continue with</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium hover:bg-surface-sunken" style={{ borderColor: "var(--hairline)" }}>💬 WhatsApp</button>
                <button className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium hover:bg-surface-sunken" style={{ borderColor: "var(--hairline)" }}>🌐 Google</button>
              </div>
              <p className="text-xs text-center mt-5 opacity-50">
                Already have an account? <a href={`/login`} style={{ color: "var(--brand-secondary)" }} className="font-medium">Login →</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
