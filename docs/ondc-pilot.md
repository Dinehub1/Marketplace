# ONDC Pilot — Scope, Economics, and Build Plan

> Status: proposal, not yet approved. Written 2026-08-15.
> Companion to `audit-and-business-model.md` and `research-verticals-and-design.md`.

## Two corrections to the earlier ONDC thinking

Before the pilot itself, two evidence-backed corrections that reshape the model:

**1. ONDC seller-app commission is 1–2%, not 8–12%.**
The entire premise of ONDC is unbundled, low commission: roughly **3–5% total** to the seller, split across buyer-app fee (1–2%), seller-app fee (1–2%), and payment gateway (0.5–1%). ONDC itself charges only a flat **₹1.5 per successful transaction above ₹250** — there is no network-level percentage commission. Sellers come to ONDC *specifically* to escape 20–30% marketplace rates, so a Hermes seller-app fee above ~2% is not sellable.

**Consequence:** commission-per-order cannot be the primary revenue engine at Hermes' scale. On a ₹1,200 home-services job, a 2% fee is **₹24** — about a quarter of the ₹100/lead the audit doc already plans to charge. Commission only works where average order value is high.

**2. "Home Services" is not a mature ONDC domain.**
ONDC's live domains are product-shaped: Food & Beverage, Grocery, Fashion & Footwear, Home & Kitchen / Home Decor, Beauty & Personal Care, Health & Wellness, Mobility, Agriculture, Financial Services. Paytm — the highest-volume buyer app — is operational in **Food, Grocery, and Home Decor**. Appointment-style local services (plumber, electrician, AC repair) do not have comparable live buyer-app demand.

**Consequence:** launching the pilot on Home Services (2,639 listings) would mean building a protocol adapter to receive demand that largely isn't flowing yet.

---

## Revised pilot: Interior / Furniture → ONDC Home Decor

Both corrections point to the same vertical, and it is *not* the one Home Services' listing count would suggest.

| | Home Services | **Interior / Furniture** |
|---|---|---|
| Listings (Indore) | 2,639 | **1,092** |
| Maps to live ONDC domain | No mature equivalent | **Home & Kitchen / Home Decor — Paytm live** |
| Typical order value | ₹800–1,500 | **₹5,000–25,000** |
| Hermes fee @2% | ₹16–30 — not viable | **₹100–500 — viable** |
| Catalog shape | Appointment/scope-based, hard to model | **Product SKUs — native fit for ONDC catalog** |

Interior/Furniture is already Tier 1 in `research-verticals-and-design.md` (flagged "high-ticket"). The high AOV is what makes a 2% fee survive, and the product-shaped catalog is what makes the ONDC integration tractable — `businesses` has no SKU/price fields today, and modelling a fixed product is far easier than modelling a variable-scope service job.

**Pilot scope: ~40 hand-picked Interior/Furniture businesses, Indore, one brand.** Not 1,092, and definitely not 22,581. Hand-picked because as SNP you are contractually responsible for catalog quality and fulfilment experience.

---

## Unit economics

Revenue per seller has two components — and the ratio between them is the whole point.

