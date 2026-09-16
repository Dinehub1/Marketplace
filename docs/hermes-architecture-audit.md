# Hermes / DropBy — architecture, direction, and VM tidy-up

**Audit date:** 2026-09-16 · **Auditor:** DSH session (read-only on the VM except for the archive moves below)
**Scope:** the Windows VM `<vm-public-ip>` (`WIN-3A54GFFGPCJ`), the Hermes agent that runs on it, its cron
scheduler, the pm2 services, and the local Mac side.

---

## 1. Answer to "what is Hermes actually doing?"

One job, on a timer:

```
dropby-hourly-build   cron: 20 * * * *   ENABLED
workdir: C:\Users\Administrator\Marketplace
skills:  sarkar-marketplace-operations, trending-oss-repos
```

It is **not** directionless in the sense of broken — it is working *exactly* as configured, and doing it well:

| Health check | Result |
|---|---|
| Runs today (2026-09-16) | 10 of 10 completed |
| Runtime per run | 12–22 min |
| Delivery | `delivered` on every run |
| Failure streak | 0 |
| Cron ticker heartbeat | live (fresh within the minute) |
| Hermes gateway (pid 5012) | online, 13 h uptime |

Each run: read `docs/hourly-queue.md` → take the top non-done item → change one thing → verify it for real
(HTTP status, a `/api/job` job_id, an `expo export` size, a phone-sized screenshot) → publish to
`build-log.py` → flip the item → commit and push. The latest run genuinely bisected a bug to
`react-native-web`'s 50 ms press delay, proved a 190-tap round against the export, and quoted its evidence.
That is honest, careful work.

**The problem is what it is pointed at.** The queue it reads is 42 KB of small UI/PDF/engine fixes, so an
hour of a capable agent goes to things like "the invoice item meta line at 320–360 px". The commits tell the
same story — `fix(mobile)`, `fix(gallery)`, `docs(queue)` — competent, but incremental.

## 2. Why it feels directionless — the root cause

**15 of the 16 cron jobs are disabled. Only the hourly builder is enabled.**

| Job | Schedule | State | What its absence costs |
|---|---|---|---|
| `orchestrator` | `*/30 * * * *` | **off** | the thing that would re-prioritise the queue |
| `competitor-watch` | `0 6 * * *` | **off** | no market signal |
| `trend-spotter` | `0 9 * * *` | **off** | no new product candidates |
| `growth-hacker` | `0 10,16 * * *` | **off** | no distribution / revenue experiments |
| `seo-publisher` | `0 14 * * *` | **off** | the 24,028-listing SEO surface gets nothing |
| `product-builder` | `0 19 * * *` | **off** | no product-level work |
| `infra-sentinel` | `*/15 * * * *` | **off** | nobody watches the box |
| `vault-guardian` | `0 */6 * * *` | **off** | nobody watches the data |
| `log-rotator` | `0 3 * * *` | **off** | (mitigated: pm2-logrotate module is doing this) |
| `market-scan`, `acc1-*` (5), `sarkar-pipeline` | various | **off** | trading + pipeline jobs parked |

The hourly job takes this literally — its own prompt says *"never resume or touch the paused cron jobs"*.
So the agent that could add direction has been instructed not to, and the jobs that would supply direction
are off. That is the whole of it.

## 3. What is missing (the business layer is blocked on you, not on the agent)

The queue's parking lot is full of items that mark time because they need a human:

- **`6. Paid path: real money test (blocked on keys)`** — the ₹49 passport paywall is the money path, and it
  can never be exercised without payment keys. Everything above it is polish.
- **`6. UPI QR (done)` / `14. Wire the Workers AI token`** — one missing credential gates two products.
- **`15. Translation product on indictrans2`** — same missing token.
- **`17. expo-dev tunnel is wedged and burning a core (blocked on his OK to stop it)`** — a stopped pm2 app
  still costing CPU, awaiting a one-word decision.
- `16. Invoice numbering`, `18. pages=abc 502`, `20. ai-image route has no entry`, `22. the capture gate
  proves a screen renders, not that it works`.

**Missing, structurally:**
- No kanban board usage — `~/.hermes/kanban.db` has **0 tasks**; `kanban.dispatch_in_gateway` is on but idle.
- No revenue telemetry in the loop. Build log tracks *fixes*, not installs, revenue, or retention.
- No single source of truth for "what is this business and what is the next milestone" — the queue file is
  the de-facto strategy document, and it is a bug list.
- The live serving path (`Marketplace/apps/web` :8080) and the product engine (:8099) are treated as
  background, so the hourly agent spends its hygiene budget policing stray processes and ports.

## 4. Architecture as it actually runs

```
Cloudflare (remote-managed tunnel 6988e6e4-…)
  shots.dropby.co.in     -> localhost:8092  pm2 shots-gallery  (python shots_server.py)
  expo.dropby.co.in      -> localhost:8091  pm2 expo-preview
  hermes.dropby.co.in    -> localhost:9300  pm2 hermes-dashboard
  dashboard.dropby.co.in -> localhost:8080  pm2 hermes-web (Next 16.2.9, apps/web)
  dropby.co.in + *       -> localhost:8080  (catch-all)
  exp.direct             -> Expo Go, native app

pm2 (Administrator, C:\Users\Administrator\Marketplace\ecosystem.config.js)
  hermes-web :8080   dropby-worker :8099 (rembg/Pillow engine)
  expo-preview :8091 shots-gallery :8092  hermes-dashboard :9300
  galaxy-site :9400  expo-dev (STOPPED)
  + pm2-logrotate module (10M, retain 30, compressed) — log growth handled

Hermes agent (Win, pm2 hermes-gateway, pid 5012)
  HERMES_HOME = C:\Users\Administrator\AppData\Local\hermes
  cron ticker -> jobs.json (16 jobs, 1 enabled) -> C:\Users\Administrator\Marketplace

Live repo   C:\Users\Administrator\Marketplace  (main == origin/main, 1 uncommitted file)
Product     apps/mobile (Expo), apps/web (Next), services/tools/{worker,shots_server,spa_server}.py
```

