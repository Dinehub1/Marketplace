import type { ExpoConfig } from "expo/config";
import { TARGETS, byId, familyOf, firstRouteFor } from "./targets.mjs";

/**
 * Native app configuration for every app in the fleet.
 *
 * This is `app.config.ts` rather than `app.json` so secrets can come from the
 * environment instead of being committed, and so the *identity* below can be resolved
 * from `targets.mjs` rather than retyped. `app.json` cannot read `process.env`.
 *
 * One codebase builds nineteen store apps. Which one is decided here, by `APP_TARGET`:
 *
 *   APP_TARGET=breathe npx expo start
 *   APP_TARGET=toolbox eas build --profile preview
 *   APP_TARGET=sarkarmarketplace eas build --profile production   # the default
 *
 * Everything a store listing is judged on — name, bundle id, slug, icon, accent,
 * permission set, and the screen it opens on — is derived from that one word. Retyping
 * any of it here is how the build and the duplicate-app gate (`check-targets.mjs`) start
 * disagreeing about what the app is.
 *
 * `BRAND_*` still wins where it is set, for the original tenant flow. Runtime brand
 * switching was deliberately not built — it would put a brand picker in front of a user
 * who only ever wanted one of them.
 */

const APP_TARGET =
  process.env.APP_TARGET ?? process.env.EXPO_PUBLIC_APP_TARGET ?? "sarkarmarketplace";

const target = byId(APP_TARGET);
if (!target) {
  // Failing here beats building the default app and shipping it under someone else's
  // name, which is a submission that cannot be undone.
  throw new Error(
    `Unknown APP_TARGET "${APP_TARGET}". Valid ids:\n  ${TARGETS.map((t) => t.id).join("\n  ")}`,
  );
}

const TARGET_DIR = `./assets/targets/${target.id}`;

/**
 * Per-target store art: icon, adaptive icon and splash live in the target's own folder.
 *
 * No filesystem probe here on purpose. `app.config.ts` is typechecked by the app's
 * tsconfig, which has no Node globals — and more to the point, a store build with a
 * missing icon should fail loudly the moment it is built rather than quietly ship the
 * previous app's icon under a new name.
 */
const artFor = (file: string): string => `${TARGET_DIR}/${file}`;

const BRAND_SLUG = process.env.BRAND_SLUG ?? target.id;
const BRAND_NAME = process.env.BRAND_NAME ?? target.name;
/**
 * Permission names as declared in targets.mjs. Annotated because the manifest is a plain
 * `.mjs` file, so TypeScript infers a union of the nineteen object shapes and a bare
 * `.includes("MICROPHONE")` on that union narrows to `never`.
 */
const PERMISSIONS: string[] = [...target.permissions];

/**
 * What a directory app is allowed to list. Absent for the marketplace, which is
 * deliberately everything; absent too for every non-directory target.
 *
 * Cast because `targets.mjs` is a plain JavaScript file, so TypeScript infers a union of
 * the nineteen object shapes and only three of them carry this key.
 */
const SCOPE = (target as { scope?: { include: string[]; exclude: string[] } }).scope;
/**
 * The marketplace is already configured in App Store Connect under the legacy id, so
 * changing it here would orphan the existing listing. Every other target takes its id
 * from targets.mjs.
 */
const BUNDLE_ID =
  process.env.BRAND_BUNDLE_ID ??
  (target.id === "sarkarmarketplace" ? "live.cashcard.sarkarmarketplace" : target.bundleId);

/**
 * Brand ramp. Mirrors the `theme` column on the brand row so a cold launch paints the
 * right colours before the network answers.
 *
 * A target carries one accent, so the other two steps are derived from it. The
 * marketplace keeps its hand-chosen green ramp: it is already shipped, and repainting a
 * live app is a design decision, not a side effect of adding targets.
 */
const BRAND_PRIMARY = process.env.BRAND_PRIMARY ?? (target.id === "sarkarmarketplace" ? "#22543d" : target.color);
const BRAND_SECONDARY = process.env.BRAND_SECONDARY ?? (target.id === "sarkarmarketplace" ? "#38a169" : target.color);
const BRAND_ACCENT = process.env.BRAND_ACCENT ?? (target.id === "sarkarmarketplace" ? "#9ae6b4" : tint(target.color, 0.55));

