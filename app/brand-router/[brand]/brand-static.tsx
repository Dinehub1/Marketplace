import { BrandHeader, BrandFooter } from "./brand-header";
import { getBrand } from "@/lib/brands";

/**
 * Serves the existing static site/{folder} inside a brand shell.
 * The static HTML is loaded via an iframe so existing JS/CSS keeps working
 * while we add a consistent brand navigation bar on top.
 */
export async function BrandStaticSite({ brand }: { brand: Awaited<ReturnType<typeof getBrand>> }) {
  if (!brand) return null;
  const folder = brand.folder;
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const bg = theme.bg ?? "#ffffff";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <div className="flex-1">
        {/* Brand navigation bar */}
        <div className="border-b px-4 py-2 flex items-center justify-between text-sm" style={{ borderColor: `${primary}20` }}>
          <div className="flex items-center gap-4">
            <span className="font-bold" style={{ color: primary }}>{brand.name}</span>
            <nav className="flex gap-3 text-xs opacity-60">
              <a href={`https://${brand.slug}.cashcard.live/`} className="hover:opacity-100">Home</a>
              <a href={`https://${brand.slug}.cashcard.live/dashboard`} className="hover:opacity-100">Dashboard</a>
              <a href={`https://${brand.slug}.cashcard.live/login`} className="hover:opacity-100">Login</a>
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
