import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { TRANSLATE_LANGS, isPageRange, PDF_PAGES_HELP } from "@hermes/core";
import { metaFor, runChain, type Capability } from "@/lib/ai";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ALLOWED_IMAGE_TYPES, R2_PREFIX, deleteObject, productPreviewKey, publicUrlFor, putObject, r2Configured } from "@/lib/r2";
import { asRow, asRows } from "@/lib/postgrest";
import type { ProductRow, ProductJobRow } from "@/lib/db-types";
import { errorMessage } from "@/lib/errors";

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
 * What the transcriber accepts. Deliberately **not** video: the model reads an audio track,
 * an mp4 would have to be demuxed first, and ffmpeg is not installed on the box — so offering
 * "drop your reel here" would be offering a job that cannot run. The screen says which export
 * button to press instead, which is a sentence, not a 400.
 *
 * Declared here rather than beside the other accepts lists because `ENGINE` below references
 * it, and a `const` used before its declaration is a module-load failure, not a warning.
 */
const AUDIO_ACCEPTS = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
];

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
  /** Served by the router in lib/ai.ts instead of by the Python engine. */
  router?: Capability;
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

  // The résumé builder: a JSON payload in, a vector A4 PDF out — the one new engine
  // product that needs no model, no token and no network. pdfcpu draws it from
  // `services/tools/resume_layout.py`, so the cost per job is ₹0 and every page rule
  // (wrapping, where the breaks fall, no heading stranded at the foot) is asserted on a
  // machine with no PDF library at all by `scripts/check-resume.py`.
  //
  // `dataOnly` because the résumé *is* the input — there is no file to upload, the same
  // shape as the invoice maker. The output is vector text on purpose: a résumé is read by
  // screening software before it is read by a person, and an image-only PDF is one an ATS
  // cannot parse.
  //
  // Free for the same reason the other new products are: the paywall has no working
  // gateway (Razorpay keys are missing), so a paid résumé would be a price nobody could
  // pay. The catalogue row is the product plan's ₹499; what it should cost is a business
  // decision, not a route one.
  "resume-builder": {
    engine: "resume-builder",
    dataOnly: true,
    fields: ["payload"],
    free: true,
  },

  // Subtitles: an audio file in, one SRT out, from `@cf/openai/whisper-large-v3-turbo` on
  // Workers AI. The model supplies the timings; `services/tools/captions.py` turns them into
  // a file (format, numbering, tag stripping) and `scripts/check-captions.py` asserts that
  // half on a machine that holds no token, which is what makes this product's *format* a
  // tested claim rather than a hope about a model.
  //
  // `accepts` is audio only — see AUDIO_ACCEPTS. And the product plan calls this "captions
  // burnt into a short video": burning them in needs ffmpeg, which is not on this box, so
  // what ships is the caption file an editor imports. The screen says that in words instead
  // of implying a rendered video.
  "subtitles": {
    engine: "subtitles",
    fields: ["language"],
    accepts: AUDIO_ACCEPTS,
    free: true,
  },

  // Voice-over: a script in, one MP3 out, from `@cf/myshell-ai/melotts`. The script rides in
  // `payload` because it runs to 4,000 characters and the shared field cap is 120 — the same
  // shape the invoice and the résumé builder already use. English only for now: the model is
  // multilingual, but no other language has been listened to here, and a synthetic voice that
  // mispronounces Hindi is worse than an honest English-only build.
  "voiceover": {
    engine: "voiceover",
    dataOnly: true,
    fields: ["payload"],
    free: true,
  },

  // Room redesign: a photo of a room in, a restyled photo out. Every image-to-image model
  // Workers AI used to host is gone (the catalogue has none, and `stable-diffusion-v1-5-img2img`
  // 404s), so this runs on `@cf/black-forest-labs/flux-2-klein-4b`, which unifies generation
  // and editing and takes up to four reference images by index.
  //
  // Two things about that model are load-bearing here. It takes **multipart form data**, not
  // JSON — even for a bare prompt — which is why the worker carries its own encoder
  // (`services/tools/multipart.py`, asserted by `scripts/check-multipart.py`). And its input
  // images must be **under 512x512**, so the worker fits the photo before sending it rather
  // than asking someone to resize the picture they just took.
  //
  // It is also a Partner model: if BFL's terms are not accepted in the Cloudflare dashboard the
  // call answers 403, which the worker reports as a server fault instead of blaming the photo.
  "room-redesign": {
    engine: "room-redesign",
    fields: ["style"],
    free: true,
  },

  // Text to image: the one product whose picture is drawn by a hosted model
  // (@cf/black-forest-labs/flux-1-schnell on Workers AI, with the token already on
  // this box). The engine has run it for hours; with no entry here the app answered
  // 404 "Unknown product", so a working capability had no door. `dataOnly` because
  // the prompt *is* the input — there is no file to upload, the same shape as the
  // invoice maker. Only `prompt` is forwarded: the verified model list is the
  // engine's business, and a caller must not be able to pick a model nobody measured.
  //
  // Free today, and there is a real cost behind that word: Cloudflare bills 172.8
  // neurons for one 1024x1024 4-step image (~Rs 0.17 at the published $0.011 per
  // 1,000 neurons), against 10,000 free neurons a day — about 57 images. The
  // catalogue row is priced 0/free so the app can use it while the paywall still has
  // no working gateway (Razorpay keys are missing); what it *should* cost is a
  // business decision, not a route one (docs/hourly-queue.md, parking lot).
  "ai-image": { engine: "ai-image", dataOnly: true, fields: ["prompt"], free: true },

  // Document translation: one document in (PDF / DOCX / plain text), the same text
  // in another Indian language out, with `@cf/meta/m2m100-1.2b` on Workers AI. The
  // catalogue row (`translate-doc`, "Document Translation", Rs 49) already existed —
  // the engine was the missing half. Only `source` and `target` are forwarded, and
  // the language set is checked below so an unsupported code is a 400 naming the ones
  // that work (measured: the service refuses `te`/`as`, and some codes translate the
  // sentence into something that no longer says it).
  //
  // `free: true` for the same reason `ai-image` is free, plus one more: this job does
  // cost money per run (m2m100 is billed per M tokens; the engine puts the real token
  // counts in `meta`), and a *paid* text product has no preview at all — the
  // `previewEngine` step below only watermarks images and PDFs, so a locked markdown
  // job would be a price with nothing to look at. What it should cost is a business
  // decision (parking lot), so the route says free and the tile can say free honestly.
  "translate-doc": {
    engine: "translate-doc",
    free: true,
    fields: ["source", "target"],
    accepts: DOC_ACCEPTS,
  },

  // The first product the router in lib/ai.ts serves itself — there is no Python
  // engine behind it. `business_id` is the whole input: the route loads that row from
  // our own directory and hands its fields to `runChain("text", …)` as *facts*, and
  // the ₹0 `rules` path writes one paragraph out of them (no model, no key, which is
  // why it runs under pm2 where `apps/web/.env` has no AI token). The text is stored
  // on `businesses.description` — the column exists and every one of the ~24k rows
  // is NULL — so the service page can render it, and the job's meta says which
  // provider answered (`metaFor`), which is the half item 37 could not do before.
  //
  // `free: true`: the rules path costs ₹0 and there is nothing to watermark (a
  // locked markdown job would be a price with no preview, item 15's lesson).
  "listing-description": {
    engine: "listing-description",
    free: true,
    dataOnly: true,
    fields: ["business_id"],
    router: "text",
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
  // Audio, so a wrong file gets "this tool expects MP3 or M4A or WAV", not a list of mime
  // subtypes ("X-WAV", "X-M4A") that reads like a bug rather than an instruction.
  "audio/mpeg": "MP3",
  "audio/mp3": "MP3",
  "audio/mp4": "M4A",
  "audio/m4a": "M4A",
  "audio/x-m4a": "M4A",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/wave": "WAV",
  "audio/webm": "WebM",
  "audio/ogg": "OGG",
  "audio/flac": "FLAC",
  "audio/x-flac": "FLAC",
};

