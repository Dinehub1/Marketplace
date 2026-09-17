import { BrandHeader, BrandFooter } from "./brand-header";
import { getBrand } from "@/lib/brands";

/**
 * Serves a prebuilt static site from `public/sites/<folder>` inside a brand shell.
 *
 * ── INTENTIONALLY UNREFERENCED. NOT DEAD. ───────────────────────────────────────
 * Nothing imports this component, and that is a decision, not an oversight.
 *
 * These prebuilt sites were the original 28 brand landing pages. They were retired
 * from the router because they were marketing mockups with dead `#` links and no
 * live data — worse, they hijacked brand-semantic routes: `/doctors` on sarkarhealth
 * resolved to `/sites/sarkarhealth/doctors`, a file that does not exist, so the route
 * answered 404 no matter what the app defined. `proxy.ts` no longer routes to them;
 * the brand router serves real pages from live data instead.
 *
 * The mechanism is kept whole — the component, `lib/site-folders.ts`, the
 * `gen-site-folders.mjs` prebuild step and the 4.3 MB of HTML in `public/sites` — so a
 * landing page can be revived by adding one branch to `brand-router/[brand]/page.tsx`,
 * with no archaeology in git history. Requests under `/sites/` are still served
 * directly today (see BYPASS_PREFIXES in `proxy.ts`), so nothing that links there breaks.
 *
 * If you are here to delete something: this is the one place in the repo where an
 * unreferenced file is deliberate. See docs/architecture-connections.md.
 */
export async function BrandStaticSite({ brand }: { brand: Awaited<ReturnType<typeof getBrand>> }) {
  if (!brand) return null;
  const folder = brand.folder;
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const bg = theme.bg ?? "#ffffff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <div className="flex-1">
        {/* Brand navigation bar */}
        <div className="border-b px-4 py-2 flex items-center justify-between text-sm" style={{ borderColor: "var(--brand-hairline)" }}>
          <div className="flex items-center gap-4">
            <span className="font-bold" style={{ color: "var(--brand-secondary)" }}>{brand.name}</span>
            <nav className="flex gap-3 text-xs opacity-60">
              <a href={`/`} className="hover:opacity-100">Home</a>
              <a href={`/dashboard`} className="hover:opacity-100">Dashboard</a>
              <a href={`/login`} className="hover:opacity-100">Login</a>
            </nav>
          </div>
          <span className="text-xs opacity-40">{brand.tagline}</span>
        </div>
        {/* Static site iframe */}
        <iframe
          src={`/sites/${folder}/index.html`}
          className="w-full border-0"
          style={{ minHeight: "calc(100vh - 120px)" }}
          title={brand.name}
        />
      </div>
      <BrandFooter brand={brand} />
    </div>
  );
}
