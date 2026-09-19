import { CITY_LABEL } from "@hermes/core";
/**
 * One door to every AI capability, with a chain behind it.
 *
 * Queue item 17, built from the chain table in `docs/resources-and-apis.md` §3. That table
 * promises that no single vendor can take a product down, and that promise is only real if
 * the code that walks the chain lives in one place: one function per capability, tried in
 * order, with a timeout and a health check per provider, and a record of which provider
 * actually answered. The record is what goes into a job's `meta`, so any output can be traced
 * to the model — or template — that produced it.
 *
 * Two rules this module exists to keep:
 *  - **It works with zero keys.** Capabilities that have a local engine answer from it today
 *    (search from the directory's own database, text from templates over facts we already
 *    have); capabilities that have none fail out loud, naming every provider and why it was
 *    skipped. An empty string is not an answer.
 *  - **It never invents a result.** A provider that cannot run is skipped with a sentence; a
 *    chain that runs out returns `ok: false` plus the reasons.
 *
 * Server only: keys are read from `process.env` at call time and are never bundled. The file
 * deliberately imports nothing from the app and nothing through the `@/` alias, so it can be
 * exercised under plain node — `node --test lib/ai.test.mjs`.
 */

import { existsSync } from "node:fs";

/** Per-provider ceiling from docs/resources-and-apis.md §3 ("a 20 s timeout per provider"). */
export const DEFAULT_TIMEOUT_MS = 20_000;

export type Capability =
  | "text"
  | "text-cheap"
  | "vision"
  | "translate"
  | "stt"
  | "tts"
  | "image"
  | "search";

/** Everything a provider may need. One flat shape, because the callers are job routes. */
export type AiInput = {
  /** A writing instruction, a picture description, an image prompt. */
  prompt?: string;
  /** The text to translate, transcribe, search for, or tidy. */
  text?: string;
  /** Template selector for the local rules provider (e.g. "listing-description"). */
  kind?: string;
  /** Facts the rules provider may quote. It asserts nothing that is not in here. */
  facts?: Record<string, string | number | null | undefined>;
  bytes?: Uint8Array;
  mime?: string;
  /** Language wanted (translate / tts). */
  target?: string;
  source?: string;
  limit?: number;
  maxTokens?: number;
};

export type SearchHit = {
  id: number | string;
  name: string;
  category?: string | null;
  area?: string | null;
  rating?: number | null;
  /** Trigram overlap with the query, 0..1 — see `trigramScore`. */
  score: number;
};

export type ProviderAnswer = {
  text?: string;
  bytes?: Uint8Array;
  contentType?: string;
  hits?: SearchHit[];
  meta: Record<string, unknown>;
};

export type Attempt = {
  provider: string;
  outcome: "ok" | "skipped" | "error" | "timeout" | "unhealthy";
  ms: number;
  detail?: string;
  /** How many HTTP tries the attempt took; more than 1 means the first was a 5xx/429. */
  tries?: number;
};

export type ChainRecord = {
  capability: Capability;
  /** The provider that served this call, or null when nothing could. */
  provider: string | null;
  ok: boolean;
  ms: number;
  cost: string | null;
  attempts: Attempt[];
  detail?: string;
};

export type ChainOutcome = {
  ok: boolean;
  record: ChainRecord;
  answer: ProviderAnswer | null;
};

export type Availability = { ok: true } | { ok: false; reason: string };

export type RunContext = { capability: Capability; signal: AbortSignal };

export type Provider = {
  id: string;
  /** "local" = runs on this box for ₹0. "remote" = needs a key and a network call. */
  kind: "remote" | "local";
  /** Stated for item 16 (price from measured cost), never inferred at call time. */
  cost: string;
  capabilities: Capability[];
  /** Provider-specific ceiling; the router's `timeoutMs` option wins when set. */
  timeoutMs?: number;
  /** Cheap, sync check: is this provider usable at all right now? */
  available(capability: Capability): Availability;
  /** Optional deeper check (one small request). A false here skips without running. */
  health?(capability: Capability): Promise<{ ok: boolean; detail?: string }>;
  run(input: AiInput, ctx: RunContext): Promise<ProviderAnswer>;
};

/** A provider's own failure, carrying the HTTP status so the router can retry a 5xx once. */
export class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

/* ---------------------------------------------------------------- the chains */

/**
 * Order matters: cheapest-and-most-local first where quality allows, and the last entry is
 * the ₹0 engine where one exists. `KEY_ONLY` below lists the capabilities that have no
 * local engine on this box — for those the last entry is still remote, and with no key the
 * chain fails with a sentence instead of pretending.
 */
