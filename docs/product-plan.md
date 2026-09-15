# DropBy product plan — 28 products, one app, one database

Decision: the 28 directory brands are replaced by 28 **products** that do a job for a
normal person, 100% online, served from one database and one Expo app. Three of the old
brands survive because their data really is the product.

## What survives, and why

| Kept | Why |
|---|---|
| `sarkarhealth` | The doctor vertical was the one where the data answers the question. 23,992 real listings behind it. |
| `sarkarmarketplace` | The whole directory (24k businesses, categories, localities, galaxy). It is the SEO surface and the proof the data exists. |
| `sarkarcars` | Real car-service data, real categories, and a clear buyer. |

Everything else — finance, travel, legal, jobs, government, real-estate clones — is retired.
Not reskinned: retired. Sixteen identical "connecting people connecting businesses" pages
were one mediocre product wearing sixteen hats.

## The 28 products

Each product is: **one job, one screen, one price.** Camera-first where possible, because
that is what makes it an app rather than a website.

**Photo tools** (image AI — free tier)
1. Passport/visa photo maker — ₹49
2. Background remover — free / ₹99 pack
3. Product photo cleaner — ₹99/mo
4. Old photo repair — ₹99
5. Room redesign — ₹49/room
6. Signature & stamp maker — ₹49
7. Visiting card / ID maker — ₹199

**Documents** (local, ₹0)
8. PDF toolkit — free / ₹299/mo
9. Resume + ATS check — ₹499
10. Invoice / GST bill — ₹299/mo
11. Marksheet / certificate maker — ₹199
12. Worksheet & quiz generator — ₹199/mo

**Writing** (free text model)
13. Shop caption writer — ₹299/mo
14. Bio / Google listing writer — free / ₹199
15. Job application writer — ₹199
16. Hindi ↔ English document translation — ₹49

**Voice & audio** (local, ₹0)
17. Text to voice-over — ₹99/clip
18. Subtitles for reels — ₹49/video
19. Lecture/meeting → notes — ₹99/mo

**Small-business tools**
20. Digital visiting card — free / ₹199
21. Catalogue maker — ₹199/mo
22. Order form → invoice → payment link — ₹299/mo
23. Appointment booking page — ₹299/mo
24. Bill scanner + expense tracker — ₹199/mo
25. Attendance + fee tracker — ₹199/mo

**Traffic pulls** (free, built for search)
26. Study helper (photo of a question) — ₹99/mo
27. Resume keyword checker — free / ₹99
28. Reel/thumbnail cover maker — ₹399/mo

## Architecture — one of everything

- **One database**: the existing Supabase project (`xpfmqpmhmcouwzebfwhb`). The directory
  tables stay exactly as they are; products add their own tables beside them.
- **One app**: `apps/mobile` (Expo SDK 57, React Native, already on the VM and already
  rendering). Each product is a module with its own home screen, its own colour, its own
  single purpose. One build, 28 doors — not 28 apps to maintain, and not 28 websites.
- **One auth**: **WhatsApp OTP**, already implemented (`/api/otp/send`, `/api/otp/verify`,
  template id `auth` on the Nextel account). Phone number is the identity everywhere — web
  and app share the same session, because both talk to the same OTP table and the same
  signed phone token. No passwords, no password resets, nothing to remember.
- **One payment rail**: Razorpay, one wallet table, credits per product.
- **One file store**: Cloudflare R2 under `marketplace/`, already wired and proven
  (upload → public URL → row in `business_media`).

## New tables (nothing existing is touched)

```
products            one row per product: slug, name, tagline, icon, price, cost_model, enabled
product_jobs        one row per run: product, phone, input_key, output_key, status, error, ms
wallets             phone -> credits, balance_paise
orders              product, phone, amount_paise, razorpay_order_id, status, credits_granted
subscriptions       phone, product, plan, renews_at, status
app_users           phone -> profile (name, email, city), created_at, last_seen
```

`product_jobs` is the heart of it: every upload → output is one auditable row, so cost,
speed and failure are measurable per product from day one instead of guessed.

## Cost

| Path | Cost |
|---|---|
| PDF, subtitles, voice-over, translation, image cleanup | ₹0 — runs on the VM (pdfcpu, whisper, Piper, rembg) |
| Image generation | Free daily allowance now; Cloudflare Workers Paid (~$5/mo) when volume demands |
| Text | Free tier now, pay only when a product proves demand |

## Phases

| Phase | Scope | Gate |
|---|---|---|
| P0 | products table, product_jobs, wallets, orders, app_users; WhatsApp OTP login on web + app; app shell with product switcher | login works end-to-end on a real phone |
| P1 | **Passport photo maker** — web + app, paywall, R2 delivery | one real passport photo produced and paid for |
| P2 | Background remover, PDF toolkit, image toolkit | ₹0 cost per job measured in `product_jobs` |
| P3 | Room redesign, subtitles, voice-over, translation | app submission build (EAS) |
| P4 | Small-business six (card, catalogue, order loop, booking, bills, fees) | first paying shopkeeper |
| P5 | Remaining products + retire the 16 dead brands | 28 live, 3 kept |

## Rules that do not bend

1. No fake content — no invented testimonials, statistics, or "trusted by 10,000" claims.
2. A 200 is not evidence. Verify the actual output of a job, with a real file.
3. Never restart the web app after a failed build (`rc=$?`, not a piped exit code).
4. Every product must be usable by someone with no instructions.
