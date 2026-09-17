"use client";
import Link from "next/link";
import { brandPublishesDirectory } from "@/lib/brand-categories";
import { routesFor } from "@/lib/brand-sitemap";
import { useState } from "react";
import { BrandTheme } from "@/components/brand-theme";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Brand } from "@/lib/brands";

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

/** Wordmark + logo lockup. Shared by the header and the footer so the brand
 *  identity is expressed identically in both places — a thing that looks the
 *  same must behave the same and be built from the same code. */
function Lockup({ brand, size = "md" }: { brand: Brand; size?: "sm" | "md" }) {
  const box = size === "md" ? "h-9 w-9 text-sm" : "h-8 w-8 text-xs";
  return (
    <>
      {brand.logo_url ? (
        <img src={brand.logo_url} alt="" className={`${box} rounded-xl object-cover`} style={{ boxShadow: "var(--shadow-1)" }} />
      ) : (
        <span
          className={`${box} flex items-center justify-center rounded-xl font-bold text-white`}
          style={{ background: "var(--brand-gradient)", boxShadow: "var(--shadow-brand)" }}
          aria-hidden="true"
        >
          {brand.name.charAt(0)}
        </span>
      )}
      <span
        className={size === "md" ? "text-[1.0625rem] font-[680]" : "text-[0.9375rem] font-[660]"}
        style={{ letterSpacing: "-0.018em", color: "var(--ink)" }}
      >
        {brand.name}
      </span>
    </>
  );
}

