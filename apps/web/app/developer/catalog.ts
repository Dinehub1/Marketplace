/**
 * The published app catalogue, as a developer website must present it.
 *
 * This file exists because of one hard requirement and one hazard.
 *
 * **The requirement:** Google Play asks for an "organisation website" during signup,
 * and AdMob crawls the *same* domain for `app-ads.txt` and your privacy policy. So this
 * site is not decoration — it is the address every one of our apps points at, and it
 * has to be truthful about who publishes them and what they collect.
 *
 * **The hazard:** a hand-typed list of fifteen apps drifts. Someone renames a listing,
 * adds a bundle id, or ships app sixteen, and the website quietly keeps advertising the
 * old set — which is exactly the kind of inconsistency a store reviewer notices and a
 * `check:developer` run catches. The list below is therefore asserted against
 * `apps/mobile/targets.mjs`, the single source of truth for every listing's name and
 * bundle id, so drift fails a gate instead of shipping.
 *
 * Only `order` and `blurb` are ours; name and bundle id are copied from `targets.mjs`
 * and verified.
 */

export type DeveloperApp = {
  /** Must equal the target id in apps/mobile/targets.mjs. */
  id: string;
  /** Must equal the target name in apps/mobile/targets.mjs, verbatim. */
  name: string;
  /** Must equal the target bundleId in apps/mobile/targets.mjs. */
  bundleId: string;
  /** One line for the site; the target's tagline, or a plainer rewrite of it. */
  blurb: string;
  platform: "Android & iOS";
};

/** The publisher name shown on the site, in the store, and in AdMob. */
export const PUBLISHER = {
  name: "BrandCollabs",
  /**
   * Where a policy, privacy or abuse question goes.
   *
   * On the domain rather than a Gmail address, for three reasons that all point the
   * same way: Play Console requires the account's contact address to match the
   * organisation's website domain, AdMob reviewers treat a domain contact as a real
   * business, and a user exercising a privacy right should not have to trust a
   * personal mailbox. It forwards to a monitored inbox (Cloudflare Email Routing),
   * so this is reachable — which is the only thing that makes a policy contact real.
   */
  contactEmail: "support@dropby.co.in",
  /** The jurisdiction the policy is written under. */
  jurisdiction: "Indore, Madhya Pradesh, India",
  /** Canonical origin for this developer site. */
  site: "https://apps.dropby.co.in",
} as const;

