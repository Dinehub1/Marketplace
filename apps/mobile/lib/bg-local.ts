/**
 * Background removal ON THE DEVICE — a web-only prototype.
 *
 * Why this exists: the product's cut-out is done by `services/tools/worker.py`
 * (rembg/u2net), i.e. on the one VM that also serves the live site, at ~5.2 s a
 * photo. A phone has its own CPU, so the same matte can be computed where the
 * photo already is: no upload, no queue behind the server, nothing to pay for.
 *
 * Measured on this VM's Chromium at 390x844 (MODNet, quantised):
 *   - library (jsdelivr) 250 ms, model 6.6 MB + ORT wasm 5.5 MB on first use
 *   - first cut 5.8 s (download) + 5.6 s, second cut 5.6 s, PNG 465 KB
 *   - fp32 instead of q8: model 25.9 MB, cut 6.5-7.0 s, edge 1.9 % soft vs 3.4 %
 *   The numbers are in `docs/bg-remove-on-device.md`.
 *
 * Two deliberate choices, both about not touching the box that serves the site:
 *
 *  1. The library is NOT a dependency of `apps/mobile`. `@huggingface/transformers`
 *     declares `sharp`, `onnxruntime-node` and a 145 MB `onnxruntime-web`, so
 *     installing it puts native binaries in the workspace for a prototype. The
 *     browser loads it from a pinned CDN instead, only when the flag is on.
 *  2. Metro must not see that URL. A bare `import("https://...")` is a bundler
 *     error; `new Function` keeps the specifier out of the module graph, so the
 *     library costs the bundle nothing and the app's own size does not change.
 *     Shipping this would mean vendoring the browser build (or adding the
 *     package) and pinning the version with an integrity hash — prototype only.
 *
 * The model is `Xenova/modnet` (Apache-2.0; the matting network is ZHKKKe/MODNet,
 * also Apache-2.0). It is a *portrait matting* model: a person, shoulders and
 * hair. `briaai/RMBG-1.4` is deliberately NOT used — its licence is non-commercial.
 */
import { Platform } from "react-native";

/** Pinned exactly: an unpinned CDN URL is a different program next week. */
export const ON_DEVICE_LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/+esm";

export const ON_DEVICE_MODEL = {
  id: "Xenova/modnet",
  dtype: "q8",
  licence: "Apache-2.0",
  /** content-length of onnx/model_quantized.onnx, read off the CDN (measured). */
  bytes: 6632188,
  /** The runtime transformer.js pulls with it (ort-wasm, measured). */
  runtimeBytes: 5547616,
};

export type OnDeviceCut = {
  /** `data:image/png;base64,…` — the cut-out, on a transparent background. */
  dataUrl: string;
  width: number;
  height: number;
  pngBytes: number;
  /** True when this call also downloaded the model (i.e. the first one). */
  modelFetched: boolean;
  loadMs: number;
  inferMs: number;
  model: string;
  dtype: string;
};

/** True on the web builds that have WebAssembly and a DOM to draw into. */
export function onDeviceSupported(): boolean {
  if (Platform.OS !== "web") return false;
  const g = globalThis as any;
  return typeof g.WebAssembly === "object" && typeof g.document !== "undefined";
}

// `new Function` rather than `import()`: Metro rewrites the latter and would try
// to resolve a URL as a package. The browser is the only thing that sees this.
//
// Built LAZILY, and that is load-bearing. `new Function` parses its body as a *script*,
// and dynamic `import()` is not valid in a script — Chrome allows it, Hermes does not. As
// a top-level `const` this threw the instant the module was evaluated, on every launch on
// iOS and Android, flag or no flag, because expo-router requires every route module to
// build its route tree. Two screens away it surfaced as `Route "./tools/bg-remove.tsx" is
// missing the required default export` — which is what a module that throws on import
// looks like from the outside. It never appeared on the web build, where it was measured.
let loadLibFn: ((u: string) => Promise<unknown>) | null = null;
function loadLib(url: string): Promise<unknown> {
  if (!loadLibFn) {
    loadLibFn = new Function("url", "return import(url)") as (u: string) => Promise<unknown>;
  }
  return loadLibFn(url);
}

let pipelinePromise: Promise<any> | null = null;
let pipelineCached = false;

async function segmenter(): Promise<any> {
  if (!pipelinePromise) {
    pipelinePromise = loadLib(ON_DEVICE_LIB).then((tf: any) =>
      tf.pipeline("background-removal", ON_DEVICE_MODEL.id, { dtype: ON_DEVICE_MODEL.dtype }),
    );
    // A failed load must not be cached forever: the next tap may be online again.
    pipelinePromise.catch(() => {
      pipelinePromise = null;
    });
  }
  const seg = await pipelinePromise;
  return seg;
}

/**
 * One cut-out, computed in this browser. `source` is any URL the page can read —
 * the picker's own blob URL on the web, so nothing is uploaded.
 */
export async function cutOutOnDevice(source: string): Promise<OnDeviceCut> {
  if (!onDeviceSupported()) {
    throw new Error("On-device cutting needs the web build — on a phone the server does the work.");
  }
  const modelFetched = !pipelineCached;
  const t0 = now();
  const seg = await segmenter();
  const t1 = now();
  pipelineCached = true;

  const out = await seg(source);
  const t2 = now();

  const img = Array.isArray(out) ? out[0] : out;
  const canvas = img?.toCanvas ? img.toCanvas() : null;
  if (!canvas) throw new Error("The model returned no image for that file.");

  // toCanvas() hands back an OffscreenCanvas, which has no toDataURL; a DOM
  // canvas is what can hand the PNG back as a data URL the app can save.
  const g = globalThis as any;
  const dom = g.document.createElement("canvas");
  dom.width = img.width ?? canvas.width;
  dom.height = img.height ?? canvas.height;
  dom.getContext("2d").drawImage(canvas, 0, 0);
  const dataUrl: string = dom.toDataURL("image/png");

  return {
    dataUrl,
    width: dom.width,
    height: dom.height,
    pngBytes: Math.round(dataUrl.length * 0.75),
    modelFetched,
    loadMs: Math.round(t1 - t0),
    inferMs: Math.round(t2 - t1),
    model: ON_DEVICE_MODEL.id,
    dtype: ON_DEVICE_MODEL.dtype,
  };
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
