/**
 * Consistent section header with an optional "view all" affordance. Removes
 * the per-page variation in heading size / spacing that made the site feel
 * like 30 unrelated pages.
 */
export function SectionHeading({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  primary,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  primary?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h2
          className="text-xl font-bold text-neutral-900"
          style={{ letterSpacing: "-0.018em" }}
        >
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {viewAllHref && viewAllLabel && (
        <a
          href={viewAllHref}
          className="press text-sm font-semibold shrink-0"
          style={{ color: primary ?? "#6d28d9" }}
        >
          {viewAllLabel} →
        </a>
      )}
    </div>
  );
}
