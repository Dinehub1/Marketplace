import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ALLOWED_IMAGE_TYPES, R2_PREFIX, deleteObject, productPreviewKey, publicUrlFor, putObject, r2Configured } from "@/lib/r2";

/**
 * POST /api/job — the one door between the apps and the product engine.
 *
 * Multipart in: `product`, one or more `file` parts, that product's own parameters,
 * and optionally `phone` + `token`. JSON out.
 *
 * Two shapes come back, and which one depends on the product's price:
 *   - paid: `preview_url` (watermarked) + `output_url: null` + `locked: true`. The
 *     clean file is released by GET /api/job/<id> once an order for that job is paid;
 *   - free: `output_url` directly, because the file IS the product.
 * In both cases the engine's own measurements ride along in `meta`.
 *
 * Why the file round-trips through this route instead of going straight from the
 * phone to the worker: the engine binds 127.0.0.1:8099 and is deliberately not
 * reachable from the internet. It does the expensive part for ₹0 per job on this
 * VM (rembg, Pillow, pdfcpu); this route is the thin, metered half that stores the
 * result in R2 where a phone can actually fetch it.
 *
 * Every attempt — success or failure — writes a `product_jobs` row, because the
 * per-product cost and speed are measured from that table, never assumed.
 */
const WORKER_URL = (process.env.PRODUCT_WORKER_URL ?? "http://127.0.0.1:8099").replace(/\/+$/, "");

/**
 * .docx — the one Office format the engine's markitdown install has an extra for.
 * Declared before ENGINE because the table below reads it while the module loads:
 * a `const` further down would be in its temporal dead zone and throw on import.
 */
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Documents the resume reader takes: a PDF, a Word file, or plain text. */
const DOC_ACCEPTS = ["application/pdf", DOCX_MIME, "text/plain"];

/**
 * Catalogue slug -> what the engine actually runs.
 *
 * The engine has a handful of real capabilities (rembg, Pillow recipes, pdfcpu).
 * Each *priced product* is a fixed recipe on top of them, and it lives here in one
 * table so a slug can never quietly become a different product depending on what
 * the caller sent. `fixed` parameters are not client-settable.
 *
 * The slug must exist in the `products` table: `product_jobs.product` is a foreign
 * key to it, and a job that cannot be recorded is not a job that happened.
 * There is deliberately no generic `image-toolkit` product — the 28 approved
 * products are the catalogue, and a tool is not one of them.
 */
const ENGINE: Record<string, {
  engine: string;
  fixed?: Record<string, string>;
  fields?: string[];
  accepts?: string[];
  multi?: boolean;
  free?: boolean;
  dataOnly?: boolean;
}> = {
  "passport-photo": { engine: "passport-photo", fields: ["size"] },
  "bg-remove": { engine: "bg-remove" },
  "product-photo": { engine: "image-toolkit", fixed: { op: "product-clean" }, fields: ["target_px"] },
  "photo-repair": { engine: "image-toolkit", fixed: { op: "repair" }, fields: ["max_px"] },
  "cover-maker": { engine: "image-toolkit", fixed: { op: "cover" }, fields: ["aspect", "target_px"] },
  "pdf-tools": { engine: "pdf-tools", fields: ["action", "pages", "angle", "position", "text"], accepts: ["application/pdf"], multi: true, free: true },
  // Data-only: the bill is JSON typed on the screen, not an upload. `hidden` keeps
  // the raw payload out of the response so it is not echoed back at the client.
  "invoice-maker": { engine: "invoice-maker", fields: ["doc", "payload"], dataOnly: true },

  // The three jobs taken from the ImageToolbox (Apache-2.0) feature checklist that
  // this VM can actually run: strip a photo's GPS/camera tags, put photos into one
  // A4 PDF, and cut 2-4 photos into one collage sheet. All three are free on
  // purpose — the engine's cost per job is ₹0 (Pillow and pdfcpu, no cloud call),
  // and a price tag on a re-save would be a claim we cannot back. `exif-strip` is
  // another fixed op on the image spine; the other two take several photos.
  "exif-strip": { engine: "image-toolkit", fixed: { op: "strip-exif" }, free: true },
  "photos-to-pdf": { engine: "photos-to-pdf", multi: true, free: true, fields: ["pagesize"] },
  "collage": { engine: "collage", multi: true, free: true, fields: ["layout", "cell_px"] },

  // One document in (PDF / DOCX / plain text), a Markdown reading of it out, with an
  // optional keyword check against a list the caller sends. Free: markitdown (MIT)
  // runs on this VM in Python, so the engine's cost per job is ₹0 and a paywall would
  // have nothing to meter. The catalogue row (`resume-checker`, listed at ₹99) is
  // deliberately untouched here — its price is a business decision, not a route one.
  "resume-checker": {
    engine: "resume-checker",
    free: true,
    fields: ["keywords"],
    accepts: DOC_ACCEPTS,
  },
};

