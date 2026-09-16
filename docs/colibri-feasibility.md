# colibri on this VM: measured verdict — parked (not installed)

**Question (queue item 12):** can `JustVugg/colibri` replace the API bill behind the
writing products, on the box that also serves the live site?

**Answer: no — parked before any download.** The licence is fine; the hardware is not.
Nothing was installed, nothing was downloaded, no model was fetched. The item's own
instruction was "do NOT install it until you have measured idle RAM, disk needed, and
whether a single request starves `hermes-web`" — this is that measurement.

## 1. Licence: verified by API, not by the blurb

`GET https://api.github.com/repos/JustVugg/colibri`

| field | value |
|---|---|
| `license.spdx_id` | **Apache-2.0** |
| `stargazers_count` | 34,816 |
| `pushed_at` | 2026-09-15T21:33:15Z (active) |
| `archived` | false |
| `language` / `size` | C · 15,052 KB (the repo is small; the *model* is the cost) |

So it passes the licence gate — Apache-2.0, build-on-top allowed. This verdict is
about the hardware only.

## 2. What colibri needs — its own README, quoted

From `README.md` (§ "Other supported models", the comparison table it adds to answer
issue #191; fetched raw from `main` 2026-09-16):

| Model | Disk for the weights | RAM | GPU |
|---|---|---|---|
| **OLMoE** (7B / 1B active) | ~7 GB (int8 container) | **8 GB** | not needed |
| **Qwen3.6-35B-A3B** (35B / 3B) | ~20 GB (int4-gs64) | **24 GB** (needs full RAM residency) | optional |
| **DeepSeek V4 Flash** (284B / 13B) | ~167 GB (REAP 150B: ~85 GB) | **16 GB min, 32 GB comfortable** | optional |
| **GLM-5.3-Flash** | ~195 GB converted | **25 GB** | not needed |
| **GLM-5.2 / 5.3** (744B / 40B) | ~372 GB | **16 GB min, 24 GB comfortable** | not needed |
| **Qwen3.8-Flash-Next** | ~185.5 GB | 16 GB min, 24 GB comfortable | not supported; CPU only |
| **Inkling** (975B / 41B) | ~469 GB | 25 GB (int4 dense) / ~120 GB without | not needed |
| **Kimi K3** | ~1.6 TB | 32 GB+ | not needed |

Their own speed floor, same page (§ "What it achieves"):
**"25 GB dev box: 0.05–0.1 tok/s cold — the proven floor where this project started"**,
against "128 GB CPU-only desktop: ~1.8 tok/s warm". Decode is disk-bound, because the
experts are streamed from it.

## 3. What this box is — measured 2026-09-16

| | measured | how |
|---|---|---|
| vCPU | **4** | `nproc` |
| RAM total | **8,384,176 kB ≈ 8.0 GB** (+ 2.7 GB swap) | `wmic ComputerSystem get TotalPhysicalMemory`, `/proc/meminfo` |
| RAM free, live stack running | **4,854 MB ≈ 4.7 GB** | `Get-CimInstance Win32_OperatingSystem → FreePhysicalMemory` |
| Disk | 100 GB total, **44,531 MB free (43.5 GB)**, 57 % used | `df -m /c` |
| Disk hardware | **QEMU QEMU HARDDISK, SCSI, 100 GB** — a *virtual* disk | `Get-CimInstance Win32_DiskDrive` |
| CPU load at the time | 48 % (7 pm2 apps online: hermes-web, dropby-worker, expo-preview, shots-gallery, galaxy-site, hermes-dashboard, hermes-gateway) | `pm2 list` host metrics, `Win32_Processor.LoadPercentage` |

Two further marks against it, both from colibri's own docs: virtualised disks are
called out as "neutral to negative" for its `PIPE` read optimisation, and its floor
number was measured on a **25 GB** box — larger than this one.

## 4. The arithmetic, model by model

- **OLMoE** is the only model that fits the disk (7 GB of 43.5 GB free) — and it wants
  **8 GB RAM, i.e. this box's entire RAM**, while hermes-web + the product worker + the
  pm2 fleet already hold ~3.3 GB of it. It would swap to death (2.7 GB swap) and take
  the live site with it. It is also a 7B/1B-active model: not an engine for a writing
  product.
- **Qwen3.6-35B-A3B** is the smallest model that would actually be *useful*: 20 GB disk
  fits, **24 GB RAM does not** (box has 8).
- Everything above it fails on both counts: 85–1,600 GB of weights against 43.5 GB free,
  and 16–32 GB RAM against 8.
- And the one request that could be run here could not be run *safely*: colibri is
  CPU+disk-bound and this box is the box serving `hermes-web` and the product engine,
  so the item's third measurement ("whether a single request starves `hermes-web`")
  answers itself — a 4-core VM cannot run a streaming MoE and serve the live site.

**Verdict: parked on hardware, not on licence.** Re-open only on a bigger host
(≥24 GB RAM **and** ≥120 GB free disk for Qwen3.6-35B-A3B / a Flash-class container).

## 5. What the ₹0 text path costs today (why parking it costs nothing)

The item's premise is "removing the API bill behind the writing products". There is no
such engine bill today:

- The only hosted-model product live is **`ai-image` (Text to Image)**, measured at
  **172.8 neurons ≈ ₹0.17 per 1024×1024 image**, inside **10,000 free neurons a day
  (~57 images/day)** before the meter starts (queue item 20's numbers, from the
  published Cloudflare rate).
- The shipping products `exif-strip`, `photos-to-pdf`, `collage`, `invoice-maker`,
  `pdf-tools` and `resume-checker` are **local and free** — Pillow / pdfcpu /
  markitdown on CPU, ₹0 per job, no API.
- The intended ₹0 terminal fallback for text is the local chain (rules → `tesseract` →
  `pg_trgm`) that queue item 17 builds into `apps/web/lib/ai.ts`; it needs no model
  download and no RAM. **Item 17 is the cheaper way to remove the bill, and it is
  unblocked.**

## 6. What was deliberately not done

No clone, no release download, no `pip install`, no Hugging Face fetch, no disk
written, no pm2 change, no service restarted. `.u2net`/model caches untouched. The
research directory is `%LOCALAPPDATA%\Temp` (two README/doc files fetched for reading).
