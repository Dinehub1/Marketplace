#!/usr/bin/env python3
"""Place every listing on the map by geocoding 366 localities and ~N pincodes once.

WHY NOT PER-BUSINESS
--------------------
The first version asked Nominatim for "shop name, locality, Indore" one row at a
time: 20 requests produced 1 hit. OSM does not hold every small Indian business
as a named point, so name lookups are the wrong question and 18k of them would
have burned five hours for almost nothing.

WHAT WORKS
----------
Coordinates are a property of the PLACE, not the shop. So this geocodes each
distinct locality and each distinct pincode once, caches the answers, and then
places every listing from that cache - instant, and it lifts coverage from 21%
to effectively all rows. Each row records how precise its pin is:

  raw.geo_precision = "pincode"    <- a pincode centroid (Indore pincodes are small)
                    | "locality"   <- a neighbourhood centroid
  street level is not attempted: few source addresses carry a usable house number,
  and pretending otherwise would put pins on the wrong side of a road.

  python geocode-places.py            # build/refresh the cache, then assign
  python geocode-places.py --status   # what the cache holds, no network
"""
import json, os, re, sys, time, urllib.parse, urllib.request, urllib.error

ENV = r"C:\Users\Administrator\Marketplace\apps\web\.env"
CACHE = r"C:\Users\Administrator\geocode-places-cache.json"
REF = "xpfmqpmhmcouwzebfwhb"
UA = "SarkarMarketplaceDirectory/1.0 (business directory; contact: admin@cashcard.live)"
DELAY = 1.1
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
    with urllib.request.urlopen(r, timeout=300) as resp:
        return json.loads(resp.read().decode() or "[]")


def nominatim(params: dict):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            hits = json.loads(resp.read().decode() or "[]")
    except Exception:
        return None
    if not hits:
        return None
    try:
        return round(float(hits[0]["lat"]), 6), round(float(hits[0]["lon"]), 6)
    except Exception:
        return None


def lookup(kind: str, key: str):
    """kind: 'locality' | 'pincode'."""
    if kind == "locality":
        q = f"{key}, Indore, Madhya Pradesh, India" if key.lower() != "indore" else "Indore, Madhya Pradesh, India"
        return nominatim({"q": q[:180], "format": "json", "limit": 1, "countrycodes": "in"})
    return nominatim({"postalcode": key, "city": "Indore", "state": "Madhya Pradesh",
                      "country": "India", "format": "json", "limit": 1})


def main():
    cache = json.load(open(CACHE, encoding="utf-8")) if os.path.exists(CACHE) else {"locality": {}, "pincode": {}}

    localities = [r["area"] for r in sql("""select area, count(*) n from public.businesses
                    where status='active' and lat is null and area is not null
                    group by 1 order by n desc""")]
    pincodes = [r["pincode"] for r in sql("""select pincode, count(*) n from public.businesses
                    where status='active' and lat is null and pincode is not null and pincode ~ '^[0-9]{6}$'
                    group by 1 order by n desc""")]
    print(f"to geocode: {len(localities)} localities, {len(pincodes)} pincodes "
          f"(cache holds {len(cache['locality'])}/{len(cache['pincode'])})", flush=True)
    if STATUS_ONLY:
        for k in ("locality", "pincode"):
            hit = sum(1 for v in cache[k].values() if v)
            print(f"  {k}: {len(cache[k])} cached, {hit} with coordinates")
        return

    for kind, keys in (("locality", localities), ("pincode", pincodes)):
        for i, key in enumerate(keys, 1):
            if key in cache[kind]:
                continue
            cache[kind][key] = lookup(kind, key)
            if i % 25 == 0 or i == len(keys):
                hit = sum(1 for v in cache[kind].values() if v)
                print(f"  {kind} {i}/{len(keys)} | resolved {hit}", flush=True)
                json.dump(cache, open(CACHE, "w", encoding="utf-8"))
            time.sleep(DELAY)
    json.dump(cache, open(CACHE, "w", encoding="utf-8"))

    # assign: pincode centroid is tighter than a whole neighbourhood, so prefer it
    rows = sql("""select id, area, pincode from public.businesses
                  where status='active' and lat is null""")
    loc, pin = cache["locality"], cache["pincode"]
    updates, from_pin, from_loc, nowhere = [], 0, 0, 0
    for r in rows:
        pc = (r.get("pincode") or "").strip()
        coords = pin.get(pc) if pc else None
        precision = "pincode"
        if not coords:
            coords = loc.get((r.get("area") or "").strip())
            precision = "locality"
        if not coords:
            nowhere += 1
            continue
        updates.append((r["id"], coords[0], coords[1], precision))
        from_pin += 1 if precision == "pincode" else 0
        from_loc += 1 if precision == "locality" else 0
    print(f"assigning: {len(updates)} rows ({from_pin} pincode-level, {from_loc} locality-level), "
          f"{nowhere} unplaceable", flush=True)
    for i in range(0, len(updates), 2000):
        chunk = updates[i:i+2000]
        vals = ",".join(f"({bid},{lat},{lng},'{prec}')" for bid, lat, lng, prec in chunk)
        sql(f"""update public.businesses b
                set lat = m.lat, lng = m.lng,
                    raw = coalesce(b.raw,'{{}}'::jsonb) || jsonb_build_object('geo_precision', m.prec)
                from (values {vals}) as m(id, lat, lng, prec) where b.id = m.id""")
        print(f"  written {min(i+2000, len(updates))}/{len(updates)}", flush=True)
    print("coverage:", sql("""select count(*) filter (where lat is not null) with_coords,
                                    count(*) n,
                                    count(*) filter (where raw->>'geo_precision' = 'pincode') pincode_level
                             from public.businesses where status='active'""")[0], flush=True)


if __name__ == "__main__":
    main()
