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
    bundleId: "com.brandcollabs.wellness",
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
    bundleId: "com.brandcollabs.passportphoto",
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
    bundleId: "com.brandcollabs.pdftools",
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
    bundleId: "com.brandcollabs.roomredesign",
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
    bundleId: "com.brandcollabs.subtitlesvoice",
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
    bundleId: "com.brandcollabs.resumebuilder",
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
    // The listing claims the one job this build can actually do.
    //
    // It was "Shop Toolkit: Bills & Catalogue", and the catalogue does not exist: six of
    // this target's seven products are `route: null`. A store name that promises a
    // catalogue is a promise the binary cannot keep, and `check-fleet` printing "1/7"
    // was the only place that gap was visible. The six stay in `products` — the app names
    // them and labels them COMING SOON on its own front door, which is honesty, not
    // advertising — but the *listing* narrows to the GST bill. That is the rule
    // `status-and-next-plan.md` states: narrow the name and screenshots to what exists,
    // or build the jobs, before this one goes to a store.
    name: "Shop Toolkit: GST Bills",
    bundleId: "com.brandcollabs.shoptoolkit",
    tagline: "Numbered GST bills with a UPI QR, made on your phone",
    storeCategory: "Business",
    // Every keyword describes a job the invoice product actually runs. "catalogue maker"
    // and "udyam" went with the catalogue: a keyword is how the store finds the app, so a
    // keyword for something it cannot do buys an install that uninstalls.
    aso: ["invoice maker", "gst bill", "bill book", "upi qr invoice", "shop bill"],
    color: "#166534",
    permissions: ["CAMERA", "FILES", "CONTACTS"],
    products: ["invoice-maker", "catalogue", "order-loop", "digital-card", "booking-page", "bill-tracker", "fee-tracker"],
    firstScreen: "dashboard",
  },
  {
    id: "toolbox",
    name: "Everyday Tools & Photo Fix",
    bundleId: "com.brandcollabs.toolbox",
    tagline: "Photos, documents and small jobs in one app",
    storeCategory: "Tools",
    // "id photo" was here and it is not this app's job: passport-photo has its own target
    // and its own listing, and a keyword for someone else's job buys the wrong install.
    // Every keyword below names a product in this target that has a screen — the six that
    // are built. The nine `route: null` products stay in the grid as COMING SOON and are
    // deliberately not advertised here.
    aso: ["background remover", "photos to pdf", "photo collage", "signature maker", "remove background"],
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
    id: "swasthpath",
    name: "Swasth Path: Doctors in Indore",
    bundleId: "com.brandcollabs.swasthpath",
    tagline: "Find and call doctors and clinics in Indore",
    storeCategory: "Medical",
    aso: ["doctors in indore", "clinic", "hospital", "chemist"],
    color: "#0e7490",
    permissions: ["LOCATION"],
    products: [],
    directory: "swasthpath",
    // No `scope` here. Which categories this app may show is NOT retyped per target:
    // it is read at runtime from the shared ownership table in `@brandcollabs/core`
    // (`scopeForBrand`, see lib/target.ts). That table is the same one the brand
    // websites use to decide who publishes /<category>-in-indore, so the app and the
    // site cannot disagree about who owns a category. It is also what keeps the three
    // directory apps from opening the same 24,048-row feed — three listings that are
    // one app, which is what `check-targets.mjs` exists to catch.
    firstScreen: "directory",
  },
  {
    id: "sheharbazaar",
    name: "Indore Business Directory",
    bundleId: "com.brandcollabs.indoredirectory",
    tagline: "Every local business in Indore, with phone numbers",
    storeCategory: "Business",
    aso: ["indore business", "local directory", "shops near me"],
    color: "#a16207",
    permissions: ["LOCATION"],
    products: [],
    directory: "sheharbazaar",
    firstScreen: "directory",
  },
  {
    id: "gaadighar",
    name: "Car Service & Dealers Indore",
    bundleId: "com.brandcollabs.carsindore",
    tagline: "Car dealers, garages, denting and cleaning",
    storeCategory: "Auto & Vehicles",
    aso: ["car service indore", "car dealer", "denting painting"],
    color: "#9a3412",
    permissions: ["LOCATION"],
    products: [],
    directory: "gaadighar",
    // Scope comes from the shared ownership table in `@brandcollabs/core`, not from here —
    // see the note on swasthpath above. The table is deliberately tight for this
    // brand (bare "dealer", "showroom" and "garage" stay unowned, because a parking
    // garage is not a car service), and that decision now governs the app and the
    // website alike instead of being written twice with two different answers.
    firstScreen: "directory",
  },
  {
    id: "tap-sprint",
    name: "Tap Sprint: Reflex Game",
    bundleId: "com.brandcollabs.tapsprint",
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
    bundleId: "com.brandcollabs.wordduel",
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
    bundleId: "com.brandcollabs.blockclear",
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
    bundleId: "com.brandcollabs.mergetiles",
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
  {
    id: "arcade",
    name: "Arcade: Retro Puzzle Suite",
    bundleId: "com.brandcollabs.arcadepuzzles",
    tagline: "Classic retro arcade games, brain puzzles and daily challenges",
    storeCategory: "Games",
    aso: ["retro arcade", "classic games", "puzzle collection", "offline arcade", "mini games"],
    color: "#2563eb",
    permissions: [],
    products: [],
    game: "arcade",
    firstScreen: "game",
    ads: { rewarded: "extra lives", interstitial: "between games" },
  },
  {
    id: "sudoku",
    name: "Sudoku Daily: Classic Logic",
    bundleId: "com.brandcollabs.sudokudaily",
    tagline: "Classic nine-by-nine number puzzles from easy to expert",
    storeCategory: "Games",
    aso: ["sudoku puzzle", "classic sudoku", "logic puzzle", "number grid", "offline sudoku"],
    color: "#1d4ed8",
    permissions: [],
    products: [],
    game: "sudoku",
    firstScreen: "game",
    ads: { rewarded: "reveal cell hint", interstitial: "between puzzles" },
  },
  {
    id: "math-sprint",
    name: "Math Sprint: Mental Drill",
    bundleId: "com.brandcollabs.mathsprint",
    tagline: "Thirty-second rapid mental arithmetic speed calculation drills",
    storeCategory: "Games",
    aso: ["math drill", "mental math", "speed calculation", "arithmetic trainer", "math game"],
    color: "#7c3aed",
    permissions: [],
    products: [],
    game: "math-sprint",
    firstScreen: "game",
    ads: { rewarded: "extra thirty seconds", interstitial: "between sprints" },
  },
  {
    id: "crossword",
    name: "Daily Mini: Crossword Grid",
    bundleId: "com.brandcollabs.dailymini",
    tagline: "Bite-sized five-by-five daily mini crossword puzzles",
    storeCategory: "Games",
    aso: ["mini crossword", "crossword puzzle", "daily word game", "clue grid", "quick puzzle"],
    color: "#059669",
    permissions: [],
    products: [],
    game: "crossword",
    firstScreen: "game",
    ads: { rewarded: "reveal letter hint", interstitial: "between puzzles" },
  },
  {
    id: "gatted",
    name: "Padosi Gate: Society & Visitor",
    bundleId: "com.brandcollabs.padosigate",
    tagline: "Smart society gate pass, visitor approvals & parcel log",
    storeCategory: "Lifestyle",
    aso: ["society gate", "visitor approval", "apartment guard", "society pass"],
    color: "#4f46e5",
    permissions: ["CAMERA"],
    products: [],
    family: "gatted",
    firstScreen: "dashboard",
  },
  {
    id: "dining",
    name: "Swaad Ghar: Table & Event Passes",
    bundleId: "com.brandcollabs.swaadghar",
    tagline: "Table reservations, curated food events & restaurant vouchers",
    storeCategory: "Food & Drink",
    aso: ["table reservation", "dining passes", "restaurant menu", "event tickets"],
    color: "#ea580c",
    permissions: [],
    products: [],
    family: "dining",
    firstScreen: "directory",
  },
  {
    id: "cycle-tracker",
    name: "CycleAI: Menstrual & Health Tracker",
    bundleId: "com.brandcollabs.cycletracker",
    tagline: "Track menstrual cycles, symptoms and ovulation",
    storeCategory: "Health & Fitness",
    aso: ["cycle tracker", "period tracker", "ovulation calendar", "menstrual health"],
    color: "#5e19e6",
    permissions: [],
    products: [],
    family: "cycle-tracker",
    firstScreen: "calendar",
  },
  {
    id: "money-map",
    name: "Money Map: Smart Budget & Expenses",
    bundleId: "com.brandcollabs.moneymap",
    tagline: "Daily expense tracking, income visualizer & budgets",
    storeCategory: "Finance",
    aso: ["expense tracker", "budget planner", "money manager", "spending tracker"],
    color: "#059669",
    permissions: [],
    products: [],
    family: "money-map",
    firstScreen: "dashboard",
  },
  {
    id: "doctor-appointment",
    name: "Swasth Clinic: Doctor Appointments",
    bundleId: "com.brandcollabs.doctorapp",
    tagline: "Book clinic appointments and consultations near you",
    storeCategory: "Medical",
    aso: ["doctor appointment", "clinic booking", "consultation", "find doctor"],
    color: "#0284c7",
    permissions: ["LOCATION"],
    products: [],
    family: "doctor-appointment",
    firstScreen: "directory",
  },
  {
    id: "highwaypass",
    name: "HighwayPass: Toll Passes & FASTag",
    bundleId: "com.brandcollabs.highwaypass",
    tagline: "Digital toll pass, fast renewals & highway trip billing",
    storeCategory: "Travel & Local",
    aso: ["toll pass", "fastag pass", "highway pass", "toll plaza"],
    color: "#2563eb",
    permissions: [],
    products: [],
    family: "highwaypass",
    firstScreen: "dashboard",
  },
  {
    id: "smokefree",
    name: "SmokeFree: Quit Smoking Tracker",
    bundleId: "com.brandcollabs.smokefree",
    tagline: "Track smoke-free days, health recovery & money saved",
    storeCategory: "Health & Fitness",
    aso: ["quit smoking", "smoke free", "craving tracker", "cessation counter"],
    color: "#10b981",
    permissions: [],
    products: [],
    family: "smokefree",
    firstScreen: "dashboard",
  },
  {
    id: "quick-driver",
    name: "Quick Driver: Delivery & Ride",
    bundleId: "com.brandcollabs.quickdriver",
    tagline: "Driver partner orders, routing & earnings dashboard",
    storeCategory: "Business",
    aso: ["driver app", "delivery partner", "cab driver", "quick driver"],
    color: "#0284c7",
    permissions: ["LOCATION", "CAMERA"],
    products: [],
    family: "quick-driver",
    firstScreen: "dashboard",
  },
  {
    id: "gym-tracker",
    name: "Gym Tracker",
    bundleId: "com.brandcollabs.gymtracker",
    tagline: "Weekly workout plan, guided sets, rest timer & PRs",
    storeCategory: "Health & Fitness",
    aso: ["gym tracker", "workout log", "weight lifting", "strength training"],
    color: "#65a30d",
    permissions: [],
    products: [],
    family: "gym-tracker",
    firstScreen: "dashboard",
  },
];