export const CHAINS: Record<Capability, string[]> = {
  text: ["workers-ai-text", "gemini", "groq", "rules"],
  "text-cheap": ["workers-ai-bulk", "gemini", "groq", "rules"],
  vision: ["workers-ai-vision", "gemini-vision", "tesseract"],
  translate: ["workers-ai-translate", "gemini", "workers-ai-m2m100"],
  stt: ["workers-ai-whisper", "groq-whisper", "whisper-cpp"],
  tts: ["workers-ai-melotts", "workers-ai-aura", "piper"],
  image: ["workers-ai-flux", "workers-ai-sdxl"],
  search: ["supabase-like"],
};

/**
 * Capabilities that cannot be served on this box without a key, so their chain can only be
 * run once one is added. Measured, not assumed: `vision`/`stt`/`tts` end on a claimed ₹0 slot
 * that cannot actually run (`tesseract` and `whisper.cpp` are not installed, `piper`'s
 * maintained fork is GPL), `image` has no model that fits in 8 GB of CPU RAM, and `translate`
 * has no local engine at all — the chain table's own "last resort" is an LLM, which needs the
 * same key. The unit test pins this list against a real zero-key run, so a capability cannot
 * quietly lose its ₹0 path, nor gain a silent one that does not work.
 */
export const KEY_ONLY: Capability[] = ["vision", "translate", "stt", "tts", "image"];

/* ------------------------------------------------------------------ helpers */

/** First name in the list that is set. `CLOUDFLARE_AI_TOKEN` is the documented name (§2.2). */
function envVar(...names: string[]): { name: string; value: string } | null {
  for (const name of names) {
    const value = (process.env[name] ?? "").trim();
    if (value) return { name, value };
  }
  return null;
}

function cfToken() {
  return envVar("CLOUDFLARE_AI_TOKEN", "CLOUDFLARE_API_TOKEN");
}

function cfAccount(): string {
  return (process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "").trim();
}

/** base64 -> bytes. `Buffer` exists in every Next server runtime; `atob` is the fallback. */
function bytesFromBase64(data: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(data, "base64"));
  const raw = atob(data);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/** A response body read as JSON without throwing on an HTML error page. */
async function readJson(res: Response): Promise<Record<string, unknown>> {
  const raw = await res.text();
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new ProviderError(`expected JSON, got ${raw.slice(0, 120).replace(/\s+/g, " ")}`, res.status);
  }
}

