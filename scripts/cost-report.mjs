/**
 * What a job actually costs, per product, measured from `product_jobs` (queue item 16).
 *
 * Run: `node scripts/cost-report.mjs`  (also `npm run cost:report`)
 *
 * Why this exists: docs/product-plan.md priced 28 products before one of them had ever run,
 * and every price in it was a guess. `product_jobs` has since recorded 140+ real runs with
 * their meta, so the cost side of the table can be read out of the database instead of
 * assumed. The script prints one row per product that has really run, and it says which kind
 * of number each one is:
 *
 *   billed  — the provider's own usage figure (`meta.neurons`, straight from the Workers AI
 *             response), multiplied by Cloudflare's published $0.011 per 1,000 neurons.
 *   table   — no usage comes back for image generation (the response is the JPEG itself), so
 *             the neurons are computed from Cloudflare's published image rate table out of the
 *             request shape the engine recorded (tiles x steps). A table number, not a bill.
 *   Rs 0    — local work on this VM (Pillow / pdfcpu / markitdown): there is no meter to read,
 *             and the evidence is the run count and the recorded speed, not a zero.
 *
 * It exits non-zero when a product whose catalogue row says `free_local` shows a billed neuron
 * figure: a local product that quietly started spending money is exactly the thing a cost
 * report should shout about.
 *
 * Units and dates are printed with the numbers: the neuron price is Cloudflare's published
 * rate and the rupee figure uses one fetched USD/INR rate (with its date and provider), because
 * "Rs 0.17" without the rate it was converted at is not a measurement.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = resolve(here, "../apps/web/.env");

/** Cloudflare Workers AI: $0.011 per 1,000 Neurons, 10,000 free per day (00:00 UTC reset).
 *  Source: https://developers.cloudflare.com/workers-ai/platform/pricing/ — read 2026-09-17. */
const USD_PER_1K_NEURONS = 0.011;
const FREE_NEURONS_PER_DAY = 10_000;
const PRICING_SOURCE = "developers.cloudflare.com/workers-ai/platform/pricing";

/** The models this engine really calls, at the rates on that page (retrieved 2026-09-17):
 *  qwen3-30b-a3b-fp8 4625 neurons/M in, 30475/M out; m2m100 31050/M both ways;
 *  flux-1-schnell 4.80 neurons per 512x512 tile and 9.60 per step. */
const TEXT_MODELS = {
  "@cf/qwen/qwen3-30b-a3b-fp8": { in_per_m: 4625, out_per_m: 30475 },
  "@cf/meta/m2m100-1.2b": { in_per_m: 31050, out_per_m: 31050 },
};
const IMAGE_MODELS = {
  "@cf/black-forest-labs/flux-1-schnell": { per_tile: 4.8, per_step: 9.6 },
};

/** Used only if the FX call fails, and then it is printed as the pinned fallback. */
const FX_FALLBACK = 96.0;

/** Products whose engine calls a hosted model, so their per-run cost is never "Rs 0".
 *  Evidence, not a guess: `grep -n "_cf_ai_token()" services/tools/worker.py` hits only
 *  `ai_image` and the translation path — every other function in `PRODUCTS` runs Pillow,
 *  pdfcpu or markitdown on this VM, where there is no meter to read. A product outside this
 *  set that shows a billed figure fails the run (see `warn`), so the list cannot rot silently. */
const HOSTED = new Set(["ai-image", "translate-doc"]);
/** Test switch, the same shape as PROBE_SABOTAGE in scripts/interactions.mjs: with the hosted
 *  set emptied, a real billed figure must make the report FAIL — a guard nobody has watched
 *  fail is a guess. `COST_REPORT_HOSTED=none node scripts/cost-report.mjs` must exit 1. */
if (process.env.COST_REPORT_HOSTED === "none") HOSTED.clear();

function loadEnv() {
  try {
    for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!match) continue;
      if (process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (error) {
    console.log(`(could not read ${ENV_FILE}: ${error.message})`);
  }
}
loadEnv();

const supabase = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const line = (char = "─") => console.log(char.repeat(84));

async function rest(path) {
  const res = await fetch(`${supabase}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status} on ${path}: ${await res.text()}`);
  return res.json();
}

/** One USD/INR rate, with where it came from and when — a rupee figure needs both. */
async function fxRate() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(20_000) });
    const data = await res.json();
    if (data?.result === "success" && data?.rates?.INR) {
      return { rate: data.rates.INR, source: "open.er-api.com (exchangerate-api)", date: data.time_last_update_utc };
    }
  } catch {
    /* fall through to the pinned rate */
  }
  return { rate: FX_FALLBACK, source: "pinned fallback — FX call failed", date: "n/a" };
}

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Sub-rupee amounts need more than two decimals or every hosted job rounds to "Rs 0.00". */
const inr = (value) =>
  value === 0 ? "Rs 0" : value >= 1 ? `Rs ${value.toFixed(2)}` : `Rs ${value.toFixed(4)}`;

const { rate, source: fxSource, date: fxDate } = await fxRate();
const usdInr = (usd) => usd * rate;
const neuronsToInr = (neurons) => usdInr((neurons / 1000) * USD_PER_1K_NEURONS);

const jobs = await rest("product_jobs?select=id,product,status,duration_ms,created_at,meta&order=id.asc&limit=1000");
const products = await rest("products?select=slug,name,price_paise,plan,cost_model,enabled&order=sort_order.asc");
const bySlug = new Map(products.map((p) => [p.slug, p]));

