#!/usr/bin/env python3
"""Append one entry to the build log that shots.dropby.co.in renders.

Why a script instead of the agent editing JSON by hand: the hourly build job must
be able to publish its result in one command, and a half-written JSON file would
take the gallery down with it (the page reads this file on every request). So the
file is written atomically — temp file, then replace — and every field is
sanitised and length-capped here rather than trusted from the caller.

Usage:
  python scripts/build-log.py --title "Promote PDF toolkit to ready" \
      --kind fix --status done \
      --evidence "POST /api/job job_id=36 merged 2 PDFs -> 1333-byte output, fetched 200" \
      --next "Wrap the invoice screen in the new tool frame" \
      --link "Stills:https://shots.dropby.co.in/shots"

Kinds: fix | feature | research | design.  Status: done | blocked | partial.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from datetime import datetime, timezone

LOG = os.environ.get("BUILD_LOG", r"C:\Users\Administrator\shots\build-log.json")
LIMIT = 80
MAX = 400  # characters per free-text field


def clean(text: str) -> str:
    text = " ".join((text or "").split())
    return text[:MAX]


def load() -> dict:
    try:
        with open(LOG, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, dict) and isinstance(data.get("entries"), list):
            return data
    except FileNotFoundError:
        pass
    except Exception:
        # A corrupt log must not stop the log from working again.
        pass
    return {"entries": []}


def save(data: dict) -> None:
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(LOG), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, LOG)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--kind", default="feature", choices=["fix", "feature", "research", "design"])
    ap.add_argument("--status", default="done", choices=["done", "blocked", "partial"])
    ap.add_argument("--evidence", default="")
    ap.add_argument("--next", dest="nxt", default="")
    ap.add_argument("--link", action="append", default=[])
    ap.add_argument("--at", default="")
    a = ap.parse_args()

    links = []
    for item in a.link:
        label, _, url = item.partition(":")
        if url:
            links.append({"label": clean(label), "url": url.strip()})

    entry = {
        "at": a.at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "title": clean(a.title),
        "kind": a.kind,
        "status": a.status,
        "evidence": clean(a.evidence),
        "next": clean(a.nxt),
        "links": links,
    }
    data = load()
    # Newest first, and a repeat of the same title replaces the older one so a
    # retried run does not fill the page with the same line twice.
    data["entries"] = [e for e in data["entries"] if e.get("title") != entry["title"]]
    data["entries"].insert(0, entry)
    data["entries"] = data["entries"][:LIMIT]
    data["updated"] = entry["at"]
    save(data)
    print(f"logged: [{entry['status']}] {entry['title']} ({len(data['entries'])} entries in {LOG})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
