# Moving the web app to Vercel, keeping the heavy work on the VM

Written 2026-09-27 from the code and the live hosts. Builds on `architecture-connections.md`.

## Why

Today every host under `*.dropby.co.in` is served by `next start` in pm2 on one Windows VM,
reached through a Cloudflare tunnel. Changing one variable (`ADMOB_PUBLISHER_ID`) needed a
shell on that box and a pm2 restart, and it still did not take effect. One machine is the
web server, the job engine, the agent host and the preview server, so a problem with any of
them affects all of them.

## Where things stand (checked 2026-09-27)

| Host | Served by | Evidence |
|---|---|---|
| `dropby.co.in` → `www.dropby.co.in` | Vercel, a **different** project (`dropy-web`, probably) | `x-vercel-id` header; apex 308s to `www` |
| `cashcard.live` | Vercel, project `cash-card` | `x-vercel-id` header |
| `apps.`, `sarkarmarketplace.`, `dashboard.`, every brand subdomain | VM → Cloudflare tunnel → pm2 `marketplace :8080` | no `x-vercel-id`; `x-middleware-rewrite` from `proxy.ts` |
| This repo on Vercel | **Not deployed.** No `.vercel/` link and no project among the 12 in the `brandcollabs` team | `vercel project ls` |

DNS for `dropby.co.in` is on Cloudflare, not Vercel's nameservers.

## Target split

**Vercel** runs the Next app (`apps/web`):
- all brand sites;
- the admin console;
- the developer site and `app-ads.txt`;
- every `/api/*` route: OTP, orders, Razorpay webhook, `ad-events`, `ad-ssv`, `job` (as the front door only).

**The VM** keeps what needs a real machine or long-running processes:

| Stays on the VM | Port | Why it can't be a Vercel function |
|---|---|---|
| `worker.py` (rembg, Pillow, pdfcpu, markitdown, captions) | 8099 | Python with native libraries, a model loaded into memory (~23 s cold), 180 s jobs |
| Hermes gateway + dashboard | 9300 | Long-running agent; the tunnel already routes `hermes.` straight to it |
| `expo-preview` (`spa_server.py`) | 8091 | Static server; only its API upstream changes |
| `shots-gallery`, `galaxy-site` | 8092, 9400 | Unrelated to the web app |
| Scrapers and ops scripts (`apps/web/scripts/*`) | — | Run by hand or by Hermes cron; never part of the web app |
| `cloudflared` | — | Still carries `hermes.`, `expo.`, `shots.` and the new `worker.` |

```
phone / browser ──► Vercel (Next, region bom1)
                         │  /api/job: validate, rate-limit, record, paywall
                         ├──► R2 (inputs, clean outputs, previews)
                         ├──► Supabase
                         └──► https://worker.dropby.co.in  ──► Cloudflare Access ──► tunnel ──► VM 127.0.0.1:8099
```

The worker keeps binding `127.0.0.1`. The tunnel connects to it locally, so no port is
opened on the VM.

## What has to change in the code

Checked against the code:

1. **Upload size (blocking).** Vercel caps a function's request body at **4.5 MB**.
   `/api/job` accepts multipart uploads of up to 15 MB per file, 30 MB per document and
   60 MB for photos-to-pdf (`app/api/job/route.ts:373-403`), so ordinary phone photos would
   fail. The fix is direct-to-R2 uploads:
   - new `POST /api/job/upload-url`: validates product, size and count, then returns
     presigned R2 `PUT` URLs for `products/<p>/input/<uuid>`. `lib/r2.ts` already signs
     SigV4 requests, so this adds query-string signing, not a new SDK;
   - `/api/job` accepts those input keys and reads the bytes from R2 server-side. Outgoing
     fetches have no 4.5 MB limit. The worker call and the output path are unchanged;
   - `apps/mobile/lib/tools.ts` uploads to R2 first, then calls `/api/job`;
   - R2 bucket CORS for `https://expo.dropby.co.in`, because the web export uploads from a
     browser.

   Responses are already fine: `/api/job` returns JSON with R2 URLs, never file bytes.
2. **Worker authentication (blocking).** `worker.py` has none; loopback was the only guard.
   Once it has a public hostname:
   - Cloudflare Access service token on `worker.dropby.co.in`: Vercel sends
     `CF-Access-Client-Id` and `CF-Access-Client-Secret`;
   - also a shared-secret header that `worker.py` checks, so a misconfigured Access policy
     alone does not expose the engine.
   `PRODUCT_WORKER_URL` is already read (`route.ts:33`), so pointing the route at the new
   host is config only.
3. **Function duration.** Add `export const maxDuration = 300` to `app/api/job/route.ts`
   (worker timeout 180 s plus R2 transfers).
4. **`spa_server.py` upstream.** Start it with `api-target` =
   `sarkarmarketplace.dropby.co.in:443` (or retire it; see open questions). Its API
   forwarding currently assumes plain HTTP to `127.0.0.1:8080`, so this needs a small
   HTTPS change.