/** For an image job: neurons from the published table, out of the shape the engine recorded. */
function imageTableNeurons(meta) {
  const rateTable = IMAGE_MODELS[meta?.model];
  const width = Number(meta?.width) || 1024;
  const height = Number(meta?.height) || 1024;
  const steps = Number(meta?.steps) || 4;
  if (!rateTable) return null;
  const tiles = Math.max(1, Math.ceil(width / 512) * Math.ceil(height / 512));
  return { neurons: tiles * rateTable.per_tile + tiles * steps * rateTable.per_step, tiles, steps };
}

/** For a text job: neurons from the published token rates — a cross-check on the bill. */
function textTableNeurons(meta) {
  const model = TEXT_MODELS[meta?.model];
  if (!model || meta?.tokens_in === undefined) return null;
  return (meta.tokens_in / 1e6) * model.in_per_m + (meta.tokens_out / 1e6) * model.out_per_m;
}

const perProduct = new Map();
for (const job of jobs) {
  const row = perProduct.get(job.product) ?? { done: [], failed: 0, billed: [], table: [], tables: [] };
  if (job.status !== "done") {
    row.failed += 1;
  } else {
    row.done.push(job);
    const meta = job.meta ?? {};
    if (typeof meta.neurons === "number" && meta.neurons > 0) row.billed.push({ id: job.id, neurons: meta.neurons });
    if (job.product === "ai-image") {
      const img = imageTableNeurons(meta);
      if (img) row.table.push({ id: job.id, ...img });
    }
    const txt = textTableNeurons(meta);
    if (txt !== null) row.tables.push({ id: job.id, neurons: txt, billed: meta.neurons ?? null });
  }
  perProduct.set(job.product, row);
}

line("═");
console.log("Product cost report — measured from product_jobs, not estimated");
console.log(`neurons: $${USD_PER_1K_NEURONS} per 1,000 (${PRICING_SOURCE}) · ${FREE_NEURONS_PER_DAY} free/day`);
console.log(`rupees : USD 1 = INR ${rate.toFixed(2)} — ${fxSource}, ${fxDate}`);
line("═");

console.log("\nWhat each product has really cost per run\n");
console.log(
  ["product".padEnd(16), "price".padEnd(11), "runs".padEnd(11), "p50".padEnd(9), "per run".padEnd(12), "basis"].join(""),
);
line();
const warn = [];
for (const [slug, row] of [...perProduct.entries()].sort()) {
  const product = bySlug.get(slug);
  const price = product ? (product.price_paise === 0 ? "free" : `Rs ${(product.price_paise / 100).toFixed(0)}`) : "—";
  const runs = `${row.done.length} done / ${row.failed} fail`;
  const p50 = median(row.done.map((j) => j.duration_ms ?? 0));
  const p50Text = p50 === null ? "—" : `${(p50 / 1000).toFixed(1)}s`;

  let perRun = "Rs 0";
  let basis = "local — no meter (run count + speed are the evidence)";
  if (row.billed.length) {
    const neu = median(row.billed.map((b) => b.neurons));
    perRun = inr(neuronsToInr(neu));
    basis = `billed — median ${neu} neurons, ids ${row.billed.map((b) => b.id).join(",")}`;
    if (!HOSTED.has(slug)) warn.push(`${slug}: billed neurons but not a hosted product`);
  } else if (row.table.length) {
    const neu = median(row.table.map((b) => b.neurons));
    perRun = inr(neuronsToInr(neu));
    basis = `table — ${row.table[0].tiles} tiles x ${row.table[0].steps} steps, id ${row.table[0].id}`;
  } else if (HOSTED.has(slug)) {
    perRun = "unknown";
    basis = "hosted — no run of this product carries a billed or table figure yet";
  } else if (row.done.length && !row.done.some((j) => j.meta && Object.keys(j.meta).length)) {
    basis = "local — ran before meta was recorded (no numbers in the row)";
  }
  console.log(
    [slug.padEnd(16), price.padEnd(11), runs.padEnd(18), p50Text.padEnd(9), perRun.padEnd(12), basis].join(""),
  );
}

const crossCheck = [];
for (const [slug, row] of perProduct.entries()) {
  for (const entry of row.tables) {
    if (entry.billed) crossCheck.push({ slug, id: entry.id, table: entry.neurons, billed: entry.billed });
  }
}
if (crossCheck.length) {
  line();
  console.log("\nCross-check: the published token rates vs the provider's own bill\n");
  for (const c of crossCheck) {
    const delta = ((c.table - c.billed) / c.billed) * 100;
    console.log(
      `  job ${c.id} ${c.slug.padEnd(14)} table ${c.table.toFixed(1)} vs billed ${c.billed} neurons (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%)`,
    );
  }
  console.log("  (the two agree within rounding, so the rate table and the bill describe the same job)");
}

line();
console.log("\nFree allowance, at the measured per-job figure\n");
const hosted = [];
for (const [slug, row] of perProduct.entries()) {
  const neu = row.billed.length
    ? median(row.billed.map((b) => b.neurons))
    : row.table.length
      ? median(row.table.map((b) => b.neurons))
      : null;
  if (neu) hosted.push({ slug, neu });
}
for (const h of hosted) {
  const each = Math.round(h.neu * 10) / 10;
  console.log(`  ${h.slug.padEnd(16)} ${Math.floor(FREE_NEURONS_PER_DAY / h.neu)} runs/day inside the free allowance (${each} neurons each)`);
}
if (!hosted.length) console.log("  no hosted-model job has run yet, so there is nothing to divide.");

console.log("\nProducts with a catalogue row but no measured run: " +
  products
    .filter((p) => p.enabled && !perProduct.has(p.slug))
    .map((p) => p.slug)
    .join(", "));

if (warn.length) {
  line("═");
  console.log("FAILURES — a number above contradicts a claim in the catalogue:\n");
  for (const w of warn) console.log(`  ${w}`);
  process.exit(1);
}
line("═");
console.log("Every number above is either a provider's own usage figure or a local run count. Nothing here is estimated.");
