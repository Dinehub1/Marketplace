/**
 * The content blocks a brand row can carry.
 *
 * The `brands` table is wide: alongside the columns that drive routing and theming
 * it stores nine JSON arrays of marketing copy (`team_json`, `faq_json`, …) that the
 * brand pages render. Those columns arrive from PostgREST as `jsonb`, so before this
 * module they were typed `any[]` — which meant every consumer re-cast them
 * (`(brand.faq_json ?? DEFAULT_FAQ) as any[]`) and nothing checked that, say, an FAQ
 * entry actually had a `q` and an `a`.
 *
 * These are the shapes the pages read, derived from the pages themselves. A brand page
 * may fall back to a hard-coded default (`DEFAULT_FAQ`), so every field a default
 * omits is optional here — but every field a page *dereferences* is required.
 *
 * `page_content` stays `Record<string, unknown>` on purpose: it is a free-form
 * per-brand bag read through narrow accessors, not a modelled entity.
 */

/** `team_json` — shown on the About page. */
export type TeamMember = {
  name: string;
  role?: string;
  /** Avatar URL; falls back to the initial of `name` when absent. */
  photo?: string;
};

/** `testimonials_json` — the quotes wall. */
export type Testimonial = {
  name: string;
  text: string;
  /** 1–5. Rendered as stars. */
  rating: number;
  role?: string;
};

/** `faq_json` — question/answer pairs. */
export type FaqItem = {
  q: string;
  a: string;
};

/**
 * An entry of `reviews_json` — the brand's own curated quotes.
 *
 * Distinct from a row of the `reviews` table (`lib/db-types.ts`): that is a live
 * customer review with a moderation flag; this is marketing copy a brand ships.
 */
export type ReviewCard = {
  name: string;
  text: string;
  /** 1–5. */
  rating: number;
  date: string;
  city: string;
};

/** `blog_json` — post cards. There is no post body; the card is the whole thing. */
export type BlogPost = {
  title: string;
  excerpt: string;
  /** ISO date (`YYYY-MM-DD`). */
  date: string;
  tag: string;
  featured: boolean;
};

/** `careers_json` — open roles. */
export type JobOpening = {
  title: string;
  type: string;
  location: string;
  desc: string;
  remote: boolean;
  /**
   * Optional pay line, e.g. "₹4–6 LPA". The page renders it only when present.
   *
   * `salary`, `GalleryItem.category` and `ServiceItem.price` below were all found by
   * typing these fields: the pages had always rendered them behind a truthiness guard,
   * but `any[]` meant nothing ever checked they existed on the type.
   */
  salary?: string;
};

/** `gallery_json` — a masonry tile, either a photo or a coloured emoji tile. */
export type GalleryItem = {
  title: string;
  emoji?: string;
  /** Photo URL. When absent the tile renders `emoji` on a tinted background. */
  img?: string;
  /** Optional caption under the title. */
  category?: string;
};

/** `services_json` — service cards. */
export type ServiceItem = {
  icon: string;
  title: string;
  desc: string;
  /** Optional price line, e.g. "From ₹499". */
  price?: string;
};

/** `pricing_json` — plan cards. */
export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  tagline?: string;
};

/** `features_json` — feature cards. Same shape as a service, different page. */
export type FeatureItem = {
  icon: string;
  title: string;
  desc: string;
};

/**
 * A named team member list etc. may be overridden per brand by a hard-coded map
 * (`BRAND_FAQ`, `BRAND_PLANS`, …); this is the lookup shape those maps share.
 */
export type ByBrandSlug<T> = Record<string, T[]>;
