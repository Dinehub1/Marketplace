#!/usr/bin/env python3
"""check-resume.py — the résumé layout rules, asserted with nothing installed.

The résumé PDF is drawn by pdfcpu on the product VM, which is exactly why this check
exists: the layout can be wrong on a machine that has no PDF library at all, and this is
the machine that has none. `services/tools/resume_layout.py` holds the arithmetic and
imports nothing; this file loads it, feeds it résumés a person would actually write, and
asserts the promises the screen and the store listing make.

Run:  python3 scripts/check-resume.py     (or `python` on Windows)
Exit: 0 every rule holds, 1 something in the layout is wrong
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "services" / "tools"))

import resume_layout as R  # noqa: E402  (path set above on purpose)

OK = 0
BAD = 0
SECTIONS = ("SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS")


def check(what: str, cond: bool, detail: str = "") -> None:
    global OK, BAD
    if cond:
        OK += 1
        print(f"  ok   {what}")
    else:
        BAD += 1
        print(f"  FAIL {what}{f' — {detail}' if detail else ''}")


def raises(what: str, fn, needle: str = "") -> None:
    try:
        fn()
    except R.LayoutError as exc:
        check(what, needle.lower() in str(exc).lower(), f"message was {str(exc)!r}")
    except Exception as exc:  # noqa: BLE001
        check(what, False, f"raised {type(exc).__name__} instead of LayoutError: {exc}")
    else:
        check(what, False, "did not raise")


def blocks_of(result: dict) -> list[dict]:
    return result["blocks"]


def last_block_per_page(result: dict) -> dict[int, dict]:
    out: dict[int, dict] = {}
    for b in blocks_of(result):
        cur = out.get(b["page"])
        if cur is None or b["y_top"] > cur["y_top"]:
            out[b["page"]] = b
    return out


def body_page_spread(result: dict, text: str) -> set[int]:
    """The pages holding a body line of `text` — every emitted line is a substring of it."""
    return {b["page"] for b in blocks_of(result) if b["value"].replace("• ", "") in text}


# --- fixtures --------------------------------------------------------------------
MINIMAL = {"name": "Asha Verma", "skills": "Python, SQL"}

TYPICAL = {
    "name": "Asha Verma",
    "headline": "Backend engineer",
    "email": "asha@example.com",
    "phone": "+91 90000 00000",
    "city": "Indore",
    "summary": "Six years building payment systems, mostly in Python and Postgres.",
    "experience": [
        {"role": "Senior Engineer", "org": "PaisaFlow", "from": "2023", "to": "now",
         "bullets": ["Led the ledger rewrite that cut settlement time from hours to minutes.",
                     "Owned the reconciliation job and its on-call runbook."]},
        {"role": "Engineer", "org": "SarkarPay", "from": "2020", "to": "2023",
         "bullets": ["Built the UPI webhook path and the retry queue behind it."]},
    ],
    "education": [{"course": "B.E. Computer Science", "org": "RGPV", "from": "2016", "to": "2020",
                   "note": "First class"}],
    "skills": ["Python", "Postgres", "Redis", "AWS", "payments"],
}

LONG_BULLET = (
    "Rebuilt the merchant onboarding flow end to end, including the KYC document check, the "
    "risk rules that decide which applications need a human, the webhook contract the partner "
    "banks integrate against, and the reconciliation report finance closes the month with, "
    "which took the median approval from nine days to under one and removed the manual "
    "spreadsheet that three teams had been maintaining in parallel for two years."
)

LONG = {
    "name": "Ravi Kumar",
    "email": "ravi@example.com",
    "summary": "Generalist engineer.",
    "experience": [
        {"role": f"Engineer {i}", "org": f"Company {i}", "from": "2015", "to": "2024",
         "bullets": [f"Did the work of role {i} with measurable results and owned it end to end.",
                     f"Ran the project that role {i} is remembered for across two teams."]}
        for i in range(1, 26)
    ],
    "skills": "Python, SQL, Docker, Kubernetes",
}


def main() -> int:
    print("check-resume — the layout rules for the résumé builder\n")

    print("a minimal résumé")
    m = R.layout(MINIMAL)
    check("one page", m["meta"]["pages"] == 1, f"got {m['meta']['pages']}")
    check("has the name on it", any(b["value"] == "Asha Verma" for b in blocks_of(m)))
    check("says the contact is missing rather than inventing one",
          any("no email" in w for w in m["warnings"]), f"warnings={m['warnings']}")
    check("warns that there is no experience",
          any("no work experience" in w for w in m["warnings"]))

    print("\na typical résumé")
    t = R.layout(TYPICAL)
    check("fits on one page", t["meta"]["pages"] == 1, f"got {t['meta']['pages']}")
    check("every section heading is present",
          set(SECTIONS) <= {b["value"] for b in blocks_of(t)})
    contact = next((b["value"] for b in blocks_of(t) if "asha@example.com" in b["value"]), "")
    check("the contact line is the email, the phone and the city, joined",
          contact.count("·") == 2 and all(x in contact for x in
                                          ("asha@example.com", "+91 90000 00000", "Indore")),
          f"got {contact!r}")
    check("no warning about contact", not any("no email" in w for w in t["warnings"]))
    check("no warning about experience", not any("no work experience" in w for w in t["warnings"]))

    print("\nthe page rules")
    check("no block starts below the bottom margin",
          all(b["y_top"] <= R.BOTTOM for b in blocks_of(t) + blocks_of(m)),
          f"lowest={max(b['y_top'] for b in blocks_of(t) + blocks_of(m))} > BOTTOM={R.BOTTOM}")
    check("nothing is drawn outside the left margin",
          all(b["x"] >= R.MARGIN - 0.01 for b in blocks_of(t)))
    check("a section heading is never the last thing on a page",
          all(last["value"] not in SECTIONS for last in last_block_per_page(t).values()),
          f"page(s) end on {[p for p, b in last_block_per_page(t).items() if b['value'] in SECTIONS]}")

    print("\nwrapping")
    width = R.CONTENT_W - 14
    wrapped = R.wrap(LONG_BULLET, R.BODY[1], width)
    limit = int(width / (R.BODY[1] * R.AVG_ADVANCE))
    check("a long bullet wraps to more than one line", len(wrapped) > 1, f"got {len(wrapped)}")
    check("wrapping loses no word and adds none",
          " ".join(wrapped).split() == LONG_BULLET.split())
    check("no wrapped line runs past the column", all(len(x) <= limit for x in wrapped),
          f"longest={max(len(x) for x in wrapped)} limit={limit}")
    check("wrap never returns nothing", R.wrap("", R.BODY[1], width) == [""])

    w = R.layout({**TYPICAL, "experience": [
        {"role": "Senior Engineer", "org": "PaisaFlow", "from": "2023", "to": "now",
         "bullets": [LONG_BULLET]}]})
    lines = [b for b in blocks_of(w) if b["value"].replace("• ", "") in LONG_BULLET]
    check("the wrapped bullet is drawn as several lines", len(lines) > 1, f"got {len(lines)}")
    check("a bullet is never split across a page break",
          len({b["page"] for b in lines}) == 1, f"pages={sorted({b['page'] for b in lines})}")
    check("it is marked as a bullet on its first line only",
          sum(1 for b in lines if b["value"].startswith("• ")) == 1)
    check("the words that survive are the ones the candidate wrote",
          " ".join(b["value"].replace("• ", "") for b in lines).split() == LONG_BULLET.split())

    print("\na résumé that cannot fit on one page")
    many = R.layout(LONG)
    pages = many["meta"]["pages"]
    check("it paginates", pages > 1, f"got {pages} page(s)")
    check("page numbers are contiguous from 1",
          sorted({b["page"] for b in blocks_of(many)}) == list(range(1, pages + 1)))
    check("no page is empty",
          all(any(b["page"] == n for b in blocks_of(many)) for n in range(1, pages + 1)))
    check("no block passes the bottom margin on any page",
          all(b["y_top"] <= R.BOTTOM for b in blocks_of(many)),
          f"lowest={max(b['y_top'] for b in blocks_of(many))}")
    check("no heading is stranded at the foot of any page",
          all(last["value"] not in SECTIONS for last in last_block_per_page(many).values()),
          f"page(s) end on {[p for p, b in last_block_per_page(many).items() if b['value'] in SECTIONS]}")
    check("a role never sits alone at the foot of a page either",
          all(last["font"] != R.ROLE[0] for last in last_block_per_page(many).values()))

    raises("more than the page limit is refused, not truncated",
           lambda: R.layout({**LONG, "experience": LONG["experience"] * 3}), "page")

    print("\nrefusals")
    raises("a résumé with no name is refused", lambda: R.layout({"skills": "Python"}), "name")
    raises("a résumé with nothing on it is refused",
           lambda: R.layout({"name": "Asha Verma"}), "nothing")
    raises("a non-object payload is refused", lambda: R.layout(["nope"]), "json object")

    print("\nthe fonts a base-14 PDF can actually draw")
    rupee = R.layout({"name": "Asha Verma", "summary": "Expected \u20b9 12,00,000",
                      "skills": "Python"})
    check("the rupee sign is transliterated, never emitted",
          not any("\u20b9" in b["value"] for b in blocks_of(rupee)))
    check("and it still says the amount",
          any("Rs. 12,00,000" in b["value"] for b in blocks_of(rupee)))
    curly = R.layout({"name": "Asha\u2019s CV", "skills": "Python"})
    check("curly apostrophes do not reach a base-14 font",
          all("\u2019" not in b["value"] for b in blocks_of(curly)))

    print("\nthe pdfcpu handoff")
    spec = R.to_pdfcpu(t)
    check("every page the layout made exists in the spec",
          set(spec["pages"]) == {str(n) for n in range(1, t["meta"]["pages"] + 1)},
          f"got {sorted(spec['pages'])}")
    laid = {(b["page"], b["value"]) for b in blocks_of(t)}
    drawn = {(int(p), x["value"]) for p, page in spec["pages"].items()
             for x in page["content"].get("text", [])}
    check("every block reaches the renderer", laid <= drawn, f"missing {sorted(laid - drawn)[:2]}")
    flipped = all(
        x["position"][1] == round(R.PAGE_H - b["y_top"], 1)
        for b in blocks_of(t)
        for x in spec["pages"][str(b["page"])]["content"]["text"] if x["value"] == b["value"]
    )
    check("the y axis is flipped exactly once", flipped)
    check("a section rule is drawn on the page its heading is on",
          all(any(r["page"] == rr["page"] for rr in t["rules"]) for r in t["rules"]))

    print(f"\n{'✓ every résumé rule holds' if not BAD else '✗ the layout is wrong'} — {OK} ok, {BAD} failed")
    return 1 if BAD else 0


if __name__ == "__main__":
    sys.exit(main())