function dig(obj: unknown, ...path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/**
 * pg_trgm-style trigrams, computed here rather than in the database: the project's PostgREST
 * exposes no `similarity()`/`show_trgm` function (measured — `POST /rest/v1/rpc/show_trgm`
 * answers `PGRST202 not found`), so ranking is done on this side over the rows PostgREST
 * already returned. Same idea as the extension: pad, slice into 3-grams, compare sets.
 */
export function trigrams(value: string): Set<string> {
  const padded = `  ${value.toLowerCase().replace(/\s+/g, " ").trim()} `;
  const out = new Set<string>();
  for (let i = 0; i + 3 <= padded.length; i += 1) out.add(padded.slice(i, i + 3));
  return out;
}

/** Jaccard overlap of two strings' trigram sets, 0..1. */
export function trigramScore(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/* ------------------------------------------------- the local (₹0) providers */

/**
 * The rules provider: a template filled from facts, and nothing else. This is what "text for
 * ₹0" honestly means without a model on disk, so it refuses any `kind` it does not know
 * rather than drafting something plausible.
 */
export function rulesAnswer(input: AiInput): string {
  const kind = (input.kind ?? "listing-description").trim();
  const facts = input.facts ?? {};

  if (kind === "listing-description") {
    const name = asString(facts.name);
    if (!name) throw new ProviderError("the rules provider needs facts.name — a business with no name has no description");
    const category = asString(facts.category) ?? "business";
    const area = asString(facts.area) ?? "Indore";
    const lines = [`${name} is a ${category} in ${area}.`];
    const phone = asString(facts.phone);
    if (phone) lines.push(`Phone: ${phone}.`);
    const rating = facts.rating;
    if (typeof rating === "number" && rating > 0) lines.push(`Rated ${rating} out of 5 in the directory.`);
    return lines.join(" ");
  }

  if (kind === "tidy") {
    const text = asString(input.text);
    if (!text) throw new ProviderError("the rules provider needs ?text= to tidy");
    const flat = text.replace(/\s+/g, " ").trim();
    const limit = typeof input.limit === "number" && input.limit > 0 ? input.limit : 240;
    if (flat.length <= limit) return flat;
    const cut = flat.slice(0, limit);
    // A cut that already lands on a full stop is a cut at a sentence; otherwise back up to
    // the last complete sentence, then to the last word, and only then say it was trimmed.
    if (/[.!?]$/.test(cut)) return cut;
    const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    if (at > 0) return cut.slice(0, at + 1);
    const space = cut.lastIndexOf(" ");
    if (space > limit * 0.6) return `${cut.slice(0, space)}…`;
    return `${cut.trimEnd()}…`;
  }

  throw new ProviderError(
    `the rules provider has no template called "${kind}" and there is no model on this box to fall back on — ` +
      `it knows listing-description and tidy`,
  );
}

const rulesProvider: Provider = {
  id: "rules",
  kind: "local",
  cost: "₹0 — a template over facts we already have; no model runs",
  capabilities: ["text", "text-cheap"],
  available: () => ({ ok: true }),
  async run(input) {
    const text = rulesAnswer(input);
    return {
      text,
      meta: {
        provider: "rules",
        templated: true,
        kind: input.kind ?? "listing-description",
        chars: text.length,
        note: "no model was involved: this is a fixed sentence shape filled from the facts supplied, so it cannot claim anything they do not contain",
      },
    };
  },
};

/**
 * The directory's own database as the last-resort search engine: PostgREST `ilike` for the
 * candidates, trigram overlap for the order. Free, already running, and the only search we
 * have with no key at all. The measured shape (`status=eq.active`, three `ilike` branches and
 * an `or=` clause) is pinned in `lib/ai.test.mjs`, and verified live by
 * `scripts/ai-router-report.mjs`.
 */
const supabaseSearch: Provider = {
  id: "supabase-like",
  kind: "local",
  cost: "₹0 — one PostgREST query against our own Supabase",
  capabilities: ["search"],
  available() {
    if (!(process.env.SUPABASE_URL ?? "").trim()) return { ok: false, reason: "SUPABASE_URL is not set" };
    if (!(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()) return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set" };
    return { ok: true };
  },
  async health() {
    const url = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
    const res = await fetch(`${url}/rest/v1/businesses?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    return res.ok ? { ok: true } : { ok: false, detail: `GET /businesses answered ${res.status}` };
  },
  async run(input, ctx) {
    const query = (input.text ?? input.prompt ?? "").trim();
    if (!query) throw new ProviderError("search needs ?text= — the words to look for");
    // PostgREST matches one pattern per column, so a phrase like "plumber vijay nagar" has to
    // be split: every word must appear in name, category or area. Written as `and=(or(...),
    // or(...))` — measured on the live table: "plumber" returns 40 rows, "plumber vijay nagar"
    // returns 4, "copper wire" returns 0 (the per-column phrase match returns 0 for all three).
    const words = query.replace(/[,()*\\"]/g, " ").split(/\s+/).filter(Boolean).slice(0, 6);
    if (!words.length) throw new ProviderError("search needs ?text= — the words to look for");
    const groups = words.map((word) => `or(${["name", "category", "area"].map((col) => `${col}.ilike.*${word}*`).join(",")})`);
    const url = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
    const limit = typeof input.limit === "number" && input.limit > 0 ? Math.min(input.limit * 8, 40) : 40;
    const path = `businesses?select=id,name,category,area,rating&status=eq.active&city=eq.${encodeURIComponent(CITY_LABEL)}&and=${encodeURIComponent(`(${groups.join(",")})`)}&limit=${limit}`;

    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: ctx.signal,
    });
    if (!res.ok) throw new ProviderError(`PostgREST answered ${res.status}`, res.status);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows)) throw new ProviderError("PostgREST did not answer with a row list");

    const hits: SearchHit[] = rows
      .map((row) => ({
        id: (row.id as number | string) ?? "",
        name: String(row.name ?? ""),
        category: (row.category as string | null) ?? null,
        area: (row.area as string | null) ?? null,
        rating: (row.rating as number | null) ?? null,
        score: trigramScore(query, `${row.name ?? ""} ${row.category ?? ""} ${row.area ?? ""}`),
      }))
      .filter((hit) => hit.name)
      .sort((a, b) => b.score - a.score);
    const wanted = typeof input.limit === "number" && input.limit > 0 ? input.limit : 5;

    return {
      hits: hits.slice(0, wanted),
      meta: {
        provider: "supabase-like",
        candidates: rows.length,
        words,
        ranking:
          "trigram overlap computed in the router (the project exposes no similarity()/show_trgm RPC — measured PGRST202)",
      },
    };
  },
};

/**
 * OCR, the vision chain's ₹0 slot. Honest about this box: `tesseract` is not installed (no
 * binary in PATH, no `pytesseract` module), so `available()` says exactly that and the chain
 * reports it rather than answering an image with silence. If the binary is ever installed,
 * point `TESSERACT_BIN` at it and the slot starts working.
 */
const tesseractProvider: Provider = {
  id: "tesseract",
  kind: "local",
  cost: "₹0 — local OCR (Apache-2.0)",
  capabilities: ["vision"],
  timeoutMs: 60_000,
  available() {
    const bin = (process.env.TESSERACT_BIN ?? "").trim();
    if (!bin) {
      return {
        ok: false,
        reason: "tesseract is not installed on this box (no TESSERACT_BIN, no `tesseract` in PATH, no pytesseract module) — see docs/resources-and-apis.md §3",
      };
    }
    if (!existsSync(bin)) return { ok: false, reason: `TESSERACT_BIN=${bin} does not exist` };
    return { ok: true };
  },
  async run() {
    // Deliberately not implemented until the binary is on the box: a vision path that
    // silently returns nothing is worse than a vision path that says it is missing. The
    // worker owns image work anyway (services/tools/worker.py), which is where OCR will live.
    throw new ProviderError("tesseract is not installed on this box, so OCR cannot run here");
  },
};

/** `whisper.cpp` for speech-to-text. Same honest slot as tesseract. */
const whisperCppProvider: Provider = {
  id: "whisper-cpp",
  kind: "local",
  cost: "₹0 — local whisper.cpp",
  capabilities: ["stt"],
  timeoutMs: 120_000,
  available() {
    const bin = (process.env.WHISPER_CPP_BIN ?? "").trim();
    if (!bin) return { ok: false, reason: "no local speech-to-text engine on this box: WHISPER_CPP_BIN is unset and no whisper binary is installed" };
    if (!existsSync(bin)) return { ok: false, reason: `WHISPER_CPP_BIN=${bin} does not exist` };
    return { ok: true };
  },
  async run() {
    throw new ProviderError("no local speech-to-text engine is installed on this box");
  },
};

/**
 * `piper` for text-to-speech — a slot that must stay empty until the licence question is
 * answered, which is why it is unavailable *by name* rather than by omission: the maintained
 * fork is GPL, and GPL does not belong in this stack (queue rule 4).
 */
const piperProvider: Provider = {
  id: "piper",
  kind: "local",
  cost: "₹0 if installed — but the maintained fork is GPL-3.0, so it stays out until that is decided",
  capabilities: ["tts"],
  available: () => ({
    ok: false,
    reason: "piper is not installed, and the maintained fork is GPL-3.0 — decide the licence before shipping it (docs/resources-and-apis.md §3)",
  }),
  async run() {
    throw new ProviderError("no local text-to-speech engine is installed, and piper's maintained fork is GPL");
  },
};

/* -------------------------------------------------------------- remote providers */

type CfShape = "chat" | "transcript" | "translation" | "audio" | "image";

type CfSpec = {
  id: string;
  model: string;
  shape: CfShape;
  cost: string;
  capabilities: Capability[];
  timeoutMs?: number;
  /** Audio models disagree on the field name: melotts wants `prompt`, aura wants `text`. */
  bodyKey?: "prompt" | "text";
};

/**
 * Every Workers AI model behind one implementation. The request shapes come off Cloudflare's
 * own model pages (read 2026-09-17), not from memory: `whisper` takes the audio as a **binary
 * body** and answers JSON `{text}`, `melotts` takes `{prompt, lang}` and may answer either
 * JSON or `audio/mpeg`, `indictrans2` takes `{text, source_lang, target_lang}` and answers
 * `{translations: []}`, and the text models answer either `{response}` or an OpenAI-shaped
 * `{choices: [{message: {content}}]}` — all four are handled, because a model swap must not
 * need a code change.
 */
function workersAi(spec: CfSpec): Provider {
  return {
    id: spec.id,
    kind: "remote",
    cost: `${spec.model} — ${spec.cost}; Workers AI free tier 10,000 neurons/day`,
    capabilities: spec.capabilities,
    timeoutMs: spec.timeoutMs,
    available() {
      if (!cfToken()) {
        return {
          ok: false,
          reason: "no Workers AI token: CLOUDFLARE_AI_TOKEN is not in apps/web/.env (docs/resources-and-apis.md §2.2)",
        };
      }
      if (!cfAccount()) return { ok: false, reason: "CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_R2_ACCOUNT_ID is not set, so the account URL is unknown" };
      return { ok: true };
    },
    async health() {
      // One cheap authenticated call that does not run a model: the account's own models list.
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount()}/ai/models/search?per_page=1`, {
        headers: { Authorization: `Bearer ${cfToken()?.value ?? ""}` },
      });
      return res.ok ? { ok: true } : { ok: false, detail: `Workers AI answered ${res.status}` };
    },
    async run(input, ctx) {
      const token = cfToken();
      if (!token) throw new ProviderError("CLOUDFLARE_AI_TOKEN is not set");

      let body: BodyInit;
      let contentType = "application/json";
      if (spec.shape === "transcript") {
        if (!input.bytes) throw new ProviderError("speech-to-text needs the audio bytes");
        body = input.bytes as unknown as BodyInit;
        contentType = input.mime ?? "audio/mpeg";
      } else if (spec.shape === "translation") {
        const text = asString(input.text) ?? asString(input.prompt);
        if (!text) throw new ProviderError("translation needs ?text=");
        body = JSON.stringify({
          text,
          source_lang: input.source ?? "english",
          target_lang: input.target ?? "hindi",
        });
      } else if (spec.shape === "audio") {
        const prompt = asString(input.text) ?? asString(input.prompt);
        if (!prompt) throw new ProviderError("text-to-speech needs ?text=");
        body = JSON.stringify({ [spec.bodyKey ?? "prompt"]: prompt, lang: input.target ?? "en" });
      } else if (spec.shape === "image") {
        const prompt = asString(input.prompt) ?? asString(input.text);
        if (!prompt) throw new ProviderError("image generation needs ?prompt=");
        body = JSON.stringify({ prompt });
      } else {
        const prompt = asString(input.prompt) ?? asString(input.text);
        if (!prompt) throw new ProviderError(`${spec.id} needs ?prompt=`);
        body = JSON.stringify(input.maxTokens ? { prompt, max_tokens: input.maxTokens } : { prompt });
      }

      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount()}/ai/run/${spec.model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.value}`, "Content-Type": contentType },
        body,
        signal: ctx.signal,
      });
      const ctype = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new ProviderError(`Workers AI ${res.status}: ${detail.slice(0, 160).replace(/\s+/g, " ")}`, res.status);
      }

      const common = {
        provider: spec.id,
        model: spec.model,
        token_source: token.name,
        cost: spec.cost,
      };

      if (ctype.startsWith("image/") || ctype.startsWith("audio/")) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        return { bytes, contentType: ctype.split(";")[0], meta: { ...common, bytes: bytes.length } };
      }

      const json = await readJson(res);
      const result = json.result ?? {};

      if (spec.shape === "transcript") {
        const text = asString(dig(result, "text"));
        if (!text) throw new ProviderError("Workers AI returned no transcript");
        return { text, meta: { ...common, words: dig(result, "word_count") ?? undefined } };
      }
      if (spec.shape === "translation") {
        const text = asString(dig(result, "translations", 0)) ?? asString(dig(result, "response")) ?? asString(dig(result, "translated_text"));
        if (!text) throw new ProviderError("Workers AI returned no translation");
        return { text, meta: common };
      }
      if (spec.shape === "audio") {
        const b64 = asString(dig(result, "audio")) ?? asString(dig(result, "result"));
        if (!b64) throw new ProviderError("Workers AI returned no audio");
        const bytes = bytesFromBase64(b64);
        return { bytes, contentType: "audio/mpeg", meta: { ...common, bytes: bytes.length } };
      }
      if (spec.shape === "image") {
        const b64 = asString(dig(result, "image"));
        if (!b64) throw new ProviderError("Workers AI returned no image");
        const bytes = bytesFromBase64(b64);
        return { bytes, contentType: "image/jpeg", meta: { ...common, bytes: bytes.length } };
      }

      const text =
        asString(dig(result, "response")) ??
        asString(dig(result, "choices", 0, "message", "content")) ??
        asString(dig(result, "choices", 0, "text"));
      if (!text) throw new ProviderError("Workers AI returned no text");
      return { text, meta: { ...common, usage: dig(result, "usage") ?? undefined } };
    },
  };
}

