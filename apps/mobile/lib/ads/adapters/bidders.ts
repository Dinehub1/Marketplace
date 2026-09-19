/**
 * Bidder adapters: InMobi and AppLovin MAX.
 *
 * Both are **bidding ad sources inside AdMob mediation**, so neither is a second
 * mediation host and neither gets its own `show()` path. That is a deliberate
 * consequence of the research: two hosts competing for one impression lowers fill,
 * and a client-side router that picks a winner is both against policy and worse at
 * it than the auction already is.
 *
 * So what is an adapter for, if it never shows an ad? Three things, and they are
 * real:
 *
 *   1. **A name the analytics may use.** When InMobi wins an impression inside the
 *      AdMob auction, the winning source is reported by the host; the counts and
 *      eCPM for it belong in `ad_events` under this id.
 *   2. **A place for the eligibility rules.** `deferred_reason` in the Networks
 *      screen — AppLovin cannot be used in a child-directed app, InMobi needs a GST
 *      invoice — is a property of the network, and it lives with the network.
 *   3. **A switch that is one line.** Enabling a bidder is turning it on in remote
 *      config once its account and adapter exist; no screen changes.
 *
 * Until those accounts exist, `available` is false and the facade refuses with
 * `sdk_unavailable` rather than silently pretending a network is in the auction.
 */
import type { AdFormat, AdNetworkAdapter, AdOutcome, NetworkId, PlacementId } from "../types";
import { SOURCE_FORMATS } from "../config";

/** Why a bidder is not in the auction yet, or ever. Mirrors the Networks screen. */
export type SourceStatus = {
  id: NetworkId;
  label: string;
  /** True once the account exists and the adapter is linked in the mediation console. */
  available: boolean;
  /** Human-readable reason while `available` is false. */
  deferredReason: string | null;
  /** Per-app policy exclusions that are not negotiable. */
  exclusions: string[];
};

export const BIDDERS: SourceStatus[] = [
  {
    id: "inmobi",
    label: "InMobi",
    available: false,
    deferredReason: "Account not opened yet — needs a live app and a GST invoice for India payouts",
    exclusions: [],
  },
  {
    id: "applovin",
    label: "AppLovin MAX",
    available: false,
    deferredReason: "Account not opened yet — joins as a bidding source inside AdMob mediation",
    exclusions: [
      "Must be excluded from any child-directed or Families app: AppLovin left Play's Self-Certified Ads SDK programme",
    ],
  },
];

/**
 * Build the adapter for a network that bids through the host.
 *
 * It never serves an ad itself, so `show` always fails with a reason rather than
 * quietly doing nothing — a silent no-op here would look exactly like a fill
 * problem in the logs, which is the one thing this project cannot afford.
 */
function bidderAdapter(status: SourceStatus): AdNetworkAdapter {
  const { id, label, available, deferredReason } = status;
  return {
    id,
    supports: (format: AdFormat) => available && SOURCE_FORMATS[id].includes(format),
    async init() {
      return available;
    },
    async preload(format: AdFormat, placement: PlacementId) {
      void format;
      void placement;
    },
    isReady() {
      return false;
    },
    async show(format: AdFormat, placement: PlacementId): Promise<AdOutcome> {
      return {
        kind: "failed",
        network: id,
        placement,
        format,
        code: "not_a_host",
        message: `${label} bids inside AdMob mediation and is not shown directly (${deferredReason ?? "unavailable"})`,
      };
    },
    onImpressionRevenue() {
      // Revenue for these networks arrives through the host's impression-level
      // callback, tagged with the winning source. A second subscription here would
      // double-count the same impression.
      return () => {};
    },
  };
}

export const BIDDER_ADAPTERS: AdNetworkAdapter[] = BIDDERS.map(bidderAdapter);
