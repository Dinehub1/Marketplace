# Architecture — what connects to what

Read from the code on 2026-09-17. Every claim below names the file that makes it true.
This is the wiring diagram, not the business plan (that is `app-business-plan.md`) and not
the VM tidy-up (that is `hermes-architecture-audit.md`).

---

## 1. The one-line model

**One Next.js server and one Supabase project are the backend. Everything else is a
deliverable that talks to them.**

- Deliverable A — **28 brand websites** on one multi-tenant Next.js router (`apps/web`).
- Deliverable B — **19 Expo store apps** built from one codebase (`apps/mobile`), selected
  by `APP_TARGET` at build time.
- Both read the **same `businesses` table** and share **`@hermes/core`** for the logic that
  must not disagree between them.

```
                       ┌──────────────── Cloudflare tunnel ────────────────┐
                       │                                                   │
  *.dropby.co.in ──────┤ dashboard./admin. ──► :8080  marketplace (Next 16) │
  *.cashcard.live      │ hermes.          ──► :9300  hermes-dashboard     │
  (brand subdomains)   │ expo.            ──► :8091  expo-preview (SPA)   │
                       │ shots.           ──► :8092  shots-gallery        │
                       └───────────────────────────────────────────────────┘
                                          │
                     ┌────────────────────┼─────────────────────┐
                     ▼                    ▼                     ▼
              Supabase (Postgres)   Cloudflare R2        Third parties
              + Auth + Edge Fns     (object storage)     Nextel / Razorpay
                     ▲                                       /Workers AI /Gemini/Groq
                     │                                            ▲
   ┌─────────────────┴──────────────────┐                        │
   │                                    │                        │
19 Expo apps ──► PostgREST (publishable) └──► :8080 /api/* ───────┘
   │                                                  │
   └──► https://sarkarmarketplace.dropby.co.in/api/*  └──► :8099 worker.py (rembg, Pillow, pdfcpu)
```

---

## 2. Web: 28 brands, one router

There is **one** Next app. Brands are rows, not deployments.

| Step | File | What it does |
|---|---|---|
| Host → brand slug | `apps/web/proxy.ts` | Next 16's `proxy` (the renamed middleware). A request to `<brand>.dropby.co.in` is rewritten to `/brand-router/<brand>` with the original path carried in `?__brand_path=`. Base domains: `dropby.co.in`, `cashcard.live`. |
| Brand row | `apps/web/lib/brands.ts` | `getBrand(slug)` reads the `brands` table. Theme, feature flags, SEO, page content all live on that row. |
| Page selection | `apps/web/app/brand-router/[brand]/page.tsx` | A long if-chain over `__brand_path` → dynamically imports the page component. One router, ~35 page modules. |
| Category routes | `apps/web/lib/brand-sitemap.ts` + `lib/brand-categories.ts` | `/<category>-in-indore` and `/<category>-in-<area>` resolve to real listings; per-brand aliases (`/doctors`) resolve onto categories. |
| Data | `apps/web/lib/categories.ts`, `lib/supabase/server.ts` | Reads `businesses` via the publishable key with RLS, or the service role for ops tables (`lib/agentos.ts`, `lib/nextel.ts` → `db()`). |

**Which brand owns which listings is a keyword match, not a foreign key.** A business can
appear on a vertical brand *and* on the marketplace, which a single `brand_id` column cannot
express — so `BRAND_CATEGORY_KEYWORDS` in `apps/web/lib/brand-categories.ts` matches
substrings against `businesses.category` at query time. A brand with no entry (the
marketplace, sarkarbazaar) deliberately shows everything.

**Special hosts** (`proxy.ts`): `dashboard.`/`admin.` are the admin console, `hermes.` is
proxied to the Hermes dashboard on `:9300`, `/api/*`, `/unlock/*` and `/sites/*` bypass the
brand router entirely.

**Session sharing:** the Supabase auth cookie is scoped to the base domain
(`lib/base-domains.ts` → `cookieDomainForHost`), so signing in on one brand signs you in on
all 28. That is why `base-domains.ts` must stay free of server-only imports — the browser
client imports it too.