/** Gemini Flash — the free text/vision fallback (docs/resources-and-apis.md §2.4). */
function gemini(id: string, model: string): Provider {
  return {
    id,
    kind: "remote",
    cost: `${model} — free tier (~1,500 requests/day, no card)`,
    capabilities: ["text", "text-cheap", "vision", "translate"],
    available() {
      return (process.env.GEMINI_API_KEY ?? "").trim()
        ? { ok: true }
        : { ok: false, reason: "GEMINI_API_KEY is not set (free key, docs/resources-and-apis.md §2.4)" };
    },
    async run(input, ctx) {
      const key = (process.env.GEMINI_API_KEY ?? "").trim();
      if (!key) throw new ProviderError("GEMINI_API_KEY is not set");
      const parts: Record<string, unknown>[] = [];
      const instruction = asString(input.prompt) ?? asString(input.text);
      if (instruction) {
        parts.push({
          text:
            ctx.capability === "translate" && input.target
              ? `${instruction}\n\nTranslate into ${input.target}. Reply with the translation only.`
              : instruction,
        });
      }
      if (input.bytes && ctx.capability === "vision") {
        parts.push({ inlineData: { mimeType: input.mime ?? "image/jpeg", data: bytesToBase64(input.bytes) } });
      }
      if (!parts.length) throw new ProviderError(`${id} needs a prompt, text or an image`);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts }] }),
        signal: ctx.signal,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new ProviderError(`Gemini ${res.status}: ${detail.slice(0, 160).replace(/\s+/g, " ")}`, res.status);
      }
      const json = await readJson(res);
      const text = asString(dig(json, "candidates", 0, "content", "parts", 0, "text"));
      if (!text) throw new ProviderError("Gemini returned no text");
      return { text, meta: { provider: id, model, usage: dig(json, "usageMetadata") ?? undefined } };
    },
  };
}