function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type.split("/")[1].toUpperCase();
}

/** Extension for a stored input file, so its R2 key tells the truth about the format. */
const DOC_INPUT_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  [DOCX_MIME]: "docx",
  "text/plain": "txt",
  // Audio, for the transcriber. Without these an uploaded voice note is stored as
  // `…/input.bin`, and "what did the shop actually send" stops being answerable from the key.
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
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
const FIELD_LIMITS: Record<string, number> = { keywords: 700, prompt: 300 };
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

/**
 * Languages the translation product offers. The list itself lives in `@hermes/core`
 * (`TRANSLATE_LANGS`) because the app's own picker draws it — a second copy is how the
 * PDF screen ended up offering ranges the engine refused (item 25), and a picker that
 * offers a code this route rejects is a screen whose only outcome is a 400. The engine
 * checks the same set in `services/tools/worker.py` (the Python/TS boundary is why the
 * names appear twice), so a caller who bypasses this route still cannot ask for a
 * language nobody verified. Written from a round-trip measurement, not from the model's
 * marketing: each code below took "Payment is due within thirty days of the invoice
 * date." into the language and back to English with the thirty days intact. That test
 * removed `gu` (5 probes, 5 wrong numbers) and `te` (no engine answered it at all).
 */
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
  // The transcriber answers SRT, the voice-over answers MP3. Both would otherwise land in
  // the bucket as `.bin`, which is a file nobody can open from a phone.
  "application/x-subrip": "srt",
  "text/vtt": "vtt",
  "audio/mpeg": "mp3",
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
  const body: BodyInit = single ? new Uint8Array(blobs[0].bytes) : JSON.stringify({
    files: blobs.map((b, i) => ({ name: `input-${i}`, data: b.bytes.toString("base64") })),
  });

  return fetch(url, {
    method: "POST",
    headers: { "content-type": single ? blobs[0].type : "application/json" },
    body,
    signal: AbortSignal.timeout(WORKER_TIMEOUT_MS),
  });
}

