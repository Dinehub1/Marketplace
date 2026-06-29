"use client";
import { useState } from "react";

const NAV = [
  { key: "services", label: "Services", path: "/services", icon: "✦" },
  { key: "pricing", label: "Pricing", path: "/pricing", icon: "💰" },
  { key: "marketplace", label: "Listings", path: "/marketplace", icon: "🗂️" },
  { key: "about", label: "About", path: "/about", icon: "ℹ️" },
  { key: "blog", label: "Blog", path: "/blog", icon: "📝" },
  { key: "contact", label: "Contact", path: "/contact", icon: "📞" },
];

export function BrandHeader({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const flags = (brand.page_flags ?? {}) as Record<string, boolean>;
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = NAV.filter((n) => {
    if (flags[n.key] === false) return false;
    if (n.key === "marketplace" && !brand.features?.listings) return false;
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-3">
          {/* Logo */}
          <a href={`https://${brand.slug}.cashcard.live/`} className="flex items-center gap-2.5 group">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.name} className="h-9 w-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                {brand.name.charAt(0)}
              </span>
            )}
            <span className="font-bold text-lg hidden sm:block" style={{ color: primary }}>{brand.name}</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visible.map((item) => (
              <a key={item.key} href={`https://${brand.slug}.cashcard.live${item.path}`} className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors opacity-70 hover:opacity-100">
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <a href={`https://${brand.slug}.cashcard.live/login`} className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
              Login
            </a>
            <a href={`https://${brand.slug}.cashcard.live/contact`} className="hidden md:inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold border-2 hover:bg-gray-50 transition-all" style={{ borderColor: accent, color: primary }}>
              Get Started
            </a>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">{mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 border-t" : "max-h-0"}`} style={{ borderColor: `${accent}20` }}>
          <div className="px-4 py-4 space-y-1">
            {visible.map((item) => (
              <a key={item.key} href={`https://${brand.slug}.cashcard.live${item.path}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                <span className="text-lg">{item.icon}</span> {item.label}
              </a>
            ))}
            <div className="pt-3 flex gap-2">
              <a href={`https://${brand.slug}.cashcard.live/login`} className="flex-1 text-center rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>Login</a>
              <a href={`https://${brand.slug}.cashcard.live/contact`} className="flex-1 text-center rounded-xl py-2.5 text-sm font-bold border-2" style={{ borderColor: accent, color: primary }}>Get Started</a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export function BrandFooter({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#f9fafb";
  const social = (brand.social ?? {}) as Record<string, string>;
  const flags = (brand.page_flags ?? {}) as Record<string, boolean>;

  return (
    <footer className="mt-auto" style={{ backgroundColor: `${primary}08` }}>
      {/* CTA Banner */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
          <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Ready to get started?</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">Join thousands of customers who trust {brand.name} for their needs.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={`https://${brand.slug}.cashcard.live/register`} className="bg-white px-8 py-3 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>
                Get Started Free →
              </a>
              <a href={`https://${brand.slug}.cashcard.live/contact`} className="border-2 border-white/30 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer grid */}
      <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 border-t" style={{ borderColor: `${accent}15` }}>
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            {brand.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-8 w-8 rounded-lg" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{brand.name.charAt(0)}</span>}
            <span className="font-bold" style={{ color: primary }}>{brand.name}</span>
          </div>
          <p className="text-xs opacity-50 leading-relaxed mb-4">{brand.tagline}</p>
          <div className="flex gap-2">
            {social.twitter && <a href={social.twitter} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform" style={{ backgroundColor: `${primary}10` }}>𝕏</a>}
            {social.instagram && <a href={`https://instagram.com/${social.instagram}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform" style={{ backgroundColor: `${primary}10` }}>📸</a>}
            {social.facebook && <a href={social.facebook} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform" style={{ backgroundColor: `${primary}10` }}>📘</a>}
            {social.linkedin && <a href={social.linkedin} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform" style={{ backgroundColor: `${primary}10` }}>💼</a>}
            {social.youtube && <a href={social.youtube} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform" style={{ backgroundColor: `${primary}10` }}>🎬</a>}
          </div>
        </div>

        <div>
          <p className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: primary }}>Pages</p>
          <div className="flex flex-col gap-2 text-sm opacity-60">
            {flags.about !== false && <a href={`https://${brand.slug}.cashcard.live/about`} className="hover:opacity-100 transition-opacity">About</a>}
            {flags.services !== false && <a href={`https://${brand.slug}.cashcard.live/services`} className="hover:opacity-100 transition-opacity">Services</a>}
            {flags.pricing !== false && <a href={`https://${brand.slug}.cashcard.live/pricing`} className="hover:opacity-100 transition-opacity">Pricing</a>}
            {flags.blog !== false && <a href={`https://${brand.slug}.cashcard.live/blog`} className="hover:opacity-100 transition-opacity">Blog</a>}
            {brand.features?.listings && <a href={`https://${brand.slug}.cashcard.live/marketplace`} className="hover:opacity-100 transition-opacity">Listings</a>}
          </div>
        </div>

        <div>
          <p className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: primary }}>Support</p>
          <div className="flex flex-col gap-2 text-sm opacity-60">
            {flags.faq !== false && <a href={`https://${brand.slug}.cashcard.live/faq`} className="hover:opacity-100 transition-opacity">FAQ</a>}
            {flags.support !== false && <a href={`https://${brand.slug}.cashcard.live/support`} className="hover:opacity-100 transition-opacity">Help Center</a>}
            {flags.contact !== false && <a href={`https://${brand.slug}.cashcard.live/contact`} className="hover:opacity-100 transition-opacity">Contact</a>}
            <a href={`https://${brand.slug}.cashcard.live/privacy`} className="hover:opacity-100 transition-opacity">Privacy</a>
            <a href={`https://${brand.slug}.cashcard.live/terms`} className="hover:opacity-100 transition-opacity">Terms</a>
          </div>
        </div>

        <div>
          <p className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: primary }}>Contact</p>
          <div className="flex flex-col gap-2 text-sm opacity-60">
            {brand.contact_email && <a href={`mailto:${brand.contact_email}`} className="hover:opacity-100 transition-opacity truncate">{brand.contact_email}</a>}
            {brand.contact_phone && <a href={`tel:${brand.contact_phone}`} className="hover:opacity-100 transition-opacity">{brand.contact_phone}</a>}
            {social.whatsapp && <a href={`https://wa.me/${social.whatsapp}`} className="hover:opacity-100 transition-opacity">WhatsApp</a>}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t py-4 px-6 text-center text-xs opacity-40" style={{ borderColor: `${accent}10` }}>
        <p>© {new Date().getFullYear()} {brand.name}. All rights reserved. Powered by <a href="https://cashcard.live" style={{ color: primary }} className="font-medium">Sarkar Platform</a></p>
      </div>
    </footer>
  );
}
