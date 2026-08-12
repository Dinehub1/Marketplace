# Research: Which Verticals to Launch, and How to Rebuild the UI

Researched 2026-08-12. Category numbers are from your live Supabase (385 categories, 22,580 listings,
Indore only). Market and pricing figures are sourced and linked at the bottom.

---

## Part 1 — Timing: the window is open right now

Today is **12 August 2026**. The Indian festive run this year:

| Date | Event | What starts selling |
|---|---|---|
| 28 Aug | Raksha Bandhan | Gifting, sweets |
| 14 Sep | Ganesh Chaturthi | Decor, catering, event lighting |
| **~15 Sep** | **Pre-Diwali marketing starts** | Home services book out |
| 11–20 Oct | Navratri → Dussehra | Painting, cleaning, furniture |
| **6 Nov** | **Dhanteras** | Single biggest buying day of the Indian year |
| **8 Nov** | **Diwali** | Peak |
| Nov 2026 – Feb 2027 | Wedding season | Highest-ticket leads of the year |

**2026 is a late-Diwali year** — an *adhik maas* (leap month) pushed the whole season ~3 weeks later
than 2025. That is a gift: you get **~5 extra weeks of runway** before businesses start spending.

Indian businesses buy marketing 6–8 weeks ahead of the peak. That means the money conversation
starts **mid-September**. You have about **five weeks** to make the lead loop work.

The Diwali demand order, in sequence:

1. **Home deep-clean, pest control, painting** — the pre-Diwali cleaning ritual. Peak 15 Sep – 25 Oct.
2. **Furniture, interiors, modular kitchen, appliances** — peak 1 Oct – 8 Nov, spiking on Dhanteras.
3. **Salon, spa, beauty, makeup** — peak 15 Oct – 10 Nov, then again all wedding season.
4. **Sweets, catering, gifting** — 25 Oct – 10 Nov.
5. **Wedding vendors** — Nov through Feb.

---

## Part 2 — Top services to monetize, ranked

Ranked by **inventory × lead value × seasonal fit**. All counts are live.

### Tier 1 — start here

**1. Home Services — 2,639 listings across 34 categories. Best overall.**

| Category | Listings | Category | Listings |
|---|---|---|---|
| Electrician | 241 | Appliance repair | 145 |
| Plumber | 235 | Painting contractor | 147 |
| Carpenter | 210 | Glass shop | 137 |
| AC repair (`AC Repair` + `air conditioner repair`) | **271** | Tile installer | 136 |
| Water purifier service | 192 | Cleaning service | 94 |
| Pest control | 160 | Plumbing service | 62 |

Highest inventory, highest purchase intent, and it peaks exactly now. A plumber job is ₹800–3,000, so
a lead converting 1-in-4 is worth ₹200–750 — **price it at ₹100 and it's an instant yes.**

**2. Interior & Furniture — 1,092 listings. Highest ticket size.**

Furniture Store 196 · interior decorator 140 · sanitaryware 99 · kitchen cabinet maker 88 ·
Interior Designer 87 · interior painting 69 · interior fitout 52 · wooden furniture mfr 34 ·
curtain shop 21 · **modular kitchen 12**.

A modular kitchen is a ₹1.5–4 lakh purchase. **That lead is worth ₹2,000+, not ₹100.** Note you only
have 12 modular kitchen listings — thin inventory on your most valuable category. Scrape more.

**3. Beauty & Wellness — ~729 real listings. Best repeat-revenue profile.**

Salon 94 · makeup artist 100 · nail salon 64 · cosmetic clinic 62 · beauty spa 45 · body massage 45 ·
laser hair removal 44 · beauty parlour 37 · hair stylist 28 · skin clinic 21 · facial spa 16 ·
beauty salon 13 · (plus cosmetics store 119, yoga studio 54, Gym 103).

> Careful: a naive `spa` text match also catches "coworking **spa**ce" (123) and "bike **spa**re
> parts" (72). The real beauty count is ~729, not 985.

The Indian beauty salon market is **USD 10.8bn** and the spa segment is growing at **9.28% CAGR** —
but the reason to pick this vertical is structural: **salons re-buy every month**, unlike a plumber
who wants leads only when he's idle. And `makeup artist` (100) is your bridge into wedding season.

### Tier 2 — real, but not first

- **Health — 2,559 listings.** Your single biggest cluster (physiotherapy 234, hospital 228,
  orthopedic 201, psychology 192, dental 191, oncology 190). **Do not run a lead auction on
  healthcare.** Selling "priority placement" on `oncology centre` is both an ethical problem and an
  advertising-code problem. Monetize this as a **flat clinic profile + appointment subscription**,
  never pay-per-lead, never ranked by who paid.
