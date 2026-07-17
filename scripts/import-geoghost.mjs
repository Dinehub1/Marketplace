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
validateKey();

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
  const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
  for (const r of rows) {
    const name = (r[col['name']] ?? '').trim();
    const phone = (r[col['phone_number']] ?? '').replace(/\D/g, '') || null;
    if (!name) continue;
    const dedupeKey = `${name.toLowerCase()}|${phone ?? ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    records.push({
      name,
      category: (r[col['category']] ?? '').trim() || null,
      phone,
      address: (r[col['address']] ?? '').trim() || null,
      website: (r[col['website']] ?? '').trim() || null,
      area: (r[col['location']] ?? '').trim().toLowerCase() || 'indore',
      city: 'Indore',
      rating: num(r[col['reviews_average']]),
      lat: num(r[col['latitude']]),
      lng: num(r[col['longitude']]),
      source: 'geoghost-google-maps',
      status: 'active',
    });
  }
}
console.log(`Parsed ${records.length} unique businesses from ${files.length} CSV(s)`);
if (DRY) { console.log(records.slice(0, 3)); process.exit(0); }

// ---------- INSERT TO SUPABASE (LOCAL DEDUP) ----------
// Fetch existing rows (name, phone) in pages of 1000
const existing = new Set();
let offset = 0;
while (true) {
  const r = await fetch(`${URL_BASE}/rest/v1/businesses?select=name,phone&limit=1000&offset=${offset}`, {
    headers: {apikey: KEY, Authorization: `Bearer ${KEY}`},
  });
  const rows = await r.json();
  for (const x of rows) {
    const n = (x.name || '').trim().toLowerCase();
    const p = x.phone ? x.phone : '';
    existing.add(`${n}|${p}`);
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

// Filter out already‑existing records
const fresh = records.filter(r => {
  const key = `${r.name.trim().toLowerCase()}|${r.phone || ''}`;
  return !existing.has(key);
});
console.log('NEW TO INSERT:', fresh.length);

if (fresh.length === 0) { console.log('Nothing new. Done.'); process.exit(0); }

const BATCH = 100;
let inserted = 0;
for (let i = 0; i < fresh.length; i += BATCH) {
  const batch = fresh.slice(i, i + BATCH);
  const res = await fetch(`${URL_BASE}/rest/v1/businesses`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(batch),
  });
  if (res.status === 201) {
    const back = await res.json();
    inserted += back.length;
    console.log(`Inserted ${inserted}/${fresh.length}`);
  } else {
    const txt = await res.text();
    console.error(`Batch ${i / BATCH + 1} failed: ${res.status} ${txt}`);
    process.exit(1);
  }
}
console.log(`Done. Inserted=${inserted}`);