const PRODUCTS = new Set(Object.keys(ENGINE));

const IMAGE_ACCEPTS = ["image/jpeg", "image/png", "image/webp"];

/**
 * How an accepted type is named back to the caller. `image/jpeg`.split("/")[1] reads
 * fine as "JPEG", but the DOCX mime type would come out as
 * "VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORD…", which is not a sentence anyone can act on.
 */
const TYPE_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  [DOCX_MIME]: "DOCX",
  "text/plain": "TXT",
  "text/markdown": "Markdown",
};

function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type.split("/")[1].toUpperCase();
}

/** Extension for a stored input file, so its R2 key tells the truth about the format. */
const DOC_INPUT_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  [DOCX_MIME]: "docx",
  "text/plain": "txt",
};

/**
 * Fields whose value is a document, not an identifier. They get a real size limit
 * instead of the 120-character cap that keeps a query parameter a query parameter.
 */
const LONG_FIELDS = new Set(["payload"]);
/**
 * Fields that are a list rather than an identifier. A keyword list is 30 terms with
 * separators, which does not fit the 120-character cap a query parameter deserves;
 * the engine caps the same list at 30 terms of 40 characters.
 */
const FIELD_LIMITS: Record<string, number> = { keywords: 700 };
const MAX_FIELD_CHARS = 120;
const MAX_LONG_FIELD_CHARS = 200_000;

/**
 * Sizes the engine can render, mirroring SIZES in services/tools/worker.py. The
 * app sends the id; anything else is rejected here rather than silently rendered
 * as the default, so a future rename shows up as a 400 instead of the wrong photo.
 */
const PRODUCT_SIZES: Record<string, string[]> = {
  "passport-photo": ["passport", "visa", "stamp"],
};

/** Aspect ratios the cover maker accepts, mirroring ASPECTS in the worker. */
const COVER_ASPECTS = ["9:16", "1:1", "16:9", "4:5"];

/**
 * The PDF toolkit's five actions and its two enum parameters, mirroring
 * PDF_ROTATIONS / PDF_NUMBER_ANCHORS in services/tools/worker.py.
 *
 * These values come from the tool people already know (Stirling-PDF's MIT-licensed
 * app/core controllers): its `angle` is a multiple of 90, and its `position` is a
 * 1..9 grid where 1 is the top-left corner and 9 the bottom-right. Keeping those
 * names means a caller who knows that tool asks for the same job here, and the
 * engine maps the grid onto pdfcpu's anchors. Checked in this route so an
 * unimplemented action is a 400 the app can show, not a 502 from the engine.
 */
const PDF_ACTIONS = ["merge", "split", "compress", "rotate", "page-numbers"];
const PDF_ANGLES = ["90", "180", "270", "-90", "-180", "-270"];
const PDF_NUMBER_POSITIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * The photo jobs' enums and ceilings, mirroring PDF_PAGE_FORMATS / COLLAGE_LAYOUTS /
 * PHOTOS_TO_PDF_MAX / COLLAGE_MAX in services/tools/worker.py.
 *
 * The engine enforces these too, but a caller deserves a 400 that names the limit
 * instead of a 502 after twenty photos have already been uploaded. Several photos
 * also mean several decodes in the engine's memory, and this box serves the live
 * site, so the count and the total are capped here as well as per file.
 */
const PDF_PAGE_FORMATS = ["a4", "letter", "a5"];
const COLLAGE_LAYOUTS = ["auto", "2x1", "1x2", "2x2", "3x1"];
const PHOTO_JOB_LIMITS: Record<string, { files: number; totalBytes: number }> = {
  "photos-to-pdf": { files: 20, totalBytes: 60 * 1024 * 1024 },
  collage: { files: 4, totalBytes: 40 * 1024 * 1024 },
};

/** What a product will accept as input, defaulting to photos. */
function acceptsFor(product: string): string[] {
  return ENGINE[product]?.accepts ?? IMAGE_ACCEPTS;
}