---

## 3. Mobile: 19 store apps, one codebase

`apps/mobile/targets.mjs` is the single source of truth for all 19 identities (name, bundle
id, colour, ASO keywords, permissions, products, first screen, directory scope).

| Step | File | What it does |
|---|---|---|
| Pick the app | `app.config.ts` | `APP_TARGET=sarkarhealth` resolves the target and derives name, bundle id, icon path, permissions, splash and first route. Unknown id throws at config time. |
| Tell the app | `app.config.ts` → `extra.target` | The resolved identity is serialised into `expo.extra`. |
| Read it back | `lib/target.ts` | `TARGET` at runtime, with normalisation for Expo's `{}`-for-`null` serialiser quirk. |
| Gate the fleet | `scripts/check-targets.mjs`, `scripts/check-fleet.mjs` | Refuse a build where two listings are too alike (Apple 4.3 / Play spam), or where art, route or bundle id is missing. |

**Targets split into four families** (`familyOf` in `targets.mjs`): `wellness` (6 single-screen
apps), `product` (5, one leads with its own screen), `directory` (3), `game` (4).

### What each family connects to

| Family | Talks to | Where |
|---|---|---|
| Directory (3 apps) | Supabase PostgREST **directly** — a hand-rolled client, not supabase-js | `lib/api.ts`. The filter comes from `scopeForBrand(target.id)` in `@hermes/core`, resolved at runtime in `lib/target.ts` and compiled into the PostgREST `or=`/`and=` expression — so SarkarHealth lists doctors and SarkarCars lists garages instead of all three listing the same 24,048 rows, and the answer cannot drift from the brand websites'. |
| Wellness (6 apps) | Supabase PostgREST directly, off-line-first | `lib/wellness-db.ts` + `lib/session.ts`. Identity is a per-install token sent as `x-wellness-token`; only its SHA-256 is stored (`supabase/migrations/20260917000000_wellness_sync.sql`). AsyncStorage holds the cache, the pending-write queue and the token; the database holds sessions and daily counts. |
| Product + tools | The **web** app's `/api/job` | `lib/tools.ts` → `jobEndpoint()`. On device it is `${WEB_BASE_URL}/api/job`; on web export it is the relative `/api/job`. |
| Business owner screens | The **web** app's `/api/otp/*` | `lib/owner.tsx`. No second auth system: the app is a client of the website's WhatsApp OTP endpoints and stores the returned phone token. |
| All | `WEB_BASE_URL` | `lib/config.ts`, default `https://sarkarmarketplace.dropby.co.in`. The phone can only reach the web app through this. |

Games, timers and the invoice counter are entirely on-device (`lib/block-clear.ts`,
`lib/merge-tiles.ts`, `lib/timer-core.ts`, `lib/invoice-counter.ts`); both games and the
timer have pure-logic gates (`scripts/check-block-clear.mjs`,
`scripts/check-merge-tiles.mjs`, `scripts/check-timer.mjs`).

---

## 4. Shared code — what is deliberately shared, and what is not

| Package | Contents | Consumed by |
|---|---|---|
| `@hermes/core` | Slugs, category paths, `cleanBusinessName`, `titleize`, `telHref`/`waHref`, `formatCount`, the pdfcpu page-range grammar, bill-number arithmetic, and **brand→category ownership** (`brand-scope.ts`) | web **and** mobile |
| `@hermes/tokens` | Colours **generated** from `apps/web/app/globals.css` by `packages/tokens/scripts/extract.mjs` | mobile only (web is the source, not a consumer) |

