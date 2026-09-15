import { getCategoryIndex, type CategoryStat } from "./categories";
import type { BrandRoute } from "./brand-sitemap";

/**
 * Resolve a `kind: "category"` sitemap route against the live category index.
 *
 * Matching by name rather than by a hardcoded slug means a category rename in
 * the database cannot silently turn /doctors into an empty page: if the name
 * still contains any of the route's match terms, the route keeps working.
 * The highest-count match wins, so the route lands on the strongest listing.
 *
 * Server-only: it reads the category index, which must never be pulled into a
 * client bundle (see apps/web/lib/base-domains.ts for the same reasoning).
 */
export async function resolveCategoryRoute(match: string[]): Promise<CategoryStat | null> {
  const index = await getCategoryIndex();
  let best: CategoryStat | null = null;
  for (const c of index) {
    const name = c.category.toLowerCase();
    if (match.some((m) => name.includes(m))) {
      if (!best || (c.count ?? 0) > (best.count ?? 0)) best = c;
    }
  }
  return best;
}

/** True when the brand's sitemap defines this path at all. */
export function hasRoute(routes: BrandRoute[], path: string): boolean {
  return routes.some((r) => (r.kind === "detail" ? path.startsWith(r.prefix + "/") : r.path === path));
}
