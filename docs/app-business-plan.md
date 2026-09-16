# DropBy app portfolio & business plan

Question answered: **yes, separate apps on Play and App Store — but built from ONE
codebase.** One repository, one database, one login; each store listing is a different
build target (its own name, icon, bundle id, screenshots). That is the only sane way to run
a portfolio: 28 separate repos would be 28 times the maintenance for the same product.

## Hard constraint worth knowing before we plan

Google Play and the App Store both reject **repetitive, near-identical apps** (`Spam and
Minimum Functionality` / `4.3 Spam`). Twenty-eight apps that are the same shell with a
different icon will get the account flagged, not 28 approvals. So apps are grouped by
**genuine use case**, and each store listing is a product a stranger would search for by
name. Everything else lives inside a Toolbox app.

## The portfolio

**Tier 1 — standalone apps** (distinct intent, searched for in stores, worth their own listing)
| App | Store search intent | Price |
|---|---|---|
| **Passport Photo Maker** | "passport photo", "visa photo", "id photo" | ₹49 per sheet, ₹199/mo unlimited |
| **PDF Toolkit** | "pdf merge", "pdf compress", "sign pdf" | free + ₹299/mo |
| **Room Redesign** | "room design", "interior ideas", "home decor ai" | ₹49/room, ₹499/mo |
| **Subtitles & Voice-over** | "subtitles", "captions", "text to speech" | ₹49-99 per file |
| **Resume Builder** | "resume maker", "cv maker", "ats resume" | ₹499 one-time |
| **Shop Toolkit** (card, catalogue, orders, invoices, booking) | "business card maker", "invoice maker", "catalogue" | ₹299/mo |

**Tier 2 — the Toolbox app** (thin utilities that would be rejected alone)
Background remover · signature maker · visiting card · old photo repair · bill scanner ·
attendance & fees · worksheet generator · translation · study helper · resume checker ·
cover maker · image tools.

**Tier 3 — directory apps** (data already exists, 24k listings)
SarkarHealth · SarkarMarketplace · SarkarCars — same app shell, city-directory intent.

## Games: traffic engines, not products

Three small games, built with the same Expo codebase (React Native + Skia/Reanimated — no
separate engine needed), each with a rewarded-ad loop:

1. **Tap Sprint** — a 30-second reaction/reflex game. Rewarded video = extra lives.
2. **Word Duel** — 60-second word puzzle. Rewarded video = hint pack.
3. **Block Clear** — an untimed 8×8 block puzzle. Rewarded video = a fresh tray that
   fits the board. The only one of the three with no clock, so it is the one a player
   can put down mid-round; that is also its listing.

**Why games are worth building here (and what they are NOT):** they are not the business.
Hyper-casual ad revenue is thin and needs volume. Their job is to **buy installs cheaply via
organic store search and convert that attention into tool customers** — because the same
phone OTP login follows the user across every app in the portfolio, so a game install is a
known user we can serve a real product to.

## Monetisation

| Stream | Mechanism | Notes |
|---|---|---|
| Tool payments | Razorpay, per product | ₹49-499 one-time; ₹299-499/mo subscriptions |
| Rewarded video | AdMob | user watches ad -> gets one free tool credit. Best converter we have. |
| Interstitial | AdMob, capped | after a completed job, never mid-task |
| Banner | AdMob, game + tool screens | lowest value, lowest intrusion |
| Cross-promotion | in-app house ads | game screen -> "make a passport photo free" |

**Ad economics — sourced, not guessed (2026 benchmarks):**

| Format | eCPM | Source |
|---|---|---|
| Rewarded video, global average | **$8.00–$18.00** | Google AdMob support benchmarks |
| Rewarded video, APAC Android | **~$8.20** | Mistplay mobile eCPM data |
| Interstitial, global average | **$2.50–$5.00** | Google AdMob support benchmarks |
| Hyper-casual game, monthly (low mix) | ~$60 | MonetizeMore (conservative, non-Tier-1 mix) |
| Hyper-casual game, monthly (Tier-1 mix >40%) | up to ~$2,850 | MonetizeMore |

At ~$8 rewarded eCPM, **1,000 rewarded views ≈ $8 (₹700)** — and a rewarded view is what we
trade for one free tool credit. So the ad is not the product; it is the *payment method* for
a user who will not pay cash, and it converts to a cash customer on their second job.

We still log every impression and every job from day one, because our own India traffic mix
will decide the real number. Plan from measured data by week two.

## The funnel that stops traffic being wasted

```
store search / share  ->  GAME install (free)  ->  rewarded ad or cross-promo
                                                   |
                                                   v
                            "free tool credit"  ->  TOOL app install
                                                   |
                                                   v
                            real job done (₹0 cost) ->  paywall for the next one
                                                   |
                                                   v
                                 subscription (₹299-499/mo)
```
Every step is the same phone login, so nothing is anonymous and nothing is wasted.

## What each store needs (per app, not per account)

- **Google Play**: one-time $25 developer account; then per app: listing, feature graphic,
  icon set, screenshots, privacy policy URL, Data Safety form, content rating, target API
  level, and ad-SDK disclosure.
- **Apple**: $99/year developer account; per app: App Store Connect listing, screenshots per
  device size, privacy nutrition labels, App Privacy details, review (stricter on ads and on
  apps that are "thin").
- **AdMob**: one account, one ad unit per placement, `app-ads.txt` published on the domain,
  and `children's policy` answered honestly.

## Phases

| Phase | Deliverable | Gate |
|---|---|---|
| A | One codebase, **two build targets** (Passport Photo + Toolbox), AdMob wired, `ad_events` table | a real install on a real phone, a real ad shown, a real payment |
| B | Pdf Toolkit + Room Redesign targets; game #1 live | 100 installs, measured eCPM |
| C | Game #2, cross-promo matrix between all apps, Resume + Shop Toolkit | first 10 paying users |
| D | Directory apps + retire the 16 dead brands | revenue per install known per app |

## Honest risks

1. **Store rejection for repetition** — the reason the portfolio is grouped by use case.
2. **Ad revenue is a slow burn** — a game needs tens of thousands of installs before ads
   pay anything meaningful; the tools earn sooner.
3. **Review latency** — each app and every update waits on review; bugs cost days.
4. **This is a portfolio, not a lottery ticket** — five good apps beat twenty-eight rushed ones.