export const byId = (id) => TARGETS.find((t) => t.id === id);
export const productTargets = () => TARGETS.filter((t) => t.products.length);
export const directoryTargets = () => TARGETS.filter((t) => t.directory);
export const gameTargets = () => TARGETS.filter((t) => t.game);

/**
 * Standalone app workspaces: their source code lives in apps/<id>, NOT in apps/mobile.
 * targets.mjs serves as their fleet/store manifest.
 */
export const STANDALONE_APPS = [
  "dining",
  "gatted",
  "cycle-tracker",
  "money-map",
  "doctor-appointment",
  "highwaypass",
  "smokefree",
  "quick-driver",
  "gym-tracker",
];
export const isStandalone = (target) =>
  STANDALONE_APPS.includes(typeof target === "string" ? target : target?.id);

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
  "room-redesign": "/tools/room-redesign",
  "subtitles-voice": "/subtitles",
  "resume-builder": "/tools/resume-builder",
  "shop-toolkit": "/shop",

  // Directory apps share the listing feed; the brand row scopes what it lists.
  swasthpath: "/browse",
  sheharbazaar: "/browse",
  gaadighar: "/browse",

  // Games: the whole app is the game.
  "tap-sprint": "/tap-sprint",
  "word-duel": "/word-duel",
  "block-clear": "/block-clear",
  "merge-tiles": "/merge-tiles",
  arcade: "/games",
  sudoku: "/sudoku",
  "math-sprint": "/math-sprint",
  crossword: "/crossword",

  // Standalone workspaces (boot from apps/<id>, not in apps/mobile)
  gatted: null,
  dining: null,
  "cycle-tracker": null,
  "money-map": null,
  "doctor-appointment": null,
  highwaypass: null,
  smokefree: null,
  "quick-driver": null,
  "gym-tracker": null,
};

