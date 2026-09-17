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
| Product apps | 7 | 3 | room-redesign, subtitles-voice, resume-builder, shop-toolkit |
| Directory | 3 | 3 | — |
| Games | 4 | 4 | — |
| **Total** | **15** | **11** | **4** |

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
  every declared route exists. 11/15 publishable, 4 owed (listed above).
- `check-targets.mjs` — 15 targets, 105 pairs compared, 0 too similar.
- `check:games` — Block Clear and Merge rules hold (21 Merge rules).
- `typecheck` — clean across all workspaces.

Catalogue: **9 of 30 products have a screen**; the Toolbox app declares 15 and has built 6.

Web is separate and already live: **27 brand sites** on one multi-tenant Next.js router,
plus the three data brands (`sarkarhealth`, `sarkarmarketplace`, `sarkarcars`).

## Next plan, in order

### P0 — get to 15/15 (engineering; no permission needed)

1. **Room Redesign** — a first screen that opens on its own product.
2. **Subtitles & Voice-over** — needs the Whisper route first (see P1).
3. **Resume Builder** — the form screen plus `resume-builder`, `resume-checker`, `application-writer`.
4. **Shop Toolkit** — the dashboard plus the seven shop products.
5. Then submit the eleven that are ready.

### P1 — advertising is the money path (decided 2026-09-18)

6. **AdMob first, mediated.** AdMob is the only network a brand-new publisher can start
   with; connect AppLovin / Meta / Unity as demand through mediation (bidding), because
   eCPM is an auction outcome, not a price list you choose from.
7. **`ad_events` table + the Networks section** — one table per network to *onboard*
   (formats, integration type, min payout, payout method/currency, requirements, whether it
   needs a live published app) and one measured view (impressions, eCPM, fill, revenue per
   network / format / country). The apps keep touching only `components/ad-slot.tsx`.
8. **Keep the paywall code, unconfigured** — Razorpay stays in the tree, keys stay empty.
   The rewarded ad is the free credit path that converts to a cash customer.
9. Prerequisites before real fill: app live in a store, `app-ads.txt` on dropby.co.in, a
   privacy-policy URL, iOS ATT + Google consent SDK, Data Safety form, ad-SDK disclosure,
   and the payment threshold + identity verification.

Honest expectation: with ~zero installs, ads pay ~₹0. At ~$8 rewarded eCPM, 1,000 completed
views ≈ ₹700, and games need tens of thousands of installs before that matters. Ads-only
means the near-term job is installs, not revenue.

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
