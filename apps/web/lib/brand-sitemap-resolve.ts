import { getCategoryIndex, type CategoryStat } from "./categories";
import type {} from "./brand-sitemap";

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
  // Match terms are ordered most-specific first. Without that ordering the search
  // picked the highest-count category, so /doctors rendered "Orthopedic Clinic in
  // Indore" (153 listings, matched on the loose term "clinic") instead of doctors.
  // First term that matches anything wins; within it, the closest name wins.
  for (const term of match) {
    let best: CategoryStat | null = null;
    for (const c of index) {
      const name = c.category.toLowerCase();
      if (!name.includes(term)) continue;
      // Prefer the shortest matching name ("doctor" over "orthopedic clinic"),
      // then the largest listing count.
      if (
        !best ||
        name.length < best.category.length ||
        (name.length === best.category.length && (c.count ?? 0) > (best.count ?? 0))
      ) {
        best = c;
      }
    }
    if (best) return best;
  }
  return null;
}
