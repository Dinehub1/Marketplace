#!/usr/bin/env python3
"""Backfill lat/lng for the listings the Google Maps scrape never captured.

WHY IT IS MISSING
-----------------
Only 22% of the source CSV carries coordinates - the scraper simply did not get
them for the rest - so this is not an import bug that can be patched. 79% of the
directory therefore has no map pin and no way to answer "near me".

HOW
---
Nominatim (OpenStreetMap), free and keyless, one request per listing, at 1.1s
apart: that is the published usage limit, and going faster gets the IP banned.
Progress is written to a JSONL state file so the run is resumable across days,
and rows are flushed to the database in batches. Only rows with NULL lat/lng are
touched, so re-running is safe.

  python geocode-missing.py             # starts/continues the backfill
  python geocode-missing.py --status    # report without doing network work
"""
import json, os, re, sys, time, urllib.parse, urllib.request, urllib.error

ENV = r"C:\Users\Administrator\Marketplace\apps\web\.env"
STATE = r"C:\Users\Administrator\geocode-state.jsonl"
REF = "xpfmqpmhmcouwzebfwhb"
UA = "SarkarMarketplaceDirectory/1.0 (business directory; contact: admin@cashcard.live)"
DELAY = 1.1
BATCH = 200
STATUS_ONLY = "--status" in sys.argv

cfg = {}
for line in open(ENV, encoding="utf-8", errors="replace"):
    m = re.match(r"^([A-Z_0-9]+)=(.*)$", line.strip())
    if m: cfg[m.group(1)] = m.group(2).strip().strip('"').strip("'")
TOK = cfg["SUPABASE_ACCESS_TOKEN"]


def sql(q):
    r = urllib.request.Request(f"https://api.supabase.com/v1/projects/{REF}/database/query",
                               method="POST", data=json.dumps({"query": q}).encode())
    r.add_header("Authorization", f"Bearer {TOK}"); r.add_header("Content-Type", "application/json")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(r, timeout=300) as resp:
                return json.loads(resp.read().decode() or "[]")
        except urllib.error.HTTPError as e:
            if attempt == 2: raise
            time.sleep(2)


def geocode(name, address, area):
    """Ask Nominatim for one address. Returns (lat, lng) or None."""
    q = ", ".join(x for x in [name, area if area != "indore" else None, "Indore", "Madhya Pradesh", "India"] if x)
    url = ("https://nominatim.openstreetmap.org/search?" +
           urllib.parse.urlencode({"q": q[:180], "format": "json", "limit": 1, "countrycodes": "in"}))
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            hits = json.loads(resp.read().decode() or "[]")
    except Exception:
        return None
    if not hits:
        return None
    try:
        return float(hits[0]["lat"]), float(hits[0]["lon"])
    except Exception:
        return None


def main():
    todo = sql("""select id, name, address, coalesce(area,'indore') area
                  from public.businesses
                  where status='active' and lat is null and name is not null
                  order by id""")
    done = set()
    if os.path.exists(STATE):
        for line in open(STATE, encoding="utf-8", errors="replace"):
            try: done.add(json.loads(line)["id"])
            except Exception: pass
    todo = [r for r in todo if r["id"] not in done]
    print(f"missing coordinates: {len(todo)} rows to try (state has {len(done)})", flush=True)
    if STATUS_ONLY:
        print("status only - no requests made"); return

    found = miss = 0
    pending = []
    with open(STATE, "a", encoding="utf-8") as st:
        for i, r in enumerate(todo, 1):
            res = geocode(r["name"], r["address"], r["area"])
            st.write(json.dumps({"id": r["id"], "ok": bool(res),
                                 "lat": res[0] if res else None,
                                 "lng": res[1] if res else None}) + "\n")
            if res:
                found += 1
                pending.append((r["id"], res[0], res[1]))
            else:
                miss += 1
            if len(pending) >= BATCH:
                vals = ",".join(f"({bid},{lat},{lng})" for bid, lat, lng in pending)
                sql(f"""update public.businesses b set lat = m.lat, lng = m.lng
                        from (values {vals}) as m(id, lat, lng) where b.id = m.id""")
                pending.clear()
                st.flush()
            if i % 100 == 0:
                st.flush()
                print(f"  {i}/{len(todo)} | geocoded {found} | not found {miss}", flush=True)
            time.sleep(DELAY)
        if pending:
            vals = ",".join(f"({bid},{lat},{lng})" for bid, lat, lng in pending)
            sql(f"""update public.businesses b set lat = m.lat, lng = m.lng
                    from (values {vals}) as m(id, lat, lng) where b.id = m.id""")
    total = sql("select count(*) filter (where lat is not null) with_coords, count(*) n from public.businesses where status='active'")[0]
    print(f"DONE | geocoded this run {found} | no match {miss} | "
          f"coverage now {total['with_coords']}/{total['n']}", flush=True)


if __name__ == "__main__":
    main()