Note the **local Mac is a separate, mostly dormant install**: `~/.hermes` gateway 0.14.0 (a fork of
`Dinehub1/Hermes-agent`) is running with **Telegram paused** (token rejected) and **Discord retrying
(failed)** — so the local agent has no working platform channel at all, and has been idle since May.

## 5. What was tidied on the VM (this session)

`C:\Users\Administrator\_archive\2026-09-cleanup\` — **70 items, moved not deleted**, reversible via
`_moved-manifest.txt` (source → archive → reason, 71 lines):

| Group | Items | What it is |
|---|---|---|
| `stray-home-scripts/` | 19 | one-off probes: `imgtest.py`, `std_trader.py` (814-line paper trader), `mt5_*`, `req.jsonl`, `ontester_snippet.inc`, `cashcard-dns-*-backup.json`, … |
| `stray-home-logs/` | 33 | run artifacts and superseded docs: `expo-*.log`, `mb_*.json`, `social_crawl.jsonl`, `brand_audit.json`, `galaxy-live.png`, `plan_vs_reality.json`, old root `README/CLAUDE/CHANGELOG/package.json` |
| `dead-orchestrator/` | 14 | abandoned earlier attempts: `src/` (JS orchestrator+worker), `tools/` (higgsfield/whatsapp stubs), `staging/` (4 orphan UUID dirs), `tmp/` (zztest scripts), `supabase/`, `Projects/`, `Notes/`, `mojibake-backup/`, `hermes-cron/`, `GMaps Data/`, `GeoGhost/`, `local-service-leads/`, 3 stale logs |
| `dead-web/` | 1 | `ai-free-test/` (14 scratch API probes) |
| `stray-home-bak/` | 3 | two `start-services.cmd.bak-*`, superseded `hermes-dashboard.ecosystem.config.js` |

Before/after, the home root went from ~45 loose files to: `cloudflared.exe` (live, used by the
named-tunnel task), `start-services.cmd` (live, boot task), `.env`, `.gitconfig`, `.git-credentials`,
`.gitignore`, `.profile`, `.cf_token`, `.claude.json`.

**Verified after the move:** all 8 pm2 apps still online with uptimes preserved, all six local endpoints
return 200 (`:8080 :8091 :8092 :8099 :9300 :9400`), cron ticker still beating, `jobs.json` backed up to
`jobs.json.bak-before-cleanup-20260916`.

**Deliberately NOT touched:**
- **MT5 / trading is LIVE, not dead.** `terminal64` is running and `C:\bridge\strategy.py` was written
  minutes ago. So `C:\bridge`, `C:\bridge_acc2`, `C:\MT5_Acc2`, `C:\MT5_Acc3` and the 11 `MT5-*` tasks stay
  exactly where they are. (The task states say *Disabled*, but bots and startup tasks are clearly in use —
  do not archive these without an explicit decision.)
- **`galaxy-site/`** — locked because it *is* the live pm2 app on :9400 (44 h uptime). Candidate for
  retirement, but stopping a serving app is your call, not housekeeping's.
- **`logs/cloudflared.log`** — held open by the running cloudflared tunnel.
- `freeai/` — created 01:29 today; live work in progress.
- `_archive/` itself (8.7 GB) and platform caches (`.cache`, `.local`, `.claude`, `.rembg` ≈ 2.1 GB) — left
  alone since you chose move-only over compression.

## 6. Recommendations, in order

1. **Decide the business gate first.** Either load the payment keys and run the ₹49 path end to end, or
   explicitly park monetisation. Right now the agent cannot touch the only thing that matters.
2. **Re-enable `orchestrator`** (30-min) and point it at prioritisation: reorder `hourly-queue.md`, close
   stale items, promote one business item per day. Keep the hourly builder as the hands; give it a brain.
   Consider also `competitor-watch` + `trend-spotter` (daily, cheap) and `infra-sentinel` (15-min).
3. **Free the two blocked one-liners** — approve stopping `expo-dev` (dead app, still costing CPU) and the
   `pages=abc` 400 fix; both are minutes of work.
4. **Split the queue** into `queue/business.md`, `queue/bugs.md`, `queue/parking.md` — a 42 KB single file
   is why "the top item" drifts toward small safe wins.
5. **Retire `galaxy-site`** (:9400) if the vault visualisation is no longer wanted — it frees the last stray
   pm2 app and its directory.
6. **Fix or remove the local Mac agent** — it is running with zero working channels. Either correct the
   Telegram token and reconnect Discord, or stop the LaunchAgent so it stops pretending to be online.
7. **Optional disk:** zipping `_archive/` (8.7 GB, of which `old-projects` 3.2 GB, `scrap-tools` 2.5 GB,
   `20260913-cleanup` 2.0 GB, `temp-files` 0.9 GB) would reclaim several GB — run it outside the :20
   hourly window.