Already safe on Vercel, no change needed:
- `lib/keyLoader.ts` falls back to `process.env` when there is no `.env` file.
- `lib/hermes.ts` (admin panel) catches the missing Windows file and shows "not running".
- `lib/ai.ts` local Tesseract/Whisper providers report themselves unavailable.
- `lib/rate-limit.ts` reads `x-forwarded-for`, which Vercel sets.
- `proxy.ts`'s `hermes.` → `localhost:9300` branch never runs, because `hermes.` DNS stays on
  the tunnel.

## Domains

Vercel wildcard domains need Vercel's nameservers. Moving `dropby.co.in` off Cloudflare would
break the tunnel hostnames, so **each host is added to the Vercel project explicitly**:
- the brand subdomains (27 site folders today; the `brands` table is the source of truth);
- `apps.`, `sarkarmarketplace.`, `dashboard.`, `admin.`.

Each gets a Cloudflare CNAME to `cname.vercel-dns.com`, set **DNS only** (grey cloud), so
Vercel issues and renews the certificate.

A script does this with `vercel domains add` plus the Cloudflare DNS API. After the move, a
new brand needs its domain added too. That can later go into the admin "create brand" flow
via the Vercel API.

`www.` and the apex stay with the other Vercel project, and `cashcard.live` stays with
`cash-card`. Its brand subdomains need inventorying before phase 5.

**Rollback for any host** is pointing its CNAME back at the tunnel. Lower the TTL to 60 s a
day before each phase.

## Environment variables

Copy from the **VM's** `apps/web/.env`. The Mac's copy is incomplete; it lacks the AI keys.
Add them with `vercel env add` for Production and Preview, and never paste values into chat
or commit them.

- **Copy:** Supabase (URL, publishable, service role), R2 (all `CLOUDFLARE_R2_*`,
  `NEXT_PUBLIC_R2_PUBLIC_URL`, `R2_PREFIX`), Razorpay (3), Nextel (key, endpoint, sender,
  3 templates), `ADMIN_TOKEN`, `BRAND_ADMIN_EMAILS`, `PHONE_TOKEN_TTL_MS`,
  `FEATURE_PRICE_INR`, `ADMOB_PUBLISHER_ID`, the AI keys (`CLOUDFLARE_AI_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`, `GEMINI_API_KEY`, `GROQ_API_KEY`).
- **New:** `PRODUCT_WORKER_URL=https://worker.dropby.co.in`, `WORKER_SHARED_SECRET`,
  `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`.
- **Leave on the VM:** `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `UPLOAD_LIMIT` (ops scripts
  only), `DEFAULT_BRAND` (localhost only).

## Phases

Each phase can be released and rolled back on its own.

**Progress (2026-09-27):**
- **Phase 0 done.** Vercel project `brandcollabs/marketplace-web` is linked to GitHub `main`,
  runs Node 24, and has its default function region set to `bom1` in the project settings.
  16 env vars are set for Production and Preview. The VM-only keys (Razorpay, Nextel
  templates, `ADMIN_TOKEN`, `BRAND_ADMIN_EMAILS`, `FEATURE_PRICE_INR`, AI keys) are still
  missing.
- **Phase 1 done.** Cloudflare CNAME `apps` → `7e68231427c37a50.vercel-dns-017.com`, DNS
  only, TTL 60. Before this there was no `apps` record, and the tunnel wildcard
  `*.dropby.co.in` caught it. `app-ads.txt` is served from Vercel with the seller line.
  Rollback: delete the `apps` record.
- **Phase 2 done.** On `exness-vm`, `dropby-worker` runs from `ecosystem.config.js` with
  `--port 8099 --public-port 8098`. `WORKER_SHARED_SECRET` is in `apps\web\.env`; the
  original file is backed up as `.env.bak-2026-09-27`. The tunnel route
  `worker.dropby.co.in` → `http://127.0.0.1:8098` has to use `127.0.0.1`, because on
  Windows `localhost` resolved to `::1` and returned 502. Checked from outside: no or
  wrong secret gives 403, `/internal/retire` gives 403 even with the secret, and the
  right secret gives 200. Real `exif-strip` and `photo-repair` jobs through Vercel
  returned 200 in about 4 s.
  - Lesson: the first version trusted `Cf-Ray` / `Cf-Connecting-Ip`. The VM was still
    running pre-pull code, and a retire probe restarted the worker. Always check what
    is actually running on the tunnel's machine (`ssh exness-vm`) before opening a route.
- **Phase 3 code done.** `POST /api/job?stage=upload` returns presigned R2 PUT URLs
  with `content-type` and the exact `content-length` signed in; R2 enforces both
  (tested: a larger body or another type is refused with 403). Each URL comes with an
  HMAC upload ticket binding key, type, size and expiry. `/api/job` takes
  `inputs=[{key,ticket}]`, verifies the ticket and the product prefix, reads the object
  back and checks its length. The app's `runJob` stages first and falls back to
  multipart when the server predates staging. The R2 bucket CORS has a new PUT-only
  rule for `https://expo.dropby.co.in` and the local Expo ports; the existing GET-`*`
  rule is unchanged. Tested locally with a 7.9 MB photo end to end, and a browser PUT
  from `expo.dropby.co.in`.
