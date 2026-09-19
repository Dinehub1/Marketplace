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

// ---------------------------------------------------------------------------
// City. The importer is city-agnostic; the caller says which city the
// --data-dir tree belongs to. Anything that lands without an explicit city is
// inferred from the data-dir path when that path names a known city, and only
// falls back to Indore as the historical default. (2026-09-19)
const KNOWN_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat", "Lucknow",
  "Chandigarh", "Kochi", "Nagpur", "Indore"];

function inferCity(dir) {
  if (!dir) return null;
  const parts = path.resolve(dir).split(path.sep);
  // Deepest segment wins, so ".../GMaps Data/Mumbai/2026-09-20" is Mumbai.
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts[i].trim().toLowerCase();
    const hit = KNOWN_CITIES.find((c) => c.toLowerCase() === seg);
    if (hit) return hit;
  }
  return null;
}

const cityFlag = process.argv.indexOf("--city");
const CITY =
  (cityFlag !== -1 && process.argv[cityFlag + 1]) ||
  process.env.GMAPS_CITY ||
  inferCity(DATA_DIR) ||
  "Indore";

// City is part of the FALLBACK identity. "Sharma Sweets" in Indore and the same
// name in Mumbai are different businesses; without the city in the key the
// second is treated as already present and never inserted. place_id stays the
// authoritative match and needs no city - it is globally unique. (2026-09-19)
const fallbackKey = (name, phone, city) =>
  `${(name || "").trim().toLowerCase()}|${phone || ""}|${(city || "").trim().toLowerCase()}`;

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

