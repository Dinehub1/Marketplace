# Fleet status & next plan — 2026-09-18

Measured, not estimated. The readiness number comes from the gate that already exists:

```bash
node scripts/check-fleet.mjs          # report; exits 0 while apps are still owed a screen
node scripts/check-fleet.mjs --require-ready   # release form; exits 1 until all 20 are publishable
```

## Where we are

**20 store listings from one Expo codebase. 16 can be submitted today; 4 cannot.**

| family | listings | ready | owed a first screen |
|---|---|---|---|
| Wellness | 6 | 6 | — |
| Product apps | 7 | 3 | room-redesign, subtitles-voice, resume-builder, shop-toolkit |
| Directory | 3 | 3 | — |
| Games | 4 | 4 | — |
| **Total** | **20** | **16** | **4** |

Also green on the last logged hour (queue items 41–42, 2026-09-18):

- `node scripts/check-targets.mjs` — 20 targets, 190 pairs compared, 0 too similar (Apple 4.3 / Play spam gate).
- `npm run check:games` — Block Clear and Merge rules all hold (21 Merge rules).
- `npm run typecheck -w @hermes/mobile` — clean; `npx expo export --platform web` — exit 0, 2.71 MB.

Readiness of the catalogue itself: **8 of 29 products have a screen**. The Toolbox app
declares 14 products and has built 5; the four owed apps are owed their whole product set,
not one tile.

Web is separate and already live: **27 brand sites on one multi-tenant Next.js router**,
plus the three data brands that survive (`sarkarhealth`, `sarkarmarketplace`, `sarkarcars`).

## Ready now (16)

- **Wellness (6):** Breathe, Stretch, Walk, Water, Japa, Sleep — each opens on its own screen, no permissions.
- **Product (3):** Passport Photo Maker, PDF Toolkit, Everyday Tools & Photo Fix (toolbox, 5/14 built).
- **Directory (3):** SarkarHealth, Indore Business Directory, Car Service & Dealers Indore.
- **Games (4):** Tap Sprint, Word Duel, Block Clear, Merge: Number Tiles.

## Not ready (4)

| listing | bundle id | what is missing |
|---|---|---|
| Room Redesign: AI Interior | `co.dropby.roomredesign` | camera → redesign screen (0/1 products) |
| Subtitles & Voice-over | `co.dropby.subtitlesvoice` | chooser + subtitles + voice-over (0/2) |
| Resume Builder & ATS Check | `co.dropby.resumebuilder` | form + 3 resume products (0/3) |
| Shop Toolkit: Bills & Catalogue | `co.dropby.shoptoolkit` | dashboard + 7 shop products (1/7 — invoice only) |

Each is a roadmap entry on purpose, but `check-fleet --require-ready` (which every
`prebuild:*` hook runs) refuses a store build while any of them is unbuilt.

## Next plan, in order

### P0 — turn 16/20 into 20/20 (engineering; no permission needed)

1. **Room Redesign** — a first screen that opens on its own product, not the marketplace.
2. **Subtitles & Voice-over** — needs the Whisper route live first (see P1).
3. **Resume Builder** — the form screen plus `resume-builder`, `resume-checker`, `application-writer`.
4. **Shop Toolkit** — the dashboard plus the seven shop products.
5. Then submit the 16 that are ready.

### P1 — unblock revenue and the AI products (needs you)

6. **Razorpay keys** (`RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET`, queue item 6) — no
   order can be paid today, so the passport paywall cannot complete end to end. Do not fake a payment.
7. **`CLOUDFLARE_AI_TOKEN`** in `apps/web/.env` (item 14) — first job: subtitles via
   `@cf/openai/whisper`; then translation on `indictrans2` (item 15).
8. **One Cloudflare dashboard click** (item 35) — accept Meta's licence for the vision model,
   or bill-scan / study-photo stays dead even with a token.
9. **EAS / Apple / Expo login** — native builds and store submissions (parking lot).

### P2 — finish what is already half-built

10. **Toolbox: 9 of 14 tiles still `route: null`** — photo repair, product photo, card maker,
    marksheet maker, worksheet maker, translate-doc, study-helper, notes-from-audio, cover-maker.
11. **Text to image** (item 28) — engine and route are live (job 117, a real 1024×1024 JPEG);
    the tile and screen are missing.
12. **Shared tool frame** — `components/tool-frame.tsx` and `lib/history.ts` do not exist,
    which blocks items 1 and 20 (wrap the tool screens and Breathe). Verified absent today.

### P3 — hardening already in the queue (no device, no credential)

13. Interaction probes for PDF rotate, invoice UPI, collage chips (item 34).
14. Theme audit over every screen in one pass (item 38).
15. `product_jobs.meta` column (item 40), then merge `metaFor` (item 37) and price products
    from measured cost (item 16).
16. Engine: retry a hosted call once on a transient upstream 5xx (item 29).
17. Gallery: a 200 page with nothing on it must not overwrite a good shot (item 33).
18. Wire the AI router into a real product — the ₹0 listing-description path (item 36).
19. Deep links per screen on the test page (item 22); route hint `!5` (item 26); invoice
    counter per phone (item 27).
20. VoxCPM voice-over (item 13) — measure it against the 4 vCPU / 8 GB ceiling before installing.

### P4 — your calls (parking lot, do not start unilaterally)

21. Pricing: on-device background cut free vs ₹99 (item 32); `resume-checker` ₹99/mo but served
    free; `ai-image` free vs measured ₹0.17/job; document-check tile price (item 24).
22. Widen the India-only phone check, or keep the label (item 39).
23. Re-check the Apple 4.3 decision for the three directory twins before submitting.
24. Stop the wedged `expo-dev` tunnel (item 17).

### Blocked — do not re-attempt blind

- Video background removal (item 5) — CPU cost on this box.
- colibri (item 12) and the VoxCPM install — box ceiling (4 vCPU / 8.0 GB / 43.5 GB free).
- Stirling-PDF Pipeline (item 9) — licence.
- Photo-permission fix (item 23) — native-only evidence; needs the first dev build.

## Closed (for reference)

Items 2, 3, 4, 8, 10–14, 15, 16, 17, 18, 19, 20-route, 21, 22-capture, 25, 41, 42 are
DONE in `docs/hourly-queue.md`; item 9 (ImageToolbox) and item 21 (the targets gate) are
done in the tree even though their headings still read open.
