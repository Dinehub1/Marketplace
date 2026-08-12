// fetch_category_images_api.mjs — per-category thematic stock photo from
// Pexels / Unsplash / Pixabay (whichever API key is in .env), uploaded to R2 at
// categories/<slug>.jpg. Resumes from category_images_done.json.
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const env = (k) => process.env[k] || "";
const ACCT = env("R2_ACCOUNT_ID"), AK = env("R2_ACCESS_KEY_ID"), AS = env("R2_SECRET_ACCESS_KEY");
const BUCKET = env("R2_BUCKET"), PUB = env("R2_PUBLIC_URL").replace(/\/+$/, "");
const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL"), SKEY = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const PEXELS = env("PEXELS_API_KEY"), UNSPLASH = env("UNSPLASH_ACCESS_KEY"), PIXABAY = env("PIXABAY_API_KEY");

let provider = null;
if (PEXELS) provider = "pexels";
else if (UNSPLASH) provider = "unsplash";
else if (PIXABAY) provider = "pixabay";
if (!provider) { console.error("No stock API key found (PEXELS_API_KEY / UNSPLASH_ACCESS_KEY / PIXABAY_API_KEY)"); process.exit(1); }
const RATE_LIMIT = provider === "pexels" ? 200 : provider === "unsplash" ? 45 : 100; // requests/hour
const MIN_GAP = Math.ceil(3600000 / RATE_LIMIT) + 250; // ms between API calls
let lastApi = 0;
async function gate() { let w; while ((w = MIN_GAP - (Date.now() - lastApi)) > 0) await new Promise((r) => setTimeout(r, Math.min(w, 1000))); lastApi = Date.now(); }
console.log("stock provider:", provider, "rate:", RATE_LIMIT + "/hr");

const s3 = new S3Client({ region: "auto", endpoint: `https://${ACCT}.r2.cloudflarestorage.com`, credentials: { accessKeyId: AK, secretAccessKey: AS } });
const slugify = (c) => c.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// distinct categories from the live table
const cats = new Map();
let from = 0;
while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=category&limit=1000&offset=${from}`, { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } });
  const rows = await res.json();
  for (const r of rows) { if (r.category && !cats.has(r.category.toLowerCase())) cats.set(r.category.toLowerCase(), r.category); }
  if (rows.length < 1000) break;
  from += 1000;
}
console.log(`distinct categories: ${cats.size}`);

const GEO = " India"; // target market: bias search toward Indian context
async function photoUrl(kw) {
  const q = encodeURIComponent(kw + GEO);
  if (provider === "pexels") {
    await gate();
    const r = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=landscape`, { headers: { Authorization: PEXELS } });
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 60000)); throw new Error("429"); }
    if (!r.ok) throw new Error(`pexels ${r.status}`);
    const j = await r.json();
    return j.photos?.[0]?.src?.large2x || j.photos?.[0]?.src?.large || null;
  }
  if (provider === "unsplash") {
    await gate();
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape&content_filter=high`, { headers: { Authorization: `Client-ID ${UNSPLASH}` } });
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 60000)); throw new Error("429"); }
    if (!r.ok) throw new Error(`unsplash ${r.status}`);
    const j = await r.json();
    return j.results?.[0]?.urls?.raw || j.results?.[0]?.urls?.regular || null;
  }
  if (provider === "pixabay") {
    await gate();
    const r = await fetch(`https://pixabay.com/api/?key=${PIXABAY}&q=${q}&per_page=3&image_type=photo&orientation=horizontal`);
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 60000)); throw new Error("429"); }
    if (!r.ok) throw new Error(`pixabay ${r.status}`);
    const j = await r.json();
    return j.hits?.[0]?.largeImageURL || j.hits?.[0]?.webformatURL || null;
  }
  return null;
}

async function fetchImg(kw) {
  const url = await photoUrl(kw);
  if (!url) throw new Error("no photo");
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`img ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.startsWith("image")) throw new Error(`not image: ${ct}`);
  return Buffer.from(await r.arrayBuffer());
}

let prior = [];
try { prior = JSON.parse(fs.readFileSync("scripts/dev-tools/category_images_done.json", "utf8")); } catch {}
const doneSlugs = new Set(prior.map((d) => d.slug));
const pending = [...cats.values()].filter((c) => !doneSlugs.has(slugify(c))).map((c) => ({ category: c, slug: slugify(c), kw: c }));
console.log(`already done: ${prior.length}, pending: ${pending.length}`);

const done = [...prior];
let ok = 0, fail = 0;
// Keep polite: ~3-4 concurrent is fine for these APIs.
const CONC = 3;
let i = 0;
async function worker() {
  while (true) {
    const j = pending[i++];
    if (!j) return;
    let buf, tries = 0;
    while (tries < 4) {
      tries++;
      try { buf = await fetchImg(j.kw); break; }
      catch (e) { if (tries === 4) { console.error(`FAIL ${j.category}: ${e.message}`); fail++; } else await new Promise((r) => setTimeout(r, 1200 * tries)); }
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