- **Education — 1,150.** Strong Indian spend, but the season is April–June. Revisit in Feb.
- **Auto — 1,695.** Car insurance agent 138 is genuinely high-value. Bike/car service ~290. Second wave.

### Tier 3 — skip

Food (Zomato/Swiggy own the intent), real estate (99acres/MagicBricks), generic B2B (IndiaMART).
You will not win these with a directory.

---

## Part 3 — The biggest finding: you have no wedding vertical

I probed the 385 categories for wedding and festive vendors. Results:

| Category | Status | | Category | Status |
|---|---|---|---|---|
| Photographer | ❌ **MISSING** | | Florist / flowers | ❌ **MISSING** |
| Videographer | ❌ **MISSING** | | Tent house | ❌ **MISSING** |
| Wedding planner | ❌ **MISSING** | | DJ / band | ❌ **MISSING** |
| Mehendi / henna | ❌ **MISSING** | | Pandit / priest | ❌ **MISSING** |
| Invitation / card printing | ❌ **MISSING** | | Resort / farmhouse | ❌ **MISSING** |
| Saree / lehenga | ❌ **MISSING** | | Tailor | ❌ **MISSING** |
| Gold / silver jeweller | ❌ **MISSING** | | Barber | ❌ **MISSING** |

What you *do* have is thin: event venue 67, event lighting rental 64, catering service 41,
lunch catering 112, event management company 18, banquet restaurant 16, jewellery shop 61.

**Indian wedding vendors are the highest-ticket local lead in the country.** A wedding photographer
books ₹40k–2L per wedding; a venue books ₹3–15L. A single qualified lead is worth **₹2,000–10,000** —
20 to 100 times a plumber lead. And the season starts in **12 weeks**.

You already have the scraper (`scripts/import-geoghost.mjs`). **Scraping these ~15 categories in the
next two weeks is the highest-ROI two weeks available to you**, because nobody in Indore has indexed
them properly and the SEO needs 6–8 weeks to rank before the season.

---

## Part 4 — Which "branches" to create (fewer, not more)

You have 27 brands. `brand_id` is null on **99.4%** of listings, so 26 of them display zero listings.
More brands is the wrong direction — each one splits your SEO authority and multiplies maintenance.

`lib/brand-categories.ts` already maps keywords → brand without needing `brand_id`. Use that. Run
**four** clusters, and only promote one to its own subdomain once it earns money:

| Branch | Categories | Listings | Model | Season |
|---|---|---|---|---|
| **Ghar** (Home + Interior) | Home services + furniture/interior | **3,731** | Pay-per-lead + Featured | **Now → Nov 8** |
| **Wellness** (Beauty/Spa/Fitness) | Salon, spa, makeup, gym, yoga | **~1,024** | Monthly subscription | Oct → Feb |
| **Shaadi** (Wedding) ⭐ NEW | Photographer, venue, catering, makeup, decor | **~320 → scrape to 1,500** | High-ticket per-lead | Nov → Feb |
| **Health** (Clinics) | All clinical | **2,559** | Flat profile subscription only | Year-round |

Park the other 23 brands. They are costing you SEO and giving nothing back.

---

## Part 5 — WhatsApp vs SMS: don't switch, fix

You said WhatsApp is broken and suggested moving to SMS. **WhatsApp is not broken — one line of
filesystem code is.**

`lib/keyLoader.js:7` does `fs.readFileSync('C:/Users/Administrator/hermes-web/.env')`. `lib/nextel.ts`
calls it on every `phoneToken()` and every `db()`. So `/api/leads` and both `/api/otp/*` throw on any
non-Windows host. **That is a ~3-line change to `process.env.SUPABASE_SERVICE_ROLE_KEY`** — and it is
why your `leads` table has 0 rows.

And the economics favour keeping WhatsApp:

| | WhatsApp (Meta auth template) | SMS OTP (India) |
|---|---|---|
| Per message | **₹0.115 + 18% GST = ₹0.136** | ₹0.10–0.20 (MSG91 ~₹0.15) |
| Setup cost | ₹0 (BSP account) | **₹5,900 PE + ₹5,900 header = ₹11,800** |
| Setup time | Already done | **2–4 weeks** DLT + template approval |
| Delivery receipts | Yes | Weak |
| Can deliver the *lead* to the business | **Yes** | No |
| Open rate | ~95% | ~20% |

**Switching to SMS to fix a filesystem bug would cost ₹11,800 and a month, and hand you a worse
channel.** WhatsApp is also the only channel that can deliver the actual lead to the business owner —
which is the product you're selling.

**Recommended plan:**

