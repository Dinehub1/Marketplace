#!/usr/bin/env python3
"""
DropBy product engine — the local half of every product that touches a file.

Why a separate process: the image/audio/PDF work runs on this VM for ₹0 per job
(rembg, Pillow, pdfcpu, Piper, whisper.cpp) while the web app stays a thin Next
server. The Next route posts a file here, gets a file back, stores it in R2 and
records a row in `product_jobs`. Nothing is billed per use.

Run:  python services/tools/worker.py --port 8099
Test: python services/tools/worker.py --selftest
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from PIL import Image, ImageOps

# The résumé's page rules live in their own module with no renderer in it, so
# `scripts/check-resume.py` can assert wrapping, page breaks and orphaned headings on a
# machine that has no PDF library at all. This import resolves because Python puts this
# file's directory on `sys.path` when it runs the script.
import resume_layout

# The subtitle rules — WebVTT in, SRT out, tags stripped, cues numbered — are pure string
# arithmetic with no model and no token in them, so `scripts/check-captions.py` asserts them
# on any machine. The hosted transcription is the part that cannot be checked here.
import captions

# The form body the FLUX.2 image models take (they do not accept JSON, even for a prompt).
# Building it is bytes arithmetic with no network in it, so `scripts/check-multipart.py` parses
# the result back and asserts every part on any machine.
import multipart


class UserError(RuntimeError):
    """A job that cannot be done because the *request* is wrong, not the server.

    Kept separate from RuntimeError so the handler can answer **400** with the
    reason — every message raised as a UserError is written for a caller to read —
    instead of a 500, which the Next route maps to a 502 "Could not finish the
    job. Please try again." With one status for both, nobody can tell "you asked
    for something impossible" from "the server broke": three photos into a 2x1
    collage looked like an outage. Real faults — pdfcpu missing, no AI token, an
    upstream failure — stay RuntimeError and keep answering 500.
    """


# --- passport photo specification ------------------------------------------------
# Photos are printed on 4x6 inch paper at 300 dpi, so the customer prints once and
# cuts. How many fit is a consequence of the chosen size, not a fixed "4-up".
MM = 300 / 25.4
SHEET_W, SHEET_H = round(4 * 300), round(6 * 300)     # 1200 x 1800
GAP = 24

# The sizes the app offers, in millimetres. Keep this list in step with SIZES in
# apps/mobile/app/passport.tsx: a size the app can pick but the engine cannot
# render is a button that silently hands back the wrong photo.
#   passport 35x45 -> 413 x 531 px, 6 per sheet
#   visa     51x51 -> 602 x 602 px, 2 per sheet (2x2 in, US/Schengen)
#   stamp    20x25 -> 236 x 295 px, 20 per sheet (exams, forms)
SIZES = {
    "passport": (35, 45),
    "visa": (51, 51),
    "stamp": (20, 25),
}
DEFAULT_SIZE = "passport"

_rembg_session = None

# When this process came up. Part of /health so a stale listener is identifiable.
STARTED_AT = time.strftime("%Y-%m-%dT%H:%M:%S")


def _session():
    """Keep the model warm: loading u2net costs ~23s, inference only ~4s."""
    global _rembg_session
    if _rembg_session is None:
        from rembg import new_session
        _rembg_session = new_session("u2net")
    return _rembg_session


def cut_background(img: Image.Image) -> Image.Image:
    try:
        from rembg import remove
        return remove(img, session=_session()).convert("RGBA")
    except Exception:
        return img.convert("RGBA")


# The longest side that goes into the segmentation model. u2net costs per pixel,
# and a phone hands us 12 MP to produce a 413x531 photo — the next step throws
# that detail away, so segmenting it is pure waiting for the customer. Measured on
# a 1.5 MB 4032x3024 phone photo: 58 s before, 6 s after, same output size.
SEG_MAX_SIDE = 1400


def segmentation_input(img: Image.Image, max_side: int = SEG_MAX_SIDE) -> Image.Image:
    """Shrink what the model sees, keep the orientation the camera meant.

    EXIF rotation is applied here rather than later so the cut-out and the crop
    agree about which way up the person is — `fit_face` transposed a copy that had
    already been through the model, which is fine today only because u2net does not
    care about upside-down faces.
    """
    img = ImageOps.exif_transpose(img)
    if max(img.size) <= max_side:
        return img
    scale = max_side / max(img.size)
    return img.resize((max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale))), Image.LANCZOS)


def flatten_white(img: Image.Image) -> Image.Image:
    """Transparency onto the white stock that passport photos are printed on."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bg = Image.new("RGB", img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    return bg


