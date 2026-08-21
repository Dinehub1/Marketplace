/**
 * Consistent section header with an optional "view all" affordance. Removes
 * the per-page variation in heading size / spacing that made the site feel
 * like 30 unrelated pages.
 *
 * An optional `eyebrow` sits above the title. It answers "what kind of thing
 * is this section?" in one word, which is cheaper for the reader than a longer
 * title trying to carry both the category and the specifics.
 */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Accepted for call-site compatibility; colour now comes from the tokens. */
  primary?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h2
          style={{
            fontSize: "clamp(1.375rem, 1.2rem + 0.6vw, 1.75rem)",
            fontWeight: 720,
            letterSpacing: "-0.026em",
            lineHeight: 1.16,
            color: "var(--ink)",
            textWrap: "balance",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[0.9375rem]" style={{ color: "var(--ink-2)", lineHeight: 1.55, textWrap: "pretty" }}>
            {subtitle}
          </p>
        )}
      </div>

      {viewAllHref && viewAllLabel && (
        <a
          href={viewAllHref}
          className="press group inline-flex shrink-0 items-center gap-1 pb-1 text-[0.875rem] font-[600]"
          style={{ color: "var(--brand-secondary)", letterSpacing: "-0.008em" }}
        >
          {viewAllLabel}
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-0.5"
            style={{ transitionTimingFunction: "var(--ease-settle)" }}
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}
