# Hourly build queue — what the robot works on, one item per hour

Owner: the `dropby-hourly-build` cron job (every hour). It reads this file first,
picks the **top unfinished item it can actually verify**, does it, appends an entry
to the build log (which shows on https://shots.dropby.co.in/), and updates the
status here so the next hour does not repeat the work.

## Rules the job must not break

1. **One item per hour.** Finish or leave it explicitly `blocked` — never half-apply.
2. **Evidence or it did not happen.** A curl with its status code, a `product_jobs`
   row id, a screenshot at phone size, a test that ran. "Improved the UI" is not evidence.
3. **Never restart the live site after a failed build.** `npm run build && pm2 restart hermes-web`
   is a single gated step, or nothing.
4. **Licenses are checked, never assumed.** Only MIT / Apache-2.0 / BSD code may be
   copied into the app. AGPL/LGPL/Elastic stay out (read-only reference), CC0 lists are fine to read.
5. **Honest labels.** If an engine does not implement a product, the screen says so.
6. **No long-lived CPU-heavy servers on this box.** A Metro dev server started here
   once ate 69% of the CPU and starved the product engine: the same passport job took
   58 s while it ran and 7 s when it was stopped. Tunnels/dev servers must be asked for
   by the user, started under pm2 with a name, and stopped when the test is over.
7. **Low-resource VM.** This box runs the live site; no GPU, no 20-minute npm installs,
   no more than ~1 heavy process at a time.

## Queue

### 1. Wrap the tool screens in the shared frame (waiting on the frame)
The frame (`components/tool-frame.tsx`: header, one primary action, result card,
Tools/Recent/Account bar) and job history (`lib/history.ts`) are being written by the
design pass, together with the redesigned passport screen as the reference.
Until that lands, this item is **blocked**: if the frame file is absent at the hour you
run, do not invent a second layout — pick the next item and log this as blocked.
Once it exists, wrapping `bg-remove`, `pdf`, `invoice`, `signature` is mechanical: keep
each screen's own logic, replace only the outer layout, and confirm the web export builds.

**Still absent 2026-09-16 03:00:** `apps/mobile/components/tool-frame.tsx` and
`apps/mobile/lib/history.ts` do not exist, so this hour took item 11 and left this
blocked — logged, not invented.

### 2. PDF toolkit upgrade from Stirling-PDF — DONE 2026-09-16
Result: the licence was read in full and the decision is written up in
`docs/stirling-pdf-license.md`. The root `LICENSE` is MIT with seven carve-outs,
and **every carve-out directory exists**, including `engine/` (their Python side —
the part shaped most like our worker): all are under the paid "Stirling PDF User
License", so no code came from them. `app/core` is MIT but is Spring Boot Java,
which is a resident JVM on this box for no gain — read-only reference.
What we took is the **vocabulary**, on our own pdfcpu engine: two new `pdf-tools`
actions behind `/api/job`, `rotate` (`angle`, a multiple of 90) and
`page-numbers` (their 1..9 `position` grid mapped to pdfcpu anchors, `{n}`/`{total}`
translated to `%p`/`%P`). Verified live: job 44 rotate / job 45 page-numbers, with
merge 46, split 48 and compress 47 re-tested and still 200. `startingNumber` was
deliberately not adopted — pdfcpu prints the real page number, so an offset cannot
be honoured.
Follow-up (next hour, item 8): the PDF *screen* still shows three cards, so the two
new actions are engine-only until then.

`Stirling-Tools/Stirling-PDF` **92,222★**, active (pushed 2026-09-15), TypeScript/Java.
GitHub reports `NOASSERTION`, which means the license file is not a standard template —
**read `LICENSE` before copying anything**. It is the strongest single upgrade for the
PDF screen (merge, split, compress, OCR, sign, convert, page ops) and runs self-hosted.
Our angle: keep our `/api/job` contract, put Stirling-style operations behind it, and
reuse their parameter names so the screen can offer the same jobs.

### 3. Invoice: borrow the Indian GST + UPI QR template, not the app (UPI QR DONE 2026-09-16)
Whole-app candidates are unusable as code: `invoiceninja/invoiceninja` 10,079★
(NOASSERTION — Elastic/custom, verify), `InvoicePlane/InvoicePlane` 3,139★ (NOASSERTION),
`SolidInvoice/SolidInvoice` 969★ MIT but PHP + Postgres server.
What IS worth taking: the Indian-market pieces — GST tax split by HSN, sequential
invoice numbering, and the **UPI QR on the bill** (the NPCI `upi://pay?pa=..&am=..` spec),
plus a template set worth copying by eye from Invoiso (MIT).
Our angle: our invoice engine is already local and free; the upgrade is the QR + print layout.

**Done:** the UPI QR is on the bill. The engine builds the NPCI intent URI from its own
recomputed total (a caller claiming 99999 or 1 still gets `am=1451.40`), renders the code
with `qrcode`, and stamps it bottom-left at `pos:bl, off:55 120, rot:0, scale:0.27 abs`
(`rot:0` is required — pdfcpu's default image watermark rotates along the diagonal; and
`create` JSON ignores an image's `position`, it draws at the page origin, which is why the
code is stamped rather than declared). The screen (item 8's pattern) has a **UPI id
(optional)** field under GSTIN, validates the same `name@bank` shape, previews it on the
paper, and reports the engine's `upi_qr` back. Evidence: job **55** = HTTP 200 with
`upi_qr: true`, and the live worker's own PDF decodes to the exact URI.
Still open from this item: **HSN code + per-item GST rate** (the bill taxes every line at
one rate; a mixed 5/12/18% bill cannot be printed) and sequential invoice numbering.

### 4. Toolbox app: feature set from ImageToolbox (Apache-2.0, code reusable) — DONE 2026-09-16
`T8RIN/ImageToolbox` **14,631★** Apache-2.0, Kotlin, active — used as the feature
checklist, no code copied (our jobs are Pillow/pdfcpu recipes of our own).
Three of its checklist items are now **real products**, engine-backed and live:
  - **`exif-strip` — Photo Metadata Cleaner.** Strips the GPS IFD plus make/model/
    software/timestamp before a photo is posted anywhere. Free: it is a re-save.
  - **`photos-to-pdf` — Photos to PDF.** Up to 20 photos, one per page, A4/Letter/A5,
    order preserved, via pdfcpu `import` (real pages at 150 dpi, not a JPEG container).
  - **`collage` — Photo Collage.** 2-4 photos, auto/2x1/1x2/2x2/3x1 grid, every tile
    cover-cropped to the same cell on a white mat.
All three are `free: true` in the route (local, ₹0 per job) with catalogue rows in
`products` (31 total, they were the FK the route checks before it accepts a job).
Verified: jobs **58** (`exif_in: [datetime, gps, make, model, software]` → `exif_out: []`,
and the file re-downloaded from R2 carries no EXIF and no GPS IFD), **59** (3 photos →
3 A4 pages measuring 595x842 pt) and **60** (2x2, 2208x2208) all HTTP 200 through
`https://expo.dropby.co.in/api/job`; merge **61** re-run and still 200, so the old
products are untouched. Five guard cases answer an honest **400** (1 photo "A collage
needs at least 2 photos", 5 photos, `pagesize=a0`, `layout=9x9`, `cell_px=abc`) rather
than a 502. `npm run typecheck -w @hermes/web` exit 0 before the gated
`npm run build && pm2 restart hermes-web`; localhost:8080, /galaxy and
sarkarmarketplace.dropby.co.in all 200 afterwards.
Not done here: no screen yet — the toolbox grid still lists nine tiles, so the three
products are engine-only until item 14. Also unfixed: posting to the public host from a
script needs a browser User-Agent (Cloudflare answers a bare python-urllib POST with 403).

### 5. Video products: background removal in video (MIT) — BLOCKED 2026-09-16 on CPU cost
**Measured this hour, engine-side, before writing anything:** rembg's u2net costs **5.2 s per
frame** on this 4-core box at 480x360 (the model's input is a fixed 320x320, so frame size does
not buy anything — measured 5.2 s at 480x360 and the same class of cost at 960x540). A 3-second
clip at 10 fps is therefore ~30 frames = **2.5 minutes of a full core**, and the engine's job
timeout is 180 s, so a video product here could only pretend to exist for one or two seconds of
footage. The cheaper model (`u2netp`, ~4.6 MB) **cannot be fetched**: the download from
GitHub release assets stalled at **4.8 kB/s** and timed out at 6 % after 57 s (only `u2net.onnx`
is in the local rembg cache; `~/.u2net` does not exist). `nadermx/backgroundremover` needs torch,
which is not installed and is a multi-GB addition to the box that serves the live site.
**Not blocked forever, blocked on this box:** the honest options are (a) a hosted video
segmentation model through the Workers AI token that already works, or (b) a cap of ~12 frames
with the cost said out loud, which is not a product. Do not start it again without measuring the
per-frame cost first — the number is above.
`nadermx/backgroundremover` **8,053★** MIT, Python — images *and video* via ffmpeg.
Our angle: unlocks the subtitles/video app that has no engine today, on the same VM.
Not before the tools above are solid.
**Do NOT use** `imgly/background-removal-js` (7,317★) — AGPL-3.0, would infect the app.

### 6. Paid path: real money test (blocked on keys)
`RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` are empty in `apps/web/.env`, so no
order can be paid and the passport paywall cannot be completed end to end. Blocked on
the user; do not fake a payment to "verify" it.

### 7. Games → store-ready (partial — score persistence done 2026-09-16)
**Done: score persistence.** Both games only ever showed "Best score this session",
which resets every time the app is opened — so the number on the start screen was
almost always the round you had just played. `apps/mobile/lib/game-scores.ts` keeps a
per-game record on the device (`hermes-game-scores` in AsyncStorage): best, rounds
played, and the last 5 rounds with the line each round produced and when it was
played. Both `tap-sprint.tsx` and `word-duel.tsx` read it on mount, write the round
when it ends, and every label says **"on this device"** — there is no server table for
scores, and a number called global when it is one phone's would be a lie. The "New
best" badge is now decided from the stored record (a real cross-session best) instead
of the session, and the summary lists the recent rounds (`sinceLabel`: just now /
N min ago / N h ago / yesterday / N days ago).
Evidence: a real round played through the exported build at 390x844 — tap-sprint wrote
`{best:0,rounds:1,recent:[{score:0,line:"no dots hit"}]}` and, **after a reload** (a new
session), the start screen read "Best score on this device: 0 · 1 round played";
word-duel seeded at best 480 / 7 rounds rendered exactly that line, and a real 60 s
round left `best 480` (a worse round does not lower it), `rounds 8`, history rolled to
5 with the new round first and the oldest dropped, and tap-sprint's record survived
recording the other game. 24/24 checks, 0 page errors; `tsc --noEmit` 0 new errors
(6 pre-existing elsewhere); `expo export` 3.2 MB; the two gallery shots re-captured.
**Still open in this item:** icon/screenshot sets for the store — that belongs with the
store-submission decision in the parking lot (he chose 12 identities; Apple 4.3 is
re-checked before submitting the directory twins), so it is not an engineering hour.
The end-of-round summary was already real (score, hits, misses, lives lost, average and
fastest reaction for tap-sprint; score, words, longest, plus the words still on the
rack for word-duel), so nothing was invented there.
**Found while verifying, and it is why tap-sprint's round scored 0 — see item 21.**

### 8. PDF screen: offer the two new actions — DONE 2026-09-16
Result: `apps/mobile/app/tools/pdf.tsx` now lists five cards. **Rotate** carries a three-chip
angle picker (90 / 180 / 270) and the optional page range; **Page numbers** carries a 3×3
position grid laid out like the page (1 top-left … 9 bottom-right, default 8 = bottom
centre), a text field defaulting to `Page {n} of {total}`, and the same optional range.
The file stack still takes exactly one file for both, and the primary button names the job
it will run ("Rotate 270°", "Number pages at bottom centre").
Verified: jobs **50** (rotate 270), **51** (page-numbers pos 8) and **52** (page-numbers
pos 1, pages 2-4) all HTTP 200 through `https://expo.dropby.co.in/api/job`, with the meta
echoing `angle: 270` / `number_position: 8` / `pages: '2-4'`; the rotated output measures
**1400×1000 where the input was 1000×1400** (a real quarter turn, not a re-save) and the
numbered output keeps its geometry; `npx expo export --platform web` exit 0, bundle
**3.2 MB**; shots `app__pdf-tools__mobile-light` / `-rotate` / `-numbers`, each with its
marker text asserted in the live DOM (no page errors).
The screen offers only the angles the engine can actually do: **`angle=-90|-180|-270` answers
500** (`unknown shorthand flag: '9' in -90`) because pdfcpu reads a leading dash as a flag,
so the left turn is sent as **270** and labelled 270° (its help text says "three quarter
turns — the other quarter"). The route advertises the negative values too and the engine now
accepts all six (item 10, done), so the screen's 270° label and a script's `-270` both work.

### 10. Engine: the route advertises rotate angles the worker rejects — DONE 2026-09-16
`PDF_ANGLES` in `apps/web/app/api/job/route.ts` accepts `-90/-180/-270`, but pdfcpu parses
`-90` as a flag, so the worker answers 500 `unknown shorthand flag: '9' in -90` — measured
both on `127.0.0.1:8099` and through the public route. Fixed in the **engine**, not the route:
pdfcpu's parser scans the whole argument vector (it is not Go's `flag`, which stops at the
first positional), so `--` ends flag parsing before the positional angle. The call is now
`_pdfcpu([*args, srcs[0], "--", str(angle), out_path])` — checked against the binary first
(595x842 -> 842x595 for 90/270/-90/-270), then live: jobs **65/66/67/68/69/70** = 90, 180, 270,
-90, -180, -270, all HTTP 200 through `https://expo.dropby.co.in/api/job` with the meta echoing
the angle; job **71**'s R2 output re-downloaded and measured **842.00 x 595.00 pt** from a
595x842 input (a real quarter turn, not a re-save); merge **72** and page-numbers **73** re-run,
still 200. The screen needs no change — it already sends `270` for a left turn, and pdfcpu
treats `-270` and `270` as the same quarter, so both spellings work for the app and for a script.
Worker restarted once: `pm2 restart dropby-worker`, one listener on :8099, health pid **4792**
== pm2 pid, re-checked at the end of the hour.
Process note from the same hour: `127.0.0.1:8099` had **two** sockets — an unmanaged pid 4092
started 16:00, and pm2's `dropby-worker`. Stopping 4092 left the pm2 copy serving; pm2 then
restarted its worker (5336 → 7800, both loading the same `worker.py` from 16:05) and the old
socket lingered, so 5336 was stopped too. Final state: **one** listener on 8099, pm2 pid 7800,
health ok, and jobs 53/54 re-run through the public route as HTTP 200 afterwards.

### 11. Gallery: describe the two new PDF shots — DONE 2026-09-16
`SCREEN_INFO` now has `pdf-tools-rotate` and `pdf-tools-numbers` (title, what-it-is, and the
markers the capture asserted), and both names are in `SCREEN_ORDER` so they sort beside
`pdf-tools`. They were also in the wrong *tile*: `scripts/app-map.mjs` only knew
`pdf-tools` for that product, so the two shots sat in "Screens no app claims"; the product
now maps to all three screens, so the PDF Toolkit tile reads **3 shots**.
Evidence: `GET https://shots.dropby.co.in/shots` → **200**, 50,739 B, containing
"PDF toolkit — rotate, open" and the asserted line "one quarter turn"; the toolbox tile
reads "3 shots"; `pm2 restart shots-gallery` left exactly one listener on :8092 with
`health` pid == pm2 pid.

### 9. New candidate: Stirling-PDF's Pipeline endpoint as a job chain (blocked on licence)
Their `pipeline/Pipeline` controller chains operations into one request, which is what
our `/api/job` would need to compose (e.g. rotate + number + compress in one job). The
controller lives in MIT `app/core`, but the pipeline *engine* it calls is in the
proprietary `engine/` directory, so nothing can be copied from it; a chain of our own
would have to be designed from our own actions. Not worth starting before item 8.

### 12. The worker now clears the port before it binds — DONE 2026-09-16
`pm2 restart dropby-worker` was leaving **two** listeners on 127.0.0.1:8099: pm2 starts the
new Python child (`interpreter: none`) but the old child outlives the container, keeps its
socket, and goes on answering — measured this hour, `/health` reported the OLD pid while
pm2 reported the new one online. The guard comment in `worker.py` is wrong on Windows:
`allow_reuse_address = False` does **not** stop a second bind, so the new worker's bind
succeeds and the `except OSError` branch that calls `_clear_port()` never runs. Fix:
`_clear_port(args.port)` is now called *before* the bind loop, so the new worker asks
`/health` who is answering and retires them (`/internal/retire`, else taskkill). Verified:
a plain `pm2 restart dropby-worker` with no manual kills leaves exactly one listener with
`health_pid == pm2 pid`, checked at 3/6/9/12/15/18 s. Stale orphans from earlier runs
(pid 7800, then 9584, 368) were cleared this hour; the worker was left as **one** pm2
process (pid 9080 at the time of writing, health ok, 8 products).

### 13. Invoice: HSN codes and per-item GST rates — DONE 2026-09-16
Result: a bill can now carry a different GST rate per line, and an HSN/SAC code on the line
that has one. The engine groups the tax by rate (`invoice_maker` sums each rate's taxable
value, then CGST/SGST per group) and prints one block per rate; a single-rate bill keeps the
old `Taxable value / CGST / SGST` labels byte-for-byte, so nothing that worked before changed
shape. HSN prints under the item name as `HSN 8544` (`create` JSON has no room for a sixth
column without shrinking the item name). The screen (`apps/mobile/app/tools/invoice.tsx`)
gives every item a second line — an HSN field plus rate chips `Bill / 0 / 5 / 12 / 18`, where
`Bill` follows the bill-level rate — and the preview's split rows are the same groups the PDF
prints. Meta gained `gst_rates`, `tax_rows` and `hsn_items`.
Evidence: jobs **62** (5% biscuits + 18% wire + one item inheriting the bill rate: HTTP 200,
`tax_rows` `[{5,200,10,5,5},{18,1250,225,112.5,112.5}]`, `total 1685`, `totals_match true`,
UPI QR still `am=1685.00` and decoding) and **63** (single-rate: one group, unchanged
labels) through `https://expo.dropby.co.in/api/job`; the R2 preview of job 62 re-downloaded
(HTTP 200) and its content stream read back — `HSN 8544`, `HSN 1905`, `Taxable @ 5`,
`CGST @ 2.5`, `Taxable @ 18`, `CGST @ 9`, `Rs. 1,685.00` are all really on the page. Merge
(an old product) is **64**, still 200. `tsc --noEmit` reports **0** errors in `invoice.tsx`
(the screen's `job.meta?.upi_uri` block needed a local to satisfy it); `expo export --platform
web` **3.04 MB / 3084 KB JS**; shots `app__invoice__mobile-light` and `-dark` re-asserted with
`HSN is the code` and `applies to every item` in the live DOM.
Still open from item 3: sequential invoice numbering — item 15 below.
Worker restarted once (`dropby-worker`, pid 8980, one listener on :8099, `health.pid == pm2
pid`); no Next rebuild was needed — the route's `fields` are `doc, payload`, so the new
per-item data rides inside the existing payload.

### 14. Toolbox grid: give the three new products real tiles and screens — DONE 2026-09-16
The three engine-only products now have screens and tiles, and the app has its first
multi-file picker:
- `lib/tools.ts` gained **`pickFiles(kind, {multiple})`** — one `<input multiple>` on the
  web, `allowsMultipleSelection` on the native gallery, `multiple` on the document picker —
  with `pickFile` kept as `pickFiles(…)[0]`, so no existing screen changed shape. Order is
  the user's order and is never re-sorted: for these products the order *is* the job.
- **`/tools/exif-strip`** (Photo metadata cleaner): one photo in, and the screen shows its
  work — the tags the file arrived with, and the tags the file you download carries, both
  read back from the saved file by the engine.
- **`/tools/photos-to-pdf`**: a visible stack (the stack is the page order), page size A4 /
  Letter / A5, up to 20 photos, "Make the PDF · N pages".
- **`/tools/collage`**: 2–4 photos, shape chips 2 across / 2 down / 2×2 / 3 across / auto; a
  shape that cannot hold the photos is **dimmed with the reason on it** rather than sent and
  refused. `lib/product-ui.ts` gave all three their own accent.
- `READY_TOOLS` is now **8 tiles** (was 5) and the two cards that still wore **SERVER SOON**
  (`pdf-tools`, `invoice-maker`) are `ready` — their engines have implemented them since items
  2 and 13, so the label was stale; the section note says so out loud.
Evidence (all through `https://expo.dropby.co.in/api/job`, browser User-Agent): job **78**
`exif-strip` 200 — `exif_in: [datetime, gps, make, model, orientation, software]`,
`exif_out: []`, and the R2 file re-downloaded measures 1200×800 with **no EXIF keys and no
GPS IFD**; job **79** `photos-to-pdf` 200 — `pages_out: 2`, and the PDF re-downloaded is
**2 pages of 595×842 pt** (real A4); job **80** `collage` 200 — `grid 2x1`, `size_out
2208x1112` (= 2×1080 cells + 3×16 gaps, measured). Guard cases answer honestly: `pagesize=a0`
→ **400** "pagesize must be one of: a4, letter, a5".
`npx tsc --noEmit` in `apps/mobile`: **0 errors in the files this item touched** (6
pre-existing errors remain elsewhere: `app.config.ts`, `(tabs)/_layout.tsx`, `account.tsx`).
`npx expo export --platform web` → **3.2 MB** bundle, exit 0; `/tools`, `/tools/exif-strip`,
`/tools/photos-to-pdf`, `/tools/collage` all **200**; four screens re-captured through the
marker gate (`app__exif-strip__mobile-{light,dark}`, `app__photos-to-pdf__…`,
`app__collage__…`, plus the 8-tile `app__tools-hub__…`) and all four now claim their app in
`app-map.mjs` (`EXTRA_SCREENS`), so the gallery shows them under **Everyday Tools & Photo
Fix** with their `SCREEN_INFO` line.
Not done here: the collage shape guard is on the screen, but the engine still answers **500**
(→ 502 through the route) for a shape it cannot fill — item 19.

### 8. Expo examples as the pattern for the tool frame (MIT, exact stack) — DONE 2026-09-16
Result: `docs/expo-examples-notes.md` is written, and the three patterns are in it with
exact paths and line numbers: **(1) permission in two phases** — `permission === null`
means "render nothing", denial replaces the whole surface with one button
(`with-camera/App.tsx:22-35`); **(2) the capture screen is two states in one view, not a
modal** — `uri ? renderPicture(uri) : renderCamera()` (line 124), an absolutely-positioned
shutter row at `bottom: 44` with an 85 px ring / 70 px disc, and press feedback through a
`Pressable` that *has* an `onPress` (the prop whose absence deafened tap-sprint, item 21);
**(3) every picker reduces to `{uri, name, type}` and mimeType is the contract** —
`with-s3/app/index.tsx` refuses to upload without one, converts once with
`fetch(uri).blob()`; the older `with-formdata-image-upload/App.js` is the counter-example
(its `pickerResult.cancelled` is the SDK ≤47 spelling, and `type: image/${ext}` produces the
non-existent `image/jpg`).
**The third pattern item 8 named does not exist there:** authenticated code search gives
`expo-sharing repo:expo/examples` **0** hits and `expo-document-picker` **0**, so the share
sheet has no example to copy and cannot be claimed as one.
Licence and stack verified by API, not by a blurb: MIT, 3,728★, pushed 2026-09-03, 755 blobs
in the tree, and every example read pins `expo ^57.0.1 / react 19.2.3 / react-native 0.86.0`
— the same generation as `apps/mobile`. No code copied. The three deltas it produces
(`canAskAgain` → Settings in `lib/tools.ts`, a review state before the passport job is sent,
one secondary affordance in the frame's result card) belong with item 1's frame, not here.

### 9. Port 3 real tools from ImageToolbox's catalogue (Apache-2.0)
**Done by other items — do not redo:** `collage`, `exif-strip` (EXIF strip) and
`photos-to-pdf` (PDF from images) are engine-backed since item 4 and got their screens and
grid tiles in item 14 (2026-09-16). The feature checklist was used from
`T8RIN/ImageToolbox` (14,631★, Apache-2.0); no code was copied.
`T8RIN/ImageToolbox` (14,641★) holds ~100 image operations. Pick **collage**, **EXIF
strip** and **PDF from images** — each is cheap with Pillow + pdfcpu in `worker.py`,
each turns a "coming soon" card into a product, and Apache-2.0 allows attribution-only
reuse of the algorithm/UI ideas. One per run, with a real job id as evidence.

### 10. In-app background removal prototype (Apache-2.0) — DONE 2026-09-16
`huggingface/transformers.js` (16,296★, Apache-2.0) runs segmentation in the browser.
Prototype it behind a flag on the bg-remove screen and measure: model download size,
seconds on a phone, and whether the result is good enough for a passport photo. If it
works, jobs stop queueing behind the VM's CPU.

**Result: it runs, and it is measured.** `/tools/bg-remove` has a web-only flag row
("Cut it on this device — prototype"), **off by default**, and with it on the matting
runs in the browser: the photo is never uploaded and the VM does no work. The full
table is in `docs/bg-remove-on-device.md`; the short version, Chromium at 390×844 on
this box, `Xenova/modnet` through `@huggingface/transformers@4.3.0`:

| | fp32 (25.9 MB model) | q8 (6.6 MB model) — shipped default |
|---|---|---|
| pipeline ready, first use | 6.2 s | 5.8 s |
| cut, first / second run | 7.0 s / 6.5 s | 6.0 s / 5.6 s |
| output | 1024×683 RGBA PNG, 448 KB | 1024×683 RGBA PNG, 465 KB |
| alpha clear / opaque / partial | 73.5 % / 24.6 % / 1.9 % | 72.4 % / 24.1 % / 3.4 % |

First use costs **~12 MB** (model 6,632,188 B + `ort-wasm` 5,547,616 B, read off the
CDN's own `content-length`); every cut after that is the seconds above and nothing else.
q8 is the default: a quarter of the download, ~15 % faster, slightly softer edge.
Quality was checked by the numbers, not by eye — in the app's own PNG all four corner
alphas are **0** and the centre is **254** — which proves a matte, not hair-level
quality on a phone photo; that is why the screen says "prototype".
Licences: `Xenova/modnet` is Apache-2.0 (network: ZHKKKe/MODNet, Apache-2.0);
`briaai/RMBG-1.4` was rejected as **non-commercial**.
How it stays cheap: no npm install — `@huggingface/transformers` drags `sharp`,
`onnxruntime-node` and a 145 MB `onnxruntime-web`, so the browser loads the library
from a **pinned CDN URL** via `new Function("url", "return import(url)")`, which Metro
never sees. The bundle is therefore still **3.2 MB**, unchanged.
Evidence: the served exported build at 390×844 — 8/8 checks with the flag on (the
screen's own measured line read "the model came down in 7.9 s and the cut took 7.1 s,
the PNG is 465 KB at 1024×683. Your photo was not uploaded."), 0 page errors, and the
PNG the screen produced re-read with Pillow: RGBA 1024×683, 72.4 % fully clear, corners
0, centre 254. The server path is untouched with the flag off: jobs **122**, **123**
and **124** (a second pick in the same session) all HTTP **200**, the result card still
"Unlock the clean PNG · ₹99". `tsc --noEmit`: 0 errors in the two files touched (the
same 6 pre-existing elsewhere); `npx expo export --platform web` exit 0, **3.2 MB**;
both `app__bg-remove__mobile-{light,dark}` shots re-captured through the marker gate.
Not done, and not pretending: no real-phone number (this is the VM's Chromium), no
vendored library with an integrity hash, and no fallback rule if a browser cannot run
it — those are the new item 31.

### 11. markitdown as the document engine (MIT, 184k★) — DONE 2026-09-16
Result: the document engine is live as the catalogue's own **`resume-checker`** product
(`Resume Keyword Check` — that row already existed, so no new catalogue row was needed).
One document in (PDF / DOCX / plain text), a Markdown reading of it out, plus an optional
keyword check. Licence verified by API, not a blurb: `microsoft/markitdown` **MIT**,
184,612★, pushed 2026-09-16, not archived, Python; installed as `markitdown[pdf,docx]`
**0.1.7**.
Engine (`services/tools/worker.py`, `resume_check`): markitdown does the conversion and
the scoring layer only states what is measurable in the text — characters, words, pages
(pdfcpu), whether an email/phone is present, which of ten heading words appear, and for
each caller-supplied keyword whether the document mentions it (whole-word, so `sql` is
not "found" inside `mysql`). Nothing claims what "an ATS wants"; that is not knowable
from this box.
Route (`apps/web/app/api/job/route.ts`): `resume-checker` is `free: true` (a ₹0 local
job), reads `keywords` (capped at 700 characters), accepts `application/pdf` / `.docx` /
`text/plain`. `text/markdown` was added to `EXT_FOR_TYPE` — without it the report would
have been stored in the bucket as `.bin` — document inputs now get a truthful
`.docx`/`.txt` key instead of `.bin`, and the 415 sentence names formats through a small
label map (the DOCX mime type used to render as "VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORD…").
Evidence: job **93** (a real 3-page resume PDF — `posquit0/Awesome-CV`'s example, used
only as test input) = HTTP 200, `text_len 9705`, `words 1362`, `pages 3`,
`emails [posquit0.bj@gmail.com]`, headings `summary, experience, education, projects`,
`keywords_found [Kubernetes, Terraform]`, `keywords_missing [Python, Salesforce, Excel]`;
its output `marketplace/products/resume-checker/8752b41a….md` re-downloaded from R2
(10,172 bytes) and **all five keyword claims checked against the extracted text itself**
(5/5 agree). Job **94** = a real DOCX (1,189-byte OOXML fixture, labelled "Test fixture -
not a real person's CV"), HTTP 200, `input_suffix .docx`, email and a 9876543210-shaped
phone found, `keywords_found [SAP, forklift]`, `keywords_missing [Python]`. Both rows
`done` in `product_jobs` (93: 2,480 ms, 94: 188 ms).
Honest refusals: a photo through the route → **415** `This tool expects PDF or DOCX or
TXT`; a JPEG handed straight to the engine → **400** `that file is a JPEG image, not a
document — a photo has no text layer…`; 31 keywords → **400** `at most 30 keywords in one
check (31 were sent)`; random bytes → **400** "no readable text". That last guard was
added this hour because markitdown returns the *string* `None` for bytes it cannot
identify, so a length test alone reported a 4-character "document" — a real false
positive, found by testing rather than by reading.
Regression check, because the install **downgraded `onnxruntime` 1.27.0 → 1.20.1**
(magika pins `<1.21`): `bg-remove` (rembg/u2net) still answers **200, 409,082 B**, and
`exif-strip`, `collage` (2x1) and `pdf-tools merge` are 200 too.
Process: `pm2 stop dropby-worker` → 8099 free → `pm2 start ecosystem.config.js --only
dropby-worker` (one listener, `health.pid 6560 == pm2 pid`); `npm run typecheck -w
@hermes/web` exit 0 — it caught a real TDZ error (`DOC_ACCEPTS` read by the ENGINE table
while the module loads) that was fixed before the gated `npm run build && pm2 restart
hermes-web`, after which localhost:8080 and `/galaxy` are 200.
Still open from this item: **(a)** no screen — the toolbox grid has no tile for this
product, so it is engine + route only until item 24; **(b)** the catalogue row still says
₹99/month while the route serves the job free, so a screen would show a price the job
does not charge (see the parking lot — that is his decision); **(c)** markitdown's
xlsx/pptx extras are not installed, so those formats are not claimed anywhere.

### 12. colibri as the ₹0 text engine (Apache-2.0, 34k★) — BLOCKED 2026-09-16 on this box's hardware
`JustVugg/colibri` (Apache-2.0) streams a large MoE model from disk on CPU. The win is
removing the API bill behind the writing products. Do NOT install it until you have
measured: idle RAM, disk needed, and whether a single request starves `hermes-web`.
If it does starve it, park it and say so — this box serves the live site.

**Measured this hour, before any download — parked. Licence passed (Apache-2.0, 34,816★,
pushed 2026-09-15, C, not archived — GitHub API); the hardware did not.** Written up in
`docs/colibri-feasibility.md`. The box, measured: **4 vCPU, 8.0 GB RAM (4,854 MB free with
the pm2 fleet up), 43.5 GB free disk on a QEMU virtual SCSI disk**, 48 % CPU.
Against colibri's own requirements table: **OLMoE** (the only disk-fit model, 7 GB) wants
**8 GB RAM — this box's entire RAM** and is 7B/1B-active; **Qwen3.6-35B-A3B**, the smallest
*useful* one, wants 20 GB disk (fits) and **24 GB RAM** (does not); every larger family
needs **85–1,600 GB of weights** against 43.5 GB free and **16–32 GB RAM** against 8. Their
own floor is a *25 GB* box at 0.05–0.1 tok/s cold, and their docs call virtualised disks
"neutral to negative". So the third measurement answers itself: a 4-core VM cannot stream an
MoE and serve the live site, and nothing was installed or fetched.
Nothing was lost by parking it: the only hosted-model product (`ai-image`) costs ₹0.17 an
image inside a 10,000-neuron/day free tier, every other live product is local and ₹0, and the
intended ₹0 text fallback is the local chain (`rules → tesseract → pg_trgm`) that **item 17**
builds — which is unblocked and cheaper than any model on disk. Re-open only on a host with
≥24 GB RAM **and** ≥120 GB free disk.

### 13. VoxCPM for the voice-over product (Apache-2.0, 37k★)
`OpenBMB/VoxCPM` (Apache-2.0) is TTS with voice design. Turn "Text to voice-over"
(₹99/clip) from a card with no engine into a product: text in, MP3 out, in R2, priced.
Requires torch on CPU — measure seconds per 100 words and report them.
**Check it against the same ceiling first (measured 2026-09-16, item 12): this box is 4 vCPU /
8.0 GB RAM (4.7 GB free) / 43.5 GB free disk on a QEMU virtual disk.** A CPU torch wheel plus
a VoxCPM checkpoint has to fit inside that *while* the live site and the product worker run —
write the numbers down before the install, exactly as item 12 had to.

### 14. Wire the Workers AI token and prove one hosted model (blocked on one credential)
Read `docs/ai-compute-plan.md`. The R2 key is NOT an AI token (tested: code 10000
"Authentication error"). Until `CLOUDFLARE_AI_TOKEN` exists in `apps/web/.env`, this item
is **blocked** — log it as blocked once, then stop re-reporting it.
When the token appears, first job: subtitles. `@cf/openai/whisper` at $0.0005 per audio
minute, called from `/api/job` with the token kept server-side. Evidence: a real audio
file → transcript text, with the meta showing seconds and the model used.

### 15. Translation product on indictrans2 (needs the same token)
`@cf/ai4bharat/indictrans2-en-indic-1B` at $0.342/M tokens is purpose-built for
Hindi↔English and priced below every general model. Build "Hindi ↔ English document
translation" (₹49) as: markitdown extracts → indicTrans2 translates → markitdown rebuilds.
Evidence: a real contract/resume page in Hindi, translated, both files in R2.

### 16. Price our products from real cost, not guesses
Once one hosted model runs, measure actual cost per job from `product_jobs` duration and
the model's neuron rate, and put the number next to each price in `docs/product-plan.md`.
The point: "₹99 voice-over" should be backed by a measured rupee cost, not an estimate.

### 17. Build the provider router with the fallback chains (no keys needed)
`docs/resources-and-apis.md` defines the chains. Implement `apps/web/lib/ai.ts`: one
function per capability (text, vision, translate, stt, tts, image) that walks its chain in
order, with a 20 s timeout per provider, a health check, and the serving provider recorded
in the job's `meta`. It must work with ZERO keys configured — the local paths (rules,
`tesseract`, `pg_trgm`) are the terminal fallback, so the router is testable today.
Done when: a unit-style script proves the chain falls through when the first provider
throws, and the record names which provider answered.

### 18. UPI QR on the invoice (no vendor needed)
The invoice engine can print a UPI QR from the NPCI spec string
`upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>` — no payment gateway, no key.
That gives every shopkeeper bill a way to be paid even while Razorpay keys are missing.
Evidence: an invoice job whose output PDF contains a decodable QR, verified by decoding it.

### 19. Make invoice / pdf / signature respect the theme (measurable, not a matter of taste)
Those three screens call neither `useTheme` nor `useProductUI` (0 references — verified),
so they ignore dark mode. The proof is in the gallery: their `mobile-dark` and
`mobile-light` captures are **byte-identical** (same MD5) while every other screen differs.
Convert each to the pattern `bg-remove` uses — `const ui = useProductUI("<product>")` plus
`makeStyles(ui)` — with no raw hex values.
Done when: `python scripts/app-shots.mjs --only invoice` (and pdf, signature) produces
dark and light captures whose MD5s **differ**, and the job is logged with both hashes.
If a screen is genuinely meant to be light-only (a printed invoice, say), say so in the
log and note it in SCREEN_INFO instead of pretending it is dark-capable.

### 20. Wrap `breathe` in the shared frame once the frame exists
`apps/mobile/app/breathe.tsx` is new (the ₹0 slow-breathing screen). It carries its own
layout today because the frame does not exist yet; when `components/tool-frame.tsx` lands,
wrap it like the other tool screens. Until then, do not touch it — it works.

### 21. Build the gate `targets.mjs` promises (it does not exist)
`apps/mobile/targets.mjs` says "scripts/check-targets.mjs refuses a build where two
targets are too similar to survive review" — there is **no such file**. Store review
(Apple 4.3, Play spam) is the single biggest external risk to this fleet, and the gate
that would catch it is missing. Build it: read TARGETS, compare name / tagline / store
category / permissions / firstScreen / aso keyword overlap, and fail with the two ids and
the reason. Run it against the current 13 targets and report what it flags.

### 22. Give the tool screens their own deep links on the test page
`/live` shows one card per app; the toolbox app hides five screens behind `/tools`. Add a
"Screens" section that deep-links each one directly (`/tools/bg-remove`, `/tools/pdf`,
`/tools/invoice`, `/tools/signature`, `/tools/exif-strip`, `/tools/photos-to-pdf`,
`/tools/collage`, `/breathe`, `/tap-sprint`, `/word-duel`) with a QR each, so a person can
test a screen instead of hunting for it. Evidence: the count of codes on the page before
and after.

## Parking lot (needs the user, do not start)
- Apple review strategy: he chose to keep 12 identities. Guideline 4.3 rejects
  "multiple Bundle IDs of the same app"; before submitting the directory twins
  (Indore directory / SarkarHealth / SarkarCars) re-check that decision with him.
- Native builds: `eas build` needs his Expo/Apple login.
- Expo Go tunnel from this VM fails (anonymous ngrok timeout) — see the skill.
- **`resume-checker` pricing (from item 11):** the catalogue row says ₹99/month and
  `plan: monthly`, but the route serves the job free because it costs ₹0 to run. Either
  the row becomes `price_paise 0` (free, like `exif-strip` / `photos-to-pdf` / `collage`)
  or the product needs a real paid tier — which for a text report means building a
  preview that can watermark text (there is no `pdf-stamp`/`watermark` path for
  `text/markdown` today). Not changed unilaterally.
- **`ai-image` (Text to Image) pricing (from item 20):** the catalogue row is `price_paise 0` /
  `plan free` and the route serves the job free, because the paywall cannot take money yet
  (Razorpay keys, item 6). Unlike the three local products this one **costs real money to run**:
  Cloudflare bills 172.8 neurons for one 1024x1024 4-step image ≈ **Rs 0.17**, with 10,000 free
  neurons a day (~57 images/day) before the meter starts. So "Free" on the tile would be true for
  the customer and untrue as a business — either it becomes a paid pack (and then it needs a
  working gateway and a preview), or the free allowance is the whole offer and the tile says so
  ("free while the daily allowance lasts", counting jobs). His call; nothing was changed.

### 15. Invoice: sequential invoice numbering — DONE 2026-09-16
The bill number is typed by hand, so a shop that forgets it prints "No bill number" and two
bills can carry the same one. The honest version is a running counter the app remembers
per shop (last number + 1, editable upward): a bill numbered `014` twice is a tax problem
for the shop, not a cosmetic one. Needs a place to keep it (the screen's own storage, or a
`invoice_counters` row keyed by GSTIN), and the engine should keep taking whatever the app
sends — numbering is the app's business, not the renderer's.

**Result:** the number counts itself, per shop, on the device. The rules are pure and live in
`@hermes/core` — `parseBillNo` (a trailing digit run, with whatever prefix the shop uses),
`shopKeyOf` (a real 15-character GSTIN when there is one, else the folded shop name),
`advanceCounter` (forward only: a reprint of `007` against a counter at `014` does not rewind
it), `nextBillNo` (last + 1, **padded to the width of the last one** so `014` → `015`, and
`999` → `1000` rather than a truncated `100`) and `counterLabel`. Only the *storage* is in
`apps/mobile/lib/invoice-counter.ts` (`hermes-invoice-counters` in AsyncStorage, corrupt
entries treated as absent, oldest counters dropped past 50 shops), because there is no
`invoice_counters` table and a counter labelled as the shop's own when it is one phone's would
be a lie — every sentence about it says "this phone". A number this cannot parse
(`INV/26/07-A`) changes nothing and the screen says so instead of inventing a next number.
The field is offered only while it is the app's own: typing in it hands it to the user
(`billTyped` ref), and the counter never overwrites that. A number already used is said
**before** the PDF is made, not after.
Evidence: 8/8 `@hermes/core` tests (two new tables: parse/advance/next, and shop keys),
then **20/20** checks at 390×844 against the live app — a fresh phone offers `1`, the POST
that follows is job **115** (HTTP 200) and the field then offers `2` with "the next bill from
this shop is 2 on this phone"; the counter survives a reload; a second shop starts at `1`
again and switching back restores `2`; a seeded `{last:14,width:3}` reads back as **`015`**,
job **116** (HTTP 200) is that bill, its download is named `invoice-015.pdf` (not after the
number the field has already moved to), and **the PDF job 116 produced carries `No: 015` in
its own content stream** (`pdfcpu extract -m content`), with the arithmetic intact
(500 taxable, 45+45, `Rs. 590.00`, "Five hundred and ninety rupees only") and `totals_match
true`. `tsc --noEmit`: 0 errors in the two files this item touched (6 pre-existing
elsewhere); `expo export --platform web` exit 0, **3118 KB**; the two invoice gallery shots
re-captured with the marker gate, whose invoice entry now also asserts the numbering copy.
No engine change and no engine restart — the route's `fields` are `doc, payload`, and a bill
number is the app's business; **no `npm run build` either**, since nothing in the web app
imports the new core exports, so the live site was never restarted.
Still open: the counter is one phone's. A shop billing from a tablet and a phone has two
counters — that needs a `invoice_counters` row, which is item 27.

### 16. Invoice screen: the item meta line at 320-360 px — DONE 2026-09-16
Item 13 put an HSN field plus five rate chips under each item; the shots are 390 px wide and
the line fits there. A 320 px phone (iPhone SE 1st gen, the narrowest still in use) may wrap
the chips or squeeze the HSN field to the point where `HSN 8544` cannot be read. Re-shoot
`/tools/invoice` at 320 and 360 px, and if it wraps, drop the chips to a per-item tap that
opens the four rates instead of showing all five inline.

**Result (measured first, then the one real fix):** the line **does not wrap** and nothing on the
screen is clipped at 320 px, so the fix this item anticipated was not needed. What the measurement
did turn up:
- The item meta row at 320 px: HSN field **104 px** (75 px of room inside it) + five chips of
  **30 px** each (the row's 276 px, minus the field and the gaps, split five ways). The widest
  labels "12%" / "18%" measure **26.7 px** into 28 px of chip — single line, 1.3 px of slack.
  At 360 px the chips are 38 px, at 390 px they are 44 px (15 px of slack).
- `document.scrollWidth` equals the viewport at all three widths, **no** element's right edge
  leaves the viewport, no text element reports `scrollWidth > clientWidth`, and an 8-character
  HSN (`85441190`, 53.9 px) fits the field's 75 px — so the item's own worry ("`HSN 8544` cannot
  be read") does not happen. `HSN 8544` measured 55.2 px.
- **The one clipped string was the field's own placeholder.** `HSN (optional)` measures **81.6 px**
  against 75 px of room: cut off at 320 px *and at 360 and 390*, i.e. in the shots that were
  already in the gallery. `Code (optional)` is worse (85.7 px). Fixed by making the placeholder
  **`HSN code`** (55.3 px, 19.7 px of slack) and saying the word "optional" in the help line that
  already said it ("HSN is the code a B2B bill wants on the line — it is optional, so leave it
  empty if you do not have one"), with the px figures in a code comment so the longer placeholder
  is not restored by a later pass. No geometry changed, so the tight 320 px chip row is untouched.
Evidence: a filled bill (Shop "Sharma Electricals", GSTIN, UPI id, customer "Verma Traders",
one item "Copper wire 1.5 sq mm" @ ₹1250, HSN 85441190, 18%) rendered and measured at **320 / 360 /
390** — before: placeholder 81.6 → 75; after: 55.3 → 75, `clipped: []`, `beyond: []`, every paper
row (Taxable value / CGST 9% / SGST 9% / Total, ₹1,475.00) unclipped, 0 page errors.
`npx expo export --platform web` exit 0, bundle **3,193,106 B / 3118 KB**; the served bundle on
`127.0.0.1:8091` and `expo.dropby.co.in` contains `HSN code` and no longer contains `HSN (optional)`;
the two gallery shots re-captured through the marker gate (117 KB each, 390x844); `tsc --noEmit`
still exactly the same 6 pre-existing errors, **0** in `invoice.tsx`; **job 120** through
`https://expo.dropby.co.in/api/job` = HTTP **200**, `totals_match true`, `hsn_items 1`,
`upi_qr true`, `total 1475` — the product still runs end to end. No engine restart and no
`npm run build` (nothing in the web app imports this screen, so the live site was never touched).
Still open, new item 30: the 1.3 px of slack on "18%" at 320 px is slack in Chrome's font stack
on this VM, not on a phone.

**Order note 2026-09-16:** item 5 (video, `backgroundremover`) needs a torch + ffmpeg install
of several GB on the box that serves the live site, so it must run in an hour that does
nothing else. Until then take the finishable open items above it in file order — 10 (the
route advertises rotate angles the worker 500s on), 11 (gallery `SCREEN_INFO` for the two new
PDF shots), 14 (toolbox tiles for the three new products) — rather than skipping down to 15/16.

### 17. The `expo-dev` tunnel is wedged and burning a core (blocked on his OK to stop it)
`pm2` shows `expo-dev` (pid 7464, `:8095`) running `npx expo start --tunnel --port 8095` for
4 hours at **126% CPU / 221 MB** — the anonymous-ngrok tunnel this VM has never managed to
connect (see the skill). It is a retry loop on the box that serves the live site and the
product engine, and it produces nothing. Stopping it is one command
(`pm2 stop expo-dev`), but it is a process this job did not start, so it needs his word —
and if he does want phone access, a dev-client build or a hostname on the existing
Cloudflare tunnel replaces it (that needs a token with DNS + Tunnel edit rights).

### 18. Route: an unparseable `pages` range is a 502, not a 400 — DONE 2026-09-16
**Done, and the item's own suggested regex was wrong — measured before writing it.** Two facts
had to come off the binary first. `pdfcpu selectedpages` (v0.15.0) documents a grammar much
richer than `\d+([-,]\d+)*`: it also takes `odd`, `even`, `l` (last page), `3-` / `-4` (open
ends) and `!5` / `n5` (exclude). A check written from the guess would have refused ranges the
engine handles correctly. And `pages=-1` is **meaningful**: `-#` means "first page – page #", so
`-1` is page 1 and produces a real 1-page PDF (889 B, byte-identical to `pages=1`) — allowed and
documented, not a silent wrong answer.
The bigger defect found by measuring it: `3-1`, `9-12` and `!6` select nothing, and pdfcpu
**exits 0** having written a **0-byte file** while printing `aborted: missing page numbers!`. The
engine saw a clean exit and handed back a 200 whose output is empty — a finished job the app
would show as a blank document, stored in R2. That is worse than the 502 this item was about.
Fix in the two files, one item:
- `services/tools/worker.py`: new `_pdfcpu_pages(args, out_path, pages)`, used by the three
  actions that take a caller range (split/trim, rotate, page-numbers). A non-zero pdfcpu exit on
  a caller-supplied range is a `UserError` (400 with `PDF_PAGES_HINT`, pdfcpu's own sentence
  appended); a 0-byte output on a caller-supplied range is a `UserError` naming the range. With
  no range sent, an empty output stays a `RuntimeError` → 500, because that is a real fault.
- `apps/web/app/api/job/route.ts`: `PDF_PAGE_EXPR` + `isPageRange()` implement pdfcpu's own
  grammar (verified against 39 values: 26 that must pass, 13 that must fail, 0 disagreements), so
  a range pdfcpu cannot parse is a **400 naming the format before the file is uploaded** — a 30 MB
  scan is not free to send and wait for a failure.
Evidence, engine first: **23/23** cases on `127.0.0.1:8099` against a real 5-page PDF — 400 for
`abc`, `1;2`, `1--2`, `1.5`, `1 - 3`, `0`, `n1`, `3-1`, `9-12`, `!6` (and the same for rotate and
page-numbers), 200 with the right page count for `1-3` (3), `1-` (5), `odd` (3), `even` (2), `l`
(1), `1,2` (2), `-1` (1), plus rotate/page-numbers/compress with no range unchanged (5 pages).
Then through `https://expo.dropby.co.in/api/job`, browser User-Agent: **9/9** — jobs **97**
(`split 1-3`, `pages_in 5`, `pages_out 3`, 1253 B), **98** (`odd` → 3 pages), **99** (`rotate 270`,
no range, 5 pages), **100** (`compress`) all 200; the 400s carry `pages must select pages, e.g.
1-3,7 — also odd, even, l (last page), 3- (from page 3), -4 (up to page 4), !5 (exclude)`; the two
empty-selection cases are recorded as `failed` rows **95/96** (the route's own shape check answers
before a row exists, which is the intent). Merge re-run = jobs **102**/**103**, 200.
`npm run typecheck -w @hermes/web` exit 0, then the gated `npm run build && pm2 restart
hermes-web`; `localhost:8080`, `/galaxy`, `sarkarmarketplace.dropby.co.in` and `expo.dropby.co.in`
all 200 afterwards. Worker restarted as `pm2 stop` → port free → `pm2 start --only dropby-worker`
(never a plain restart, see item 12): one listener on 8099, `health.pid 6604 == pm2 pid`.
Still open next door: the **screen** (`apps/mobile/app/tools/pdf.tsx`) guards the range with
`/^[0-9,\s-]+$/`, which is narrower than the engine (it hides `odd`/`l` from the app) and wider in
one place (`1 - 3` passes the screen and is now refused by the engine) — see the new item 25.

### 19. Engine: a bad request from the caller comes back as 500 (→ 502), not 400 — DONE 2026-09-16
Result: caller mistakes now answer **400 with the reason**, and only real faults stay a 500.
In `services/tools/worker.py` there is a `class UserError(RuntimeError)` and every raise written
for a *caller* to read became one: merge with one PDF, split with no range, an unsupported angle,
a bad page-number position, an unknown pdf action, an unknown image op, 0/>20 photos, an unknown
page size, collage photo counts and an unfillable grid, non-numeric `cell_px`/`gap`, a missing
shop/customer/items, a `payload` that is not JSON, a missing prompt, and a malformed job envelope
(which used to be an unhandled `json` error). Genuine faults deliberately stay `RuntimeError` →
500: pdfcpu missing, a pdfcpu failure, no AI token, an empty Workers AI response.
`Handler.do_POST` catches `UserError` **before** `Exception` and answers 400 (and prints
`worker: 400 <product>: <reason>` into the pm2 log). In `apps/web/app/api/job/route.ts` an engine
answer in 400–499 is passed through as a **400 carrying the engine's own sentence** instead of
being collapsed into the 502; 5xx still maps to 502.
Evidence (16 engine cases on `127.0.0.1:8099`, then 4 through the public route): 3 photos +
`layout=2x1` → **400 `a 2x1 sheet holds only 2 photos`** (was 502); `cell_px=abc`, `op=bogus`,
`angle=45`, split with no range, `position=99`, `action=bogus`, `pagesize=a0`, `payload={nope`,
no shop name, no prompt, malformed envelope → all **400** with a readable message; rotate on a
file that is not a PDF → still **500→502** `xref table: no header version available`; real jobs
still **200** (collage 2x1, merge, invoice with HSN/UPI intact, image resize). Through
`https://expo.dropby.co.in/api/job`: 400 with the sentence above, an unreadable PDF still 502,
and 2 photos → **job 91**, `grid 2x1`, `size_out 2208x1112`, whose R2 file re-downloaded is a
**19,173-byte JPEG** = `bytes_out`. No screen change was needed: `apps/mobile/lib/tools.ts`
already throws `json.error`, so the app now shows the engine's reason.
Process note: a plain `pm2 restart dropby-worker` this hour put pm2 into a **restart loop**
(↺ 63 → 72, status `waiting restart`) because the new worker retires the very pid pm2 is
tracking; recovered with `pm2 stop dropby-worker` → port free → `pm2 start ecosystem.config.js
--only dropby-worker`, then stable for 40 s+ with one listener and `health.pid == pm2 pid`
(3316). Do not loop on `pm2 restart`: stop, confirm 8099 is free, then start.
Still open next door: item 18 (`pages=abc` is still a 502 — the engine's *shape* check now
answers 400 for its own validations, but pdfcpu's failure on a nonsense range is still a 500).
Found while guarding the collage screen: `POST https://expo.dropby.co.in/api/job` with
`product=collage, layout=2x1` and **3** photos answers **502** — the only thing wrong was
the request. The engine raises `RuntimeError("a 2x1 sheet holds only 2 photos")` for caller
mistakes exactly as it does for a genuine fault, and `services/tools/worker.py` turns every
`RuntimeError` into an HTTP **500**, so `route.ts` (which maps engine failure to 502) has no
way to tell "you asked for something impossible" from "the server broke".
The same shape is behind item 18 (`pages=abc`).
Fix in the engine first: a `UserError` (or a `RuntimeError` raised for a caller-input reason)
should answer **400** with the same message — the messages are already written for a user to
read — and only an unexpected exception stays a 500. Then the route can pass a 4xx through
instead of masking it, and the app can say the reason rather than "Could not finish the job".
Measured this hour: `pagesize=a0` → 400 (route-side check, correct), 3 photos + `layout=2x1`
→ 502 (engine 500). The three new screens guard their own inputs, so this is reachable today
only from a script or a future screen.

### 20. Workers AI image generation already works — the route just has no `ai-image` entry — DONE 2026-09-16
Found while proving that a genuine fault still answers 500: `POST 127.0.0.1:8099/job/ai-image
?prompt=...` returned **200 with a real 509,519-byte image** from
`@cf/black-forest-labs/flux-1-schnell`, so the engine's hosted-model path is live today. The
token comes from `AppData\Local\hermes\.env` (`CLOUDFLARE_API_TOKEN`), not from
`apps/web/.env`, which holds **no** AI key at all — so item 14's premise ("blocked until
`CLOUDFLARE_AI_TOKEN` exists in `apps/web/.env`") is worth re-reading: the worker is the
server-side half, and the route talks to the worker, so the token does not have to move into
the web app's env for a product to use it.
Through the app it is still nothing: `POST https://expo.dropby.co.in/api/job` with
`product=ai-image` answers **404 "Unknown product"** because `ai-image` has no `ENGINE` entry in
`apps/web/app/api/job/route.ts`. By item 4's three-edit rule it also needs a `products` row and a
screen. Candidate work: "Text to image" = one route entry + one catalogue row + one screen, with
the price measured against the real per-image cost (item 16's job) rather than guessed.

**Result:** the door exists — **Text to Image** is a live product.
- `apps/web/app/api/job/route.ts`: ENGINE gained `"ai-image": { engine: "ai-image", dataOnly:
  true, fields: ["prompt"], free: true }`. `dataOnly` because the prompt *is* the input — there
  is no file, the same shape the invoice maker already uses — and only `prompt` is forwarded, so
  a caller cannot pick a model nobody measured. `FIELD_LIMITS` gained `prompt: 300` (the default
  120-character cap is too short for a sentence describing a picture).
- Catalogue row inserted with the **Management API** (no SQL Editor, no credentials to move):
  `slug ai-image`, name **Text to Image**, `price_paise 0`, `plan free`, `category photo`,
  `sort_order 32`, `cost_model free_image`, `enabled true`.
- Evidence through `https://expo.dropby.co.in/api/job` (browser User-Agent), **job 117** =
  HTTP **200 in 6.3 s**, `meta.model @cf/black-forest-labs/flux-1-schnell`, `generated true`,
  `bytes 306044`, `locked false`/`free true`, and the row in `product_jobs` is **done**
  (`duration_ms 2905`). Its `output_url` re-downloaded from R2 = **306,044 B JPEG 1024x1024**
  (57 distinct colours in an 8x8 sample, i.e. a drawn picture, not a flat placeholder).
  Honest edges: no prompt → **400 `prompt is required`**; a >300-character prompt → **413
  `prompt is too long`**; `exif-strip` re-run afterwards = job **119**, still 200, so the route
  change broke nothing else. `npm run typecheck -w @hermes/web` exit 0, then the gated
  `npm run build && pm2 restart hermes-web`; localhost:8080, `/galaxy`,
  sarkarmarketplace.dropby.co.in and expo.dropby.co.in/tools all 200 after.
- One caveat measured on the way: the **first** engine call this hour answered
  `500 {"error": "HTTP Error 400: Bad Request"}` (Cloudflare rejecting the request once) and the
  immediate retry answered 200 with a 569 KB JPEG. The engine collapses any CF failure into one
  line (`ai_image` catches nothing between `urlopen` and the caller), so a transient upstream 400
  reaches the app as a 502 — worth a retry-once in the engine if it recurs, not a change to make
  from one sample.
- Cost, measured against the published rate rather than guessed: 1024x1024 at 4 steps =
  4 tiles x 4.8 + 4x4 x 9.6 = **172.8 neurons ≈ $0.0019 ≈ Rs 0.17 per image**, against
  **10,000 free neurons a day (~57 images)**, then $0.011 per 1,000 neurons. The product is
  free to the customer today because the paywall still has no working gateway; see the parking
  lot — **what it should cost is his call.**
Still open: **no screen and no tile** — the toolbox grid lists eight and none is this product
(new item 28).

### 21. tap-sprint's playing field is inert on the web build — FIXED 2026-09-16
**Cause, measured: it was not `locationX`/`locationY` (those arrive correctly) and not
the field's registration — it is react-native-web's press delay.** RNW's Pressable waits
`DEFAULT_PRESS_DELAY_MS` = **50 ms** before it *activates* a press, and a press released
inside that window is only reported at all when the Pressable **also** has an `onPress`
handler — `PressResponder._performTransitionSideEffects` calls `_activate` on
RESPONDER_RELEASE only `if (onPress != null)`. The field listens on `onPressIn` alone, so
every real tap (a click, a `touchscreen.tap()`, any press shorter than 50 ms) was dropped
on the floor, while a **300 ms press-and-hold scored**. Bisected on the exported build:
with `onPress={() => {}}` added, presses worked; with only a `console.log` added, a click
and a touch tap still did nothing — so the handler was never called, i.e. the earlier
"the tap does nothing" reading was right but the reason was wrong.
Fix: `delayPressIn={0}` on the field (web only — RNW-only prop, widened type so the
native path is untouched), so the press activates at pointerdown, the moment the reaction
should be measured from.
Second, independent bug in the same screen: the first dot of every round had no deadline.
`startRound()` calls `spawn()` in the same event as `setPhase("playing")`, so the `[phase]`
effect's cleanup for the previous phase ran *after* the timer existed and deleted it
(measured: 3.2 s of no input cost no life). The deadline is now cancelled on unmount only
(a timeout arriving after the round is over is already inert — `registerMiss` returns
unless the phase is "playing").
Evidence: a **real round played** through the exported build at 390×844 — 190 taps → **190
dots hit, score 1900**, avg reaction 156 ms, fastest 141 ms, plus one deliberate corner tap
counted as a miss with "That was the field, not the dot — a miss."; the device record reads
`{"best":1900,"rounds":1,"recent":[{"score":1900,"line":"190 dots hit · avg 156 ms · fastest
141 ms"}]}` and after a reload the start screen reads "Best score on this device: 1900 · 1
round played". The first dot now times out: lives 3 → 1 in 3.2 s ("The dot timed out — too
slow."), 6/6 and 10/10 checks green, `tsc --noEmit` 0 errors in the file, no page errors.
Note for the next screen with a custom press surface: a bare `Pressable` + `onPressIn` is
the trap — use the design system's `Press` (it has `onPress`) or set `delayPressIn={0}`.

**Original finding, kept for the record** (open, found 2026-09-16):
a round of tap-sprint can be _started_ and the clock runs, but **no input reaches the field** — the
round always ends with `Dots hit 0 / Misses 0 / Lives lost 0`, which is how a 30-second
round can end without a single thing happening in it.
Measured at 390×844 against the exported web build (`127.0.0.1:8091`, the same bundle
`expo.dropby.co.in` serves and the gallery screenshots come from):
- the dot is really on the page (a `116×116` div, accent `rgb(219,39,119)`,
  `border-top-left-radius: 58px`) and it sits inside the field `<button>` that
  `accessibilityRole="button"` produces (`358×388` at 16,119);
- a **touch tap and a mouse click at the dot's own centre** both land on that button
  (verified by instrumenting capture-phase `pointerdown`/`touchstart`/`mousedown`/`click`:
  `pointerdown -> BUTTON @187,408`) and the score stays 0, the lives stay 3, the dot does
  not move and no notice appears;
- a **deliberate miss** (a tap 8 px inside the field's own corner, far from the dot) does
  nothing either — no "that was the field, not the dot" line, no life lost;
- **sitting still for 3 s changes nothing**: the dot's own 1.5 s deadline
  (`BASE_ALLOW_MS`) never fires, so the dot is not respawned and no life is lost — which
  points at `missTimer` being cleared as the round starts (`startRound()` calls `spawn()`
  before React commits, and the `[phase]` effect's cleanup clears the timer that was just
  created) *and* at the field's handler being dead;
- word-duel's letter tiles **do** respond in the same browser (pressing `N` puts `N` in
  the picked row), so the input path and the harness are fine — it is this field.
This is **pre-existing, not a regression**: the same probes were run against the
committed build (`git stash push -- apps/mobile/app/tap-sprint.tsx`, re-export, probe,
`stash pop`) and the field was just as inert there.
Why it matters beyond the game: the store screenshots and the gallery captions are taken
from this web build, so a game whose only interaction does nothing is not store-ready, and
a round that cannot score makes the new device record look broken (it correctly wrote
"no dots hit").
Next hour, do it in this order: (1) read `onFieldPress`'s `e.nativeEvent.locationX/Y` —
if RN Web does not supply them the distance is `NaN` and every press is silently a miss;
use the field's own measured rect instead of trusting `locationX`; (2) move `spawn()`'s
timer out of the reach of the `[phase]` cleanup (or clear the timer only on unmount) so the
dot's deadline survives the phase change; (3) prove it with a played round that scores
above 0 — the verification script is at `%LOCALAPPDATA%\Temp\verify-games.mjs` (it drives
the export at phone size, reads `hermes-game-scores` back and reloads to check
persistence).

**Answered by the fix:** (1) is wrong — `locationX/Y` are supplied and correct (measured
`loc=167,267` for a press at page `183,386` on a field at `16,119`); the field's `NaN` was
never the problem. (2) was right, but only for the **first dot of a round**. (3) is now the
standing check: `%LOCALAPPDATA%\Temp\play-tap-sprint.mjs` plays a whole round (taps every
dot it sees, plus one deliberate corner tap), reads the summary, the stored round and the
start screen after a reload. `%LOCALAPPDATA%\Temp\probe-tap-first-dot.mjs` covers the
deadline rule and `probe-tap-21.mjs` covers click / touch-tap / timeout in one pass.

### 22. The capture gate proves a screen renders, not that it works — DONE 2026-09-16
Item 21's field was dead for a whole day's worth of captures because `scripts/app-shots.mjs`
only asserts that the screen's **marker copy** is in the DOM — a screenshot of a game that
cannot score looks exactly like one that can.

**Result: `--interact` is now a second, independent assertion in the harness, and both games
are behind it.** A screen declares a probe in `scripts/interactions.mjs`; `app-shots.mjs`
passes it as `screenshot.mjs --interact <name>`; the harness runs it *before* it writes the
PNG and exits **3** unless the probe observes a change it did not put on the page itself —
then reloads, so the picture is of the screen as it ships and not of the probe's aftermath.
The two probes:
- `tap-sprint-hit` — press "Start the round", find the dot by its accent colour (both
  schemes) and tap its centre, require the round's own score to move. This is exactly the
  number that stayed at **0** for a day while the field was deaf.
- `word-duel-pick` — press a letter tile (the row is empty before), require a
  `Put back <letter>` slot to appear and the tile to go disabled.
Evidence: **4/4** live captures pass with the probe line printed —
`tap-sprint mobile-light probe: started a round, tapped the dot at 301,240 — score 0 → 10
(reaction 496 ms)` and `word-duel mobile-light probe: pressed Letter p — the row was empty
and now holds "p" (tile disabled: true)` (both themes, through `https://expo.dropby.co.in`).
The gate was then **shown to fail**, because a gate nobody has seen fail is a guess:
`PROBE_SABOTAGE=1` (a test switch in `interactions.mjs` that makes the probe's own target
refuse pointer events — the item-21 fault, browser-side, no app change) gives
`exit 3` / `interactionFailed: "the playing field is not responding: a tap on the dot at
171,331 did not move the score (still 0)"` from the harness, and `✗ probe tap-sprint
mobile-light … 0/1 captures ok` + `exit 1` through `app-shots.mjs`.
**Found by running that negative:** the probe-failure path was writing its diagnosis PNG to
the gallery's own filename, i.e. a *healthy-looking* picture of a broken game would have
silently replaced the good shot — the precise failure this item exists to stop. A probe
failure and a transport failure now write to `%TEMP%\probe-failed-*.png` /
`unreachable-*.png` and leave the gallery file alone (verified: the gallery PNG's MD5 is
byte-identical before and after a sabotaged run).
Second fix from the same evidence: the 40-capture sweep returned **five** Cloudflare error
pages (`http=404`, `page=980x2121`, every marker "missing") for routes that answer **200**
on `127.0.0.1:8091` in the same minute, and each one overwrote a good gallery shot. A
non-200 is now retried once and then exits **2** (`unreachable`, no write) instead of being
reported as a failed assertion — measured against a real 404 (`http://127.0.0.1:8092/__nope__`):
`exit 2`, `retried: true`, target file untouched, diagnosis in `%TEMP%`.
Full sweep after the change: **35/40 captures ok**, the 5 failures being the wellness
screens added minutes earlier by the parallel session (their markers, their fix — see item
33) — no screen that was passing before this item now fails.
Still open: only the two games have a probe. The PDF rotate picker, the invoice UPI field
and the collage shape chips are the next three named in this item — item 34.

### 23. Photo permission: a second denial leaves a button that cannot work (new, 2026-09-16)
Found while reading `expo/examples` for item 8, in our own code rather than theirs — and the
example has the same defect. `apps/mobile/lib/tools.ts:172-175` reads `granted` and then says
"Turn it on in Settings" with no way to reach Settings; `apps/mobile/app/passport.tsx:55-61`
only says permission is needed. On iOS a second denial answers
`granted: false, canAskAgain: false` and the OS will not prompt again, so on those devices
the sentence is advice with no route and the picker stays dead for the life of the install.
The honest fix is small: when `canAskAgain === false`, say that iOS will not ask again and
offer `Linking.openSettings()` (web is unaffected — the browser dialog is the permission and
`passport.tsx` already skips the request there). Evidence to require: a screenshot of the
denied state at phone size with the Settings affordance visible, plus the same screen after
`canAskAgain` is false — the two states must not read identically, which is exactly how the
current one fails.

### 24. Toolbox tile + screen for the document check (new, 2026-09-16, from item 11)
`resume-checker` runs end to end (job 93/94) but nothing in the app can reach it: the
toolbox grid's `READY_TOOLS` has eight tiles and none of them is this product, and
`/tools/<slug>` has no screen. The engine's output is Markdown, so the screen's job is to
show the three facts that mean something to a person — how many words the file really
carries, whether an email and a phone were found in it, and which of the keywords they
typed are actually in the document — with the full text behind a "show the text" toggle.
Keep the honest edges: say "the words that appear in your file", never "what ATS wants";
a scan or a photo answers 400 with its reason and the screen must show that sentence
(`lib/tools.ts` already throws `json.error`). One decision before the tile ships: the
catalogue row prices this at ₹99/month while the route serves it free, so the tile must
either say Free (and the row becomes `price_paise 0`) or the product goes back behind the
paywall — that is his call, not the robot's.

### 25. PDF screen: its own range guard is narrower than the engine — DONE 2026-09-16
`apps/mobile/app/tools/pdf.tsx` validates the optional page range with
`PAGE_PATTERN = /^[0-9,\s-]+$/` plus `/\d/`. Measured against the engine, that guard is wrong in
both directions: it **hides real capability** (pdfcpu accepts `odd`, `even`, `l` for the last page,
`3-` and `-4` for open ends, `!5` to exclude — the screen refuses all of them, and its help text
says only "a range like 1-3 or single pages like 1,4,9"), and it **lets through** `1 - 3`, which
pdfcpu calls a syntax error, so the user now gets the engine's 400 saying "pages must select pages
of the PDF" for something the screen showed as valid input.
The honest fix is small and needs no engine change: reuse the same grammar the route now has
(`PDF_PAGE_EXPR` / `isPageRange` in `apps/web/app/api/job/route.ts`, which is pdfcpu's own
`selectedpages` grammar) on the screen, mark the field bad for a range that cannot be parsed, and
say in the help line what the engine really takes. Evidence to require: `npx expo export --platform
web` at exit 0 with the bundle size, the two gallery shots of `/tools/pdf` re-captured, and a
screenshot of the bad-input state at phone size next to a real `odd` job id.

**Result:** the grammar now lives in **`@hermes/core`** (`PDF_PAGE_EXPR`, `isPageRange`,
`PDF_PAGES_HELP`, `PDF_PAGES_HINT`) and is imported by **both** the job route and
`apps/mobile/app/tools/pdf.tsx`, so the field and the 400 can no longer disagree — the screen
had drifted because it owned a second copy. The field is marked bad with
"That range cannot be read — the line above is the whole grammar", and the help line now names
what the engine takes. One correction came out of testing rather than reading: a **bare `!5`
selects nothing** (pdfcpu: `missing page numbers`, 0-byte output), because an exclusion
subtracts from an inclusion — measured page lists on a 5-page file: `1-,!5` → 1,2,3,4,
`odd,n1` → 3,5, `even,!2` → 4, `l-3-` → 2..5, `-l-3` → 1,2. The screen therefore teaches
`1-,!5 (all but page 5)`; the route's own 400 sentence still offers a bare `!5` — item 26.
Evidence: live `/api/job`, 5-page PDF — jobs **104** (`1-3`, 3pp) **105** (`odd`, 3pp)
**106** (`even`, 2pp) **107** (`l`, 1pp) **108** (`3-`, 3pp) **109** (`-4`, 4pp) **111** (`1,2`,
2pp) all 200, where the old guard refused `odd`/`even`/`l`/`!5`; **400** for `1 - 3` (the value
the old guard let through), `abc`, `1;2`, `1--2`, `1.5`. Screen, through the exported build at
390×844: **9/9** checks, 0 page errors — rotate and split both mark `1 - 3`, `odd` is not
flagged, and a real split of `odd` ran **from the screen** = job **114** (`pages_in 5 →
pages_out 3`) with the result card named `pages-odd.pdf` (the split's file name is now derived
from the range, `!` → `no`, so `!5` cannot be saved as `pages-5.pdf`). `packages/core` **6/6**
tests including a new measured range table; `tsc` **0** errors (core + web, 0 new in
`pdf.tsx`); `npx expo export --platform web` exit 0, **3.2 MB / 3114 KB JS**; the four PDF
shots re-captured with their copy asserted (`app__pdf-tools__mobile-{light,dark}`,
`-rotate`, `-numbers`) and the bad-input state captured at phone size
(`%LOCALAPPDATA%\Temp\pdf-tools-badrange-light.png`). Gated `npm run build && pm2 restart
hermes-web`; localhost:8080, `/galaxy`, sarkarmarketplace.dropby.co.in and
expo.dropby.co.in/tools/pdf all 200 after. No engine restart was needed (the worker was not
touched: one listener on 8099, `health.pid 6604 == pm2 pid`).

### 26. Route: its own 400 hint offers a bare `!5`, which selects nothing (new, 2026-09-16, from item 25)
`PDF_PAGES_HELP` in `@hermes/core` — the sentence the route answers a bad range with — ends
"… , -4 (up to page 4), !5 (exclude)". pdfcpu parses `!5`, but on its own it **selects
nothing**: `trim -p '!5'` aborts with `missing page numbers` and writes a 0-byte file, which is
why the engine answers 400 for it (measured this hour: `!5` and `n5` alone both fail; `1-,!5`
and `odd,n1` both work). The hint should teach the working form (`1-,!5 (all but page 5)`),
exactly as the screen's hint now does. Small: one exported string plus a gated web rebuild —
and the string is covered by the core test, so the change is verified by the same table.

### 27. Invoice: the counter is one phone's (new, 2026-09-16, from item 15)
Item 15 gave the bill number a real counter, but it lives in this device's AsyncStorage, so a
shop that bills from a tablet and a phone has two counters and can still print `015` twice.
The fix is a row per shop (`invoice_counters`, keyed by the `shopKeyOf` value item 15 already
produces — `gstin:<15 chars>` or `shop:<folded name>`), read at screen load and written after a
bill, with the device store kept as the offline fallback. Two honest constraints: the same key
function must be used on both sides (it is already pure and tested, so import it, do not
re-derive it), and the row is not the shop's until the shop is signed in — until then the label
stays "this phone", because a device counter presented as the shop's own is the lie item 15
avoided. DDL is possible now: run it with the **Management API**
(`POST https://api.supabase.com/v1/projects/xpfmqpmhmcouwzebfwhb/database/query` with
`SUPABASE_ACCESS_TOKEN` from `apps/web/.env`), not the SQL Editor. Evidence to require: the
row exists (REST `GET /rest/v1/invoice_counters?select=*&limit=1` → 200), a bill made on one
bill made on one storage state advances the shared counter, and a cleared device store still offers the next
number from the row.

### 28. Text to image: give the live product a tile and a screen (new, 2026-09-16, from item 20)
The engine and the route now serve it (job 117, 200, a real 1024x1024 JPEG) but nothing in the
app can reach it: `apps/mobile/lib/tools.ts`'s `READY_TOOLS` lists eight tiles and none is
`ai-image`, and `/tools/<slug>` has no screen for it. The screen's job is small and honest: a
text field for the prompt (the route caps it at 300 characters and the engine refuses an empty
one with `prompt is required`), the product's own accent colour, and a result card showing the
returned picture plus what the engine said (`meta.model`, and the seconds the job took). Two
decisions before the tile ships: the tile must not promise more than the model can do — flux is
fast and literal, so the copy should say "describe it plainly, one picture per run" and not
"design a logo" — and the price, which is the parking lot's question, not the robot's.

### 29. Engine: one transient upstream failure is reported as a broken server (new, 2026-09-16, from item 20)
Measured while wiring text-to-image: the first `POST /job/ai-image` this hour answered
`500 {"error": "HTTP Error 400: Bad Request"}` and the identical retry answered **200** with a
569 KB JPEG. Cloudflare had refused that one request (the token was fine — a direct call with
the same token returned 200 in the same minute), so the app saw "Could not finish the job" for
something that would have worked on a second try. `ai_image` in `services/tools/worker.py`
turns every upstream failure into one line, and the route maps 5xx to 502, so an intermittent
edge failure and a real fault look identical to the caller. Honest fix: retry a hosted-model
call **once** on a 5xx/400 from the provider, and keep the second failure as the answer — with
the attempt count in the meta so a job row shows what happened.

### 30. The rate chips at 320 px have 1.3 px of slack — check them on a real phone (new, 2026-09-16, from item 16)
Item 16 measured the invoice item line at 320 px and nothing wraps or clips, but the margin is
thin in exactly one place: the five rate chips are **30 px** wide at 320 px and their widest
labels ("12%", "18%") measure **26.7 px** — 28 px of chip, so **1.3 px** of slack, single line.
That 26.7 px is Chrome's font stack on this VM (the field's computed font is the
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial` stack); a real iPhone
(SF Pro) or Android (Roboto) resolves a different face, and a face ~5% wider would push the label
past the chip's border — the text does not wrap (it is one token) and nothing clips it, so the
symptom would be a label slightly wider than its chip, not an unreadable one.
Do not "fix" this by guessing: open `/tools/invoice` on a real phone (the phone-test page is
`https://shots.dropby.co.in/`) and read the chip row. If a label overflows, the honest options in
order of cost are the chip font at 11 instead of 11.5, `itemHsn` at 96 px instead of 104 (the
placeholder needs 55.3 px and the 8-character max typed value 53.9 px, both into 69 px, so the
field can give up 8 px), or item 16's own suggestion — one chip that opens the four rates.
Evidence to require: a phone-sized photo or screenshot of the chip row at 320 px, plus the same
row after the change.

### 31. Ship the on-device cut: vendor the library, measure a real phone, add the fallback (new, 2026-09-16, from item 10)
Item 10 proved the browser can do the matting (12 MB first run, ~6 s a cut, a real matte on
`Xenova/modnet`) and left it behind a flag. Three things stand between that and a shipped
feature, in this order:
1. **Vendor the library.** The prototype loads `@huggingface/transformers@4.3.0` from jsdelivr
   at runtime, which is fine for a measurement and not for a product: it needs a pinned
   integrity hash and a decision about the app's Content-Security-Policy. `new Function` is
   also what keeps Metro from seeing the specifier — replacing it means copying the browser
   build into `apps/mobile/assets/` (or adding the package, which brings `sharp`,
   `onnxruntime-node` and a 145 MB `onnxruntime-web`).
2. **A real-phone number.** Every figure in `docs/bg-remove-on-device.md` is this VM's
   Chromium on 4 cores; a phone's WebAssembly may be several times slower, and the 6.6 MB
   model download is the other half of the wait. The phone-test page is
   `https://shots.dropby.co.in/`.
3. **A fallback rule.** No WebAssembly, an old Safari, or no connection for the first model
   download must fall back to the server path *silently*, and the screen must not show a
   spinner that will never finish.
Also honest to fix while in there: the model is a **portrait** matter (person, shoulders,
hair) — the tile and the copy must not promise a product shot.

### 32. The on-device cut is free and unwatermarked, the server cut sells for ₹99 (new, 2026-09-16, from item 10 — needs his decision)
With the prototype flag on, the screen produces a full-resolution PNG with no watermark and
no paywall, because the work happens on the user's own device and costs us nothing; with the
flag off, the same photo gets a watermarked preview and a ₹99 unlock. Both cannot be the
offer at once. The options are (a) the free on-device cut *is* the product and ₹99 buys
something else (batch, larger sizes, a passport-ready crop), (b) the on-device path stays
behind a paid tier, or (c) it stays a prototype and never ships as-is. Nothing was changed —
the flag ships off, so today's behaviour is unchanged.

### 33. A page that loads 200 with nothing on it still overwrites the gallery shot (new, 2026-09-16, from item 22)
Item 22 stopped the *probe* and *transport* failures from writing a picture over a good one:
a non-200 is now retried once and answers exit 2 without touching the gallery. The third
case is untouched, and this hour's 40-capture sweep produced five of them on
`https://expo.dropby.co.in` — `tools-hub` twice, `stretch`/`walk` three times — where the
navigation answered **200** and the marker copy was simply not on the page yet (the same
routes render correctly on `127.0.0.1:8091` and on the next attempt, and `/tools` does say
"EVERYDAY TOOLS … Small jobs," when loaded on its own). A client-rendered SPA served through
the tunnel can hand back the shell before the bundle has painted, and the marker gate then
answers `exit 3` and writes its diagnosis PNG **to the gallery filename**, replacing a good
shot with one that looks nearly right. Honest fix, same shape as the probe path: on a marker
miss, reload once and re-read the DOM before declaring failure, and send the diagnosis image
to `%TEMP%` while leaving the gallery file alone (the marker's *value* as a diagnosis is low
precisely because the broken render looks healthy). Evidence to require: a full sweep whose
transient failures no longer change any gallery PNG's MD5, plus one deliberately broken
marker still failing with exit 3.

### 34. Probes for the other three primary interactions (new, 2026-09-16, from item 22)
Only the two games have a probe. The three named in item 22 are the next ones worth one, each
with an observable change that is not the screen's own copy:
- **PDF rotate picker** (`/tools/pdf`): press a `90 / 180 / 270` chip and require the primary
  button's label to name the job it will run ("Rotate 270°") — the screen already computes
  that sentence from the chip, so a dead chip shows up as a label that never changes.
- **Invoice UPI field**: type a `name@bank` value and require the paper preview to carry it;
  then type a malformed one and require the field to be marked bad. The preview is the
  observable, not the input.
- **Collage shape chips**: pick 2 photos, press `2 across`, and require the button label to
  change to the job that will run; the dimmed "cannot hold the photos" chips are the control.
Each probe must run at capture time like the games' do (exit 3, no gallery write) so a screen
whose control stops responding cannot pass the gallery gate again.