1. **Today:** fix `keyLoader.js` → `process.env`. Turns the whole pipeline back on.
2. **Also today:** `/api/otp/send:28-30` returns `{ok: true, delivered: false}` when delivery fails —
   it lies to the user. Make it return an error or trigger the fallback.
3. **Week 2:** add **MSG91 as a fallback**, not a replacement. Add `channel` to `otp_codes`; try
   WhatsApp, fall back to SMS if no delivery confirmation in ~20s. Roughly 5–8% of Indian users don't
   have WhatsApp on the number they enter — that 5–8% is currently a hard failure.
4. **Start DLT registration now in parallel.** It takes weeks and you'll want it regardless.
5. **Rotate the Nextel key** committed at `app/api/wa-test/route.ts:15` and
   `supabase/functions/whatsapp-otp/index.ts:21`, then delete `/whatsapp-test`.

---

## Part 6 — UI: what's wrong, and the redesign

I ran the site on desktop and at 375px and audited it against Apple's fluid-interface and design
principles. The information architecture is sound. The surface is dated and, more importantly, **not
scannable** — and scannability is the entire job of a directory.

### What's wrong

**1. The header is a flat grey slab.** An opaque `#6b7280`-ish bar with a green wordmark on it —
green-on-grey fails contrast — consuming 68px of the most valuable mobile real estate to show a logo
and a hamburger. Apple's rule is a **translucent material with content scrolling underneath**, and a
soft scroll-edge fade instead of a hard divider.

**2. Every listing looks identical.** Same generic icon, same `★ 5`, same green button. On
`/plumber-in-indore` all 235 results are visually interchangeable. There is nothing to scan.
- The fix is **photos**, and you already have them: the source CSVs carry `image_url` and
  `image_path`, and `scripts/import-geoghost.mjs` **throws both away**. Re-import with images and the
  page transforms.

**3. `★ 5` on every card reads as fake.** Sort is `rating.desc.nullslast` and 64% of ratings are null,
so page 1 is nothing but 5.0s. Without a review count next to it (`reviews_count` — also dropped by
the importer) a bare "5" carries no information and actively erodes trust.

**4. Three call-to-actions for one phone number** on the detail page: the hero button, the details
row, and the sticky bottom bar. Pick one primary.

**5. The phone number is used as the button label.** `08085079682` is not a verb. The label should be
**Call now**; the number belongs underneath as secondary text.

**6. "No phone listed" renders as a full-width disabled button** — 27% of your listings burn their
primary action slot to say nothing. Show a WhatsApp-enquiry CTA there instead. That's a monetizable
slot, not dead space.

**7. Gradient fills and heavy drop shadows.** Reads as 2015. Solid fills, tighter shadows.

**8. No press feedback anywhere.** Apple's first principle is respond on *pointer-down*, not on
release. Nothing here responds at all.

**9. No dark mode**, and no `prefers-reduced-motion` handling.

**10. A floating dark "N" widget collides with the sticky Call button** at the bottom-left on mobile.
That's a live bug covering your primary CTA.

**11. Uniform letter-spacing at every size.** Large headings need negative tracking (`-0.02em`); body
sits near `0`.

### The redesign — concrete specs

**Tokens**

```css
:root {
  /* One green, used with intent — not as a gradient */
  --brand:        #157347;
  --brand-press:  #0f5434;
  --bg:           #fbfbfd;
  --surface:      #ffffff;
  --text:         #1c1c1e;
  --text-2:       #6e6e73;
  --hairline:     rgba(0,0,0,.08);
  --radius:       14px;
  --shadow-card:  0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.05);
}
@media (prefers-color-scheme: dark) {
  :root { --bg:#000; --surface:#1c1c1e; --text:#f5f5f7; --text-2:#98989d;
          --hairline:rgba(255,255,255,.12); --brand:#30d17a; }
}
```

**Typography** — system font first; it already ships optical sizing and tracking tables.

```css
body   { font: 400 17px/1.47 -apple-system, system-ui, "Segoe UI", sans-serif; }
h1     { font-size: clamp(1.75rem, 5vw, 2.5rem); line-height: 1.08; letter-spacing: -.022em; font-weight: 700; }
.card-title { font-size: 1.0625rem; line-height: 1.3; letter-spacing: -.01em; font-weight: 600; }
.meta  { font-size: .8125rem; letter-spacing: .002em; color: var(--text-2); }
```

**Header** — translucent material, content scrolls under, scroll-edge fade not a border:

```css
.header {
  position: sticky; top: 0;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid transparent;              /* appears only once scrolled */
  transition: border-color 200ms ease, background 200ms ease;
}
.header[data-scrolled] { border-bottom-color: var(--hairline); }
@media (prefers-reduced-transparency: reduce) {
  .header { background: var(--surface); backdrop-filter: none; }
}
```