Components are **not** shared. `BusinessCard` exists twice on purpose (README §"What is
actually shared"): the web UI uses `backdrop-filter`, `:hover`, `prefers-reduced-motion` and
fluid `clamp()` type that `react-native-web` cannot express.

Transports are **not** shared either — `@hermes/core` contains nothing that fetches, because
the web's caching strategy (`next: { revalidate }`) is meaningless on a phone.

**`brand-scope.ts` is the load-bearing one.** It answers "which business listings belong to
which brand", and both surfaces must never answer it differently:

- the web asks `categoriesForBrand()` / `brandPublishesDirectory()` to decide which
  `/<category>-in-indore` pages a brand site publishes;
- the mobile directory apps ask `scopeForBrand()` at runtime for the PostgREST filter that
  narrows the feed to their slice.

It is keyword-based against `businesses.category` rather than a `brand_id` foreign key,
because a business must appear on its vertical brand *and* on the marketplace — many-to-many,
which one column cannot express. `BRAND_PRECEDENCE` plus `BRAND_CATEGORY_EXCLUDES` is what
guarantees a category has exactly one owner.

---

## 5. The product engine (the money path)

This is the most connected subsystem: a file goes in on a phone and comes back watermarked,
with a paywall in the middle.

```
app screen ──► /api/job (Next, :8080) ──► worker.py (Python, :8099, loopback only)
                     │                            rembg / Pillow / pdfcpu / markitdown
                     ├──► R2: products/<p>/input/...      (every input kept)
                     ├──► R2: products/<p>/<uuid>.ext     (the clean, paid file)
                     ├──► R2: products/<p>/preview/<uuid>.ext  (watermarked, free)
                     └──► Supabase: product_jobs row (every attempt, success or failure)

pay ──► Razorpay order ──► checkout ──► /api/orders/verify (signature)
                                   └──► /api/payments/webhook (same news, independently)
                                              │
                                     Supabase: orders (status='paid')
                                              │
   GET /api/job/<id>  ── returns output_url ONLY when a paid order exists for this job+phone
```

Files: `apps/web/app/api/job/route.ts` (policy table + validation), `api/job/[id]/route.ts`
(the paywall), `lib/product-orders.ts`, `lib/razorpay.ts`, `lib/r2.ts`,
`services/tools/worker.py` (started by pm2 as `dropby-worker`).

Two deliberate design points worth keeping:

- The clean key and the preview key are **different random ids**. Deriving one from the other
  would let anyone holding the free preview URL edit it into the paid URL.
- The worker binds `127.0.0.1:8099` and is never exposed. The Next route is the only door,
  which is what makes the job metered, recorded and rate-limited.

`services/tools/spa_server.py` exists because the browser export of the app is served from
`expo.dropby.co.in`, a different origin — it proxies `/api/*` to `:8080` so the app's relative
`/api/job` call is same-origin.

---

## 6. External services and what holds the key

| Service | Used for | Key / env | Code |
|---|---|---|---|
| Supabase (Postgres, Auth, Edge Functions) | The whole data model, RLS, OTP auth | `NEXT_PUBLIC_SUPABASE_URL`, publishable key (clients), `SUPABASE_SERVICE_ROLE_KEY` (server, via `lib/keyLoader.js`) | `lib/supabase/*`, `lib/agentos.ts`, `lib/nextel.ts` |
| Cloudflare R2 | Listing photos, product inputs/outputs/previews | `CLOUDFLARE_R2_*`, `NEXT_PUBLIC_R2_PUBLIC_URL`, `R2_PREFIX` | `lib/r2.ts` (hand-written SigV4 — no AWS SDK) |
| Nextel (WhatsApp) | OTP delivery, lead alerts, booking alerts, boost confirmation | `NEXTEL_API_KEY`, `NEXTEL_SENDER`, `NEXTEL_*_TEMPLATE` | `lib/nextel.ts`; also the `whatsapp-otp` Edge Function |
| Razorpay | Payments | `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | `lib/razorpay.ts`, `api/payments/webhook` |
| Cloudflare Workers AI | Text, vision, translate, STT, TTS, image | `CLOUDFLARE_AI_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `lib/ai.ts`, `worker.py` (`ai-image`) |
| Gemini, Groq | Fallbacks in the AI chains | `GEMINI_API_KEY`, `GROQ_API_KEY` | `lib/ai.ts` |
| Local engine | Image/PDF/document jobs at ₹0/job | — | `services/tools/worker.py` |
| Cloudflare Tunnel | Public entry for all hosts | — | `docs/hermes-architecture-audit.md` §4 |

**The AI router** (`lib/ai.ts`) is a chain-per-capability design: each capability
(`text`, `text-cheap`, `vision`, `translate`, `stt`, `tts`, `image`) has an ordered list of
providers, tried with a per-provider timeout and a health check, recording every attempt in
the job's `meta`. It never invents a result — an unavailable chain fails out loud naming each
provider and why. `scripts/ai-router-report.mjs` prints the live provider table.

---

## 7. Runtime topology (as it actually runs)

From `docs/hermes-architecture-audit.md` §4 and `ecosystem.config.js`:

```
Cloudflare tunnel
  dashboard.dropby.co.in → :8080  marketplace   (Next 16, apps/web)      [pm2]
  dropby.co.in + *       → :8080  (catch-all → brand router)
  hermes.dropby.co.in    → :9300  hermes-dashboard
  expo.dropby.co.in      → :8091  expo-preview (spa_server.py → :8080)
  shots.dropby.co.in     → :8092  shots-gallery

pm2: marketplace :8080 · dropby-worker :8099 · expo-preview :8091
     shots-gallery :8092 · hermes-dashboard :9300 · galaxy-site :9400

Hermes agent (Windows, pm2 hermes-gateway) — cron ticker → jobs.json → repo
```

`ecosystem.config.js` only manages two of these (`marketplace`, `dropby-worker`) — the rest are
started by other means on that VM.

**Deploy paths:** Vercel uses the root `vercel.json` (Root Directory must stay at the repo
root, or delete `vercel.json` and set Root Directory to `apps/web` — having both produces
"no Next.js version detected"). pm2 uses `ecosystem.config.js`. Mobile uses EAS
(`apps/mobile/eas.json`, profiles generated by `scripts/make-eas-profiles.mjs`).

---

## 8. Gaps found while reading, and their disposition

Audited and changed on 2026-09-17. **Fixed** means the change is in this repo; **open**
means it is a decision or a follow-up, deliberately not taken.

### Fixed

| # | Finding | What changed |
|---|---|---|
| 1 | **The admin "hermes chat" POST was dead three times over.** It posted to `/admin/api/hermes`, which does not exist; the button was `type="button"` with no handler so it never submitted; and the only field was a `<textarea>`, where Enter inserts a newline rather than submitting. | The form is gone. `admin/hermes-panel.tsx` is now a server component rendering only the half that really worked — the `gateway_state.json` read — and it names Discord / `hermes chat` as the real ways to drive the agent. The gateway exposes no HTTP chat surface, so there was no honest endpoint to implement behind it. |
| 2 | **Base-domain list duplicated.** `proxy.ts` kept its own copy of the domains, the admin hosts and the Hermes hosts, alongside `lib/base-domains.ts`. | `base-domains.ts` is the single source. It derives `ADMIN_HOSTS` and `HERMES_DASHBOARD_HOSTS` from `BRAND_BASE_DOMAINS`, and `proxy.ts` imports them and reuses the shared `brandSlugFromHost` instead of reimplementing subdomain parsing. Adding a third domain can no longer update one file and not the other. |
| 3 | **Brand→category ownership written twice** — in `apps/mobile/targets.mjs` and `apps/web/lib/brand-categories.ts` — so web and native could disagree about who owns a category. | The table moved to **`packages/core/src/brand-scope.ts`** (`@hermes/core`), the package that exists for exactly this. The web imports it through a thin `lib/brand-categories.ts` shim; the mobile apps derive their feed filter from `scopeForBrand()` at **runtime** in `lib/target.ts`, so a binary can never carry a stale copy. One table, two views. |
| 4 | **`APP_PATHS` in `proxy.ts` was dead** — a 17-line list of "routes the brand router should handle", left from when unlisted paths fell through to the static sites. The router now rewrites every path. | Deleted. The bypass list that *is* used is renamed `BYPASS_PREFIXES` and states why each entry is there. |
| 5 | **`@hermes/tokens` was in the web app's `transpilePackages`** although no web source imports it — the dependency actually runs the other way (tokens are generated *from* `apps/web/app/globals.css`). | Removed, with the direction recorded in the comment. |
| 6 | **Four listings could be built for a store while opening on nothing**, and the gate that catches it was opt-in (`--require-ready`), so no release path ran it. | `check-fleet.mjs` prints an unmissable block naming each unbuildable listing, and a new `check:release` script (`check-targets` + `check-fleet --require-ready`) is bound to every `prebuild:*` hook in `apps/mobile/package.json`, so a store build cannot run while any listing owes a first screen. |

### Open — deliberate, not oversights

| # | Finding | Why it stands |
|---|---|---|
| 1 | **`apps/web/app/admin/agent-controls.tsx` calls `/api/agents`, which does not exist**, so "Run Now", "Pause/Resume" and "Create Task" all 404. | Not actioned — it needs a decision (wire it or delete the actions), see the note below. |
| 2 | **Product slugs live in three places**: `lib/products.ts`, the `products:` arrays in `targets.mjs`, and the `ENGINE` table in `apps/web/app/api/job/route.ts`. | These are three different things — a catalogue entry, what a listing advertises, and what the engine can run. `check-fleet.mjs` already fails when a target advertises a product missing from the registry; a cross-check against `ENGINE` is worth adding, but merging them would be wrong. |
| 3 | **`lib/keyLoader.js` reads `apps/web/.env` before `process.env`.** | Deliberate: it fixed a real shadowing bug where a stale `SUPABASE_SERVICE_ROLE_KEY` in the scraper VM's environment won over the real one. A stale file now wins instead — the trade is documented in the file. |
| 4 | **`.env` carries keys no app code reads** (`UPLOAD_LIMIT`, `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`). | `.env` is gitignored and host-local; those belong to ops scripts run on the VM. `.env.example` is the documented surface and lists the keys that matter. |
| 5 | **Four of the six pm2 apps in the live topology are not in `ecosystem.config.js`.** | They are started by the VM's boot task. Moving them into the file is an ops change on a live box, not a repo change. |

### Deliberate legacy: the retired static sites

`apps/web/app/brand-router/[brand]/brand-static.tsx` is **unreferenced on purpose**.
`lib/site-folders.ts` (auto-generated by `scripts/gen-site-folders.mjs`, wired to the web
`prebuild`) and the 4.3 MB of HTML in `public/sites/` exist to support it.

They are the original 28 brand landing pages, retired from the router because they were
mockups with dead links and no live data — and because they hijacked brand-semantic routes:
`/doctors` on sarkarhealth resolved to a file that did not exist, so the route 404'd whatever
the app defined. Requests under `/sites/` are still served directly (`BYPASS_PREFIXES` in
`proxy.ts`), so existing links keep working.

The mechanism is kept whole so a landing page can be revived with one branch in
`brand-router/[brand]/page.tsx` and no archaeology in git history. **This is the one place in
the repo where an unreferenced file is intentional**, and the component says so at the top.

---

## 9. The dependency rule to keep

```
packages/tokens  ◄─ generated from ─ apps/web/app/globals.css
packages/core    ◄─ pure logic, no fetch, no platform imports
   ├── brand-scope.ts   (who owns which category — shared, runtime-read)
   └── index.ts         (slugs, formatting, links, bill numbers)
                        ▲                      ▲
                    apps/web               apps/mobile
                        │                      │
                        └──── Supabase ────────┘
                              (same tables)
```

Web and mobile never import each other. They meet at exactly four places:

1. **`@hermes/core`** — including the ownership table, which is the one that decides what each
   surface is allowed to show.
2. **`@hermes/tokens`** — colours, one-way from the web's CSS to native.
3. **The Supabase tables** — both clients read `businesses` directly.
4. **Three HTTP endpoints on the web app** — `/api/otp/send`, `/api/otp/verify`, `/api/job`.

Anything that must agree between the two belongs in one of those four and nowhere else. If you
find yourself writing the same list twice — as this repo did for brand→category ownership — the
fix is to move it into (1), not to keep the two copies in step by hand.
