/**
 * Web-side view of brand → category ownership.
 *
 * The ownership table itself lives in `@hermes/core` (`brand-scope.ts`), because the
 * mobile directory apps filter the same `businesses` table down to their own slice
 * and the two surfaces must never be able to disagree. This module used to hold the
 * table; it now re-exports it and keeps only what is genuinely web-only — gating a
 * brand's *routes* on its `features.listings` flag.
 */

import { BRAND_CATEGORY_KEYWORDS, FULL_DIRECTORY_BRANDS } from "@hermes/core";

export {
  BRAND_CATEGORY_KEYWORDS,
  BRAND_CATEGORY_EXCLUDES,
  BRAND_PRECEDENCE,
  FULL_DIRECTORY_BRANDS,
  categoriesForBrand,
  brandOwnsCategory,
  ownerOfCategory,
  scopeForBrand,
} from "@hermes/core";

export type { BrandScope } from "@hermes/core";

/**
 * Does this brand publish the business directory at all?
 *
 * `features.listings` already governs whether "Listings" appears in the nav,
 * but the ROUTES were never gated — so all 16 brands with the flag off still
 * served /marketplace, /categories and every /<category>-in-indore page. That
 * put the same ~19k listings and ~320 category pages on 27 hostnames: roughly
 * 8,600 near-duplicate URLs competing with each other, with each brand's
 * sitemap dutifully submitting its copy to Google. The flag now gates the
 * routes as well as the nav.
 *
 * The flag alone is not enough: a brand also needs something to show. Only the
 * full-directory owner or a brand with its own keyword slice qualifies, so an
 * unmapped brand 404s instead of rendering an empty directory.
 *
 * Web-only on purpose — a mobile binary has no `brands` row and no feature flags;
 * which slice it shows is decided at build time by its target.
 */
export function brandPublishesDirectory(
  brand: { slug?: string | null; features?: { listings?: boolean } | null } | null,
): boolean {
  if (!brand?.features?.listings) return false;
  const slug = (brand?.slug ?? "").toLowerCase();
  return FULL_DIRECTORY_BRANDS.has(slug) || Boolean(BRAND_CATEGORY_KEYWORDS[slug]);
}
