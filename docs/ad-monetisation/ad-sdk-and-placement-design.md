# The Ad SDK — one design: every impression goes to whoever pays the most

**Date:** 2026-09-19 · **Scope:** `apps/mobile` (15 store listings, one Expo codebase)
**Status:** design for approval — no code changed yet.

---

## 0. What was asked, and the one thing that is true about it

> "At this moment AdMob is giving me ₹10 to show this ad, another platform is giving ₹5, at
> that particular time and for that particular audience — so I want it to go to AdMob."

That is one requirement, and it is the correct one. It is called **real-time in-app bidding**,
and the honest answer has two halves:

1. **The auction already does exactly this — and we must not rebuild it.** Every major
   mediation SDK already runs a per-impression auction: the ad sources are asked to bid,
   the highest bid wins that one impression, and the loser gets nothing. Hand-rolling our own
   pick-the-winner router on top of the networks is both **against policy** and **revenue-losing**
   — the networks will not bid against a client we control, and unsold impressions earn ₹0.
2. **What we must build is everything around the auction:** one adapter so the 15 apps never
   see a network SDK, one event log so we can *prove* who actually paid more (their claimed
   rates are marketing), and one routing layer so a config change re-points the fleet without
   a store release — plus the placements themselves, which do not exist yet.

So this is one design, not two: **the SDK is a router with the platform auction behind it.**

---

## 1. What already exists (reviewed, not re-researched)

`docs/ad-monetisation/` holds ~590 KB of sourced research from 2026-09-18. This design does
not repeat it. In summary of what it already settled:

| Already decided there | Where |
|---|---|
| **AdMob hosts mediation; InMobi + AppLovin MAX join as bidding demand.** Only self-serve options reachable with no company and no live app | `ad-monetisation-report-2026.md` Q1–Q2, `status-and-next-plan.md` §P1 |
| **Bidding, never waterfall** — Meta bidding-only since 2021, Unity 100 % in-app bidding 2025, AppLovin killed its waterfall | `ad-monetisation-report-2026.md` Q2 |
| "Whoever pays most" is an **auction outcome, not a price list**; compare measured eCPM, never vendor blogs | `ad-monetisation-report-2026.md` Q3, `ecpm-benchmarks-2025-2026.md` |
| India is an **ads-first** market (70.3 % of game revenue) but at zero installs ads pay ~₹0; US$50–100 payout floors | `ad-monetisation-report-2026.md` Q6 |
| `ad_events` field-by-field data model, the Networks screen, first-party vs `vendor_estimate (unverified)` | `ad-monetisation-report-2026.md` "Networks screen — data model" |
| Policy guardrails: no ads on dead-end/launch/exit screens, banners never adjacent to nav or floating, rewarded may be rewarded | `ad-policy-ban-research-2026-09.md`, `ad-monetisation-report-2026.md` Q5 |
| Consent stack: UMP + IAB TCF v2.3, ATT, TFAT (not deprecated TFCD/TFUA), Play Data Safety | `ad-compliance-consent-privacy-declarations-2026.md` |

**The gaps this document fills — none of the eight files cover these:**

1. The actual **SDK architecture** (adapter interface, formats, load/show lifecycle, test ads).
2. The **revenue loop**: how the winning price gets back to us (impression-level ad revenue).
3. The **routing layer**: how a "this network pays more now" decision changes behaviour without
   a store release.
4. The **placement map** across all 15 apps — screen by screen, moment by moment.
5. The **server-side config** service the routing layer needs.

### Code reality today

| Thing | State |
|---|---|
| `apps/mobile/components/ad-slot.tsx` | placeholder only — `AdSlot` (rewarded shape) + `AdBanner` (reserved space), both honest "no network connected" |
| Ad placements | 4 of 15 apps: `block-clear`, `tap-sprint`, `word-duel` (rewarded), `merge-tiles` (banner). **Zero product, directory or wellness placements** |
| `ad_events` table | does not exist — no migration |
| `app-ads.txt` | not in `apps/web/public` — **hard prerequisite, missing** |
| root privacy policy | only a per-brand page (`apps/web/app/brand-router/[brand]/pages/privacy.tsx`) |
| Ad SDK dependency | none in `apps/mobile/package.json` |

