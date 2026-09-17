"""resume_layout — what fits on a résumé page, with no renderer in it.

Why this module is separate from `worker.py`: the résumé PDF is drawn by pdfcpu from a
layout JSON, and pdfcpu is a Windows binary that exists only on the product VM. The rules
that decide *what fits on a page* — wrapping, page breaks, never stranding a section
heading at the foot of a page — are the part that can quietly be wrong, and they are pure
arithmetic. Keeping them here means `scripts/check-resume.py` can assert every one of them
with plain `python3`, on any machine, with no PDF library, no Pillow and no pdfcpu.

The renderer's job is then only this: take `layout()["blocks"]` and put them on paper. It
cannot change what a page holds, which is the property that makes the check meaningful.

Coordinates. pdfcpu's `create` JSON puts the origin at the BOTTOM-LEFT, so a block's `y` is
`842 - distance_from_the_top`. This module computes in "distance from the top" because that
is how a page is written and read, and converts once, at the end, in `to_pdfcpu()`.

Fonts. The base-14 fonts are WinAnsi, which has no rupee sign; a missing glyph in a résumé
is worse than an abbreviation, so text is sanitised (see `sanitise`) rather than trusted.
"""
from __future__ import annotations

from typing import Any

# --- page geometry ---------------------------------------------------------------
PAGE_W, PAGE_H = 595.0, 842.0          # A4 in PDF points
MARGIN = 50.0
TOP = MARGIN
BOTTOM = PAGE_H - MARGIN               # content may not pass this
CONTENT_W = PAGE_W - 2 * MARGIN        # 495 pt

# --- type scale ------------------------------------------------------------------
NAME = ("Helvetica-Bold", 21)
HEADLINE = ("Helvetica", 11.5)
CONTACT = ("Helvetica", 9.5)
SECTION = ("Helvetica-Bold", 9.5)
ROLE = ("Helvetica-Bold", 11)
DATES = ("Helvetica", 9)
BODY = ("Helvetica", 10)
SKILLS = ("Helvetica", 10)

INK, MUTED, LABEL, RULE = "#0f172a", "#475569", "#94a3b8", "#cbd5e1"

# --- vertical rhythm, in points --------------------------------------------------
H_NAME, H_HEADLINE, H_CONTACT = 24.0, 15.0, 14.0
H_SECTION, H_ROLE, H_BULLET, H_GAP, H_ENTRY_GAP = 20.0, 15.0, 13.6, 13.0, 7.0

# Helvetica's average advance for mixed-case prose is a little under half the point size.
# This is deliberately a single documented constant rather than a font-metrics table: the
# renderer does the real measuring, and this number only decides where a line breaks, so the
# cost of being 5% off is one word moving to the next line, never a clipped word.
AVG_ADVANCE = 0.5

# A résumé longer than this is not a résumé. It is a stop, not a truncation: the caller is
# told, and nothing is silently dropped.
MAX_PAGES = 3

# A bullet that wraps past this many lines is a paragraph wearing a bullet. It is kept —
# dropping a candidate's own words would be the engine editing their CV — and warned about.
LONG_BULLET_LINES = 3


class LayoutError(ValueError):
    """The payload cannot be a résumé. The message is written for the person who sent it."""


def sanitise(value: Any) -> str:
    """Text that base-14 WinAnsi can actually draw, with whitespace collapsed.

    The rupee sign is the one substitution that matters here (résumés carry salary
    expectations), and it follows the invoice's precedent: `Rs.` prints everywhere, `₹`
    prints as a blank.
    """
    s = "" if value is None else str(value)
    s = s.replace("\u20b9", "Rs.").replace("\u2013", "-").replace("\u2014", "-")
    s = s.replace("\u2018", "'").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u00a0", " ")
    return " ".join(s.split())


def wrap(text: str, font_size: float, width: float) -> list[str]:
    """Greedy word wrap to `width` points. Never drops a word; never returns [].

    The final line can be an empty string only when the input had no words, so a caller
    that emits one line per entry cannot accidentally emit none.
    """
    limit = max(8, int(width / (font_size * AVG_ADVANCE)))
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    cur = words[0]
    for word in words[1:]:
        if len(cur) + 1 + len(word) <= limit:
            cur = f"{cur} {word}"
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


