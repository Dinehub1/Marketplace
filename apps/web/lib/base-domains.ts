/**
 * Base domains this platform answers on, plus the pure helpers that derive a
 * brand and a canonical origin from a hostname.
 *
 * This module must stay free of server-only imports (`next/headers` and friends)
 * because the browser-side Supabase client needs the same list to scope its auth
 * cookie. Putting these in `lib/brands.ts` and importing that from a "use client"
 * file pulled server-only code into the client bundle and broke the build.
 *
 * dropby.co.in is the domain the platform is moving to; cashcard.live stays live
 * during the migration so existing links and already-indexed URLs keep
 * resolving. Anything needing a canonical origin derives it from the brand's own
 * domain, never from a hardcoded one - hardcoding made canonicals and sitemaps
 * keep advertising the old domain even when serving from the new one.
 */
export const BRAND_BASE_DOMAINS: readonly string[] = ["dropby.co.in", "cashcard.live"];
export const CANONICAL_BASE = BRAND_BASE_DOMAINS[0];

/**
 * Subdomains that are a *role*, never a brand.
 *
 * `hermes` is here because `proxy.ts` reverse-proxies it to the Hermes dashboard;
 * `www`, `dashboard` and `admin` never carry a brand either. Any of these reaching
 * the brand router would serve a brand page at an infrastructure URL.
 */
export const RESERVED_SUBDOMAINS: readonly string[] = ["www", "dashboard", "admin", "hermes"];

/**
 * Role hosts, derived from BRAND_BASE_DOMAINS rather than retyped per domain.
 *
 * When a third base domain joins, every role has to exist on it in the same shape.
 * A hand-written list is how `admin.cashcard.live` gets remembered while
 * `admin.dropby.co.in` does not.
 */
export const ADMIN_HOSTS: readonly string[] = BRAND_BASE_DOMAINS.flatMap((base) =>
  ["dashboard", "admin"].map((role) => `${role}.${base}`),
);

/** Hosts reverse-proxied to the Hermes dashboard (see `proxy.ts`). */
export const HERMES_DASHBOARD_HOSTS: readonly string[] = BRAND_BASE_DOMAINS.map(
  (base) => `hermes.${base}`,
);

/** "sarkarfood.dropby.co.in" → "sarkarfood"; null for root/reserved hosts. */
export function brandSlugFromHost(hostname: string): string | null {
  const h = (hostname ?? "").split(":")[0].toLowerCase();
  for (const base of BRAND_BASE_DOMAINS) {
    if (h === base) return null;
    if (h.endsWith(`.${base}`)) {
      const sub = h.slice(0, h.length - base.length - 1);
      if (!sub || RESERVED_SUBDOMAINS.includes(sub)) return null;
      return sub;
    }
  }
  return null;
}

/** Canonical origin for a brand: its own domain when set, else the base domain. */
export function originForBrand(slug: string, domain?: string | null): string {
  if (domain && /^https?:\/\//.test(domain)) return domain.replace(/\/+$/, "");
  return `https://${slug}.${CANONICAL_BASE}`;
}

/** Cookie scope for the base domain a hostname belongs to (undefined on localhost). */
export function cookieDomainForHost(hostname: string): string | undefined {
  const base = BRAND_BASE_DOMAINS.find((b) => (hostname ?? "").includes(b));
  return base ? `.${base}` : undefined;
}
