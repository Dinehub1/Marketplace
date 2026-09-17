# Fleet status & next plan — 2026-09-18

Measured, not estimated. The readiness number comes from the gate that already exists:

```bash
node scripts/check-fleet.mjs                   # report; exits 0 while apps are still owed a screen
node scripts/check-fleet.mjs --require-ready   # release form; exits 1 until every listing is publishable
node scripts/check-targets.mjs                 # Apple 4.3 / Play spam gate
```

## Where we are

**15 store listings from one Expo codebase. 11 can be submitted today; 4 cannot.**

| family | listings | ready | owed a first screen |
|---|---|---|---|
| Wellness | 1 | 1 | — |
| Product apps | 7 | 5 | room-redesign, subtitles-voice |
| Directory | 3 | 3 | — |
| Games | 4 | 4 | — |
| **Total** | **15** | **13** | **2** |

### The wellness regroup (2026-09-18)

The six wellness listings (breathe, stretch, walk, water, japa, sleep) were **one app with
six doors**: one tab bar, one Today hub, one Progress page, one Profile page — opening
Stretch, Walk and Water produced the same shell. Six bundle ids of one app is the shape
Apple 4.3 ("multiple Bundle IDs of the same app") and Play's repetitive-content policy
reject, and that rejection lands on the developer account, not on one listing.

They are now a single listing, **Wellness: Daily Practices** (`co.dropby.wellness`),
opening on the Today hub (`/habits`) with all six practices inside. `check-targets.mjs`
never caught this because it compares words — name, subtitle, ASO keywords — and never
screens; that gap is recorded in `targets.mjs` so the decision is not re-litigated.

If one practice later earns its own listing, split it by giving that build its own first
screen and dropping the shared hub, and add a target back to `targets.mjs`.

### Gates green on the last measured run

- `check-fleet.mjs` — 15 targets resolve: unique name, slug and bundle id; art on disk;
  every declared route exists. 13/15 publishable, 2 owed (listed above).
- `check-targets.mjs` — 15 targets, 105 pairs compared, 0 too similar.
- `check:games` — Block Clear and Merge rules hold (21 Merge rules).
- `check:resume` — 37 résumé layout rules hold, with no PDF library installed.
- `typecheck` — clean across all workspaces.

Catalogue: **11 of 30 products have a screen**; the Toolbox app declares 15 and has built 6.

Web is separate and already live: **27 brand sites** on one multi-tenant Next.js router,
plus the three data brands (`sarkarhealth`, `sarkarmarketplace`, `sarkarcars`).

## Next plan, in order

### P0 — get to 15/15 (engineering; no permission needed)

Readiness on `check-fleet` needs a **first screen**, but an honest first screen needs the
product behind it — a screen that opens on a product the engine cannot run is the thing the
repo's own rules forbid. So the four divide by what the engine can actually do:

| app | what it needs | engine today | verdict |
|---|---|---|---|
| ~~Resume Builder~~ | ~~`resume-builder` (a PDF from a form), `application-writer` (text), `resume-checker`~~ | **DONE 2026-09-18** — `resume-builder` + `resume-checker` live (2/3); `application-writer` still `route: null` and shows honestly as coming soon | shipped |
| ~~Shop Toolkit~~ | ~~dashboard + catalogue, order loop, digital card, booking page, bill tracker, fee tracker~~ | **DONE 2026-09-18** — dashboard first screen at `/shop`; 1 of 7 jobs live (the GST bill), the other six labelled coming soon on the app's own front door | first screen shipped, app thin |
| Subtitles & Voice-over | `subtitles` (STT), `voiceover` (TTS) | neither exists — `whisper.cpp` and `Piper` are named in the worker's docstring but **not implemented** | Needs hosted Workers AI STT/TTS. Real engine work. |
| Room Redesign | image-to-image restyle of a photo | no img2img; the worker only has text-to-image (`flux-1-schnell`) | Needs an img2img model that has not been measured. |

Order: **Subtitles & Voice-over → Room Redesign**, the two that need hosted models.

**`13/15 publishable` is a structural number, not a shipping decision.** `check-fleet` asks
whether a listing *could* be submitted — does it resolve, is its first screen real. Shop
Toolkit passes it with one job of seven built, and Resume Builder with two of three. Neither
should reach a store until its listing copy matches what the build actually does, or the
missing jobs are built.

Resume Builder landed as engine work plus a screen, not a screen: the page rules live in
`services/tools/resume_layout.py` (a module that imports nothing, so `npm run check:resume`
asserts wrapping, page breaks, atomic bullets and orphaned headings with no PDF library
installed), and `resume_builder()` in `worker.py` renders that layout through the invoice's own
pdfcpu path. **Its one unproven half:** the pdfcpu render itself has not run on the VM yet.

**The verification constraint, stated plainly.** The product engine (`services/tools/worker.py`,
`127.0.0.1:8099`) runs **only on the Windows VM**. This Mac has none of its dependencies —
no `reportlab`, no `Pillow`, no `markitdown`, no `pdfcpu` — and the port is loopback-only, so
a new engine product can be written and typechecked here but its 200 can only be produced on
the VM. Every engine change therefore lands with that gap named, and the job id that proves
it is recorded on the VM rather than claimed from here.

5. Then submit the thirteen that are ready — after the listing-copy check above.

### P1 — advertising is the money path (decided 2026-09-18)

The sourced research is filed under `docs/ad-monetisation/`: the main report, the 2026 eCPM
benchmarks (every figure labelled independent or vendor), the rejection/ban research, the
per-network onboarding sheets, the India network list, the consent/privacy declarations, and
the Indian tax framework for foreign ad revenue. It corrected four things this plan had
wrong — Meta Audience Network is alive and bidding-only, India is paid by **USD wire, not
INR**, app-ads.txt is mandatory for new AdMob apps and cannot be completed pre-launch, and
**Pangle is out entirely** (no individual developers, and India is not in its supported
regions).