/**
 * The EAS project each store app builds under — one per target.
 *
 * EAS ties a project to one slug, and every target has its own slug, so fifteen apps are
 * fifteen EAS projects. This used to be one `EAS_PROJECT_ID` environment variable for the
 * whole fleet, which can only ever be right for one app and silently wrong for the rest.
 *
 * All fifteen live under the `brandcollabs` Expo account (`owner` in app.config.ts), each
 * named by the target's slug — `@brandcollabs/<slug>`. A project id only works together with
 * that owner and slug, so change none of the three alone.
 *
 * A new target starts as `null` (the project does not exist yet). Create it with
 *   APP_TARGET=<id> npx eas-cli init
 * and paste the id it prints here. `check-fleet --require-ready` (the release gate) refuses
 * a target that is still null, and any run refuses two targets sharing one id.
 */
export const EAS_PROJECT_ID = {
  wellness: "0deed7b2-ae8c-4106-90a3-c61bb14c0c2c",
  "passport-photo": "901d395d-aab8-49ab-8055-57d7de902519",
  "pdf-tools": "3166016b-a2aa-4711-b050-3cbcd4e5d57b",
  "room-redesign": "1e80387c-3b15-47cb-944f-65d9bef46080",
  "subtitles-voice": "10642e6d-1a33-42c2-9f5c-e987eaa0e827",
  "resume-builder": "ab7b814c-a0e1-4000-9aeb-457131351c19",
  "shop-toolkit": "935cfeb0-d03d-431f-a42e-d1311361025e",
  toolbox: "92fb8572-6116-44bc-bc12-4b2487681295",
  swasthpath: "31a274eb-cf87-44d5-b44e-024e3c591be8",
  sheharbazaar: "56b8bb46-e2ff-419b-8149-b5dbb6f796e4",
  gaadighar: "500c9b8a-a2f0-4b39-b4fd-b96c83f500a3",
  "tap-sprint": "7e48abbe-ce9f-4815-ae8b-a99e215f3834",
  "word-duel": "a70ffaa6-8ba5-4521-a197-489c68e07998",
  "block-clear": "de3f9135-c585-4310-af61-11edf629cf7f",
  "merge-tiles": "9f7bdccd-a12b-44d1-96e6-bd473d45fb0e",
  arcade: null,
  sudoku: null,
  "math-sprint": null,
  crossword: null,
  gatted: null,
  dining: null,
  "cycle-tracker": null,
  "money-map": null,
  "doctor-appointment": null,
  highwaypass: null,
  smokefree: null,
  "quick-driver": null,
  "gym-tracker": null,
};

/** The EAS project id for a target, or null when its project has not been created. */
export const easProjectIdFor = (target) =>
  (target && typeof EAS_PROJECT_ID[target.id] === "string" && EAS_PROJECT_ID[target.id]) || null;

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
  if (target.family) return target.family;
  if (target.directory) return "directory";
  if (target.game) return "game";
  if (target.products.length) return "product";
  return "wellness";
};