/** Groq — fast free text, and a free Whisper for speech-to-text. */
const groqProvider: Provider = {
  id: "groq",
  kind: "remote",
  cost: "llama-3.3-70b-versatile — free tier (30 req/min)",
  capabilities: ["text", "text-cheap"],
  available: () =>
    (process.env.GROQ_API_KEY ?? "").trim()
      ? { ok: true }
      : { ok: false, reason: "GROQ_API_KEY is not set (free key, docs/resources-and-apis.md §2.5)" },
  async run(input, ctx) {
    const key = (process.env.GROQ_API_KEY ?? "").trim();
    if (!key) throw new ProviderError("GROQ_API_KEY is not set");
    const prompt = asString(input.prompt) ?? asString(input.text);
    if (!prompt) throw new ProviderError("groq needs ?prompt=");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: ctx.capability === "translate" && input.target ? `${prompt}\n\nTranslate into ${input.target}. Reply with the translation only.` : prompt }],
        max_tokens: input.maxTokens ?? 1024,
      }),
      signal: ctx.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderError(`Groq ${res.status}: ${detail.slice(0, 160).replace(/\s+/g, " ")}`, res.status);
    }
    const json = await readJson(res);
    const text = asString(dig(json, "choices", 0, "message", "content"));
    if (!text) throw new ProviderError("Groq returned no text");
    return { text, meta: { provider: "groq", model: dig(json, "model") ?? "llama-3.3-70b-versatile", usage: dig(json, "usage") ?? undefined } };
  },
};

