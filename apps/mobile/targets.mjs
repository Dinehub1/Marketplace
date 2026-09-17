/**
 * Standalone app targets — one codebase, fifteen genuinely different apps.
 *
 * Play Store rejects "Spam and Minimum Functionality" and Apple rejects guideline
 * 4.3 duplicate apps. The defence is not a different icon: it is a different
 * name, a different store description, a different first screen, a different
 * permission set and a different job to do. This file is the single source of
 * truth for those identities, and scripts/check-targets.mjs refuses a build
 * where two targets are too similar to survive review.
 *
 * Each target names the product modules it exposes from lib/products.ts.
 */
export const TARGETS = [
  // The six wellness practices are ONE app, not six listings.
  //
  // They always shared a tab bar, a Today hub, a Progress page and a Profile page; the only
  // thing that ever made them look like six apps was six names on six icons. Six bundle ids
  // of one app is exactly what Apple 4.3 ("multiple Bundle IDs of the same app") and Play's
  // repetitive-content policy reject — and that rejection lands on the *developer account*,
  // which would take the rest of the fleet down with it. Found by opening Stretch, Walk and
  // Water and getting the same shell. `check-targets.mjs` could not see it, because it
  // compares words (name, subtitle, keywords), never screens — so the decision is recorded
  // here rather than left to the gate.
  {
    id: "wellness",
    name: "Wellness: Daily Practices",
    bundleId: "co.dropby.wellness",
    tagline: "Breathe, stretch, walk, count water and beads, then wind down",
    storeCategory: "Health & Fitness",
    aso: [
      "breathing exercise",
      "desk stretches",
      "interval walk timer",
      "water tracker",
      "mala counter",
      "sleep breathing",
    ],
    color: "#0891b2",
    // No camera, no photos, no files: the only permission-free listing in the fleet, which
    // is also why it is the one that cannot fail on a network or cost us per session.
    permissions: [],
    products: [],
    firstScreen: "wellness",
  },
  {
    id: "passport-photo",
    name: "Passport Photo Maker",
    bundleId: "co.dropby.passportphoto",
    tagline: "Passport & visa photos in 30 seconds",
    storeCategory: "Photography",
    aso: ["passport photo", "visa photo", "id photo", "photo print size"],
    color: "#1d4ed8",
    permissions: ["CAMERA", "PHOTOS"],
    products: ["passport-photo"],
    firstScreen: "camera",
  },
  {
    id: "pdf-tools",
    name: "PDF Toolkit: Merge & Sign",
    bundleId: "co.dropby.pdftools",
    tagline: "Merge, split, compress, sign PDFs",
    storeCategory: "Productivity",
    aso: ["pdf merge", "pdf compress", "sign pdf", "pdf converter"],
    color: "#b91c1c",
    permissions: ["FILES"],
    products: ["pdf-tools"],
    firstScreen: "tool-grid",
  },
  {
    id: "room-redesign",
    name: "Room Redesign: AI Interior",
    bundleId: "co.dropby.roomredesign",
    tagline: "See your room in five new styles",
    storeCategory: "Lifestyle",
    aso: ["interior design", "room design", "home decor ideas"],
    color: "#7c3aed",
    permissions: ["CAMERA", "PHOTOS"],
    products: ["room-redesign"],
    firstScreen: "camera",
  },
  {
    id: "subtitles-voice",
    name: "Subtitles & Voice-over",
    bundleId: "co.dropby.subtitlesvoice",
    tagline: "Captions for video, voice from text",
    storeCategory: "Video Players & Editors",
    aso: ["subtitles", "captions", "text to speech", "srt"],
    color: "#0f766e",
    permissions: ["FILES", "MICROPHONE"],
    products: ["subtitles", "voiceover"],
    firstScreen: "chooser",
  },
  {
    id: "resume-builder",
    name: "Resume Builder & ATS Check",
    bundleId: "co.dropby.resumebuilder",
    tagline: "Build a resume that passes screening",
    storeCategory: "Business",
    aso: ["resume maker", "cv maker", "ats resume", "bio data"],
    color: "#0369a1",
    permissions: ["FILES"],
    products: ["resume-builder", "resume-checker", "application-writer"],
    firstScreen: "form",
  },
  {
    id: "shop-toolkit",
    name: "Shop Toolkit: Bills & Catalogue",
    bundleId: "co.dropby.shoptoolkit",
    tagline: "Invoices, catalogue and orders for your shop",
    storeCategory: "Business",
    aso: ["invoice maker", "gst bill", "catalogue maker", "udyam"],
    color: "#166534",
    permissions: ["CAMERA", "FILES", "CONTACTS"],
    products: ["invoice-maker", "catalogue", "order-loop", "digital-card", "booking-page", "bill-tracker", "fee-tracker"],
    firstScreen: "dashboard",
  },
  {
    id: "toolbox",
    name: "Everyday Tools & Photo Fix",
    bundleId: "co.dropby.toolbox",
    tagline: "Photos, documents and small jobs in one app",
    storeCategory: "Tools",
    aso: ["background remover", "photo editor", "id photo", "tools"],
    color: "#475569",
    permissions: ["CAMERA", "PHOTOS"],
    // exif-strip, photos-to-pdf and collage are listed here because they are part of
    // this app's own grid — scripts/app-map.mjs already claims them for `toolbox`, and
    // its comment says so ("the toolbox grew three jobs … whose screens are part of that
    // app's grid"). They were missing from this array, which is why the grid and the
    // manifest disagreed about what the toolbox contains.
    //
    // passport-photo, pdf-tools and invoice-maker are deliberately NOT here: each has
    // its own target, and an app that offers a product it does not lead with is the
    // "two listings are one app" signal the gate exists to catch.
    products: ["bg-remove", "signature-maker", "exif-strip", "photos-to-pdf", "collage", "ai-image", "card-maker", "photo-repair", "product-photo", "worksheet-maker", "translate-doc", "study-helper", "cover-maker", "marksheet-maker", "notes-from-audio"],
    firstScreen: "grid",
  },
  {
    id: "sarkarhealth",
    name: "SarkarHealth: Doctors in Indore",
    bundleId: "co.dropby.sarkarhealth",
    tagline: "Find and call doctors and clinics in Indore",
    storeCategory: "Medical",
    aso: ["doctors in indore", "clinic", "hospital", "chemist"],
    color: "#0e7490",
    permissions: ["LOCATION"],
    products: [],
    directory: "sarkarhealth",
    // No `scope` here. Which categories this app may show is NOT retyped per target:
    // it is read at runtime from the shared ownership table in `@hermes/core`
    // (`scopeForBrand`, see lib/target.ts). That table is the same one the brand
    // websites use to decide who publishes /<category>-in-indore, so the app and the
    // site cannot disagree about who owns a category. It is also what keeps the three
    // directory apps from opening the same 24,048-row feed — three listings that are
    // one app, which is what `check-targets.mjs` exists to catch.
    firstScreen: "directory",
  },
  {
    id: "sarkarmarketplace",
    name: "Indore Business Directory",
    bundleId: "co.dropby.indoredirectory",
    tagline: "Every local business in Indore, with phone numbers",
    storeCategory: "Business",
    aso: ["indore business", "local directory", "shops near me"],
    color: "#a16207",
    permissions: ["LOCATION"],
    products: [],
    directory: "sarkarmarketplace",
    firstScreen: "directory",
  },
  {
    id: "sarkarcars",
    name: "Car Service & Dealers Indore",
    bundleId: "co.dropby.carsindore",
    tagline: "Car dealers, garages, denting and cleaning",
    storeCategory: "Auto & Vehicles",
    aso: ["car service indore", "car dealer", "denting painting"],
    color: "#9a3412",
    permissions: ["LOCATION"],
    products: [],
    directory: "sarkarcars",
    // Scope comes from the shared ownership table in `@hermes/core`, not from here —
    // see the note on sarkarhealth above. The table is deliberately tight for this
    // brand (bare "dealer", "showroom" and "garage" stay unowned, because a parking
    // garage is not a car service), and that decision now governs the app and the
    // website alike instead of being written twice with two different answers.
    firstScreen: "directory",
  },
  {
    id: "tap-sprint",
    name: "Tap Sprint: Reflex Game",
    bundleId: "co.dropby.tapsprint",
    tagline: "Thirty seconds, how fast are you?",
    storeCategory: "Games",
    aso: ["reflex game", "tap game", "reaction test", "offline games"],
    color: "#db2777",
    permissions: [],
    products: [],
    game: "tap-sprint",
    firstScreen: "game",
    ads: { rewarded: "extra lives", interstitial: "between rounds" },
  },
  {
    id: "word-duel",
    name: "Word Duel: Word Puzzle",
    bundleId: "co.dropby.wordduel",
    tagline: "Sixty seconds of word making",
    storeCategory: "Games",
    aso: ["word game", "word puzzle", "offline word games"],
    color: "#4f46e5",
    permissions: [],
    products: [],
    game: "word-duel",
    firstScreen: "game",
    ads: { rewarded: "hint pack", interstitial: "between rounds" },
  },
  {
    id: "block-clear",
    name: "Block Clear: Puzzle",
    bundleId: "co.dropby.blockclear",
    tagline: "Fit the blocks, clear the lines",
    storeCategory: "Games",
    aso: ["block puzzle", "block game", "offline puzzle", "brain puzzle"],
    color: "#0d9488",
    permissions: [],
    products: [],
    // The third game, and the first one with no clock in it. Tap Sprint measures a
    // reaction and Word Duel measures vocabulary, both against thirty or sixty
    // seconds; this one is untimed, so it is the fleet's only game you can put down
    // mid-round. That difference is the listing, not a colour.
    game: "block-clear",
    firstScreen: "game",
    ads: { rewarded: "fresh tray", interstitial: "between rounds" },
  },
  {
    id: "merge-tiles",
    name: "Merge: Number Tiles",
    bundleId: "co.dropby.mergetiles",
    tagline: "Slide the tiles, double the numbers",
    storeCategory: "Games",
    aso: ["number merge", "merge puzzle", "math puzzle", "tile puzzle"],
    color: "#ea580c",
    permissions: [],
    products: [],
    // The fourth game, and the first one about numbers. Tap Sprint measures a reaction,
    // Word Duel measures vocabulary and Block Clear asks you to fit shapes; this one is
    // arithmetic — two tiles with the same number become one tile worth double. It shares
    // Block Clear's lack of a clock and nothing else: there is no tray, no line to fill,
    // and every move changes all sixteen squares rather than four.
    game: "merge-tiles",
    firstScreen: "game",
    ads: { rewarded: "undo the last move", interstitial: "between rounds" },
  },
];

