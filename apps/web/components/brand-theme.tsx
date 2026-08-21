/**
 * Per-tenant theme injection.
 *
 * Before this existed, every brand colour was threaded through the component
 * tree as a `primary` / `secondary` / `accent` prop and re-interpolated into an
 * inline `style={{ background: \`linear-gradient(...)\` }}` at ~400 call sites.
 * That made a visual change a 400-file edit, and it meant CSS could never
 * participate — no `:hover` on a brand colour, no brand-tinted shadow, no
 * `color-mix` tint, no dark-mode re-point.
 *
 * Now the three brand values are published once, as CSS custom properties on
 * `:root`, and the design system derives everything else from them: tints,
 * hairlines, gradients, focus rings and the brand-tinted elevation ramp.
 *
 * One request renders exactly one brand, so writing to `:root` is correct and
 * there is no cross-tenant bleed.
 */

type Theme = Record<string, string | undefined>;

/** Only hex colours are emitted. The values come from a database row, and a
 *  raw string interpolated into a stylesheet is an injection surface — this
 *  is the sanitiser, not a formality. */
function hex(value: string | undefined, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value.trim())
    ? value.trim()
    : fallback;
}

export function BrandTheme({ brand }: { brand: { theme?: Theme | null } }) {
  const theme = (brand?.theme ?? {}) as Theme;

  const primary = hex(theme.primary, "#4c1d95");
  const secondary = hex(theme.secondary, "#7c3aed");
  const accent = hex(theme.accent, "#c4b5fd");
  const bg = hex(theme.bg, "#fbfbfd");

  const css = `:root{--brand-primary:${primary};--brand-secondary:${secondary};--brand-accent:${accent};--brand-bg:${bg};--canvas:${bg};}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