const groqWhisper: Provider = {
  id: "groq-whisper",
  kind: "remote",
  cost: "whisper-large-v3 on Groq — free tier",
  capabilities: ["stt"],
  timeoutMs: 120_000,
  available: () =>
    (process.env.GROQ_API_KEY ?? "").trim()
      ? { ok: true }
      : { ok: false, reason: "GROQ_API_KEY is not set (the free tier also serves Whisper)" },
  async run(input, ctx) {
    const key = (process.env.GROQ_API_KEY ?? "").trim();
    if (!key) throw new ProviderError("GROQ_API_KEY is not set");
    if (!input.bytes) throw new ProviderError("speech-to-text needs the audio bytes");
    const form = new FormData();
    form.append("file", new Blob([input.bytes as unknown as BlobPart], { type: input.mime ?? "audio/mpeg" }), "audio");
    form.append("model", "whisper-large-v3");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: ctx.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderError(`Groq transcription ${res.status}: ${detail.slice(0, 160).replace(/\s+/g, " ")}`, res.status);
    }
    const json = await readJson(res);
    const text = asString(json.text);
    if (!text) throw new ProviderError("Groq returned no transcript");
    return { text, meta: { provider: "groq-whisper", model: "whisper-large-v3" } };
  },
};

/* ------------------------------------------------------------- the registry */