class _Page:
    __slots__ = ("n", "cursor", "blocks", "rules")

    def __init__(self, n: int) -> None:
        self.n = n
        self.cursor = TOP
        self.blocks: list[dict] = []
        self.rules: list[dict] = []

    def room(self) -> float:
        return BOTTOM - self.cursor

    def text(self, value: str, x: float, size: float, font: str, color: str = INK) -> None:
        self.blocks.append({
            "page": self.n, "value": value, "x": round(x, 1), "y_top": round(self.cursor, 1),
            "size": size, "font": font, "color": color,
        })

    def rule(self, x1: float, x2: float) -> None:
        self.rules.append({"page": self.n, "x1": round(x1, 1), "x2": round(x2, 1),
                           "y_top": round(self.cursor, 1)})


class _Doc:
    """A page set that decides page breaks. Every public method returns the space used."""

    def __init__(self) -> None:
        self.pages: list[_Page] = [_Page(1)]
        self.warnings: list[str] = []

    @property
    def page(self) -> _Page:
        return self.pages[-1]

    def new_page(self) -> None:
        if len(self.pages) >= MAX_PAGES:
            raise LayoutError(
                f"this résumé needs more than {MAX_PAGES} pages; shorten it or split it into "
                "a one-page CV plus a separate annexure"
            )
        self.pages.append(_Page(len(self.pages) + 1))

    def need(self, height: float) -> None:
        """Page-break when `height` will not fit. Called with a whole unit's height, so a
        heading can never be the last thing on a page — the unit that breaks is the one
        that would have been split. A unit taller than a fresh page does not break at all:
        breaking would not help, and looping on an empty page is how a layout hangs."""
        if self.page.room() < height and self.page.blocks:
            self.new_page()

    # -- units -------------------------------------------------------------------
    def section(self, label: str) -> None:
        # Heading plus the first body line must fit together, or the heading moves too.
        self.need(H_SECTION + H_ROLE)
        self.page.text(label.upper(), MARGIN, SECTION[1], SECTION[0], color=LABEL)
        self.page.cursor += H_SECTION - 7
        self.page.rule(MARGIN, PAGE_W - MARGIN)
        self.page.cursor += 7

    def line(self, value: str, size: float, font: str, x: float = MARGIN,
             color: str = INK, indent: float = 0.0, height: float = H_BULLET) -> None:
        width = CONTENT_W - indent
        for part in wrap(value, size, width):
            self.need(height)
            self.page.text(part, x, size, font, color)
            self.page.cursor += height

    def role_line(self, left: str, right: str) -> None:
        self.need(H_ROLE)
        size = ROLE[1]
        self.page.text(left, MARGIN, ROLE[1], ROLE[0])
        if right:
            # Right-aligned by estimating from the string's own length, the way the invoice
            # right-aligns its money column. It is an estimate; the alternative is a text
            # metrics table this engine deliberately does not carry.
            x = PAGE_W - MARGIN - len(right) * size * AVG_ADVANCE
            self.page.text(right, x, DATES[1], DATES[0], color=MUTED)
        self.page.cursor += H_ROLE