**The shortlist that survives, for a solo developer with no company and no live app:**
**AdMob + InMobi + AppLovin MAX**, with AdMob as the mediation layer. InMobi is the only
genuine India-native publisher network and has the lowest floor ($50 for India). Ruled out
for structural reasons, not performance: Pangle (above), Chartboost (needs 250 DAU sustained
7–14 days with the SDK already live), Amazon APS (invitation-only), BidMachine and Mintegral
($1,000 floors), Affle/Glance (no publisher side at all), Adgebra (web-only).

6. **AdMob first, mediated.** It is the only one with open self-serve signup and no published
   traffic minimum; connect InMobi and AppLovin MAX as demand through bidding, because eCPM
   is an auction outcome, not a price list you choose from. **One exception to the AppLovin
   recommendation:** AppLovin left Play's Families Self-Certified Ads SDK program, so it
   cannot be used in any child-directed app — exclude it from that app's mediation if any
   wellness app targets children.
7. **`ad_events` table + the Networks section** — one table per network to *onboard*
   (formats, integration type, min payout, payout method/currency, requirements, whether it
   needs a live published app) and one measured view (impressions, eCPM, fill, revenue per
   network / format / country). The apps keep touching only `components/ad-slot.tsx`. Show
   first-party measured eCPM as the only "earns most" signal, keep vendor rates in a separate
   labelled unverified column, and give every network an `eligibility_status` +
   `deferred_reason` — most are closed for structural reasons, and documenting *why* is more
   useful than their claimed eCPM.
8. **Keep the paywall code, unconfigured** — Razorpay stays in the tree, keys stay empty. The
   rewarded ad is the free credit path that converts to a cash customer. One IAP at ~$3 is
   worth roughly a thousand India-tier rewarded impressions, so the paywall is not the thing
   to delete.
9. Prerequisites before real fill: app live in a store, `app-ads.txt` on dropby.co.in, a
   privacy-policy URL, iOS ATT + Google consent SDK, Data Safety form, ad-SDK disclosure, and
   the payment threshold + identity verification.
10. **Two dated compliance traps, both silent rather than loud:** IAB **TCF v2.3**'s deadline
    has passed (Google, 1 Mar 2026) and missing it defaults ad requests to Limited Ads — a
    revenue loss with nothing in the logs — so the GMA SDK must be ≥19.0.0 Android /
    ≥7.60.0 iOS. And **TFCD/TFUA are deprecated in favour of TFAT**
    (`setAgeRestrictedTreatment`), which is the **Next-Gen** SDK API while AdMob's own docs
    still cite the legacy `setTagForChildDirectedTreatment` — resolve which lineage the RN
    wrapper uses before writing tagging code, because misuse can terminate the account.
11. **Before the first payout:** Indian tax specifics now sourced — RBI purpose code **P1007**,
    FEMA realisation window 9 months, AdMob income treated as business income (not a royalty),
    a sole proprietor signs **W-8BEN** (not W-8BEN-E) with the no-PE representation on line 10,
    and no foreign network withholds Indian TDS so the whole liability is self-paid via advance
    tax. The unresolved decision needs a CA: **44AD versus 44ADA**.

Honest expectation: with ~zero installs, ads pay ~₹0, and every network's floor is $100 of
accumulated earnings before anything is paid out — at India-tier rewarded rates that is on
the order of 74,000 completed views. Ads-only means the near-term job is installs, not
revenue. **Also policy-critical:** never put an ad on a dead-end screen (a "done" or
"exported" page), never float a banner over content, and treat the first app as a low-risk
pilot — a disabled AdMob account cannot rejoin.

### P2 — unblock the rest (needs you)

10. `CLOUDFLARE_AI_TOKEN` in `apps/web/.env` (queue item 14) — subtitles, and the remaining
    hosted paths.
11. One Cloudflare dashboard click to accept Meta's vision licence (item 35), or bill-scan /
    study-photo stays dead.
12. EAS / Apple / Expo login for native and store builds.

### P3 — hardening already in the queue (no device, no credential)

13. Items 41–44: the Document Translation screen, the /log cost page, probes that stop before
    the upload, bad-input probes.
14. Items 45–48: Text-to-Image probes, `APP_TARGET` in the web export, the retry's attempt
    count, and a gallery shot that is already wrong staying wrong.
15. Items 49–52: directory descriptions in batches, a failed job keeping its provider, the
    directory feed probe, and the web tab bar's labels following the theme.
16. Items 1 and 20 — the shared tool frame (`components/tool-frame.tsx`, `lib/history.ts`)
    still does not exist, so wrapping the tool screens stays blocked.

### P4 — your calls (parking lot, do not start unilaterally)

17. Pricing: on-device background cut free vs ₹99 (item 32); `ai-image` free vs a measured
    ₹0.18/job; `resume-checker` ₹99/mo but served free; document-check tile (item 24).
18. Widen the India-only phone check, or keep the label (item 39).
19. Re-check the Apple 4.3 decision before submitting the three directory twins.
20. Stop the wedged `expo-dev` tunnel (item 17).

### Blocked — do not re-attempt blind

- Video background removal (item 5) — CPU cost on this box.
- colibri (item 12) and VoxCPM (item 13) — box ceiling (4 vCPU / 8.0 GB / 43.5 GB free).
- Stirling-PDF Pipeline (item 9) — licence.
- The chips-at-320 px measurement and the on-device cut (items 30, 31) — need a real phone.
- Photo-permission fix (item 23) — native-only evidence; needs the first dev build.