**Recurring:** ₹499/mo per seller (matches the existing `FEATURE_PRICE_INR` default and the audit doc's planned Pro tier) for catalog digitisation, ONDC presence, and the order dashboard.

**Transactional:** 2% seller-app fee, less ₹1.5 ONDC network fee per order.

At 40 pilot sellers:

| Scenario | Orders/seller/mo | AOV | Commission/mo | Subscriptions/mo | **Total/mo** |
|---|---|---|---|---|---|
| Conservative | 2 | ₹6,000 | ₹9,600 | ₹19,960 | **₹29,560** |
| Base | 5 | ₹8,000 | ₹32,000 | ₹19,960 | **₹51,960** |
| Optimistic | 10 | ₹10,000 | ₹80,000 | ₹19,960 | **₹99,960** |

**Read the conservative column carefully: subscription revenue is 2x commission revenue.** Until order volume is proven, Hermes is a SaaS business that happens to speak ONDC — not a commission business. Price and pitch it accordingly, and do not build financial plans that assume commission carries the model.

---

## Build phases

### Phase 0 — Make payments real *(hard prerequisite)*
An SNP is responsible for **dispersing payments to sellers**. Hermes cannot take that on with a payment stub.

- Integrate a real gateway (Razorpay is the standard India choice; nothing is installed today — `package.json` has only Supabase/Next/React).
- Wire the existing but unused `payments` table (`amount`, `currency`, `method`, `upi_ref`, `status`, `meta`).
- Replace the payment stub in `app/api/businesses/[id]/feature/route.ts` (the file's own comment reads `PAYMENT IS A STUB`) — this doubles as the smallest real test of the gateway.
- Build seller payout + reconciliation logic. This is the piece most likely to be underestimated.

### Phase 1 — Catalog layer
`businesses` is a directory row — free-text `category`, no price, no SKU, no inventory. ONDC needs a structured priced catalog.

- New migration `supabase/migrations/<ts>_ondc_catalog.sql` adding a `catalog_items` table: `business_id` (bigint, FK to `businesses`), `name`, `description`, `price`, `currency`, `unit`, `images`, `stock_status`, `ondc_category_code`, `active`.
- Map the 40 pilot sellers' inventory into it. **This is manual, ops-heavy work, not an engineering task** — budget real human hours.
- Extend the Phase 0 RLS pattern in `supabase/migrations/20260814000000_phase0_rls.sql` to the new table.

### Phase 2 — ONDC registration + Beckn adapter
- Register as a Network Participant with ONDC (legal/compliance track, runs parallel to engineering, has its own timeline).
- Build the seller-side protocol endpoints: `search / select / init / confirm / status / track / cancel / update` plus the corresponding `on_*` callbacks, signed per ONDC's crypto requirements.
- **Verify every contract detail against the current ONDC spec at build time** (`resources.ondc.org/tech-resources`, `github.com/ONDC-Official`) — protocol versions and domain codes move, so do not build from any summary including this one.
- Validate against ONDC's **Pramaan** conformance toolkit before requesting go-live.
- Reuse what exists: `db()` from `lib/nextel.ts` (PostgREST wrapper) for persistence, `sendTemplate()` for order-notification WhatsApp alerts to sellers, and `rateLimit()`/`clientIp()` from `lib/rate-limit.ts` on the public endpoints.

### Phase 3 — Seller operations
- Order dashboard for sellers (the existing `orders.tsx` is a hardcoded 3-row mock — this replaces it with real data).
- Order → WhatsApp alert, reusing the notification path already proven in `app/api/leads/route.ts`.
- Settlement/reconciliation view so sellers can see what they are owed.

### Phase 4 — Launch and measure
Run for a full quarter before drawing conclusions.

---

## Success criteria and kill conditions

Decide these *before* launch so the result can't be rationalised after the fact.

**Proceed to a second vertical if, by end of month 3:**
- ≥ 60% of the 40 pilot sellers renew the ₹499/mo subscription after their first paid month
- ≥ 3 orders/seller/month sustained through month 3
- Order defect rate (cancellations + fulfilment failures) < 5%

**Kill or rethink if:**
- Median orders/seller/month < 1 by month 3 → ONDC Home Decor demand isn't reaching Indore sellers; the channel doesn't exist yet regardless of execution quality
- Sellers won't pay ₹499/mo once the novelty passes → there is no SaaS business here, and commission alone (conservative case: ₹240/seller/month) will not sustain it
- Settlement/reconciliation consumes more ops hours than the revenue covers → the SNP role is structurally unprofitable at this scale

## Principal risks

1. **Demand-side thinness.** The pilot's core assumption is that Paytm-class buyer apps send meaningful Home Decor demand to Indore. This is unproven and is the single biggest risk. Mitigate by keeping Phase 0–1 useful even if ONDC fails: a real payment gateway and a structured catalog both serve the first-party monetisation roadmap regardless.
2. **SNP obligations exceed expectations.** Catalog digitisation, seller training, and payment dispersal are ongoing operational duties, not one-time integrations.
3. **Opportunity cost.** Hermes has zero first-party revenue today — every table in the monetisation path (`payments`, `subscriptions`, `bookings`) sits unused. Phase 0 alone would unlock the audit doc's existing pay-per-lead plan without any ONDC work at all. If engineering capacity is the binding constraint, **do Phase 0, ship first-party monetisation, and only then decide on ONDC** with real revenue data in hand.

## Sources

- [ONDC — Open Network for Digital Commerce](https://www.ondc.org/)
- [ONDC Network Policy](https://resources.ondc.org/ondc-network-policy)
- [ONDC Developer Guide / tech resources](https://resources.ondc.org/tech-resources)
- [ONDC-Official on GitHub](https://github.com/ONDC-Official)
- [ONDC Pramaan conformance toolbox](https://www.ondc.org/pramaan/toolbox.html)
- [ONDC to introduce nominal transaction fees from January 2025](https://sellersetu.in/blog/ondc-to-charge-fees)
- [ONDC explained: commissions, search rankings, ratings](https://www.medianama.com/2022/09/223-ondc-commissions-grievances-search-rankings-ratings/)
- [Top ONDC buyer and seller apps in India (2026)](https://www.shiprocket.in/blog/top-ondc-apps-in-india/)
- [How any seller can join the ONDC network (2026)](https://www.mystore.in/en/blog/how-any-seller-can-join-the-ondc-network-for-better-business-opportunities)