/** Lighten a hex colour toward white by `amount` (0..1). Keeps the hue, lifts the value. */
function tint(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Declared permissions, mapped to what the stores actually read. A permission the app
 * cannot use is a line in the listing and a reason for someone to decline the install —
 * and on Apple it is a 4.3 signal that two listings are the same binary.
 */
const ANDROID_PERMISSION: Record<string, string> = {
  CAMERA: "android.permission.CAMERA",
  PHOTOS: "android.permission.READ_MEDIA_IMAGES",
  FILES: "android.permission.READ_EXTERNAL_STORAGE",
  LOCATION: "android.permission.ACCESS_COARSE_LOCATION",
  MICROPHONE: "android.permission.RECORD_AUDIO",
  CONTACTS: "android.permission.READ_CONTACTS",
};

const ANDROID_PERMISSIONS = [
  "android.permission.INTERNET",
  ...PERMISSIONS.map((p) => ANDROID_PERMISSION[p]).filter(Boolean),
];

/** Only a target that uses the camera or the library gets the usage strings for them. */
const USES_PHOTOS = PERMISSIONS.some((p) => p === "CAMERA" || p === "PHOTOS");

/** Canvas colours, from packages/tokens. The splash must match the app's first
 *  painted frame or launch shows a flash of the wrong background. */
const CANVAS_LIGHT = "#fbfbfd";
const CANVAS_DARK = "#0a0a0d";

const config: ExpoConfig = {
  name: BRAND_NAME,
  // The marketplace keeps its original slug: it is already an EAS project, and a new
  // slug would silently fork the build history away from the published app.
  slug: process.env.EXPO_SLUG ?? (target.id === "sarkarmarketplace" ? "sarkar-marketplace" : target.id),
  scheme: BRAND_SLUG,
  version: "1.0.0",
  orientation: "portrait",
  icon: artFor("icon.png"),
  // "automatic" is what lets the OS dark-mode setting reach useColorScheme().
  // Without it React Native reports "light" forever and the theme's "System"
  // option silently does nothing.
  userInterfaceStyle: "automatic",
  // `newArchEnabled` is gone in SDK 57: the New Architecture is the only
  // architecture, so the key was dropped from the ExpoConfig type.
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
    // `edgeToEdgeEnabled` is gone in SDK 57: edge-to-edge is always on for
    // Android 16, so the key was dropped from the Android config type.
    adaptiveIcon: {
      foregroundImage: artFor("adaptive-icon.png"),
      backgroundColor: BRAND_PRIMARY,
    },
    // Only what this target actually does. Every permission is a line in the store
    // listing and a reason for someone to decline the install — and a permission set
    // that never changes is itself evidence the listings are one app repeated.
    permissions: ANDROID_PERMISSIONS,
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
    // expo-image-picker is auto-linked, but its config plugin is what writes the
    // photo/camera usage strings iOS requires. Without them a build that opens
    // the picker is rejected by App Review (and crashes on first launch on iOS).
    //
    // Conditional on purpose: a breathing timer that asks for the camera is asking for
    // something it cannot use, and Apple reads a constant permission set across many
    // listings as one app wearing different icons. The copy names the app and its job,
    // because that is what the reviewer is checking the request against.
    ...(USES_PHOTOS
      ? ([
          [
            "expo-image-picker",
            {
              photosPermission: `${BRAND_NAME} reads only the photos you choose — ${target.tagline}.`,
              cameraPermission: `${BRAND_NAME} uses the camera for one job — ${target.tagline}.`,
              // These apps take stills; none of them records audio through the picker.
              // Left alone, the plugin adds RECORD_AUDIO to every one of them, which is
              // a permission the app cannot use and a reviewer can see. `false` blocks
              // it rather than merely not adding it.
              microphonePermission: PERMISSIONS.includes("MICROPHONE")
                ? `${BRAND_NAME} records audio for one job — ${target.tagline}.`
                : false,
            },
          ],
        ] as [string, Record<string, string>][])
      : []),
    // SDK 57 requires these listed explicitly (the CLI flagged them as
    // "cannot automatically write to dynamic config" when it tried to add them):
    // expo-status-bar for the status bar control, expo-web-browser for the
    // in-app browser used by tel:/maps/wa.me hand-offs.
    "expo-status-bar",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        image: artFor("splash-icon.png"),
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
    // The resolved target, read back at runtime by lib/target.ts. This is the one wire
    // between the build-time identity and the app that boots: everything else in the
    // binary is shared code, and every product decision keys off this object.
    target: {
      id: target.id,
      name: target.name,
      tagline: target.tagline,
      color: target.color,
      family: familyOf(target),
      // Both of these are omitted rather than set to null when absent. Expo's config
      // serialiser turns a null into `{}`, and an empty object is truthy — so a target
      // whose first screen is not built would advertise a route that does not exist, to
      // anything that asks. lib/target.ts and scripts/check-fleet.mjs both check for a
      // string, but the honest fix is to not write the key at all.
      ...(firstRouteFor(target) ? { firstRoute: firstRouteFor(target) } : {}),
      products: target.products,
      permissions: PERMISSIONS,
      ...(SCOPE ? { scope: SCOPE } : {}),
      ...(target.ads ? { ads: target.ads } : {}),
    },
    eas: { projectId: process.env.EAS_PROJECT_ID ?? "" },
  },
};

export default config;