export const PROVIDERS: Provider[] = [
  workersAi({ id: "workers-ai-text", model: "@cf/qwen/qwen3-30b-a3b-fp8", shape: "chat", cost: "$0.051 in / $0.34 out per M tokens", capabilities: ["text"] }),
  workersAi({ id: "workers-ai-bulk", model: "@cf/ibm-granite/granite-4.0-h-micro", shape: "chat", cost: "$0.017 in / $0.112 out per M tokens", capabilities: ["text-cheap"] }),
  // Measured 2026-09-17 with a real token: this model answers 403
  // "Model Agreement: Prior to using this model, you must submit the prompt 'agree'", i.e. a
  // one-time click in the Cloudflare dashboard, not a code problem. The alternative in the
  // chain table, @cf/moondream/moondream3.1-9B-A2B, is not JSON-callable from a route: every
  // JSON shape (byte array, nested array, data URL, plain base64) answers 400 "Type mismatch of
  // '/image': 'string' not in 'array','binary'" and multipart is refused as "Request body is not
  // valid json". So the vision chain is honest about needing a key *and* that one click.
  workersAi({ id: "workers-ai-vision", model: "@cf/meta/llama-3.2-11b-vision-instruct", shape: "chat", cost: "rate card per image", capabilities: ["vision"] }),
  workersAi({ id: "workers-ai-translate", model: "@cf/ai4bharat/indictrans2-en-indic-1B", shape: "translation", cost: "$0.34 per M tokens", capabilities: ["translate"] }),
  workersAi({ id: "workers-ai-m2m100", model: "@cf/meta/m2m100-1.2b", shape: "translation", cost: "rate card per M tokens", capabilities: ["translate"] }),
  workersAi({ id: "workers-ai-whisper", model: "@cf/openai/whisper", shape: "transcript", cost: "$0.00045 per audio minute", capabilities: ["stt"], timeoutMs: 120_000 }),
  workersAi({ id: "workers-ai-melotts", model: "@cf/myshell-ai/melotts", shape: "audio", cost: "$0.0002 per audio minute", capabilities: ["tts"], timeoutMs: 60_000 }),
  // Measured 2026-09-17: melotts answers 500 (AiError 3043, twice in a row) while aura-1 answers
  // 200 with real audio/mpeg for {text} — so the documented fallback is the one that works
  // today, and the chain falls through to it on its own (see scripts/ai-router-report.mjs §4).
  workersAi({ id: "workers-ai-aura", model: "@cf/deepgram/aura-1", shape: "audio", bodyKey: "text", cost: "rate card per 1k characters (CF-hosted Deepgram)", capabilities: ["tts"], timeoutMs: 60_000 }),
  workersAi({ id: "workers-ai-flux", model: "@cf/black-forest-labs/flux-1-schnell", shape: "image", cost: "≈$0.0005 per image (172.8 neurons ≈ ₹0.17)", capabilities: ["image"], timeoutMs: 180_000 }),
  workersAi({ id: "workers-ai-sdxl", model: "@cf/bytedance/stable-diffusion-xl-lightning", shape: "image", cost: "rate card per image", capabilities: ["image"], timeoutMs: 180_000 }),
  gemini("gemini", "gemini-2.0-flash"),
  gemini("gemini-vision", "gemini-2.0-flash"),
  groqProvider,
  groqWhisper,
  rulesProvider,
  supabaseSearch,
  tesseractProvider,
  whisperCppProvider,
  piperProvider,
];

export function providerById(id: string, providers: Provider[] = PROVIDERS): Provider | undefined {
  return providers.find((p) => p.id === id);
}

/* ---------------------------------------------------------------- the router */

export type RunOptions = {
  /** Replace the registry (tests, or a deployment with different providers). */
  providers?: Provider[];
  /** Replace a capability's chain, or add one that is not in the table. */
  chains?: Partial<Record<Capability, string[]>>;
  /** Forces one ceiling on every provider; without it each provider's own is used. */
  timeoutMs?: number;
  /** Set false to skip health checks (they cost one small request each). */
  checkHealth?: boolean;
  /** Extra tries for a *remote* provider on a 5xx/429. Default 1 (item 29's lesson). */
  retries?: number;
};

/**
 * Walk a capability's chain and return the first provider that answers.
 *
 * Never throws for "nothing could serve this" — that is `ok: false` with every reason in
 * `record.attempts`, so the caller can put the reason in front of a user. It does rethrow
 * nothing else either: a provider's failure is recorded and the chain moves on, and a
 * provider that outlives its timeout is aborted and recorded as `timeout`.
 */
