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

/**
 * The Google Search Console ownership proof for this site.
 *
 * Play Console will not accept an organisation website until Search Console says we own
 * it, and Search Console's HTML-file method fetches `https://apps.dropby.co.in/<token>.html`
 * — the **root** path of the host, not `/developer`. That is why the file is served by a
 * route handler (`app/developer/<token>.html/route.ts`) rather than dropped in `public/`:
 * the proxy rewrites every path on this host to `/developer<path>`, so a `public/` file
 * would be fetched at `/developer/<token>.html` and would not exist.
 *
 * The token is written here once because it appears in two places that have to agree —
 * the route's directory name, which *is* the URL, and the line inside the file the route
 * returns. A file whose body names a different token than its own URL fails verification
 * with no useful error message, so `check:developer` asserts the two against each other.
 * Re-verifying with a new file is then a two-line change: rename the route directory and
 * update this string.
 */
export const GOOGLE_VERIFICATION_TOKEN = "googlee4331cffdf66745d";

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
    // Must match targets.mjs verbatim — `npm run check:developer` fails otherwise, and a
    // website that publishes a name the store does not is the drift it exists to catch.
    // The name narrowed from "Bills & Catalogue" to the one job this build can do.
    name: "Shop Toolkit: GST Bills",
    bundleId: "com.brandcollabs.shoptoolkit",
    blurb: "Numbered GST bills with a UPI QR, made on the shopkeeper's own phone.",
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
    id: "swasthpath",
    name: "Swasth Path: Doctors in Indore",
    bundleId: "com.brandcollabs.swasthpath",
    blurb: "Find doctors, clinics and hospitals in Indore and call them directly.",
    platform: "Android & iOS",
  },
  {
    id: "sheharbazaar",
    name: "Indore Business Directory",
    bundleId: "com.brandcollabs.indoredirectory",
    blurb: "Local businesses across Indore, with phone numbers and directions.",
    platform: "Android & iOS",
  },
  {
    id: "gaadighar",
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
  {
    id: "gatted",
    name: "Padosi Gate: Society & Visitor",
    bundleId: "com.brandcollabs.padosigate",
    blurb: "Smart society gate pass, visitor approvals & parcel log.",
    platform: "Android & iOS",
  },
  {
    id: "dining",
    name: "Swaad Ghar: Table & Event Passes",
    bundleId: "com.brandcollabs.swaadghar",
    blurb: "Table reservations, curated food events & restaurant vouchers.",
    platform: "Android & iOS",
  },
  {
    id: "arcade",
    name: "Arcade: Retro Puzzle Suite",
    bundleId: "com.brandcollabs.arcadepuzzles",
    blurb: "Classic retro arcade games, brain puzzles and daily challenges.",
    platform: "Android & iOS",
  },
  {
    id: "sudoku",
    name: "Sudoku Daily: Classic Logic",
    bundleId: "com.brandcollabs.sudokudaily",
    blurb: "Classic nine-by-nine number puzzles from easy to expert.",
    platform: "Android & iOS",
  },
  {
    id: "math-sprint",
    name: "Math Sprint: Mental Drill",
    bundleId: "com.brandcollabs.mathsprint",
    blurb: "Thirty-second rapid mental arithmetic speed calculation drills.",
    platform: "Android & iOS",
  },
  {
    id: "crossword",
    name: "Daily Mini: Crossword Grid",
    bundleId: "com.brandcollabs.dailymini",
    blurb: "Bite-sized five-by-five daily mini crossword puzzles.",
    platform: "Android & iOS",
  },
  {
    id: "cycle-tracker",
    name: "CycleAI: Menstrual & Health Tracker",
    bundleId: "com.brandcollabs.cycletracker",
    blurb: "Track menstrual cycles, symptoms and ovulation.",
    platform: "Android & iOS",
  },
  {
    id: "money-map",
    name: "Money Map: Smart Budget & Expenses",
    bundleId: "com.brandcollabs.moneymap",
    blurb: "Daily expense tracking, income visualizer & budgets.",
    platform: "Android & iOS",
  },
  {
    id: "doctor-appointment",
    name: "Swasth Clinic: Doctor Appointments",
    bundleId: "com.brandcollabs.doctorapp",
    blurb: "Book clinic appointments and consultations near you.",
    platform: "Android & iOS",
  },
  {
    id: "highwaypass",
    name: "HighwayPass: Toll Passes & FASTag",
    bundleId: "com.brandcollabs.highwaypass",
    blurb: "Digital toll pass, fast renewals & highway trip billing.",
    platform: "Android & iOS",
  },
  {
    id: "smokefree",
    name: "SmokeFree: Quit Smoking Tracker",
    bundleId: "com.brandcollabs.smokefree",
    blurb: "Track smoke-free days, health recovery & money saved.",
    platform: "Android & iOS",
  },
  {
    id: "quick-driver",
    name: "Quick Driver: Delivery & Ride",
    bundleId: "com.brandcollabs.quickdriver",
    blurb: "Driver partner orders, routing & earnings dashboard.",
    platform: "Android & iOS",
  },
  {
    id: "gym-tracker",
    name: "Gym Tracker",
    bundleId: "com.brandcollabs.gymtracker",
    blurb: "Weekly workout plan, guided sets, rest timer & personal records.",
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
  "com.brandcollabs.arcadepuzzles",
  "com.brandcollabs.sudokudaily",
  "com.brandcollabs.mathsprint",
  "com.brandcollabs.dailymini",
  "com.brandcollabs.passportphoto",
  "com.brandcollabs.pdftools",
  "com.brandcollabs.resumebuilder",
  "com.brandcollabs.shoptoolkit",
  "com.brandcollabs.toolbox",
  "com.brandcollabs.roomredesign",
];
