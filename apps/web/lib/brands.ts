import { createClient } from "./supabase/server";
import { headers } from "next/headers";
import type {
  BlogPost,
  FaqItem,
  FeatureItem,
  GalleryItem,
  JobOpening,
  PricingPlan,
  ReviewCard,
  ServiceItem,
  TeamMember,
  Testimonial,
} from "./brand-content";

/**
 * A row of the `brands` table — the single thing that makes 28 websites out of one
 * Next app. Routing, theming, SEO and the marketing copy all hang off this shape.
 *
 * The nine `*_json` arrays are `jsonb` in Postgres, so they are typed by hand here
 * (see `lib/brand-content.ts`) rather than inferred. `reviews_json` is the one
 * exception: nothing reads it — live reviews come from the `reviews` table — so it is
 * typed as an opaque array rather than given a shape nobody uses.
 */
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
  features: {
    leads?: boolean;
    payments?: boolean;
    listings?: boolean;
    events?: boolean;
    /** Booking commission in basis points (1500 = 15%). Defaults to 1500 when unset. */
    commission_bps?: number;
  };
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
  page_content: Record<string, unknown>;
  about_text: string | null;
  mission_text: string | null;
  team_json: TeamMember[];
  testimonials_json: Testimonial[];
  /** The brand's own curated quotes. Live customer reviews come from `reviews`. */
  reviews_json: ReviewCard[];
  faq_json: FaqItem[];
  blog_json: BlogPost[];
  careers_json: JobOpening[];
  gallery_json: GalleryItem[];
  services_json: ServiceItem[];
  pricing_json: PricingPlan[];
  features_json: FeatureItem[];
  booking_enabled: boolean;
  // `quote_enabled` is deliberately gone: the Request Quote page it gated has
  // been removed, so the column in `public.brands` is now unread by this app.
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

import { brandSlugFromHost } from "./base-domains";

export { BRAND_BASE_DOMAINS, CANONICAL_BASE, brandSlugFromHost, originForBrand } from "./base-domains";

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
