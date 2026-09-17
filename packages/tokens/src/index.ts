/**
 * @hermes/tokens — the design system, shared by the Next.js web app and the
 * Expo app.
 *
 * Colours are generated from `app/globals.css` (see scripts/extract.mjs), so
 * there is exactly one place a colour is decided. Everything else in this file
 * is hand-written because it has no CSS equivalent worth parsing: React Native
 * has no `clamp()`, no `em`, no cascade, and its shadow model is per-platform.
 */

import { lightPalette, darkPalette, type PaletteKey } from "./palette.generated";

export { lightPalette, darkPalette };
export type { PaletteKey };
/** Widened: the two palettes share keys, not values. Narrowing Palette to the
 *  light theme's literals would make every dark value a type error. */
export type Palette = Record<keyof typeof lightPalette, string>;
export type Scheme = "light" | "dark";

export function paletteFor(scheme: Scheme): Palette {
  return scheme === "dark" ? darkPalette : lightPalette;
}

/* ── Brand derivation ──────────────────────────────────────────────────────
   On the web these are `color-mix(in oklab, …)`, resolved by the browser. RN
   has no such function, so the same mixes are done numerically here. Keeping
   the ratios identical to globals.css is what makes the two products look like
   one product. */

/** Parse #rgb / #rrggbb / rgb() / rgba() into channels. */
function channels(color: string): [number, number, number, number] {
  const c = color.trim();
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
      full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
    ];
  }
  const n = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
}

