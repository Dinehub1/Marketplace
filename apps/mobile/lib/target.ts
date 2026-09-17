import Constants from "expo-constants";
import { scopeForBrand, type BrandScope } from "@hermes/core";

/**
 * Which of the 20 store apps this binary is.
 *
 * `app.config.ts` resolves the target at *build* time (from `APP_TARGET`, defaulting to the
 * marketplace) and drops the answer into `expo.extra`. This module reads it back at
 * runtime. There is deliberately no target picker anywhere in the UI: a person who
 * installed "Breathe" wants a breathing app, not a launcher for nineteen other products.
 *
 * Everything here is derived from `targets.mjs` — the same file `check-targets.mjs`
 * rejects duplicate builds against and the screenshot harness groups by. One source of
 * truth, so a renamed app cannot mean two different things in two places.
 *
 * The ONE thing not read from `extra` is `scope` (below): which slice of the directory
 * this app may show is derived at runtime from `@hermes/core`'s ownership table, so the
 * app and the brand websites cannot disagree about who owns a category.
 */
export type TargetFamily = "directory" | "wellness" | "product" | "game";

export type Target = {
  id: string;
  name: string;
  tagline: string;
  /** The target's own accent, used by the games and the store art. */
  color: string;
  family: TargetFamily;
  /** The route this app opens on, or null when its first screen is not built yet. */
  firstRoute: string | null;
  /** Product slugs this listing promises. See lib/products.ts. */
  products: string[];
  /** Store permissions this target declares, so a build cannot ask for more. */
  permissions: string[];
  /**
   * What a directory app may list: the `category` terms it owns. Null for the
   * marketplace (which is everything) and for every non-directory target.
   *
   * Derived from `scopeForBrand()` in `@hermes/core` — never hand-written per target.
   */
  scope: BrandScope | null;
  ads: { rewarded: string; interstitial: string } | null;
};

/**
 * The marketplace. Used when `extra.target` is absent — an older binary, a web export, or
 * the screenshot harness driving a build that predates targets. Falling back to the
 * directory keeps those working instead of throwing on a screen nobody can reach.
 */
const FALLBACK: Target = {
  id: "sarkarmarketplace",
  name: "Indore Business Directory",
  tagline: "Every local business in Indore, with phone numbers",
  color: "#a16207",
  family: "directory",
  firstRoute: "/browse",
  products: [],
  permissions: ["LOCATION"],
  scope: scopeForBrand("sarkarmarketplace"),
  ads: null,
};

function readTarget(): Target {
  const extra = (Constants.expoConfig?.extra ?? {}) as { target?: Partial<Target> };
  const t = extra.target;
  if (!t?.id) return FALLBACK;
  // Expo's config serialiser turns a null `extra` value into `{}`, so an absent ads
  // block arrives as an empty object rather than null, and a target whose first screen
  // is not built arrives as `{}` rather than null. Both are normalised here: an object
  // is truthy, and a redirect to `{}` would crash the four unbuilt targets at launch.
  const ads =
    t.ads && Object.keys(t.ads as Record<string, unknown>).length > 0
      ? (t.ads as Target["ads"])
      : null;
  const firstRoute = typeof t.firstRoute === "string" && t.firstRoute ? t.firstRoute : null;
  return {
    id: t.id,
    name: t.name ?? FALLBACK.name,
    tagline: t.tagline ?? "",
    color: t.color ?? FALLBACK.color,
    family: (t.family as TargetFamily) ?? "product",
    firstRoute,
    products: t.products ?? [],
    permissions: t.permissions ?? [],
    // Not from `extra` on purpose: one ownership table, read at runtime, so a build
    // cannot carry a stale copy of who owns which category.
    scope: scopeForBrand(t.id),
    ads,
  };
}

export const TARGET: Target = readTarget();

export const isDirectory = () => TARGET.family === "directory";
export const isGame = () => TARGET.family === "game";
export const isWellness = () => TARGET.family === "wellness";

/** True when the app opens on its own product rather than on a hub of products. */
export const opensOnItsOwnScreen = () => TARGET.firstRoute !== null;
