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

/** Resolve brand from incoming request hostname (e.g. sarkarfood.cashcard.live). */
export async function getBrandFromHost(): Promise<Brand | null> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();

  // Extract slug from hostname
  // dashboard.cashcard.live → null (admin, not a brand)
  // sarkarfood.cashcard.live → sarkarfood
  // cashcard.live → null (root)

  const parts = hostname.split(".");
  if (parts.length < 2) return null;

  const root = parts[parts.length - 2]; // "cashcard"
  const tld = parts[parts.length - 1]; // "live"
  const subdomain = parts.length > 2 ? parts[0] : null;

  if (root !== "cashcard" || tld !== "live") return null;
  if (!subdomain || subdomain === "www" || subdomain === "dashboard") return null;

  return getBrand(subdomain);
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
