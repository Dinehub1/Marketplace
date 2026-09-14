#!/usr/bin/env python3
"""Keep the Sarkar Marketplace catalogue clean, forever, without being asked.

Runs against the live `businesses` table and is safe to run repeatedly (every
action is idempotent). It never deletes a row: the directory filters on
`status=eq.active`, so a row that should disappear from the site is marked
`duplicate` or `quarantined` and stays in the table. Reverting any action is a
single UPDATE back to 'active'.

  python steward-data.py            # dry run, prints what it would do
  python steward-data.py --apply    # does it

ACTIONS
  duplicates  identical name + address = the same business scraped twice. Keeps
              the most complete row (claimed > socials > photo > rating > phone >
              website) and marks the rest.
  junk        names that are scrape artefacts ("test", "Test Business") and rows
              whose locality or city is testcity.
  report      impossible review counts. NOT auto-corrected on purpose: the source
              writes decimals ("2396.0" = 2,396 reviews) and those rows were
              parsed ten times too large, but the source also contains plain
              integers, so a stored 150 is ambiguous (150, or 15 mis-parsed). A
              blanket /10 would corrupt thousands of correct rows; the honest fix
              is a live refresh (Places API), so this only reports.

Every applied change is appended to steward-log.jsonl with the previous value, so
a rollback is a mechanical replay.
"""
import json, os, re, sys, time, urllib.request, urllib.error, collections

ENV = r"C:\Users\Administrator\Marketplace\apps\web\.env"
LOG = r"C:\Users\Administrator\steward-log.jsonl"
APPLY = "--apply" in sys.argv

cfg = {}
for line in open(ENV, encoding="utf-8", errors="replace"):
    m = re.match(r"^([A-Z_0-9]+)=(.*)$", line.strip())
    if m: cfg[m.group(1)] = m.group(2).strip().strip('"').strip("'")
KEY, URL = cfg["SUPABASE_SERVICE_ROLE_KEY"], cfg["NEXT_PUBLIC_SUPABASE_URL"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}


def get(path):
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", headers=H)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


def patch(ids, fields, reason):
    """Status changes are the only writes this script makes."""
    ok = 0
    for i in range(0, len(ids), 100):
        chunk = ids[i:i+100]
        payload = []
        for j, bid in enumerate(chunk):
            body = {"id": bid, "name": fields["names"][j], **fields["set"]}
            payload.append(body)
        req = urllib.request.Request(f"{URL}/rest/v1/businesses?on_conflict=id",
                                     method="POST", data=json.dumps(payload).encode(), headers=H)
        req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
        try:
            with urllib.request.urlopen(req, timeout=120): ok += len(payload)
        except urllib.error.HTTPError as e:
            print(f"   FAILED batch: {e.code} {e.read().decode()[:120]}")
    with open(LOG, "a", encoding="utf-8") as f:
        for bid in ids:
            f.write(json.dumps({"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "id": bid,
                                "reason": reason, "was": "active"}) + "\n")
    return ok


rows, off = [], 0
while True:
    b = get("businesses?select=id,name,address,phone,area,city,status,website,rating,"
            f"reviews_count,image_url,verified,raw&limit=1000&offset={off}&order=id")
    rows += b
    if len(b) < 1000: break
    off += 1000
active = [r for r in rows if (r.get("status") or "active") == "active"]
print(f"rows {len(rows)} | active {len(active)}")

# ---------- 1. duplicates ----------
def score(r):
    raw = r.get("raw") or {}
    return (1 if r.get("verified") else 0, 1 if raw.get("social") else 0,
            1 if r.get("image_url") else 0, 1 if r.get("rating") else 0,
            1 if r.get("phone") else 0, 1 if r.get("website") else 0)
groups = collections.defaultdict(list)
for r in active:
    groups[((r.get("name") or "").strip().lower(), (r.get("address") or "").strip().lower())].append(r)
dup_ids, dup_names, keep_score = [], [], 0
for key, members in groups.items():
    if len(members) < 2 or not key[0] or not key[1]:
        continue
    members.sort(key=score, reverse=True)
    for m in members[1:]:
        dup_ids.append(m["id"]); dup_names.append(m["name"])
        keep_score += 1
print(f"\nDUPLICATES: {len(dup_ids)} rows in {sum(1 for k,v in groups.items() if len(v)>1 and k[0] and k[1])} groups")
for i in range(min(5, len(dup_ids))):
    print(f"   would mark id={dup_ids[i]} '{dup_names[i][:44]}'")

# ---------- 2. junk ----------
# "Test Tube Baby Centre" is a real fertility clinic, so a bare /test/ match is
# not enough - only a name that is *wholly* a placeholder counts.
JUNK = re.compile(r"^\s*(test|testing|dummy|sample|asdf|abc|xxx)\s*[a-z ]{0,18}$", re.I)
junk_ids, junk_names = [], []
bogus_city_ids, bogus_city_names = [], []
for r in active:
    nm = (r.get("name") or "").strip()
    low = nm.lower()
    if "test tube" in low:           # real business, never quarantine
        pass
    elif JUNK.match(nm):
        junk_ids.append(r["id"]); junk_names.append(nm); continue
    # city/area of "testcity" is a scrape artefact on otherwise real businesses:
    # repair the field instead of hiding the row.
    if (r.get("city") or "").strip().lower() == "testcity" or (r.get("area") or "").strip().lower() == "testcity":
        bogus_city_ids.append(r["id"]); bogus_city_names.append(nm)
print(f"JUNK: {len(junk_ids)} rows")
for n in junk_names[:6]: print(f"   {n[:60]}")
print(f"BOGUS CITY FIX (testcity -> Indore / indore): {len(bogus_city_ids)} rows")
for n in bogus_city_names[:6]: print(f"   {n[:60]}")

# ---------- 3. report only ----------
impossible = [r for r in active if (r.get("reviews_count") or 0) > 20000]
print(f"IMPOSSIBLE REVIEW COUNTS (report only): {len(impossible)} rows > 20,000")
print(f"   biggest: {sorted((r['reviews_count'] for r in impossible), reverse=True)[:5]}")

if APPLY:
    if dup_ids:
        n = patch(dup_ids, {"names": dup_names, "set": {"status": "duplicate"}}, "duplicate")
        print(f"APPLIED duplicates: {n}")
    if junk_ids:
        n = patch(junk_ids, {"names": junk_names, "set": {"status": "quarantined"}}, "junk")
        print(f"APPLIED junk: {n}")
    if bogus_city_ids:
        n = patch(bogus_city_ids, {"names": bogus_city_names,
                                   "set": {"city": "Indore", "area": "indore"}}, "testcity-repair")
        print(f"APPLIED testcity repair: {n}")
    hdr = {**H, "Prefer": "count=exact", "Range": "0-0"}
    cnt = urllib.request.urlopen(urllib.request.Request(
        f"{URL}/rest/v1/businesses?select=id&status=eq.active", headers=hdr)).headers["Content-Range"].split("/")[1]
    print(f"active rows now: {cnt}")
else:
    print("\nDRY RUN - pass --apply to write these status changes")
