"""
extract_images.py — scan GMaps Data for real business photo URLs and emit a
manifest that the upload/backfill steps consume.

Join key to the live `businesses` table is (normalized name + phone), because the
`google_maps` column in the DB is garbage ("indore" for most rows). Phone is the
stable half; we keep the last 10 digits.
"""
import os, glob, re, json, hashlib
import pandas as pd

ROOT = "GMaps Data"
IMG_HOSTS = ("googleusercontent.com", "ggpht.com", "googleapis.com", "maps.google", "streetviewpixels")

def is_real_img(u):
    if not u or not str(u).strip():
        return None
    u = str(u).strip()
    if not u.lower().startswith("http"):
        return None
    low = u.lower()
    if any(k in low for k in IMG_HOSTS):
        return u
    if re.search(r"\.(jpg|jpeg|png|webp|gif|avif)(\?|$)", low):
        return u
    return None

def norm_phone(p):
    if not p:
        return ""
    d = re.sub(r"\D", "", str(p))
    return d[-10:] if len(d) >= 10 else d

def norm_name(n):
    if not n:
        return ""
    return re.sub(r"\s+", " ", str(n)).strip().lower()

def resized(u):
    # Google CDN images accept a trailing =wNNN size param, but many source
    # URLs already carry one (=w1024-h768-p-rp-mo-br100). Strip any existing
    # sizing segment, then ask for ~800px wide.
    if "googleusercontent.com" in u or "streetviewpixels" in u or "ggpht.com" in u:
        return re.sub(r"=w\d+.*$", "", u) + "=w800"
    return u

files = glob.glob(f"{ROOT}/**/*.csv", recursive=True) + glob.glob(f"{ROOT}/**/*.xlsx", recursive=True)
print(f"scanning {len(files)} files...")

rows = []          # one per business-with-image
seen_keys = set()  # (name,phone) dedupe
skipped = []
for f in files:
    try:
        if f.endswith(".csv"):
            df = pd.read_csv(f, dtype=str, keep_default_na=False, engine="python", on_bad_lines="skip")
        else:
            df = pd.read_excel(f, dtype=str, engine="openpyxl")
    except Exception as e:
        skipped.append((os.path.basename(f), str(e)[:80]))
        continue
    cols = {c.lower(): c for c in df.columns}
    ic = cols.get("image_url")
    if not ic:
        skipped.append((os.path.basename(f), "no image_url column"))
        continue
    nc = cols.get("name")
    pc = cols.get("phone_number") or cols.get("phone")
    cc = cols.get("category")
    for _, r in df.iterrows():
        url = is_real_img(r.get(ic) if ic else None)
        if not url:
            continue
        name = r.get(nc) if nc else ""
        phone = r.get(pc) if pc else ""
        key = (norm_name(name), norm_phone(phone))
        if key in seen_keys:
            continue
        seen_keys.add(key)
        rows.append({
            "name": (name or "").strip(),
            "phone": (phone or "").strip(),
            "phone_norm": key[1],
            "category": (r.get(cc) if cc else None) or "",
            "image_url": url,
            "resized_url": resized(url),
            "source": os.path.basename(f),
        })

print(f"businesses with a real image: {len(rows)}")
uniq = {r["image_url"] for r in rows}
print(f"unique image urls to fetch: {len(uniq)}")

# Dedupe by url for the actual download set
by_url = {}
for r in rows:
    by_url.setdefault(r["image_url"], r)

os.makedirs("scripts/dev-tools", exist_ok=True)
with open("scripts/dev-tools/images_manifest.json", "w") as fh:
    json.dump({
        "generated": True,
        "businesses_with_image": rows,
        "unique_image_urls": sorted(uniq),
    }, fh, indent=1)
print("wrote scripts/dev-tools/images_manifest.json")
if skipped:
    print("SKIPPED/ERRORS:")
    for s in skipped:
        print("  ", s)
