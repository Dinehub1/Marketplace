import { BrandHeader, BrandFooter } from "../brand-header";
import { CITY_LABEL, categoryPath, getCategoryIndex } from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";

function titleize(s: string) {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * The full category index.
 *
 * This is where an exhaustive list belongs — a dedicated page a visitor chooses
 * to open — rather than dumped above the listings on /marketplace, which is
 * where it used to live. Grouped alphabetically so 320 entries stay scannable,
 * and it doubles as the internal-link hub that makes every category page
 * reachable in two clicks from the homepage.
 */
export async function CategoriesPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const origin = `https://${brand.slug}.cashcard.live`;

  const index = await getCategoryIndex();

  const groups = new Map<string, typeof index>();
  for (const c of index) {
    const letter = titleize(c.category)[0]?.toUpperCase() ?? "#";
    const key = /[A-Z]/.test(letter) ? letter : "#";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const letters = [...groups.keys()].sort();
  for (const l of letters) {
    groups.get(l)!.sort((a, b) => a.category.localeCompare(b.category));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <BrandHeader brand={brand} />

      <main className="flex-1">
        <section className="border-b border-black/[0.06]">
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-10">
            <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
              <a href={origin} className="press hover:text-neutral-600">{brand.name}</a>
              <span aria-hidden="true">›</span>
              <a href={`${origin}/marketplace`} className="press hover:text-neutral-600">Directory</a>
              <span aria-hidden="true">›</span>
              <span className="text-neutral-500">All categories</span>
            </nav>
            <h1 className="text-[2rem] md:text-[2.6rem] font-extrabold text-neutral-900"
                style={{ letterSpacing: "-0.032em", lineHeight: 1.08 }}>
              All categories in {CITY_LABEL}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-neutral-500" style={{ lineHeight: 1.6 }}>
              Every type of business listed in the directory, A to Z. Pick one to see the
              highest-rated options with phone numbers you can call.
            </p>
          </div>
        </section>

        {/* Jump bar — 320 entries is a lot of scrolling without one. */}
        <div className="sticky top-[57px] z-30 glass">
          <div className="mx-auto max-w-5xl overflow-x-auto px-6 py-2.5">
            <div className="flex gap-1">
              {letters.map((l) => (
                <a key={l} href={`#letter-${l}`}
                   className="press flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-neutral-500 hover:bg-neutral-900/[0.05]">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-5xl px-6 py-10">
          {letters.map((l) => (
            <div key={l} id={`letter-${l}`} className="mb-10 scroll-mt-28">
              <h2 className="mb-3 flex items-center gap-3 text-sm font-bold text-neutral-400">
                <span>{l}</span>
                <span className="h-px flex-1 bg-black/[0.07]" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {groups.get(l)!.map((c) => (
                  <a key={c.slug} href={`${origin}${categoryPath(c.category)}`}
                     className="press group flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white hover:ring-1 hover:ring-black/[0.05]">
                    <span className="text-neutral-300 group-hover:text-current transition-colors"
                          style={{ color: undefined }}>
                      <CategoryIcon category={c.category} size={17} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">
                      {titleize(c.category)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
