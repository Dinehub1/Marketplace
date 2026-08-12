import { categoryPath, cleanBusinessName, telHref } from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";
import { CategoryCover } from "@/components/category-cover";

/**
 * Directory listing card — the single source of truth for how a business
 * renders across marketplace, category pages and the homepage. Keeps the
 * proven stretched-link + gradient cover + rating/reviews badge pattern,
 * but centralised so a visual change lands everywhere at once.
 */
export function BusinessCard({
  b,
  primary,
  secondary,
}: {
  b: any;
  primary: string;
  secondary: string;
}) {
  return (
    <article className="card-lift group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(16,16,24,0.04)] hover:shadow-[0_14px_44px_-14px_rgba(16,16,24,0.20)]">
      <CategoryCover
        category={b.category}
        primary={primary}
        secondary={secondary}
        className="-mt-5 mb-4 h-28 w-full"
      />
      <div className="flex items-start gap-3 px-5">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${primary}10`, color: primary }}
        >
          <CategoryIcon category={b.category ?? ""} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-neutral-900">
            {/* Stretched link: the whole card is the target, but only one link
                is in the accessibility tree. */}
            <a href={`/business/${b.id}`} className="after:absolute after:inset-0">
              {cleanBusinessName(b.name)}
            </a>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
            {b.rating != null && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" />
                </svg>
                {b.rating}
                {b.reviews_count != null && (
                  <span className="font-medium text-neutral-400">
                    ({b.reviews_count.toLocaleString("en-IN")})
                  </span>
                )}
              </span>
            )}
            {b.category && <span className="truncate">{b.category}</span>}
          </div>
        </div>
      </div>

      {b.address && (
        <p className="mt-3 px-5 line-clamp-2 text-xs leading-relaxed text-neutral-500">{b.address}</p>
      )}

      {/* Above the stretched link so it stays independently tappable —
          calling is the conversion. */}
      {b.phone && (
        <div className="mt-auto flex gap-2 px-5 pb-5 pt-4">
          <a
            href={telHref(b.phone)}
            className="press relative z-10 inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z" />
            </svg>
            {b.phone}
          </a>
          {b.website && (
            <a
              href={b.website}
              target="_blank"
              rel="noopener nofollow noreferrer"
              aria-label={`${b.name ?? "Business"} website`}
              className="press relative z-10 inline-flex items-center justify-center rounded-xl bg-neutral-900/[0.04] px-3 py-2.5 text-neutral-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
              </svg>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
