// backfill_db.mjs — set image_url = R2 URL for every id in r2_done.json.
// Requires the image_url column to already exist (apply
// supabase/migrations/20260812120000_listing_media.sql first) and a
// SUPABASE_SERVICE_ROLE_KEY with update rights.
import fs from "fs";
const env = (k) => process.env[k] || "";
const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SKEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SKEY) { console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const done = JSON.parse(fs.readFileSync("scripts/dev-tools/r2_done.json", "utf8"));
console.log(`backfilling ${done.length} rows...`);

let ok = 0, fail = 0;
const CONC = 20;
let i = 0;
async function worker() {
  while (true) {
    const row = done[i++];
    if (!row) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${row.id}`, {
        method: "PATCH",
        headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ image_url: row.url }),
      });
      if (!res.ok) { console.error(`id ${row.id}: ${res.status} ${await res.text()}`); fail++; }
      else { ok++; if (ok % 100 === 0) console.log(`updated ${ok}/${done.length}`); }
    } catch (e) { console.error(`id ${row.id}: ${e.message}`); fail++; }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
console.log(`DONE. updated=${ok} failed=${fail}`);
