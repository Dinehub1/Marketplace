/**
 * `@hermes/expo-ui` — Expo template UI atoms shared by more than one app.
 *
 * Why this package exists, and why it is small on purpose.
 *
 * The standalone apps were each generated from an Expo template, so several of them
 * carry the same component files. Auditing them turned up two facts that changed the
 * plan from "extract the shared atoms" to "extract very little, and delete instead":
 *
 *   1. **Most of the copies have no callers at all.** `ExternalLink` is defined in five
 *      apps and imported by none. The same holds for every `HelloWave`,
 *      `ParallaxScrollView` and `Collapsible` copy, and for three of the five
 *      `HapticTab`s. They are template leftovers rather than shared code, and extracting
 *      them would have given this package more exports than the apps have uses.
 *
 *   2. **The components that *are* used are not portable as they stand.** `ThemedText`,
 *      `ThemedView` and `IconSymbol` have real callers (quick-driver 19 and 18,
 *      smokefree 10 and 10), but each app's copy imports its own `@/hooks/useThemeColor`,
 *      which reads its own `@/constants/theme` palette. Those palettes are the apps'
 *      branding and genuinely differ. A shared component cannot import them, and one
 *      `@/` alias cannot point at nine apps. Lifting them needs a theme provider or a
 *      per-app factory — a design change, not a move. Copying one app's palette over the
 *      others would flatten their branding, which is the one thing this work must not do.
 *
 * So this package exports what is both used **and** portable: `HapticTab`, which two live
 * screens use (`smokefree` and `money-map`) and which depends only on public packages.
 *
 * `ExternalLink` is exported as well even though nothing calls it yet — not in this
 * package, and not anywhere in the repo. It is a working implementation of something
 * every app will eventually want (an in-app browser on native, a new tab on web), and
 * one reviewed copy beats five copy-pasted ones. It is the only export here without a
 * caller; do not read its presence as evidence of use.
 *
 * The dead template files are their own cleanup, listed in docs/code-sharing-audit.md:
 * 24 files and 1,005 lines with no caller in any app.
 */
export { HapticTab } from "./haptic-tab.tsx";
export { ExternalLink } from "./external-link.tsx";
