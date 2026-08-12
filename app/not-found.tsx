import Link from "next/link";
import { getBrandFromHost } from "@/lib/brands";
import { BrandHeader, BrandFooter } from "./brand-router/[brand]/brand-header";

export const dynamic = "force-dynamic";

/**
 * Genuine 404 page.
 *
 * This used to render the full <BrandLanding> marketing page for any 404 on a
 * brand subdomain. That was a fallback from when brands had no static site
 * folder — every brand has one now, so all it did was hijack real 404s: a
 * visitor who clicked a deleted business listing landed on a marketing splash
 * with no explanation and no way back to what they were looking for. It also
 * dragged the entire landing page into the not-found boundary, which Next
 * serialises into the RSC payload of *every* page on the site.
 *
 * A 404 should say what happened and offer the next step. Search is that step
 * here, because the most common way to reach this page is a listing that has
 * since been removed.
 */
export default async function NotFound() {
  const brand = await getBrandFromHost();

  if (brand) {
    const theme = (brand.theme ?? {}) as Record<string, string>;
    const primary = theme.primary ?? "#6d28d9";
    const secondary = theme.secondary ?? "#8b5cf6";
    const origin = ``;

    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
        <BrandHeader brand={brand} />
        <main className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="w-full max-w-lg text-center">
            <div className="mb-5 flex justify-center text-neutral-300">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
              </svg>
            </div>
            <h1 className="text-[1.75rem] md:text-[2.1rem] font-extrabold text-neutral-900"
                style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              We couldn&apos;t find that page
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-500" style={{ lineHeight: 1.6 }}>
              The listing may have been removed, or the link may be out of date.
              Search the directory and you&apos;ll probably find what you were after.
            </p>

            <form action={`${origin}/marketplace`} method="GET" className="mt-7">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,16,24,0.05)]">
                <span className="pl-3 text-neutral-400" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                  </svg>
                </span>
                <input name="q" aria-label="Search businesses"
                       placeholder="Try “plumber” or “dentist”"
                       className="flex-1 bg-transparent px-1.5 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none" />
                <button type="submit" className="press rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
              <a href={`${origin}/marketplace`} className="press font-semibold" style={{ color: primary }}>
                Business directory
              </a>
              <a href={`${origin}/categories`} className="press font-semibold" style={{ color: primary }}>
                All categories
              </a>
              <a href={origin} className="press font-semibold text-neutral-500">
                Home
              </a>
            </div>
          </div>
        </main>
        <BrandFooter brand={brand} />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-neutral-500">This page doesn&apos;t exist.</p>
      <Link
        href="/admin"
        className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        ← Back to dashboard
      </Link>
    </main>
  );
}