def layout(payload: dict) -> dict:
    """Build the page. Returns `{"blocks", "rules", "meta", "warnings"}`.

    Raises `LayoutError` when the payload is not a résumé at all — no name, or nothing to
    put under any heading. Everything else is optional: a first job with no education and a
    graduate with no experience are both normal résumés.
    """
    if not isinstance(payload, dict):
        raise LayoutError("the résumé payload must be a JSON object")

    name = sanitise(payload.get("name"))
    if not name:
        raise LayoutError("a name is required — a résumé with no name on it is not one")

    headline = sanitise(payload.get("headline"))
    contact_bits = [sanitise(payload.get(k)) for k in ("email", "phone", "city")]
    contact_bits += [sanitise(x) for x in (payload.get("links") or [])]
    contact = "  ·  ".join(b for b in contact_bits if b)
    summary = sanitise(payload.get("summary"))

    experience = [e for e in (payload.get("experience") or []) if isinstance(e, dict)]
    education = [e for e in (payload.get("education") or []) if isinstance(e, dict)]
    raw_skills = payload.get("skills")
    skills = sanitise(raw_skills if isinstance(raw_skills, str) else ", ".join(raw_skills or []))

    def exp_bullets(e: dict) -> list[str]:
        out = []
        for b in (e.get("bullets") or []):
            s = sanitise(b)
            if s:
                out.append(s)
        return out

    has_body = bool(summary) or bool(skills) or any(
        sanitise(e.get("role")) or sanitise(e.get("org")) or exp_bullets(e) for e in experience
    ) or any(sanitise(e.get("course")) or sanitise(e.get("org")) for e in education)
    if not has_body:
        raise LayoutError(
            "nothing to put on the résumé — add a summary, a skill, a job or a course"
        )

    doc = _Doc()

    # -- header ------------------------------------------------------------------
    doc.page.text(name, MARGIN, NAME[1], NAME[0])
    doc.page.cursor += H_NAME
    if headline:
        doc.line(headline, HEADLINE[1], HEADLINE[0], color=INK, height=H_HEADLINE)
    if contact:
        doc.line(contact, CONTACT[1], CONTACT[0], color=MUTED, height=H_CONTACT)
    doc.page.cursor += H_GAP

    if summary:
        doc.section("Summary")
        doc.line(summary, BODY[1], BODY[0], height=H_BULLET)
        doc.page.cursor += H_GAP

    if experience:
        doc.section("Experience")
        for i, e in enumerate(experience):
            role, org = sanitise(e.get("role")), sanitise(e.get("org"))
            period = " - ".join(x for x in (sanitise(e.get("from")), sanitise(e.get("to"))) if x)
            if role or org:
                doc.role_line(" — ".join(x for x in (role, org) if x), period)
            for b in exp_bullets(e):
                lines = wrap(b, BODY[1], CONTENT_W - 14)
                if len(lines) > LONG_BULLET_LINES:
                    doc.warnings.append(
                        f"a bullet under {org or role or 'experience'} runs to {len(lines)} lines; "
                        "the most-read part of a CV is the first line of each bullet"
                    )
                # A bullet is a unit: its own lines never break across a page, which is what
                # keeps a CV readable — half a sentence at the foot of page 1 is not.
                doc.need(H_BULLET * len(lines))
                for j, part in enumerate(lines):
                    x = MARGIN + (7 if j else 0)
                    doc.page.text(("• " if j == 0 else "") + part, x, BODY[1], BODY[0])
                    doc.page.cursor += H_BULLET
            if i < len(experience) - 1:
                doc.page.cursor += H_ENTRY_GAP
        doc.page.cursor += H_GAP

    if education:
        doc.section("Education")
        for i, e in enumerate(education):
            course, org = sanitise(e.get("course")), sanitise(e.get("org"))
            period = " - ".join(x for x in (sanitise(e.get("from")), sanitise(e.get("to"))) if x)
            if course or org:
                doc.role_line(" — ".join(x for x in (course, org) if x), period)
            note = sanitise(e.get("note"))
            if note:
                doc.line(note, BODY[1], BODY[0], x=MARGIN + 7, color=MUTED, height=H_BULLET)
            if i < len(education) - 1:
                doc.page.cursor += H_ENTRY_GAP
        doc.page.cursor += H_GAP

    if skills:
        doc.section("Skills")
        doc.line(skills, SKILLS[1], SKILLS[0], height=H_BULLET)

    if not any(contact_bits):
        doc.warnings.append(
            "no email, phone or city — a résumé a recruiter cannot act on is a résumé that "
            "gets no reply"
        )
    if not experience:
        doc.warnings.append("no work experience listed")

    blocks = [b for p in doc.pages for b in p.blocks]
    rules = [r for p in doc.pages for r in p.rules]
    return {
        "blocks": blocks,
        "rules": rules,
        "meta": {
            "pages": len(doc.pages),
            "blocks": len(blocks),
            "rules": len(rules),
            "experience": len(experience),
            "education": len(education),
            "has_summary": bool(summary),
            "has_skills": bool(skills),
        },
        "warnings": doc.warnings,
    }


def to_pdfcpu(result: dict) -> dict:
    """The layout as pdfcpu `create` JSON — the one place the y axis flips."""
    pages: dict[str, dict] = {}
    for b in result["blocks"]:
        page = pages.setdefault(str(b["page"]), {"content": {}})
        page["content"].setdefault("text", []).append({
            "value": b["value"],
            "position": [b["x"], round(PAGE_H - b["y_top"], 1)],
            "font": {"name": b["font"], "size": b["size"]},
            "fillcolor": b["color"],
        })
    for r in result["rules"]:
        page = pages.setdefault(str(r["page"]), {"content": {}})
        page["content"].setdefault("line", []).append({
            "x1": r["x1"], "y1": round(PAGE_H - r["y_top"], 1),
            "x2": r["x2"], "y2": round(PAGE_H - r["y_top"], 1),
            "strokecolor": RULE, "strokewidth": 0.8,
        })
    return {"pages": pages}