export const byId = (id) => TARGETS.find((t) => t.id === id);
export const productTargets = () => TARGETS.filter((t) => t.products.length);
export const directoryTargets = () => TARGETS.filter((t) => t.directory);
export const gameTargets = () => TARGETS.filter((t) => t.game);

/**
 * Where each target opens — the route the app boots into.
 *
 * `firstScreen` above is the *kind* of screen a store listing promises, and is what the
 * screenshot harness groups by. This is the actual route. They are separate because
 * several targets share one kind (`camera`, `directory`) while opening different
 * screens, and because four targets have no screen built yet.
 *
 * `null` is the honest answer for those four. The entry route renders a "not built yet"
 * screen naming the target rather than opening the marketplace and calling it Room
 * Redesign — an app whose first screen is a different product is the fastest way to an
 * Apple 4.3 rejection, and it is also just a lie to the person who installed it.
 */
export const FIRST_ROUTE = {
  // Wellness: one app, six practices. It opens on the Today hub, which lists all six —
  // the screen that shows a first-time user what the app is for.
  wellness: "/habits",

  // Product apps, by the one screen each leads with.
  "passport-photo": "/passport",
  "pdf-tools": "/tools/pdf",
  toolbox: "/tools",
  "room-redesign": null, // screen not built
  "subtitles-voice": null, // screen not built
  "resume-builder": null, // screen not built
  "shop-toolkit": null, // dashboard not built

  // Directory apps share the listing feed; the brand row scopes what it lists.
  sarkarhealth: "/browse",
  sarkarmarketplace: "/browse",
  sarkarcars: "/browse",

  // Games: the whole app is the game.
  "tap-sprint": "/tap-sprint",
  "word-duel": "/word-duel",
  "block-clear": "/block-clear",
  "merge-tiles": "/merge-tiles",
};

/** The route a target opens on, or null when that screen is not built yet. */
export const firstRouteFor = (target) =>
  target && Object.prototype.hasOwnProperty.call(FIRST_ROUTE, target.id)
    ? FIRST_ROUTE[target.id]
    : null;

/**
 * The shell a target runs in — which part of the app it is allowed to be.
 * A directory app is the marketplace; every other target is a single-purpose app that
 * happens to share this codebase.
 */
export const familyOf = (target) => {
  if (!target) return "product";
  if (target.directory) return "directory";
  if (target.game) return "game";
  if (target.products.length) return "product";
  return "wellness";
};
