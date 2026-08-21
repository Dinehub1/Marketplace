// validate_join.mjs — confirm manifest businesses join to live DB rows on phone.
import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
const g = (k) => (env.split(/\r?\n/).find((l) => l.startsWith(k + "=")) || "").split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
const URL = g("NEXT_PUBLIC_SUPABASE_URL");
const KEY = g("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

const normPhone = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : d;
};
const normName = (n) => String(n || "").toLowerCase().replace(/\s+/g, " ").trim();

const manifest = JSON.parse(fs.readFileSync("scripts/dev-tools/images_manifest.json", "utf8"));
const mBiz = manifest.businesses_with_image;

// Pull every business (id, name, phone) and index by phone_norm.
const dbByPhone = new Map();
let from = 0, total = 0;
while (true) {
  const res = await fetch(`${URL}/rest/v1/businesses?select=id,name,phone&limit=1000&offset=${from}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) { console.error("db error", res.status, await res.text()); process.exit(1); }
  const rows = await res.json();
  for (const r of rows) {
    const pn = normPhone(r.phone);
    if (!pn) continue;
    if (!dbByPhone.has(pn)) dbByPhone.set(pn, []);
    dbByPhone.get(pn).push(r);
  }
  total += rows.length;
  if (rows.length < 1000) break;
  from += 1000;
}
console.log(`DB businesses loaded: ${total}, indexed by phone: ${dbByPhone.size}`);

let matched = 0, nameMismatch = 0, noPhone = 0;
const matchedIds = new Set();
for (const b of mBiz) {
  const pn = b.phone_norm;
  if (!pn) { noPhone++; continue; }
  const cands = dbByPhone.get(pn) || [];
  if (cands.length === 0) continue;
  const exact = cands.find((c) => normName(c.name) === normName(b.name));
  if (exact) { matched++; matchedIds.add(exact.id); }
  else { matched++; nameMismatch++; matchedIds.add(cands[0].id); } // phone matched, name differs
}
console.log(`manifest businesses: ${mBiz.length}`);
console.log(`joined to a DB row (by phone): ${matched}`);
console.log(`  of those, name also matched: ${matched - nameMismatch}`);
console.log(`  phone matched but name differs: ${nameMismatch}`);
console.log(`no phone in manifest: ${noPhone}`);
console.log(`distinct DB ids that would get an image: ${matchedIds.size}`);
