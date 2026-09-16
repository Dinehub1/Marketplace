/**
 * The router's live report (queue item 17): what can actually answer on this box, right now,
 * with the keys that exist today — and what the record that goes into a job's `meta` says.
 *
 * Run: `node scripts/ai-router-report.mjs`
 *
 * Why a second script when there is a test file: the test pins the *rules* of the router with
 * fakes, so it can run anywhere and proves fall-through. This one touches the real Supabase
 * and the real chain, so the claims in docs/resources-and-apis.md §3 ("every capability has a
 * path that costs ₹0", "no provider is a single point of failure") are measured rather than
 * believed. It exits non-zero if a capability we claim is ₹0 cannot answer.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CHAINS, KEY_ONLY, runChain, metaFor, providerTable } from "../apps/web/lib/ai.ts";

const here = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = resolve(here, "../apps/web/.env");

/** Load apps/web/.env the way Next does, without overwriting anything already exported. */
function loadEnv() {
  const names = { loaded: 0 };
  try {
    for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!match) continue;
      if (process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      names.loaded += 1;
    }
  } catch (error) {
    console.log(`(could not read ${ENV_FILE}: ${error.message})`);
  }
  return names.loaded;
}

const line = (char = "─") => console.log(char.repeat(78));
const envCount = loadEnv();

line("═");
console.log("AI provider router — live report");
console.log(`env: ${ENV_FILE} (${envCount} names available to this process)`);
line("═");

/* 1. Who can answer, in chain order, with the reason for everything that cannot. */
console.log("\n1. CHAIN TABLE — availability measured in this process\n");
let capability = null;
for (const row of providerTable()) {
  if (row.capability !== capability) {
    capability = row.capability;
    const keyOnly = KEY_ONLY.includes(capability) ? "  (needs a key — no engine on this box)" : "";
    console.log(`\n  ${capability.toUpperCase()}${keyOnly}`);
  }
  const mark = row.available ? "✓" : "·";
  console.log(`   ${mark} ${row.order}. ${row.provider.padEnd(22)} ${row.kind.padEnd(7)} ${row.available ? "ready" : row.reason}`);
}

/* 2. A real business from the directory, described by the ₹0 text path. */
line();
console.log("\n2. TEXT CHAIN — a real business row through the free path\n");

const supabase = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
async function one(path) {
  const res = await fetch(`${supabase}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status}`);
  return (await res.json())[0];
}

let failures = 0;
try {
  const business = await one(
    "businesses?select=name,category,area,phone,rating&status=eq.active&category=eq.plumber&area=not.is.null&phone=not.is.null&limit=1&order=id.asc",
  );
  console.log(`  fact source: businesses row "${business.name}" (${business.category}, ${business.area})\n`);
  const text = await runChain("text", { kind: "listing-description", facts: business });
  console.log(`  provider : ${text.record.provider}  ok=${text.record.ok}  ${text.record.ms} ms`);
  console.log(`  cost     : ${text.record.cost}`);
  for (const attempt of text.record.attempts) {
    console.log(`   · ${attempt.provider.padEnd(18)} ${attempt.outcome.padEnd(9)} ${attempt.detail ?? ""}`);
  }
  console.log(`  text     : ${text.answer?.text}`);
  console.log(`  meta     : ${JSON.stringify(metaFor(text.record))}`);
  if (!text.ok) failures += 1;
} catch (error) {
  console.log(`  FAILED to measure: ${error.message}`);
  failures += 1;
}

/* 3. The directory's own database as the search engine. */
line();
console.log("\n3. SEARCH CHAIN — our own PostgREST, no key\n");
try {
  const search = await runChain("search", { text: "plumber vijay nagar", limit: 5 });
  console.log(`  provider : ${search.record.provider}  ok=${search.record.ok}  ${search.record.ms} ms`);
  console.log(`  meta     : ${JSON.stringify(search.answer?.meta ?? metaFor(search.record))}`);
  for (const hit of search.answer?.hits ?? []) {
    console.log(`   · ${hit.score.toFixed(3)}  ${hit.name} — ${hit.category}, ${hit.area} (rating ${hit.rating ?? "n/a"})`);
  }
  if (!search.ok || !(search.answer?.hits ?? []).length) failures += 1;
} catch (error) {
  console.log(`  FAILED to measure: ${error.message}`);
  failures += 1;
}

/* 4. The hosted paths, when a token is present: the router's remote calls, made for real. */
const hosted = Boolean((process.env.CLOUDFLARE_AI_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN ?? "").trim());
line();
console.log(`\n4. HOSTED CHAINS — ${hosted ? "a Workers AI token is present in this process, calling for real" : "no token here, every remote provider will be skipped"}\n`);
for (const [capability_, input] of [
  ["text", { prompt: "In one short sentence, say what a plumber does.", maxTokens: 60 }],
  ["tts", { text: "Namaste, your bill is ready." }],
  ["translate", { text: "Your bill is ready.", target: "Hindi" }],
  ["vision", { prompt: "What is written in this image?" }],
]) {
  const outcome = await runChain(capability_, input);
  const answer = outcome.answer
    ? outcome.answer.text ?? (outcome.answer.bytes ? `${outcome.answer.bytes.length} bytes of ${outcome.answer.contentType}` : "(no payload)")
    : "";
  console.log(`  ${capability_.padEnd(10)} ok=${outcome.ok}  provider=${outcome.record.provider}  ${outcome.record.ms} ms`);
  for (const attempt of outcome.record.attempts) {
    console.log(`     · ${attempt.provider.padEnd(20)} ${attempt.outcome.padEnd(9)} ${(attempt.detail ?? "").slice(0, 150)}`);
  }
  if (answer) console.log(`     answer: ${String(answer).slice(0, 200).replace(/\s+/g, " ")}`);
}

/* 5. The capabilities with no key at all: the failure has to be a sentence, not silence. */
line();
console.log("\n5. WITH NO KEY AT ALL — the same chains, keys removed\n");
const stripped = ["CLOUDFLARE_AI_TOKEN", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_R2_ACCOUNT_ID", "GEMINI_API_KEY", "GROQ_API_KEY"];
const saved = Object.fromEntries(stripped.map((n) => [n, process.env[n]]));
for (const name of stripped) delete process.env[name];
try {
  const text = await runChain("text", { kind: "listing-description", facts: { name: "Test Traders", category: "electrician", area: "Vijay Nagar" } });
  console.log(`  text       ok=${text.ok}  provider=${text.record.provider}  -> ${text.answer?.text ?? text.record.detail}`);
  const vision = await runChain("vision", { prompt: "read this bill" });
  console.log(`  vision     ok=${vision.ok}  provider=${vision.record.provider}`);
  console.log(`     ${vision.record.detail}`);
} finally {
  for (const [name, value] of Object.entries(saved)) if (value !== undefined) process.env[name] = value;
}

line("═");
console.log(`chains: ${Object.keys(CHAINS).join(", ")}`);
console.log(failures ? `RESULT: ${failures} capability/capabilities we claim are ₹0 did not answer` : "RESULT: every ₹0 path answered");
process.exit(failures ? 1 : 0);