def fit_face(img: Image.Image, w: int, h: int) -> Image.Image:
    """Centre-crop to the target aspect then resize — no distortion, ever."""
    img = ImageOps.exif_transpose(img)
    target = w / h
    iw, ih = img.size
    if iw / ih > target:
        new_w = int(ih * target)
        img = img.crop(((iw - new_w) // 2, 0, (iw - new_w) // 2 + new_w, ih))
    else:
        new_h = int(iw / target)
        img = img.crop((0, max(0, int((ih - new_h) * 0.15)), iw, max(0, int((ih - new_h) * 0.15)) + new_h))
    return img.resize((w, h), Image.LANCZOS)


def passport_photo(data: bytes, size: str = DEFAULT_SIZE) -> tuple[bytes, dict]:
    """Selfie in, one print-ready sheet out (as many photos as fit on 4x6)."""
    t0 = time.time()
    # An unknown size falls back to the default rather than failing the job: the
    # engine is not the place to reject a customer's tap.
    key = size if size in SIZES else DEFAULT_SIZE
    mm_w, mm_h = SIZES[key]
    photo_w, photo_h = round(mm_w * MM), round(mm_h * MM)
    src = Image.open(io.BytesIO(data))
    cut = cut_background(segmentation_input(src))
    flat = flatten_white(cut)
    one = fit_face(flat, photo_w, photo_h)
    sheet = Image.new("RGB", (SHEET_W, SHEET_H), (255, 255, 255))
    cols = max(1, (SHEET_W - GAP) // (photo_w + GAP))
    rows = max(1, (SHEET_H - GAP) // (photo_h + GAP))
    placed = 0
    for r in range(rows):
        for c in range(cols):
            x = GAP + c * (photo_w + GAP) + max(0, (SHEET_W - GAP - cols * (photo_w + GAP)) // 2)
            y = GAP + r * (photo_h + GAP)
            sheet.paste(one, (x, y))
            placed += 1
    buf = io.BytesIO()
    sheet.save(buf, "JPEG", quality=95, dpi=(300, 300))
    return buf.getvalue(), {"size": key, "size_mm": f"{mm_w}x{mm_h}", "photos_on_sheet": placed,
                            "photo_px": f"{photo_w}x{photo_h}",
                            "sheet_px": f"{SHEET_W}x{SHEET_H}", "ms": int((time.time() - t0) * 1000)}


def bg_remove(data: bytes) -> tuple[bytes, dict]:
    t0 = time.time()
    out = cut_background(Image.open(io.BytesIO(data)))
    buf = io.BytesIO()
    out.save(buf, "PNG", optimize=True)
    return buf.getvalue(), {"size": out.size, "ms": int((time.time() - t0) * 1000)}


# --- preview watermark ------------------------------------------------------------
# The paywall sits between two objects in R2, not in the UI: the sheet a customer
# can see before paying is this one. A screenshot of it must never be the product,
# and the clean sheet must never reach the client before the money does — so this
# is a separate step the API route calls on the clean bytes it already has, rather
# than a second pass through rembg (which would cost ~4 s per job for nothing).
FONT_CANDIDATES = (
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)


def _font(size: int):
    from PIL import ImageFont
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def watermark(data: bytes) -> tuple[bytes, dict]:
    """The same sheet with a visible watermark and a price band.

    Alpha is preserved when the input has it: the background remover's whole point
    is a see-through PNG, and a preview that renders the cut-out on white would
    misrepresent the product the customer is about to buy.
    """
    from PIL import ImageDraw

    t0 = time.time()
    src = Image.open(io.BytesIO(data))
    keep_alpha = src.mode in ("RGBA", "LA") or (src.mode == "P" and "transparency" in src.info)
    if keep_alpha:
        sheet = src.convert("RGBA")
    elif src.mode in ("P",):
        sheet = flatten_white(src)
    else:
        sheet = src.convert("RGB")
    w, h = sheet.size
    opaque = sheet if sheet.mode == "RGBA" else sheet.convert("RGBA")

    # Tiled diagonal text. Alpha ~90/255: unmistakable on screen, still obvious in
    # a print of the preview.
    text = "PREVIEW · NOT PAID"
    font = _font(int(w * 0.075))
    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    tw, th = probe.textbbox((0, 0), text, font=font)[2:4]
    tile = Image.new("RGBA", (tw + 140, th + 140), (0, 0, 0, 0))
    ImageDraw.Draw(tile).text((70, 70), text, font=font, fill=(29, 78, 216, 95))
    tile = tile.rotate(30, expand=True, resample=Image.BICUBIC)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y in range(-tile.height, h + tile.height, tile.height):
        for x in range(-tile.width, w + tile.width, tile.width):
            overlay.alpha_composite(tile, (x, y))

    out = Image.alpha_composite(opaque, overlay)

    # Price band along the bottom, so a shared preview carries the offer. It is
    # deliberately opaque even on a transparent preview: it marks the file.
    band_h = int(h * 0.05)
    band = Image.new("RGB", (w, band_h), (29, 78, 216))
    ImageDraw.Draw(band).text(
        (int(w * 0.03), int(band_h * 0.2)),
        "PREVIEW — pay to unlock the clean 300 dpi sheet",
        font=_font(int(band_h * 0.42)),
        fill=(255, 255, 255),
    )
    out.paste(band, (0, h - band_h))

    buf = io.BytesIO()
    if keep_alpha:
        out.save(buf, "PNG", optimize=True, dpi=(300, 300))
        content_type = "image/png"
    else:
        out.convert("RGB").save(buf, "JPEG", quality=88, dpi=(300, 300))
        content_type = "image/jpeg"
    return buf.getvalue(), {"watermarked": True, "alpha_kept": keep_alpha, "band_px": band_h,
                            "sheet_px": f"{w}x{h}", "content_type": content_type,
                            "ms": int((time.time() - t0) * 1000)}


# --- documents: pdfcpu -----------------------------------------------------------
# pdfcpu is a single Go binary, which is why it is the document engine here: no JVM,
# no Ghostscript, no per-page cloud cost on a 2 vCPU box. It is bundled under
# services/tools/bin so a reboot, a pm2 restart and a fresh clone all find it.
PDFCPU_BIN = os.environ.get("PDFCPU_BIN") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "bin", "pdfcpu.exe"
)


def _pdfcpu(args: list[str], timeout: int = 180) -> bytes:
    if not os.path.exists(PDFCPU_BIN):
        raise RuntimeError(f"pdfcpu is not installed at {PDFCPU_BIN}")
    proc = subprocess.run([PDFCPU_BIN, *args], capture_output=True, timeout=timeout)
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or b"").decode("utf-8", "replace").strip()
        raise RuntimeError((detail.splitlines() or ["pdfcpu failed"])[-1][:200])
    return proc.stdout


def pdf_page_count(path: str) -> int | None:
    """Pages in a PDF, from pdfcpu's `info` output. None when unreadable."""
    try:
        out = _pdfcpu(["info", path]).decode("utf-8", "replace")
    except Exception:
        return None
    for line in out.splitlines():
        if line.strip().lower().startswith("page count"):
            try:
                return int(line.split(":")[1].strip())
            except (IndexError, ValueError):
                return None
    return None


def _content_has_text(pdf: str, td: str) -> bool:
    """Does any page draw text? Used to decide whether a rebuild is safe.

    Assumes text (and refuses to rebuild) when the answer cannot be determined:
    throwing away a selectable, searchable document is far worse than returning a
    file that is merely not much smaller.
    """
    outdir = os.path.join(td, "content")
    os.makedirs(outdir, exist_ok=True)
    try:
        _pdfcpu(["extract", "-m", "content", pdf, outdir])
    except Exception:
        return True
    for name in os.listdir(outdir):
        with open(os.path.join(outdir, name), "rb") as fh:
            blob = fh.read()
        if b"Tj" in blob or b"TJ" in blob or b"' " in blob:
            return True
    return False


def _downsample_pdf(pdf: str, td: str, max_px: int = 1600, quality: int = 80) -> str | None:
    """Rebuild an image-only PDF from downscaled versions of its own images.

    This is what actually shrinks a phone scan: pdfcpu's `optimize` only drops
    duplicate objects, while a photographed page carries a 2500x3500 JPEG that can
    lose two thirds of its pixels without anyone noticing on paper.
    """
    imgdir = os.path.join(td, "imgs")
    os.makedirs(imgdir, exist_ok=True)
    try:
        _pdfcpu(["extract", "-m", "image", pdf, imgdir])
    except Exception:
        return None
    names = sorted(f for f in os.listdir(imgdir)
                   if f.lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp")))
    if not names:
        return None
    pages = []
    for i, name in enumerate(names):
        try:
            im = ImageOps.exif_transpose(Image.open(os.path.join(imgdir, name)))
        except Exception:
            return None
        if max(im.size) > max_px:
            im.thumbnail((max_px, max_px), Image.LANCZOS)
        if im.mode != "RGB":
            im = flatten_white(im)
        path = os.path.join(imgdir, f"down_{i}.jpg")
        im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
        pages.append(path)
    rebuilt = os.path.join(td, "rebuilt.pdf")
    try:
        _pdfcpu(["import", rebuilt, *pages])
    except Exception:
        return None
    return rebuilt


# pdfcpu wants rotation as a clockwise multiple of 90 and rejects anything else, so
# the set is closed here rather than passed through: a 45-degree "rotation" would
# come back as a pdfcpu usage error the client cannot act on.
PDF_ROTATIONS = (90, 180, 270, -90, -180, -270)

# Stirling-PDF numbers pages on a 1..9 grid (1 = top-left, 5 = middle, 9 =
# bottom-right) and its `position` parameter means exactly that. We keep the grid
# and map it onto the nine anchors pdfcpu's stamp description understands, so a
# caller who knows the other tool's parameter gets the corner it asked for.
PDF_NUMBER_ANCHORS = {1: "tl", 2: "tc", 3: "tr", 4: "l", 5: "c", 6: "r", 7: "bl", 8: "bc", 9: "br"}
PDF_NUMBER_DEFAULT_ANCHOR = 8  # bottom centre — where people expect a page number

# pdfcpu's own default text stamp is drawn *rotated*, so every description below
# states rot:0 explicitly. Without it the numbers land diagonally across the page.
def pdf_number_text(text: str) -> str:
    """Accept both placeholder dialects: {n}/{total} (the other tool's) and %p/%P."""
    out = (text or "").strip()[:80] or "Page %p of %P"
    return out.replace("{n}", "%p").replace("{total}", "%P")


# pdfcpu's page-selection grammar, from `pdfcpu selectedpages` on v0.15.0 — read off
# the binary, not guessed. A range the caller typed is *their* input, so a bad one has
# to arrive as a 400 carrying a sentence that says what a good one looks like.
#
# The exclusion is shown *attached to an inclusion*, never as a bare `!5`: an exclusion
# subtracts from a selection, it cannot make one, and a bare one is exactly the failure
# this sentence is answering — `trim -p '!5'` exits 0 having written a 0-byte file with
# `missing page numbers` (measured on v0.15.0; `1-,!5` is really pages 1-4 of 5). A 400
# that tells the caller to retype the form that just failed is worse than no hint.
# The same sentence exists on the route side (`PDF_PAGES_HELP` in @hermes/core); the
# language boundary is why it is written twice — change both when the grammar changes.
PDF_PAGES_HINT = (
    "pages must select pages of the PDF, e.g. 1-3,7 — pdfcpu also takes odd, even, "
    "l (the last page), 3- (from page 3 on) and 1-,!5 (all but page 5)"
)


def _pdfcpu_pages(args: list[str], out_path: str, pages: str, timeout: int = 180) -> bytes:
    """pdfcpu for a command whose page range came from the caller.

    Two failures have to become a UserError, and the second one is why this helper
    exists — both measured against pdfcpu v0.15.0 on a real 5-page file:

      * a range it cannot parse or cannot satisfy exits non-zero and prints the whole
        message (`abc` -> `-selectedPages problem: -pages "abc" => syntax error`,
        `0` -> `invalid page number: 0 outside 1..5`, `n1` alone -> `missing page
        numbers`). That used to reach the app as a 500 -> 502 "the server broke";
      * a range that selects **nothing** (`3-1`, `9-12`, `!6`) exits **0** having
        written a **0-byte** file and printed `aborted: missing page numbers!`. That
        was worse than the 502: a 200 whose output file is empty, i.e. a finished job
        the app would show as a blank document, stored in R2.

    An empty output when the caller did **not** send a range is a genuine fault and
    deliberately stays a RuntimeError/500.
    """
    try:
        out = _pdfcpu(args, timeout=timeout)
    except RuntimeError as exc:
        if not pages:
            raise
        raise UserError(f"{PDF_PAGES_HINT} — pdfcpu said: {exc}")
    if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        if pages:
            raise UserError(f"{PDF_PAGES_HINT} — that selection holds no pages of this PDF")
        raise RuntimeError("pdfcpu wrote an empty document for this file")
    return out


def pdf_tools(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """merge | split | compress | rotate | page-numbers, on files that never leave this machine."""
    action = (params.get("action") or "merge").strip().lower()
    t0 = time.time()
    method = "structure"
    with tempfile.TemporaryDirectory(prefix="dropby-pdf-") as td:
        srcs = []
        for i, blob in enumerate(inputs):
            path = os.path.join(td, f"in{i}.pdf")
            with open(path, "wb") as fh:
                fh.write(blob)
            srcs.append(path)
        out_path = os.path.join(td, "out.pdf")

        if action == "merge":
            if len(srcs) < 2:
                raise UserError("merge needs at least two PDFs")
            _pdfcpu(["merge", out_path, *srcs])
        elif action == "split":
            pages = (params.get("pages") or "").strip()
            if not pages:
                raise UserError("split needs a page range, e.g. 1-3,7")
            # `trim` keeps the named pages and writes them as a new document. The
            # flag is `-p/--pages`; the long spelling with one dash is rejected by
            # pdfcpu's arg parser ("accepts between 1 and 2 arg(s), received 3").
            _pdfcpu_pages(["trim", "--pages", pages, srcs[0], out_path], out_path, pages)
        elif action == "compress":
            # 1. Always safe: rewrite object streams, drop duplicate resources.
            _pdfcpu(["optimize", srcs[0], out_path])
            # 2. If that did not help and there is no text to lose, rebuild from
            #    downscaled images — the fix for a photographed page.
            if os.path.getsize(out_path) >= len(inputs[0]) and not _content_has_text(srcs[0], td):
                smaller = _downsample_pdf(srcs[0], td)
                if smaller and os.path.getsize(smaller) < os.path.getsize(out_path):
                    out_path = smaller
                    method = "downscaled"
        elif action == "rotate":
            # The `rotate` command takes the angle as a positional argument AFTER the
            # input path: `pdfcpu rotate [-p pages] inFile rotation outFile`.
            raw_angle = (params.get("angle") or params.get("degrees") or "90").strip()
            try:
                angle = int(float(raw_angle))
            except ValueError:
                raise UserError(f"angle must be one of: {', '.join(str(a) for a in PDF_ROTATIONS)}")
            if angle not in PDF_ROTATIONS:
                raise UserError(f"angle must be one of: {', '.join(str(a) for a in PDF_ROTATIONS)}")
            pages = (params.get("pages") or "").strip()
            args = ["rotate"]
            if pages:
                args += ["-p", pages]
            # pdfcpu's flag parser scans the whole argument vector, so a negative
            # angle (`-90`) is read as a flag and the job dies with `unknown
            # shorthand flag: '9' in -90`. `--` ends flag parsing before the
            # positional angle; measured, all six advertised values write a real
            # quarter turn (595x842 -> 842x595 for 90/270/-90/-270).
            _pdfcpu_pages([*args, srcs[0], "--", str(angle), out_path], out_path, pages)
        elif action == "page-numbers":
            # `stamp` with %p/%P is pdfcpu's pagination: it writes a real page number
            # per page (not a running counter), so page 7 of a 3-page selection still
            # prints "7" — which is what "number the pages" means to a reader.
            try:
                pos = int((params.get("position") or PDF_NUMBER_DEFAULT_ANCHOR))
            except ValueError:
                raise UserError("position must be a number from 1 to 9 (1 = top-left, 9 = bottom-right)")
            if pos not in PDF_NUMBER_ANCHORS:
                raise UserError("position must be a number from 1 to 9 (1 = top-left, 9 = bottom-right)")
            pages = (params.get("pages") or "").strip()
            args = ["stamp", "add", "-m", "text"]
            if pages:
                args += ["-p", pages]
            # `--` ends flag parsing: the number text is caller-supplied and a leading
            # dash would otherwise be read as a flag.
            description = f"pos:{PDF_NUMBER_ANCHORS[pos]}, rot:0, points:10, offset: 0 14, color:#333333"
            _pdfcpu_pages([*args, "--", pdf_number_text(params.get("text") or ""), description, srcs[0], out_path], out_path, pages)
        else:
            raise UserError(f"unknown pdf action: {action}")

        with open(out_path, "rb") as fh:
            out = fh.read()
        pages_in = pdf_page_count(srcs[0])
        pages_out = pdf_page_count(out_path)

    return out, {
        "action": action,
        "method": method if action == "compress" else None,
        "angle": angle if action == "rotate" else None,
        "number_position": pos if action == "page-numbers" else None,
        "pages": (params.get("pages") or "").strip() or None,
        "files_in": len(srcs),
        "bytes_in": sum(len(b) for b in inputs),
        "bytes_out": len(out),
        "saved_pct": round((1 - len(out) / max(1, sum(len(b) for b in inputs))) * 100),
        "pages_in": pages_in,
        "pages_out": pages_out,
        "content_type": "application/pdf",
        "ms": int((time.time() - t0) * 1000),
    }


# --- images: one toolkit, no cloud -------------------------------------------------
IMAGE_FORMATS = {"jpg": ("JPEG", "image/jpeg"), "jpeg": ("JPEG", "image/jpeg"),
                 "png": ("PNG", "image/png"), "webp": ("WEBP", "image/webp")}

# Aspect ratios the cover maker offers, as width:height.
ASPECTS = {"9:16": (9, 16), "1:1": (1, 1), "16:9": (16, 9), "4:5": (4, 5)}


# Tags worth naming in a job report: what a phone camera actually writes into a
# photo. Deliberately short — a full tag dump is not a product feature, and the
# claim this supports is only "the identifying tags are gone".
EXIF_NAMES = {
    0x010F: "make",       # camera manufacturer
    0x0110: "model",      # camera model
    0x0112: "orientation",
    0x0131: "software",
    0x0132: "datetime",
    0x9003: "taken",      # DateTimeOriginal
    0xA002: "width",
    0xA003: "height",
}


def exif_names(img: Image.Image) -> list[str]:
    """Which identifying tags this file carries, by name; [] for a clean one.

    GPS lives in its own IFD (0x8825), so its presence is read separately — that
    single tag is the one that turns a shop photo into a home address.
    """
    try:
        ex = img.getexif()
    except Exception:
        return []
    names = {EXIF_NAMES[t] for t in ex.keys() if t in EXIF_NAMES}
    try:
        if ex.get_ifd(0x8825):
            names.add("gps")
    except Exception:
        pass
    return sorted(names)


def image_toolkit(data: bytes, params: dict) -> tuple[bytes, dict]:
    """The shared spine of every photo product.

    ops: resize | compress | convert | crop | rotate | product-clean | repair | cover
         | strip-exif

    `product-clean`, `repair` and `cover` are the ones that make a *product* out of
    it (Product Photo Cleaner, Old Photo Repair, Reel Cover Maker). Each is a fixed
    recipe so the same input always produces the same output — a "tool" whose result
    changes with the caller is not a product.
    """
    op = (params.get("op") or "resize").strip().lower()
    t0 = time.time()
    src = Image.open(io.BytesIO(data))

    # Honour the camera's EXIF rotation before anything else: a "resized" photo
    # that is still sideways is the bug users report as "it broke my picture".
    img = ImageOps.exif_transpose(src)
    orig = img.size
    # What the file arrived carrying, measured rather than assumed: a report that
    # says "metadata removed" without naming any tag is not evidence.
    exif_in = exif_names(src)
    steps: list[str] = []

    if op == "resize":
        # Fit inside a box, never upscale: blowing a 600 px photo up to 4000 px
        # produces a worse file and a bigger one.
        box = int(params.get("max_px") or 1600)
        if max(img.size) > box:
            img.thumbnail((box, box), Image.LANCZOS)
        steps.append(f"fit {box}px")
    elif op == "crop":
        # Square crop, the shape every marketplace listing and ID photo wants.
        side = min(img.size)
        left = (img.size[0] - side) // 2
        top = (img.size[1] - side) // 3
        img = img.crop((left, top, left + side, top + side))
        steps.append("square crop")
    elif op == "rotate":
        # Negative because PIL rotates counter-clockwise for positive angles and
        # "rotate right 90" is what a user means.
        img = img.rotate(-float(params.get("degrees") or 90), expand=True)
        steps.append(f"rotate {params.get('degrees') or 90}")
    elif op == "product-clean":
        # What a shop photo needs: no clutter behind the product, a square frame,
        # and a size a marketplace will accept.
        img = flatten_white(cut_background(img))
        side = min(img.size)
        left, top = (img.size[0] - side) // 2, (img.size[1] - side) // 2
        img = img.crop((left, top, left + side, top + side))
        target = int(params.get("target_px") or 1200)
        img = img.resize((target, target), Image.LANCZOS)
        steps += ["background removed", "white backdrop", f"square {target}px"]
    elif op == "repair":
        # Light restoration only: what actually helps an old phone photo is noise
        # reduction, contrast and a careful sharpen. Anything more is a different
        # product (and an honest one would say so).
        from PIL import ImageEnhance, ImageFilter
        img = img.convert("RGB")
        img = img.filter(ImageFilter.MedianFilter(size=3))
        img = ImageOps.autocontrast(img, cutoff=1)
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=4))
        img = ImageEnhance.Color(img).enhance(1.05)
        box = int(params.get("max_px") or 2400)
        if max(img.size) > box:
            img.thumbnail((box, box), Image.LANCZOS)
        steps += ["denoise", "contrast", "sharpen 120%", f"fit {box}px"]
    elif op == "cover":
        # Reel / thumbnail cover: crop to the aspect the platform shows, then
        # land on a standard height so the text overlays sit in the same place.
        aspect = (params.get("aspect") or "9:16").strip()
        aw, ah = ASPECTS.get(aspect, ASPECTS["9:16"])
        target_h = int(params.get("target_px") or 1350)
        target_w = round(target_h * aw / ah)
        scale = max(target_w / img.size[0], target_h / img.size[1])
        resized = img.resize((max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale))), Image.LANCZOS)
        left = (resized.size[0] - target_w) // 2
        top = int((resized.size[1] - target_h) * 0.35)  # keep faces above centre
        img = resized.crop((left, top, left + target_w, top + target_h))
        steps += [f"crop {aspect}", f"{target_w}x{target_h}"]
    elif op == "strip-exif":
        # The privacy job. A phone photo carries the device, the timestamp and —
        # with location on — the coordinates it was taken at, and posting it to a
        # marketplace or a WhatsApp group publishes all three to strangers.
        # Re-saving the pixels through Pillow without `exif=` is the whole job:
        # there is no half strip, the tags are either written into the file or
        # they are not, and the meta below reports both lists so a shopkeeper can
        # see the GPS tag disappear.
        # A PNG keeps its own metadata in text chunks, which the save step does
        # not carry either, but clearing them here makes the intent explicit.
        for key in ("exif", "XML:com.adobe.xmp", "pnginfo", "icc_profile"):
            img.info.pop(key, None)
        steps.append("rewritten without metadata")
    elif op in ("compress", "convert"):
        steps.append(op)  # the save step below does the work
    else:
        raise UserError(f"unknown image op: {op}")

    fmt_key = (params.get("format") or ("png" if op == "convert" else _fmt_of(src))).strip().lower().lstrip(".")
    pil_fmt, content_type = IMAGE_FORMATS.get(fmt_key, ("JPEG", "image/jpeg"))
    if op in ("product-clean", "repair", "cover"):
        # These products produce a photo meant to be looked at, not a transparent
        # asset, so JPEG is the honest default (and much smaller).
        pil_fmt, content_type, fmt_key = "JPEG", "image/jpeg", "jpg"
    if pil_fmt == "JPEG" and img.mode in ("RGBA", "LA", "P"):
        # JPEG has no alpha; flatten onto white rather than let the encoder invent
        # a black background.
        img = flatten_white(img)

    quality = int(params.get("quality") or (82 if op == "compress" else 92))
    buf = io.BytesIO()
    save_kwargs: dict = {}
    if pil_fmt == "JPEG":
        save_kwargs = {"quality": max(30, min(95, quality)), "optimize": True, "progressive": True}
        if img.mode != "RGB":
            img = flatten_white(img)
    elif pil_fmt == "WEBP":
        save_kwargs = {"quality": max(30, min(95, quality))}
    img.save(buf, pil_fmt, **save_kwargs)
    out = buf.getvalue()
    # Read the result back instead of trusting the code path: this is the one
    # number that proves the privacy claim for the file the customer downloads.
    exif_out = exif_names(Image.open(io.BytesIO(out)))

    return out, {
        "op": op,
        "steps": steps,
        "format": fmt_key,
        "exif_in": exif_in,
        "exif_out": exif_out,
        "size_in": f"{orig[0]}x{orig[1]}",
        "size_out": f"{img.size[0]}x{img.size[1]}",
        "bytes_in": len(data),
        "bytes_out": len(out),
        "saved_pct": round((1 - len(out) / max(1, len(data))) * 100),
        "content_type": content_type,
        "ms": int((time.time() - t0) * 1000),
    }


def _fmt_of(img: Image.Image) -> str:
    return {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}.get(img.format or "", "jpg")


# --- documents: photos into one PDF -----------------------------------------------
# What people actually use this for: a set of ID/address photos for a form, a
# shop's stock shots for a wholesaler, a homework set for a teacher. So the pages
# are a real paper size at a legible resolution, in the order the caller picked
# them — not a slideshow of raw JPEGs inside a PDF container.
PDF_PAGE_FORMATS = {"a4": "A4", "letter": "Letter", "a5": "A5"}
PDF_IMPORT_DPI = 150
PHOTOS_TO_PDF_MAX = 20


def photos_to_pdf(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """One PDF, one photo per page (pdfcpu `import`), order preserved."""
    if len(inputs) == 0:
        raise UserError("no photos to convert")
    if len(inputs) > PHOTOS_TO_PDF_MAX:
        raise UserError(f"up to {PHOTOS_TO_PDF_MAX} photos per PDF")
    t0 = time.time()
    fmt = PDF_PAGE_FORMATS.get((params.get("pagesize") or "a4").strip().lower())
    if not fmt:
        raise UserError(f"unknown page size: {params.get('pagesize')}")

    with tempfile.TemporaryDirectory() as td:
        srcs: list[str] = []
        sizes: list[str] = []
        for i, data in enumerate(inputs):
            # Normalise to a plain, upright RGB JPEG first: PDF has no alpha, and a
            # camera JPEG saved sideways would have landed sideways on the page
            # because pdfcpu reads the pixels, not the EXIF orientation.
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
            sizes.append(f"{img.size[0]}x{img.size[1]}")
            path = os.path.join(td, f"p{i:03d}.jpg")
            flatten_white(img).convert("RGB").save(path, "JPEG", quality=88, optimize=True)
            srcs.append(path)
        out_path = os.path.join(td, "photos.pdf")
        # `pos:c` centres each photo on the page with its own aspect kept; the
        # alternative (`pos:full`) stretches every photo to the page, which is how
        # a wide stock photo ends up as a distorted A4 sheet.
        _pdfcpu(["import", f"f:{fmt}, pos:c, dpi:{PDF_IMPORT_DPI}", out_path, *srcs], timeout=240)
        with open(out_path, "rb") as fh:
            out = fh.read()
        pages = pdf_page_count(out_path)
    return out, {
        "action": "photos-to-pdf",
        "page_format": fmt,
        "dpi": PDF_IMPORT_DPI,
        "photos": len(srcs),
        "photo_sizes": ",".join(sizes),
        "pages_out": pages,
        "bytes_out": len(out),
        "content_type": "application/pdf",
        "ms": int((time.time() - t0) * 1000),
    }


# --- images: a collage sheet -------------------------------------------------------
# 2 photos side by side, 3 in a strip, 4 in a square — the shapes people post. Every
# tile is cut to the same cell so the sheet reads as one picture instead of four
# photos of different heights pasted together.
COLLAGE_LAYOUTS = {"auto": None, "2x1": (2, 1), "1x2": (1, 2), "2x2": (2, 2), "3x1": (3, 1)}
COLLAGE_MAX = 4


def collage(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """2-4 photos onto one white mat, each cropped to its cell."""
    n = len(inputs)
    if n < 2:
        raise UserError("a collage needs at least 2 photos")
    if n > COLLAGE_MAX:
        raise UserError(f"up to {COLLAGE_MAX} photos per collage")
    t0 = time.time()
    layout = (params.get("layout") or "auto").strip().lower()
    if layout not in COLLAGE_LAYOUTS:
        raise UserError(f"unknown layout: {layout}")
    cols, rows = COLLAGE_LAYOUTS[layout] or ((n, 1) if n in (2, 3) else (2, 2))
    if cols * rows < n:
        raise UserError(f"a {cols}x{rows} sheet holds only {cols * rows} photos")
    try:
        cell = max(240, min(2400, int(params.get("cell_px") or 1080)))
        gap = max(0, min(120, int(params.get("gap") or 16)))
    except (TypeError, ValueError):
        raise UserError("cell_px and gap must be whole numbers of pixels")

    sheet = Image.new("RGB", (cols * cell + gap * (cols + 1), rows * cell + gap * (rows + 1)),
                      (255, 255, 255))
    for i, data in enumerate(inputs):
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
        # Cover-crop to the cell: scale so the shorter side fills the cell, then
        # take the centre. Letterboxing instead would leave four photos floating
        # in white bars, which looks like a bug next to a strip that fits.
        scale = max(cell / img.size[0], cell / img.size[1])
        scaled = img.resize((max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale))),
                            Image.LANCZOS)
        left, top = (scaled.size[0] - cell) // 2, (scaled.size[1] - cell) // 2
        tile = scaled.crop((left, top, left + cell, top + cell)).convert("RGB")
        cx, cy = i % cols, i // cols
        sheet.paste(tile, (gap + cx * (cell + gap), gap + cy * (cell + gap)))

    buf = io.BytesIO()
    sheet.save(buf, "JPEG", quality=88, optimize=True, progressive=True)
    out = buf.getvalue()
    return out, {
        "action": "collage",
        "grid": f"{cols}x{rows}",
        "photos": n,
        "cell_px": cell,
        "gap": gap,
        "size_out": f"{sheet.size[0]}x{sheet.size[1]}",
        "bytes_out": len(out),
        "content_type": "image/jpeg",
        "ms": int((time.time() - t0) * 1000),
    }


def _font2(size: int, bold: bool = False):
    """Regular or bold face, for documents that need both."""
    from PIL import ImageFont
    names = ("arialbd.ttf", "arial.ttf") if bold else ("arial.ttf", "segoeui.ttf")
    for name in names:
        for base in (r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu"):
            try:
                return ImageFont.truetype(os.path.join(base, name), size)
            except Exception:
                continue
    return ImageFont.load_default()


# --- documents: invoices ----------------------------------------------------------
# Money in words, Indian grouping, implemented here rather than trusted from the
# client: the words and the figure have to agree on a customer's bill.
_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
         "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
         "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def _two_digits(n: int) -> str:
    if n < 20:
        return _ONES[n]
    t, o = divmod(n, 10)
    return f"{_TENS[t]}{'-' + _ONES[o] if o else ''}"


def rupees_in_words(amount: float) -> str:
    whole = int(amount)
    paise = int(round((amount - whole) * 100))
    if whole == 0:
        out = "zero rupees"
    else:
        parts, n = [], whole
        for div, name in ((10000000, "crore"), (100000, "lakh"), (1000, "thousand"), (100, "hundred")):
            if n // div:
                parts.append(f"{_two_digits(n // div)} {name}")
                n %= div
        if n:
            parts.append(("and " if parts else "") + _two_digits(n))
        out = " ".join(parts) + " rupees"
    if paise:
        out += f" and {_two_digits(paise)} paise"
    return (out + " only").capitalize()


def _num(v) -> float:
    try:
        f = float(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return 0.0
    return f if f > 0 else 0.0


# --- UPI on the bill ---------------------------------------------------------------
# The QR a customer scans with any UPI app. The URI is built here, from the invoice's
# OWN total, never from the caller's figure — so the amount the payment app pre-fills
# cannot disagree with the amount printed beside the code.
_UPI_VPA = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{1,63}@[A-Za-z][A-Za-z0-9.]{1,63}$")

# Where the stamped QR lands: the blank lower-left of the page, 55pt in from the left
# and 120pt up (the footer rule sits at 100pt). `rot:0` is required — pdfcpu's default
# for an image watermark is a diagonal rotation. `abs` makes the scale a multiple of
# the image's own size, so this is ~110pt on A4 and on any other page size.
UPI_QR_STAMP = "pos:bl, off:55 120, rot:0, scale:0.27 abs, op:1.0"


def upi_uri(vpa: str, payee: str, amount: float, note: str = "") -> str:
    """The NPCI intent URI: pa=payee address, pn=payee name, am/cu=amount, tn=note.

    Percent-encoded, because a shop name with a space in it otherwise breaks the URI.
    """
    parts = [("pa", vpa), ("pn", payee)]
    if amount > 0:
        parts += [("am", f"{amount:.2f}"), ("cu", "INR")]
    if note:
        parts.append(("tn", note[:50]))
    return "upi://pay?" + urllib.parse.urlencode(parts)


def _qr_png(path: str, data: str) -> str | None:
    """Write a PNG QR for `data`, or None when it cannot be drawn.

    Never raises: a bill that cannot carry its QR still has to print.
    """
    try:
        import qrcode
    except ImportError:
        return None
    try:
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        qr.make_image().save(path)
    except Exception as exc:  # noqa: BLE001 - the bill matters more than the QR
        print(f"invoice: QR render failed ({exc})", flush=True)
        return None
    return path


def _tax_lines(inv: dict) -> list[tuple[str, float]]:
    """The tax rows as printed.

    A bill with one rate keeps the plain shape (Taxable value / CGST / SGST). A bill
    whose lines carry different rates names the rate on every row: with 5% and 18%
    goods on the same page, a single "CGST @ 9%" pair would be a lie about the tax.
    """
    rows = [("Taxable value", inv["taxable"])]
    groups = inv.get("tax_rows") or []
    if len(groups) == 1:
        r = groups[0]["rate"]
        if r:
            rows += [(f"CGST @ {r / 2:g}%", groups[0]["cgst"]),
                     (f"SGST @ {r / 2:g}%", groups[0]["sgst"])]
    elif groups:
        for g in groups:
            rows.append((f"Taxable @ {g['rate']:g}%", g["taxable"]))
            if g["rate"]:
                rows.append((f"CGST @ {g['rate'] / 2:g}%", g["cgst"]))
                rows.append((f"SGST @ {g['rate'] / 2:g}%", g["sgst"]))
    return rows


def _render_invoice(inv: dict):
    """One A4 page at 150 dpi. Pure Pillow, then pdfcpu wraps it into a PDF."""
    from PIL import ImageDraw

    W, H, M = 1240, 1754, 70
    img = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    ink, muted, line = (15, 23, 42), (100, 116, 139), (203, 213, 225)

    f_shop, f_title = _font2(42, True), _font2(26, True)
    f_label, f_body, f_small = _font2(18 + 2), _font2(24), _font2(20)
    f_big = _font2(30, True)

    d.text((M, M), inv["shop"][:42], font=f_shop, fill=ink)
    y = M + 56
    if inv.get("gstin"):
        d.text((M, y), f"GSTIN: {inv['gstin']}", font=f_body, fill=muted)
        y += 32
    d.text((W - M, M + 8), "TAX INVOICE", font=f_title, fill=ink, anchor="ra")
    d.line([(M, y + 10), (W - M, y + 10)], fill=line, width=2)
    y += 40

    # Bill to / bill details, two columns.
    d.text((M, y), "BILL TO", font=f_label, fill=muted)
    d.text((W - M, y), "INVOICE", font=f_label, fill=muted, anchor="ra")
    d.text((M, y + 28), inv["customer"][:38], font=f_big, fill=ink)
    bill_bits = []
    if inv.get("billNo"):
        bill_bits.append(f"No: {inv['billNo']}")
    if inv.get("date"):
        bill_bits.append(f"Date: {inv['date']}")
    for i, bit in enumerate(bill_bits):
        d.text((W - M, y + 30 + i * 28), bit, font=f_body, fill=ink, anchor="ra")
    y += 110

    # Items table.
    cols = [M, M + 50, M + 520, M + 620, M + 760, W - M]
    heads = ["#", "Item", "Qty", "Rate", "Amount"]
    d.rectangle([M, y, W - M, y + 40], fill=(241, 245, 249))
    for i, h in enumerate(heads):
        anchor = "ra" if i >= 2 else "la"
        x = cols[i + 1] - 12 if anchor == "ra" else cols[i] + 12
        d.text((x, y + 9), h, font=f_label, fill=ink, anchor=anchor)
    y += 40
    for n, it in enumerate(inv["items"], 1):
        d.line([(M, y), (W - M, y)], fill=line, width=1)
        d.text((cols[0] + 12, y + 12), str(n), font=f_body, fill=muted)
        d.text((cols[1] + 12, y + 12), it["name"][:40], font=f_body, fill=ink)
        for i, val in enumerate([it["qty"], it["rate"], it["amount"]], start=2):
            d.text((cols[i + 1] - 12, y + 12), f"{val:,.2f}", font=f_body, fill=ink, anchor="ra")
        if it.get("hsn"):
            # The HSN/SAC goes under the item name: a B2B bill needs it per line, and
            # a sixth column would squeeze the item name out of the table.
            d.text((cols[1] + 12, y + 36), f"HSN {it['hsn']}", font=f_small, fill=muted)
            y += 70
        else:
            y += 52
    d.line([(M, y), (W - M, y)], fill=line, width=2)
    y += 24

    # Totals, right-aligned, with the tax split named as the invoice does.
    rows = _tax_lines(inv)
    for label, amount in rows:
        d.text((cols[3] + 40, y), label, font=f_body, fill=muted)
        d.text((W - M - 12, y), f"{amount:,.2f}", font=f_body, fill=ink, anchor="ra")
        y += 34
    y += 6
    d.line([(cols[3] + 40, y), (W - M, y)], fill=line, width=1)
    y += 12
    d.text((cols[3] + 40, y), "TOTAL", font=f_big, fill=ink)
    d.text((W - M - 12, y), f"\u20b9{inv['total']:,.2f}", font=f_big, fill=ink, anchor="ra")
    y += 48
    d.text((M, y), f"In words: {inv['in_words']}", font=f_small, fill=muted)
    y += 46

    # The same UPI block as the vector page, drawn into the fallback raster. NEAREST
    # keeps the QR's module edges hard — a smoothed QR is a QR that scans badly.
    if inv.get("upi_uri") and inv.get("qr_path") and y + 40 < H - 460:
        qy = H - 500
        d.text((M, qy), "PAY BY UPI", font=f_label, fill=muted)
        try:
            with Image.open(inv["qr_path"]) as qr:
                img.paste(qr.convert("RGB").resize((240, 240), Image.NEAREST), (M, qy + 34))
            d.text((M + 300, qy + 70), inv["upi"], font=f_body, fill=muted)
            d.text((M + 300, qy + 102), f"Rs. {inv['total']:,.2f} pre-filled", font=f_small, fill=muted)
            inv["qr_in_fallback"] = True
        except Exception as exc:  # noqa: BLE001 - a bill without its QR still prints
            print(f"invoice: QR paste failed ({exc})", flush=True)

    d.line([(M, H - 120), (W - M, H - 120)], fill=line, width=1)
    d.text((M, H - 100), "This is a computer-generated invoice.", font=f_small, fill=muted)
    d.text((W - M, H - 100), inv.get("date") or "", font=f_small, fill=muted, anchor="ra")
    return img


def _invoice_json(inv: dict) -> dict:
    """The invoice as pdfcpu `create` JSON: A4, vector text, selectable and searchable.

    Coordinates are PDF points with the origin at the BOTTOM-LEFT, so every y here
    is `842 - distance from the top`. Numbers use Courier so a fixed-width string
    lines up in a column without the engine having to measure text.

    "Rs." rather than "₹" on purpose: the PDF base-14 fonts are WinAnsi, which has
    no rupee sign, and a missing glyph on a customer's bill is worse than a
    familiar abbreviation.
    """
    W, H, M = 595, 842, 50
    right = W - M
    ink, muted, label = "#0f172a", "#64748b", "#94a3b8"
    text: list[dict] = []
    lines: list[dict] = []
    rects: list[dict] = []

    def top(y_top: float) -> float:
        return H - y_top

    def add(value: str, x: float, y_top: float, size: float = 11, font: str = "Helvetica", color: str = ink):
        text.append({"value": value, "position": [round(x, 1), round(top(y_top), 1)],
                     "font": {"name": font, "size": size}, "fillcolor": color})

    def money_col(value: float, x_right: float, y_top: float, size: float = 11, font: str = "Courier") -> None:
        # Courier is monospaced, so padding to a fixed width right-aligns the column.
        s = f"{value:,.2f}".rjust(14)
        add(s, x_right - 14 * size * 0.6, y_top, size, font)

    add(inv["shop"][:44], M, 72, 20, "Helvetica-Bold")
    if inv.get("gstin"):
        add(f"GSTIN: {inv['gstin']}", M, 88, 10, "Helvetica", muted)
    add("TAX INVOICE", right - 78, 72, 13, "Helvetica-Bold")
    lines.append({"x1": M, "y1": round(top(100), 1), "x2": right, "y2": round(top(100), 1),
                  "strokecolor": "#cbd5e1", "strokewidth": 1.2})

    add("BILL TO", M, 118, 9, "Helvetica", label)
    add("INVOICE", right - 46, 118, 9, "Helvetica", label)
    add(inv["customer"][:40], M, 136, 15, "Helvetica-Bold")
    if inv.get("billNo"):
        add(f"No: {inv['billNo']}", right - 120, 134, 10)
    if inv.get("date"):
        add(f"Date: {inv['date']}", right - 120, 148, 10)

    table_top, row_h, head_h = 175.0, 20.0, 22.0
    rects.append({"x": M, "y": round(top(table_top + head_h), 1), "w": right - M, "h": head_h, "fillcolor": "#f1f5f9"})
    for head, x in (("#", M + 8), ("Item", M + 34), ("Qty", 300), ("Rate", 400), ("Amount", right)):
        add(head, x if head in ("#", "Item") else x - len(head) * 5.4, table_top + 7, 10, "Helvetica-Bold")
    y = table_top + head_h
    for n, it in enumerate(inv["items"], 1):
        hsn = it.get("hsn")
        y += row_h + 12 if hsn else row_h
        add(str(n), M + 8, y - 13, 10, "Helvetica", muted)
        add(it["name"][:42], M + 34, y - (19 if hsn else 13), 11)
        # The HSN/SAC under the item name — a B2B bill wants it on the line, and the
        # table's five columns have no room for a sixth without shrinking the name.
        if hsn:
            add(f"HSN {hsn}", M + 34, y - 7, 7.5, "Helvetica", label)
        money_col(it["qty"], 340, y - 13, 11)
        money_col(it["rate"], 440, y - 13, 11)
        money_col(it["amount"], right, y - 13, 11)
        lines.append({"x1": M, "y1": round(top(y), 1), "x2": right, "y2": round(top(y), 1),
                      "strokecolor": "#e2e8f0", "strokewidth": 0.8})

    ty = y + 26
    rows = _tax_lines(inv)
    for lbl, amount in rows:
        add(lbl, 360, ty, 11, "Helvetica", muted)
        money_col(amount, right, ty, 11)
        ty += 18
    lines.append({"x1": 360, "y1": round(top(ty - 8), 1), "x2": right, "y2": round(top(ty - 8), 1),
                  "strokecolor": "#cbd5e1", "strokewidth": 1})
    add("TOTAL", 360, ty + 8, 14, "Helvetica-Bold")
    add(f"Rs. {inv['total']:,.2f}", right - len(f"Rs. {inv['total']:,.2f}") * 7.0, ty + 8, 14, "Helvetica-Bold")

    add(f"In words: {inv['in_words']}", M, ty + 44, 9, "Helvetica", muted)
    lines.append({"x1": M, "y1": round(top(742), 1), "x2": right, "y2": round(top(742), 1),
                  "strokecolor": "#e2e8f0", "strokewidth": 0.8})
    add("This is a computer-generated invoice.", M, 760, 8, "Helvetica", label)
    if inv.get("date"):
        add(inv["date"], right - 60, 760, 8, "Helvetica", label)

    content: dict = {"text": text}
    if lines:
        content["line"] = lines
    if rects:
        content["rect"] = rects
    # The UPI block: the caption and the payee address are vector text, the code itself
    # is stamped on afterwards — pdfcpu's create JSON ignores `position` on an image and
    # draws it at the page origin, which was measured here, not assumed. The block sits
    # in the empty lower-left corner; a bill with too many lines for it loses the QR
    # rather than printing one over the totals.
    qr_drawn = False
    if inv.get("upi_uri") and ty + 54 <= 570:
        add("PAY BY UPI", M, 598, 8.5, "Helvetica", label)
        add(inv["upi"], M + 122, 650, 9, "Helvetica", muted)
        add(f"Rs. {inv['total']:,.2f} pre-filled", M + 122, 668, 7.5, "Helvetica", label)
        qr_drawn = True

    spec: dict = {"pages": {"1": {"content": content}}}
    spec["_qr_drawn"] = qr_drawn  # popped by invoice_maker; pdfcpu never sees this key
    return spec


def invoice_maker(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """A shop's bill, rendered locally: JSON in, one-page A4 PDF out."""
    t0 = time.time()
    try:
        payload = json.loads(params.get("payload") or "{}")
    except ValueError as exc:
        raise UserError(f"payload is not valid JSON: {exc}")
    if not isinstance(payload, dict):
        raise UserError("payload must be a JSON object")
    shop = str(payload.get("shop") or "").strip()
    customer = str(payload.get("customer") or "").strip()
    if not shop:
        raise UserError("shop name is required")
    if not customer:
        raise UserError("customer name is required")

    raw_items = payload.get("items") or []
    items = []
    for it in raw_items:
        name = str(it.get("name") or "").strip()
        qty = _num(it.get("qty")) or 1.0
        rate = _num(it.get("rate"))
        if not name or rate <= 0:
            continue
        # The line may carry its own GST rate; without one it follows the bill-level
        # rate, which is the field that existed before per-item rates — so a caller
        # that never heard of them gets exactly the bill it used to get.
        own = it.get("gstRate", it.get("gst_rate"))
        line_rate = None if own is None or own == "" else max(0.0, min(28.0, _num(own)))
        # HSN/SAC: digits or letters, 8 at most. Anything else is a typo, not a code.
        hsn = re.sub(r"[^A-Za-z0-9]", "", str(it.get("hsn") or ""))[:8]
        items.append({"name": name, "qty": qty, "rate": rate, "amount": round(qty * rate, 2),
                      "gst_rate": line_rate, "hsn": hsn or None})
    if not items:
        raise UserError("at least one item with a name and a rate is required")

    rate = max(0.0, min(28.0, _num(payload.get("gstRate"))))
    for it in items:
        if it["gst_rate"] is None:
            it["gst_rate"] = rate

    # Recomputed here, always. A bill whose total depends on the caller's
    # arithmetic is a bill that can be wrong by design. The tax is computed per rate
    # group rather than once on the whole bill: a shop that sells 5% and 18% goods on
    # one page owes a different amount on each line, and one blended figure could only
    # ever be wrong about one of them.
    taxable = round(sum(i["amount"] for i in items), 2)
    groups: dict[float, float] = {}
    for it in items:
        groups[it["gst_rate"]] = round(groups.get(it["gst_rate"], 0.0) + it["amount"], 2)
    tax_rows = []
    for r in sorted(groups):
        g = round(groups[r] * r / 100, 2)
        c = round(g / 2, 2)
        tax_rows.append({"rate": r, "taxable": groups[r], "gst": g, "cgst": c, "sgst": round(g - c, 2)})
    gst = round(sum(t["gst"] for t in tax_rows), 2)
    cgst = round(sum(t["cgst"] for t in tax_rows), 2)
    sgst = round(gst - cgst, 2)
    total = round(taxable + gst, 2)

    invoice = {
        "shop": shop,
        "gstin": (str(payload.get("gstin") or "").strip() or None),
        "customer": customer,
        "billNo": (str(payload.get("billNo") or "").strip() or None),
        "date": str(payload.get("date") or "").strip(),
        "gst_rate": rate,
        "tax_rows": tax_rows,
        "items": items,
        "taxable": taxable, "gst": gst, "cgst": cgst, "sgst": sgst, "total": total,
        "in_words": rupees_in_words(total),
    }

    # The UPI id, when the shop gave one. A malformed id is dropped rather than printed:
    # a wrong VPA sends the customer's money to a stranger, so absence is the safe
    # failure and the meta says which one happened.
    upi = str(payload.get("upi") or "").strip()[:80]
    upi_note = None
    if upi and not _UPI_VPA.match(upi):
        upi_note = "the UPI id is not name@bank - no QR was printed"
        upi = ""
    if upi:
        invoice["upi"] = upi
        invoice["upi_uri"] = upi_uri(upi, shop, total, invoice["billNo"] or "Tax invoice")

    render = "vector"
    qr_state = "no UPI id given"
    with tempfile.TemporaryDirectory(prefix="dropby-invoice-") as td:
        out_path = os.path.join(td, "invoice.pdf")
        spec = os.path.join(td, "invoice.json")
        if invoice.get("upi_uri"):
            invoice["qr_path"] = _qr_png(os.path.join(td, "upi-qr.png"), invoice["upi_uri"])
            qr_state = "not drawn" if invoice["qr_path"] else "no QR image (encoder missing)"
        spec_obj = _invoice_json(invoice)
        qr_wanted = bool(spec_obj.pop("_qr_drawn", False))
        with open(spec, "w", encoding="utf-8") as fh:
            json.dump(spec_obj, fh)
        try:
            _pdfcpu(["create", spec, out_path])
            if qr_wanted:
                stamped = os.path.join(td, "invoice-upi.pdf")
                try:
                    _pdfcpu(["stamp", "add", "--mode", "image", invoice["qr_path"], UPI_QR_STAMP,
                             out_path, stamped])
                    os.replace(stamped, out_path)
                    qr_state = "stamped on the page"
                except Exception as exc:  # noqa: BLE001
                    qr_state = f"stamp failed: {str(exc)[:70]}"
            elif invoice.get("upi_uri"):
                qr_state = "omitted - no room under the totals"
        except Exception as exc:
            # pdfcpu's JSON schema is versioned; if it rejects ours, fall back to
            # the rendered-image path rather than failing a shop's bill outright.
            print(f"invoice: vector render failed ({exc}); using the image fallback", flush=True)
            render = "image-fallback"
            page = os.path.join(td, "invoice.png")
            _render_invoice(invoice).save(page, "PNG", optimize=True)
            _pdfcpu(["import", "f:A4, pos:full, dpi:150", out_path, page])
            if invoice.get("qr_in_fallback"):
                qr_state = "drawn into the fallback page"
        with open(out_path, "rb") as fh:
            out = fh.read()
        pages = pdf_page_count(out_path)

    client_total = _num((payload.get("totals") or {}).get("total"))
    return out, {
        "doc": "invoice",
        "render": render,
        "items": len(items),
        "gst_rate": rate,
        # The rates that were actually used, and what each one carried: the app shows
        # these rows beside the bill, so it must read them from the engine's own
        # arithmetic rather than repeat its own.
        "gst_rates": sorted(groups),
        "tax_rows": tax_rows,
        "hsn_items": sum(1 for i in items if i["hsn"]),
        "taxable": taxable, "gst": gst, "total": total,
        "in_words": invoice["in_words"],
        "upi": invoice.get("upi") or None,
        "upi_uri": invoice.get("upi_uri") or None,
        "upi_qr": qr_state in ("stamped on the page", "drawn into the fallback page"),
        "upi_note": upi_note or (qr_state if invoice.get("upi_uri") else None),
        "client_total": client_total,
        "totals_match": abs(client_total - total) < 0.01,
        "pages": pages,
        "content_type": "application/pdf",
        "ms": int((time.time() - t0) * 1000),
    }


def pdf_stamp(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """Stamp a document as a preview. A PDF cannot be watermarked by the image
    watermarker, and handing over the clean file at the free step would be the
    paywall giving itself away."""
    t0 = time.time()
    text = (params.get("text") or "PREVIEW - NOT PAID").strip()[:120]
    desc = params.get("desc") or "scale:0.5, pos:c, rot:45, op:0.30"
    with tempfile.TemporaryDirectory(prefix="dropby-stamp-") as td:
        src = os.path.join(td, "in.pdf")
        with open(src, "wb") as fh:
            fh.write(inputs[0])
        out_path = os.path.join(td, "out.pdf")
        _pdfcpu(["stamp", "add", text, desc, "--mode", "text", src, out_path])
        with open(out_path, "rb") as fh:
            out = fh.read()
        pages = pdf_page_count(out_path)
    return out, {
        "watermarked": True,
        "text": text,
        "pages": pages,
        "content_type": "application/pdf",
        "ms": int((time.time() - t0) * 1000),
    }


# --- Cloudflare Workers AI text-to-image -----------------------------------------
# Every other product EDITS a file the customer already has; this one GENERATES
# one from a prompt. It runs here rather than in the Next route so the app keeps
# its single "post a job, get a file back" protocol, and so the generation call
# sits next to the image post-processing (crop/resize) that often follows it.
#
# The API token lives in the Hermes .env on this box; PRODUCT_WORKER env wins if
# set. Model + account are overridable per deployment.
CF_AI_ACCOUNT = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "85a63fd793363a3e2ec3eea325a9df8f")
CF_AI_MODEL = os.environ.get("CF_AI_IMAGE_MODEL", "@cf/black-forest-labs/flux-1-schnell")
CF_AI_TOKEN_ENV = os.environ.get("CLOUDFLARE_API_TOKEN", "")
_HERMES_ENV = r"C:\Users\Administrator\AppData\Local\hermes\.env"

# The endpoint as one constant rather than an f-string written twice: the retry below is
# tested against a local server that refuses the first call (queue item 29), and a test
# that cannot point the call somewhere else can only be a mock of the code under test.
CF_AI_BASE = "https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"

# --- one retry per hosted call, because one edge refusal is not an outage ---------------
# Measured before this existed (queue items 20 and 29): the first POST /job/ai-image of an
# hour answered 500 {"error": "HTTP Error 400: Bad Request"} and the *identical* retry
# answered 200 with a 569 KB JPEG — the token was fine in the same minute, so that 400 came
# off the edge, not out of the request. Until now that was the caller's whole answer
# ("Could not finish the job"), which is how a hiccup reads as a broken server.
#
# Retried: a transport error (timeout, reset, unreadable body) and HTTP 400/408/429/5xx.
# The 400 is in the list only because it is the status that was measured flapping; a 400
# the *model* means repeats and the second failure is reported as-is. The price is one extra
# call on a request that was already failing, and the attempt count rides in the job's meta.
# Never retried: 401/403 — a refused token or an unaccepted model licence is the answer, and
# a second call is the same error with more latency.
CF_AI_ATTEMPTS = 2
CF_AI_RETRY_STATUS = frozenset({400, 408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524})
CF_AI_RETRY_PAUSE_S = 0.4
# The retry must not double the time a job can hang: the deadline bounds the whole call
# (retries included) rather than each attempt, and a second attempt is not started when
# what is left of it is too small to be useful.
CF_AI_RETRY_MIN_S = 5

# Models verified working on this account (Workers Free plan, 2026-09-16):
#   @cf/black-forest-labs/flux-1-schnell          3.4s  best default
#   @cf/bytedance/stable-diffusion-xl-lightning   3.3s
#   @cf/lykon/dreamshaper-8-lcm                   2.4s
#   @cf/stabilityai/stable-diffusion-xl-base-1.0  3.5s  highest fidelity
#   @cf/leonardo/lucid-origin                     2.9s  (returns json/base64)
# flux-1-schnell takes ONLY a prompt: extra fields are rejected as
# "Additional or unevaluated properties", so num_steps/seed are opt-in per model.
FLUX_STRICT = ("flux-1-schnell", "flux-2")


def _cf_ai_token() -> str:
    """Token from the worker env, else from the Hermes .env it already lives in."""
    if CF_AI_TOKEN_ENV:
        return CF_AI_TOKEN_ENV
    try:
        with open(_HERMES_ENV, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                if line.startswith("CLOUDFLARE_API_TOKEN="):
                    return line.split("=", 1)[1].strip()
    except OSError:
        pass
    return ""


def _cf_ai_run(model: str, payload: dict, token: str, timeout: int = 180,
               keep_http_error: bool = False, *, raw_body: bytes | None = None,
               raw_type: str | None = None) -> tuple[bytes, str, int]:
    """One Workers AI call, retried once. Returns (body, content_type, attempts_made).

    A failure that survives the retry is a real fault (500 through the route), but the
    sentence names the model, what the service said and how many attempts were made, so a
    job row says what happened instead of `HTTP Error 400: Bad Request`.

    `keep_http_error` is for the translate chain, which reads the *status* to tell a refused
    language pair (a caller mistake, answered 400) from an outage: with it set, the last
    HTTPError is re-raised rather than wrapped, so a generic RuntimeError cannot turn a 400
    into a 502.

    `raw_body`/`raw_type` are for the models that do not take JSON: FLUX.2's own changelog says
    it "uses multipart form data inputs, even if you just have a prompt", so the image products
    pass a body built by `multipart.encode()` here. The retry, the deadline and the error
    reporting stay in one place rather than being copied for the second content type.

    The deadline bounds the whole call, retries included — and it is what is handed to
    urlopen, so a single attempt cannot outlive it either (bar the socket's own last read).
    """
    url = CF_AI_BASE.format(account=CF_AI_ACCOUNT, model=model)
    deadline = time.monotonic() + timeout
    reasons: list[str] = []
    last_http: urllib.error.HTTPError | None = None
    # Encoded once, outside the loop: a retry must send the same bytes, including the same
    # multipart boundary, or the two attempts are different requests.
    body = raw_body if raw_body is not None else json.dumps(payload).encode()
    content_type = raw_type or "application/json"

    for attempt in range(1, CF_AI_ATTEMPTS + 1):
        budget = deadline - time.monotonic()
        # Only a *retry* needs leftover budget; the first call always goes. Measured by
        # scripts/test-worker-retry.py, which caught the opposite: a guard on every attempt
        # made a short-timeout call send nothing at all and report "after 0 attempts".
        if attempt > 1 and budget <= 1:
            break
        req = urllib.request.Request(   # fresh per attempt: urlopen owns what it is given
            url,
            data=body,
            headers={"Authorization": "Bearer " + token, "Content-Type": content_type},
        )
        try:
            with urllib.request.urlopen(req, timeout=max(budget, 1.0)) as resp:
                return resp.read(), resp.headers.get("Content-Type", ""), attempt
        except urllib.error.HTTPError as exc:
            last_http = exc
            detail = ""
            try:
                detail = exc.read()[:160].decode("utf-8", "replace").strip()
            except Exception:  # noqa: BLE001 — a body that cannot be read is not the point
                pass
            # The stream is spent now. When the caller asked for the error itself
            # (`keep_http_error`), this is the only copy of the service's sentence left, so it
            # rides on the exception for `_http_detail()` to read.
            try:
                exc.dropby_detail = detail
            except Exception:  # noqa: BLE001 — an exception that refuses attributes is fine
                pass
            reasons.append(f"HTTP {exc.code}" + (f" {detail}" if detail else ""))
            if exc.code not in CF_AI_RETRY_STATUS:
                break
        except Exception as exc:  # noqa: BLE001 — timeout, reset, unreadable body
            reasons.append(f"{type(exc).__name__}: {exc}")

        if attempt < CF_AI_ATTEMPTS and deadline - time.monotonic() > CF_AI_RETRY_MIN_S:
            time.sleep(CF_AI_RETRY_PAUSE_S)
        else:
            break

    if keep_http_error and last_http is not None:
        raise last_http
    tried = len(reasons)
    raise RuntimeError(
        f"Workers AI {model} failed after {tried} attempt{'' if tried == 1 else 's'}"
        + (f" in {timeout}s" if tried == 0 else "")
        + ": " + "; ".join(reasons)[:240])


def ai_image(params: dict) -> tuple[bytes, dict]:
    """Generate an image from ?prompt=. Returns (image_bytes, meta)."""
    prompt = (params.get("prompt") or "").strip()
    if not prompt:
        raise UserError("prompt is required")
    model = (params.get("model") or CF_AI_MODEL).strip()
    token = _cf_ai_token()
    if not token:
        raise RuntimeError("CLOUDFLARE_API_TOKEN missing (worker env or Hermes .env)")

    payload: dict = {"prompt": prompt}
    strict = any(k in model for k in FLUX_STRICT)
    for key in ("width", "height"):
        if params.get(key):
            payload[key] = int(params[key])
    if not strict:  # flux rejects unknown properties outright
        if params.get("steps"):
            payload["num_steps"] = int(params["steps"])
        if params.get("seed"):
            payload["seed"] = int(params["seed"])

    raw, ctype, attempts = _cf_ai_run(model, payload, token)

    if ctype.startswith("application/json"):
        b64 = (json.loads(raw).get("result") or {}).get("image")
        if not b64:
            raise RuntimeError("Workers AI returned no image")
        raw = base64.b64decode(b64)

    # An image job is billed per 512x512 tile and per step (Cloudflare's published image rate
    # table), and a flux model rejects extra properties outright — so a job that sends no
    # size/steps really runs at the model's own default, and the only way the cost can be read
    # off the row later (queue item 16) is if the shape is recorded with the picture. `shape`
    # says which of the two this job was; nothing here guesses what the model did with it.
    sent_shape = any(k in payload for k in ("width", "height", "num_steps"))
    return raw, {
        "model": model, "content_type": "image/jpeg", "generated": True, "bytes": len(raw),
        "width": int(payload.get("width") or 1024),
        "height": int(payload.get("height") or 1024),
        "steps": int(payload.get("num_steps") or 4),
        "shape": "sent in the request" if sent_shape
                 else "model default (flux-1-schnell: 1024x1024, 4 steps)",
        # How many calls this picture actually took (item 29): 1 is the normal run, 2 means
        # the edge refused the first one and the retry was what produced the image.
        "attempts": attempts,
    }


# ---------------------------------------------------------------------------
# Documents -> Markdown, and a keyword check on top (queue item 11)
#
# markitdown (MIT, microsoft/markitdown) turns a file into Markdown; it is a local
# library, so a document job costs ₹0 per run and no key is involved. The scoring
# layer is ours, and it only ever states what is measurable in the text: lengths,
# whether an email/phone is present, which heading words appear, and for each
# keyword the caller sent, whether the document mentions it. It makes no claim
# about what "an ATS wants" — that is not knowable from this box, and a made-up
# rule would be a claim we cannot back.
# ---------------------------------------------------------------------------

# The engine is handed bytes, not a filename, so the format is read from the
# file's own first bytes: a DOCX that arrived as `.bin` must still parse as a DOCX.
_DOC_MAGIC = ((b"%PDF", ".pdf"),
              (b"PK\x03\x04", ".docx"),        # docx/xlsx/pptx are all ZIP containers
              (b"\xd0\xcf\x11\xe0", ".doc"))   # legacy OLE (.doc/.xls/.ppt)

# A caller's keywords are echoed in the job's meta, which rides in an HTTP header,
# so the count and the length are capped here as well as in the Next route.
MAX_KEYWORDS = 30
MAX_KEYWORD_CHARS = 40

# Heading words only. A word being in the document is a fact; whether a particular
# employer demands it is not, so nothing here is called "required".
HEADING_WORDS = ("summary", "objective", "experience", "education", "skills",
                 "projects", "certifications", "achievements", "internship",
                 "languages")


def _doc_suffix(data: bytes) -> str:
    for magic, suffix in _DOC_MAGIC:
        if data.startswith(magic):
            return suffix
    head = data[:600].lstrip().lower()
    if head.startswith(b"<!doctype html") or head.startswith(b"<html") or b"<body" in head[:400]:
        return ".html"
    return ".txt"


# A photo is not a document, and markitdown says so badly: handed unknown bytes it
# returns the string "None" as the text. Naming the format is the honest answer —
# "characters: 4" for a JPEG is not one — and this engine has no vision model, so
# an image has to be OCR'd before it can be read.
_IMAGE_MAGIC = ((b"\xff\xd8\xff", "JPEG"),
                (b"\x89PNG\x0d\x0a\x1a\x0a", "PNG"),
                (b"GIF87a", "GIF"), (b"GIF89a", "GIF"))


def _image_kind(data: bytes) -> str | None:
    for magic, kind in _IMAGE_MAGIC:
        if data.startswith(magic):
            return kind
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "WebP"
    if data[4:12] in (b"ftypheic", b"ftypheif", b"ftypmif1", b"ftypavif"):
        return "HEIC"
    return None


def _keywords(raw: str) -> list[str]:
    """The caller's comma/semicolon/newline separated terms, cleaned, de-duped, capped."""
    out: list[str] = []
    for part in re.split(r"[,;\n]", raw or ""):
        term = " ".join(part.split()).strip(' ."\'')
        if not term:
            continue
        if len(term) > MAX_KEYWORD_CHARS:
            raise UserError(f"'{term[:20]}…' is too long for a keyword (max {MAX_KEYWORD_CHARS} characters)")
        if term.lower() in (t.lower() for t in out):
            continue
        out.append(term)
    if len(out) > MAX_KEYWORDS:
        raise UserError(f"at most {MAX_KEYWORDS} keywords in one check ({len(out)} were sent)")
    return out


def _mentions(text_lower: str, term: str) -> bool:
    """Whole-word match when the term is a word, substring otherwise.

    'sql' must not be found inside 'mysql' — that would score a keyword the
    document does not carry — while 'C++' and 'machine learning' work as written.
    """
    t = term.lower()
    if re.fullmatch(r"[\w+#.&-]+(?: [\w+#.&-]+)*", t, re.UNICODE):
        return re.search(r"(?<!\w)" + re.escape(t) + r"(?!\w)", text_lower) is not None
    return t in text_lower


def _markitdown_version() -> str:
    try:
        from importlib.metadata import version
        return version("markitdown")
    except Exception:
        return "unknown"


def resume_check(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """One document in; a Markdown reading of it plus the keyword check out.

    The output IS the Markdown (its `content_type` says so), because that is both
    the evidence and the artifact: the Next route stores it under
    `marketplace/products/resume-checker/` and hands the URL back for free.
    """
    if not inputs:
        raise UserError("a document is required")
    data = inputs[0]
    if not data:
        raise UserError("the file is empty")
    keywords = _keywords(params.get("keywords", ""))
    kind = _image_kind(data)
    if kind:
        raise UserError(
            f"that file is a {kind} image, not a document — a photo has no text layer, "
            "so send a PDF, DOCX or text file (OCR the photo first)")
    suffix = _doc_suffix(data)

    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
        try:
            from markitdown import MarkItDown
        except ImportError as exc:
            # A missing library is this VM's fault, not the caller's: keep it a 500.
            raise RuntimeError(f"markitdown is not installed on this VM: {exc}")
        try:
            text = (MarkItDown().convert(path).text_content or "").strip()
        except Exception as exc:
            # Encrypted, corrupt, or not a document: that is the caller's input, so
            # a 400 with the reason beats a 502 nobody can act on.
            raise UserError(f"could not read that document: {exc}")
        pages = pdf_page_count(path) if suffix == ".pdf" else None
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    if len(re.findall(r"\w", text, re.UNICODE)) < 10:
        raise UserError("no readable text was found in that document — a scan or a photo has no text layer until it is OCR'd")

    low = text.lower()
    words = len(re.findall(r"[\w'’-]+", text, re.UNICODE))
    emails = sorted(set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)))[:3]
    phones = sorted(set(re.findall(r"(?:\+91[-\s]?)?[6-9]\d{9}\b", text)))[:3]
    found = [k for k in keywords if _mentions(low, k)]
    missing = [k for k in keywords if k not in found]
    headings = [w for w in HEADING_WORDS if _mentions(low, w)]

    lines = ["# Document check", "",
             f"Read from a `{suffix.lstrip('.')}` file with markitdown {_markitdown_version()}.", "",
             "| what | value |", "|---|---|",
             f"| characters | {len(text)} |",
             f"| words | {words} |"]
    if pages:
        lines.append(f"| pages | {pages} |")
    lines += [
        f"| email | {emails[0] if emails else 'not found'} |",
        f"| phone | {phones[0] if phones else 'not found'} |",
        f"| heading words that appear | {', '.join(headings) if headings else 'none of the common ones'} |",
        "", "## Keywords", "",
    ]
    if keywords:
        lines.append(f"Matched as whole words: {len(found)} of {len(keywords)} appear in the document.")
        lines += ["", "**In the document:** " + (", ".join(found) if found else "none of them"),
                  "", "**Not in the document:** " + (", ".join(missing) if missing else "none — every keyword appears")]
    else:
        lines.append("No keywords were sent with this job, so nothing was scored. Send "
                     "`keywords=python,sql,django` to have each term checked against the document.")
    lines += ["", "## The document, as text", "", text]

    out = ("\n".join(lines) + "\n").encode("utf-8")
    return out, {
        "extractor": f"markitdown {_markitdown_version()}",
        "input_suffix": suffix,
        "text_len": len(text),
        "words": words,
        "pages": pages,
        "emails": emails,
        "phones": phones,
        "headings": headings,
        "keywords_found": found,
        "keywords_missing": missing,
        "content_type": "text/markdown",
    }


# ---------------------------------------------------------------------------
# Documents -> another language (queue item 15)
#
# The catalogue row is `translate-doc` ("Document Translation", Rs 49, one_time):
# it already existed, and the engine was the missing half.
#
# Two engines, in a chain, and the order is a measurement rather than a preference.
#
# PRIMARY: @cf/qwen/qwen3-30b-a3b-fp8 with a translation prompt. Measured on the
# Hindi fixture below: faithful (keeps names, dates and figures) where the purpose-
# built translation models were not. It is a *thinking* model, and that has two
# consequences worth writing down: `chat_template_kwargs: {"enable_thinking": false}`
# answers **200 with an empty string** (measured), so thinking has to be budgeted for
# — max_tokens 2048, and an empty response is retried once at 4096 before the chain
# moves on. Sentences take 10-20 s and a 500-character document 4-6 s, so the cost is
# dominated by thinking, not by length.
#
# FALLBACK: @cf/meta/m2m100-1.2b, which honours source_lang/target_lang. The router's
# translate chain names @cf/ai4bharat/indictrans2-en-indic-1B first; measured here
# 2026-09-17 it IGNORES both language fields — Hindi sent as `source_lang=hin_Deva,
# target_lang=eng_Latn` came back in *Hindi*, and English with `target_lang=tam_Taml`
# came back in *Hindi* too — so it is English -> Hindi whatever the caller asks for,
# and its input is cut at 256 tokens (a 1,080-character Hindi paragraph answered with
# a repetitive sentence that was not a translation of it). m2m100 is the honest second
# leg: it answered hi->en and en->hi correctly, but its Hindi output is visibly poorer
# ("RUB 350", the two parties both called seller) which is why it is not the first leg.
#
# A language is offered only when a **round trip** kept the sentence intact — the
# probe is "Payment is due within thirty days of the invoice date." translated into
# the language and back to English, and the English has to come back saying thirty
# days. That test removed two languages that look fine from the outside:
#   - `gu` (Gujarati): 5 probes, 5 wrong numbers — eighteen days, three months, a
#     hundred days, sixty days. The figure is what a bill is *about*, so it is not
#     offered rather than shipped with a caveat.
#   - `te` (Telugu): the LLM answer was empty and m2m100 refuses the code outright
#     (400 "Invalid data for input ... target"), so there is no leg to serve it.
# m2m100 alone had also failed `ml`, `ne` and `or` (the thirty days vanished) — those
# three are fine on the primary leg, which is where they are served from.
# Re-run that round-trip probe before adding a code here, on both legs.
# ---------------------------------------------------------------------------
TRANSLATE_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8"          # primary leg (an LLM)
TRANSLATE_FALLBACK_MODEL = "@cf/meta/m2m100-1.2b"       # second leg (a translation model)
TRANSLATE_LANG_NAMES = {
    "en": "English", "hi": "Hindi", "bn": "Bengali", "mr": "Marathi", "ta": "Tamil",
    "ml": "Malayalam", "kn": "Kannada", "pa": "Punjabi", "or": "Odia",
    "as": "Assamese", "ur": "Urdu",
}
TRANSLATE_LANGS = TRANSLATE_LANG_NAMES
TRANSLATE_LANG_LIST = ", ".join(TRANSLATE_LANGS)

# One request per chunk: it keeps every call inside the model's own input size and
# keeps a long document from becoming one 180-second call the route would abandon.
# Measured here: a ~500-character document in 3.8-5.8 s and a single sentence in
# 10-20 s (thinking dominates), so the ceiling below is roughly 10 chunks — about
# four A4 pages — and stays clear of the route's 180 s ceiling while the live site
# keeps its CPU.
TRANSLATE_CHUNK_CHARS = 900
MAX_TRANSLATE_CHARS = 9000


def _split_long(text: str, limit: int) -> list[str]:
    """A single long paragraph, cut on sentence ends (then on spaces as a last resort)."""
    pieces: list[str] = []
    rest = text
    while len(rest) > limit:
        window = rest[:limit]
        cut = max(window.rfind(". "), window.rfind("। "), window.rfind("? "), window.rfind("! "))
        if cut < limit // 3:
            cut = window.rfind(" ")
        if cut < limit // 3:
            cut = limit - 1
        pieces.append(rest[:cut + 1].strip())
        rest = rest[cut + 1:].strip()
    if rest:
        pieces.append(rest)
    return [p for p in pieces if p]


def _chunks(text: str, limit: int = TRANSLATE_CHUNK_CHARS) -> list[str]:
    """Paragraph-shaped chunks of at most `limit` characters.

    A paragraph is what the model translates best and a document's shape is worth
    keeping: consecutive short paragraphs are packed up to the limit, and a
    paragraph longer than it is split on sentence ends.
    """
    out: list[str] = []
    buf: list[str] = []

    def flush() -> None:
        if buf:
            out.append("\n".join(buf))
            buf.clear()

    for para in re.split(r"\n\s*\n", text.strip()):
        para = para.strip()
        if not para:
            continue
        for piece in ([para] if len(para) <= limit else _split_long(para, limit)):
            if buf and len("\n".join([*buf, piece])) > limit:
                flush()
            buf.append(piece)
    flush()
    return out


def _cf_ai_json(model: str, payload: dict, token: str) -> dict:
    """One Workers AI call that answers JSON. The caller reads `result`.

    Goes through the same retry as the image path (item 29) — a transient edge refusal used
    to end a translation job. `keep_http_error` because this chain reads the status: a 4xx
    from the fallback model is the service refusing the language pair, which is the caller's
    mistake and answers 400, so it must not arrive wrapped in a generic RuntimeError.
    """
    body, _ctype, _attempts = _cf_ai_run(model, payload, token, timeout=120,
                                         keep_http_error=True)
    return json.loads(body) or {}


def _translate_piece(text: str, source: str, target: str, token: str) -> tuple[str, dict]:
    """One chunk through the chain, with one retry per leg.

    Leg 1 is the LLM and it is called **twice** on purpose: it is a thinking model, and
    a run that spends its whole token budget thinking comes back 200 with an empty
    string (measured — that is also what `enable_thinking: false` does), so the second
    call gets a bigger budget before the chain gives up on it. Leg 2 is m2m100, which
    needs none of that but is a poorer translator. A 4xx from leg 2 is the service
    refusing the language pair, which is the caller's problem, so it answers 400.
    """
    reasons: list[str] = []
    for max_tokens in (2048, 4096):
        try:
            result = _cf_ai_json(TRANSLATE_MODEL, {
                "messages": [{
                    "role": "user",
                    "content": (f"Translate the following {TRANSLATE_LANGS[source]} text into "
                                f"{TRANSLATE_LANGS[target]}. Keep every number, name, date and "
                                "amount exactly as it is written. Reply with the translation "
                                "only, with no notes and no explanation.\n\n" + text),
                }],
                "max_tokens": max_tokens,
            }, token).get("result") or {}
            out = (result.get("response") or "").strip()
            if out:
                usage = dict(result.get("usage") or {})
                usage["engine"] = TRANSLATE_MODEL
                return out, usage
            reasons.append(f"{TRANSLATE_MODEL} came back empty at max_tokens {max_tokens}")
        except urllib.error.HTTPError as exc:
            reasons.append(f"{TRANSLATE_MODEL} HTTP {exc.code}")
        except Exception as exc:  # noqa: BLE001 — timeout, socket, unreadable body
            reasons.append(f"{TRANSLATE_MODEL} failed: {exc}")

    refused = False
    for attempt in (1, 2):
        try:
            result = _cf_ai_json(TRANSLATE_FALLBACK_MODEL, {
                "text": text, "source_lang": source, "target_lang": target,
            }, token).get("result") or {}
            out = (result.get("translated_text") or "").strip()
            if not out:
                raise RuntimeError("the fallback model returned no text")
            usage = dict(result.get("usage") or {})
            usage["engine"] = TRANSLATE_FALLBACK_MODEL
            usage["attempts"] = attempt
            return out, usage
        except urllib.error.HTTPError as exc:
            detail = exc.read()[:160].decode("utf-8", "replace").strip()
            if exc.code < 500 and exc.code != 429:
                refused = True
                reasons.append(f"{TRANSLATE_FALLBACK_MODEL} refused: {detail}")
                break
            reasons.append(f"{TRANSLATE_FALLBACK_MODEL} HTTP {exc.code}")
        except Exception as exc:  # noqa: BLE001
            reasons.append(f"{TRANSLATE_FALLBACK_MODEL} failed: {exc}")

    joined = "; ".join(reasons)
    if refused:
        raise UserError(f"no engine could translate {TRANSLATE_LANGS[source]} into "
                        f"{TRANSLATE_LANGS[target]}: {joined[:200]}")
    raise RuntimeError(f"no engine could translate this text ({joined[:200]})")


def translate_doc(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """A document in; the same text in another language out, as Markdown.

    The output IS the translation (its `content_type` says `text/markdown`), with a
    short header saying which model ran, in which direction, and what it cost in
    tokens — because a machine translation nobody proof-reads is only honest when
    the page says it is one.
    """
    if not inputs:
        raise UserError("a document is required")
    data = inputs[0]
    if not data:
        raise UserError("the file is empty")

    source = (params.get("source") or "").strip().lower()
    target = (params.get("target") or "").strip().lower()
    for name, code in (("source", source), ("target", target)):
        if not code:
            raise UserError(f"{name} language is required — one of: {TRANSLATE_LANG_LIST}")
        if code not in TRANSLATE_LANGS:
            raise UserError(f"'{code}' is not one of the languages this engine translates "
                            f"({TRANSLATE_LANG_LIST})")
    if source == target:
        raise UserError(f"source and target are both '{source}' — that is not a translation")

    kind = _image_kind(data)
    if kind:
        raise UserError(
            f"that file is a {kind} image, not a document — a photo has no text layer, "
            "so send a PDF, DOCX or text file (OCR the photo first)")
    suffix = _doc_suffix(data)

    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
        try:
            from markitdown import MarkItDown
        except ImportError as exc:
            raise RuntimeError(f"markitdown is not installed on this VM: {exc}")
        try:
            text = (MarkItDown().convert(path).text_content or "").strip()
        except Exception as exc:
            raise UserError(f"could not read that document: {exc}")
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    if len(re.findall(r"\w", text, re.UNICODE)) < 10:
        raise UserError("no readable text was found in that document — a scan or a photo "
                        "has no text layer until it is OCR'd")
    if len(text) > MAX_TRANSLATE_CHARS:
        raise UserError(f"that document is {len(text)} characters; this engine translates up to "
                        f"{MAX_TRANSLATE_CHARS} in one job (about four pages of text) — send it in parts")

    token = _cf_ai_token()
    if not token:
        raise RuntimeError("CLOUDFLARE_API_TOKEN missing (worker env or Hermes .env)")

    pieces = _chunks(text)
    started = time.time()
    translated: list[str] = []
    tokens_in = tokens_out = neurons = 0
    engines: dict[str, int] = {}
    for piece in pieces:
        out, usage = _translate_piece(piece, source, target, token)
        translated.append(out)
        tokens_in += int(usage.get("prompt_tokens") or 0)
        tokens_out += int(usage.get("completion_tokens") or 0)
        neurons += int(float(usage.get("neurons") or 0))
        engines[usage["engine"]] = engines.get(usage["engine"], 0) + 1
    seconds = round(time.time() - started, 1)
    out_text = "\n\n".join(translated)
    engine_label = ", ".join(f"`{name}` ({count})" for name, count in engines.items())

    lines = [
        "# Document translation",
        "",
        f"{TRANSLATE_LANGS[source]} ({source}) to {TRANSLATE_LANGS[target]} ({target}), "
        f"translated by {engine_label}. Machine translation: read it before you send it.",
        "",
        "| what | value |", "|---|---|",
        f"| characters in | {len(text)} |",
        f"| characters out | {len(out_text)} |",
        f"| paragraphs sent | {len(pieces)} |",
        f"| seconds | {seconds} |",
        f"| model tokens in / out | {tokens_in} / {tokens_out} |",
        f"| neurons billed | {neurons} |",
        "",
        f"## In {TRANSLATE_LANGS[target]}",
        "",
        out_text,
        "",
    ]
    return ("\n".join(lines) + "\n").encode("utf-8"), {
        "model": TRANSLATE_MODEL,
        "engines": engines,
        "fallback": TRANSLATE_FALLBACK_MODEL,
        "source": source,
        "target": target,
        "langs": [source, target],
        "extractor": f"markitdown {_markitdown_version()}",
        "input_suffix": suffix,
        "chars_in": len(text),
        "chars_out": len(out_text),
        "chunks": len(pieces),
        "seconds": seconds,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "neurons": neurons,
        "content_type": "text/markdown",
    }


def resume_builder(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """A résumé, rendered locally: one JSON payload in, a vector A4 PDF out.

    This function is deliberately the *only* half that touches pdfcpu. What fits on a page
    — wrapping, where the breaks fall, never leaving a heading stranded at the foot — is
    `resume_layout.layout()`, which imports nothing and is asserted by
    `scripts/check-resume.py` with plain python3. So a page-rule regression is catchable on
    any machine, and the renderer cannot quietly disagree with the check about what a page
    holds.

    The output is vector text on purpose: a résumé is read by software before it is read by
    a person, and an image-only PDF is one an applicant tracking system cannot parse. That
    is also why the screen offers no "make it pretty" option — a designed template is a
    later product, and a half-designed one is worse than none.
    """
    t0 = time.time()
    try:
        payload = json.loads(params.get("payload") or "{}")
    except ValueError as exc:
        raise UserError(f"payload is not valid JSON: {exc}")

    try:
        result = resume_layout.layout(payload)
    except resume_layout.LayoutError as exc:
        # The caller's own text was wrong, not the server's: UserError so the route answers
        # 400 with this sentence, which the screen can show as-is.
        raise UserError(str(exc))

    spec = resume_layout.to_pdfcpu(result)
    with tempfile.TemporaryDirectory() as td:
        spec_path = os.path.join(td, "resume.json")
        out_path = os.path.join(td, "resume.pdf")
        with open(spec_path, "w", encoding="utf-8") as fh:
            json.dump(spec, fh)
        _pdfcpu(["create", spec_path, out_path])
        with open(out_path, "rb") as fh:
            out = fh.read()
        pages = pdf_page_count(out_path)

    meta = result["meta"]
    return out, {
        "doc": "resume",
        "render": "vector",
        "pages": pages,
        "blocks": meta["blocks"],
        "experience": meta["experience"],
        "education": meta["education"],
        "has_summary": meta["has_summary"],
        "has_skills": meta["has_skills"],
        # The layout's own warnings, passed through rather than re-derived: a screen that
        # guesses why a CV is weak is a screen that eventually guesses wrong.
        "warnings": result["warnings"],
        "ms": int((time.time() - t0) * 1000),
        "content_type": "application/pdf",
    }


# ---------------------------------------------------------------------------
# Subtitles and voice-over (queue item 57)
#
# Both are hosted Workers AI calls, and they are the first products here whose core is a
# model rather than a local engine. The division of labour is deliberate: everything that
# can be wrong *without* the model — the caption file's format, its numbering, the tags a
# player would print as noise — is in `captions.py`, which imports nothing and is asserted
# by `scripts/check-captions.py`. What is left here is the call and the bookkeeping.
# ---------------------------------------------------------------------------
SUBTITLES_MODEL = os.environ.get("CF_AI_WHISPER_MODEL", "@cf/openai/whisper-large-v3-turbo")
TTS_MODEL = os.environ.get("CF_AI_TTS_MODEL", "@cf/myshell-ai/melotts")

# Cloudflare's published list prices, USD per audio minute, so a job row carries the rate it
# was billed at instead of a figure someone remembered.
CF_AI_AUDIO_USD_PER_MIN = {
    "@cf/openai/whisper-large-v3-turbo": 0.000513,
    "@cf/myshell-ai/melotts": 0.000205,
}

# The route's own body cap is 25 MB; this leaves the JSON envelope room. A two-minute reel's
# audio is a couple of megabytes, so the limit is generous rather than tight.
MAX_AUDIO_BYTES = 24 * 1024 * 1024

# A voice-over is read aloud: past a few thousand characters the wait stops being a wait, and
# the free tier's per-request budget is what actually runs out first.
MAX_TTS_CHARS = 4000

# The model is multilingual; only English is offered, because nothing else has been measured
# on this box — and for this market that matters. A synthetic voice that mispronounces Hindi
# is worse than an honest "English only in this build", so the list stays at one until a
# language has been listened to. (`lang` is also validated here rather than passed through:
# an unsupported code is a 400 from the model, which would read as our outage.)
TTS_LANGS = ("en",)


def _http_detail(exc: urllib.error.HTTPError) -> str:
    """The service's own sentence about a refusal, short enough to put on a screen.

    `_cf_ai_run` reads the error body once, to put it in its own message, and a stream cannot
    be read twice — so it leaves the text on the exception and this reads that first. Without
    it the caller's sentence comes back empty and a 400 reads as a bare status code, which is
    exactly what the retry work (item 29) exists to avoid.
    """
    carried = getattr(exc, "dropby_detail", "")
    if carried:
        return f": {carried}"
    try:
        detail = exc.read()[:160].decode("utf-8", "replace").strip()
    except Exception:  # noqa: BLE001 — a body that cannot be read is not the point
        return ""
    return f": {detail}" if detail else ""


def subtitles(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """Audio in, one SRT out. The model supplies the timings; `captions.py` supplies the file.

    SRT rather than a burned-in video, and the screen says so: burning captions into a video
    needs ffmpeg, which is not installed on this box, and a caption file is what a reel editor
    (CapCut, InShot, Premiere) actually imports. Returning an MP4 that silently kept its old
    audio would be the dishonest version of this feature.
    """
    if not inputs or not inputs[0]:
        raise UserError("an audio file is required")
    audio = inputs[0]
    if len(audio) > MAX_AUDIO_BYTES:
        raise UserError(
            f"the audio is {len(audio) // (1024 * 1024)} MB; the limit is "
            f"{MAX_AUDIO_BYTES // (1024 * 1024)} MB — trim it or send a lower bitrate"
        )

    token = _cf_ai_token()
    if not token:
        raise RuntimeError("CLOUDFLARE_API_TOKEN missing (worker env or Hermes .env)")

    language = (params.get("language") or "").strip().lower()
    payload: dict = {"audio": base64.b64encode(audio).decode(), "task": "transcribe"}
    if language:
        payload["language"] = language

    t0 = time.time()
    try:
        result = _cf_ai_json(SUBTITLES_MODEL, payload, token).get("result") or {}
    except urllib.error.HTTPError as exc:
        # `_cf_ai_json` re-raises the HTTP error on purpose (the translate chain reads the
        # status). A 4xx here means the service refused *this audio* or this language code —
        # the caller's file, answered 400 with the service's own words, so an unreadable
        # voice note does not look like our outage. 5xx stays a 500.
        if 400 <= exc.code < 500:
            raise UserError(f"the transcriber refused this audio (HTTP {exc.code}"
                            f"{_http_detail(exc)})")
        raise
    try:
        cues, transcript = captions.subtitles_from_answer(result)
    except captions.CaptionError as exc:
        # The audio was unusable (no speech, or it could not be decoded) — that is the
        # caller's file, so 400 with the sentence, not a 502 that reads as our fault.
        raise UserError(str(exc))

    srt = captions.to_srt(cues)
    span_min = captions.span_minutes(cues)
    rate = CF_AI_AUDIO_USD_PER_MIN.get(SUBTITLES_MODEL, 0.0)
    return srt.encode("utf-8"), captions.describe(cues, {
        "doc": "subtitles",
        "model": SUBTITLES_MODEL,
        "format": "srt",
        "content_type": "application/x-subrip",
        "lang": language or "auto",
        "bytes": len(srt.encode("utf-8")),
        # The transcript itself, so the screen can show what was heard without a second job.
        # A preview, not the whole thing, and named as one: a long reel's transcript would
        # otherwise ride in this meta and be dropped by the row's own 16 KB cap, which reads
        # as "the engine said nothing".
        "text_preview": transcript[:1200],
        "text_chars": len(transcript),
        # `transcribed_minutes`, never `audio_minutes`: the model reports timings, not the
        # audio's length, and the two are not the same number (silence at the head, music at
        # the tail). What is billed is the audio, so this figure is a floor, and saying so in
        # the name is cheaper than being wrong in the row.
        "transcribed_minutes": round(span_min, 3),
        "usd_floor": round(rate * span_min, 6),
        "seconds": round(time.time() - t0, 1),
    })


def voiceover(params: dict) -> tuple[bytes, dict]:
    """A script in, one MP3 out, via Workers AI's MeloTTS.

    The script rides in `payload` rather than in a plain field: it is up to `MAX_TTS_CHARS`
    long, and the route's shared 120-character field cap is there to stop a stray parameter
    from being an essay. The invoice and the résumé builder already take a JSON payload, so
    this is the same shape rather than a fourth convention.
    """
    try:
        payload = json.loads(params.get("payload") or "{}")
    except ValueError as exc:
        raise UserError(f"payload is not valid JSON: {exc}")
    if not isinstance(payload, dict):
        raise UserError("payload must be a JSON object")

    text = str(payload.get("text") or "").strip()
    if not text:
        raise UserError("the script is required")
    if len(text) > MAX_TTS_CHARS:
        raise UserError(
            f"the script is {len(text)} characters; the limit is {MAX_TTS_CHARS} for one clip"
        )
    lang = str(payload.get("lang") or "en").strip().lower()
    if lang not in TTS_LANGS:
        raise UserError(
            f"'{lang}' is not offered in this build; it reads {', '.join(TTS_LANGS)} — the "
            "model knows other languages, but none of them has been listened to here yet"
        )

    token = _cf_ai_token()
    if not token:
        raise RuntimeError("CLOUDFLARE_API_TOKEN missing (worker env or Hermes .env)")

    t0 = time.time()
    try:
        # `keep_http_error` so a 4xx can be told from an outage: the voice model refuses a
        # script it cannot read (an unsupported language, a body over its limit), which is the
        # caller's input and answers 400 — not the 502 that "Could not finish the job" implies.
        body, ctype, attempts = _cf_ai_run(TTS_MODEL, {"prompt": text, "lang": lang}, token,
                                           timeout=180, keep_http_error=True)
    except urllib.error.HTTPError as exc:
        if 400 <= exc.code < 500:
            raise UserError(f"the voice model refused this script (HTTP {exc.code}"
                            f"{_http_detail(exc)})")
        raise
    if ctype.startswith("application/json"):
        # The model answers either a JSON envelope with base64 audio or the MP3 itself,
        # depending on the endpoint; both shapes are handled because both were documented.
        b64 = (json.loads(body).get("result") or {}).get("audio")
        if not b64:
            raise RuntimeError("Workers AI returned no audio")
        audio = base64.b64decode(b64)
    else:
        audio = body
    if not audio:
        raise RuntimeError("Workers AI returned an empty clip")

    return audio, {
        "doc": "voiceover",
        "model": TTS_MODEL,
        "content_type": "audio/mpeg",
        "lang": lang,
        "bytes": len(audio),
        "chars": len(text),
        "words": len(text.split()),
        "attempts": attempts,
        "seconds": round(time.time() - t0, 1),
        # No duration and therefore no cost figure: the model does not return the clip's
        # length, and the only way to invent one is to guess words-per-minute. `cost-report`
        # adds the per-minute rate when it has a length; a guess in a job row is worse than a
        # gap, because someone eventually prices a product from it.
    }


# ---------------------------------------------------------------------------
# Room redesign (queue item 59)
#
# The product was parked for a round because every image-to-image model had gone: the whole
# Workers AI catalogue has none, and `stable-diffusion-v1-5-img2img`'s docs page 404s. What
# replaced it is FLUX.2 [klein], which "unifies image generation and editing" and takes up to
# four reference images — the shape that makes "restyle *this* room" possible at all. Its
# request is not JSON (see `multipart.py`), and its documented input limit is the reason this
# function resizes before it sends.
# ---------------------------------------------------------------------------
FLUX2_MODEL = os.environ.get("CF_AI_ROOM_MODEL", "@cf/black-forest-labs/flux-2-klein-4b")

# From the model's own docs: "All input images must be smaller than 512x512". Sent larger, the
# call is refused — so the fit happens here rather than by asking the caller to resize a photo
# they just took.
ROOM_INPUT_MAX = 512

# The five looks, as prompt fragments rather than a style id the model has never heard of.
# Each names the materials and the light, because those are what actually change a room.
ROOM_LOOKS = {
    "warm": ("warm, cosy Indian-contemporary living room: teak and cane furniture, terracotta "
             "and mustard textiles, brass accents, soft warm lamplight"),
    "minimal": ("calm minimal room: plain off-white walls, one low pale-wood sofa, almost no "
                "clutter, large window light, a single plant"),
    "modern": ("modern urban room: charcoal and walnut, a low-profile sofa, a geometric rug, "
               "muted green accents, even daylight"),
    "classic": ("classic Indian home: carved dark wood, a patterned dhurrie, deep maroon and "
                "gold textiles, a brass lamp and warm pools of light"),
    "bright": ("bright, airy room: white walls and light oak, linen upholstery, yellow and teal "
               "cushions, several plants, strong natural light"),
}

# Said in every prompt, because it is the promise the listing makes. A restyle that moves the
# window is not this room any more, it is a different room — which is a different (and useless)
# product for someone standing in theirs.
ROOM_KEEP = ("Keep this exact room: the same walls, the same window and door positions, the same "
             "floor and the same camera angle. Change only the furniture, the materials, the "
             "colours and the lighting.")


def room_redesign(inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """A photo of a room in, a restyled photo out, with FLUX.2 [klein] as the editor."""
    if not inputs or not inputs[0]:
        raise UserError("a photo of the room is required")
    look = (params.get("style") or "warm").strip().lower()
    if look not in ROOM_LOOKS:
        raise UserError(
            f"'{look}' is not one of the looks this build offers ({', '.join(ROOM_LOOKS)})"
        )

    token = _cf_ai_token()
    if not token:
        raise RuntimeError("CLOUDFLARE_API_TOKEN missing (worker env or Hermes .env)")

    t0 = time.time()
    try:
        img = Image.open(io.BytesIO(inputs[0]))
        # A phone photo carries its rotation in EXIF; ignoring it sends the model a room on its
        # side and gets a restyled room back on its side.
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")
    except Exception as exc:  # noqa: BLE001 — any decode failure is the caller's file
        raise UserError(f"that file could not be read as a photo: {str(exc)[:120]}")

    original_w, original_h = img.size
    scale = min(1.0, ROOM_INPUT_MAX / max(original_w, original_h))
    if scale < 1.0:
        # LANCZOS rather than the default: the model is being asked about materials and
        # colours, and a nearest-neighbour downscale throws exactly that information away.
        img = img.resize(
            (max(1, round(original_w * scale)), max(1, round(original_h * scale))),
            Image.LANCZOS,
        )
    buf = io.BytesIO()
    img.save(buf, "PNG")

    prompt = f"Redesign this room as a {ROOM_LOOKS[look]}. {ROOM_KEEP}"
    body, ctype = multipart.encode(
        {"prompt": prompt, "width": "1024", "height": "1024"},
        [("input_image_0", "room.png", buf.getvalue(), "image/png")],
    )

    try:
        raw, resp_type, attempts = _cf_ai_run(
            FLUX2_MODEL, {}, token, timeout=180, keep_http_error=True,
            raw_body=body, raw_type=ctype,
        )
    except urllib.error.HTTPError as exc:
        detail = _http_detail(exc)
        if exc.code in (401, 403):
            # On a Partner model this is the *account*, not the file: BFL's terms are accepted
            # in the Cloudflare dashboard with one click, the same class of blocker the vision
            # model hit. Answered as a server fault so it cannot be mistaken for a bad photo,
            # with the service's own words kept for whoever fixes it.
            raise RuntimeError(f"the image model refused this account (HTTP {exc.code}{detail})")
        raise UserError(f"the image model refused this request (HTTP {exc.code}{detail})")

    if resp_type.startswith("application/json"):
        blob = (json.loads(raw).get("result") or {}).get("image")
        if not blob:
            raise RuntimeError("Workers AI returned no image")
        out = base64.b64decode(blob)
    else:
        out = raw
    if not out:
        raise RuntimeError("Workers AI returned an empty image")

    return out, {
        "doc": "room-redesign",
        "model": FLUX2_MODEL,
        "look": look,
        # Both sizes, because the input limit is a documented constraint and a job row that
        # says `sent 512x384` is how anyone later proves the fit happened rather than guessing.
        "input_px": f"{original_w}x{original_h}",
        "sent_px": f"{img.width}x{img.height}",
        "content_type": "image/jpeg",
        "bytes": len(out),
        "attempts": attempts,
        "seconds": round(time.time() - t0, 1),
    }


PRODUCTS = ["passport-photo", "bg-remove", "watermark", "pdf-tools", "image-toolkit",
            "invoice-maker", "pdf-stamp", "ai-image", "photos-to-pdf", "collage",
            "resume-checker", "resume-builder", "translate-doc", "subtitles", "voiceover",
            "room-redesign"]


def run_job(product: str, inputs: list[bytes], params: dict) -> tuple[bytes, dict]:
    """Dispatch one job.

    Every product takes a LIST of input files and a dict of parameters, because
    merging needs several PDFs while a passport photo needs one. Single-file
    products just read inputs[0]; that keeps one protocol for both instead of a
    route that has to know which products are special.
    """
    if product == "passport-photo":
        return passport_photo(inputs[0], params.get("size", DEFAULT_SIZE))
    if product == "bg-remove":
        return bg_remove(inputs[0])
    if product == "watermark":
        return watermark(inputs[0])
    if product == "pdf-tools":
        return pdf_tools(inputs, params)
    if product == "photos-to-pdf":
        return photos_to_pdf(inputs, params)
    if product == "collage":
        return collage(inputs, params)
    if product == "image-toolkit":
        return image_toolkit(inputs[0], params)
    if product == "invoice-maker":
        return invoice_maker(inputs, params)
    if product == "pdf-stamp":
        return pdf_stamp(inputs, params)
    if product == "ai-image":
        return ai_image(params)
    if product == "resume-checker":
        return resume_check(inputs, params)
    if product == "translate-doc":
        return translate_doc(inputs, params)
    if product == "subtitles":
        return subtitles(inputs, params)
    if product == "voiceover":
        return voiceover(params)
    if product == "room-redesign":
        return room_redesign(inputs, params)
    raise KeyError(product)


class Handler(BaseHTTPRequestHandler):
    """POST /job/<product>?size=<size> with the raw file as the body -> processed file back."""

    # Windows happily lets a second socket bind an already-bound port when
    # SO_REUSEADDR is on (Python's default for HTTPServer), which is how a stale
    # worker left behind by a pm2 restart kept serving old code from :8099 while
    # pm2 reported the new process online. Refusing the second bind turns that
    # silent split-brain into a loud "address already in use" in the pm2 log.
    allow_reuse_address = False

    def do_POST(self):  # noqa: N802
        # Split the query string off first: the parameters are part of the job, not
        # part of the product name, and the body is the file (or files).
        path, _, query = self.path.partition("?")
        if path.rstrip("/") == "/internal/retire":
            # A newer worker is starting and needs the port. Answer first, then go:
            # the socket has to be closed for the successor's bind to succeed.
            self._send(200, b'{"ok":true,"retiring":true}', "application/json")
            print("worker: retiring on request (a newer worker is taking over)", flush=True)
            os._exit(0)
        parts = path.strip("/").split("/")
        if len(parts) != 2 or parts[0] != "job" or parts[1] not in PRODUCTS:
            return self._send(404, b'{"error":"unknown product"}', "application/json")
        params = {k: v[0] for k, v in urllib.parse.parse_qs(query).items()}
        length = int(self.headers.get("Content-Length") or 0)
        data = self.rfile.read(length) if length else b""
        # ai-image is text-only: the prompt rides in the query string and
        # there is no file to upload, so an empty body is valid for it.
        if not data and parts[1] != "ai-image":
            return self._send(400, b'{"error":"empty body"}', "application/json")
        try:
            inputs = self._inputs(data) if data else []
            out, meta = run_job(parts[1], inputs, params)
        except UserError as exc:
            # The request is wrong, not the server: 400 so the caller (the Next
            # route, and through it the app or a script) can show the reason. Every
            # UserError message is written to be read by the person who sent the job.
            print(f"worker: 400 {parts[1]}: {exc}", flush=True)
            return self._send(400, json.dumps({"error": str(exc)[:200]}).encode(), "application/json")
        except Exception as exc:
            return self._send(500, json.dumps({"error": str(exc)[:200]}).encode(), "application/json")
        # A product that changes the file type says so; everything else keeps the
        # long-standing default (PNG for the background remover, JPEG otherwise).
        content_type = meta.pop("content_type", None) or (
            "image/png" if parts[1] == "bg-remove" else "image/jpeg")
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("X-Job-Meta", json.dumps(meta))
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def _inputs(self, data: bytes) -> list[bytes]:
        """The job's input files.

        Two shapes, on purpose:
          - the raw file as the body (every single-file product);
          - a JSON envelope `{"files":[{"name":..,"data":<base64>}],"params":{..}}`
            for jobs that need several files, like merging two PDFs. Base64 on the
            loopback interface costs a third more bytes and saves inventing a
            multipart parser on both sides.
        """
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if ctype != "application/json":
            return [data]
        try:
            env = json.loads(data.decode("utf-8"))
            files = env.get("files") or []
            # A data-only job (an invoice is JSON, not an upload) legitimately has no
            # files — the product's parameters are the input.
            return [base64.b64decode(f["data"]) for f in files]
        except (ValueError, AttributeError, TypeError, KeyError) as exc:
            # A malformed envelope is the caller's mistake, and the one case where
            # saying so is the whole answer.
            raise UserError(f"body is not a valid job envelope: {exc}")

    def do_GET(self):  # noqa: N802
        if self.path == "/health":
            # `pid` is here so a stale listener cannot hide: two workers on one port
            # was a real failure mode (pm2 left the Python child alive), and the only
            # way to see it from outside is to ask who is answering.
            return self._send(200, json.dumps({
                "ok": True,
                "pid": os.getpid(),
                "started_at": STARTED_AT,
                "products": PRODUCTS,
                "sizes": SIZES,
                "pdfcpu": os.path.exists(PDFCPU_BIN),
            }).encode(), "application/json")
        self._send(404, b'{"error":"not found"}', "application/json")

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):  # keep pm2 logs readable
        pass


def _probe(port: int) -> dict | None:
    """Ask whoever answers :<port>/health who they are. None when nothing does."""
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=5) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except Exception:
        return None


def _ask_retire(port: int, pid: int) -> bool:
    """Ask one specific worker to step aside (or clear it out if it cannot)."""
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/internal/retire", method="POST")
        with urllib.request.urlopen(req, timeout=10):
            pass
        print(f"worker: pid {pid} is retiring at our request", flush=True)
        return True
    except Exception:
        # No retire endpoint: a worker from before this code existed, so it is
        # stale by definition. Confirmed as one of ours by the /health probe above.
        print(f"worker: pid {pid} has no retire endpoint (older code) — clearing it out", flush=True)
        subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True, timeout=20)
        return True


def _clear_port(port: int, rounds: int = 8) -> bool:
    """Get every other worker off the port, however many are on it.

    One stale worker is the common case, but a crash-loop can leave several (two
    sockets can both bind a Windows port when SO_REUSEADDR is set), so this keeps
    asking until nothing foreign answers or the attempts run out.
    """
    for _ in range(rounds):
        info = _probe(port)
        if not info:
            return True  # nothing is answering: the port is ours to take
        other = info.get("pid")
        if not other or int(other) == os.getpid():
            return True
        if not _ask_retire(port, int(other)):
            return False
        time.sleep(1.2)
    return False


def _parent_alive(ppid: int) -> bool:
    """Is the process that started us still there?"""
    try:
        out = subprocess.run(["tasklist", "/FI", f"PID eq {ppid}", "/FO", "CSV", "/NH"],
                             capture_output=True, timeout=15).stdout.decode("utf-8", "replace")
    except Exception:
        return True  # a failed probe must never take the service down
    return str(ppid) in out


def _watch_parent(interval: float = 5.0) -> None:
    """Exit when pm2's fork-container dies, so the next worker can bind the port.

    pm2 on Windows stops the node container and leaves the real Python child
    running with its socket open. That orphan answers requests with stale code
    while pm2 reports the new process online — which is exactly how a fix under
    test appears to do nothing. Rather than have the new worker kill the old one
    (that kills the pid pm2 is still tracking, and pm2 restarts forever), the
    orphan notices it has been orphaned and exits by itself.
    """
    ppid = os.getppid()
    if ppid <= 0:
        return
    while True:
        time.sleep(interval)
        if not _parent_alive(ppid):
            print(f"worker: parent {ppid} is gone — exiting so the next worker can bind", flush=True)
            os._exit(0)


if __name__ == "__main__":
    import signal
    import threading
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8099)
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--input")
    ap.add_argument("--size", default=DEFAULT_SIZE, choices=sorted(SIZES))
    args = ap.parse_args()

    if args.selftest:
        src = args.input or os.path.join(os.environ.get("LOCALAPPDATA", "."), "Temp", "pollinations-flux.jpg")
        with open(src, "rb") as fh:
            raw = fh.read()
        out, meta = passport_photo(raw, args.size)
        dst = os.path.join(os.environ.get("LOCALAPPDATA", "."), "Temp", f"passport_sheet_{args.size}.jpg")
        with open(dst, "wb") as fh:
            fh.write(out)
        print(f"passport-photo selftest (size={args.size})")
        print("  input :", src, len(raw), "bytes")
        print("  output:", dst, len(out), "bytes")
        print("  meta  :", json.dumps(meta))
        sys.exit(0)

    # pm2 stops a process with SIGTERM (then SIGKILL). On Windows a killed Python
    # process can leave its listening socket behind, which is how a stale worker
    # kept answering on :8099 while pm2 reported a fresh one — serving old code to
    # the API route. Handle the signal and exit properly instead.
    def _stop(signum, _frame):
        print(f"worker: signal {signum}, exiting", flush=True)
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    # A restart overlaps: pm2 starts this process while the previous one is still
    # shutting down — and on Windows the previous Python child outlives the container
    # pm2 killed, keeping its socket. Two sockets CAN share a Windows port (measured:
    # `allow_reuse_address = False` above does not prevent it), so a successful bind
    # proves nothing and the stale worker goes on answering with old code while pm2
    # reports this one online. Ask whoever answers /health who they are first: that is
    # the only view of the port that cannot be faked by a successful bind.
    _clear_port(args.port)

    server = None
    for attempt in range(15):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
            break
        except OSError as exc:
            if attempt == 14:
                print(f"worker: cannot bind 127.0.0.1:{args.port} — {exc}. "
                      f"Another worker still holds it; not starting a second one.", flush=True)
                sys.exit(1)
            # Someone is on the port. A restarted pm2 app is exactly this case, so
            # clear every other worker off it rather than waiting them out.
            _clear_port(args.port)
            time.sleep(1.2)

    threading.Thread(target=_watch_parent, daemon=True).start()
    print(f"worker: listening on 127.0.0.1:{args.port} products={PRODUCTS}", flush=True)
    server.serve_forever()