/** `color` at `percent` opacity — the RN stand-in for a color-mix with transparent. */
export function alpha(color: string, percent: number): string {
  const [r, g, b, a] = channels(color);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(a * percent).toFixed(3)})`;
}

/** Mix two colours in sRGB. Not oklab — the difference is imperceptible at the
 *  small ratios used here, and it saves shipping a colour-space library to a
 *  phone for one call site. */
export function mix(a: string, b: string, amountOfA: number): string {
  const [r1, g1, b1] = channels(a);
  const [r2, g2, b2] = channels(b);
  const t = amountOfA;
  return `rgb(${Math.round(r1 * t + r2 * (1 - t))}, ${Math.round(g1 * t + g2 * (1 - t))}, ${Math.round(
    b1 * t + b2 * (1 - t),
  )})`;
}

/**
 * The tenant palette, derived from the three values on the brand row — exactly
 * the derivation `--brand-tint`, `--brand-hairline` and friends perform in CSS.
 * Dark mode derives from `secondary` rather than `primary` and at a higher
 * strength, because the deep end of a brand ramp vanishes against near-black.
 */
export function brandTokens(
  brand: { primary: string; secondary: string; accent?: string },
  scheme: Scheme,
) {
  const base = scheme === "dark" ? brand.secondary : brand.primary;
  const tintStrength = scheme === "dark" ? 0.15 : 0.07;
  const strongStrength = scheme === "dark" ? 0.24 : 0.13;
  const hairlineStrength = scheme === "dark" ? 0.32 : 0.18;

  return {
    primary: brand.primary,
    secondary: brand.secondary,
    accent: brand.accent ?? brand.secondary,
    tint: alpha(base, tintStrength),
    tintStrong: alpha(base, strongStrength),
    hairline: alpha(base, hairlineStrength),
    /** Gradient stops, for expo-linear-gradient. */
    gradient: [brand.primary, brand.secondary] as const,
  };
}

/* ── Typography ────────────────────────────────────────────────────────────
   Tracking is size-specific: large type reads too loose at its natural spacing
   and needs negative tracking, small type needs slightly positive. A single
   letterSpacing is always wrong at one end of the scale.

   RN takes letterSpacing in points, not em, so each entry carries the already-
   multiplied value. Leading moves inversely to size. */

/**
 * React Native's `fontWeight` accepts only 100–900 in hundreds. The web scale
 * uses a real variable axis (620, 760, 540) and cannot be carried over
 * verbatim — the platform will reject the value outright, not round it.
 *
 * Each entry therefore snaps to the nearest legal weight, and records the web
 * value it corresponds to so the two scales stay auditably in step. The visible
 * difference is small; the alternative is bundling a variable font and managing
 * per-platform fallbacks for one step of contrast.
 */
export type Weight = "400" | "500" | "600" | "700" | "800";

export const type = {
  /* web 780 */ hero: { fontSize: 34, lineHeight: 37, letterSpacing: -1.2, fontWeight: "800" as Weight },
  /* web 760 */ title1: { fontSize: 27, lineHeight: 31, letterSpacing: -0.75, fontWeight: "700" as Weight },
  /* web 720 */ title2: { fontSize: 22, lineHeight: 27, letterSpacing: -0.5, fontWeight: "700" as Weight },
  /* web 660 */ title3: { fontSize: 18, lineHeight: 23, letterSpacing: -0.25, fontWeight: "600" as Weight },
  /* web 400 */ lede: { fontSize: 17, lineHeight: 25, letterSpacing: -0.15, fontWeight: "400" as Weight },
  /* web 400 */ body: { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: "400" as Weight },
  /* web 560 */ callout: { fontSize: 15, lineHeight: 21, letterSpacing: -0.1, fontWeight: "500" as Weight },
  /* web 400 */ meta: { fontSize: 13, lineHeight: 18, letterSpacing: 0.05, fontWeight: "400" as Weight },
  /* web 640 */ caption: { fontSize: 11, lineHeight: 15, letterSpacing: 1.15, fontWeight: "600" as Weight },
} as const;

export type TypeKey = keyof typeof type;

/* ── Space, radius, motion ───────────────────────────────────────────────── */

export const space = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, pill: 999 } as const;

/**
 * Springs, not durations. A fixed-duration curve cannot absorb new input
 * mid-flight; a spring just changes target and stays continuous — which is what
 * makes a gesture feel interruptible rather than queued.
 *
 * `settle` is critically damped and is the default. `bounce` overshoots and is
 * reserved for motion that a flick or drag actually carried momentum into;
 * overshoot on something that merely appeared reads as a toy.
 *
 * Values map to react-native-reanimated's withSpring config.
 */
export const spring = {
  settle: { damping: 26, stiffness: 260, mass: 1 },
  bounce: { damping: 17, stiffness: 240, mass: 1 },
  snappy: { damping: 30, stiffness: 420, mass: 0.9 },
} as const;

/** Press feedback happens on pressIn, never on release. This is the budget. */
export const press = { scale: 0.965, scaleLarge: 0.985, durationMs: 90 } as const;

/**
 * What a press does when the OS asks for reduced motion, over `press.durationMs`.
 *
 * Reduce Motion is not "no feedback": a control still has to answer the instant it is
 * touched, or the app reads as broken. What the setting removes is *movement* — so the
 * scale is replaced by this much opacity, which carries the same "I heard you" without
 * anything travelling across the screen.
 */
export const pressFade = 0.28;

/* ── Elevation ─────────────────────────────────────────────────────────────
   iOS reads shadows, Android reads elevation, and the two do not interchange.
   Each level ships both so a card looks the same on either platform. */

export function elevation(level: 0 | 1 | 2 | 3, scheme: Scheme) {
  if (level === 0) return {};
  // Shadows on a dark ground read as absence of light rather than as a cast
  // shadow, so they go deeper and more opaque to stay legible at all.
  const opacity = scheme === "dark" ? [0, 0.4, 0.55, 0.7][level] : [0, 0.06, 0.1, 0.16][level];
  const radiusPx = [0, 3, 12, 28][level];
  const offset = [0, 1, 4, 12][level];
  return {
    shadowColor: "#000",
    shadowOpacity: opacity,
    shadowRadius: radiusPx,
    shadowOffset: { width: 0, height: offset },
    elevation: level * 3,
  };
}

/** Hit targets never go below 44pt — the platform minimum, not a suggestion. */
export const minTouchTarget = 44;
