// upload_r2.mjs — download each matched business photo and PUT it to R2,
// named businesses/<id>.jpg so the DB backfill is just base + id.
//
// Env (never logged): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
// R2_BUCKET, R2_PUBLIC_URL (e.g. https://cdn.example.com or https://pub-xx.r2.dev)
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const env = (k) => process.env[k] || "";
const ACCOUNT = env("R2_ACCOUNT_ID");
const AKEY = env("R2_ACCESS_KEY_ID");
const ASEC = env("R2_SECRET_ACCESS_KEY");
const BUCKET = env("R2_BUCKET");
const PUB = env("R2_PUBLIC_URL").replace(/\/+$/, "");
const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SKEY = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

if (!ACCOUNT || !AKEY || !ASEC || !BUCKET || !PUB) {
  console.error("Missing R2 env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: AKEY, secretAccessKey: ASEC },
});

const normPhone = (p) => { const d = String(p || "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(-10) : d; };
const normName = (n) => String(n || "").toLowerCase().replace(/\s+/g, " ").trim();
const extOf = (ct) => ({ "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" }[ct] || "jpg");

// ---- join manifest -> DB id (same logic as validate_join) ----
const manifest = JSON.parse(fs.readFileSync("scripts/dev-tools/images_manifest.json", "utf8"));
const dbByPhone = new Map();
let from = 0;
while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id,name,phone&limit=1000&offset=${from}`, {
    headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` },
  });
  const rows = await res.json();
  for (const r of rows) { const pn = normPhone(r.phone); if (pn) { (dbByPhone.get(pn) || dbByPhone.set(pn, []).get(pn)).push(r); } }
  if (rows.length < 1000) break;
  from += 1000;
}

const jobs = [];
const seenId = new Set();
for (const b of manifest.businesses_with_image) {
  const pn = b.phone_norm;
  if (!pn) continue;
  const cands = dbByPhone.get(pn) || [];
  const hit = cands.find((c) => normName(c.name) === normName(b.name)) || cands[0];
  if (!hit || seenId.has(hit.id)) continue;
  seenId.add(hit.id);
  jobs.push({ id: hit.id, url: b.resized_url });
}
const LIMIT = Number(process.env.UPLOAD_LIMIT) || 0;
if (LIMIT) jobs.length = Math.min(jobs.length, LIMIT);
console.log(`matched jobs to upload: ${jobs.length}`);

async function fetchBuf(url) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`img ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { buf, ct: r.headers.get("content-type") || "image/jpeg" };
}

const done = [];
const CONC = 8;
let i = 0, ok = 0, fail = 0;
async function worker() {
  while (true) {
    const j = jobs[i++];
    if (!j) return;
    let buf, ct, tries = 0;
    while (tries < 3) {
      tries++;
      try { ({ buf, ct } = await fetchBuf(j.url)); break; }
      catch (e) { if (tries === 3) { console.error(`FAIL id ${j.id}: ${e.message}`); fail++; } else await new Promise((r) => setTimeout(r, 800 * tries)); }
    }
    if (!buf) continue;
    const key = `businesses/${j.id}.jpg`;
    try {
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: ct }));
      done.push({ id: j.id, url: `${PUB}/${key}`, contentType: ct, bytes: buf.length });
      ok++;
      if (ok % 50 === 0) console.log(`uploaded ${ok}/${jobs.length}`);
    } catch (e) {
      console.error(`PUT FAIL id ${j.id}: ${e.message}`); fail++;
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
fs.writeFileSync("scripts/dev-tools/r2_done.json", JSON.stringify(done, null, 1));
console.log(`DONE. uploaded=${ok} failed=${fail}. wrote scripts/dev-tools/r2_done.json`);