const EXT_FOR_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  // The document reading (markitdown) hands back Markdown, not a JPEG. Without
  // this line its output lands in the bucket as `.bin`.
  "text/markdown": "md",
};

/**
 * Phone-camera JPEGs are routinely 3-6 MB and the resize happens downstream, so
 * this is looser than the listing-photo limit on purpose. Documents get more room
 * still: a scanned PDF is legitimately tens of megabytes.
 */
const MAX_JOB_BYTES = 15 * 1024 * 1024;
const MAX_DOC_BYTES = 30 * 1024 * 1024;

/** rembg loads u2net once (~23s) and inference is ~4s; the first cold call can
 *  exceed a minute, so the worker gets a real timeout instead of the default. */
const WORKER_TIMEOUT_MS = Number(process.env.PRODUCT_WORKER_TIMEOUT_MS ?? 180_000);

const noStore = { "Cache-Control": "no-store" };

/** Record a failed attempt so the table shows what was tried, not just what worked. */
async function recordFailure(product: string, phone: string | null, inputKey: string | null, error: string, durationMs: number) {
  await db("product_jobs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([{ product, phone, input_key: inputKey, output_key: null, status: "failed", error: error.slice(0, 500), duration_ms: durationMs }]),
  }).catch(() => {});
}

/**
 * One engine call for every product, single or multi-file.
 *
 * One file goes as the raw body (millions of bytes, no encoding). Several go as a
 * JSON envelope with base64 payloads — the engine is on loopback, so the 33%
 * inflation costs nothing but a few milliseconds, and it saves inventing a
 * multipart parser on both sides of a wire that never leaves the machine.
 */
async function callWorker(product: string, blobs: { bytes: Buffer; type: string }[], params: Record<string, string>) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const url = `${WORKER_URL}/job/${product}${qs ? `?${qs}` : ""}`;

  const single = blobs.length === 1;
  const body: any = single ? new Uint8Array(blobs[0].bytes) : JSON.stringify({
    files: blobs.map((b, i) => ({ name: `input-${i}`, data: b.bytes.toString("base64") })),
  });

  return fetch(url, {
    method: "POST",
    headers: { "content-type": single ? blobs[0].type : "application/json" },
    body,
    signal: AbortSignal.timeout(WORKER_TIMEOUT_MS),
  });
}

