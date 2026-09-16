# Resources & APIs — what we use, what we need from you, and the fallback for each

Audited 2026-09-16 against `apps/web/.env` (read directly, so "EMPTY" below is literal),
and against the providers' own pricing pages.

## 1. Already in place — no ask, already working

| Resource | State | What it powers |
|---|---|---|
| Supabase `xpfmqpmhmcouwzebfwhb` | SET (service role, publishable, access token) | 44 tables, 24,043 businesses, `product_jobs`, orders |
| Cloudflare R2 (`cashcard-data-storage`) | SET (account, keys, public URL, `R2_PREFIX=marketplace`) | every product's input and output file |
| Cloudflare Tunnel | running | `sarkarmarketplace.`, `expo.`, `shots.`, `hermes.`, `dashboard.` |
| Nextel WhatsApp API | SET (key, endpoint, sender) | OTP + notifications — but see the template gap below |
| GeoGhost scraper | running (Windows task) | the directory's data supply |
| GitHub `Dinehub1/Marketplace` | SET, and **push works** | source of truth; 10 commits pushed today |
| This VM + pm2 | running | Next 16 site, worker, gallery, tunnel origins |

## 2. What I need from you — in this order, because this is the order of business impact

1. **Razorpay — 3 values.** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   (all literally EMPTY today). **Without these nothing can be sold**: the passport ₹49
   unlock, any subscription, any future product. Test keys are fine to start — they unlock
   the whole flow end-to-end and I can prove it with a `test_replay` order; live keys come
   after KYC (one-time ₹199 + GST). Economics: **2% + 18% GST ≈ 2.36% effective** on most
   domestic methods, no setup fee, no AMC; new merchants have a 0%-platform-fee offer
   (90 days / up to ₹5L).
2. **Cloudflare Workers AI token** — `CLOUDFLARE_AI_TOKEN`. One dashboard step (My Profile →
   API Tokens → Create → "Workers AI" template). Unlocks text, translation, speech-to-text,
   text-to-speech and image generation at 10,000 neurons/day free, then $11 per 1M neurons.
   Tested today with the R2 key: `code 10000 Authentication error` — it is a different token.
3. **Nextel WhatsApp template ids** (3): `NEXTEL_BOOKING_TEMPLATE`, `NEXTEL_LEAD_TEMPLATE`,
   `NEXTEL_BOOST_TEMPLATE` — EMPTY. WhatsApp only delivers *approved templates*; without an
   approved OTP template the login/OTP path cannot send a message, which is why the paywall
   can never finish. You approve these in the provider dashboard (category: authentication).
4. **Google Gemini API key** (free) — `GEMINI_API_KEY`. Our fallback text + vision provider:
   ~1,500 requests/day on Flash, no card. Protects us from a single-vendor outage.
5. **Groq API key** (free) — `GROQ_API_KEY`. Fallback for fast text, 30 RPM / up to 14,400
   requests/day, and it also serves Whisper transcription free.
6. **Apple Developer + Google Play + Expo** — needed only to *publish the 12 apps* you chose
   to keep separate. Apple $99/yr, Google $25 once, Expo/EAS account for builds. Until then
   the apps are web + Expo-Go only. Tell me when you want to start store work and I'll
   prepare everything that does not need the accounts (icons, screenshots, privacy text).
7. **Cloudflare API token with DNS + Tunnel edit** (optional) — lets me route
   `expo-dev.dropby.co.in → Metro` so the Expo Go QR survives restarts without me asking.

## 3. Fallback chains — so no single vendor can take a product down

Design: one server-side router (`lib/ai.ts`) tries the chain in order, with a per-provider
timeout and health check, and records which provider served each job in `product_jobs`.
Keys stay server-side, never in the app bundle.

**Built 2026-09-17 (queue item 17) and measured against the live services — four corrections
to the table, so nobody re-derives them:**
- **Search / `pg_trgm`:** the extension's functions are **not exposed** through this project's
  PostgREST (`POST /rest/v1/rpc/show_trgm` → `PGRST202`), so the router's search provider runs
  PostgREST `ilike` per word (`and=(or(name,category,area), …)`) and ranks the rows with its own
  trigram overlap. Verified: "plumber vijay nagar" → 4 rows ranked.
