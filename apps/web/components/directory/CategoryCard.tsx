import { CategoryIcon } from "@/lib/icons";
import { categoryPath } from "@/lib/categories";

/**
 * Category tile used on the marketplace, category landing pages and the
 * homepage. Icon + name + optional count, with the shared card-lift press
 * response. Keeping it here means every category list in the app looks
 * identical.
 *
 * `primary` / `secondary` are still accepted for call-site compatibility but
 * are no longer needed: colour now comes from the CSS tokens published by
 * <BrandTheme/>, which lets the tile tint its icon well on hover — something a
 * prop-threaded colour could never do.
 */
export function CategoryCard({
  category,
  count,
}: {
  category: string;
  count?: number;
  /** Accepted for call-site compatibility; colour comes from the tokens now. */
  primary?: string;
  secondary?: string;
}) {
  const href = categoryPath(category);
  const label = category.replace(/\b[a-z]/g, (c) => c.toUpperCase());

  return (
    <a href={href} className="card card-lift group flex items-center gap-3 p-3.5">
      <span
        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl transition-colors"
        style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}
      >
        <CategoryIcon category={category} size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[0.875rem] font-[600]"
          style={{ letterSpacing: "-0.01em", lineHeight: 1.35, color: "var(--ink)" }}
        >
          {label}
        </span>
        {count != null && (
          <span className="tabular mt-0.5 block text-[0.75rem]" style={{ color: "var(--ink-3)" }}>
            {count.toLocaleString("en-IN")} listings
          </span>
        )}
      </span>

      {/* A chevron that leans into the gesture: it shifts toward the direction
          of travel on hover, telegraphing where the tap goes. */}
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
        style={{ color: "var(--ink-4)", transitionTimingFunction: "var(--ease-settle)" }}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
