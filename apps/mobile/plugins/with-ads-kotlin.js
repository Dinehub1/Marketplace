/**
 * Builds the Android ad SDK with the Kotlin it was compiled against.
 *
 * react-native-google-mobile-ads 16.5 pins play-services-ads 25.4.0, whose classes carry
 * Kotlin 2.3 metadata. React Native 0.86 builds with Kotlin 2.1.20, and a 2.1 compiler
 * refuses 2.3 metadata ("Module was compiled with an incompatible version of Kotlin"),
 * so every Android build with ads on fails in :react-native-google-mobile-ads.
 *
 * Both halves have to move together, which is why this is one plugin:
 *   1. `android.kotlinVersion` in gradle.properties — Expo's version catalog reads it,
 *      so the Kotlin stdlib becomes 2.3.
 *   2. the kotlin-gradle-plugin classpath in the root build.gradle — the template leaves
 *      it unversioned, so it resolves to React Native's 2.1.20 compiler. Raising only the
 *      property gives a 2.1 compiler reading a 2.3 stdlib, which fails harder.
 *
 * Applied only when ads are compiled in, so a build without the ad SDK keeps React
 * Native's own Kotlin. Remove once React Native ships Kotlin 2.3 or the ad library
 * pins an SDK built with 2.1.
 */
const { withGradleProperties, withProjectBuildGradle } = require("expo/config-plugins");

const KOTLIN_VERSION = "2.3.0";
const UNVERSIONED = "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')";

function withAdsKotlin(config) {
  config = withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === "property" && item.key === "android.kotlinVersion"),
    );
    cfg.modResults.push({ type: "property", key: "android.kotlinVersion", value: KOTLIN_VERSION });
    return cfg;
  });

  config = withProjectBuildGradle(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (src.includes(`kotlin-gradle-plugin:${KOTLIN_VERSION}`)) return cfg;
    // Fail loudly if the template changed: a silently skipped edit is the 2.1-compiler,
    // 2.3-stdlib build this plugin exists to prevent.
    if (!src.includes(UNVERSIONED)) {
      throw new Error("with-ads-kotlin: root build.gradle template changed; update the plugin.");
    }
    cfg.modResults.contents = src.replace(
      UNVERSIONED,
      `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}')`,
    );
    return cfg;
  });

  return config;
}

module.exports = withAdsKotlin;
