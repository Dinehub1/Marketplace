# Build-on catalogue — open-source repos worth lifting real capability from

Written for the question "which repo gives us a lot of ready-to-use apps, not another
small edit". Every star count and licence below was read from the **GitHub API**
(`/repos/<owner>/<repo>` → `stargazers_count`, `license.spdx_id`, `pushed_at`,
`archived`), not from a blog or a README claim. Re-check before copying anything —
a licence can change, and two of these only *look* permissive.

## The bar we apply

1. **Licence**: MIT / Apache-2.0 / BSD-3-Clause → code may be copied with attribution.
   AGPL-3.0, GPL, LGPL, Elastic, BSL and paid carve-outs → read-only reference.
   `NOASSERTION` means GitHub could not parse the licence file: **read it** before use.
2. **Running capability** — can it actually run *here*? This VM has no GPU, limited RAM,
   and it also serves the live site. A stack that needs Kubernetes, Java, or 4 GB of
   model weights is a reference, not a deployment.
3. **Fit with our products** — one of the 28 catalogue products, the Expo app, or the
   Python worker must get better because of it.

## Tier 1 — take code from these

| Repo | ★ | Licence | Why it matters to us |
|---|---|---|---|
| **expo/examples** | 3,728 | **MIT** | Dozens of *complete, runnable* Expo apps — camera, image picker, file system, sharing, notif — in exactly our stack (Expo SDK 57, TypeScript). This is the "many ready apps in one repo" answer: each example is a working screen we can lift and restyle. |
| **T8RIN/ImageToolbox** | 14,641 | **Apache-2.0** | One app containing ~100 image operations (crop/rotate/perspective, filters, EXIF strip, collage, palette, watermark, QR, PDF-from-images). Apache-2.0 lets us port the *logic* with attribution. Our toolbox app currently has 5 working tools; this is the catalogue for the other 20. |
| **huggingface/transformers.js** | 16,297 | **Apache-2.0** | Runs models *inside the browser/app*: background removal, upscaling, OCR, embeddings. Every job it takes over is a job that stops costing a server round-trip — and stops being 60 s slow. |
| **mozilla/pdf.js** | 53,878 | **Apache-2.0** | Render/preview PDFs in the app instead of uploading to see a result. Removes a round-trip from the PDF toolkit's screen. |
| **naptha/tesseract.js** | 38,708 | **Apache-2.0** | OCR in the app or in the worker → unlocks "bill scanner + expense tracker", "marksheet maker" and document translation, three catalogue products with no engine today. |
| **pocketbase/pocketbase** | 61,048 | **MIT** | One-file backend (SQLite + auth + realtime). If a shopkeeper product ever needs per-shop data without touching our VM, this is the cheap way. |

## Tier 2 — read the licence first, then decide

| Repo | ★ | Licence as reported | Note |
|---|---|---|---|
| medusajs/medusa | 36,324 | NOASSERTION | Commerce platform: orders, payments, admin, plugins. If the licence proves usable, it replaces our hand-rolled order loop. |
| activepieces/activepieces | 24,473 | NOASSERTION | 200+ integrations, MIT core with an enterprise directory — check which directory we would be in. Automates "order → invoice → payment link". |
| appsmithorg/appsmith | 40,882 | Apache-2.0 | Internal-tool builder. Clean licence, but a whole product of its own; overkill until the shop toolkit needs a builder. |
| payloadcms/payload | 44,765 | MIT | CMS/admin for the directory content. Useful when someone other than us edits listings. |
| saleor/saleor | 23,335 | BSD-3-Clause | Python commerce. Heavy (needs Postgres + a worker fleet) for one VM. |
| xinntao/Real-ESRGAN | 36,794 | BSD-3-Clause | Photo repair / upscaling. Lives on CPU, and last push was 2024 — vendor it, do not depend on it. |
| rhasspy/piper | 11,283 | MIT | Text-to-speech, and **archived** — the maintained fork is `OHF-voice/piper1-gpl` (GPL). Voice-over needs a decision, not a copy. |

## Excluded on licence (recorded so nobody re-litigates it)

- `imgly/background-removal-js` 7,317 — **AGPL-3.0**. Would infect the app.
- `InvoiceShelf/InvoiceShelf` 1,826 — **AGPL-3.0**. The GST invoice template ideas are readable; the code is not usable.
- `Stirling-Tools/Stirling-PDF` 92,222 — root MIT **with seven carve-out directories under a paid licence**, `engine/` among them. Reference only; see `docs/stirling-pdf-license.md`.
- Anything `NOASSERTION` until its `LICENSE` file is read line by line.

## Build queue from this catalogue

1. **Expo examples → our app shell.** Take the camera / file-picker / sharing examples and use them as the pattern for the tool frame the design pass is writing. Highest confidence, zero licence risk, immediate.
2. **ImageToolbox → 3 more real tools.** Collage, EXIF strip, and "PDF from images" are cheap in `worker.py` (Pillow + pdfcpu) and each one turns a "coming soon" card into a product.
3. **transformers.js prototype behind a flag.** Prove in-app background removal on a phone; if it works, the passport/bg-remove jobs stop depending on the VM's CPU entirely.
4. **pdf.js preview** in the PDF toolkit so a merge result can be seen before download.
5. **tesseract.js / tesseract** as the OCR engine for the bill scanner — the first product that needs OCR, so it validates the choice with a real job.
