import type { ExpoConfig } from "expo/config";

/**
 * Native app configuration for the SarkarMarketplace iOS/Android build.
 *
 * This is `app.config.ts` rather than `app.json` so secrets can come from the
 * environment instead of being committed. `app.json` cannot read `process.env`,
 * which is why the Supabase key would otherwise have to sit in version control.
 *
 * Shipping another tenant is a config change, not a code change: override the
 * BRAND_* variables below (or copy this file and the EAS profile). Runtime brand
 * switching was deliberately not built — it would put a brand picker in front of
 * a user who only ever wanted one of them.
 */

const BRAND_SLUG = process.env.BRAND_SLUG ?? "sarkarmarketplace";
const BRAND_NAME = process.env.BRAND_NAME ?? "SarkarMarketplace";
const BUNDLE_ID = process.env.BRAND_BUNDLE_ID ?? "live.cashcard.sarkarmarketplace";

/** Brand ramp. Mirrors the `theme` column on the brand row so a cold launch
 *  paints the right colours before the network answers. */
const BRAND_PRIMARY = process.env.BRAND_PRIMARY ?? "#22543d";
const BRAND_SECONDARY = process.env.BRAND_SECONDARY ?? "#38a169";
const BRAND_ACCENT = process.env.BRAND_ACCENT ?? "#9ae6b4";

/** Canvas colours, from packages/tokens. The splash must match the app's first
 *  painted frame or launch shows a flash of the wrong background. */
const CANVAS_LIGHT = "#fbfbfd";
const CANVAS_DARK = "#0a0a0d";

const config: ExpoConfig = {
  name: BRAND_NAME,
  slug: "sarkar-marketplace",
  scheme: BRAND_SLUG,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  // "automatic" is what lets the OS dark-mode setting reach useColorScheme().
  // Without it React Native reports "light" forever and the theme's "System"
  // option silently does nothing.
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  assetBundlePatterns: ["**/*"],

  // Native only. The web target would pull in react-native-web and produce a
  // second, worse version of a website that already exists at apps/web — one
  // that loses the CSS materials, hover states and media queries the real site
  // is built on.
  platforms: ["ios", "android"],

  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
    // Build number is managed by EAS (`autoIncrement` in eas.json), so it is
    // deliberately absent here — two sources for it means failed submissions.
    infoPlist: {
      // Required by App Review: the app opens tel:, wa.me and maps links, and
      // iOS silently fails canOpenURL for unlisted schemes.
      LSApplicationQueriesSchemes: ["tel", "telprompt", "whatsapp", "comgooglemaps", "maps"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: BUNDLE_ID,
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: BRAND_PRIMARY,
    },
    // Only what the app actually does. Every permission is a line in the store
    // listing and a reason for someone to decline the install.
    permissions: ["android.permission.INTERNET"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "dropby.co.in", pathPrefix: "/business" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  plugins: [
    "expo-router",
    // SDK 57 requires these listed explicitly (the CLI flagged them as
    // "cannot automatically write to dynamic config" when it tried to add them):
    // expo-status-bar for the status bar control, expo-web-browser for the
    // in-app browser used by tel:/maps/wa.me hand-offs.
    "expo-status-bar",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: CANVAS_LIGHT,
        // A splash that ignores dark mode is a full-screen white flash on the
        // way into a dark app — the exact brightness jump reduced-motion
        // guidance asks you to avoid.
        dark: { backgroundColor: CANVAS_DARK },
      },
    ],
  ],

  experiments: { typedRoutes: true },

  extra: {
    brandSlug: BRAND_SLUG,
    brandName: BRAND_NAME,
    brandPrimary: BRAND_PRIMARY,
    brandSecondary: BRAND_SECONDARY,
    brandAccent: BRAND_ACCENT,
    // Read from the environment so the publishable key is supplied by an EAS
    // secret at build time rather than committed. These are the *publishable*
    // Supabase credentials — the service-role key must never reach a client
    // binary, where anyone can extract it from the bundle.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    // The platform moved off cashcard.live; the marketplace lives on a
    // subdomain because dropby.co.in's apex belongs to another app.
    webBaseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "https://sarkarmarketplace.dropby.co.in",
    eas: { projectId: process.env.EAS_PROJECT_ID ?? "" },
  },
};

export default config;
