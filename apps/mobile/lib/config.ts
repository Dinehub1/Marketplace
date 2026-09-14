import Constants from "expo-constants";

/**
 * Build-time tenant configuration, read from app.config.ts → expo.extra.
 *
 * One binary ships one brand. Cloning the app for another tenant is a set of
 * BRAND_* environment variables and an EAS profile, not a code change.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

function required(key: string, value: string | undefined): string {
  if (!value) {
    // Failing loudly at boot beats a screen full of empty lists that looks like
    // the directory is simply empty.
    throw new Error(
      `Missing "${key}". Set EXPO_PUBLIC_* in your environment (or an EAS build ` +
        `secret) before building. See apps/mobile/README.md.`,
    );
  }
  return value;
}

export const BRAND_SLUG = extra.brandSlug ?? "sarkarmarketplace";

export const SUPABASE_URL = required("EXPO_PUBLIC_SUPABASE_URL", extra.supabaseUrl);
export const SUPABASE_KEY = required("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY", extra.supabaseKey);

/**
 * The web app's origin. The mobile app reuses its OTP endpoints rather than
 * standing up a second auth path, so this must point at the deployed site — or
 * a LAN IP during development, since on a phone `localhost` is the phone.
 */
export const WEB_BASE_URL = extra.webBaseUrl ?? "https://sarkarmarketplace.dropby.co.in";

/**
 * Palette used until the live brand row loads, and if it never does. Sourced
 * from app.config.ts so the icon, the splash and the first painted frame all
 * come from one place.
 */
export const BRAND = {
  slug: BRAND_SLUG,
  name: extra.brandName ?? "SarkarMarketplace",
  theme: {
    primary: extra.brandPrimary ?? "#22543d",
    secondary: extra.brandSecondary ?? "#38a169",
    accent: extra.brandAccent ?? "#9ae6b4",
  },
};
