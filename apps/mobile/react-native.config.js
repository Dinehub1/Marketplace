/**
 * Native autolinking overrides.
 *
 * `react-native-google-mobile-ads` is a dependency of every build, but a build without
 * ads (`EXPO_PUBLIC_ADS_ENABLED` unset) must not link its native module:
 *
 *   - Android fails to compile it: the SDK it pins (play-services-ads 25.4.0) carries
 *     Kotlin 2.3 metadata, and the Kotlin 2.3 fix (`plugins/with-ads-kotlin`) is only
 *     applied when ads are on.
 *   - Even if it compiled, the Google Mobile Ads SDK crashes at launch when the manifest
 *     has no AdMob app id — and the id is only written by the ads config plugin.
 *
 * So the native side follows the same switch as app.config.ts. The JS side is already
 * safe: `lib/ads/adapters/admob.ts` only `require`s the package from `init()`, which a
 * build with ads off never calls.
 */
const adsEnabled = process.env.EXPO_PUBLIC_ADS_ENABLED === "1";

module.exports = {
  dependencies: adsEnabled
    ? {}
    : {
        "react-native-google-mobile-ads": {
          platforms: { android: null, ios: null },
        },
      },
};