export const APPS: DeveloperApp[] = [
  {
    id: "wellness",
    name: "Wellness: Daily Practices",
    bundleId: "com.brandcollabs.wellness",
    blurb: "Breathe, stretch, walk, track water, count a mala, then wind down to sleep.",
    platform: "Android & iOS",
  },
  {
    id: "passport-photo",
    name: "Passport Photo Maker",
    bundleId: "com.brandcollabs.passportphoto",
    blurb: "Passport and visa photos at the right size for the form, in under a minute.",
    platform: "Android & iOS",
  },
  {
    id: "pdf-tools",
    name: "PDF Toolkit: Merge & Sign",
    bundleId: "com.brandcollabs.pdftools",
    blurb: "Merge, split, compress and sign PDF files without uploading them anywhere.",
    platform: "Android & iOS",
  },
  {
    id: "room-redesign",
    name: "Room Redesign: AI Interior",
    bundleId: "com.brandcollabs.roomredesign",
    blurb: "See a room restyled in different interior looks from a single photo.",
    platform: "Android & iOS",
  },
  {
    id: "subtitles-voice",
    name: "Subtitles & Voice-over",
    bundleId: "com.brandcollabs.subtitlesvoice",
    blurb: "Captions for a video, and a spoken voice-over from typed text.",
    platform: "Android & iOS",
  },
  {
    id: "resume-builder",
    name: "Resume Builder & ATS Check",
    bundleId: "com.brandcollabs.resumebuilder",
    blurb: "Build a one-page resume and check it against applicant-tracking rules.",
    platform: "Android & iOS",
  },
  {
    id: "shop-toolkit",
    name: "Shop Toolkit: Bills & Catalogue",
    bundleId: "com.brandcollabs.shoptoolkit",
    blurb: "GST bills, a product catalogue and order tracking for a small shop.",
    platform: "Android & iOS",
  },
  {
    id: "toolbox",
    name: "Everyday Tools & Photo Fix",
    bundleId: "com.brandcollabs.toolbox",
    blurb: "Photo cleanup, document fixes and small everyday jobs in one app.",
    platform: "Android & iOS",
  },
  {
    id: "sarkarhealth",
    name: "SarkarHealth: Doctors in Indore",
    bundleId: "com.brandcollabs.sarkarhealth",
    blurb: "Find doctors, clinics and hospitals in Indore and call them directly.",
    platform: "Android & iOS",
  },
  {
    id: "sarkarmarketplace",
    name: "Indore Business Directory",
    bundleId: "com.brandcollabs.indoredirectory",
    blurb: "Local businesses across Indore, with phone numbers and directions.",
    platform: "Android & iOS",
  },
  {
    id: "sarkarcars",
    name: "Car Service & Dealers Indore",
    bundleId: "com.brandcollabs.carsindore",
    blurb: "Car dealers, garages, denting and cleaning services in Indore.",
    platform: "Android & iOS",
  },
  {
    id: "tap-sprint",
    name: "Tap Sprint: Reflex Game",
    bundleId: "com.brandcollabs.tapsprint",
    blurb: "Thirty seconds against the clock — how fast are your reflexes?",
    platform: "Android & iOS",
  },
  {
    id: "word-duel",
    name: "Word Duel: Word Puzzle",
    bundleId: "com.brandcollabs.wordduel",
    blurb: "Sixty seconds of word making from a grid of letters.",
    platform: "Android & iOS",
  },
  {
    id: "block-clear",
    name: "Block Clear: Puzzle",
    bundleId: "com.brandcollabs.blockclear",
    blurb: "Fit the blocks, clear the lines — an untimed puzzle you can put down.",
    platform: "Android & iOS",
  },
  {
    id: "merge-tiles",
    name: "Merge: Number Tiles",
    bundleId: "com.brandcollabs.mergetiles",
    blurb: "Slide the tiles and double the numbers until the board is full.",
    platform: "Android & iOS",
  },
];

/**
 * App-ads.txt seller lines.
 *
 * `app-ads.txt` is how an ad exchange confirms that *this* developer is authorised to
 * sell *that* app's inventory. It is a precondition, not an optimisation: AdMob has
 * required verification of new apps since January 2025, and an app that fails it does
 * not fully serve ads. The file must live at the root of the developer website named in
 * the store listing — which is why this site exists at `apps.dropby.co.in`.
 *
 * Filled from `ADMOB_PUBLISHER_ID` once the AdMob account exists. An empty list emits a
 * comment-only file, which is the honest state before there is an account: a placeholder
 * publisher id would be a *claim* about who may sell this inventory, and a wrong one is
 * worse than none.
 */
export function appAdsTxtLines(): string[] {
  const publisherId = (process.env.ADMOB_PUBLISHER_ID ?? "").trim();
  if (!publisherId) return [];
  // google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
  return [`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`];
}

/** The ad networks whose SDKs the apps embed, for the privacy policy. Kept explicit. */
export const AD_SDKS = [
  {
    name: "Google AdMob",
    purpose: "Rewarded and interstitial advertising",
    policy: "https://policies.google.com/technologies/ads",
  },
] as const;

/**
 * Apps that embed an advertising SDK, by bundle id.
 *
 * Derived from `apps/mobile/targets.mjs`: a target declares `ads` when it shows any ad,
 * and those are exactly the apps a four-game fleet plus the paywalled product tools
 * covers. Hand-typing this list is how a privacy policy ends up naming an app that has
 * no ads (or, far worse, omitting one that does), so `check:developer` asserts this set
 * matches the declared `ads` targets exactly.
 */
export const APPS_WITH_ADS: string[] = [
  "com.brandcollabs.tapsprint",
  "com.brandcollabs.wordduel",
  "com.brandcollabs.blockclear",
  "com.brandcollabs.mergetiles",
  "com.brandcollabs.passportphoto",
  "com.brandcollabs.pdftools",
  "com.brandcollabs.resumebuilder",
  "com.brandcollabs.shoptoolkit",
  "com.brandcollabs.toolbox",
  "com.brandcollabs.roomredesign",
];