- **Text:** `@cf/qwen/qwen3-30b-a3b-fp8` answers 200, and its completion arrives as
  `result.choices[0].text` (not `result.response`) — the router reads both.
- **Text → speech:** `melotts` is **flaky** (500 `AiError 3043` twice in a row, then 200 with
  158 KB of MP3 minutes later); `@cf/deepgram/aura-1` answered 200 with real `audio/mpeg` for
  `{text}` and is now the chain's second entry, so one flaky model is not an outage.
- **Vision:** `@cf/meta/llama-3.2-11b-vision-instruct` returns **403 `Model Agreement`** until
  the model's licence is accepted once in the dashboard, and
  `@cf/moondream/moondream3.1-9B-A2B` cannot be called over JSON at all (`image` must be an array
  of *binary*; every JSON shape answers 400 and multipart is refused). Until that click happens
  the vision slot is `tesseract`, which is not installed — see queue item 35.

| Capability | Primary | Fallback 1 | Fallback 2 | Local / last resort |
|---|---|---|---|---|
| Text (writing products) | Workers AI `@cf/qwen/qwen3-30b-a3b-fp8` ($0.051/$0.335 per M) | Gemini Flash (free) | Groq (free, fastest) | `colibri` on this CPU (₹0) |
| Cheapest bulk text | `@cf/ibm-granite/granite-4.0-h-micro` ($0.017/$0.112) | Gemini Flash-Lite | Groq | template + rules, no model |
| Vision (bill scan, study photo) | Workers AI `llama-3.2-11b-vision` / `moondream3.1-9B` | Gemini Flash (vision) | — | `tesseract` OCR + rules (Apache-2.0) |
| Hindi ↔ English | `@cf/ai4bharat/indictrans2-en-indic-1B` ($0.342/M) | Gemini Flash | `@cf/meta/m2m100-1.2b` | LLM with a strict prompt |
| Speech → text | `@cf/openai/whisper` ($0.0005/audio min) | Groq whisper-large-v3 (free) | — | `whisper.cpp` on CPU |
| Text → speech | `@cf/myshell-ai/melotts` ($0.0002/audio min) | Deepgram aura-1/2 (CF, pricier) | — | `piper` (note: original repo archived; the maintained fork is GPL — decide before shipping) |
| Image generation | `@cf/black-forest-labs/flux-1-schnell` (≈$0.0005/image) | flux-2-klein / SDXL-lightning (CF) | Gemini image (paid) | none on 8 GB CPU — park the product instead |
| Cut-out / segmentation | local `rembg` (MIT) | local OpenCV grabcut | — | — |
| Search & similarity | Supabase `pg_trgm` (already installed) | Workers AI `bge-m3` embeddings ($0.012/M) | — | LIKE queries |
| Payments | Razorpay (2.36% effective) | Cashfree / PayU (Indian) | manual UPI QR on the invoice (already designed) | — |
| Messaging | Nextel WhatsApp | WhatsApp Cloud API direct (Meta) | MSG91 SMS | email |
| Maps / geo | OSM + OSRM self-hosted (free) | Mapbox free tier | Google Maps (paid) | static distance tables |
| Analytics | Cloudflare Web Analytics (free) | self-hosted Plausible | pm2 logs | — |
| Errors | Sentry free tier | pm2 logs + `/log` page | — | — |
| App builds | local `expo export` (web) | EAS Build (account needed) | prebuild + local toolchain | — |
| Email | Resend free (3k/mo) | Brevo free (300/day) | our own SMTP | — |

## 4. What this means commercially

- **Cost of goods ≈ ₹0-1 per sale** on the AI products once the free tiers are used:
  a ₹99 voice-over is ~₹0.07 of TTS; a ₹399/mo cover-maker is ~₹0.9/month of images; a
  ₹49 translation is a fraction of a paisa of tokens.
- The real cost in India is **payments (2.36%)**, not AI. That is why the Razorpay keys are
  worth more to this business than any model.
- Every capability above has at least one path that costs ₹0, so no vendor outage and no
  bill can stop the products working — that is what "fallback" buys us here.