export function BrandHeader({ brand }: { brand: Brand }) {
  const flags = (brand.page_flags ?? {}) as Record<string, boolean>;
  // Must match the router's rule exactly: it 404s /marketplace unless the brand
  // really publishes a directory, so a weaker flag here advertises a dead link.
  const isCustomerSite = brandPublishesDirectory(brand);
  const [mobileOpen, setMobileOpen] = useState(false);

  // A brand with its own sitemap gets its own navigation - Doctors/Hospitals/
  // Diagnostics for sarkarhealth, Plumbers/Electricians for sarkarghar - instead of
  // the same four generic links on all 28 sites. Brands without one keep the
  // generic list.
  const brandRoutes = routesFor(brand.slug);
  const visible = brandRoutes.length
    ? brandRoutes
        .filter((r) => r.path !== "/")
        .map((r) => ({ key: r.path, label: r.label, path: r.path, d: "" }))
    : NAV.filter((n) => {
        if (flags[n.key] === false) return false;
        if (n.key === "pricing" && isCustomerSite) return false;
        if (n.key === "marketplace" && !brandPublishesDirectory(brand)) return false;
        return true;
      });

  return (
    <header className="sticky top-0 z-50 glass">
      {/* Publishes this tenant's palette to :root, so every CSS token below —
          gradients, tints, hairlines, focus ring, brand-tinted shadows —
          derives from the brand row instead of being re-interpolated inline. */}
      <BrandTheme brand={brand} />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-6 md:py-3">
        {/* Logo. `<Link>` not `<a>`: the brand home is a client-side route, and a
            bare anchor made every click a full document reload. */}
        <Link href="/" className="press flex items-center gap-2.5 rounded-xl py-1 pr-2">
          <Lockup brand={brand} />
        </Link>

        {/* Desktop nav. The hover state is a tinted pill rather than an opacity
            change: a colour shift on a translucent material is unreliable,
            a filled shape is not. */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {visible.map((item) => (
            <a
              key={item.key}
              href={item.path}
              className="press on-material rounded-lg px-3 py-2 text-[0.875rem] hover:!opacity-100"
              style={{ color: "var(--ink-2)" }}
            >
              {item.key === "marketplace" && isCustomerSite ? "Browse" : item.label}
            </a>
          ))}
        </nav>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
          {isCustomerSite ? (
            <a href="/marketplace" className="btn-secondary btn-sm hidden md:inline-flex">
              Browse businesses
            </a>
          ) : (
            <a href="/contact" className="btn-secondary btn-sm hidden md:inline-flex">
              Get started
            </a>
          )}
          <a href="/login" className="btn-primary btn-sm hidden sm:inline-flex">
            Log in
          </a>

          {/* 44px hit target, and the label states what it does rather than
              relying on the icon alone. */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="brand-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="press -mr-1 grid h-11 w-11 place-items-center rounded-xl lg:hidden"
            style={{ color: "var(--ink)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer.
          Animates opacity + transform (both compositor-only) rather than
          max-height, which is a layout property: it cannot be composited, janks
          on low-end phones, and silently clips the menu once a brand has more
          than ~6 nav items. Removed from the a11y tree when closed rather than
          merely clipped. */}
      <div
        id="brand-mobile-nav"
        hidden={!mobileOpen}
        className="lg:hidden"
        style={{
          borderTop: "1px solid var(--hairline)",
          opacity: mobileOpen ? 1 : 0,
          transform: mobileOpen ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity var(--dur-fast) var(--ease-settle), transform var(--dur-fast) var(--ease-settle)",
        }}
      >
        <div className="space-y-0.5 px-3 py-3">
          {visible.map((item) => (
            <a
              key={item.key}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className="press flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] font-[560]"
              style={{ color: "var(--ink)" }}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}
              >
                <NavIcon d={item.d} />
              </span>
              {item.label}
            </a>
          ))}
          <div className="flex items-center justify-between px-1 pt-4">
            <span className="text-caption">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex gap-2 px-1 pt-3">
            <a href="/login" className="btn-primary btn-block">Log in</a>
            <a href={isCustomerSite ? "/marketplace" : "/contact"} className="btn-secondary btn-block">
              {isCustomerSite ? "Browse" : "Get started"}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Social marks as stroked/filled SVG. The emoji versions ("𝕏", "📸", "💼")
   rendered at wildly different optical weights and sizes across platforms,
   which is why the row never looked aligned. */
const SOCIAL: Record<string, { label: string; d: string; fill?: boolean }> = {
  twitter:   { label: "X",         fill: true, d: "M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L4.7 21H1.5l7.5-8.6L1.2 3h6.6l4.5 5.6zm-1.1 16h1.8L7.7 4.8H5.8z" },
  instagram: { label: "Instagram", d: "M7.5 2.75h9a4.75 4.75 0 0 1 4.75 4.75v9a4.75 4.75 0 0 1-4.75 4.75h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.2-1.2v.01" },
  facebook:  { label: "Facebook",  fill: true, d: "M14 9V7.2c0-.8.2-1.2 1.4-1.2H17V3.1A20 20 0 0 0 14.7 3C12.2 3 10.5 4.5 10.5 7v2H8v3.2h2.5V21H14v-8.8h2.6l.4-3.2z" },
  linkedin:  { label: "LinkedIn",  fill: true, d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3zM9.5 9.5h3.8v1.5a4.2 4.2 0 0 1 3.8-2c2.8 0 4.4 1.8 4.4 5v6.5h-4V15c0-1.6-.6-2.6-2-2.6-1.2 0-1.9.8-2.2 1.6-.1.3-.1.7-.1 1v5.5h-4z" },
  youtube:   { label: "YouTube",   fill: true, d: "M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.8C18.3 5 12 5 12 5s-6.3 0-7.9.5a2.5 2.5 0 0 0-1.7 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7c.2.9.9 1.6 1.7 1.8C5.7 19 12 19 12 19s6.3 0 7.9-.5a2.5 2.5 0 0 0 1.7-1.8c.4-1.5.4-4.7.4-4.7zM10 15.2V8.8l5.5 3.2z" },
};

function SocialLink({ href, kind }: { href: string; kind: keyof typeof SOCIAL }) {
  const mark = SOCIAL[kind];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={mark.label}
      className="press grid h-9 w-9 place-items-center rounded-xl"
      style={{ background: "var(--surface-sunken)", color: "var(--ink-2)" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24"
           fill={mark.fill ? "currentColor" : "none"}
           stroke={mark.fill ? "none" : "currentColor"}
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={mark.d} />
      </svg>
    </a>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption mb-3.5">{title}</p>
      <div className="flex flex-col gap-2.5 text-[0.875rem]">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="press truncate" style={{ color: "var(--ink-2)" }}>
      {children}
    </a>
  );
}

export function BrandFooter({ brand }: { brand: Brand }) {
  const social = (brand.social ?? {}) as Record<string, string>;
  const flags = (brand.page_flags ?? {}) as Record<string, boolean>;
  // Must match the router's rule exactly: it 404s /marketplace unless the brand
  // really publishes a directory, so a weaker flag here advertises a dead link.
  const isCustomerSite = brandPublishesDirectory(brand);

  // Brand-driven call to action. Labels are direct and specific rather than
  // generic ("Get started with X", not "Learn more") — a specific label lets
  // someone predict what happens before they tap it.
  const ctaOverride = ((brand.page_content ?? {}) as { cta?: Record<string, string> }).cta ?? {};
  const cta = isCustomerSite
    ? {
        title: ctaOverride.title ?? `Find trusted businesses on ${brand.name}`,
        subtitle:
          ctaOverride.subtitle ?? `Browse verified local businesses, services and professionals — all in one place.`,
        primary_label: ctaOverride.primary_label ?? "Browse businesses",
        secondary_label: ctaOverride.secondary_label ?? "Contact us",
        primary_href: ctaOverride.primary_href ?? "/marketplace",
        secondary_href: ctaOverride.secondary_href ?? "/contact",
      }
    : {
        title: ctaOverride.title ?? `Get started with ${brand.name}`,
        subtitle:
          ctaOverride.subtitle ??
          brand.tagline ??
          brand.description ??
          `Join ${brand.name} today — it takes less than a minute.`,
        primary_label: ctaOverride.primary_label ?? "Create free account",
        secondary_label: ctaOverride.secondary_label ?? "Talk to us",
        primary_href: ctaOverride.primary_href ?? "/register",
        secondary_href: ctaOverride.secondary_href ?? "/contact",
      };

  return (
    <footer className="mt-auto" style={{ background: "var(--surface-sunken)" }}>
      {/* CTA banner. One saturated brand surface per page, placed at the point
          of decision — colour used sparingly is what makes it mean something. */}
      <div className="mx-auto max-w-7xl px-5 pb-4 pt-14 md:px-6">
        <div
          className="relative overflow-hidden rounded-[2rem] px-6 py-12 text-center md:px-12 md:py-16"
          style={{ background: "var(--brand-gradient)", boxShadow: "var(--shadow-brand-lg)" }}
        >
          {/* Specular sheen along the top edge — light catching a real surface. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 45%)" }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-[0.09] dot-pattern" />

          <div className="relative mx-auto max-w-2xl">
            {/* This block used to hard-code SarkarFood's food-delivery copy
                ("Hungry? Order now!"), which the shared footer then rendered on
                all 27 brands — so a legal, health or fintech site invited you to
                order dinner. Copy now comes from the brand row. */}
            <h2
              className="text-white"
              style={{
                fontSize: "clamp(1.75rem, 1.2rem + 2.4vw, 2.75rem)",
                fontWeight: 760,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                textWrap: "balance",
              }}
            >
              {cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-white/[0.92]" style={{ textWrap: "pretty" }}>
              {cta.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <a
                href={cta.primary_href}
                className="press inline-flex items-center gap-2 rounded-2xl bg-surface px-7 py-3.5 text-[0.9375rem] font-[640]"
                style={{ color: "var(--brand-primary)", letterSpacing: "-0.011em", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)" }}
              >
                {cta.primary_label}
                <span aria-hidden="true">→</span>
              </a>
              <a
                href={cta.secondary_href}
                className="press inline-flex items-center rounded-2xl border border-white/25 bg-surface/10 px-7 py-3.5 text-[0.9375rem] font-[600] text-white backdrop-blur-sm"
                style={{ letterSpacing: "-0.011em" }}
              >
                {cta.secondary_label}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-14 md:grid-cols-4 md:px-6">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3 flex items-center gap-2.5">
            <Lockup brand={brand} size="sm" />
          </div>
          {brand.tagline && (
            <p className="mb-5 max-w-xs text-[0.8125rem] leading-relaxed" style={{ color: "var(--ink-3)" }}>
              {brand.tagline}
            </p>
          )}
          <div className="flex gap-2">
            {social.twitter && <SocialLink href={social.twitter} kind="twitter" />}
            {social.instagram && <SocialLink href={`https://instagram.com/${social.instagram}`} kind="instagram" />}
            {social.facebook && <SocialLink href={social.facebook} kind="facebook" />}
            {social.linkedin && <SocialLink href={social.linkedin} kind="linkedin" />}
            {social.youtube && <SocialLink href={social.youtube} kind="youtube" />}
          </div>
        </div>

        <FooterColumn title="Pages">
          {flags.about !== false && <FooterLink href="/about">About</FooterLink>}
          {flags.services !== false && <FooterLink href="/services">Services</FooterLink>}
          {!isCustomerSite && flags.pricing !== false && <FooterLink href="/pricing">Pricing</FooterLink>}
          {flags.blog !== false && <FooterLink href="/blog">Blog</FooterLink>}
          {isCustomerSite && (
            <FooterLink href="/marketplace">{isCustomerSite ? "Browse" : "Listings"}</FooterLink>
          )}
        </FooterColumn>

        <FooterColumn title="Support">
          {flags.faq !== false && <FooterLink href="/faq">FAQ</FooterLink>}
          {flags.support !== false && <FooterLink href="/support">Help centre</FooterLink>}
          {flags.contact !== false && <FooterLink href="/contact">Contact</FooterLink>}
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
        </FooterColumn>

        <FooterColumn title="Contact">
          {brand.contact_email && <FooterLink href={`mailto:${brand.contact_email}`}>{brand.contact_email}</FooterLink>}
          {brand.contact_phone && <FooterLink href={`tel:${brand.contact_phone}`}>{brand.contact_phone}</FooterLink>}
          {social.whatsapp && <FooterLink href={`https://wa.me/${social.whatsapp}`}>WhatsApp</FooterLink>}
        </FooterColumn>
      </div>

      {/* Bottom bar */}
      <div
        className="px-6 py-6 text-center text-[0.75rem]"
        style={{ borderTop: "1px solid var(--hairline)", color: "var(--ink-3)" }}
      >
        <p>
          © {new Date().getFullYear()} {brand.name}. All rights reserved. Powered by{" "}
          <a href="https://sarkarmarketplace.dropby.co.in" className="font-[580]" style={{ color: "var(--brand-secondary)" }}>
            Sarkar Platform
          </a>
        </p>
      </div>
    </footer>
  );
}
