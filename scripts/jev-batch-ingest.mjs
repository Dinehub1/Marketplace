#!/usr/bin/env node
/**
 * scripts/jev-batch-ingest.mjs
 * 
 * 1-Minute Batch Ingestion & Jev Decision Engine Enrichment Runner.
 * 
 * Functions:
 *  1. Ingests fresh local business listings from CSV/web sources, OR pulls
 *     un-enriched existing businesses directly from Supabase.
 *  2. Runs OpenRouter's TypeSafe Jev System One decision model (typesafe/jev-1.13)
 *     for instantaneous deterministic categorization, quality scoring (1-5),
 *     and legitimacy verification.
 *  3. Directly writes or enriches records in Supabase `businesses` table.
 *  4. Bounded by a 1-minute (default 60s) timer or configurable batch limit.
 * 
 * Usage:
 *   node scripts/jev-batch-ingest.mjs [--duration 60] [--concurrency 3] [--mode auto|new|enrich] [--source <path>] [--dry-run]
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..");

// ── 1. Load Environment Variables ───────────────────────────────────────────
function loadEnvFile(relPath) {
  const fullPath = resolve(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  try {
    const raw = readFileSync(fullPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (err) {
    console.warn(`[Env] Failed to load ${relPath}: ${err.message}`);
  }
}

loadEnvFile(".env");
loadEnvFile("apps/web/.env");

// ── 2. Parse CLI Arguments ──────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag, defaultVal) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}
const DRY_RUN = args.includes("--dry-run");
const DURATION_SEC = parseInt(getArg("--duration", "60"), 10);
const CONCURRENCY = parseInt(getArg("--concurrency", "3"), 10);
const MODE = getArg("--mode", "auto"); // "auto", "new", "enrich"
const CITY = getArg("--city", "Indore");
const SOURCE_PATH = getArg("--source", "combined_indore_master.csv");

// ── 3. Configuration & Auth ────────────────────────────────────────────────
const OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ||
  process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

const JEV_MODEL = process.env.EXPO_PUBLIC_JEV_MODEL || "typesafe/jev-1.13";
const JEV_URL =
  process.env.EXPO_PUBLIC_JEV_DECISIONS_URL ||
  "https://openrouter.ai/api/alpha/decisions";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!OPENROUTER_KEY) {
  console.error("❌ Missing OpenRouter API key. Set OPENROUTER_API_KEY in .env");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase URL or Key in .env");
  process.exit(1);
}

const AUTH_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ── 4. CSV & Normalization Helpers ──────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function extractPlaceId(url, explicitPlaceId) {
  if (explicitPlaceId && explicitPlaceId.trim()) return explicitPlaceId.trim();
  if (!url) return null;
  const match = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  return match ? match[1] : null;
}

function sanitizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits || null;
}

// ── 5. Jev Decision Caller ─────────────────────────────────────────────────
async function callJevEnrichment(candidate) {
  const t0 = Date.now();
  const state = {
    business_name: candidate.name,
    raw_category: candidate.raw_category || candidate.category || "",
    address: candidate.address || "",
    phone: candidate.phone || "unlisted",
    reviews_count: candidate.reviews_count || 0,
    rating: candidate.rating || null,
    has_website: !!candidate.website,
  };

  const questions = {
    canonical_category: {
      type: "choice",
      instructions: "Determine the best marketplace category for this business",
      criteria: {
        food_dining: "Cafes, restaurants, bakeries, sweet shops, cloud kitchens, fast food",
        home_services: "Plumbers, electricians, painters, carpenters, cleaning, AC repair",
        healthcare: "Doctors, dental clinics, hospitals, pharmacies, diagnostic labs",
        fitness_wellness: "Gyms, salons, spas, fitness clubs, beauty parlors",
        retail_shopping: "Furniture, electronics, clothing, grocery, jewelry, home decor",
        professional_services: "Lawyers, chartered accountants, digital marketing, real estate agents",
        education: "Schools, colleges, coaching institutes, training centers",
        hospitality: "Hotels, resorts, guest houses, lodges",
        automotive: "Car dealers, mechanics, auto repair, tire shops"
      },
    },
    quality_score: {
      type: "score",
      instructions: "Score the quality and reliability of this listing from 1 to 5",
      criteria: [
        "Level 1: Minimal info, incomplete or ambiguous listing",
        "Level 2: Basic name with partial address or contact",
        "Level 3: Good business listing with verifiable address and contact",
        "Level 4: High quality listing with phone, customer ratings, and precise area",
        "Level 5: Exceptional listing with full contact, verified location, photos, and high review count"
      ],
    },
    legitimacy: {
      type: "noul",
      instructions: "Is this a real, operating commercial establishment in Indore?",
      criteria: {
        true: "Legitimate active commercial business establishment",
        false: "Duplicate, test entry, closed, or spam"
      },
    },
  };

  try {
    const res = await fetch(JEV_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: JEV_MODEL,
        state,
        questions,
      }),
    });

    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Jev API HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const answers = json.answers || json.decisions || {};

    const categoryChoice = answers.canonical_category?.choice || candidate.raw_category?.toLowerCase() || "other";
    const qualityScore = typeof answers.quality_score?.score === "number" ? answers.quality_score.score : 3.0;
    const isLegitimate = answers.legitimacy?.noul !== undefined ? answers.legitimacy.noul >= 0.45 : true;

    return {
      success: true,
      category: categoryChoice,
      qualityScore,
      isLegitimate,
      elapsed,
      cost: json.usage?.cost || 0.00002,
      rawDecisions: answers,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      elapsed: Date.now() - t0,
    };
  }
}

// ── 6. Candidate Loading (From CSV or Supabase Un-enriched) ─────────────────
function loadCandidatePool(sourcePath) {
  const fullPath = resolve(ROOT, sourcePath);
  if (!existsSync(fullPath)) return [];
  const candidates = [];
  const files = [];

  if (statSync(fullPath).isDirectory()) {
    for (const f of readdirSync(fullPath)) {
      if (f.endsWith(".csv")) files.push(join(fullPath, f));
    }
  } else if (fullPath.endsWith(".csv")) {
    files.push(fullPath);
  }

  for (const f of files) {
    try {
      const content = readFileSync(f, "utf8");
      const [header, ...rows] = parseCSV(content);
      if (!header || !rows.length) continue;

      const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
      for (const r of rows) {
        const name = (r[col["name"]] || "").trim();
        if (!name) continue;

        const url = r[col["google_maps_url"]] || r[col["url"]] || "";
        const explicitPid = r[col["place_id"]] || "";
        const placeId = extractPlaceId(url, explicitPid);
        const address = (r[col["address"]] || "").trim();
        const phone = sanitizePhone(r[col["phone_number"]] || r[col["phone"]] || "");
        const rawCategory = (r[col["category"]] || "").trim();
        const reviewsCount = parseInt(r[col["reviews_count"]] || "0", 10) || 0;
        const rating = parseFloat(r[col["reviews_average"]] || r[col["rating"]] || "0") || null;
        const lat = parseFloat(r[col["latitude"]] || r[col["lat"]] || "") || null;
        const lng = parseFloat(r[col["longitude"]] || r[col["lng"]] || "") || null;
        const website = (r[col["website"]] || "").trim() || null;
        const imageUrl = (r[col["image_url"]] || "").trim() || null;

        candidates.push({
          name,
          phone,
          address,
          raw_category: rawCategory,
          place_id: placeId,
          google_maps: url || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + (address || "Indore"))}`),
          reviews_count: reviewsCount,
          rating,
          lat,
          lng,
          website,
          image_url: imageUrl,
          source_file: basename(f),
        });
      }
    } catch (e) {
      console.warn(`[Ingest] Error reading ${f}: ${e.message}`);
    }
  }

  return candidates;
}

async function fetchUnenrichedFromSupabase(limit = 200) {
  console.log(`📡 Fetching up to ${limit} un-enriched businesses from Supabase (source!=jev-enriched-scraper)...`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/businesses?select=id,name,phone,address,category,place_id,rating,reviews_count,website,image_url,lat,lng,raw&source=neq.jev-enriched-scraper&limit=${limit}`,
    { headers: AUTH_HEADERS }
  );
  if (!res.ok) {
    console.error(`Failed to fetch from Supabase: ${res.status}`);
    return [];
  }
  const rows = await res.json();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
    raw_category: r.category,
    place_id: r.place_id,
    rating: r.rating,
    reviews_count: r.reviews_count,
    website: r.website,
    image_url: r.image_url,
    lat: r.lat,
    lng: r.lng,
    raw: r.raw || {},
    is_existing_row: true,
  }));
}

// ── 7. Pre-check Existing in Supabase ──────────────────────────────────────
async function loadExistingIdentifiers() {
  console.log(`📡 Indexing existing Supabase listings...`);
  const existingSet = new Set();
  let offset = 0;
  while (true) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?select=name,phone,place_id&limit=1000&offset=${offset}`,
        { headers: AUTH_HEADERS }
      );
      if (!res.ok) break;
      const rows = await res.json();
      if (!rows || rows.length === 0) break;
      for (const r of rows) {
        if (r.place_id) existingSet.add(`pid:${r.place_id}`);
        const p = sanitizePhone(r.phone);
        if (p) existingSet.add(`ph:${p}`);
        if (r.name) existingSet.add(`nm:${r.name.trim().toLowerCase()}`);
      }
      offset += rows.length;
      if (rows.length < 1000) break;
    } catch {
      break;
    }
  }
  console.log(`   Indexed ${existingSet.size} unique keys in Supabase`);
  return existingSet;
}

// ── 8. Batch Database Operations ───────────────────────────────────────────
async function insertBatchToSupabase(batch) {
  if (DRY_RUN) return batch.length;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
      method: "POST",
      headers: {
        ...AUTH_HEADERS,
        Prefer: "return=representation",
      },
      body: JSON.stringify(batch),
    });

    if (res.status === 201 || res.status === 200) {
      const inserted = await res.json();
      return Array.isArray(inserted) ? inserted.length : batch.length;
    } else if (res.status === 409) {
      return batch.length;
    } else {
      const errText = await res.text();
      console.error(`[Supabase] Insert error ${res.status}: ${errText.slice(0, 160)}`);
      return 0;
    }
  } catch (err) {
    console.error(`[Supabase] Network error: ${err.message}`);
    return 0;
  }
}

async function updateRowInSupabase(id, patch) {
  if (DRY_RUN) return true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${id}`, {
      method: "PATCH",
      headers: AUTH_HEADERS,
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── 9. Main 1-Minute Runner Execution Loop ─────────────────────────────────
async function run() {
  const startTime = Date.now();
  const maxEndTime = startTime + DURATION_SEC * 1000;

  console.log(`========================================================================`);
  console.log(`⚡ 1-MINUTE JEV BATCH INGESTION RUNNER`);
  console.log(`   Duration limit:   ${DURATION_SEC}s`);
  console.log(`   Worker threads:   ${CONCURRENCY} parallel`);
  console.log(`   Jev Engine:       ${JEV_MODEL} on OpenRouter`);
  console.log(`   Target Supabase:  ${SUPABASE_URL}`);
  console.log(`   Mode:             ${MODE.toUpperCase()} | ${DRY_RUN ? "🔍 DRY-RUN" : "🚀 LIVE WRITE"}`);
  console.log(`========================================================================\n`);

  let queue = [];

  if (MODE === "enrich") {
    queue = await fetchUnenrichedFromSupabase(150);
  } else {
    // Check candidate pool
    const candidates = loadCandidatePool(SOURCE_PATH);
    console.log(`📦 Loaded ${candidates.length} candidate rows from "${SOURCE_PATH}"`);

    const existingKeys = await loadExistingIdentifiers();
    const queuedKeys = new Set();

    for (const c of candidates) {
      if (c.place_id && existingKeys.has(`pid:${c.place_id}`)) continue;
      if (c.phone && existingKeys.has(`ph:${c.phone}`)) continue;
      const nameKey = `nm:${c.name.toLowerCase()}`;
      if (existingKeys.has(nameKey) || queuedKeys.has(nameKey)) continue;

      queuedKeys.add(nameKey);
      queue.push(c);
    }

    if (queue.length === 0 && (MODE === "auto" || MODE === "enrich")) {
      console.log(`ℹ️  No fresh un-imported CSV listings found. Switching to enriching existing Supabase records...`);
      queue = await fetchUnenrichedFromSupabase(150);
    }
  }

  console.log(`✨ Ingestion Queue ready: ${queue.length} target businesses for Jev enrichment.\n`);

  let processedCount = 0;
  let successfulEnriched = 0;
  let totalCost = 0;
  let totalJevLatency = 0;
  const pendingInsert = [];
  let totalSaved = 0;

  // Worker loop
  let queueIdx = 0;
  async function worker(workerId) {
    while (Date.now() < maxEndTime && queueIdx < queue.length) {
      const idx = queueIdx++;
      const item = queue[idx];
      if (!item) break;

      const timeLeftSec = Math.max(0, Math.round((maxEndTime - Date.now()) / 1000));
      process.stdout.write(`⏳ [${String(timeLeftSec).padStart(2, "0")}s] W${workerId} -> "${item.name.slice(0, 30)}"... `);

      const decision = await callJevEnrichment(item);
      processedCount++;

      if (decision.success) {
        successfulEnriched++;
        totalCost += decision.cost;
        totalJevLatency += decision.elapsed;

        const priority = decision.qualityScore >= 4.0 ? 2 : decision.qualityScore >= 2.8 ? 1 : 0;
        const verified = decision.isLegitimate && decision.qualityScore >= 2.5;

        console.log(`✅ [${decision.elapsed}ms] Category: ${decision.category} | Score: ${decision.qualityScore.toFixed(1)}/5 | Verified: ${verified}`);

        if (item.is_existing_row) {
          // Update existing row
          const patch = {
            category: decision.category,
            verified,
            priority,
            source: "jev-enriched-scraper",
            raw: {
              ...(item.raw || {}),
              jev_model: JEV_MODEL,
              jev_quality: decision.qualityScore,
              jev_category: decision.category,
              enriched_at: new Date().toISOString(),
            },
          };
          const ok = await updateRowInSupabase(item.id, patch);
          if (ok) totalSaved++;
        } else {
          // Insert new row
          const businessRecord = {
            name: item.name,
            category: decision.category,
            phone: item.phone,
            address: item.address,
            city: CITY,
            place_id: item.place_id,
            google_maps: item.google_maps,
            rating: item.rating,
            reviews_count: item.reviews_count,
            website: item.website,
            image_url: item.image_url,
            lat: item.lat,
            lng: item.lng,
            verified: verified,
            priority: priority,
            source: "jev-enriched-scraper",
            status: "active",
            raw: {
              jev_model: JEV_MODEL,
              jev_quality: decision.qualityScore,
              jev_category: decision.category,
              source_file: item.source_file,
              enriched_at: new Date().toISOString(),
            },
          };

          pendingInsert.push(businessRecord);
          if (pendingInsert.length >= 10 && !DRY_RUN) {
            const toSend = pendingInsert.splice(0, pendingInsert.length);
            const ins = await insertBatchToSupabase(toSend);
            totalSaved += ins;
          }
        }
      } else {
        console.log(`❌ Failed: ${decision.error}`);
      }
    }
  }

  // Launch workers concurrently
  const workers = [];
  for (let w = 1; w <= CONCURRENCY; w++) {
    workers.push(worker(w));
  }
  await Promise.all(workers);

  // Flush remaining
  if (pendingInsert.length > 0 && !DRY_RUN) {
    const ins = await insertBatchToSupabase(pendingInsert);
    totalSaved += ins;
  }

  const elapsedTotal = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgLatency = successfulEnriched ? (totalJevLatency / successfulEnriched).toFixed(0) : 0;

  console.log(`\n========================================================================`);
  console.log(`🏁 1-MINUTE RUNNER COMPLETED`);
  console.log(`   Elapsed Time:         ${elapsedTotal}s / ${DURATION_SEC}s limit`);
  console.log(`   Total Processed:      ${processedCount}`);
  console.log(`   Enriched with Jev:    ${successfulEnriched}`);
  console.log(`   Saved in Supabase:    ${DRY_RUN ? "0 (Dry Run)" : totalSaved}`);
  console.log(`   Avg Jev Latency:      ${avgLatency}ms`);
  console.log(`   Total OpenRouter Cost: $${totalCost.toFixed(5)}`);
  console.log(`========================================================================\n`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
