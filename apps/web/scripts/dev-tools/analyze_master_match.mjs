// analyze_master_match.mjs — compare combined_indore_master.csv against the
// live businesses table (by normalized phone) to scope a safe data sync.
import fs from "fs";

const env = (k) => process.env[k] || "";
const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY") || env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

const norm = (s) => {
  const d = (s || "").replace(/\D/g, "");
  return d.slice(-10);
};

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
    if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Master phones
const masterRows = parseCSV(fs.readFileSync("combined_indore_master.csv", "utf8"));
const mHeader = masterRows.shift();
const mPi = mHeader.findIndex((h) => /phone/i.test(h));
const masterPhones = new Set();
for (const r of masterRows) { const p = norm(r[mPi]); if (p) masterPhones.add(p); }
console.log(`master rows: ${masterRows.length}, unique phones: ${masterPhones.size}`);

// Supabase phones
const sbPhones = new Set();
let from = 0, total = 0;
while (true) {
  const res = await fetch(`${URL}/rest/v1/businesses?select=phone&limit=1000&offset=${from}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const rows = await res.json();
  total += rows.length;
  for (const r of rows) { const p = norm(r.phone); if (p) sbPhones.add(p); }
  if (rows.length < 1000) break;
  from += 1000;
}
console.log(`supabase businesses: ${total}, unique phones: ${sbPhones.size}`);

let inBoth = 0;
for (const p of masterPhones) if (sbPhones.has(p)) inBoth++;
console.log(`master phones also in supabase: ${inBoth} / ${masterPhones.size}`);
console.log(`supabase phones NOT in master: ${[...sbPhones].filter((p) => !masterPhones.has(p)).length}`);

// Current reviews_count health
const c = await fetch(`${URL}/rest/v1/businesses?select=id&reviews_count=not.is.null&limit=1`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
});
console.log(`supabase non-null reviews_count: ${c.headers.get("content-range")}`);
const bad = await fetch(`${URL}/rest/v1/businesses?select=id&reviews_count=gt.50000&limit=1`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
});
console.log(`supabase reviews_count > 50000 (artifacts): ${bad.headers.get("content-range")}`);
