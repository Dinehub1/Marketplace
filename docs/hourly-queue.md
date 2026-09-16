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

### 5. Video products: background removal in video (MIT)
`nadermx/backgroundremover` **8,053★** MIT, Python — images *and video* via ffmpeg.
Our angle: unlocks the subtitles/video app that has no engine today, on the same VM.
Not before the tools above are solid.
**Do NOT use** `imgly/background-removal-js` (7,317★) — AGPL-3.0, would infect the app.

### 6. Paid path: real money test (blocked on keys)
`RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` are empty in `apps/web/.env`, so no
order can be paid and the passport paywall cannot be completed end to end. Blocked on
the user; do not fake a payment to "verify" it.

### 7. Games → store-ready (open)
`tap-sprint.tsx` (576 lines) and `word-duel.tsx` (1,083 lines) exist and run. Open work:
score persistence, a real end-of-round summary, and icon/screenshot sets for the store.

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

### 8. Expo examples as the pattern for the tool frame (MIT, exact stack)
`expo/examples` (3,728★, MIT) is dozens of complete runnable Expo apps — camera, image
picker, file sharing — in our SDK. When the design frame is blocked, this is the
unblocking work: read the camera and file-picker examples and write down the three
patterns worth copying (how they handle permission denial, the capture screen layout,
the share sheet). Log the notes, do not copy code yet.
Done when: `docs/expo-examples-notes.md` exists with the three patterns and the exact
example paths they came from.

### 9. Port 3 real tools from ImageToolbox's catalogue (Apache-2.0)
**Done by other items — do not redo:** `collage`, `exif-strip` (EXIF strip) and
`photos-to-pdf` (PDF from images) are engine-backed since item 4 and got their screens and
grid tiles in item 14 (2026-09-16). The feature checklist was used from
`T8RIN/ImageToolbox` (14,631★, Apache-2.0); no code was copied.
`T8RIN/ImageToolbox` (14,641★) holds ~100 image operations. Pick **collage**, **EXIF
strip** and **PDF from images** — each is cheap with Pillow + pdfcpu in `worker.py`,
each turns a "coming soon" card into a product, and Apache-2.0 allows attribution-only
reuse of the algorithm/UI ideas. One per run, with a real job id as evidence.

### 10. In-app background removal prototype (Apache-2.0)
`huggingface/transformers.js` (16,297★, Apache-2.0) runs segmentation in the browser.
Prototype it behind a flag on the bg-remove screen and measure: model download size,
seconds on a phone, and whether the result is good enough for a passport photo. If it
works, jobs stop queueing behind the VM's CPU.

### 11. markitdown as the document engine (MIT, 184k★)
`microsoft/markitdown` (MIT) turns Office/PDF/images into Markdown in Python, on this VM.
Prototype it against the CV path first: a real PDF resume → Markdown → keyword score.
That one engine feeds the resume/ATS check, document translation, bill extraction and
notes-from-lecture products. Evidence: a job id whose `meta` shows the extracted text
length, plus the markdown saved under `marketplace/` in R2.

### 12. colibri as the ₹0 text engine (Apache-2.0, 34k★)
`JustVugg/colibri` (Apache-2.0) streams a large MoE model from disk on CPU. The win is
removing the API bill behind the writing products. Do NOT install it until you have
measured: idle RAM, disk needed, and whether a single request starves `hermes-web`.
If it does starve it, park it and say so — this box serves the live site.

### 13. VoxCPM for the voice-over product (Apache-2.0, 37k★)
`OpenBMB/VoxCPM` (Apache-2.0) is TTS with voice design. Turn "Text to voice-over"
(₹99/clip) from a card with no engine into a product: text in, MP3 out, in R2, priced.
Requires torch on CPU — measure seconds per 100 words and report them.

## Parking lot (needs the user, do not start)
- Apple review strategy: he chose to keep 12 identities. Guideline 4.3 rejects
  "multiple Bundle IDs of the same app"; before submitting the directory twins
  (Indore directory / SarkarHealth / SarkarCars) re-check that decision with him.
- Native builds: `eas build` needs his Expo/Apple login.
- Expo Go tunnel from this VM fails (anonymous ngrok timeout) — see the skill.

### 15. Invoice: sequential invoice numbering (open, from item 3)
The bill number is typed by hand, so a shop that forgets it prints "No bill number" and two
bills can carry the same one. The honest version is a running counter the app remembers
per shop (last number + 1, editable upward): a bill numbered `014` twice is a tax problem
for the shop, not a cosmetic one. Needs a place to keep it (the screen's own storage, or a
`invoice_counters` row keyed by GSTIN), and the engine should keep taking whatever the app
sends — numbering is the app's business, not the renderer's.

### 16. Invoice screen: the item meta line at 320-360 px (open, small)
Item 13 put an HSN field plus five rate chips under each item; the shots are 390 px wide and
the line fits there. A 320 px phone (iPhone SE 1st gen, the narrowest still in use) may wrap
the chips or squeeze the HSN field to the point where `HSN 8544` cannot be read. Re-shoot
`/tools/invoice` at 320 and 360 px, and if it wraps, drop the chips to a per-item tap that
opens the four rates instead of showing all five inline.

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

### 18. Route: an unparseable `pages` range is a 502, not a 400 (open, found 2026-09-16)
Found while measuring item 10: `pdf-tools` with `pages=abc` answers **502** from
`https://expo.dropby.co.in/api/job` (both `split` and `rotate`), which is exactly the
"failure the user cannot explain" the route's own comment says the enum checks exist to
prevent. `pages` is only *required* for split, never shape-checked. Two things to fix in
`apps/web/app/api/job/route.ts`: reject anything that is not a page list (digits with `-`/`,`
separators, e.g. `/^\d+([-,]\d+)*$/`) with a 400 naming the format, and decide what `pages=-1`
should be — today it is accepted and produces a file (200), so either it is meaningful to
pdfcpu or it silently returns the wrong pages; measure it before allowing it.

### 19. Engine: a bad request from the caller comes back as 500 (→ 502), not 400 (open, found 2026-09-16)
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
