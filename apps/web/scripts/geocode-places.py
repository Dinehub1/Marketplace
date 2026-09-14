#!/usr/bin/env python3
"""Place every listing on the map by geocoding 366 localities and ~N pincodes once.

WHY NOT PER-BUSINESS
--------------------
The first version asked a geocoder for "shop name, locality, Indore" one row at a
time: 20 requests produced 1 hit. OSM does not hold every small Indian business
as a named point, so name lookups are the wrong question and 18k of them would
have burned five hours for almost nothing.

Geocoding runs through Photon (komoot). Nominatim was tried first and blocked
this machine with HTTP 429 after ~250 lookups - the symptom was a job that
appeared to stall, with requests that worked when repeated by hand.

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
DELAY = 0.7
STATUS_ONLY = "--status" in sys.argv
# Chunked runs: the background supervisor proved unreliable for long jobs,
# so this can be driven in bounded foreground batches instead.
MAXLOOK = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else None

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


def photon(q: str):
    """Photon (komoot, OpenStreetMap data): keyless and not rate-blocked.

    Nominatim was the first choice and blocked this machine with HTTP 429 after
    the first ~250 lookups, which is what looked like a stalled job. Photon
    answers the same questions from the same data without the hard limit.
    """
    url = "https://photon.komoot.io/api/?" + urllib.parse.urlencode({"q": q, "limit": 1, "lang": "en"})
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode() or "{}")
    except Exception:
        return None
    feats = data.get("features") or []
    if not feats:
        return None
    try:
        lon, lat = feats[0]["geometry"]["coordinates"]
    except Exception:
        return None
    # Indore only: a same-named locality elsewhere in India must not be accepted.
    if not (22.35 <= lat <= 23.05 and 75.55 <= lon <= 76.25):
        return None
    return round(lat, 6), round(lon, 6)


def lookup(kind: str, key: str):
    """kind: 'locality' | 'pincode'."""
    if kind == "locality":
        return photon("Indore, Madhya Pradesh" if key.lower() == "indore" else f"{key}, Indore")
    return photon(f"{key}, Indore")


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

    looked_up = 0
    for kind, keys in (("pincode", pincodes), ("locality", localities)):
        for i, key in enumerate(keys, 1):
            if key in cache[kind]:
                continue
            if MAXLOOK is not None and looked_up >= MAXLOOK:
                json.dump(cache, open(CACHE, "w", encoding="utf-8"))
                print(f"stopping after {looked_up} lookups - rerun to continue", flush=True)
                return
            cache[kind][key] = lookup(kind, key)
            looked_up += 1
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
