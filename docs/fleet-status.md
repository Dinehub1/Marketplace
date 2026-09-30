# Fleet status — websites and apps

Measured 2026-09-29. The websites were probed live (every route in `apps/web/lib/brand-sitemap.ts` requested
over HTTPS); the apps come from `node scripts/check-fleet.mjs` and the EAS build history. Re-run those two to
refresh this page rather than trusting it later.

## Websites — 28 brands on `*.dropby.co.in`

All 28 are served by the VM (`marketplace` in pm2) through the Cloudflare tunnel, from one Next.js router, with
live data from Supabase. The 20 retired Sarkar hostnames 308-redirect to their new names (see `brand-names.md`).
**"Live" below means every route answers 200 with real content — not that the brand has a real product.**

### Live, with real listings from the database

| Brand | Address | Routes | Listings linked |
|---|---|---|---|
| Shehar Bazaar (marketplace) | sheharbazaar.dropby.co.in | 6/6 | full directory, 24,668 businesses |
| Swasth Path (health) | swasthpath.dropby.co.in | 7/7 | 94 |
| Mistri Mitra (home services) | mistrimitra.dropby.co.in | 7/7 | 108 |
| Gaadi Ghar (cars) | gaadighar.dropby.co.in | 6/6 | 60 |
| Swaad Ghar (food) | swaadghar.dropby.co.in | 6/6 | 90 |
| Tandrust (wellness) | tandrust.dropby.co.in | 7/7 | 120 |
| Dukaan Digital (shops) | dukaandigital.dropby.co.in | 6/6 | 86 |
| Haat Mart (products) | haatmart.dropby.co.in | 5/5 | 56 |
| Thok Bazaar (wholesale) | thokbazaar.dropby.co.in | 6/6 | 60 |
| Vyapar Setu (B2B) | vyaparsetu.dropby.co.in | 7/7 | 60 |
| Padhai Path (education) | padhaipath.dropby.co.in | 7/7 | 65 |
| Hunar Hub (skills) | hunarhub.dropby.co.in | 6/6 | 60 |
| Nyay Saathi (legal) | nyaysaathi.dropby.co.in | 7/7 | 60 |
| Safar Saathi (travel) | safarsaathi.dropby.co.in | 7/7 | 90 |
| Loan Saathi (finance) | loansaathi.dropby.co.in | 7/7 | 44 |
| Hyperframes Real Estate | hyperframes-realestate.dropby.co.in | 6/6 | 60 |
| SikshaHub | sikshahub.dropby.co.in | 5/5 | 41 |
| YaadRakh (places) | yaadrakh.dropby.co.in | 6/6 | 90 |

### Needs work

| Brand | Address | What is missing |
|---|---|---|
| Padosi (local pros) | padosi.dropby.co.in | `/book` is still the "being prepared" placeholder; 30 listings otherwise |
| Mera Ayurvedic | ayurvedicwebsite.dropby.co.in | `/bookings` is still the placeholder; 62 listings otherwise |
| Rozgar Path (jobs) | rozgarpath.dropby.co.in | No jobs table — only an employers list (30). Job listings need data first |
| Yojana Saathi (schemes) | yojanasaathi.dropby.co.in | No scheme data; services/about/contact pages only |
| Ustaad AI | ustaad-ai.dropby.co.in | Marketing pages only (capabilities, use cases, pricing); no working AI product |
| Kadam Pay | kadampay.dropby.co.in | Marketing pages only; no payments product |
| PaisaFlow | paisaflow.dropby.co.in | Marketing pages only |
| FollowUp | followup.dropby.co.in | Marketing pages only |
| Cloud Player | cloudplayer.dropby.co.in | Marketing pages only; `category` is empty in the `brands` table |
| JustDial Agent | justdial-agent.dropby.co.in | Marketing pages only |

Across the estate: **every brand needs a trademark decision.** A web search on 2026-09-29 found 12 of the 20 new
names already used by other apps or companies (Thok Bazaar, HaatMart, Vyapar Setu, Padosi, Hunar Hub, RozgarPath,
NyaySaathi, SafarSaathi, LoanSathi, SwaadGhar, Sheher Bazaar, Tandurust), "Dukaan" is a registered trademark, and
"Dropby" itself has a US trademark and an Indian app of the same name.

