#!/usr/bin/env python3
"""Turn 8,000 junk `area` strings into canonical Indore localities.

WHY
---
`area` was derived per-row by a crude parser, so the same place appears as
"vijay nagar", "Vijaynagar", "vijay nagar indore", "Scheme No 54" and "Sector A".
8,015 distinct values across 23k rows means a category x locality landing page
("plumber in Vijay Nagar") can almost never clear its minimum listing count, so
this data problem - not the page template - is what keeps locality SEO thin.

HOW
---
Localities are read out of the comma-separated ADDRESS (where they actually
appear: "Shop 4, Vijay Nagar, Indore, 452010"), matched longest-alias-first
against a canonical dictionary, and written back title-cased. The original string
is preserved in raw.locality_raw so nothing is lost and the mapping is auditable.
Falls back to 'indore' (the codebase's existing "no locality found" value), never
to a guess.

  python normalize-localities.py             # dry run + report
  python normalize-localities.py --apply     # writes `area`
"""
import json, re, sys, urllib.request, collections

ENV = r"C:\Users\Administrator\Marketplace\apps\web\.env"
REF = "xpfmqpmhmcouwzebfwhb"
APPLY = "--apply" in sys.argv

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


# canonical name -> the strings that mean it (longest match wins, so put the
# most specific aliases in; "rd"/"road" variants are normalised separately)
CANON = {
    "Vijay Nagar": ["vijay nagar", "vijaynagar", "vijay ngr"],
    "Scheme No 54": ["scheme no 54", "scheme 54", "scheme no. 54", "scheme54", "pu4", "pu-4"],
    "Sector A": ["sector a", "sec a"], "Sector B": ["sector b", "sec b"],
    "Sector C": ["sector c", "sec c"], "Sector D": ["sector d", "sec d"],
    "AB Road": ["ab road", "a b road", "a.b. road", "ab rd", "a b rd"],
    "Mahatma Gandhi Road": ["mahatma gandhi road", "mahatma gandhi rd", "mg road", "mg rd", "m.g. road"],
    "Jawahar Marg": ["jawahar marg", "jawahar road", "jawahar rd"],
    "Annapurna Road": ["annapurna road", "annapurna rd", "annapurna"],
    "Sapna Sangeeta Road": ["sapna sangeeta road", "sapna sangeeta rd", "sapna sangeeta"],
    "Airport Road": ["airport road", "airport rd"],
    "RNT Marg": ["rnt marg", "r n t marg", "rnt road"],
    "Jail Road": ["jail road", "jail rd"],
    "Maharani Road": ["maharani road", "maharani rd"],
    "Dhar Road": ["dhar road", "dhar rd"],
    "Kanadia Road": ["kanadia main road", "kanadia road", "kanadia rd", "kanadia"],
    "Ring Road": ["ring road", "ring rd"],
    "Netaji Subhash Marg": ["netaji subhash marg", "subhash marg", "netaji subhash"],
    "Nanda Nagar": ["nanda nagar", "nandanagar"],
    "New Palasia": ["new palasia", "palasia"],
    "Old Palasia": ["old palasia"],
    "South Tukoganj": ["south tukoganj", "tukoganj"],
    "Siyaganj": ["new siyaganj", "siyaganj"],
    "Sudama Nagar": ["sudama nagar", "sudamanagar"],
    "Mahalaxmi Nagar": ["mahalaxmi nagar", "maha laxmi nagar"],
    "Manorama Ganj": ["manorama ganj", "manoramaganj"],
    "Usha Nagar": ["usha nagar", "ushanagar"],
    "Race Course Road": ["race course road", "racecourse road", "race course rd"],
    "Snehnagar": ["snehnagar", "sneha nagar"],
    "Mechanic Nagar": ["mechanic nagar"],
    "Transport Nagar": ["transport nagar"],
    "Nihalpura": ["nihalpura"],
    "Bhawarkuan": ["bhawarkua main road", "bhawarkuan", "bhawarkua"],
    "Rau": ["rau"], "Mhow": ["mhow"], "Sanwer": ["sanwer"], "Dewas Naka": ["dewas naka"],
    "Bicholi Mardana": ["bicholi mardana"], "Bicholi Hapsi": ["bicholi hapsi"],
    "Pipliyahana": ["pipliyahana", "piplia hana"],
    "Khajrana": ["khajrana"], "Bapat Square": ["bapat square", "bapat chouraha"],
    "Rajwada": ["rajwada", "rajwada chowk"],
    "Laxmi Nagar": ["laxmi nagar", "lakshmi nagar"],
    "Tilak Nagar": ["tilak nagar"], "Silicon City": ["silicon city"],
    "Scheme No 78": ["scheme no 78", "scheme 78"],
    "Scheme No 94": ["scheme no 94", "scheme 94"],
    "Scheme No 103": ["scheme no 103", "scheme 103"],
    "Scheme No 114": ["scheme no 114", "scheme 114"],
    "Scheme No 140": ["scheme no 140", "scheme 140"],
    "Nipania": ["nipania"], "Bengali Square": ["bengali square", "bengali chouraha"],
    "Rajendra Nagar": ["rajendra nagar"], "Vidya Nagar": ["vidya nagar"],
    "Saket Nagar": ["saket nagar"], "Shalimar Township": ["shalimar township"],
    "Musakhedi": ["musakhedi"], "Nayapura": ["nayapura"], "Chhawni": ["chhawni", "chhawani"],
    "Sapna Sangeeta": ["sapna sangeeta"],
    "Malharganj": ["malharganj", "malhar ganj"], "Bartan Bazaar": ["artan bazaar", "bartan bazaar"],
    "Dawa Bazar": ["dawa bazar"], "Sitlamata Bazaar": ["sitlamata bazaar", "sitla mata"],
    "Ranipura": ["ranipura"], "Mari Mata Square": ["mari mata square", "marimata"],
    "Vishnupuri": ["vishnupuri"], "Banganga": ["banganga"],
    "Vallabh Nagar": ["vallabh nagar"], "Krishna Bagh": ["krishna bagh"],
    "Pardesipura": ["pardesipura"], "Azad Nagar": ["azad nagar"],
    "Khatiwala Tank": ["khatiwala tank"], "Nehru Nagar": ["nehru nagar"],
    "Jaora Compound": ["jaora compound"], "Lohamandi": ["lohamandi"],
    "Goma Ki Phel": ["goma ki phel"], "Chandravatiganj": ["chandravatiganj"],
    "Gandhi Nagar": ["gandhi nagar"], "Shivaji Nagar": ["shivaji nagar"],
    "Patel Nagar": ["patel nagar"], "Sangam Nagar": ["sangam nagar"],
    "Sukhlia": ["sukhlia", "sukliya"], "Tejaji Nagar": ["tejaji nagar"],
    "Manglia": ["manglia"], "Betma": ["betma"], "Manpur": ["manpur"],
}
ALIAS = {}
for canon, aliases in CANON.items():
    for a in aliases:
        ALIAS[a.lower()] = canon
