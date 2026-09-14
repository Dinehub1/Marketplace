import { createClient } from "./supabase/server";
import { headers } from "next/headers";

export type Brand = {
  id: string;
  slug: string;
  name: string;
  folder: string | null;
  domain: string | null;
  category: string | null;
  emoji: string | null;
  tagline: string | null;
  description: string | null;
  theme: Record<string, string>;
  features: { leads?: boolean; payments?: boolean; listings?: boolean; events?: boolean };
  seo_title: string | null;
  seo_description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social: Record<string, string>;
  status: string;
  uptime: number;
  sort_order: number;
  page_flags: Record<string, boolean>;
  page_content: Record<string, any>;
  about_text: string | null;
  mission_text: string | null;
  team_json: any[];
  testimonials_json: any[];
  reviews_json: any[];
  faq_json: any[];
  blog_json: any[];
  careers_json: any[];
  gallery_json: any[];
  services_json: any[];
  pricing_json: any[];
  features_json: any[];
  booking_enabled: boolean;
  quote_enabled: boolean;
  checkout_enabled: boolean;
  chat_enabled: boolean;
};

export type Business = {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  city: string | null;
};

/** All brands, ordered for the dashboard. */
export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as Brand[]) ?? [];
}

/** One brand by its URL slug. */
export async function getBrand(slug: string): Promise<Brand | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  return (data as Brand) ?? null;
}

/**
 * Base domains this platform answers on.
 *
 * dropby.co.in is where the platform is moving; cashcard.live stays live during
 * the migration so existing links and already-indexed URLs keep resolving.
 * Anything that needs a canonical origin must derive it from the brand's own
 * domain or the request host, never from a hardcoded one - a hardcoded origin
 * made every canonical tag and sitemap keep advertising cashcard.live even when
 * the page was served from the new domain.
 */
export const BRAND_BASE_DOMAINS: readonly string[] = ["dropby.co.in", "cashcard.live"];
export const CANONICAL_BASE = BRAND_BASE_DOMAINS[0];

/** "sarkarfood.dropby.co.in" → "sarkarfood"; null for root/admin/www hosts. */
export function brandSlugFromHost(hostname: string): string | null {
  const h = (hostname ?? "").split(":")[0].toLowerCase();
  for (const base of BRAND_BASE_DOMAINS) {
    if (h === base) return null;
    if (h.endsWith(`.${base}`)) {
      const sub = h.slice(0, h.length - base.length - 1);
      if (!sub || sub === "www" || sub === "dashboard" || sub === "admin") return null;
      return sub;
    }
  }
  return null;
}

/** Canonical origin for a brand on whichever base domain this platform serves. */
export function originForBrand(slug: string, domain?: string | null): string {
  if (domain && /^https?:\/\//.test(domain)) return domain.replace(/\/+$/, "");
  return `https://${slug}.${CANONICAL_BASE}`;
}

/** Resolve brand from incoming request hostname (any base domain). */
export async function getBrandFromHost(): Promise<Brand | null> {
  const h = await headers();
  const slug = brandSlugFromHost(h.get("host") ?? "");
  return slug ? getBrand(slug) : null;
}

/** Marketplace listings (shared global directory). */
export async function getBusinesses(limit = 12): Promise<{ rows: Business[]; total: number }> {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("businesses")
    .select("id,name,category,area,address,phone,rating,city", { count: "exact" })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(limit);
  return { rows: (data as Business[]) ?? [], total: count ?? 0 };
}

/** Businesses filtered by brand slug. */
export async function getBrandBusinesses(brandSlug: string, limit = 12): Promise<{ rows: Business[]; total: number }> {
  const supabase = await createClient();
  const brand = await getBrand(brandSlug);
  if (!brand) return { rows: [], total: 0 };

  const { data, count } = await supabase
    .from("businesses")
    .select("id,name,category,area,address,phone,rating,city", { count: "exact" })
    .eq("brand_id", brand.id)
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(limit);
  return { rows: (data as Business[]) ?? [], total: count ?? 0 };
}