/**
 * A mistake the *caller* made in a router-served job (an id that is not a business).
 * It answers 400 with its own sentence, exactly like the engine's `UserError`: a
 * request we cannot honour must not read as "the server broke" (item 19's lesson).
 */
class CallerError extends Error {}

/**
 * Write one paragraph about a directory listing, from the listing's own row.
 *
 * The input is a `businesses` row we already hold and the writer is the router's ₹0
 * `rules` path, so this job has no engine, no upload and no key — the whole thing runs
 * inside the Next process. The facts handed to the template are the *only* things it
 * may say: `name` (required), `category`, `area`, `phone` and `rating`, nothing else,
 * so a listing cannot acquire a claim its row does not contain.
 *
 * The text is saved to `businesses.description` because that is where the service page
 * can read it (one column, additive — no row is deleted, no other column is touched).
 * The job's output is the same text as a `.md` object in R2, like every other product.
 */
async function describeListing(id: number) {
  const res = await db(`businesses?id=eq.${id}&select=id,name,category,area,phone,rating&limit=1`);
  if (!res.ok) throw new Error(`PostgREST answered ${res.status} reading businesses`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const biz = rows[0];
  if (!biz) throw new CallerError(`there is no business with id ${id} in the directory`);

  const facts: Record<string, string | number | null> = {
    name: typeof biz.name === "string" ? biz.name : "",
    category: typeof biz.category === "string" ? biz.category : null,
    area: typeof biz.area === "string" ? biz.area : null,
    phone: typeof biz.phone === "string" ? biz.phone : null,
    rating: typeof biz.rating === "number" ? biz.rating : null,
  };

  const outcome = await runChain("text", { kind: "listing-description", facts });
  const text = (outcome.answer?.text ?? "").trim();
  if (!text) {
    throw new Error(outcome.record.detail ?? "no provider in the text chain could write a description");
  }

  const written = await db(`businesses?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ description: text }),
  });
  if (!written.ok) throw new Error(`PostgREST answered ${written.status} storing the description`);

  return {
    text,
    meta: {
      business_id: id,
      chars: text.length,
      facts_used: Object.entries(facts)
        .filter(([, v]) => v !== null && v !== "")
        .map(([k]) => k),
      ...(outcome.answer?.meta ?? {}),
      ...metaFor(outcome.record),
    },
  };
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
  const productRow = await asRow<ProductRow>(rowRes);
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
    // A range pdfcpu cannot parse is a syntax error there, i.e. a 500 -> 502 here.
    // Measured on v0.15.0: `abc`, `1;2`, `1--2` and `1.5` all fail that way, while
    // `1-3`, `1-`, `odd`, `l` and `!6` are real selections. Shape-checked here so the
    // caller is told the format instead of the app reporting a broken server.
    if (params.pages && !isPageRange(params.pages)) {
      return NextResponse.json({ error: PDF_PAGES_HELP }, { status: 400, headers: noStore });
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

  // The translation product's two language codes, checked before any bytes move: a
  // language the engine does not offer has to be a 400 that names the ones it does,
  // not a 502 after a 30 MB scan has been uploaded and translated halfway.
  if (product === "translate-doc") {
    for (const name of ["source", "target"]) {
      const code = (params[name] ?? "").toLowerCase();
      if (!code) {
        return NextResponse.json({ error: `${name} language is required — one of: ${TRANSLATE_LANGS.join(", ")}` }, { status: 400, headers: noStore });
      }
      if (!TRANSLATE_LANGS.includes(code)) {
        return NextResponse.json({ error: `'${code}' is not one of the languages this tool translates (${TRANSLATE_LANGS.join(", ")})` }, { status: 400, headers: noStore });
      }
    }
    if (params.source.toLowerCase() === params.target.toLowerCase()) {
      return NextResponse.json({ error: "source and target are the same language — that is not a translation" }, { status: 400, headers: noStore });
    }
  }

  // The listing writer's one parameter: an id in our own directory. Checked before the
  // job row is created so a typo is a 400 naming the field, not a 500 from the loader.
  if (product === "listing-description" && !/^\d{1,12}$/.test(params.business_id ?? "")) {
    return NextResponse.json(
      { error: "business_id is required — the id of a business in this directory, e.g. 119465" },
      { status: 400, headers: noStore },
    );
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
    // Two ways to serve a job: the Python engine on loopback, or — for the one product
    // whose whole input is a row we already hold — the router in this process. The
    // branch is here, and not in the engine, because the router is TypeScript and the
    // ₹0 path must work under pm2 where apps/web/.env holds no AI token.
    if (spec.router) {
      const served = await describeListing(Number(params.business_id));
      out = Buffer.from(served.text, "utf8");
      meta = served.meta;
      contentType = "text/markdown";
    } else {
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
    }
  } catch (e) {
    const durationMs = Date.now() - started;
    if (e instanceof CallerError) {
      await recordFailure(product, phone, inputKey, `bad request: ${e.message}`, durationMs);
      return NextResponse.json({ error: e.message }, { status: 400, headers: noStore });
    }
    await recordFailure(product, phone, inputKey, errorMessage(e, "worker unreachable"), durationMs);
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
    } catch (e) {
      // Failing closed: returning the clean file as a "preview" would hand the
      // paid product away at the free step.
      await recordFailure(product, phone, inputKey, `preview: ${errorMessage(e, "watermark failed")}`, durationMs);
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

  /**
   * The engine's own measurements are stored with the job.
   *
   * They used to exist only in the response body: the screen read `meta` once and
   * it was gone, so the table could not answer "which model served this job, and
   * what did it cost" — the measurement the product prices are meant to come from
   * (`product_jobs.meta`, migration 20260917000001). PostgREST takes a JSON object
   * for a jsonb column directly; that was measured against a scratch table before
   * this was written, not assumed.
   *
   * An empty object stores NULL (no measurement is not a measurement of nothing),
   * and a blob over the cap is left out rather than truncated: half a measurement
   * is worse than none. It is not silent — the meta still goes to the caller, and
   * the engine's meta has never come near 16 KB (the invoice's full `tax_rows` is
   * ~400 bytes).
   */
  const META_ROW_CAP = 16_384;
  const rowMeta =
    Object.keys(meta).length > 0 && JSON.stringify(meta).length <= META_ROW_CAP ? meta : null;

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
      meta: rowMeta,
    }]),
  });
  if (!insert.ok) {
    // The objects stay in the bucket (the preview can still be shown), but a job
    // that was not measured must not report success silently.
    return NextResponse.json({ error: "Could not record the job" }, { status: 500, headers: noStore });
  }
  const [row] = await asRows<ProductJobRow>(insert);

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
  } catch (e) {
    return NextResponse.json({ ok: false, worker: "unreachable", detail: errorMessage(e) }, { status: 503, headers: noStore });
  }
}