- **Phase 4 done (on Hobby, by the owner's decision).** `sarkarmarketplace.`, `dashboard.`
  and `admin.` are attached to `marketplace-web`, each with a Cloudflare CNAME →
  `7e68231427c37a50.vercel-dns-017.com` (DNS only, TTL 60). None had its own record before;
  the `*` tunnel wildcard caught them. Before the switch, the same requests to the VM and
  to Vercel returned identical status codes and sizes. After it, on the live hosts: brand
  home 200, admin login 200, OTP send (bad number) 400, OTP verify (no code) 400, worker
  health 200, unsigned SSV `rejected`, ad-unlock (unknown job) 404, a staged 7.9 MB
  `photo-repair` job locked with a preview and no leaked `output_url` (job 208), and the old
  multipart path 200.
  - Env parity was checked by hash: every value Vercel has matches the VM. Razorpay, the
    Nextel templates, `ADMIN_TOKEN`, `BRAND_ADMIN_EMAILS` and `FEATURE_PRICE_INR` are empty
    on the VM too, and the AI keys exist only in Hermes' `.env`, which the worker reads.
  - Rollback: delete the host's CNAME. The VM's `marketplace` pm2 app keeps running.
  - `expo.dropby.co.in` still proxies `/api` to the VM's own Next (`spa_server.py`), which
    predates staging, so the web export uses the multipart fallback there.
- The team is still on **Hobby**, which is non-commercial only. Upgrade to Pro before relying
  on this for payments or ads.

| # | Phase | User-visible? | Done when |
|---|---|---|---|
| 0 | **Project setup.** Link the repo (`vercel link`, root directory = repo root, which the root `vercel.json` expects), Node 24, function region `bom1` (confirm it matches the Supabase region), env vars, Pro plan | No | A preview deploy builds, and a preview URL renders a brand page with live data |
| 1 | **`apps.dropby.co.in` on Vercel.** Developer site, privacy page, `app-ads.txt` | Yes, low risk | `https://apps.dropby.co.in/app-ads.txt` shows the `google.com, pub-3150584264351771, …` line. **This also fixes today's AdMob problem.** |
| 2 | **Worker bridge.** Tunnel route `worker.` → `:8099`, Access service token, shared-secret check in `worker.py` | No | A Vercel preview runs a bg-remove job end to end; an unauthenticated request to `worker.` is refused |
| 3 | **Direct-to-R2 uploads** (code change 1). Ship it on the **VM first**, where it works the same, so it is proven before the host moves | App update | A 12 MB photo and a 50 MB photos-to-pdf batch succeed; old small uploads still work |
| 4 | **API host:** `sarkarmarketplace.` (mobile `WEB_BASE_URL`, AdMob SSV callback, Razorpay webhook), plus `dashboard.` and `admin.` | Yes | OTP, a paid order + webhook, an ad unlock and an admin login all work on Vercel |
| 5 | **Remaining brand subdomains**, by script, in two batches | Yes | Every host returns `x-vercel-id`; sitemaps and brand pages render |
| 6 | **VM cleanup.** Keep pm2 `marketplace` stopped but installed for one week as a fallback, then remove it and the tunnel catch-all; update `ecosystem.config.js`, `architecture-connections.md` and `spa_server.py` | No | The tunnel only carries `hermes.`, `expo.`, `shots.`, `worker.` |

Webhook and callback URLs (Razorpay, AdMob SSV) use host names, not the VM, so they need no
reconfiguration when the host moves.

## Costs and limits

- **Plan:** Vercel Hobby is non-commercial only. This app takes payments and shows ads, so
  it needs **Pro** (~$20/month per member) unless the `brandcollabs` team already has it.
- **Bandwidth:** files are served from R2's public URL, not through Vercel, so Vercel only
  carries pages and JSON.
- **Function time:** jobs wait on the worker for up to 180 s. On Fluid compute, time spent
  waiting on I/O isn't billed as active CPU, so this is cheap, but check it once real
  traffic arrives.

## Open questions

1. Pro plan: is the `brandcollabs` team already on Pro?
2. Supabase region, for choosing the function region (`bom1` assumes Mumbai).
3. `expo.dropby.co.in`: keep `spa_server.py` on the VM, or move the web export to Vercel as
   well? That would make the upload CORS rule same-origin.
4. `cashcard.live` brand subdomains: which exist, and does that zone's DNS live on Cloudflare
   or on Vercel?
5. Is the pm2 `marketplace` on the VM the only production copy, or is there a second
   checkout? The `ADMOB_PUBLISHER_ID` change on 2026-09-27 did not take effect, which
   suggests the edited `.env` is not the one the running process reads.
