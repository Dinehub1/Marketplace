// backfill_reviews_count.mjs — populate businesses.reviews_count from the
// GMaps CSVs (which carry reviews_count). Joins on normalized phone
// (last 10 digits). Uses the service-role key so it bypasses RLS.
// Batched upsert (Prefer: resolution=merge-duplicates) — one HTTP call per
// batch, not per row. DRY=1 prints match stats without writing.
import fs from "fs";
import path from "path";

const env = (k) => process.env[k] || "";
const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY") || env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const DRY = process.env.DRY === "1";
const CSV_DIR = "GMaps Data/2026-07-04";

const norm = (s) => (s || "").replace(/\D/g, "").slice(-10);
const num = (s) => { const n = parseInt(String(s).replace(/\D/g, ""), 10); return Number.isFinite(n) ? n : null; };

// Minimal CSV parser (handles quoted fields, embedded commas/newlines, "" escapes).
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = ""; i++; continue;
    }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// 1. Build phone -> reviews_count map from all CSVs.
const phoneMap = new Map();
let csvRows = 0;
for (const f of fs.readdirSync(CSV_DIR).filter((f) => f.endsWith(".csv"))) {
  const rows = parseCSV(fs.readFileSync(path.join(CSV_DIR, f), "utf8"));
  const header = rows.shift();
  const pi = header.indexOf("phone_number"), ri = header.indexOf("reviews_count");
  if (pi < 0 || ri < 0) continue;
  for (const r of rows) {
    if (!r[pi] && r[pi] !== 0) continue;
    const p = norm(r[pi]); const rc = num(r[ri]);
    // Sanity: Google review counts are effectively < 50k; anything above is a
    // scrape artifact (e.g. Hospital CSV had 253220). Keep first valid only.
    if (p && rc != null && rc >= 1 && rc <= 50000 && !phoneMap.has(p)) {
      phoneMap.set(p, rc); csvRows++;
    }
  }
}
console.log(`CSV rows parsed: ${csvRows}, unique phones: ${phoneMap.size}`);

// 2. Fetch all businesses (id, phone).
const businesses = [];
let from = 0;
while (true) {
  const res = await fetch(`${URL}/rest/v1/businesses?select=id,phone&limit=1000&offset=${from}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) { console.error("fetch fail", res.status, await res.text()); process.exit(1); }
  const rows = await res.json();
  businesses.push(...rows);
  if (rows.length < 1000) break;
  from += 1000;
}
console.log(`businesses fetched: ${businesses.length}`);

// 3. Match.
const updates = [];
let matched = 0;
for (const b of businesses) {
  const p = norm(b.phone);
  if (p && phoneMap.has(p)) { updates.push({ id: b.id, reviews_count: phoneMap.get(p) }); matched++; }
}
console.log(`matched: ${matched}, unmatched: ${businesses.length - matched}`);

if (DRY) { console.log("DRY run — no writes."); process.exit(0); }

// 4. Start from a clean slate: null every reviews_count, then re-populate.
// (The prior run wrote a few scrape-artifact values like 253220; this
// guarantees none linger.)
{
  const r = await fetch(`${URL}/rest/v1/businesses?id=gt.0`, {
    method: "PATCH",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ reviews_count: null }),
  });
  console.log("nulled all reviews_count:", r.status);
}

// Per-row PATCH (true UPDATE by id) with a concurrency pool.
const CONC = 10;
let done = 0, failed = 0;
let idx = 0;
async function worker() {
  while (true) {
    const u = updates[idx++];
    if (!u) return;
    let tries = 0;
    while (tries < 6) {
      tries++;
      try {
        const res = await fetch(`${URL}/rest/v1/businesses?id=eq.${u.id}`, {
          method: "PATCH",
          headers: {
            apikey: KEY, Authorization: `Bearer ${KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ reviews_count: u.reviews_count }),
        });
        if (res.status === 204 || res.status === 200) { done++; break; }
        if (res.status === 429) { await new Promise((r) => setTimeout(r, 15000)); continue; }
        const body = await res.text();
        console.error(`patch fail ${u.id} ${res.status}: ${body.slice(0, 120)}`);
        failed++; break;
      } catch (e) {
        if (tries === 6) { console.error(`patch err ${u.id}: ${e.message}`); failed++; }
        else await new Promise((r) => setTimeout(r, 1000 * tries));
      }
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
console.log(`DONE. updated=${done} failed=${failed}`);
