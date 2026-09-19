/**
 * The AdMob adapter, for the web build.
 *
 * `adapters/admob.ts` require()s `react-native-google-mobile-ads` inside `init()` so a
 * build without the native module degrades instead of crashing. That is right at
 * *runtime* and wrong at *bundle* time: Metro puts the require in the dependency graph
 * regardless of the try/catch, so on the web platform the native package's own
 * `codegenNativeComponent` import fails the export —
 *
 *   Importing native-only module
 *   "react-native/Libraries/Utilities/codegenNativeComponent" on web from
 *   node_modules\react-native-google-mobile-ads\lib\module\specs\components\…ts
 *   … apps\mobile\lib\ads\adapters\admob.ts | import "react-native-google-mobile-ads"
 *
 * — measured 2026-09-20, which is how this file came to exist: `expo export
 * --platform web` answered exit 1 and wrote nothing, so the served preview
 * (`expo.dropby.co.in`, `apps/mobile/dist`) could not be rebuilt at all.
 *
 * Metro resolves `admob.web.ts` before `admob.ts` on the web platform, so this is a
 * new file rather than a change to the adapter: iOS and Android keep the real SDK
 * path untouched, and the web bundle never contains it.
 *
 * What it says when it is asked for an ad: nothing can be served, and it says *that*
 * rather than pretending. There is no AdMob SDK for the web, so `supports()` is false
 * for every format and the facade's own guard answers `sdk_unavailable` — the same
 * reason and the same event a native build with no AdMob account gives. A placeholder
 * with a measured reason is the honest state of the web build; an ad that "might
 * load" is not, and a web export exists to be looked at and screenshotted, not to
 * earn.
 */
import type {
  AdFormat,
  AdNetworkAdapter,
  AdOutcome,
  ImpressionRevenue,
  NetworkId,
  PlacementId,
} from "../types";

export const admobAdapter: AdNetworkAdapter = {
  id: "admob",

  /** No web SDK exists, so there is no format this build can serve. */
  supports(format: AdFormat): boolean {
    void format;
    return false;
  },

  /** Nothing to load. False, not an error: the build is complete, the SDK is absent. */
  async init(): Promise<boolean> {
    return false;
  },

  async preload(format: AdFormat, placement: PlacementId): Promise<void> {
    void format;
    void placement;
  },

  isReady(format: AdFormat, placement: PlacementId): boolean {
    void format;
    void placement;
    return false;
  },

  async show(format: AdFormat, placement: PlacementId): Promise<AdOutcome> {
    return {
      kind: "failed",
      network: "admob",
      placement,
      format,
      code: "sdk_unavailable",
      message: "There is no AdMob SDK for the web — this build cannot show an ad.",
    };
  },

  /** Nothing can serve an impression here, so nothing can report revenue. */
  onImpressionRevenue(cb: (e: ImpressionRevenue) => void): () => void {
    void cb;
    return () => {};
  },
};

/** Re-exported so the Networks screen can name the host without importing the SDK. */
export const HOST: NetworkId = "admob";
