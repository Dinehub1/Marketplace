import { cleanBusinessName, telHref, waHref } from "@/lib/categories";
import { CategoryIcon } from "@/lib/icons";
import { CategoryCover } from "@/components/category-cover";

/**
 * Directory listing card — the single source of truth for how a business
 * renders across marketplace, category pages and the homepage.
 *
 * Colours now come from CSS custom properties published by <BrandTheme/>
 * rather than from `primary` / `secondary` props, so the card can express
 * brand colour in states CSS owns and props cannot reach: hover, press, focus
 * ring, and a brand-tinted elevation on lift. The props are still accepted so
 * the ~8 call sites keep compiling, and are forwarded to the cover art.
 */
/** The fields this card reads. Narrower than a `businesses` row on purpose: the
 *  card is a presentation contract, not a mirror of the table. */
export type BusinessCardData = {
  id: number;
  name: string;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  website?: string | null;
};

export function BusinessCard({
  b,
  primary,
  secondary,
}: {
  b: BusinessCardData;
  primary: string;
  secondary: string;
}) {
  const rating = b.rating != null ? Number(b.rating) : null;

  return (
    <article className="card card-lift group relative flex flex-col overflow-hidden">
      <CategoryCover
        category={b.category}
        primary={primary}
        secondary={secondary}
        className="h-28 w-full"
      />

      <div className="flex items-start gap-3 px-4 pt-4">
        <span
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl"
          style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}
        >
          <CategoryIcon category={b.category ?? ""} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className="text-[0.9375rem] font-[620]"
            style={{ letterSpacing: "-0.012em", lineHeight: 1.32, color: "var(--ink)" }}
          >
            {/* Stretched link: the whole card is the target, but only one link
                is in the accessibility tree. */}
            <a href={`/business/${b.id}`} className="after:absolute after:inset-0">
              {cleanBusinessName(b.name)}
            </a>
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {rating != null && (
              <span className="badge badge-gold tabular">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" />
                </svg>
                {rating.toFixed(1)}
                {b.reviews_count != null && (
                  <span style={{ opacity: 0.66, fontWeight: 520 }}>
                    ({b.reviews_count.toLocaleString("en-IN")})
                  </span>
                )}
              </span>
            )}
            {b.category && (
              <span className="truncate text-[0.75rem]" style={{ color: "var(--ink-3)" }}>
                {b.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {b.address && (
        <p
          className="mt-2.5 line-clamp-2 px-4 text-[0.75rem]"
          style={{ color: "var(--ink-3)", lineHeight: 1.55 }}
        >
          {b.address}
        </p>
      )}

      {/* Above the stretched link so it stays independently tappable —
          calling is the conversion. */}
      {b.phone && (
        <div className="mt-auto flex gap-2 px-4 pb-4 pt-4">
          <a
            href={telHref(b.phone)}
            className="btn-primary btn-sm relative z-10 flex-1 tabular"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z" />
            </svg>
            {b.phone}
          </a>

          <a
            href={waHref(b.phone, `Hi ${b.name ?? "there"}, I found you on a local business directory and would like to enquire.`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Message ${b.name ?? "business"} on WhatsApp`}
            className="press relative z-10 grid w-11 place-items-center rounded-xl"
            /* WhatsApp green is a third-party brand mark: it stays literal
               rather than being re-tinted, because recognising it instantly is
               the entire point of the affordance. */
            style={{ background: "var(--whatsapp-tint)", color: "var(--whatsapp)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.37a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.13c-.25.69-1.45 1.32-1.99 1.36-.53.04-1.07.24-3.62-.75-2.99-1.13-4.9-4.02-5.05-4.21-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.51.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.45.5-.15.14-.3.3-.13.58.17.28.75 1.24 1.61 2.01 1.11 1.11 2.04 1.45 2.32 1.61.28.16.44.14.6-.09.17-.23.71-.83.9-1.11.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.69-.18 1.38z"/></svg>
          </a>

          {b.website && (
            <a
              href={b.website}
              target="_blank"
              rel="noopener nofollow noreferrer"
              aria-label={`${b.name ?? "Business"} website`}
              className="press relative z-10 grid w-11 place-items-center rounded-xl"
              style={{ background: "var(--surface-sunken)", color: "var(--ink-2)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
              </svg>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