---

## 2. The design in one diagram

```
  app screen  ──►  <AdSlot/>  /  <AdBanner/>          ← the only thing apps touch
                          │
                          ▼
                 lib/ads/facade.ts                    ← our code: one API, all formats
                  · placement ids, frequency caps, consent gate, offline queue
                          │
                          ▼
                 lib/ads/adapters/*.ts                ← one file per network, same interface
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
   AdMob (host)      InMobi (bidder)   AppLovin MAX (bidder)
        └──────── AUCTION: highest bid wins THIS impression ────────┘
                          │
                          │ impression-level ad revenue callback
                          ▼
                 lib/ads/events.ts  ──►  POST /api/ad-events  ──►  ad_events (Supabase)
                                                                        │
                                          Networks screen ◄─────────────┘
                                          (measured eCPM per network × format × country)
                                                                        │
                                          ad_config (remote) ───────────┘
                                          floors · enabled networks · caps · format switches
                                                    │
                                                    ▼
                                          back to every app, no store release
```

Two loops, and they are the whole system:

- **The fast loop** (per impression, milliseconds): the auction on the device picks the highest
  bid. We do not interfere.
- **The slow loop** (per day): we measure who really won and at what price, then change the
  *conditions* — floors, enabled networks, frequency caps, per-app format mix — via remote
  config. That is the switch, and it is the only switch that is both legal and effective.

---

## 3. What we build vs what the platform does

| Job | Owner | Why |
|---|---|---|
| Decide which network wins one impression | **Platform auction** (AdMob mediation + bidders) | Only the mediation SDK can make networks bid against each other |
| Serve the creative, handle clicks, SSV | **Network SDK** | — |
| One interface the 15 apps use | **Us** — `lib/ads/facade.ts` | Stops 15 apps importing 3 SDKs; makes a network swappable in one file |
| Reward only on a verified completion | **Us** — facade + SSV later | The one rule a rewarded economy must never break |
| Record every request/fill/impression/error **and the winning price** | **Us** — `ad_events` | Their dashboards lie by aggregation; ours is per-app/per-placement/per-format |
| Rank networks by *measured* revenue, not claimed eCPM | **Us** — Networks screen | The report's own "measured vs claimed" rule |
| Change which networks are enabled / floors / caps per app | **Us** — `ad_config` + facade | This is the "switch to whoever pays more" control that actually exists |
| Pick a *different network per impression on our own* | **Nobody** | Policy violation + reduces fill. Explicitly out of scope |

---

## 4. The adapter interface (one file per network)

Every network adapter implements the same shape, so the facade — and therefore every screen —
is network-agnostic. This is the only contract that matters:

```ts
// lib/ads/types.ts
export type AdFormat = "rewarded" | "interstitial" | "banner" | "native" | "appOpen";

export type AdOutcome =
  | { kind: "rewarded"; network: string; placement: string; revenueMicros: number; currency: string }
  | { kind: "dismissed"; network: string; placement: string }
  | { kind: "failed"; network: string; placement: string; code: string; message: string };

export interface AdNetworkAdapter {
  id: "admob" | "inmobi" | "applovin";
  /** Formats this network can actually serve THROUGH THE HOST (from the research sheets). */
  supports(format: AdFormat): boolean;
  init(consent: ConsentState): Promise<void>;
  preload(format: AdFormat, placement: PlacementId): Promise<void>;
  isReady(format: AdFormat, placement: PlacementId): boolean;
  show(format: AdFormat, placement: PlacementId): Promise<AdOutcome>;
  /** Impression-level revenue: the winning price, per impression. */
  onImpressionRevenue(cb: (e: ImpressionRevenue) => void): void;
}
```

**Two deliberate constraints**

- **AdMob is the only adapter with a real `show` early on.** InMobi and AppLovin join as
  *ad sources inside AdMob mediation* — they do not get their own SDK calls from us, because
  two mediation hosts on one impression is how fill collapses. They earn their place by
  **outbidding AdMob in the same auction**, and we see them win in `ad_events`.
