/**
 * The product screens' shared look, built on @hermes/tokens.
 *
 * Why this file exists: the product screens were each written as their own thing
 * and drifted — an audit of the first four found 19 raw hex values and FOURTEEN
 * different font sizes where the design system defines nine. A customer sees one
 * app, not five, so the type scale, the spacing, the radii and the greys come
 * from here and nowhere else.
 *
 * What each product MAY keep is one accent colour: the passport screen is blue,
 * the PDF toolkit is red, the invoice is green. That identity goes in
 * PRODUCT_ACCENTS below (with its dark-mode variant) rather than in the screen,
 * so light and dark stay legible and two products cannot accidentally share a
 * colour.
 */
import { useMemo } from "react";
import { space, radius, type } from "@hermes/tokens";
import { useTheme } from "./theme";

/** Semantic palette keys a product may use as its accent. */
export type AccentKey = "info" | "critical" | "positive" | "warning" | "gold";

/**
 * Per-product accents. A key here is the ONLY place a product's colour is
 * decided; screens ask for the product they are.
 */
const PRODUCT_ACCENTS: Record<string, AccentKey> = {
  "passport-photo": "info",
  "product-photo": "info",
  "cover-maker": "info",
  "photo-repair": "warning",
  "pdf-tools": "critical",
  "invoice-maker": "positive",
  "bg-remove": "positive",
  // Calm, not clinical: the breathing screen keeps the informational accent.
  breathe: "info",
  // The wellness family: each tab keeps its own colour so the five screens read as five
  // different jobs (a calm blue, a green for movement, teal for tracking, violet at night).
  stretch: "positive",
  walk: "positive",
  water: "info",
  japa: "gold",
  sleep: "warning",
  habits: "info",
  // The three toolbox products added with their screens (item 14): a re-save, a
  // pdfcpu import and a Pillow sheet, each with its own colour so two products
  // cannot be mistaken for one.
  "exif-strip": "info",
  "photos-to-pdf": "critical",
  "collage": "gold",
};

/** Fallback accent when a screen is not tied to one catalogue product. */
const DEFAULT_ACCENT: AccentKey = "info";

export type ProductUI = ReturnType<typeof useProductUI>;

/**
 * The look of one product screen.
 *
 * `ui.c.ink` / `c.ink2` / `c.ink3` / `c.hairline` / `c.canvas` / `c.surface` are
 * the palette's semantic names — use them instead of a hex value, and dark mode
 * works without a second code path.
 */
export function useProductUI(product?: string) {
  const { c, scheme, elevation } = useTheme();

  return useMemo(() => {
    const accentKey = (product && PRODUCT_ACCENTS[product]) || DEFAULT_ACCENT;
    // The palette ships a tint alongside each semantic colour (infoTint,
    // positiveTint, …) — that pair is what makes a tinted card legible in both
    // schemes instead of a hand-mixed rgba() that only suits light mode.
    const tintKey = `${accentKey}Tint` as keyof typeof c;

    return {
      c,
      scheme,
      type,
      space,
      radius,

      /** This product's colour pair. */
      accent: c[accentKey],
      accentTint: (c[tintKey] as string) ?? c.hairline,

      /** The few semantic shortcuts the screens actually need. */
      ink: c.ink,
      muted: c.ink2,
      faint: c.ink3,
      hairline: c.hairline,
      bg: c.canvas,
      surface: c.surface,
      error: c.critical,

      /** Card + sheet elevation, per platform. */
      card: elevation(1),
      raised: elevation(2),
      /** The minimum hit area; never shrink a button below it. */
      touch: 44,
    };
  }, [c, scheme, elevation, product]);
}

/** True when this device is showing the dark scheme. */
export function useIsDark(): boolean {
  return useTheme().scheme === "dark";
}

/**
 * The two text presets screens kept inventing: a label that is bold at body
 * size, and fine print that is small without the caption's wide tracking.
 * Buttons are the third — the scale's `callout` is weight 500, which is right
 * for prose and too light for a button.
 */
export const productText = {
  label: { ...type.meta, fontWeight: "600" as const },
  fine: { ...type.caption, letterSpacing: 0, fontWeight: "400" as const },
  button: { ...type.callout, fontWeight: "700" as const },
  /**
   * The one deliberate exception to the nine-step scale: a status tag ("READY",
   * "SERVER SOON") sits inside a card footer next to a price, and at caption size
   * it wraps the card. Everything else stays on the scale.
   */
  tag: { ...type.caption, fontSize: 10, letterSpacing: 0.4, fontWeight: "800" as const },
};
