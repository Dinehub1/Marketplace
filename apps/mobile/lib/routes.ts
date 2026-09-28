import { Platform } from "react-native";
import { TARGET, type Target } from "@/lib/target";
import { builtProductsFor } from "@/lib/products";

/**
 * Which routes this binary is allowed to show.
 *
 * Every screen in `app/` is compiled into every one of the fifteen store apps — expo-router
 * has no per-build route exclusion — so without this, Tap Sprint contains the business
 * directory and `tapsprint://browse` opens it. That is the "one binary under many names"
 * shape Apple rejects under 4.3, and it is also a crash: a product screen that opens the
 * camera inside a target that declared no camera permission has no iOS usage string, and
 * iOS kills the app when the picker opens.
 *
 * So each family gets the routes it actually owns, derived from the same data the store
 * listing is (family, first route, built products), never retyped per target. The root
 * layout sends anything else back to the target's first screen.
 *
 * Paths are URL paths, so route groups like `(directory)` do not appear. Matching is
 * exact unless a route ends in "/*": "/business/*" covers "/business/123". Exact is the
 * default on purpose — the toolbox opens on "/tools", and a prefix there would hand it
 * "/tools/pdf", which is another listing's product.
 */
const DIRECTORY_ROUTES = ["/browse", "/search", "/saved", "/account", "/business/*", "/owner", "/owner/*"];

/** One listing with six practices: the hub, the practices, and the two shared pages. */
const WELLNESS_ROUTES = [
  "/habits",
  "/breathe",
  "/stretch",
  "/walk",
  "/water",
  "/japa",
  "/sleep",
  "/progress",
  "/profile",
];

function routesFor(t: Target): string[] {
  // The entry route is always reachable: it is what redirects to the first screen, and
  // it is the honest "not built yet" page for a target that has none.
  const out = new Set<string>(["/"]);
  if (t.firstRoute) out.add(t.firstRoute);

  switch (t.family) {
    case "directory":
      DIRECTORY_ROUTES.forEach((r) => out.add(r));
      break;
    case "wellness":
      WELLNESS_ROUTES.forEach((r) => out.add(r));
      break;
    case "game":
      // The whole app is the game: the first route is all it owns.
      break;
    case "product":
      for (const p of builtProductsFor(t.products)) if (p.route) out.add(p.route);
      break;
  }
  return [...out];
}

export const ALLOWED_ROUTES: readonly string[] = routesFor(TARGET);

/**
 * The web export is not a store app. It exists for the screenshot harness
 * (`scripts/app-shots.mjs`), which exports one build and photographs every screen in it,
 * and it has no deep links to defend. So the allowlist applies to native builds only.
 */
const ENFORCED = Platform.OS !== "web";

/** True when this app may show `pathname`. Use it to hide links into other apps. */
export function canOpen(pathname: string): boolean {
  if (!ENFORCED) return true;
  return ALLOWED_ROUTES.some((r) =>
    r.endsWith("/*") ? pathname.startsWith(r.slice(0, -1)) : pathname === r,
  );
}

/** Where a blocked route goes instead: the target's own first screen, or the entry page. */
export const HOME_ROUTE = TARGET.firstRoute ?? "/";