export async function runChain(capability: Capability, input: AiInput, options: RunOptions = {}): Promise<ChainOutcome> {
  const registry = options.providers ?? PROVIDERS;
  const chain = options.chains?.[capability] ?? CHAINS[capability] ?? [];
  const retries = options.retries ?? 1;
  const started = Date.now();
  const attempts: Attempt[] = [];

  for (const id of chain) {
    const provider = registry.find((p) => p.id === id);
    const at = Date.now();
    if (!provider) {
      attempts.push({ provider: id, outcome: "skipped", ms: 0, detail: "not in this registry" });
      continue;
    }

    const availability = provider.available(capability);
    if (!availability.ok) {
      attempts.push({ provider: id, outcome: "skipped", ms: Date.now() - at, detail: availability.reason });
      continue;
    }

    if (options.checkHealth !== false && provider.health) {
      try {
        const health = await provider.health(capability);
        if (!health.ok) {
          attempts.push({ provider: id, outcome: "unhealthy", ms: Date.now() - at, detail: health.detail ?? "health check failed" });
          continue;
        }
      } catch (error) {
        attempts.push({ provider: id, outcome: "unhealthy", ms: Date.now() - at, detail: error instanceof Error ? error.message : String(error) });
        continue;
      }
    }

    const ceiling = options.timeoutMs ?? provider.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxTries = 1 + Math.max(0, provider.kind === "remote" ? retries : 0);
    const providerStart = Date.now();
    let tries = 0;
    let outcome: "error" | "timeout" = "error";
    let detail = "";
    while (tries < maxTries) {
      tries += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ceiling);
      try {
        const answer = await provider.run(input, { capability, signal: controller.signal });
        clearTimeout(timer);
        attempts.push({ provider: id, outcome: "ok", ms: Date.now() - providerStart, tries });
        return {
          ok: true,
          answer,
          record: {
            capability,
            provider: id,
            ok: true,
            ms: Date.now() - started,
            cost: provider.cost,
            attempts,
          },
        };
      } catch (error) {
        clearTimeout(timer);
        const timedOut = controller.signal.aborted;
        const status = error instanceof ProviderError ? error.status : undefined;
        outcome = timedOut ? "timeout" : "error";
        detail = timedOut ? `no answer in ${ceiling} ms` : error instanceof Error ? error.message : String(error);
        const retryable =
          provider.kind === "remote" && tries < maxTries && (timedOut || (status !== undefined && (status >= 500 || status === 429)));
        if (retryable) continue;
        break;
      }
    }
    attempts.push({
      provider: id,
      outcome,
      ms: Date.now() - providerStart,
      tries,
      detail: tries > 1 ? `${detail} (the first try was retried once)` : detail,
    });
  }

  const reasons = attempts
    .map((a) => `${a.provider} (${a.outcome}${a.detail ? `: ${a.detail}` : ""})`)
    .join("; ");
  return {
    ok: false,
    answer: null,
    record: {
      capability,
      provider: null,
      ok: false,
      ms: Date.now() - started,
      cost: null,
      attempts,
      detail: `no provider in the ${capability} chain could serve this — ${reasons || "the chain is empty"}`,
    },
  };
}

/**
 * The part that belongs in a job's `meta`: which provider answered, what was tried, how long
 * it took, and what it cost. Callers merge this into the meta they already return.
 */
export function metaFor(record: ChainRecord): Record<string, unknown> {
  return {
    ai_capability: record.capability,
    ai_provider: record.provider ?? "none",
    ai_ok: record.ok,
    ai_ms: record.ms,
    ai_cost: record.cost,
    ai_tries: record.attempts.map((a) => `${a.provider}:${a.outcome}${a.tries && a.tries > 1 ? `x${a.tries}` : ""}`),
    ...(record.detail ? { ai_detail: record.detail } : {}),
  };
}

/** One row per provider per capability — the live report `scripts/ai-router-report.mjs` prints. */
export function providerTable(providers: Provider[] = PROVIDERS): Array<{
  capability: Capability;
  order: number;
  provider: string;
  kind: "remote" | "local";
  available: boolean;
  reason?: string;
  timeoutMs: number;
}> {
  const rows: ReturnType<typeof providerTable> = [];
  for (const [capability, chain] of Object.entries(CHAINS) as Array<[Capability, string[]]>) {
    chain.forEach((id, index) => {
      const provider = providers.find((p) => p.id === id);
      if (!provider) {
        rows.push({ capability, order: index + 1, provider: id, kind: "remote", available: false, reason: "not in the registry", timeoutMs: DEFAULT_TIMEOUT_MS });
        return;
      }
      const availability = provider.available(capability);
      rows.push({
        capability,
        order: index + 1,
        provider: id,
        kind: provider.kind,
        available: availability.ok,
        reason: availability.ok ? undefined : availability.reason,
        timeoutMs: provider.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });
    });
  }
  return rows;
}