// Single source for the REST auth headers. This pair was copy-pasted into
// three call sites; a redaction/formatting pass mangled one of the copies
// into a syntax error and the failure mode was a silent auth break, not a
// crash. One definition, referenced everywhere. (2026-09-19)
const AUTH_HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

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
    // place_id first. It is present on 100% of scraped rows and is the ONLY
    // key that can tell two branches of one brand apart, so it is what makes
    // "duplicate channel" detection possible at all: name|phone marks
    // IndianOil's 45 separate Indore outlets as 45 unrelated rows (correct)
    // *and* an outlet scraped once with a phone and once without as two rows
    // (wrong). place_id separates both cases correctly. (2026-09-19)
    const placeId = (r[col['place_id']] ?? '').trim();
    const dedupeKey = placeId ? `pid:${placeId}` : `${name.toLowerCase()}|${phone ?? ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const address = str(r[col['address']]);
    records.push({
      name,
      category: str(r[col['category']]),
      phone,
      address,
      website: str(r[col['website']]),
      // These CSVs carry no google_maps_url / image_url column, so both fields
      // were always null ("EXISTING TO ENRICH: 0" every run). A place_id is a
      // complete maps link on its own, so build one from it. (2026-09-19)
      place_id: placeId || null,
      google_maps: str(r[col['google_maps_url']])
        || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null),
      area: localityOf(address),
      pincode: pincodeOf(address),
      city: CITY,
      rating: num(r[col['reviews_average']]),
      // Carried since 2026-08-12: a rating with no review count behind it is
      // not showable, and a listing with no photo is not scannable.
      reviews_count: int(r[col['reviews_count']]),
      image_url: str(r[col['image_url']]),
      lat: num(r[col['latitude']]),
      lng: num(r[col['longitude']]),
      source: 'geoghost-google-maps',
      status: 'active',
      raw: { csv_file: path.basename(file), domain: str(r[col['domain']]), city: CITY },
    });
  }
}
console.log(`CITY: ${CITY} | data-dir: ${DATA_DIR}`);
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
const existing = new Map(); // "name|phone" -> { id, image_url, reviews_count, google_maps, place_id }
const existingByPlace = new Map(); // place_id -> same row object
let offset = 0;
while (true) {
  const r = await fetch(
    `${URL_BASE}/rest/v1/businesses?select=id,name,phone,city,image_url,reviews_count,google_maps,place_id&limit=1000&offset=${offset}`,
    { headers: AUTH_HEADERS },
  );
  if (!r.ok) {
    const txt = await r.text();
    if (/image_url|reviews_count|place_id/.test(txt)) {
      console.error('The image_url / reviews_count / place_id columns do not exist yet.');
      console.error('Run supabase/migrations for listing media + place_id first.');
      process.exit(1);
    }
    console.error(`Failed to read existing rows: ${r.status} ${txt}`);
    process.exit(1);
  }
  const rows = await r.json();
  for (const x of rows) {
    const key = fallbackKey(x.name, x.phone, x.city);
    existing.set(key, x);
    if (x.place_id) existingByPlace.set(x.place_id, x);
  }
  if (rows.length < 1000) break;
  offset += 1000;
}
console.log('EXISTING IN DB:', existing.size, '| WITH place_id:', existingByPlace.size);

// Delete the test row if it exists
await fetch(`${URL_BASE}/rest/v1/businesses?name=eq.ZZTEST`, {
  method: 'DELETE',
  headers: AUTH_HEADERS,
});

// Split into rows to create and rows that only need the new media fields.
const fresh = [];
// Records that resolve to the same existing row are MERGED, not first-match-wins.
// Two records routinely name one row: a listing first scraped before place_id
// existed (key `name|phone`, no place_id) and the same listing scraped again
// later (key `pid:<id>`, place_id present). The older record carries strictly
// less information, so under the previous first-match-wins guard it claimed the
// row and the place_id-bearing record was dropped. Consequence: importing the
// whole tree could never backfill place_id at all - it reported
// "EXISTING TO ENRICH: 0" - even though importing a single file backfilled 14
// rows, because the newer record was always shadowed by the older one. Merging
// per row means a record can only ever ADD a value, never block another record
// from adding it. (2026-09-19)
const pending = new Map(); // row.id -> { orig, patch }
for (const r of records) {
  // place_id is the authoritative match; fall back to name|phone for rows that
  // predate the place_id column and for listings Google gives no id for.
  const key = fallbackKey(r.name, r.phone, r.city);
  const row = (r.place_id && existingByPlace.get(r.place_id)) || existing.get(key);
  if (!row) { fresh.push(r); continue; }

  let entry = pending.get(row.id);
  if (!entry) {
    // The patch carries the SAME keys for every row, and the CURRENT value for
    // any field it is not changing. Two hard requirements of the PostgREST
    // upsert:
    //   * `name` is NOT NULL, and ON CONFLICT DO UPDATE still validates the
    //     proposed insert tuple, so a patch without it dies with 23502
    //     "null value in column name" - which is what this did before.
    //   * a batch whose objects have differing key sets is rejected outright with
    //     PGRST102 "All object keys must match", so the shapes cannot vary
    //     per row.
    // Sending the current value (never null) is also what keeps this from wiping
    // a field: a null in the payload IS written.
    entry = {
      orig: row,
      patch: {
        id: row.id,
        name: row.name,
        image_url: row.image_url,
        reviews_count: row.reviews_count,
        google_maps: row.google_maps,
        place_id: row.place_id,
      },
    };
    pending.set(row.id, entry);
  }
  // Only fill gaps - never overwrite a value already in the table (it may have
  // been corrected by hand or by an owner claiming the listing), nor one an
  // earlier record already supplied for this same row.
  const merged = entry.patch;
  if (!merged.image_url && r.image_url) merged.image_url = r.image_url;
  if (merged.reviews_count == null && r.reviews_count != null) merged.reviews_count = r.reviews_count;
  if (!merged.google_maps && r.google_maps) merged.google_maps = r.google_maps;
  // Backfill only: never overwrite a place_id already stored (it may have been
  // set by hand or by a later, better scrape).
  if (merged.place_id == null && r.place_id) merged.place_id = r.place_id;
}
// Drop rows where nothing actually changed, so we never send a no-op patch.
const enrich = [];
for (const { orig, patch } of pending.values()) {
  const changed =
    patch.image_url !== orig.image_url ||
    patch.reviews_count !== orig.reviews_count ||
    patch.google_maps !== orig.google_maps ||
    patch.place_id !== orig.place_id;
  if (changed) enrich.push(patch);
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
        ...AUTH_HEADERS,
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
  // ignore-duplicates: a unique-index collision now skips that one row instead
  // of aborting the entire import. Before this, a single colliding record made
  // PostgREST return 409 and send() called process.exit(1), so nothing else in
  // the run was written. With city-scoped identity that should be rare, but a
  // place_id can still legitimately collide across two cities' query sets, and
  // one collision must not cost the whole pass. (2026-09-19)
  inserted = await send(fresh, 'return=representation,resolution=ignore-duplicates', 'Inserted');
}
if (enrich.length) {
  // Upsert on the primary key: touches only the columns present in each row.
  // `on_conflict=id` is what makes PostgREST emit ON CONFLICT (id) DO UPDATE
  // instead of a plain INSERT.
  updated = await send(enrich, 'return=representation,resolution=merge-duplicates', 'Enriched', '?on_conflict=id');
}
if (!fresh.length && !enrich.length) console.log('Nothing to do — every row is present and already has media.');
console.log(`Done. Inserted=${inserted} Enriched=${updated}`);