### Other web hosts

| Host | Served by | State |
|---|---|---|
| `apps.dropby.co.in` (developer site, `app-ads.txt`) | Vercel `marketplace-web` | live |
| `api.dropby.co.in` (`/api/*`, `/unlock/*`) | Vercel `marketplace-web` | live |
| `admin.` / `dashboard.dropby.co.in` | Vercel | live (sign-in redirect) |
| `expo.dropby.co.in` (web preview of the apps) | VM, `expo-preview` | live |

## Apps — 15 store listings from one Expo codebase (`apps/mobile`)

**None is in a store yet.** Only Word Duel has a store build (Android `.aab`, build 4, 2026-09-28); the other
14 have never been built on EAS. All 15 pass `check-fleet` (unique name, bundle id, art, routes) and
`check-targets` (no two listings too similar).

### Ready to submit — first screen complete

| id | Store name | Bundle id | Store build |
|---|---|---|---|
| word-duel | Word Duel: Word Puzzle | com.brandcollabs.wordduel | Android aab ready |
| tap-sprint | Tap Sprint: Reflex Game | com.brandcollabs.tapsprint | not built |
| block-clear | Block Clear: Puzzle | com.brandcollabs.blockclear | not built |
| merge-tiles | Merge: Number Tiles | com.brandcollabs.mergetiles | not built |
| wellness | Wellness: Daily Practices | com.brandcollabs.wellness | not built |
| passport-photo | Passport Photo Maker | com.brandcollabs.passportphoto | not built |
| pdf-tools | PDF Toolkit: Merge & Sign | com.brandcollabs.pdftools | not built |
| room-redesign | Room Redesign: AI Interior | com.brandcollabs.roomredesign | not built |
| subtitles-voice | Subtitles & Voice-over | com.brandcollabs.subtitlesvoice | not built |
| sheharbazaar | Indore Business Directory | com.brandcollabs.indoredirectory | not built |
| gaadighar | Car Service & Dealers Indore | com.brandcollabs.carsindore | not built |
| swasthpath | Swasth Path: Doctors in Indore | com.brandcollabs.swasthpath | not built |

### Needs work

| id | Store name | What is missing |
|---|---|---|
| resume-builder | Resume Builder & ATS Check | 2 of 3 jobs built; `application-writer` shows "coming soon" |
| shop-toolkit | Shop Toolkit: GST Bills | 1 of 7 jobs built (the GST bill); submit last — a mostly "coming soon" app risks Play's minimum-functionality rule |
| toolbox | Everyday Tools & Photo Fix | 6 of 15 tools built; same risk as above |

Also blocking the store: the Play Console organisation account (`play-console-org-signup.md`), and the open PRs
#6 / #8 (ad bidders, passport in-app purchase), which conflict with the rename and are not merged.

## Commands — start an Expo app

Run from the repo root (`Marketplace/`). Install once with `npm install` (npm 11).

```bash
npm run app                                   # list all 15 apps and their ids
npm run app -- word-duel                      # start one app's dev server; port picked for you
npm run app -- toolbox --port 8083            # choose the port yourself
```

Then press `i` (iOS simulator), `a` (Android emulator) or `w` (web) in the Expo terminal, or scan the QR code
with Expo Go.

Native builds on a simulator or emulator (needed for ads and native modules):

```bash
cd apps/mobile && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 APP_TARGET=word-duel npx expo run:ios
cd apps/mobile && APP_TARGET=word-duel npx expo run:android --device Pixel_API_36
```

iOS needs Xcode 27; Android needs `ANDROID_HOME` and a JDK 17 `JAVA_HOME`, and the `Pixel_API_36` emulator
booted first.

Store builds on EAS (one EAS project per app; the profile name is the app id, except Shehar Bazaar, which is
the default target and builds with `--profile production`):

```bash
cd apps/mobile && npx eas build --profile word-duel --platform android
cd apps/mobile && npx eas build --profile word-duel --platform ios
```

Checks to run before any build:

```bash
npm run check:fleet
npm run check:targets
npm run typecheck
```
