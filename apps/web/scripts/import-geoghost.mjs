// Import GeoGhost / GMaps Data CSVs into the Supabase `businesses` table.
// Usage:  node scripts/import-geoghost.mjs [--dry-run] [--data-dir <path>]
// Rows already in the table (same name+phone) are skipped automatically.
// Requires SUPABASE_SERVICE_ROLE_KEY in hermes-web/.env (write key).
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dirFlag = process.argv.indexOf("--data-dir");
const DATA_DIR =
  (dirFlag !== -1 && process.argv[dirFlag + 1]) ||
  process.env.GMAPS_DATA_DIR ||
  (process.platform === "win32" ? "C:\\Users\\Administrator\\GMaps Data" : path.join(ROOT, "GMaps Data"));
const DRY = process.argv.includes("--dry-run");

function loadEnv(file) {
  try {
    const envPath = path.join(ROOT, file); // use ROOT defined earlier
    const raw = readFileSync(envPath, "utf8").replace(/\r/g, "");
    for (const line of raw.split(/\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(["']?)(.*)\2$/);
      if (m) {
        // strip surrounding quotes and whitespace
        process.env[m[1]] = m[3].trim();
      }
    }
  } catch (e) { console.error("loadEnv failed:", file, e.message); }
}

// After loading env, validate service role key
function validateKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  console.log(`KEY_LEN=${key.length} KEY_PREFIX=${key.slice(0,6)}`);
  if (!key.startsWith('eyJ') || key.length < 200) {
    console.error('Invalid SUPABASE_SERVICE_ROLE_KEY – must start with eyJ and be >200 chars');
    process.exit(1);
  }
}
loadEnv('.env');
loadEnv('.env.local');
// --dry-run only parses CSVs, so it must not require the write key.
if (!DRY) validateKey();

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// KEY is loaded from process.env after loadEnv() called above
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL_BASE) { console.error("Missing SUPABASE_URL"); process.exit(1); }
if (!KEY && !DRY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is empty. Paste it into hermes-web\\.env first:");
  console.error("https://supabase.com/dashboard/project/xpfmqpmhmcouwzebfwhb/settings/api-keys");
  process.exit(1);
}

// Minimal CSV parser handling quoted fields with commas/newlines.
function parseCsv(text) {
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

function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : null; }

// ---- address-derived fields -------------------------------------------------
// The scraper CSV has no pincode and no locality column — both are buried in
// `address` ("Rajendra Nagar, Annapurna Rd, Indore, Madhya Pradesh 452009").
// This used to read `location`, a column that does not exist, so every row got
// area='indore' and pincode=NULL; 21,077 rows needed a one-off backfill on
// 2026-09-13 to recover them. Parsing here keeps new rows correct.
const DESCRIPTOR_JUNK = /^(?:(?:ground|first|second|third|fourth|fifth|upper|lower|top)\s*floor|floor.{0,3}\d*|basement|shop\s*(?:no\.?|number)?\s*\d*|unit\s*\d*|flat\s*\d*|plot\s*(?:no\.?)?\s*\d*|block\s*[a-z0-9]*|door\s*no\.?\s*\d*|no\.?\s*\d+|near|opp|opposite|beside|behind|in\s*front|at|testcity|test|n\/?a|-)$/i;

/** 6-digit pincode from the address, preferring Indore's 45xxxx range. */
function pincodeOf(addr) {
  if (!addr) return null;
  const m = String(addr).match(/\b\d{6}\b/g) ?? [];
  if (!m.length) return null;
  const preferred = m.filter((x) => x.startsWith('45'));
  return (preferred.length ? preferred : m).pop();
}

/** First plausible locality in the address; 'indore' means "no locality found". */
function localityOf(addr) {
  if (!addr) return 'indore';
  for (const part of String(addr).split(',')) {
    const f = part.trim().replace(/^-+|-+$/g, '').trim();
    if (!f || f.length < 3 || f.length > 28) continue;
    if (/\d/.test(f)) continue;
    if (/\s+in\s+/i.test(f)) continue;
    if (DESCRIPTOR_JUNK.test(f)) continue;
    if (['indore', 'india', 'madhya pradesh', 'mp'].includes(f.toLowerCase())) continue;
    return f.toLowerCase();
  }
  return 'indore';
}
// The source writes review counts as decimals: "2396.0" means 2,396 reviews.
// Stripping every non-digit parsed that as 23960 - ten times too large - which
// is where the impossible values on the listing pages came from (a cell of
// "44408.0" became 444080). Parse a float and round. (2026-09-14)
function int(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}
function str(v) { const s = (v ?? "").trim(); return s || null; }

// ---------- FILE DISCOVERY ----------
const fileFlag = process.argv.indexOf('--file');
let files = [];
if (fileFlag !== -1 && process.argv[fileFlag + 1]) {
  // User‑provided single file path (absolute or relative to cwd)
  files.push(path.resolve(process.argv[fileFlag + 1]));
} else {
  // Default: walk DATA_DIR (or fallback to master CSV if it exists)
  for (const day of readdirSync(DATA_DIR)) {
    const dayDir = path.join(DATA_DIR, day);
    if (!statSync(dayDir).isDirectory()) continue;
    for (const f of readdirSync(dayDir)) {
      if (f.toLowerCase().endsWith('.csv')) files.push(path.join(dayDir, f));
    }
  }
  if (files.length === 0) {
    // Fallback to the combined master CSV (the canonical source of truth)
    const master = path.join(ROOT, '..', 'GMaps Data', 'combined_indore_master.csv');
    files.push(master);
  }
}
// DEBUG: list found CSVs and their row counts (excluding header)
if (!DRY) {
  console.log('SOURCE:', files);
  for (const f of files) {
    try {
      const txt = readFileSync(f, 'utf8');
      const rows = txt.split(/\r?\n/).length - 1;
      console.log(`CSV ${f} rows ${rows}`);
    } catch (e) { console.error('Failed to read CSV', f, e.message); }
  }
}

// ---------- CSV PARSING ----------
const records = [];
const seen = new Set();
for (const file of files) {
  const [header, ...rows] = parseCsv(readFileSync(file, 'utf8'));
  // A query that returned no results leaves a 2-byte, header-less CSV. Without
  // this guard header is undefined and the whole import dies on header.map,
  // so one empty file blocks every other file's rows. (2026-08-08)
  if (!header || !header.length) { console.warn('SKIP empty CSV', file); continue; }
  const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
  for (const r of rows) {
    const name = (r[col['name']] ?? '').trim();
    const phone = (r[col['phone_number']] ?? '').replace(/\D/g, '') || null;
    if (!name) continue;
    const dedupeKey = `${name.toLowerCase()}|${phone ?? ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const address = str(r[col['address']]);
    records.push({
      name,
      category: str(r[col['category']]),
      phone,
      address,
      website: str(r[col['website']]),
      area: localityOf(address),
      pincode: pincodeOf(address),
      city: 'Indore',
      rating: num(r[col['reviews_average']]),
      // Carried since 2026-08-12: a rating with no review count behind it is
      // not showable, and a listing with no photo is not scannable.
      reviews_count: int(r[col['reviews_count']]),
      image_url: str(r[col['image_url']]),
      google_maps: str(r[col['google_maps_url']]),
      lat: num(r[col['latitude']]),
      lng: num(r[col['longitude']]),
      source: 'geoghost-google-maps',
      status: 'active',
      raw: { csv_file: path.basename(file), domain: str(r[col['domain']]) },
    });
  }
}
console.log(`Parsed ${records.length} unique businesses from ${files.length} CSV(s)`);
if (DRY) {
  const has = (f) => records.filter((r) => r[f] != null).length;
  console.log('COVERAGE:', JSON.stringify({
    image_url: has('image_url'),
    reviews_count: has('reviews_count'),
    rating: has('rating'),
    phone: has('phone'),
    google_maps: has('google_maps'),
    of: records.length,
  }));
  console.log(records.slice(0, 2));
  process.exit(0);
}

// ---------- SYNC TO SUPABASE ----------
// Two jobs: insert rows we've never seen, and backfill image_url /
// reviews_count / google_maps onto rows that predate those columns. Previously
// this only did the first, so re-running enriched nothing.
const existing = new Map(); // "name|phone" -> { id, image_url, reviews_count, google_maps }
let offset = 0;
while (true) {
  const r = await fetch(
    `${URL_BASE}/rest/v1/businesses?select=id,name,phone,image_url,reviews_count,google_maps&limit=1000&offset=${offset}`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  if (!r.ok) {
    const txt = await r.text();
    if (/image_url|reviews_count/.test(txt)) {
      console.error('The image_url / reviews_count columns do not exist yet.');
      console.error('Run supabase/migrations/20260812120000_listing_media.sql first.');
      process.exit(1);
    }
    console.error(`Failed to read existing rows: ${r.status} ${txt}`);
    process.exit(1);
  }
  const rows = await r.json();
  for (const x of rows) {
    const key = `${(x.name || '').trim().toLowerCase()}|${x.phone || ''}`;
    existing.set(key, x);
  }
  if (rows.length < 1000) break;
  offset += 1000;
}
console.log('EXISTING IN DB:', existing.size);

// Delete the test row if it exists
await fetch(`${URL_BASE}/rest/v1/businesses?name=eq.ZZTEST`, {
  method: 'DELETE',
  headers: {apikey: KEY, Authorization: `Bearer ${KEY}`},
});

// Split into rows to create and rows that only need the new media fields.
const fresh = [];
const enrich = [];
for (const r of records) {
  const key = `${r.name.trim().toLowerCase()}|${r.phone || ''}`;
  const row = existing.get(key);
  if (!row) { fresh.push(r); continue; }

  // Only fill gaps — never overwrite a value already in the table, which may
  // have been corrected by hand or by an owner claiming the listing.
  //
  // Every patch carries the SAME keys, and carries the CURRENT value for the
  // fields it is not changing. Two hard requirements of the PostgREST upsert:
  //   * `name` is NOT NULL, and ON CONFLICT DO UPDATE still validates the
  //     proposed insert tuple, so a patch without it dies with 23502
  //     "null value in column name" — which is what this did before.
  //   * a batch whose objects have differing key sets is rejected outright with
  //     PGRST102 "All object keys must match", so the shapes cannot vary
  //     per row.
  // Sending the current value (never null) is also what keeps this from wiping
  // a field: a null in the payload IS written.
  const next = {
    image_url: !row.image_url && r.image_url ? r.image_url : row.image_url,
    reviews_count: row.reviews_count == null && r.reviews_count != null ? r.reviews_count : row.reviews_count,
    google_maps: !row.google_maps && r.google_maps ? r.google_maps : row.google_maps,
  };
  const changed =
    next.image_url !== row.image_url ||
    next.reviews_count !== row.reviews_count ||
    next.google_maps !== row.google_maps;
  if (changed) enrich.push({ id: row.id, name: row.name, ...next });
}
console.log('NEW TO INSERT:', fresh.length);
console.log('EXISTING TO ENRICH:', enrich.length);

const BATCH = 100;

async function send(rows, prefer, label, query = '') {
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${URL_BASE}/rest/v1/businesses${query}`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: JSON.stringify(batch),
    });
    if (res.status !== 200 && res.status !== 201) {
      console.error(`${label} batch ${i / BATCH + 1} failed: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    const back = await res.json();
    done += Array.isArray(back) ? back.length : batch.length;
    console.log(`${label} ${done}/${rows.length}`);
  }
  return done;
}

let inserted = 0;
let updated = 0;
if (fresh.length) {
  inserted = await send(fresh, 'return=representation', 'Inserted');
}
if (enrich.length) {
  // Upsert on the primary key: touches only the columns present in each row.
  // `on_conflict=id` is what makes PostgREST emit ON CONFLICT (id) DO UPDATE
  // instead of a plain INSERT.
  updated = await send(enrich, 'return=representation,resolution=merge-duplicates', 'Enriched', '?on_conflict=id');
}
if (!fresh.length && !enrich.length) console.log('Nothing to do — every row is present and already has media.');
console.log(`Done. Inserted=${inserted} Enriched=${updated}`);

