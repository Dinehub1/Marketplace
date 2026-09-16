# Background removal on the device — prototype, measured

Item 10 of `docs/hourly-queue.md`. The question was whether the cut-out can run in
the browser instead of on the VM that also serves the live site, and what it costs.
Everything below was measured on this box, not estimated.

## What was measured

Harness: Chromium (Playwright, `C:/Users/Administrator/shots/node_modules/playwright`)
at 390×844, headless, on the served exported build. Model `Xenova/modnet`
(Apache-2.0; the network is ZHKKKe/MODNet, also Apache-2.0) through
`@huggingface/transformers@4.3.0` loaded from a pinned jsdelivr URL.
Input: one 1024×683 portrait JPEG (the model card's own demo photo, test input only).

| step | fp32 (25.9 MB model) | q8 (6.6 MB model) |
|---|---|---|
| library import | 150–270 ms | 244 ms |
| pipeline ready (first use) | 6.2 s | 5.8 s |
| cut, first run | 7.0 s | 6.0 s |
| cut, second run | 6.5 s | 5.6 s |
| output | 1024×683 RGBA PNG, 448 KB | 1024×683 RGBA PNG, 465 KB |
| alpha: clear / opaque / partial | 73.5 % / 24.6 % / 1.9 % | 72.4 % / 24.1 % / 3.4 % |

Runtime bytes on first use, measured from the CDN's own `content-length`: the model
6,632,188 B (q8) or 25,888,640 B (fp32), plus `ort-wasm-simd-threaded.asyncify.wasm`
5,547,616 B. So the honest first-run cost is **~12 MB for q8**, ~31 MB for fp32.

**q8 is the right default**: a quarter of the download and ~15 % faster, at the price
of a slightly softer edge (3.4 % of pixels are partial vs 1.9 %).

## Quality, checked numerically rather than by eye

The matte is real: in the app's own output all four corner alphas are **0**, the
centre is **254**, and 72 % of the frame is fully clear — i.e. the background was
removed and the subject kept, not a flat or grey image. What this does *not* prove
is hair-level quality on a phone photo; that needs a person looking at a real
portrait, which is why the screen labels it a prototype.

`Xenova/modnet` is a **portrait matting** model — a person, shoulders, hair. It is
not a product-shot segmenter, and the screen should not promise one.

## How it is wired

- `apps/mobile/lib/bg-local.ts` — web-only. The library is loaded from a **pinned
  CDN URL** through `new Function("url", "return import(url)")`, so Metro never sees
  the specifier: the app bundle stays at **3.2 MB** with the feature included.
- `apps/mobile/app/tools/bg-remove.tsx` — one flag row, **off by default**, web only.
  With it off nothing changed: the screen still posts to `/api/job`
  (verified: jobs 122/123/124, HTTP 200). With it on, `cutOutOnDevice()` runs and the
  result card says the measured seconds, the PNG size and that nothing was uploaded.
- No npm install happened. `@huggingface/transformers` declares `sharp`,
  `onnxruntime-node` and a 145 MB unpacked `onnxruntime-web`; putting that in the
  workspace for a prototype would cost disk and a long install on the box that
  serves the live site.

## What shipping it would still need

1. **Vendor the library** (or add the package) and pin it with an integrity hash —
   a CDN import at runtime is fine for a measurement, not for a product. It also
   means a Content-Security-Policy decision.
2. **A real-phone measurement.** The numbers above are this VM's Chromium on 4 cores.
   A phone's single-threaded WebAssembly could be several times slower; the model
   download is the other half of the wait. The phone-test page is
   `https://shots.dropby.co.in/`.
3. **A fallback rule.** If the browser cannot run it (old Safari, no WebAssembly, no
   connection for the first download), the server path must take over silently.
4. **A cost story.** The on-device cut is free and unwatermarked, while the server
   product sells the clean PNG for ₹99. Both cannot be the offer at once — that is a
   product decision, not an engineering one.
