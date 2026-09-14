#!/usr/bin/env python3
"""Enrich Sarkar Marketplace businesses with the socials they publish themselves.

WHY THE WEBSITE AND NOT THE SCRAPER
-----------------------------------
The Google-Maps source CSV only carries name/category/phone/address/website/
lat/lng/place_id - it has no social columns, and the scrape tool never mentions
Instagram, Facebook or YouTube. So the socials cannot be scraped from the source;
they have to be read off the business's OWN website, which is what this does.

WHAT IT DOES
------------
For every business with a website: fetch the homepage, and if nothing is found,
/contact and /about. Extract instagram / facebook / youtube / x / linkedin /
whatsapp handles, plus any `mailto:` address (the `email` column is empty for
the whole catalogue). Results append to a JSONL file, one line per business, so
the run is resumable: restart it and it skips ids already present.

CONFIDENCE
----------
A link is only trusted when the handle or the page shares a token with the
business's own name or domain. Junk paths (sharer/plugins/login) are dropped.
Anything else is kept but flagged low confidence - hacked sites inject spam
links (`keepsafepackaging.in` really does advertise `facebook.com/bong88avip`),
and writing those into the database unlabelled would be worse than having no
socials at all.
"""
import json, os, re, sys, time, urllib.request, urllib.error, socket
from concurrent.futures import ThreadPoolExecutor, as_completed

SRC = r"C:\Users\Administrator\mb_full2.json"
OUT = r"C:\Users\Administrator\social_crawl.jsonl"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.9"}
WORKERS = 6
TIMEOUT = 12
PATHS = ["", "/contact", "/contact-us", "/about"]

PATTERNS = {
    "instagram": r"(?:https?://)?(?:www\.)?instagram\.com/([A-Za-z0-9_.]{3,40})",
    "facebook":  r"(?:https?://)?(?:www\.)?facebook\.com/([A-Za-z0-9_.\-]{3,60})",
    "youtube":   r"(?:https?://)?(?:www\.)?youtube\.com/(@[A-Za-z0-9_.\-]{2,60}|c/[A-Za-z0-9_.\-]{2,60}|channel/[A-Za-z0-9_\-]{10,40}|user/[A-Za-z0-9_.\-]{2,60})",
    "x":         r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/([A-Za-z0-9_]{4,30})",
    "linkedin":  r"(?:https?://)?(?:www\.)?linkedin\.com/(?:company|in)/([A-Za-z0-9_.\-]{3,60})",
    "whatsapp":  r"(?:https?://)?(?:wa\.me|api\.whatsapp\.com/send\?phone=)([0-9]{8,15})",
}
JUNK = re.compile(r"^(sharer|share|plugins|tr|dialog|login|signup|signin|policy|privacy|help|about|"
                  r"instagram|p|explore|watch|results|home|pages|profile\.php|hashtag|intent|"
                  r"group|groups|events|marketplace|reel|reels|stories|tv|embed|shorts|index\.html)$", re.I)
SPAM = re.compile(r"(bong88|avip|slot|judi|togel|casino|poker|bet\d|xxx|porn|viagra)", re.I)


def tokens(*parts):
    out = set()
    for p in parts:
        for w in re.split(r"[^a-z0-9]+", (p or "").lower()):
            if len(w) >= 4:
                out.add(w)
    return out


def harvest(html, name, domain):
    """Return {platform: handle} for a page, with a confidence flag per hit."""
    own = tokens(name, domain)
    found = {}
    for plat, pat in PATTERNS.items():
        for m in re.finditer(pat, html, re.I):
            h = m.group(1).strip("/")
            if not h or JUNK.match(h) or SPAM.search(h):
                continue
            low = h.lower()
            conf = "high" if any(t and t in low for t in own) else "low"
            if plat not in found or (conf == "high" and found[plat]["confidence"] == "low"):
                found[plat] = {"handle": h, "confidence": conf}
            if found.get(plat, {}).get("confidence") == "high":
                break
    mails = set(re.findall(r"mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})", html, re.I))
    mails = {m for m in mails if not re.search(r"\.(png|jpg|jpeg|gif|webp|svg)$", m, re.I)
             and not m.lower().startswith(("info@example", "your@", "name@"))}
    return found, sorted(mails)[:3]


def probe(row):
    site = row["website"]
    if not site.startswith("http"):
        site = "https://" + site
    domain = re.sub(r"^https?://(www\.)?", "", site).split("/")[0]
    result = {"id": row["id"], "name": row.get("name"), "site": site,
              "http": None, "socials": {}, "emails": [], "pages_tried": 0}
    for path in PATHS:
        url = site.rstrip("/") + path
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                final = resp.geturl()
                html = resp.read(500000).decode("utf-8", "replace")
                result["http"] = resp.status
        except urllib.error.HTTPError as e:
            result["http"] = e.code
            if path == "":  # a 403/404 homepage still tells us the host is alive
                continue
            continue
        except Exception as e:
            result.setdefault("error", type(e).__name__)
            continue
        result["pages_tried"] += 1
        socials, mails = harvest(html, row.get("name"), domain)
        for k, v in socials.items():
            if k not in result["socials"] or v["confidence"] == "high":
                result["socials"][k] = v
        result["emails"] = sorted(set(result["emails"]) | set(mails))
        if len(result["socials"]) >= 3:
            break
    return result


def main():
    rows = json.load(open(SRC, encoding="utf-8"))
    targets = [r for r in rows if (r.get("website") or "").startswith("http")]
    done = set()
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            for line in f:
                try: done.add(json.loads(line)["id"])
                except Exception: pass
    todo = [r for r in targets if r["id"] not in done]
    print(f"targets {len(targets)} | already done {len(done)} | this run {len(todo)}", flush=True)
    hits = {"any": 0, "instagram": 0, "facebook": 0, "youtube": 0, "x": 0, "linkedin": 0, "whatsapp": 0, "emails": 0}
    with open(OUT, "a", encoding="utf-8") as out, ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(probe, r): r for r in todo}
        for i, fu in enumerate(as_completed(futs), 1):
            try: res = fu.result()
            except Exception as e:
                res = {"id": futs[fu]["id"], "error": repr(e)[:120], "socials": {}, "emails": []}
            out.write(json.dumps(res, ensure_ascii=False) + "\n")
            if res.get("socials"):
                hits["any"] += 1
                for k in res["socials"]: hits[k] = hits.get(k, 0) + 1
            if res.get("emails"): hits["emails"] += 1
            if i % 200 == 0:
                out.flush()
                print(f"  {i}/{len(todo)} | sites with socials {hits['any']} "
                      f"({round(100*hits['any']/i)}%) | {dict((k,v) for k,v in hits.items() if k!='any')}", flush=True)
    print("DONE", hits, flush=True)


if __name__ == "__main__":
    main()