- **`revenueMicros` is a value, not a promise.** It comes from the
  [impression-level ad revenue API](https://developers.google.com/admob/android/impression-level-ad-revenue);
  when a network does not report it, we store `null` and the row is labelled unmeasured rather
  than filled with a guess.

---

## 5. The placements — "the places where people are roaming"

This is the concretely missing half. Placements are chosen by **dwell time × intent × policy
safety**, not by screen count. Read the estate:

| App(s) | The moment people are actually there | Placement | Format | Why it is the highest-value slot |
|---|---|---|---|---|
| **Games** (4) | Between rounds — "Play again" | after the round-over card is dismissed | interstitial, capped 1/2 rounds | Natural break, user already finished; **never on the over card itself** (dead-end rule) |
| **Games** (4) | Mid-round, stuck | already built: fresh tray / extra life / hint | rewarded | Highest-intent view in the whole fleet: the user *asks* for it |
| **Games** (2 board games) | While playing | reserved banner above the board (built) | banner | Passive; board must not move |
| **Product apps** (7) | **Job finished, watermarked preview behind the paywall** — `lib/tools.ts` `job.locked` | "Free unlock · watch a 30 s ad" beside ₹49/₹99 unlock | rewarded | **The single best slot in the portfolio.** It monetises the exact fence 100 % of users hit, converts a non-payer, and keeps Razorpay untouched above it. Reward: unlock this one file, not the pack |
| **Product apps** (7) | After a successful export/save | interstitial | interstitial | The user's job is *done*, so a break costs nothing — **not** on the success screen itself, on the next entry |
| **Toolbox / PDF / photo** (hub) | Browsing 15 tiles, deciding | in-feed native between tiles | native | Intent-rich, non-interactive region; native eCPM is unverified in our research, so measure before scaling |
| **Directory** (3) | Business detail scroll — 24,048 listings | inline native in the content column, below the action rows | native | The highest-volume surface in the fleet; long scroll, genuinely informational |
| **Directory** (3) | Search with no result / end of list | banner | banner | Empty state is real content, not a dead end |
| **Wellness** (1) | Session complete (breathe/stretch/walk rounds) | after the round summary is closed | interstitial, capped | Calm app: cap hard, never during a practice |
| **Wellness** (1) | Today hub + Progress | **none** | — | An ad next to a health practice is the fastest way to lose the user and invite a policy review |

**Placement inventory: 15 apps · ~22 slots · 5 formats.** Games and the product paywall are
where revenue actually is; directory is where volume is; wellness is where restraint is.

### The frequency-cap rule (non-negotiable)

Two states per placement, decided by config, not by code: `enabled` and `sessionCap`.
Rewarded is **uncapped** (the user chooses it). Interstitial is capped at **1 per 2 user
actions** (Google's own stated rule) and never within 30 s of another. Banners are never
placed adjacent to navigation/action rows and never float over content.

---

## 6. The data model (`ad_events`) — extends the report's table, does not replace it

One row per event, append-only. eCPM is a time series; nothing is overwritten.

```sql
create table ad_events (
  id             bigserial primary key,
  created_at     timestamptz not null default now(),
  app_target     text not null,          -- 'block-clear', 'passport-photo', …
  platform       text not null,          -- ios | android | web
  placement      text not null,          -- 'game.roundover', 'job.unlock-rewarded', …
  format         text not null,          -- rewarded | interstitial | banner | native | appOpen
  event          text not null,          -- request | fill | impression | click | reward | error
  network        text,                   -- WINNING network, from the SDK response
  ad_unit_id     text,
  revenue_micros bigint,                 -- impression-level revenue; NULL = not reported
  currency       text,
  ecpm_micros    bigint,                 -- derived, stored so the screen never recomputes wrongly
  latency_ms     int,
  error_code     text,
  error_message  text,
  is_test        boolean not null default false,   -- demo units during build
  consent_state  text not null,          -- tcf string state | npa | att-denied
  session_id     uuid,                   -- the "particular time and audience" join key
  country        text                    -- from the store/device, for the geo split
);
```

The Networks screen then reads a view — `ecpm by network × app × format × country × period` —
and **only that view decides "who pays more"**. A network's own dashboard never does.

---

## 7. The routing layer (how "switch to whoever pays more" really happens)

The config the auction cannot decide alone, because it is a *business* decision:

```jsonc
// ad_config — one document, fetched at launch, cached, safe defaults on device
{
  "version": 7,
  "defaults": { "interstitialMinGapSeconds": 30, "maxInterstitialsPerSession": 3 },
  "apps": {
    "passport-photo": {
      "placements": {
        "job.unlock-rewarded": { "enabled": true, "format": "rewarded", "rewardKind": "file" },
        "post.export":         { "enabled": true, "sessionCap": 2 }
      },
      "sources":  { "admob": { "enabled": true }, "inmobi": { "enabled": true }, "applovin": { "enabled": true } },
      "floors":   { "rewarded": 0.30, "interstitial": 0.20 }
    }
  }
}
```

Rules that keep it honest:

- **Fetch once, cache, never block an ad on the network.** A phone in aeroplane mode plays the
  last cached config; a first install plays compiled defaults.
- **Remote config widens or narrows demand; it never overrides a policy rule.** The compliance
  guard (§8) is compiled in, not configurable.
- **Changing a floor is the real lever.** If measured eCPM for a placement sits far above the
  floor, raising it filters cheap demand; if fill drops below ~90 %, lowering it. That is the
  loop the daily job runs.
- **A network is disabled per app, not globally** — AppLovin must be off in any child-directed
  or Families app anyway (it left Play's self-certified programme), which is exactly the kind of
  rule this document expresses once.

---

## 8. The compliance guard (compiled in, not optional)

Every one of these is a permanent-account risk, taken from `ad-policy-ban-research-2026-09.md`:

1. No ad on a **dead-end screen** — "done", "exported", "error", "round over" itself.
2. No interstitial **on app load or exit**; min 30 s gap; ≤ 1 per 2 user actions.
3. Banners: never adjacent to a nav/action row, never floating over content, reserved height.
4. Rewarded: reward **only** on a verified completion callback; never auto-play; always
   dismissible; rewarded may be rewarded (Apple 3.2.2(x) permits it).
5. Consent: UMP + TCF v2.3, ATT prompt, **TFAT** age treatment; no personalised ads in any
   child-directed target.
6. Declare every ad SDK in Play Data Safety and the App Privacy label.
7. **Demo ad unit ids in every dev build and every screenshot run.** Never tap a live ad.
8. The first app shipped with ads is a **low-risk pilot**; a disabled AdMob account cannot rejoin.
9. A free file unlock is **one completed ad for one specific file** — never a pack, never a
   subscription, and never granted in a build with no ad SDK. The paid path stays visible beside
   it: the ad is an alternative payment, not a hidden one, and neither option is buried behind the
   other (Apple 3.2.2 says an app must not be "designed predominantly for the display of ads",
   which a paywall whose only exit is an ad would be).

---

## 9. Build order

| Phase | Work | Depends on |
|---|---|---|
| **P0 — SHIPPED 2026-09-19** | `lib/ads/*` facade + AdMob adapter + `ad_events` migration + `/api/ad-events`; the 4 existing game slots wired to it behind `EXPO_PUBLIC_ADS_ENABLED` using **Google demo units** | nothing |
| **P1 — SHIPPED 2026-09-19** | The rewarded-unlock slot on the product paywall (`job.locked`) across the four locked-job screens; the server grant, its constraint and its audit trail | P0 |
| **P2** | Interstitial after round-over/export with caps; directory + toolbox native/banner slots; Networks screen reading measured eCPM; `ad_config` + fetch/cache | P0, volume |
| **P3** | Onboard AdMob → `app-ads.txt` on the domain → InMobi + AppLovin MAX as ad sources → publish → consent/Data Safety → **AdMob SSV**, which removes the client as the witness | store listing live, developer website |
| **P4** | The daily slow loop: measured eCPM → floor/enablement suggestions → apply via config | real impressions |

### P1 as shipped — one completed ad, one file

The strict rule, written once: **no verified rewarded completion, no unlock.**

`showRewarded` resolves `kind: "rewarded"` only after the SDK reports `EARNED_REWARD`; a
dismissed or failed view never reaches the grant. `components/unlock-row.tsx` is the only place
that pairs an ad with a file, so the four screens cannot diverge on the rule.

| Layer | Enforces |
|---|---|
| `components/ad-slot.tsx` (`strict`) | A slot whose reward is a file grants **nothing** when no ad SDK is present — it refuses in words. The games keep the placeholder so their loop stays testable; the cost there is one extra life, not a paywall hole |
| `lib/tools.ts` → `unlockWithRewardedAd` | Only ever called from the reward callback; the URL it returns comes from the server, never from local state |
| `POST /api/job/[id]/ad-unlock` | Writes the grant on the service role; refuses a job that was paid for; per-IP daily quota (10); logs a `reward` row to `ad_events` |
| `product_unlocks` | `unique (job_id)` — one free file per job, **ever**, however many times the route is called; `source` constrained to `rewarded_ad`; cascades with the job |
| `GET /api/job/[id]` | Reads the unlock too, so a free file is not reported as locked. Without this the two routes disagreed — found by test, fixed |

**Verified end to end against the live database**, not asserted: migration applied; the route
returned `201` with the clean URL on the first call and `already: true` on the second; the
`product_unlocks` row and the `ad_events` `reward` row were both written; the `is_test` row was
excluded from `ad_network_performance`; `GET /api/job/158` then answered `locked: false` with
`unlocked_by: "rewarded_ad"`. The migration's constraints were also proven in a throwaway local
Postgres: a second unlock of the same job is rejected, an unlabelled `source` is rejected, a
second *file* is allowed, and deleting the job removes its unlock. All test rows were deleted
afterwards; the 156 real jobs are untouched.

**The honest gap, closed in P3:** the completion is still witnessed by the client, because this
build has no AdMob server-side verification. What makes that acceptable today is that the *grant*
is not the client's to make — it is a constrained row written on the service role, one per job,
quota-bound and logged. AdMob SSV replaces the witness with a signature.

### P0 as shipped

`lib/ads/` is facade + config + consent + caps + session + event buffer, with the AdMob adapter
the only file that names a network. Components changed: `components/ad-slot.tsx` (same props plus
a required `placement`, real ad when one is ready, placeholder otherwise), `app/_layout.tsx`
(`prepareAds()` once), and the three games that host a rewarded slot (one added prop each).

**Enabling a build** is two environment variables plus unit ids, and nothing else:

```
EXPO_PUBLIC_ADS_ENABLED=1
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=ca-app-pub-…~…
EXPO_PUBLIC_ADMOB_APP_ID_IOS=ca-app-pub-…~…
# optional: live unit ids, per format; without them Google's demo units are used
EXPO_PUBLIC_ADMOB_REWARDED_UNIT=…
```

Unset is the default and stays working: no plugin, no SDK resolved, placeholder shown.
`EXPO_PUBLIC_ADS_ENABLED=1` without both app ids **throws at config time** rather than shipping an
app whose every ad request fails silently.

**Not yet true (P0 scope, stated):** `isReady()` returns false until P1 holds a preloaded instance,
so `showRewarded` refuses with `sdk_unavailable` and the placeholder remains — the wiring is
complete and observable, but no ad is shown yet. The migration is written and **not applied**;
`ad_events` does not exist in the database until it is run.

**Hard prerequisites, all missing today:** `app-ads.txt` at the domain root, a root privacy-policy
URL, a developer website in the store listing, and Play's closed-test clock (~3 weeks per app on
a personal account). These gate P3, not P0.

---

## 10. Honest numbers

At zero installs the auction has exactly one bidder and ads pay ~₹0. Every network's floor is
US$50–100 of *accumulated* earnings; at India-tier rewarded rates (~US$1.35 net eCPM) that is
on the order of **74,000 completed views** before money moves. The engineering below is
therefore about being **correct and measurable on day one of installs**, not about near-term
revenue. The distribution problem — installs — is untouched by any of this.

## 11. Decisions needed before P0 starts

1. **Domain for `app-ads.txt`** — `dropby.co.in` is the plan in the report; confirm it is owned. AdMob app verification is mandatory for new apps and cannot be completed pre-launch.
2. **Rewarded-unlock value** — does one rewarded view unlock one file, or grant one credit toward any ₹99 job? (Design decision; affects the paywall screen.)
3. **44AD vs 44ADA** — needs a CA, before the first payout, not before P0.

---

## 12. Server-side verification — taking the phone out of the trust chain

### The weakness P1 shipped with

```
  AdMob → phone → the app says "I earned the reward" → the server grants
```

The **phone was the witness**. The app is attacker-controlled code on a device the
attacker owns, so "I watched it" is a sentence anyone can say. The grant itself was
constrained (`unique (job_id)`, quota, logged) — but the *claim* was unverified.

### The chain now

```
  AdMob → phone → AdMob's server → signed callback → our server verifies → grant
```

[`apps/web/lib/ad-ssv.ts`](../../apps/web/lib/ad-ssv.ts) verifies the callback's ECDSA
P-256 signature against Google's published key set
([`verifier-keys.json`](https://www.gstatic.com/admob/reward/verifier-keys.json)), and
[`/api/ad-ssv`](../../apps/web/app/api/ad-ssv/route.ts) records the result.

### The flow, step by step

| Step | Call | What it proves |
|---|---|---|
| 1 | `POST /api/job/<id>/ad-claim` | nothing — mints a nonce, writes a `pending` claim, releases no file |
| 2 | the ad request carries `serverSideVerificationOptions: { userId: nonce }` | the nonce rides to AdMob, so a signature can name this job |
| 3 | `GET /api/ad-ssv?…&signature=…` (AdMob calls us) | **the signature** — a real completion, for that ad unit, recently |
| 4 | `POST /api/job/<id>/ad-unlock { claim }` | only a `verified` claim releases the file; `202` while pending |

### Details that are easy to get wrong, and are handled

- **Verify the raw bytes.** The signature covers the query string up to `&signature=`.
  Parsing and re-serialising first would verify a string nobody signed.
- **Raw ECDSA, not DER.** AdMob sends raw `r||s`; Node needs `dsaEncoding: "ieee-p1363"`
  or every genuine callback is rejected.
- **`user_id` / `custom_data` are attacker-controlled.** They are a lookup key, never
  authorisation. The security is entirely the signature.
- **Expiry in both directions** — a captured callback cannot be replayed an hour later
  or pre-dated.
- **A forged callback is kept, not dropped**: `status = 'rejected'`, `signature_ok = false`,
  with the reason, so an attack is a query rather than a log hunt.
- **`rewarded_ad` no longer grants.** P1's source value stays in the ledger for history,
  but the route releases only on `rewarded_ad_ssv`.

### Verified, not asserted

`npm run check:adssv` signs callbacks the way AdMob does and then attacks the verifier:
genuine / tampered payload / wrong key / replay / unpublished key id / re-encoded bytes.

The **wired** routes were also driven end to end against the live database with a locally
served key set: a forged claim with no nonce → `409`; a real claim → `202` pending; a signed
callback → `verified`; unlock → `201` with `source: "rewarded_ad_ssv"`; a replayed callback →
`already_verified`; and **a genuine nonce with a forged signature → `rejected`, file still
locked**. Every test row was deleted afterwards.

### What is still required for this to be live

1. An AdMob account and a **rewarded ad unit** (the callback names `ad_unit`).
2. **The SSV URL set in the AdMob console**, per ad unit: `https://<host>/api/ad-ssv`.
   Until it is set, AdMob never calls, every claim stays `pending` forever, and **no file
   can be unlocked by an ad**. That is the fail-closed direction, and the correct one.
3. `EXPO_PUBLIC_ADS_ENABLED=1` plus both app ids (the P0 wiring) for a build that can show ads.
4. `ADMOB_SSV_KEYS_URL` is **test-only** — it must never be set in production.