ALIAS_ORDER = sorted(ALIAS, key=len, reverse=True)   # longest alias wins
ABBR = [(r"\brd\.?\b", "road"), (r"\bngr\b", "nagar"), (r"\bcol\.?\b", "colony"),
        (r"\bchowk\b", "chowk"), (r"\bextn\b", "extension"), (r"\bno\.\b", "no")]


def canonicalise(text):
    if not text: return None
    t = " " + re.sub(r"[^a-z0-9. ]+", " ", str(text).lower()) + " "
    t = re.sub(r"\s+", " ", t)
    for a in ALIAS_ORDER:
        if f" {a} " in t or f" {a}," in t:
            return ALIAS[a]
    return None


def generic(area):
    """Last resort for a real-looking area that is not in the dictionary."""
    if not area: return None
    low = area.strip().lower()
    if low in ("indore", "-", "na", "n/a", "null", "testcity", ""): return None
    for pat, rep in ABBR: low = re.sub(pat, rep, low)
    low = re.sub(r"\s+", " ", low).strip()
    if len(low) < 4 or len(low) > 30: return None
    if re.search(r"\d{3,}", low): return None
    return " ".join(w.capitalize() for w in low.split())


rows = sql("select id, address, area from public.businesses where status='active'")
print(f"active rows: {len(rows)}")
mapping, stats = {}, collections.Counter()
provisional = {}   # rows whose locality came from the permissive generic path
for r in rows:
    loc = None
    parts = [p.strip() for p in (r["address"] or "").split(",") if p.strip()]
    for p in parts:                                  # address parts first
        loc = canonicalise(p)
        if loc: stats["from address"] += 1; break
    if not loc:
        loc = canonicalise(r["area"] or "")
        if loc: stats["from existing area"] += 1
    if not loc:
        loc = generic(r["area"])
        if loc:
            stats["generic candidate"] += 1
            provisional[r["id"]] = loc               # decided by frequency below
            continue
    mapping[r["id"]] = loc or "indore"
    if not loc: stats["no locality"] += 1

# A real locality recurs. Drop one-off generic strings to 'indore' rather than
# inventing thousands of localities that no page could ever have listings for.
freq = collections.Counter(provisional.values())
KEEP = {k for k, v in freq.items() if v >= 5}
kept = dropped = 0
for bid, loc in provisional.items():
    if loc in KEEP:
        mapping[bid] = loc; kept += 1
    else:
        mapping[bid] = "indore"; dropped += 1
stats["generic kept (recurs >=5)"] = kept
stats["generic dropped (one-off)"] = dropped
print("\nresolution:", dict(stats))
print("distinct localities now:", len(set(mapping.values())))
for loc, n in collections.Counter(mapping.values()).most_common(20):
    print(f"   {n:5d}  {loc}")

# how many category x locality pages clear 5 listings after this?
pairs = sql("""select category, count(*) n from public.businesses where status='active' group by 1""")
cat_of = {r["category"]: r["n"] for r in rows and [] or []}
cats = {r["id"]: r["category"] for r in sql("select id, category from public.businesses where status='active'")}
paircount = collections.Counter((cats[i], loc) for i, loc in mapping.items() if cats.get(i))
strong = {k: v for k, v in paircount.items() if v >= 5 and k[1] != "indore"}
print(f"\ncategory x locality pages with >=5 listings: {len(strong)}  (was 92)")

if APPLY:
    items = list(mapping.items())
    done = 0
    for i in range(0, len(items), 4000):
        chunk = items[i:i+4000]
        values = ",".join(f"({bid},'{loc.replace(chr(39), chr(39)*2)}')" for bid, loc in chunk)
        sql(f"""update public.businesses b set area = m.loc,
                       raw = coalesce(b.raw,'{{}}'::jsonb) || jsonb_build_object('locality_raw', b.area)
                from (values {values}) as m(id, loc) where b.id = m.id""")
        done += len(chunk)
    print(f"applied to {done} rows")
    print("distinct areas in DB now:", sql("select count(distinct area) c from public.businesses where status='active'")[0]["c"])
else:
    print("\nDRY RUN - pass --apply to write")
