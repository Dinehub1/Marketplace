/**
 * Links the AdMob mediation adapters for the networks that bid in our auction.
 *
 * AdMob stays the only host. AppLovin and InMobi are *bidding ad sources inside it*:
 * on every request AdMob collects a real-time bid from each linked adapter plus its own
 * demand, and the highest bid wins that one impression. None of that is JS — the
 * adapters are native libraries AdMob discovers at runtime, and a network whose adapter
 * is absent simply never bids. So "turn a network on" is two halves:
 *
 *   1. this plugin, which compiles the adapter into the binary;
 *   2. the AdMob console, which adds the network as a bidding source per ad unit
 *      (with its SDK key / account id). Neither half works without the other.
 *
 * ## Why the versions are pinned
 *
 * Each adapter is built against one Google Mobile Ads SDK. react-native-google-mobile-ads
 * 16.5 pins play-services-ads 25.4.0 (Android) and Google-Mobile-Ads-SDK 13.5.0 (iOS), and
 * the pinned adapters below are the newest whose own dependency matches — checked
 * 2026-09-28 against the published POMs (both declare play-services-ads 25.4.0) and
 * podspecs (both declare Google-Mobile-Ads-SDK ~> 13.3). An unpinned adapter would float
 * to whatever is newest on release day, and one that wants a newer SDK than the RN library
 * links either fails the build or, worse, upgrades the SDK under a library not tested
 * against it. Bump these together with react-native-google-mobile-ads, re-checking both.
 *
 * ## Consent
 *
 * No code: both adapters read the UMP/TCF consent the AdMob adapter already gathers
 * (AppLovin ≥ 12.0.0.0 on iOS, InMobi SDK ≥ 10.7.5, per Google's adapter guides). AppLovin
 * also disables itself when a child-directed tag is set, but it is not in Play's Families
 * self-certified program, so a child-directed app must leave it out entirely — pass
 * `networks` without it.
 */
const { withAppBuildGradle, withPodfile } = require("expo/config-plugins");

const ADAPTERS = {
  applovin: {
    android: "com.google.ads.mediation:applovin:13.6.4.2",
    ios: ["GoogleMobileAdsMediationAppLovin", "13.6.4.0"],
  },
  inmobi: {
    android: "com.google.ads.mediation:inmobi:11.4.1.2",
    ios: ["GoogleMobileAdsMediationInMobi", "11.4.1.0"],
  },
};

const MARK = "# ad-mediation adapters (plugins/with-ad-mediation.js)";

function withAdMediation(config, { networks = [] } = {}) {
  const unknown = networks.filter((n) => !ADAPTERS[n]);
  if (unknown.length) {
    throw new Error(`with-ad-mediation: no adapter known for ${unknown.join(", ")}.`);
  }
  if (networks.length === 0) return config;
  const picked = networks.map((n) => ADAPTERS[n]);

  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    const lines = picked
      .map((a) => `    implementation("${a.android}")`)
      .filter((line) => !src.includes(line));
    if (lines.length === 0) return cfg;
    // The top-level dependencies block of app/build.gradle. Fail loudly if the template
    // moved it: a skipped edit is a build where the network silently never bids.
    const anchor = /^dependencies\s*\{\s*$/m;
    if (!anchor.test(src)) {
      throw new Error("with-ad-mediation: app/build.gradle has no top-level dependencies block.");
    }
    cfg.modResults.contents = src.replace(anchor, (m) => `${m}\n${lines.join("\n")}`);
    return cfg;
  });

  config = withPodfile(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (src.includes(MARK)) return cfg;
    const anchor = /^(\s*)use_expo_modules!.*$/m;
    const match = src.match(anchor);
    if (!match) {
      throw new Error("with-ad-mediation: Podfile has no use_expo_modules! line to anchor on.");
    }
    const indent = match[1];
    const pods = picked.map((a) => `${indent}pod '${a.ios[0]}', '${a.ios[1]}'`).join("\n");
    cfg.modResults.contents = src.replace(anchor, (m) => `${m}\n${indent}${MARK}\n${pods}`);
    return cfg;
  });

  return config;
}

module.exports = withAdMediation;
module.exports.ADAPTERS = ADAPTERS;
