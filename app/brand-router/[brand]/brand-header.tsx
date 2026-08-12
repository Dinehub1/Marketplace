"use client";
import { useState } from "react";

/* Stroked SVG marks rather than emoji. The emoji set rendered as tofu boxes
   wherever the font lacked the glyph, and it carried its own colour, which
   fought every brand palette. These inherit currentColor. */
const NavIcon = ({ d }: { d: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
);

const NAV = [
  { key: "services", label: "Services", path: "/services", d: '<path d="M12 3l2.2 6.3L20.5 11l-6.3 1.9L12 19l-2.2-6.1L3.5 11l6.3-1.7z"/>' },
  { key: "pricing", label: "Pricing", path: "/pricing", d: '<path d="M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1-5 3 2.2 2.7 5 3.2 5 1.3 5 3.3-2.2 3-5 3-5-1.1-5-3"/>' },
  { key: "marketplace", label: "Listings", path: "/marketplace", d: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h9M8 16.5h6"/>' },
  { key: "about", label: "About", path: "/about", d: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/>' },
  { key: "blog", label: "Blog", path: "/blog", d: '<path d="M4 4h11l5 5v11H4z"/><path d="M15 4v5h5M8 13h8M8 16.5h5"/>' },
  { key: "contact", label: "Contact", path: "/contact", d: '<path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/>' },
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
          <a href={`/`} className="flex items-center gap-2.5 group">
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
              <a key={item.key} href={`${item.path}`} className="press on-material px-3 py-2 text-sm rounded-lg opacity-75">
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <a href={`/login`} className="press hidden sm:inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
              Login
            </a>
            <a href={`/contact`} className="press hidden md:inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold border-2" style={{ borderColor: accent, color: primary }}>
              Get Started
            </a>
            {/* Hit target is 44px, and the label states what it does rather
                than relying on the icon alone. */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="brand-mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="press lg:hidden p-2.5 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">{mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer.
            Was animating max-height, which is a layout property: it cannot be
            composited, janks on low-end phones, and `max-h-96` silently clips
            the menu once a brand has more than ~6 nav items. Now it animates
            opacity + transform (both compositor-only) and the drawer is
            removed from the a11y tree when closed rather than merely clipped. */}
        <div
          id="brand-mobile-nav"
          hidden={!mobileOpen}
          className="lg:hidden border-t"
          style={{
            borderColor: `${accent}20`,
            opacity: mobileOpen ? 1 : 0,
            transform: mobileOpen ? "translateY(0)" : "translateY(-6px)",
            transition: "opacity var(--dur-fast) var(--ease-settle), transform var(--dur-fast) var(--ease-settle)",
          }}
        >
          <div className="px-4 py-4 space-y-1">
            {visible.map((item) => (
              <a key={item.key} href={`${item.path}`} onClick={() => setMobileOpen(false)} className="press flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium">
                <span className="text-neutral-400"><NavIcon d={item.d} /></span> {item.label}
              </a>
            ))}
            <div className="pt-3 flex gap-2">
              <a href={`/login`} className="press flex-1 text-center rounded-xl py-3 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>Login</a>
              <a href={`/contact`} className="press flex-1 text-center rounded-xl py-3 text-sm font-bold border-2" style={{ borderColor: accent, color: primary }}>Get Started</a>
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

  // Brand-driven call to action. Labels are direct and specific rather than
  // generic ("Get started with X", not "Learn more") — a specific label lets
  // someone predict what happens before they tap it.
  const ctaOverride = ((brand.page_content ?? {}) as Record<string, any>).cta ?? {};
  const cta = {
    title: ctaOverride.title ?? `Get started with ${brand.name}`,
    subtitle:
      ctaOverride.subtitle ??
      brand.tagline ??
      brand.description ??
      `Join ${brand.name} today — it takes less than a minute.`,
    primary_label: ctaOverride.primary_label ?? "Create free account",
    secondary_label: ctaOverride.secondary_label ?? "Talk to us",
  };

  return (
    <footer className="mt-auto" style={{ backgroundColor: `${primary}08` }}>
      {/* CTA Banner */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
          <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
          <div className="relative">
            {/* This block used to hard-code SarkarFood's Hindi food-delivery
                copy ("भूख लगी? अभी ऑर्डर करो!" / "फ्री डिलीवरी पाएं"), which the
                shared footer then rendered on all 27 brands — so a legal, health
                or fintech site invited you to order dinner. Copy now comes from
                the brand row, with a neutral fallback. Set page_content.cta =
                { title, subtitle, primary_label, secondary_label } to override. */}
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3" style={{ letterSpacing: "-0.022em", lineHeight: 1.12, textWrap: "balance" }}>
              {cta.title}
            </h2>
            <p className="text-white/85 mb-6 max-w-lg mx-auto" style={{ lineHeight: 1.6 }}>{cta.subtitle}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={`/register`} className="press bg-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg" style={{ color: primary }}>
                {cta.primary_label} →
              </a>
              <a href={`/contact`} className="press border-2 border-white/30 text-white px-8 py-3 rounded-xl font-bold text-sm">
                {cta.secondary_label}
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
            {flags.about !== false && <a href={`/about`} className="hover:opacity-100 transition-opacity">About</a>}
            {flags.services !== false && <a href={`/services`} className="hover:opacity-100 transition-opacity">Services</a>}
            {flags.pricing !== false && <a href={`/pricing`} className="hover:opacity-100 transition-opacity">Pricing</a>}
            {flags.blog !== false && <a href={`/blog`} className="hover:opacity-100 transition-opacity">Blog</a>}
            {brand.features?.listings && <a href={`/marketplace`} className="hover:opacity-100 transition-opacity">Listings</a>}
          </div>
        </div>

        <div>
          <p className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: primary }}>Support</p>
          <div className="flex flex-col gap-2 text-sm opacity-60">
            {flags.faq !== false && <a href={`/faq`} className="hover:opacity-100 transition-opacity">FAQ</a>}
            {flags.support !== false && <a href={`/support`} className="hover:opacity-100 transition-opacity">Help Center</a>}
            {flags.contact !== false && <a href={`/contact`} className="hover:opacity-100 transition-opacity">Contact</a>}
            <a href={`/privacy`} className="hover:opacity-100 transition-opacity">Privacy</a>
            <a href={`/terms`} className="hover:opacity-100 transition-opacity">Terms</a>
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