export async function POST(req: NextRequest) {
  if (!r2Configured) {
    return NextResponse.json({ error: "Storage is not configured yet" }, { status: 503, headers: noStore });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected a file upload" }, { status: 400, headers: noStore });

  const product = String(form.get("product") ?? "").trim();
  const spec = ENGINE[product];
  if (!spec) {
    return NextResponse.json({ error: "Unknown product" }, { status: 404, headers: noStore });
  }

  // The catalogue row is the source of truth for whether a product is on sale and
  // what it costs. Checking it up front turns "the job could not be recorded"
  // (a foreign-key failure, 500) into an honest 404, and it means the price the
  // app shows is the price the engine charged for.
  const rowRes = await db(`products?slug=eq.${encodeURIComponent(product)}&select=slug,name,price_paise,plan,enabled`);
  const productRow = ((await rowRes.json()) as any[])[0];
  if (!productRow || productRow.enabled === false) {
    return NextResponse.json({ error: "This product is not switched on yet" }, { status: 404, headers: noStore });
  }

  // Parameters are per product — a passport photo takes a size, the PDF toolkit an
  // action and a page range. Only declared names are forwarded, so a stray form
  // field can never reach the engine's query string. `fixed` wins over anything a
  // caller sends, which is what makes a product a product.
  const params: Record<string, string> = { ...(spec.fixed ?? {}) };
  for (const name of spec.fields ?? []) {
    const v = String(form.get(name) ?? "").trim();
    if (!v) continue;
    const limit = FIELD_LIMITS[name] ?? (LONG_FIELDS.has(name) ? MAX_LONG_FIELD_CHARS : MAX_FIELD_CHARS);
    if (v.length > limit) {
      return NextResponse.json({ error: `${name} is too long` }, { status: 413, headers: noStore });
    }
    params[name] = v;
  }

  // Size is part of the job: 35x45 mm, 2x2 in and stamp size are three different
  // photos, not one photo in three labels.
  const sizes = PRODUCT_SIZES[product] ?? [];
  if (sizes.length > 0 && !sizes.includes(params.size ?? "")) {
    return NextResponse.json({ error: `size must be one of: ${sizes.join(", ")}` }, { status: 400, headers: noStore });
  }
  if (product === "cover-maker" && params.aspect && !COVER_ASPECTS.includes(params.aspect)) {
    return NextResponse.json({ error: `aspect must be one of: ${COVER_ASPECTS.join(", ")}` }, { status: 400, headers: noStore });
  }

  // The PDF toolkit's action and its enum parameters, checked before any bytes are
  // moved: an action the engine does not implement must not become a stored input
  // and a 502 the user cannot explain.
  if (product === "pdf-tools") {
    const action = params.action ?? "merge";
    if (!PDF_ACTIONS.includes(action)) {
      return NextResponse.json({ error: `action must be one of: ${PDF_ACTIONS.join(", ")}` }, { status: 400, headers: noStore });
    }
    if (params.angle && !PDF_ANGLES.includes(params.angle)) {
      return NextResponse.json({ error: `angle must be one of: ${PDF_ANGLES.join(", ")} degrees` }, { status: 400, headers: noStore });
    }
    if (params.position && !PDF_NUMBER_POSITIONS.includes(params.position)) {
      return NextResponse.json({ error: "position must be 1 to 9 (1 = top-left, 9 = bottom-right)" }, { status: 400, headers: noStore });
    }
    // Split and page numbering both read a page range; without one the engine would
    // take the whole document or fail, so say which it is before the upload.
    if (action === "split" && !params.pages) {
      return NextResponse.json({ error: "Split needs a page range, e.g. 1-3,7" }, { status: 400, headers: noStore });
    }
  }

  // The photo jobs' enums, checked the same way: a page size the engine cannot
  // build must be a 400 naming the sizes, not a 502 after the upload.
  if (product === "photos-to-pdf" && params.pagesize && !PDF_PAGE_FORMATS.includes(params.pagesize.toLowerCase())) {
    return NextResponse.json({ error: `pagesize must be one of: ${PDF_PAGE_FORMATS.join(", ")}` }, { status: 400, headers: noStore });
  }
  if (product === "collage") {
    if (params.layout && !COLLAGE_LAYOUTS.includes(params.layout.toLowerCase())) {
      return NextResponse.json({ error: `layout must be one of: ${COLLAGE_LAYOUTS.join(", ")}` }, { status: 400, headers: noStore });
    }
    if (params.cell_px && !/^\d{2,4}$/.test(params.cell_px)) {
      return NextResponse.json({ error: "cell_px must be a number of pixels, 240 to 2400" }, { status: 400, headers: noStore });
    }
  }

  // One file for most products, several for the ones that combine documents. A
  // data-only product (the invoice maker) has no file at all: its parameters are
  // the input.
  const uploads = spec.dataOnly ? [] : form.getAll("file").filter((f): f is File => f instanceof File);
  if (!spec.dataOnly && uploads.length === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400, headers: noStore });
  }
  if (uploads.length > 1 && !spec.multi) {
    return NextResponse.json({ error: "This tool takes one file" }, { status: 400, headers: noStore });
  }

  const accepts = acceptsFor(product);
  for (const f of uploads) {
    if (!accepts.includes(f.type)) {
      return NextResponse.json(
        { error: `This tool expects ${accepts.map(typeLabel).join(" or ")}` },
        { status: 415, headers: noStore },
      );
    }
  }
  const perFileMax = spec.multi ? MAX_DOC_BYTES : MAX_JOB_BYTES;
  if (uploads.some((f) => f.size > perFileMax)) {
    return NextResponse.json(
      { error: `Each file must be under ${Math.round(perFileMax / (1024 * 1024))} MB` },
      { status: 413, headers: noStore },
    );
  }

  // Multi-photo jobs: the per-file ceiling above is a document's, so what keeps a
  // burst of photos out of the engine's memory is the count and the total. The
  // engine caps both as well; this is the copy that can answer with a reason.
  const photoLimits = PHOTO_JOB_LIMITS[product];
  if (photoLimits) {
    if (uploads.length > photoLimits.files) {
      return NextResponse.json({ error: `This tool takes up to ${photoLimits.files} photos` }, { status: 400, headers: noStore });
    }
    if (product === "collage" && uploads.length < 2) {
      return NextResponse.json({ error: "A collage needs at least 2 photos" }, { status: 400, headers: noStore });
    }
    const total = uploads.reduce((sum, f) => sum + f.size, 0);
    if (total > photoLimits.totalBytes) {
      return NextResponse.json(
        { error: `Those photos add up to more than ${Math.round(photoLimits.totalBytes / (1024 * 1024))} MB` },
        { status: 413, headers: noStore },
      );
    }
  }

  // Identity is the phone number (see dropby-product-portfolio). It stays
  // optional here so the product can be tried before sign-in, but a *claimed*
  // phone must prove itself — an unverified token is never written to the row.
  let phone: string | null = null;
  if (form.get("phone")) {
    phone = toIndiaPhone(String(form.get("phone")));
    if (!phone || !checkPhoneToken(phone, String(form.get("token") ?? ""))) {
      return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
    }
  }

  // Rate limit per caller; a phone, when present, is the sharper key.
  const rl = rateLimit(`job:${phone ?? clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many jobs. Please try again later." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const id = randomUUID();
  const blobs: { bytes: Buffer; type: string; ext: string }[] = [];
  for (const f of uploads) {
    blobs.push({
      bytes: Buffer.from(await f.arrayBuffer()),
      type: f.type,
      ext: ALLOWED_IMAGE_TYPES[f.type] ?? DOC_INPUT_EXT[f.type] ?? "bin",
    });
  }

  // Every input is kept, not just the first: for a merge, "which two documents
  // went in" is the only way to explain the result afterwards. Multi-file jobs
  // list their keys comma-separated.
  const keys: string[] = [];
  for (let i = 0; i < blobs.length; i++) {
    const key = `${R2_PREFIX}/products/${product}/input/${id}${blobs.length > 1 ? `-${i}` : ""}.${blobs[i].ext}`;
    if (!(await putObject(key, blobs[i].bytes, blobs[i].type).catch(() => false))) {
      await recordFailure(product, phone, keys.join(",") || null, "input upload to storage failed", 0);
      return NextResponse.json({ error: "Could not store the file" }, { status: 502, headers: noStore });
    }
    keys.push(key);
  }
  const inputKey = keys.join(",");

  const started = Date.now();
  let out: Buffer;
  let meta: Record<string, unknown> = {};
  let contentType = "image/jpeg";
  try {
    const res = await callWorker(spec.engine, blobs, params);
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 300);
      // The engine answers 400 for a request it cannot honour (a page range, a
      // count, a shape) with a message written for the caller. Passing that status
      // and text through is the difference between "a 2x1 sheet holds only 2
      // photos" and a 502 "Could not finish the job. Please try again.", which
      // blames the server for the caller's own input. Anything 5xx stays a 502:
      // that one really is ours.
      if (res.status >= 400 && res.status < 500) {
        let reason = "";
        try {
          reason = String(JSON.parse(text)?.error ?? "").slice(0, 300);
        } catch {
          reason = text;
        }
        await recordFailure(product, phone, inputKey, `bad request: ${reason || res.status}`, Date.now() - started);
        return NextResponse.json(
          { error: reason || "That request cannot be made" },
          { status: 400, headers: noStore },
        );
      }
      throw new Error(`worker ${res.status}: ${text}`);
    }
    contentType = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
    const rawMeta = res.headers.get("x-job-meta");
    if (rawMeta) { try { meta = JSON.parse(rawMeta); } catch { meta = {}; } }
    out = Buffer.from(await res.arrayBuffer());
    if (out.length === 0) throw new Error("worker returned an empty file");
  } catch (e: any) {
    const durationMs = Date.now() - started;
    await recordFailure(product, phone, inputKey, e?.message ?? "worker unreachable", durationMs);
    return NextResponse.json({ error: "Could not finish the job. Please try again." }, { status: 502, headers: noStore });
  }
  const durationMs = Date.now() - started;

  const outputKey = `${R2_PREFIX}/products/${product}/${id}.${EXT_FOR_TYPE[contentType] ?? "bin"}`;
  const free = Boolean(spec.free);
  const pricePaise = Number(productRow.price_paise ?? 0);

  // Paid products hand out a watermarked preview and hold the clean key back. Free
  // products (the PDF toolkit) are the product itself, so the file is the answer.
  //
  // The preview step follows the file type: an image gets the tiled watermark, a
  // document gets a stamped watermark from pdfcpu. Skipping it for documents would
  // leave a paid PDF with no preview at all, which is what the invoice maker hit.
  let preview: Buffer | null = null;
  let previewKey: string | null = null;
  let previewContentType = "image/jpeg";
  const previewEngine = contentType === "application/pdf" ? "pdf-stamp" : contentType.startsWith("image/") ? "watermark" : null;
  if (!free && previewEngine) {
    let previewType = "image/jpeg";
    try {
      const wm = await fetch(`${WORKER_URL}/job/${previewEngine}`, {
        method: "POST",
        headers: { "content-type": contentType },
        body: new Uint8Array(out),
        signal: AbortSignal.timeout(WORKER_TIMEOUT_MS),
      });
      if (!wm.ok) throw new Error(`watermark ${wm.status}`);
      previewType = (wm.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
      preview = Buffer.from(await wm.arrayBuffer());
      if (preview.length === 0) throw new Error("watermark returned an empty file");
    } catch (e: any) {
      // Failing closed: returning the clean file as a "preview" would hand the
      // paid product away at the free step.
      await recordFailure(product, phone, inputKey, `preview: ${e?.message ?? "watermark failed"}`, durationMs);
      return NextResponse.json({ error: "Could not finish the job. Please try again." }, { status: 502, headers: noStore });
    }
    // Its own random id: see productPreviewKey(). The free URL must not be a
    // one-character edit away from the paid one. The extension follows the format
    // the engine chose (PNG keeps the cut-out's transparency).
    const ext = EXT_FOR_TYPE[previewType] ?? "jpg";
    previewKey = productPreviewKey(product, randomUUID(), ext);
    previewContentType = previewType;
  }

  if (!(await putObject(outputKey, out, contentType).catch(() => false))) {
    await recordFailure(product, phone, inputKey, "output upload to storage failed", durationMs);
    return NextResponse.json({ error: "Could not save the result" }, { status: 502, headers: noStore });
  }
  if (preview && previewKey && !(await putObject(previewKey, preview, previewContentType).catch(() => false))) {
    // Do not leave a clean sheet in the bucket that no order can point at.
    await deleteObject(outputKey).catch(() => {});
    await recordFailure(product, phone, inputKey, "preview upload to storage failed", durationMs);
    return NextResponse.json({ error: "Could not save the result" }, { status: 502, headers: noStore });
  }

  const insert = await db("product_jobs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      product,
      phone,
      input_key: inputKey,
      output_key: outputKey,
      preview_key: previewKey,
      status: "done",
      duration_ms: durationMs,
    }]),
  });
  if (!insert.ok) {
    // The objects stay in the bucket (the preview can still be shown), but a job
    // that was not measured must not report success silently.
    return NextResponse.json({ error: "Could not record the job" }, { status: 500, headers: noStore });
  }
  const [row] = (await insert.json()) as any[];

  // The bill's own fields are echoed back so the app can show what it asked for,
  // minus the payload: that is the customer's data, and it can be long.
  const echoed: Record<string, string> = { ...params };
  if (spec.dataOnly) delete echoed.payload;

  return NextResponse.json(
    free
      ? {
          output_url: publicUrlFor(outputKey),
          preview_url: null,
          locked: false,
          free: true,
          product,
          name: productRow.name,
          price_paise: pricePaise,
          plan: productRow.plan,
          job_id: row?.id ?? null,
          params: echoed,
          meta,
        }
      : {
          // The clean key is deliberately ABSENT here. It is released by
          // GET /api/job/<id> once an order for that job is paid — the paywall is
          // two objects in R2, not a flag the client can flip.
          preview_url: previewKey ? publicUrlFor(previewKey) : null,
          output_url: null,
          locked: true,
          product,
          name: productRow.name,
          price_paise: pricePaise,
          plan: productRow.plan,
          job_id: row?.id ?? null,
          params: echoed,
          meta,
        },
    { headers: noStore },
  );
}

/** Health/shape probe: is the local engine up, and what can it make? */
export async function GET() {
  try {
    const res = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return NextResponse.json(
      {
        ok: res.ok,
        worker: await res.json(),
        // What this route will accept, straight from the policy table, so the app
        // can grey out a tool instead of guessing.
        products: [...PRODUCTS].map((slug) => ({
          slug,
          free: Boolean(ENGINE[slug].free),
          engine: ENGINE[slug].engine,
        })),
      },
      { headers: noStore },
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, worker: "unreachable", detail: e?.message ?? "" }, { status: 503, headers: noStore });
  }
}
