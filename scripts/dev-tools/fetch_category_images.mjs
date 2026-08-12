// fetch_category_images.mjs — one themed stock photo per distinct business
// category, uploaded to R2 at categories/<slug>.jpg. Frontend builds the URL
// deterministically from the slug, so no manifest lookup is needed at render.
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const env = (k) => process.env[k] || "";
const ACCT = env("R2_ACCOUNT_ID"), AK = env("R2_ACCESS_KEY_ID"), AS = env("R2_SECRET_ACCESS_KEY");
const BUCKET = env("R2_BUCKET"), PUB = env("R2_PUBLIC_URL").replace(/\/+$/, "");
const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL"), SKEY = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

const s3 = new S3Client({ region: "auto", endpoint: `https://${ACCT}.r2.cloudflarestorage.com`, credentials: { accessKeyId: AK, secretAccessKey: AS } });
const slugify = (c) => c.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const hashSeed = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 9000) + 1; };

// distinct categories from the live table
const cats = new Map(); // lowercased -> original
let from = 0;
while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=category&limit=1000&offset=${from}`, { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } });
  const rows = await res.json();
  for (const r of rows) { if (r.category && !cats.has(r.category.toLowerCase())) cats.set(r.category.toLowerCase(), r.category); }
  if (rows.length < 1000) break;
  from += 1000;
}
console.log(`distinct categories: ${cats.size}`);

const jobs = [...cats.values()].map((c) => ({ category: c, slug: slugify(c), kw: encodeURIComponent(c), seed: hashSeed(slugify(c)) }));

// resume: skip categories already uploaded
let prior = [];
try { prior = JSON.parse(fs.readFileSync("scripts/dev-tools/category_images_done.json", "utf8")); } catch {}
const doneSlugs = new Set(prior.map((d) => d.slug));
const pending = jobs.filter((j) => !doneSlugs.has(j.slug));
console.log(`already done: ${prior.length}, pending: ${pending.length}`);

async function fetchImg(kw, seed) {
  const url = `https://loremflickr.com/800/600/${kw}?lock=${seed}`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`lorem ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.startsWith("image")) throw new Error(`not image: ${ct}`);
  return Buffer.from(await r.arrayBuffer());
}

const done = [...prior];
let ok = 0, fail = 0;
const CONC = 2;
let i = 0;
async function worker() {
  while (true) {
    const j = pending[i++];
    if (!j) return;
    let buf, tries = 0;
    while (tries < 6) {
      tries++;
      try { buf = await fetchImg(j.kw, j.seed); break; }
      catch (e) {
        const back = e.message.includes("403") ? 8000 : 700 * tries;
        if (tries === 6) { console.error(`FAIL ${j.category}: ${e.message}`); fail++; }
        else await new Promise((r) => setTimeout(r, back));
      }
    }
    if (!buf) continue;
    const key = `categories/${j.slug}.jpg`;
    try {
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: "image/jpeg" }));
      done.push({ category: j.category, slug: j.slug, url: `${PUB}/${key}` });
      ok++;
      if (ok % 25 === 0) console.log(`uploaded ${ok}/${pending.length}`);
    } catch (e) { console.error(`PUT FAIL ${j.category}: ${e.message}`); fail++; }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
fs.writeFileSync("scripts/dev-tools/category_images_done.json", JSON.stringify(done, null, 1));
console.log(`DONE. uploaded=${ok} failed=${fail} total=${done.length}`);