**Listing card** — the unit that matters. New hierarchy, top to bottom:

```
[ 88×88 photo ]  Business name                        ← 17px/600, tight tracking
                 ★ 4.6 (128) · Plumber · Bijalpur     ← one 13px meta line: rating+COUNT, category, locality
                 Open now · Responds in ~10 min       ← trust signals you can actually earn
                 [ Call now ]  [ WhatsApp ]           ← verb labels; number secondary
```

Rules:
- **Never show a bare `★ 5`.** Show `★ 4.6 (128)` or show nothing. Re-import `reviews_count` first.
- Locality (`localityOf()` already exists in `lib/categories.ts`) beats the full postal address.
- Photo is not decoration — it is the primary scanning affordance.

**Press feedback** — instant, on pointer-down (Apple §1):

```css
.btn { transition: transform 100ms ease-out, background-color 100ms ease-out; }
.btn:active { transform: scale(.97); background: var(--brand-press); }
@media (prefers-reduced-motion: reduce) { .btn:active { transform: none; } }
```

**Motion** — critically damped by default; bounce only after a real gesture.

| Interaction | Spring | Value |
|---|---|---|
| Sheet / filter drawer | damping `0.8`, response `0.3` | it was dragged — bounce is earned |
| Card → detail transition | damping `1.0`, response `0.4` | no overshoot |
| Button press | 100ms ease-out, `scale(.97)` | on pointer-**down** |
| Anything gesture-driven | spring, not CSS transition | must be interruptible mid-flight |

Filter and sort sheets must be **draggable and interruptible** — grabbable mid-animation, tracking
1:1 with the finger, with velocity handed off on release and rubber-banding at the edges. That single
interaction is what will make this feel like an app rather than a web page.

**Fix immediately regardless of the redesign:**
- Move or remove the floating "N" widget — it covers the sticky Call button.
- `/categories` ships **781 KB of HTML** in one response. Paginate or group it.
- Add `prefers-reduced-motion` and `prefers-color-scheme` support.

---

## Part 7 — Sequenced plan

**Weeks 1–2 — unblock and stock up (before any design work)**
1. Fix `lib/keyLoader.js` → `process.env`. *The lead pipeline comes back online.*
2. Re-import with `image_url`, `image_path`, `reviews_count` (three fields the importer currently
   drops). *This is the prerequisite for the whole redesign.*
3. Scrape the ~15 missing wedding categories. *12 weeks to season; SEO needs 6–8 to rank.*
4. Add the event/analytics table — you cannot sell what you cannot measure.
5. Rotate the committed Nextel key; delete `/whatsapp-test`.

**Weeks 3–4 — rebuild the two pages that matter**
Category landing + business detail, to the spec above. Nothing else. These are 95% of your traffic.

**Week 5 — SMS fallback + claim flow**
MSG91 fallback behind WhatsApp; claim-your-listing via the existing OTP endpoints.

**Weeks 6–8 — sell into the Diwali window**
Home Services and Interiors first, manually: WhatsApp the leads, collect by UPI, ₹100/lead. No
payment integration needed to validate. Featured slots at ₹1,999/mo in the 6 categories with real
traffic.

**Nov onward — Shaadi**
Wedding vertical live with the scraped inventory, at ₹2,000+/lead.

---

## Sources

- [SMS OTP Pricing in India 2026 — Message Central](https://www.messagecentral.com/en-in/blog/sms-otp-pricing-india)
- [Best OTP SMS Providers in India 2026 — MessageBot](https://messagebot.in/blog/best-otp-sms-providers-in-india/)
- [MSG91 Pricing India — productgrowth.in](https://productgrowth.in/tools/engagement/msg91/)
- [WhatsApp Business API Pricing in India 2026 — MyOperator](https://myoperator.com/blog/whatsapp-business-api-pricing-india-2026)
- [WhatsApp API Pricing India Rate Card — Whautomate](https://whautomate.com/whatsapp-business-api-pricing-india)
- [Diwali 2026 Dates — Diwali.info](https://diwali.info/diwali-dates)
- [India Public Holidays & Festivals 2026 — Eskimo](https://www.eskimo.travel/en/blog/india-public-holidays)
- [India Beauty Salon Market (USD 10.8bn) — Ken Research](https://www.kenresearch.com/industry-reports/india-beauty-salon-market)
- [India Spa Market, 9.28% CAGR — IMARC](https://www.imarcgroup.com/india-spa-market)
- [Indian Salon Landscape — IBEF](https://www.ibef.org/research/case-study/styling-india-s-growth-the-indian-salon-landscape)
