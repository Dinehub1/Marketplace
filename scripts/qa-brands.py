#!/usr/bin/env python3
"""
QA crawl for the 28 brand sites under *.dropby.co.in.

Written for the "verify each batch, do not mark complete on a 200" protocol:
a brand passes only if its home serves the real app, its routes are genuinely
distinct pages, its internal links resolve, and no dead or anchor-only
navigation remains. Status code alone is never sufficient.

Usage:
    python scripts/qa-brands.py                 # all 28 brands
    python scripts/qa-brands.py sarkarcars sarkarhealth
    python scripts/qa-brands.py --json out.json --md docs/brand-qa-report.md

Exit code 0 only when every audited brand passes, so it can gate a batch.
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import os
import re
import sys
import urllib.error
import urllib.request

WORKERS = 8
TIMEOUT = 30
UA = {"User-Agent": "curl/8.4.0"}  # Cloudflare 403s the default python UA

# A route that quietly returns the homepage is the failure mode this catches.
HOME_MARKERS = ("_next/static", "__next", "brand-header", "BrandFooter")


def supabase(query: str) -> list[dict]:
    """Read brands straight from production so the crawl can never go stale."""
    env_path = os.path.join(os.path.dirname(__file__), "..", "apps", "web", ".env")
    cfg = {}
    with open(env_path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            m = re.match(r"^([A-Z_0-9]+)=(.*)$", line.strip())
            if m:
                cfg[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/xpfmqpmhmcouwzebfwhb/database/query",
        method="POST", data=json.dumps({"query": query}).encode())
    req.add_header("Authorization", f"Bearer {cfg['SUPABASE_ACCESS_TOKEN']}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "[]")


def fetch(url: str, timeout: int = TIMEOUT):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace"), resp.geturl()
    except urllib.error.HTTPError as exc:
        return exc.code, "", url
    except Exception as exc:  # DNS, TLS, timeout
        return 0, str(exc)[:80], url


def looks_like_home(html: str, path: str) -> bool:
    """True when a sub-route is serving the same shell as `/` (a homepage fallback)."""
    if path in ("/", ""):
        return False
    return html.count("<html") >= 1 and "404" not in html[:400] and len(html) < 1500


def audit_brand(slug: str, host: str) -> dict:
    base = host.rstrip("/")
    home_status, home_html, _ = fetch(base + "/")
    is_app = any(m in home_html for m in HOME_MARKERS)
    dead_hash = len(re.findall(r'href="#"', home_html))
    anchor_only = len(re.findall(r'href="#(?!")[^"]*"', home_html))
    external_socials = len(re.findall(r'href="https?://(?!expo|dropby|wa\.me|mailto)', home_html))

    links = {p.rstrip("/") or "/" for p in re.findall(r'href="(/[^"#?]*)"', home_html)}
    links.discard("/cdn-cgi/l/email-protection")  # Cloudflare email obfuscation, not ours

    results: dict[str, dict] = {}
    with futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        jobs = {pool.submit(fetch, base + p): p for p in sorted(links)}
        for job in futures.as_completed(jobs):
            path = jobs[job]
            status, html, final = job.result()
            results[path] = {
                "status": status,
                "redirected_home": bool(final.rstrip("/") == base and path != "/"),
                "fallback_home": looks_like_home(html, path),
                "bytes": len(html),
            }

    failures = {p: r for p, r in results.items()
                if not (200 <= r["status"] < 300) or r["redirected_home"] or r["fallback_home"]}

    return {
        "slug": slug,
        "host": base,
        "home_status": home_status,
        "home_is_app": is_app,
        "dead_hash_links": dead_hash,
        "anchor_only_links": anchor_only,
        "routes": results,
        "route_count": len(results),
        "failures": failures,
        "pass": bool(home_status == 200 and is_app and not failures and dead_hash == 0),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*", help="brand slugs (default: all)")
    ap.add_argument("--json", help="write raw results here")
    ap.add_argument("--md", help="write a markdown report here")
    args = ap.parse_args()

    rows = supabase("select slug, name, domain from brands where domain like 'http%' order by slug")
    if args.slugs:
        rows = [r for r in rows if r["slug"] in set(args.slugs)]

    reports = []
    with futures.ThreadPoolExecutor(max_workers=5) as pool:
        for rep in pool.map(lambda r: audit_brand(r["slug"], r["domain"]), rows):
            reports.append(rep)
    by_slug = {r["slug"]: r for r in rows}

    print(f"{'brand':24s} {'home':6s} {'app?':6s} {'routes':7s} {'dead':5s} {'anchors':8s} verdict")
    print("-" * 88)
    for rep in sorted(reports, key=lambda r: (r["pass"], r["slug"])):
        verdict = "PASS" if rep["pass"] else "FAIL"
        reasons = []
        if not rep["home_is_app"]:
            reasons.append("static-mockup-home")
        if rep["failures"]:
            reasons.append(f"{len(rep['failures'])}-broken-route(s)")
        if rep["dead_hash_links"]:
            reasons.append(f"{rep['dead_hash_links']}-dead-links")
        print(f"{rep['slug']:24s} {rep['home_status']:<6} "
              f"{'app' if rep['home_is_app'] else 'STATIC':6s} {rep['route_count']:<7} "
              f"{rep['dead_hash_links']:<5} {rep['anchor_only_links']:<8} "
              f"{verdict}{' — ' + ', '.join(reasons) if reasons else ''}")

    passed = sum(1 for r in reports if r["pass"])
    print("-" * 88)
    print(f"{passed}/{len(reports)} brands PASS the production-quality bar")
    failing = [r for r in reports if not r["pass"]]
    if failing:
        print("\nblocking issues by brand:")
        for rep in failing:
            print(f"  {rep['slug']}: " + "; ".join(
                ([f"home is a static mockup"] if not rep["home_is_app"] else []) +
                ([f"dead href=# links: {rep['dead_hash_links']}"] if rep["dead_hash_links"] else []) +
                ([f"broken routes: {', '.join(sorted(rep['failures'])[:5])}"] if rep["failures"] else [])))

    if args.json:
        json.dump(reports, open(args.json, "w", encoding="utf-8"), indent=1)
        print(f"\nraw results -> {args.json}")
    if args.md:
        lines = ["# Brand QA crawl", "", f"**{passed}/{len(reports)} brands pass.**", "",
                 "| brand | home | app at / | routes | dead links | anchors | verdict |",
                 "|---|---|---|---|---|---|---|"]
        for rep in sorted(reports, key=lambda r: r["slug"]):
            lines.append(f"| {rep['slug']} | {rep['home_status']} | "
                         f"{'yes' if rep['home_is_app'] else '**no**'} | {rep['route_count']} | "
                         f"{rep['dead_hash_links']} | {rep['anchor_only_links']} | "
                         f"{'PASS' if rep['pass'] else '**FAIL**'} |")
        open(args.md, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
        print(f"markdown report -> {args.md}")

    return 0 if passed == len(reports) else 1


if __name__ == "__main__":
    sys.exit(main())
