#!/usr/bin/env python3
"""
Shots gallery — every screenshot the agents produce, grouped by app.

Why it is built this way: a flat page of 25 full-size PNGs pulled ~5 MB and made
you scroll past 12,000 px to find anything. Three things fix that:

  1. **Grouped by app**, then screen, with one image per screen on the page.
  2. **One view per screen** — a Light/Dark (or Mobile/Desktop) switcher swaps the
     `src` of the single <img>, so the other view is never downloaded unless asked.
  3. **Thumbnails**: a 900 px JPEG is generated once next to the original and served
     instead; a 1.4 MB desktop PNG becomes ~100 KB. The link still points at the
     original, so "grab the full-size image" is one tap away.

File convention (written by scripts/app-shots.mjs):

    <group>__<screen>__<view>.png   ->   app__passport__mobile-dark.png

Anything else lands in "other" instead of disappearing. The folder is scanned on
every request, so a new PNG appears immediately — no build, no cache, no restart.

Run: python services/tools/shots_server.py <folder> <port>
"""
from __future__ import annotations

import html
import json
import os
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "shots")
PORT = int(sys.argv[2] if len(sys.argv) > 2 else 8092)
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")

THUMB_DIR = os.path.join(ROOT, "_thumbs")
THUMB_W = 900
THUMB_Q = 82
# The gallery tiles are ~230-330 px wide, so a 900 px preview is 3x oversized —
# a 420 px copy in _thumbs/tile/ is what the grid actually displays.
TILE_W = 420
try:
    from PIL import Image

    HAVE_PIL = True
except Exception:  # pragma: no cover - the gallery still works, just heavier
    HAVE_PIL = False

GROUP_ORDER = ["app", "marketplace", "hermes", "sarkarhealth", "shopfront", "other"]
GROUP_LABELS = {
    "app": "DropBy app",
    "marketplace": "Sarkar Marketplace (web)",
    "hermes": "Hermes dashboard",
    "sarkarhealth": "Sarkar Health",
    "shopfront": "Shopfronts",
    "other": "Other",
}

# The order a person walks the product in, not the alphabet.
SCREEN_ORDER = [
    "home", "browse", "search", "saved", "account", "business", "owner-sign-in",
    "tools-hub", "passport", "bg-remove", "signature", "pdf-tools", "breathe", "stretch", "walk", "habits", "water", "japa", "sleep",
    "pdf-tools-rotate", "pdf-tools-numbers",
    "exif-strip", "photos-to-pdf", "collage", "resume-checker", "ai-image", "translate-doc",
    "invoice", "tap-sprint", "word-duel", "paywall",
]

VIEW_LABELS = {
    "mobile-light": "Light",
    "mobile-dark": "Dark",
    "desktop-light": "Desktop light",
    "desktop-dark": "Desktop dark",
    "mobile": "Mobile",
    "desktop": "Desktop",
}
VIEW_PREFERENCE = [
    "mobile-dark", "desktop-dark", "dark", "mobile", "desktop", "mobile-light", "desktop-light", "light",
]

PAGE = """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DropBy — app snapshots</title>
<style>
  :root { color-scheme: dark; --bg:#0b1120; --card:#111827; --line:#1f2937; --ink:#e2e8f0;
          --dim:#94a3b8; --acc:#60a5fa; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body.locked { overflow:hidden; }
  a { color:var(--acc); }
  header { padding:16px 16px 10px; position:sticky; top:0; background:#0b1120f5;
           backdrop-filter:blur(8px); border-bottom:1px solid var(--line); z-index:5; }
  h1 { margin:0 0 3px; font-size:18px; letter-spacing:-.2px; }
  .sub { color:var(--dim); font-size:12.5px; }
  .nav { margin-top:9px; display:flex; flex-wrap:wrap; gap:6px; }
  .nav a { font-size:12px; padding:4px 10px; border:1px solid var(--line); border-radius:999px;
           text-decoration:none; color:var(--dim); background:#0f172a; }
  .nav a:hover { color:var(--ink); border-color:var(--acc); }
  .nav a b { color:#93c5fd; font-weight:600; }
  .wrap { padding:14px 14px 60px; max-width:1060px; margin:0 auto; }
  .legend { color:#64748b; font-size:12px; margin:0 2px 12px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:12px; }
  .tile { display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line);
          border-radius:14px; overflow:hidden; text-decoration:none; color:inherit;
          transition:border-color .12s, transform .12s; }
  .tile:hover { border-color:var(--acc); transform:translateY(-2px); }
  .tile.todo { opacity:.7; }
  .bar { height:4px; flex:none; }
  .shotbox { position:relative; background:#000; aspect-ratio:.66; overflow:hidden; }
  .shotbox img { width:100%; height:100%; object-fit:cover; object-position:top center; display:block; }
  .shotbox.empty { background:repeating-linear-gradient(45deg,#0f172a,#0f172a 10px,#111c33 10px,#111c33 20px); }
  .shotbox .ph { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
                 color:#64748b; font-size:12.5px; text-align:center; padding:14px; }
  .tb { padding:10px 12px 12px; }
  .tname { font-size:14px; font-weight:600; display:flex; align-items:center; gap:7px; }
  .tmeta { color:#64748b; font-size:11.5px; margin-top:3px; }
  .ttag { color:var(--dim); font-size:12.5px; margin-top:5px; }
  .badge { margin-left:auto; font-size:11px; padding:2px 8px; border-radius:999px;
           background:#1e293b; color:var(--dim); white-space:nowrap; }
  .badge.ok { background:#052e2b; color:#6ee7b7; }
  .badge.none { background:#2a1a05; color:#fbbf24; }
  footer { color:#64748b; font-size:11.5px; border-top:1px solid var(--line); margin-top:26px; padding-top:12px; }
  footer b { color:var(--dim); }
  code { background:#0f172a; border:1px solid var(--line); border-radius:6px; padding:1px 5px; font-size:11.5px; }
  .modal { position:fixed; inset:0; z-index:20; display:flex; justify-content:center; align-items:flex-start; }
  .modal[hidden] { display:none; }
  .backdrop { position:absolute; inset:0; background:#020617cc; backdrop-filter:blur(3px); }
  .sheet { position:relative; width:min(940px,100%); max-height:100vh; overflow:auto;
           background:var(--bg); border-left:1px solid var(--line); border-right:1px solid var(--line); }
  .mhead { position:sticky; top:0; background:#0b1120fa; backdrop-filter:blur(8px);
           border-bottom:1px solid var(--line); padding:14px 16px; display:flex; gap:10px; align-items:flex-start; }
  .dot { width:10px; height:10px; border-radius:3px; display:inline-block; flex:none; margin-top:6px; }
  .mhead h2 { margin:0; font-size:17px; }
  .x { margin-left:auto; background:#1e293b; color:var(--ink); border:1px solid var(--line);
       border-radius:9px; padding:6px 12px; font:inherit; font-size:12.5px; cursor:pointer; flex:none; }
  .x:hover { border-color:var(--acc); }
  .mbody { padding:14px 16px 44px; }
  .prods { display:flex; flex-wrap:wrap; gap:6px; margin:11px 0 2px; }
  .prods span { font-size:11.5px; padding:3px 9px; border-radius:999px; background:#0f172a;
                border:1px solid var(--line); color:var(--dim); }
  .shot { border:1px solid var(--line); border-radius:14px; overflow:hidden; margin:14px 0; background:var(--card); }
  .shot .sbar { display:flex; align-items:center; gap:7px; padding:9px 11px; flex-wrap:wrap;
                border-bottom:1px solid var(--line); }
  .shot .sname { font-size:13.5px; font-weight:600; margin-right:auto; }
  .chip { font:inherit; font-size:11.5px; padding:3px 10px; border-radius:999px; cursor:pointer;
          background:#1e293b; color:var(--dim); border:1px solid transparent; }
  .chip[aria-pressed="true"] { background:#1e3a8a; color:#dbeafe; border-color:#3b82f6; }
  .shot img { display:block; width:100%; height:auto; max-height:72vh; object-fit:contain; background:#000; }
  .shot.open img { max-height:none; }
  /* A phone screenshot at 780x1688 is unreadable stretched across 900 px and leaves
     thick black bars; show it at phone width instead, centred on the card. */
  .shot.phone a { background:#000; }
  .shot.phone img { width:auto; max-width:min(440px,100%); margin:0 auto; max-height:none; }
  .why { padding:11px 12px; border-top:1px solid var(--line); }
  .why p { margin:0 0 7px; }
  .why p:last-child { margin-bottom:0; }
  .why .lab { color:#64748b; font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; }
  .why .assert { color:#94a3b8; font-size:12.5px; }
  .fileline { color:#64748b; font-size:11.5px; padding:8px 12px 11px; border-top:1px dashed var(--line); }
  .none { border:1px dashed #334155; border-radius:12px; padding:14px; color:#94a3b8; font-size:13px; margin:14px 0 0; }
  .empty { padding:60px 18px; text-align:center; color:var(--dim);
           border:1px dashed #334155; border-radius:14px; }
</style></head><body>
<header>
  <h1>DropBy — app snapshots</h1>
  <div class="sub"><!--SUB--></div>
  <nav class="nav"><!--NAV--></nav>
</header>
<div class="wrap">
  <div class="legend"><!--LEGEND--></div>
  <div class="grid"><!--BODY--></div>
  <footer><!--FOOT--></footer>
</div>
<!--MODALS-->
<script>
function show(id) {
  var m = document.getElementById(id);
  if (!m) return;
  document.querySelectorAll('.modal').forEach(function (x) { x.hidden = true; });
  m.hidden = false;
  document.body.classList.add('locked');
  m.querySelector('.sheet').scrollTop = 0;
}
function hide() {
  document.querySelectorAll('.modal').forEach(function (x) { x.hidden = true; });
  document.body.classList.remove('locked');
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
}
document.addEventListener('click', function (e) {
  var opener = e.target.closest('[data-open]');
  if (opener) { e.preventDefault(); show(opener.getAttribute('data-open')); history.replaceState(null, '', '#' + opener.getAttribute('data-open')); return; }
  if (e.target.closest('.x') || e.target.classList.contains('backdrop') || e.target.closest('.tile .close')) { hide(); return; }
  var full = e.target.closest('.full');
  if (full) {
    var shot = full.closest('.shot');
    shot.classList.toggle('open');
    full.textContent = shot.classList.contains('open') ? 'Collapse' : 'Full size';
    return;
  }
  var chip = e.target.closest('.chip[data-src]');
  if (!chip) return;
  var box = chip.closest('.shot');
  var img = box.querySelector('img');
  img.src = chip.dataset.src;
  if (chip.dataset.dims) {
    var d = chip.dataset.dims.split('x');
    img.setAttribute('width', d[0]);
    img.setAttribute('height', d[1]);
  }
  box.querySelectorAll('.chip[data-src]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
});
window.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
window.addEventListener('hashchange', function () {
  var h = location.hash.slice(1);
  if (h) show(h); else hide();
});
(function () { var h = location.hash.slice(1); if (h) show(h); })();
</script>
</body></html>"""


# What each screen is, in one paragraph a non-engineer can read, plus the copy the
# capture pipeline asserts before it will even write the PNG (scripts/app-shots.mjs).
# Keep these in the same order of truth as that file: if the marker list changes
# there, change it here — the words on the page are the evidence.
SCREEN_INFO = {
    "home": {
        "title": "Directory home — live listings",
        "what": "The directory apps' first screen: businesses from the Supabase directory "
                "(24,028 active rows) with their category, area and rating, searchable. These are "
                "real database rows, not sample copy.",
        "asserts": None,
    },
    # The five screens below had no picture at all until the item-38 theme audit measured
    # every screen file: the gallery only held the ones somebody remembered to capture.
    "browse": {
        "title": "Directory — Browse tab",
        "what": "The listing feed: real directory rows with category, area, rating and a call "
                "button, a page at a time, with pull-to-refresh. A fresh browser has no saved "
                "listings and no session, which is why the captures below show the plain feed.",
        "asserts": ["businesses you can call straight away"],
    },
    "search": {
        "title": "Directory — Search tab",
        "what": "Type two characters and the list follows the keystrokes (one request per pause, "
                "220 ms). The capture is the idle state, so what it shows is the suggestion chips "
                "— the six categories the directory's own data is fullest in.",
        "asserts": ["POPULAR SEARCHES"],
    },
    "saved": {
        "title": "Saved listings (kept on this device)",
        "what": "The bookmarks a person taps on any listing. They live in this device's storage, "
                "not on a server, so the capture of a fresh browser is the empty state — and the "
                "screen says where the list lives rather than implying an account.",
        "asserts": ["Nothing saved yet"],
    },
    "account": {
        "title": "Account tab — the owner door",
        "what": "The app is one binary with two modes: everyone browses, and a shop owner signs "
                "in here for the leads dashboard. The light/dark switch also lives on this screen, "
                "which is what makes it the place to check that the theme really moves.",
        "asserts": ["Own a business?"],
    },
    # `business` already has an entry further down (it predates this audit) — a second key
    # here would silently shadow it, which is how this entry was found to be dead code.
    "owner-sign-in": {
        "title": "Shop owner sign-in (WhatsApp code)",
        "what": "A phone number, then a one-time code over WhatsApp; browsing the directory never "
                "needs an account. /owner redirects here while signed out, so this is what the "
                "dashboard route shows today — the dashboard's own picture waits for a signed-in "
                "capture.",
        "asserts": ["one-time code"],
    },
    "tools-hub": {
        "title": "Everyday Tools hub",
        "what": "The one front door for the toolbox app: a tile per small job — background remover, "
                "signature &amp; stamp, visiting card, photo repair, product photo — instead of eleven "
                "separate apps.",
        "asserts": ["EVERYDAY TOOLS", "Small jobs,"],
    },
    "passport": {
        "title": "Passport photo maker (the screen that earns ₹49)",
        "what": "Choose a document size (Passport 35 × 45 mm, Visa 2 × 2 in, Stamp 20 × 25 mm), take or "
                "pick a photo, choose the copies, pay ₹49. The background is cut out on the VM and the "
                "copies are laid out on one print-ready 4 × 6 sheet.",
        "asserts": ["Passport photo", "Choose the size", "Take or choose a photo"],
    },
    "bg-remove": {
        "title": "Background remover",
        "what": "One photo in, the subject cut out on a transparent background. Runs locally with rembg "
                "on the VM, so each job costs ₹0 and nothing is uploaded to a paid API.",
        "asserts": ["Remove the"],
    },
    "signature": {
        "title": "Signature &amp; stamp maker",
        "what": "Draw the signature on screen, sized to the strip a form expects, then ₹49 to download "
                "the clean version. The pad is paper in both schemes — the sheet stays white and the "
                "pen black or blue — while everything around it follows the light/dark theme.",
        "asserts": ["Sign it with", "Sign here"],
    },
    "pdf-tools": {
        "title": "PDF toolkit — job picker",
        "what": "Merge, split, compress, rotate, protect and stamp PDFs. The work runs on the VM with "
                "pdfcpu (already installed), so there is no per-document cost.",
        "asserts": ["Pick a job,"],
    },
    # The two pickers below only render once their card is chosen, so they are shot by
    # driving the click (Temp/pdf-screen-shot.mjs), not by loading a URL. The markers
    # here are the copy that capture asserted before it wrote the PNG.
    "pdf-tools-rotate": {
        "title": "PDF toolkit — rotate, open",
        "what": "The Rotate card after you tap it: pick the quarter turn (90°, 180° or 270°, each "
                "labelled in words), optionally name a page range, then choose the PDF. One file, "
                "one job — pdfcpu re-writes the pages, it does not re-save the file at a new angle.",
        "asserts": ["one quarter turn", "Pages (optional)", "Choose a PDF"],
    },
    "pdf-tools-numbers": {
        "title": "PDF toolkit — page numbers, open",
        "what": "The Page numbers card after you tap it: a 3 × 3 grid of where the number sits, "
                "drawn like the page itself (1 top-left … 9 bottom-right, default bottom centre), "
                "plus the text to print — `Page {n} of {total}` becomes the real page number and "
                "the real page count, and an optional page range decides which sheets get one.",
        "asserts": ["Where on the page", "Laid out like the page itself: 1 is top left, 9 bottom right. Now: bottom centre.", "What it says"],
    },
    "invoice": {
        "title": "Invoice / GST bill for a shop",
        "what": "Shop name, items, totals, PDF out — the small-business product that a shopkeeper can "
                "use with no instructions. The bill preview is the printed page, so it stays white "
                "with dark ink in both schemes: only the screen around it follows the theme.",
        "asserts": ["Shop name", "Your shop"],
    },
    "exif-strip": {
        "title": "Photo metadata cleaner",
        "what": "A photo file carries more than the picture: GPS coordinates, the phone that took it, "
                "the second it was taken. This screen lists the tags the photo arrived with, sends it "
                "for a re-save without them, and then prints the tags the file you download carries — "
                "read back from that file by the engine, not promised. Same pixels, same size; free, "
                "because it is a re-save on our own server.",
        "asserts": ["Choose a photo", "no location, no camera name"],
    },
    "photos-to-pdf": {
        "title": "Photos to PDF",
        "what": "Up to 20 photos into one PDF, one photo per page, in the order you picked them — the "
                "set of ID photos a form asks for, or a shop's stock shots for a wholesaler. The stack "
                "on screen is the order of the document. Pages are a real paper size (A4 / Letter / A5) "
                "at 150 dpi, each photo centred keeping its own shape instead of stretched to the page.",
        "asserts": ["Photos into", "Page size"],
    },
    "collage": {
        "title": "Photo collage",
        "what": "Two to four photos onto one sheet in the shape people post: two across, two stacked, "
                "a 2 × 2 square or a strip of three. Every tile is cut to the same cell so the sheet "
                "reads as one picture. A shape that cannot hold the photos is dimmed on screen with the "
                "reason, rather than being sent and refused by the engine.",
        "asserts": ["A few photos,", "Shape"],
    },
    "resume-checker": {
        "title": "Document check (CV / contract / form)",
        "what": "One document in — a PDF, a Word file or plain text — and what the file really holds "
                "out: words, characters, pages, the email and the phone number inside it, and which "
                "of the keywords you typed appear as whole words. The text the reader read is fetched "
                "back from the report itself. It does not claim what a hiring system wants — that is "
                "not knowable from this box. Read on our own server with markitdown; free per job.",
        "asserts": ["DOCUMENT CHECK", "document says", "not counted inside", "no text layer"],
    },
    "ai-image": {
        "title": "Text to image (one picture per run)",
        "what": "Type what should be in the picture and the server draws it with an open image model on "
                "Workers AI (flux-1-schnell) — no photo needed, nothing uploaded from the phone. The "
                "card shows the picture back with the model's own numbers (size, steps, file), and the "
                "copy says plainly what this is not: it draws a sentence literally, it does not design "
                "a logo or set type, the same words give a different picture each run, and a person in "
                "the picture is not a real person. Free to the customer; each run bills us about "
                "₹0.18 inside a daily free allowance of roughly 57 pictures, and the screen says so.",
        "asserts": ["TEXT TO IMAGE", "and the model draws it", "One picture per run"],
    },
    "translate-doc": {
        "title": "Document translation (machine translation)",
        "what": "One document in — a PDF, a Word file or plain text — and the same text back in "
                "another Indian language. The picker draws its list from the same array the job "
                "route validates against, so the screen cannot offer a language the server would "
                "refuse; Gujarati and Telugu are offered by neither because their round trips "
                "changed the numbers in a test sentence. The card prints the translation, fetched "
                "back from the report itself, beside what the run used (characters, paragraphs, "
                "seconds, model, neurons billed). It says “machine translation — read it before you "
                "send it” in the card and not in small print: the text leaves this box for a model "
                "on Workers AI, which is the one thing in this toolbox that does.",
        "asserts": ["DOCUMENT TRANSLATION", "other language", "Swap the two",
                    "no text layer to translate"],
    },
    "stretch": {
        "title": "Stretch — five-minute desk routine",
        "what": "Eight movements with a countdown each, built for someone who sits all day: neck and "
                "shoulder rolls, a chest opener, a seated twist, wrists, hips, hamstrings, and a minute "
                "of slow breathing to finish. It says it is general mobility, not physiotherapy.",
        "asserts": ["Desk mobility", "Start the routine"],
    },
    "walk": {
        "title": "Walk — interval timer",
        "what": "Turns a walk into something with a shape: three minutes warm up, then fast for a "
                "minute and easy for two, repeated, then three minutes cool down. No GPS, no sensors, "
                "no account — a timer and a word on screen.",
        "asserts": ["Fast for a minute", "Start walking"],
    },
    "progress": {
        "title": "Progress — the charts page",
        "what": "Six practices in one table with a streak each, then the selected one drawn in full: a ring against your goal, seven days of bars, thirty days of dots.",
        "try_me": "Tap another practice in the ALL SIX list — the chart below switches to that app's own history.",
    },
    "profile": {
        "title": "Profile — goals and data",
        "what": "The goals that change the numbers elsewhere (glasses a day, sessions a week), your data with a count and a delete, and the honest list of what is not built.",
        "try_me": "Change glasses a day to 4, then open Progress and Water — the ring and the target both follow it.",
    },
    "habits": {
        "title": "Today — the wellness hub",
        "what": "The one screen that shows today's count for both counters without opening either, "
                "and pushes to Stretch and Walk. It exists because a native tab bar holds five items "
                "before iOS buries the rest behind More.",
        "asserts": ["GLASSES", "BEADS"],
    },
    "water": {
        "title": "Water — a counter, not a coach",
        "what": "Taps to count glasses, resetting with the date, with the target presented as a "
                "setting rather than a prescription — because there is no single right number of "
                "glasses for everyone, and the screen says so.",
        "asserts": ["Add a glass", "What this is not"],
    },
    "japa": {
        "title": "Japa — a counting aid",
        "what": "A 108-bead counter with a haptic per bead and a different buzz at the end of a round, "
                "for anyone repeating a phrase. It does not teach a practice or choose words: you set "
                "the phrase and it counts, on the device.",
        "asserts": ["Tap anywhere to count", "bead"],
    },
    "sleep": {
        "title": "Sleep — wind-down and lights out",
        "what": "Four rounds of 4·7·8 breathing, then a twenty-minute countdown to lights out. No "
                "claims about insomnia or sleep stages; it is the last ten minutes, and it says so.",
        "asserts": ["4 IN · 7 HOLD · 8 OUT", "Start the rounds"],
    },
    "breathe": {
        "title": "Breathe — slow breathing",
        "what": "Four patterns (coherent 5.5, box 4·4·4·4, 4·7·8, long exhale 4·8) around a circle "
                "that grows on the inhale and settles on the exhale, with a phrase you type yourself "
                "and a haptic at each turn. The only product here with no server behind it: it costs "
                "₹0 a session and works offline. The numbers on screen are arithmetic, and the screen "
                "says plainly what it is not.",
        "asserts": ["breaths a minute", "What this is not"],
    },
    "tap-sprint": {
        "title": "Tap Sprint — reflex game",
        "what": "A game shipped as its own store app: thirty seconds of tapping, score and best time. "
                "Games are the traffic pull for the paid tools.",
        "asserts": ["How fast are your taps?"],
    },
    "word-duel": {
        "title": "Word Duel — word puzzle",
        "what": "Second game: sixty seconds to make as many words as possible from the letters.",
        "asserts": ["How many words in sixty seconds?"],
    },
    "paywall": {
        "title": "The money path — web paywall",
        "what": "The page a paid product hands off to: /unlock/&lt;job_id&gt; shows the price and takes the "
                "WhatsApp OTP, and only a paid order for that job releases the clean file. The free "
                "preview is a separate random object, so the paid file cannot be guessed from it.",
        "asserts": ["Verify your", "₹"],
    },
    "business": {
        "title": "Single business page",
        "what": "One listing in full: phone, WhatsApp, directions, hours and the services list — the page "
                "a searcher lands on from Google. The capture is business 119465 (Moti Mahal Delux "
                "Indore), the row the listing-description product wrote a paragraph for from the "
                "row's own facts, which is what its About card shows.",
        "asserts": ["Business details"],
    },
    "doctors": {
        "title": "SarkarHealth doctors",
        "what": "The doctors vertical over the same directory data — the one brand where the data really "
                "is the product.",
        "asserts": None,
    },
    "dashboard": {
        "title": "Hermes dashboard",
        "what": "The control panel on :9300 — agents, cron jobs and their last runs. Not a store app; "
                "kept in the gallery because it is part of the stack you operate.",
        "asserts": None,
    },
    "marketplace-home": {
        "title": "Marketplace web home",
        "what": "sarkarmarketplace.dropby.co.in — the directory's SEO surface, where the 24k listings are "
                "crawlable.",
        "asserts": None,
    },
}

GROUP_TILE = {
    "marketplace": ("Marketplace (web)", "sarkarmarketplace.dropby.co.in — the directory site, not an app"),
    "hermes": ("Hermes dashboard", "the operator panel on :9300"),
    "sarkarhealth": ("Sarkar Health (web)", "the doctors vertical's web surface"),
    "shopfront": ("Shopfronts", "shop pages"),
    "other": ("Other captures", "files that follow no app naming convention"),
}


def fmt_bytes(b: int) -> str:
    return f"{b / 1048576:.1f} MB" if b >= 1048576 else f"{b / 1024:.0f} KB"


def label_for(screen: str, prefix: str = "") -> str:
    text = screen.replace("-", " ").replace("_", " ").title()
    return f"{prefix}: {text}" if prefix else text


def preferred_view(views: dict) -> str:
    """The view to open a screen on: dark phone first, because that is how it ships."""
    order = [k for k in VIEW_PREFERENCE if k in views]
    order += [k for k in views if k not in VIEW_PREFERENCE]
    return order[0]


def screen_sort(screens):
    return sorted(screens, key=lambda s: (0, SCREEN_ORDER.index(s)) if s in SCREEN_ORDER else (1, s))


def parse_name(stem: str):
    """app__passport__mobile-dark -> ("app", "passport", "mobile-dark")."""
    if "__" in stem:
        parts = stem.split("__")
        if len(parts) >= 3:
            return parts[0], "__".join(parts[1:-1]), parts[-1]
        if len(parts) == 2:
            return parts[0], parts[1], ""
    if "-" in stem:  # legacy <group>-<screen>-<view>
        head, _, tail = stem.rpartition("-")
        if tail in VIEW_LABELS:
            group, _, screen = head.partition("-")
            return group, screen or "home", tail
    return "other", stem, ""


def thumb(name: str, width: int = THUMB_W, subdir: str = ""):
    """(url, bytes, (w, h)) for a downscaled copy of `name`, made once and reused.

    A full-page desktop PNG is 1-2 MB; the same picture at 900 px is ~100 KB, which
    is the difference between a gallery you scroll and one you wait for. The
    original stays one tap away behind the image link.
    """
    src = os.path.join(ROOT, name)
    try:
        src_bytes = os.path.getsize(src)
    except OSError:
        return f"/{name}", 0, None
    if not HAVE_PIL:
        return f"/{name}", src_bytes, None

    out_name = name.rsplit(".", 1)[0] + ".jpg"
    out_dir = os.path.join(THUMB_DIR, subdir) if subdir else THUMB_DIR
    out = os.path.join(out_dir, out_name)
    url_prefix = f"/_thumbs/{subdir}/" if subdir else "/_thumbs/"
    try:
        if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
            os.makedirs(out_dir, exist_ok=True)
            im = Image.open(src)
            im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
            if im.width > width:
                im = im.resize((width, max(1, round(im.height * width / im.width))), Image.LANCZOS)
            im.save(out, "JPEG", quality=THUMB_Q, optimize=True)
        out_bytes = os.path.getsize(out)
        if out_bytes >= src_bytes:
            # A phone screenshot at natural width does not get smaller as a JPEG, and
            # serving a 82 KB "thumbnail" of a 79 KB PNG is just silly. Use whichever
            # is actually smaller and stop keeping the loser on disk.
            try:
                os.remove(out)
            except OSError:
                pass
            return f"/{name}", src_bytes, Image.open(src).size
        return f"{url_prefix}{out_name}", out_bytes, Image.open(out).size
    except Exception:
        return f"/{name}", src_bytes, None


def thumb_tile(name: str):
    """The gallery grid's preview: same picture, a size the tile can actually use."""
    return thumb(name, width=TILE_W, subdir="tile")


def collect():
    shots = {}
    total = 0
    if os.path.isdir(ROOT):
        for name in sorted(os.listdir(ROOT)):
            p = os.path.join(ROOT, name)
            if not (os.path.isfile(p) and name.lower().endswith(IMAGE_EXT)):
                continue
            size = os.path.getsize(p)
            total += size
            group, screen, view = parse_name(name.rsplit(".", 1)[0])
            shots.setdefault(group, {}).setdefault(screen, {})[view] = (name, size, os.path.getmtime(p))
    return shots, total


def load_apps():
    """The app manifest, if the pipeline has written one (scripts/app-map.mjs)."""
    p = os.path.join(ROOT, "apps.json")
    if not os.path.isfile(p):
        return None
    try:
        import json

        with open(p, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if data.get("apps") else None
    except Exception:
        return None


esc = html.escape


def tile(mid, name, meta, tagline, badge, badge_class, color, preview_url=None, todo=False):
    """One app (or web surface) as a single clickable card. The whole tile is the button."""
    if preview_url:
        box = ('<div class="shotbox"><img src="' + esc(preview_url) + '" alt="' + esc(name) +
               '" loading="lazy" decoding="async"></div>')
    else:
        box = ('<div class="shotbox empty"><div class="ph">no screen captured yet</div></div>')
    cls = "tile todo" if todo else "tile"
    return (
        '<a class="' + cls + '" href="#' + esc(mid) + '" data-open="' + esc(mid) + '">'
        '<div class="bar" style="background:' + esc(color or "#60a5fa") + '"></div>' + box +
        '<div class="tb"><div class="tname">' + esc(name) +
        '<span class="badge ' + badge_class + '">' + esc(badge) + '</span></div>'
        '<div class="tmeta">' + meta + '</div>'
        '<div class="ttag">' + esc(tagline) + '</div></div></a>'
    )


def modal(mid, name, color, meta, tagline, products, inner):
    """Everything captured for one app, in one panel: the multiple shots live here."""
    prods = ""
    if products:
        prods = '<div class="prods">' + "".join('<span>' + esc(p) + '</span>' for p in products) + '</div>'
    head = (
        '<div class="mhead"><span class="dot" style="background:' + esc(color or "#60a5fa") + '"></span>'
        '<div><h2>' + esc(name) + '</h2><div class="tmeta">' + meta + '</div>'
        '<div class="ttag">' + esc(tagline) + '</div></div>'
        '<button class="x">Close</button></div>'
    )
    return ('<div class="modal" id="' + esc(mid) + '" hidden><div class="backdrop"></div>'
            '<div class="sheet">' + head + '<div class="mbody">' + prods + inner + '</div></div></div>')


def shot_block(views: dict, screen: str, info_key: str = "") -> tuple:
    """One captured screen: its picture, a Light/Dark switch, and what it proves."""
    default = preferred_view(views)
    name, size, mtime = views[default]
    url, served, dims = thumb(name)
    info = SCREEN_INFO.get(info_key or screen, {})
    title = info.get("title") or label_for(screen)
    dim_attrs = f' width="{dims[0]}" height="{dims[1]}"' if dims else ""

    order = [k for k in VIEW_PREFERENCE if k in views] + [k for k in views if k not in VIEW_PREFERENCE]
    chips = []
    for k in order:
        if len(order) < 2:
            break
        vurl, _, vdims = thumb(views[k][0])
        dj = f"{vdims[0]}x{vdims[1]}" if vdims else ""
        chips.append(
            '<button class="chip" data-src="' + esc(vurl) + '" data-dims="' + dj + '" aria-pressed="' +
            ("true" if k == default else "false") + '">' + esc(VIEW_LABELS.get(k, k)) + '</button>'
        )
    chips.append('<button class="chip full">Full size</button>')

    why = ""
    if info.get("what"):
        why += '<p><span class="lab">what this screen is</span><br>' + info["what"] + '</p>'
    if info.get("asserts"):
        why += ('<p><span class="lab">the capture is only written if the screen said this</span><br>'
                '<span class="assert">“' + esc(" · ".join(info["asserts"])) + '”</span></p>')
    when = time.strftime("%d %b %H:%M", time.localtime(mtime))
    frame = "shot phone" if default.startswith("mobile") else "shot"

    block = (
        '<article class="' + frame + '"><div class="sbar"><span class="sname">' + esc(title) + '</span>' +
        "".join(chips) + '</div>'
        '<a href="/' + esc(name) + '" target="_blank" rel="noopener" title="open the full-size original">'
        '<img src="' + esc(url) + '" alt="' + esc(title) + '"' + dim_attrs + ' loading="lazy" decoding="async"></a>'
        + ('<div class="why">' + why + '</div>' if why else "") +
        '<div class="fileline">' + esc(name) + ' · ' + fmt_bytes(size) + ' · captured ' + esc(when) +
        ' · <a href="/' + esc(name) + '" target="_blank" rel="noopener">full-size original</a></div>'
        '</article>'
    )
    return block, served


def render() -> bytes:
    shots, total = collect()
    manifest = load_apps()

    # The pipeline writes app screens as app__<screen>__<view>; every other file is a
    # web capture whose first segment names the surface it came from.
    app_shots = shots.pop("app", {})
    if not shots and not app_shots:
        body = ('<div class="empty"><p><strong>No snapshots yet.</strong></p>'
                '<p>The pipeline writes the PNGs here the moment it runs:<br>'
                '<code>node scripts/app-shots.mjs</code></p>'
                '<p>watching: ' + esc(ROOT) + '</p></div>')
        return _page("nothing captured yet", "", "", body, "", _footer()).encode()

    tiles, modals, nav = [], [], []
    served_total = 0
    n_screens = sum(len(v) for v in shots.values()) + len(app_shots)
    n_images = sum(len(v) for g in shots.values() for v in g.values()) + sum(len(v) for v in app_shots.values())

    def add(mid, name, meta, tagline, badge, badge_class, color, preview, todo, panel, count):
        tiles.append(tile(mid, name, meta, tagline, badge, badge_class, color, preview, todo))
        modals.append(panel)
        nav.append('<a href="#' + esc(mid) + '" data-open="' + esc(mid) + '">' + esc(name) +
                   ' <b>' + str(count) + '</b></a>')

    # --- one tile per store app, in the order the product plan lists them ---------
    if manifest:
        claimed = set()
        seen = {}  # screen slug -> the first app that showed it (the 12 identities share one codebase)
        for app in manifest.get("apps", []):
            declared = app.get("screens") or []
            order = screen_sort([s for s in declared if s in app_shots])
            claimed.update(declared)
            shared_with = sorted({seen[s] for s in order if s in seen})
            for s in order:
                seen.setdefault(s, app["name"])
            mid = "m-" + app["id"]
            n = len(order)
            color = app.get("color") or "#60a5fa"
            products = app.get("products") or []
            meta = (esc(app.get("bundleId", "")) + " · " + esc(app.get("storeCategory", "")) + " · "
                    + str(len(products)) + (" product" if len(products) == 1 else " products"))
            preview = None
            if n:
                first = app_shots[order[0]]
                preview = thumb_tile(first[preferred_view(first)][0])[0]
            blocks = []
            for s in order:
                block, served = shot_block(app_shots[s], s)
                served_total += served
                blocks.append(block)
            if n:
                badge, badge_class = (f"{n} shot" + ("s" if n > 1 else "")), "ok"
                inner = "".join(blocks)
                if shared_with:
                    inner = ('<div class="none">Same export as ' + esc(", ".join(shared_with)) +
                             ' — the store apps are one codebase wearing separate identities, so this is '
                             'the same picture rather than a second build.</div>') + inner
            else:
                first = app.get("firstScreen") or "its main product screen"
                note = "The app is a shell so far"
                if products:
                    note += " and there is no engine behind " + esc(products[0]) + " yet"
                inner = ('<div class="none">Nothing to show a store reviewer yet — no screen has been '
                         'captured. ' + note + '. First screen to build: <strong>' + esc(str(first)) +
                         '</strong>.</div>')
                badge, badge_class = "nothing yet", "none"
            add(mid, app["name"], meta, app.get("tagline", ""), badge, badge_class, color, preview, n == 0,
                modal(mid, app["name"], color, meta, app.get("tagline", ""), products, inner), n)

        # --- screens no single listing owns (the web paywall) ----------------------
        for entry in manifest.get("shared", []):
            order = screen_sort([s for s in (entry.get("screens") or []) if s in app_shots])
            if not order:
                continue
            claimed.update(entry.get("screens") or [])
            mid = "m-shared-" + entry["name"].lower().split()[0]
            blocks, preview = [], None
            for s in order:
                block, served = shot_block(app_shots[s], s)
                served_total += served
                blocks.append(block)
                if preview is None:
                    preview = thumb_tile(app_shots[s][preferred_view(app_shots[s])][0])[0]
            badge = f"{len(order)} shot" + ("s" if len(order) > 1 else "")
            add(mid, entry["name"], esc(entry.get("note", "")), "shared by every paid product", badge,
                "ok", "#60a5fa", preview, False,
                modal(mid, entry["name"], "#60a5fa", esc(entry.get("note", "")),
                      "every paid product hands off here", [], "".join(blocks)), len(order))

        # --- captured but unclaimed: honest, kept visible --------------------------
        left = {s: v for s, v in app_shots.items() if s not in claimed}
        if left:
            order = screen_sort(left)
            blocks, preview = [], None
            for s in order:
                block, served = shot_block(left[s], s)
                served_total += served
                blocks.append(block)
                if preview is None:
                    preview = thumb_tile(left[s][preferred_view(left[s])][0])[0]
            mid = "m-unclaimed"
            add(mid, "Screens no app claims", "captured, but no target in targets.mjs ships this screen",
                "kept so nothing the pipeline produced disappears", f"{len(order)} shot", "ok", "#64748b",
                preview, False,
                modal(mid, "Screens no app claims", "#64748b",
                      "captured, but no target in targets.mjs ships this screen",
                      "kept so nothing the pipeline produced disappears", [], "".join(blocks)), len(order))

    # --- web captures, one tile per surface ---------------------------------------
    groups = sorted(shots, key=lambda g: (GROUP_ORDER.index(g) if g in GROUP_ORDER else 99, g))
    for g in groups:
        screens = screen_sort(shots[g])
        if not screens:
            continue
        title, note = GROUP_TILE.get(g, (GROUP_LABELS.get(g, g.title()), "web captures"))
        mid = "m-web-" + g
        blocks, preview = [], None
        for s in screens:
            info_key = "marketplace-home" if (g == "marketplace" and s == "home") else s
            block, served = shot_block(shots[g][s], s, info_key)
            served_total += served
            blocks.append(block)
            if preview is None:
                preview = thumb_tile(shots[g][s][preferred_view(shots[g][s])][0])[0]
        badge = f"{len(screens)} shot" + ("s" if len(screens) > 1 else "")
        add(mid, title, esc(note), "web capture", badge, "ok", "#334155", preview, False,
            modal(mid, title, "#334155", esc(note), "web capture", [], "".join(blocks)), len(screens))

    n_apps = len(tiles)
    sub = (str(n_apps) + " apps and surfaces · " + str(n_screens) + " screens · " + str(n_images) +
           " images · " + fmt_bytes(total) + " on disk, " + fmt_bytes(served_total) + " served here · "
           "click a tile to open its screens · <a href=\"/\">test the apps on your phone</a> · "
           "<a href=\"/perf\">trading performance</a> · <a href=\"/shots\">reload</a>")
    legend = ("One tile per app. Click it to see every screen captured for that app — each with what the "
              "screen is, and the copy the capture pipeline required before it would write the file. "
              "Light/Dark switches the picture inside the box; Full size uncaps a tall one.")
    return _page(sub, "".join(nav), legend, "".join(tiles), "".join(modals), _footer()).encode()


def _page(sub, nav, legend, body, modals, foot) -> str:
    return (PAGE.replace("<!--SUB-->", sub)
                .replace("<!--NAV-->", nav)
                .replace("<!--LEGEND-->", legend)
                .replace("<!--BODY-->", body)
                .replace("<!--MODALS-->", modals)
                .replace("<!--FOOT-->", foot))


def _footer() -> str:
    return (
        "<b>Where these files are:</b> <code>" + esc(ROOT) + "</code> — one PNG per screen, named "
        "<code>&lt;app&gt;__&lt;screen&gt;__&lt;view&gt;.png</code>, plus <code>apps.json</code> (the app map) "
        "and <code>_thumbs/</code> (900 px previews, written on first view).<br>"
        "<b>Regenerate:</b> <code>node scripts/app-shots.mjs</code> writes new PNGs (it refuses a capture unless "
        "the screen's own copy is on the page), then <code>node scripts/app-map.mjs</code> rewrites "
        "<code>apps.json</code>. This page re-scans the folder on every load — no build, no restart.<br>"
        "<b>Served by:</b> <code>services/tools/shots_server.py</code> on 127.0.0.1:8092 "
        "(pm2 <code>shots-gallery</code>) → https://shots.dropby.co.in/"
    )


# ---------------------------------------------------------------------------
# /live — the page you test from: one card per app, a QR per screen.
#
# Why QR codes instead of more screenshots: the phone is the only device that can
# prove a camera-first product works, and typing a URL on a phone is friction. The
# code encodes the screen's own deep link, so scanning opens THAT screen, not a
# home page to hunt through.
#
# Two flavours wherever both are possible:
#   * **Web** — expo.dropby.co.in, the app's web build. Works today, nothing to
#     install, opens in Safari/Chrome.
#   * **Expo Go** — the native app in the Expo Go client. Only offered when a dev
#     server is actually tunnelling (EXPO_GO_URL), never implied.
# ---------------------------------------------------------------------------

import io
import urllib.parse
import urllib.request

try:  # pragma: no cover - without qrcode the page still lists the links
    import qrcode
    import qrcode.image.svg

    HAVE_QR = True
except Exception:  # pragma: no cover
    HAVE_QR = False

EXPO_WEB = os.environ.get("EXPO_WEB", "https://expo.dropby.co.in").rstrip("/")
# Fallback only: the address is discovered from ngrok's own API below, because the
# tunnel host changes every time the dev server restarts and a stale QR is worse
# than no QR at all.
EXPO_GO_FALLBACK = os.environ.get("EXPO_GO_URL", "").rstrip("/")


# Cache the ngrok lookup: it is called once per card (14 times a page), and with the
# dev server stopped each call sat on its timeout — 14 x 1.5 s of nothing, on a page
# whose whole job is to load fast. Ten seconds is short enough that starting Metro
# makes the codes appear without a restart.
_GO_CACHE = {"at": 0.0, "url": ""}


def _tunnel_answers(url: str, timeout: float = 2.5) -> bool:
    """Does this Expo Go address actually serve the app right now?

    A printed QR is a promise. A pinned URL outlives the dev server that created it —
    exactly what happened here: a stale `exp://…exp.direct` stayed in the page and
    eleven codes pointed at a tunnel that answered 404. So a candidate address is used
    only after it has answered; otherwise the card shows no Expo Go code at all, and the
    footer says why.
    """
    probe = url.replace("exp://", "https://", 1).rstrip("/") + "/"
    try:
        req = urllib.request.Request(probe, headers={"User-Agent": "dropby-shots/1"})
        with urllib.request.urlopen(req, timeout=timeout) as fh:
            return 200 <= fh.status < 400
    except Exception:
        return False


def expo_go_url(max_age: float = 10.0) -> str:
    """The live Expo Go address, or "" when nothing is tunnelling.

    Expo's CLI runs ngrok underneath, and ngrok answers on 127.0.0.1:4040 with the
    public URLs it currently has. Asking it is the only way to keep a printed QR
    correct across restarts — the URL is per-session, not a setting.
    """
    now = time.time()
    if now - _GO_CACHE["at"] < max_age:
        return _GO_CACHE["url"]

    found = ""
    try:
        with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=1.0) as fh:
            data = json.load(fh)
        for t in data.get("tunnels") or []:
            url = str(t.get("public_url") or "")
            if url.startswith("https://") and "exp.direct" in url:
                found = "exp://" + url[len("https://"):].rstrip("/")
                break
    except Exception:
        pass

    if not found:
        found = EXPO_GO_FALLBACK
    if found and not _tunnel_answers(found):
        found = ""
    _GO_CACHE.update(at=now, url=found)
    return found


def expo_go_link(route: str) -> str:
    """A route deep link Expo Go understands: exp://host/--/passport.

    The `/--/` is expo-router's separator between the dev-server address and the
    app path. Without it Expo Go opens the home screen and the person scanning
    thinks the link is broken.
    """
    base = expo_go_url()
    if not base:
        return ""
    if not route or route == "/":
        return base + "/--/"
    return base + "/--" + route

# app id -> (route, "what to try on the phone"). Routes mirror scripts/app-shots.mjs.
LIVE_ROUTES = {
    "passport-photo": ("/passport", [
        "Pick a size — Passport 35 × 45 mm, Visa 2 × 2 in or Stamp 20 × 25 mm.",
        "Tap “Take or choose a photo” and pick any picture from the phone.",
        "You should get copies laid out on one 4 × 6 sheet, ready to print.",
        "₹49 releases the clean 300 dpi file — that is the paywall, so it should ask before it gives it.",
    ]),
    "pdf-tools": ("/tools/pdf", [
        "Tap a job (merge, split, compress), then pick a PDF from the phone.",
        "Nothing should be uploaded: this runs on the server we own, and the file comes back.",
    ]),
    "shop-toolkit": ("/tools/invoice", [
        "Type a shop name and one item, then make the bill.",
        "You should get a printable bill with the totals — no sign-up in the way.",
    ]),
    "toolbox": ("/tools", [
        "The hub lists what is built: “3 working · 11 soon” — tap Background remover.",
        "Pick any photo: the background should come off and the PNG download.",
        "Then try Signature &amp; stamp and draw with a finger.",
    ]),
    "sarkarhealth": ("/", [
        "Search “dentist” or “clinic” and open a doctor.",
        "Tap the phone number — on the phone it should start a call.",
    ]),
    "sarkarmarketplace": ("/", [
        "Search a locality, then open any business.",
        "Check the phone and WhatsApp buttons — they must dial the listing's real number.",
    ]),
    "sarkarcars": ("/", [
        "Search “car wash” or “denting” and open a garage.",
        "Same test: the number on the page should be the number that dials.",
    ]),
    "stretch": ("/stretch", [
        "Press Start and follow the countdown — the move name and the instruction should change every 30-45s.",
        "The list of 8 moves is below when idle; check the whole routine fits on one screen on a small phone.",
    ]),
    "walk": ("/walk", [
        "Pick 5 rounds, press Start walking: it should read Fast for 60s, then Easy for 120s, repeatedly.",
        "The accent border should appear on the Fast phases so you can read it at arm's length while walking.",
    ]),
    "habits": ("/habits", [
        "This is the hub: tap GLASSES to add water, tap BEADS to open the counter, tap Stretch or Walk to open them.",
    ]),
    "water": ("/water", [
        "Tap Add a glass a few times — the big number and the filled squares should move together.",
        "Tap the minus once to check it can go down, and that it never goes below zero.",
    ]),
    "japa": ("/japa", [
        "Tap the pad repeatedly: it should count, buzz light each bead, and buzz differently at 108.",
        "Check that a round is recorded and the bead count resets — then everything stays on the phone.",
    ]),
    "sleep": ("/sleep", [
        "Press Start the rounds: Breathe in 4s, Hold 7s, Breathe out 8s, four times.",
        "When the rounds finish it should switch to the lights-out countdown without losing the screen.",
    ]),
    "breathe": ("/breathe", [
        "Press Begin and watch the circle: it should grow across the in-breath and settle across the out-breath, not jump.",
        "The clock should count seconds, and a cycle should land about every 11 seconds on Coherent.",
        "Change the pattern to 4·7·8 and check the phase words and the countdown follow it.",
        "Put the phone down and listen for the haptic at each turn — that is the cue that works with your eyes shut.",
    ]),
    "tap-sprint": ("/tap-sprint", [
        "Play a thirty-second round with a thumb.",
        "The score at the end is the whole product — if it is smooth, the game ships.",
    ]),
    "word-duel": ("/word-duel", [
        "Play a sixty-second round: build words from the rack.",
        "Check that a word you type is accepted and the score moves.",
    ]),
}

# Web surfaces worth a code of their own. The phone is also the cheapest way to
# check the directory pages a customer would land on.
LIVE_WEB = [
    {
        "name": "Marketplace website",
        "url": "https://sarkarmarketplace.dropby.co.in/",
        "note": "24,028 listings · the SEO surface",
        "try": ["Search a locality on the phone and check the results load quickly."],
    },
    {
        "name": "A category page",
        "url": "https://sarkarmarketplace.dropby.co.in/plumber-in-indore",
        "note": "146 plumbers in Indore",
        "try": ["This is what Google sends people to — the phone is how most of them arrive."],
    },
    {
        "name": "A business page",
        "url": "https://sarkarmarketplace.dropby.co.in/business/110779",
        "note": "one listing in full",
        "try": ["Tap the phone number and the WhatsApp button on the phone."],
    },
    {
        # Job 10 is a real passport-photo job (₹49), so the price on the page matches
        # what the card promises. Job 33 is an invoice job and shows ₹299.
        "name": "The paywall (money path)",
        "url": "https://sarkarmarketplace.dropby.co.in/unlock/10",
        "note": "the ₹49 passport job · WhatsApp OTP",
        "try": [
            "The preview you see is watermarked on purpose; the paid file is the clean one.",
            "It should ask for the WhatsApp OTP and refuse to hand over the file until the order is paid.",
            "With no payment keys loaded it can never release the file — that refusal is the gate working, not a bug.",
        ],
    },
    {
        "name": "Stills gallery",
        "url": "https://shots.dropby.co.in/shots",
        "note": "the screenshots, if you want them",
        "try": ["Only for reference — you asked for the live apps, this is the fallback."],
    },
]

LIVE_PAGE = """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DropBy — test the apps on your phone</title>
<style>
  :root { color-scheme: dark; --bg:#0b1120; --card:#111827; --line:#1f2937; --ink:#e2e8f0;
          --dim:#94a3b8; --acc:#60a5fa; --ok:#34d399; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  a { color:var(--acc); }
  header { padding:18px 16px 12px; border-bottom:1px solid var(--line); }
  h1 { margin:0 0 4px; font-size:19px; letter-spacing:-.2px; }
  .sub { color:var(--dim); font-size:13px; }
  .how { margin:12px 16px 0; padding:12px 13px; border:1px solid var(--line); border-radius:12px;
         background:#0f172a; color:#cbd5e1; font-size:13px; }
  .how b { color:var(--ink); }
  .how ol { margin:8px 0 0; padding-left:20px; }
  .wrap { padding:14px 14px 70px; max-width:900px; margin:0 auto; }
  h2 { font-size:14px; text-transform:uppercase; letter-spacing:.08em; color:#64748b;
       margin:24px 0 10px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; }
  .app { background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
  .app .bar { height:4px; }
  .app .in { padding:12px 13px 13px; }
  .ahead { display:flex; align-items:flex-start; gap:8px; }
  .aname { font-size:15px; font-weight:600; }
  .ameta { color:#64748b; font-size:11.5px; margin-top:2px; }
  .atag { color:var(--dim); font-size:12.5px; margin-top:4px; }
  .abadge { margin-left:auto; flex:none; font-size:11px; padding:2px 9px; border-radius:999px;
            background:#052e2b; color:#6ee7b7; white-space:nowrap; }
  .abadge.soon { background:#2a1a05; color:#fbbf24; }
  .qrrow { display:flex; gap:12px; align-items:center; margin:12px 0 4px; }
  .qrbox { text-align:center; text-decoration:none; color:var(--dim); font-size:10.5px; }
  .qrbox img { display:block; width:148px; height:148px; background:#fff; padding:10px;
               border-radius:10px; }
  .qrbox .qrlab { display:block; margin-top:5px; }
  .rcol { min-width:0; }
  .rurl { font-size:11.5px; color:#64748b; word-break:break-all; }
  .btns { display:flex; gap:7px; margin-top:7px; flex-wrap:wrap; }
  .btn { display:inline-block; font-size:12.5px; padding:6px 12px; border-radius:9px;
         background:#1e3a8a; color:#dbeafe; text-decoration:none; border:1px solid #3b82f6; }
  .btn.ghost { background:#1e293b; color:var(--dim); border-color:var(--line); }
  .try { margin:10px 0 0; padding-left:19px; color:#cbd5e1; font-size:12.5px; }
  .try li { margin-bottom:4px; }
  .note { color:#64748b; font-size:11.5px; margin-top:8px; }
  footer { color:#64748b; font-size:11.5px; border-top:1px solid var(--line); margin-top:26px;
           padding-top:12px; }
  code { background:#0f172a; border:1px solid var(--line); border-radius:6px; padding:1px 5px;
         font-size:11.5px; }
  .logcard { background:var(--card); border:1px solid var(--line); border-radius:12px;
             padding:11px 13px; margin-bottom:10px; }
  .lhead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .lkind { font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--dim); }
  .lstatus { font-size:10.5px; padding:2px 8px; border-radius:999px; }
  .lwhen { margin-left:auto; color:#64748b; font-size:11px; }
  .ltitle { font-size:14.5px; font-weight:600; margin:6px 0 4px; }
  .lrow { display:flex; gap:8px; font-size:12.5px; margin-top:3px; }
  .llab { color:#64748b; min-width:74px; font-size:11px; text-transform:uppercase; letter-spacing:.05em; padding-top:1px; }
  .lval { color:#cbd5e1; flex:1; }
  .llinks { margin-top:7px; display:flex; gap:10px; flex-wrap:wrap; font-size:12.5px; }
</style></head><body>
<header>
  <h1>Test the running apps on your phone</h1>
  <div class="sub"><!--SUB--></div>
</header>
<div class="wrap">
  <div class="how">
    <b>How this works</b>
    <ol>
      <li>Open the <b>camera</b> on the phone and point it at a code — tap the link it shows.</li>
      <li><b>Web</b> opens the app in the phone browser: nothing to install.</li>
      <li><b>Expo Go</b> opens the native app, if a dev server is tunnelling and you have Expo Go installed.</li>
      <li>Each card lists what to try, so a test has an answer that is right or wrong — not a shrug.</li>
    </ol>
  </div>
  <h2>What the hourly build job did</h2>
  <!--LOG-->
  <h2>Apps</h2>
  <div class="grid"><!--APPS--></div>
  <h2>Every screen, one code each</h2>
  <div class="grid"><!--SCREENS--></div>
  <h2>The website</h2>
  <div class="grid"><!--WEB--></div>
  <footer><!--FOOT--></footer>
</div>
</body></html>"""


def qr_svg(data: str, box: int = 6) -> bytes:
    """A QR as SVG: sharp at any size, ~9 KB, and no image library needed."""
    img = qrcode.make(data, image_factory=qrcode.image.svg.SvgPathImage, box_size=box, border=2)
    buf = io.BytesIO()
    img.save(buf)
    return buf.getvalue()


def _qr_box(url: str, label: str) -> str:
    if not HAVE_QR:
        return '<div class="qrbox"><span class="qrlab">' + esc(label) + '</span></div>'
    src = "/qr?d=" + urllib.parse.quote(url, safe="") + "&b=6"
    # onerror retry once: a burst of 14 codes through the tunnel occasionally drops one,
    # and a broken QR is indistinguishable from a wrong one to the person holding a phone.
    return ('<a class="qrbox" href="' + esc(url) + '" title="' + esc(url) + '">'
            '<img src="' + esc(src) + '" alt="QR code for ' + esc(url) + '" width="148" height="148" '
            'onerror="this.onerror=null;this.src=this.getAttribute(\'src\')+\'&r=1\'">'
            '<span class="qrlab">' + esc(label) + '</span></a>')


def _live_card(name, color, meta, tagline, url, try_steps, stills_id=None, route_note=""):
    qr = _qr_box(url, "Web") if url else ""
    go = ""
    if url:
        go_url = expo_go_link(route_note or "")
        if go_url:
            go = _qr_box(go_url, "Expo Go")
    right = ""
    if url:
        right = ('<div class="rcol"><div class="rurl">' + esc(url.replace("https://", "")) + '</div>'
                 '<div class="btns"><a class="btn" href="' + esc(url) + '">Open here</a>' +
                 ('<a class="btn ghost" href="/shots#' + esc(stills_id) + '">Stills</a>' if stills_id else "") +
                 '</div></div>')
    else:
        right = ('<div class="rcol"><div class="rurl">not built yet</div>'
                 '<div class="note">First screen to build: <code>' + esc(route_note or "its product screen") +
                 '</code></div></div>')
    steps = ""
    if try_steps:
        steps = '<ol class="try">' + "".join("<li>" + s + "</li>" for s in try_steps) + '</ol>'
    return (
        '<article class="app"><div class="bar" style="background:' + esc(color or "#60a5fa") + '"></div>'
        '<div class="in"><div class="ahead"><div><div class="aname">' + esc(name) + '</div>'
        '<div class="ameta">' + meta + '</div>'
        '<div class="atag">' + esc(tagline) + '</div></div>'
        '<span class="abadge' + ("" if url else " soon") + '">' + ("live" if url else "not built") + '</span></div>'
        '<div class="qrrow">' + qr + go + right + '</div>' + steps + '</div></article>'
    )


# Every screen worth testing on a phone, in the order a person would walk the products.
# The app cards above answer "does this app work"; this section answers "does THIS screen
# work", which is the question that actually gets asked when a screen misbehaves.
SCREEN_LINKS = [
    ("Passport photo", "/passport"),
    ("Tools hub", "/tools"),
    ("Background remover", "/tools/bg-remove"),
    ("PDF toolkit", "/tools/pdf"),
    ("Invoice / GST bill", "/tools/invoice"),
    ("Signature", "/tools/signature"),
    ("Photo metadata", "/tools/exif-strip"),
    ("Photos to PDF", "/tools/photos-to-pdf"),
    ("Collage", "/tools/collage"),
    ("Document check (CV)", "/tools/resume-checker"),
    ("Text to image", "/tools/ai-image"),
    ("Document translation", "/tools/translate-doc"),
    ("Breathe", "/breathe"),
    ("Stretch", "/stretch"),
    ("Walk", "/walk"),
    ("Today (wellness hub)", "/habits"),
    ("Progress (charts)", "/progress"),
    ("Profile (goals, data)", "/profile"),
    ("Water", "/water"),
    ("Japa", "/japa"),
    ("Sleep", "/sleep"),
    ("Tap Sprint", "/tap-sprint"),
    ("Word Duel", "/word-duel"),
]


def render_screens_section() -> str:
    go = expo_go_url()
    out = []
    for label, route in SCREEN_LINKS:
        url = EXPO_WEB + route
        box = _qr_box(url, "Web")
        if go:
            box += _qr_box(expo_go_link(route), "Expo Go")
        out.append(
            '<article class="app"><div class="bar" style="background:#334155"></div><div class="in">'
            '<div class="aname">' + esc(label) + "</div>"
            '<div class="rurl">' + esc(url.replace("https://", "")) + "</div>"
            '<div class="qrrow">' + box + "</div>"
            '<div class="btns"><a class="btn" href="' + esc(url) + '">Open</a>'
            '<a class="btn ghost" href="/shots">Stills</a></div>'
            "</div></article>"
        )
    return "".join(out)


def render_live() -> bytes:
    manifest = load_apps()
    apps_html, web_html = [], []
    live_n = 0

    if manifest:
        for app in manifest.get("apps", []):
            entry = LIVE_ROUTES.get(app["id"])
            products = app.get("products") or []
            meta = (esc(app.get("bundleId", "")) + " · " + esc(app.get("storeCategory", "")) + " · "
                    + str(len(products)) + (" product" if len(products) == 1 else " products"))
            if entry:
                route, steps = entry
                url = EXPO_WEB + route
                route_note = route
                live_n += 1
            else:
                url, steps = None, []
                route_note = str(app.get("firstScreen") or "its product screen")
            apps_html.append(_live_card(
                app["name"], app.get("color"), meta, app.get("tagline", ""), url, steps,
                stills_id="m-" + app["id"], route_note=route_note,
            ))

    for w in LIVE_WEB:
        web_html.append(_live_card(
            w["name"], "#334155", esc(w["note"]), "", w["url"], w.get("try") or [],
        ))

    live_go = expo_go_url()
    if live_go:
        go_line = ("Expo Go is live at <code>" + esc(live_go) +
                   "</code> — the second code on each card opens the native app inside Expo Go.")
    else:
        go_line = ("No Expo Go tunnel right now, so the cards carry the web build only. Start one with "
                   "<code>npx expo start --tunnel</code> in <code>apps/mobile</code> and set "
                   "<code>EXPO_GO_URL</code> to the <code>exp://…</code> it prints.")

    sub = (str(live_n) + " apps live · " + str(len(LIVE_WEB)) + " website pages · "
           "scan a code, or tap Open to use it on this screen · "
           "<a href=\"/log\">build log</a> · <a href=\"/shots\">stills gallery</a> · "
           "<a href=\"/perf\">trading</a>")
    foot = ("<b>What is behind the codes:</b> the app's web build is served from "
            "<code>" + esc(EXPO_WEB) + "</code> (pm2 <code>expo-preview</code>, "
            "services/tools/spa_server.py on :8091) — the same screens as the native app. " + go_line +
            "<br><b>Stills:</b> the screenshots you no longer need are kept at <a href=\"/shots\">/shots</a>, "
            "one tile per app.")
    return (LIVE_PAGE.replace("<!--SUB-->", sub)
                     .replace("<!--LOG-->", log_section(limit=3))
                     .replace("<!--APPS-->", "".join(apps_html))
                     .replace("<!--SCREENS-->", render_screens_section())
                     .replace("<!--WEB-->", "".join(web_html))
                     .replace("<!--FOOT-->", foot)).encode()


# ---------------------------------------------------------------------------
# /log — what the hourly build job did, straight from its own log file.
#
# The robot writes C:/Users/Administrator/shots/build-log.json through
# scripts/build-log.py (atomic write); this page only reads it. Keeping the write
# behind a script means a half-finished run cannot corrupt the page, and keeping
# the read on this host means the log is visible even when the app is mid-rebuild.
# ---------------------------------------------------------------------------

BUILD_LOG = os.environ.get("BUILD_LOG", r"C:\Users\Administrator\shots\build-log.json")

KIND_COLORS = {"fix": "#34d399", "feature": "#60a5fa", "research": "#a78bfa", "design": "#fbbf24"}
STATUS_STYLE = {
    "done": ("done", "#6ee7b7", "#052e2b"),
    "partial": ("partial", "#fbbf24", "#2a1a05"),
    "blocked": ("blocked", "#fca5a5", "#2a0a0a"),
}


LOG_PAGE = """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DropBy — build log</title>
<style>
  :root { color-scheme: dark; --bg:#0b1120; --card:#111827; --line:#1f2937; --ink:#e2e8f0;
          --dim:#94a3b8; --acc:#60a5fa; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  a { color:var(--acc); }
  header { padding:18px 16px 12px; border-bottom:1px solid var(--line); }
  h1 { margin:0 0 4px; font-size:19px; letter-spacing:-.2px; }
  .sub { color:var(--dim); font-size:12.5px; }
  .wrap { padding:14px; max-width:820px; margin:0 auto 70px; }
  .legend { color:#64748b; font-size:12px; margin:6px 0 12px; }
  code { background:#0f172a; border:1px solid var(--line); border-radius:6px; padding:1px 5px; font-size:11.5px; }
  .logcard { background:var(--card); border:1px solid var(--line); border-radius:12px;
             padding:11px 13px; margin-bottom:10px; }
  .lhead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .lkind { font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--dim); }
  .lstatus { font-size:10.5px; padding:2px 8px; border-radius:999px; }
  .lwhen { margin-left:auto; color:#64748b; font-size:11px; }
  .ltitle { font-size:14.5px; font-weight:600; margin:6px 0 4px; }
  .lrow { display:flex; gap:8px; font-size:12.5px; margin-top:3px; }
  .llab { color:#64748b; min-width:74px; font-size:11px; text-transform:uppercase; letter-spacing:.05em; padding-top:1px; }
  .lval { color:#cbd5e1; flex:1; }
  .llinks { margin-top:7px; display:flex; gap:10px; flex-wrap:wrap; font-size:12.5px; }
  .jhead { font-size:14px; margin:2px 0 2px; }
  .jobrow { background:var(--card); border:1px solid var(--line); border-radius:10px;
            padding:7px 10px; margin-bottom:6px; display:flex; flex-wrap:wrap; gap:6px 9px;
            align-items:baseline; font-size:12.5px; font-variant-numeric:tabular-nums; }
  .jid { color:#64748b; }
  .jprod { font-weight:600; }
  .jms { color:var(--dim); }
  .jby { color:#93c5fd; }
  .jcost { color:var(--dim); flex:1 1 100%; font-size:11.5px; }
  .jerr { color:#fca5a5; flex:1 1 100%; font-size:11.5px; }
  .jtries { color:#64748b; flex:1 1 100%; font-size:11px; }
  /* Cost per run (item 42): same shape as a job row, six fields, tabular figures. */
  .crow { background:var(--card); border:1px solid var(--line); border-radius:10px;
          padding:7px 10px; margin-bottom:6px; display:flex; flex-wrap:wrap; gap:6px 9px;
          align-items:baseline; font-size:12.5px; font-variant-numeric:tabular-nums; }
  .crow.dim { opacity:.72; }
  .crow.chead { background:transparent; border:0; padding:2px 10px; margin-bottom:2px;
                color:#64748b; font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; }
  .cprod { font-weight:600; min-width:118px; }
  .cprice { color:var(--dim); min-width:52px; }
  .cruns { color:var(--dim); min-width:104px; }
  .cp50 { color:var(--dim); min-width:44px; }
  .ccost { color:#93c5fd; font-weight:600; min-width:64px; }
  .ccost.dim { color:#64748b; font-weight:400; }
  .cbasis { color:#64748b; flex:1 1 100%; font-size:11px; }
  .cerr { color:#fca5a5; }
</style></head><body>
<header>
  <h1>Build log</h1>
  <div class="sub"><!--SUB--></div>
</header>
<div class="wrap"><!--JOBS--><!--COSTS--><!--BODY--></div>
</body></html>"""


def load_build_log() -> dict:
    try:
        with open(BUILD_LOG, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data.get("entries"), list) else {"entries": []}
    except Exception:
        # No log yet, or an unreadable one: the page must still render.
        return {"entries": []}


def log_card(e: dict) -> str:
    kind = str(e.get("kind") or "feature")
    status = str(e.get("status") or "done")
    label, fg, bg = STATUS_STYLE.get(status, STATUS_STYLE["done"])
    when = str(e.get("at") or "")[:16].replace("T", " ")
    body = ""
    if e.get("evidence"):
        body += ('<div class="lrow"><span class="llab">evidence</span>'
                 '<span class="lval">' + esc(e["evidence"]) + "</span></div>")
    if e.get("next"):
        body += ('<div class="lrow"><span class="llab">next hour</span>'
                 '<span class="lval">' + esc(e["next"]) + "</span></div>")
    links = ""
    if e.get("links"):
        links = '<div class="llinks">' + "".join(
            '<a href="' + esc(l.get("url", "#")) + '">' + esc(l.get("label") or l.get("url", "")) + "</a>"
            for l in e["links"] if l.get("url")
        ) + "</div>"
    return (
        '<article class="logcard" style="border-left:3px solid ' + esc(KIND_COLORS.get(kind, "#60a5fa")) + '">'
        '<div class="lhead"><span class="lkind">' + esc(kind) + "</span>"
        '<span class="lstatus" style="color:' + fg + ";background:" + bg + '">' + esc(label) + "</span>"
        '<span class="lwhen">' + esc(when) + " UTC</span></div>"
        '<div class="ltitle">' + esc(e.get("title") or "(untitled)") + "</div>"
        + body + links + "</article>"
    )


def log_section(limit: int = 4) -> str:
    data = load_build_log()
    entries = data.get("entries") or []
    if not entries:
        return ('<div class="legend">No build-log entries yet. The hourly job writes its first one '
                'with <code>python scripts/build-log.py …</code>.</div>')
    shown = entries[:limit] if limit else entries
    more = ""
    if limit and len(entries) > limit:
        more = ('<div class="legend" style="margin-top:8px"><a href="/log">all ' + str(len(entries)) +
                " entries</a></div>")
    elif not limit:
        more = ""
    return "".join(log_card(e) for e in shown) + more


# ---------------------------------------------------------------------------
# /log — one line per recent job, with the provider that answered (queue item 37).
#
# Why the page server reads the table itself: a job's provider and cost exist only in
# `product_jobs.meta` (written by apps/web/app/api/job/route.ts), and nothing rendered
# them anywhere. Two measured facts shape the read:
#   * the PUBLISHABLE key cannot see these rows — `GET /rest/v1/product_jobs` with it
#     answers 200 and an EMPTY array while the service key returns all of them (RLS),
#     so a panel built on the anon key would say "no jobs" while 155 exist;
#   * the page is opened from a phone at an arbitrary minute, so the read is cached
#     in-process for a minute and shared by every request (one read per minute, not
#     one per view — this box serves the live site too).
# The service-role key stays server-side and is never put on the page; when Supabase
# cannot be reached the panel says so and the rest of the page still renders.
# ---------------------------------------------------------------------------

WEB_ENV = os.environ.get("WEB_ENV", r"C:\Users\Administrator\Marketplace\apps\web\.env")
JOBS_LIMIT = 12
JOBS_TTL = 60.0
JOBS_CACHE: dict = {"at": 0.0, "rows": None}


def _env_kv(name: str) -> str:
    """One value from the process env, else from the web app's own .env file."""
    value = os.environ.get(name)
    if value and value.strip():
        return value.strip().strip('"').strip("'")
    try:
        with open(WEB_ENV, "r", encoding="utf-8") as fh:
            for raw in fh:
                key, _, val = raw.strip().partition("=")
                if key == name:
                    return val.strip().strip('"').strip("'")
    except Exception:
        pass
    return ""


def recent_jobs() -> tuple[list, str]:
    """The newest `product_jobs` rows, plus a reason when they could not be read."""
    now = time.time()
    if JOBS_CACHE["rows"] is not None and now - JOBS_CACHE["at"] < JOBS_TTL:
        return JOBS_CACHE["rows"], ""
    url = (_env_kv("SUPABASE_URL") or _env_kv("NEXT_PUBLIC_SUPABASE_URL")).rstrip("/")
    key = _env_kv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return JOBS_CACHE["rows"] or [], "no Supabase URL/key on this host"
    query = ("product_jobs?select=id,product,status,duration_ms,created_at,error,meta"
             "&order=id.desc&limit=" + str(JOBS_LIMIT))
    req = urllib.request.Request(
        url + "/rest/v1/" + query,
        headers={"apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
        if not isinstance(rows, list):
            raise ValueError("the answer was not a list")
    except Exception as exc:
        # Keep the last good read on screen rather than blanking the panel.
        return JOBS_CACHE["rows"] or [], "the job table could not be read just now (" + type(exc).__name__ + ")"
    JOBS_CACHE.update({"at": now, "rows": rows})
    return rows, ""


def job_provider(meta: dict) -> str:
    """Who answered this job, read off the row's own meta — never guessed."""
    if not isinstance(meta, dict) or not meta:
        return "no meta recorded"
    if meta.get("ai_provider"):
        return "by " + str(meta["ai_provider"])
    if meta.get("model"):
        return "by " + str(meta["model"])
    if isinstance(meta.get("engines"), dict) and meta["engines"]:
        return "by " + ", ".join(f"{k} x{v}" for k, v in meta["engines"].items())
    return "local — no model"


def job_facts(meta: dict) -> list:
    """The numbers on the row worth a line: cost, usage, attempts, what it did."""
    if not isinstance(meta, dict):
        return []
    out = []
    if meta.get("ai_cost"):
        out.append(str(meta["ai_cost"])[:110])
    if meta.get("neurons"):
        out.append(str(meta["neurons"]) + " neurons billed")
    if meta.get("attempts"):
        n = meta["attempts"]
        out.append(str(n) + " upstream attempt" + ("" if str(n) == "1" else "s"))
    if meta.get("op"):
        out.append(str(meta["op"]))
    if meta.get("bytes") and not meta.get("ai_cost"):
        out.append(str(meta["bytes"]) + " B out")
    return out


def render_jobs() -> str:
    rows, why = recent_jobs()
    note = ('one line per <code>product_jobs</code> row, newest first — the provider and the '
            'cost are read from the row\'s own <code>meta</code>, not guessed')
    if rows and JOBS_CACHE["at"]:
        age = int(max(0.0, time.time() - JOBS_CACHE["at"]))
        # The read is cached for a minute, so the page says how old it is rather than
        # implying the last minute of jobs did not happen.
        note += " · read " + (str(age) + " s ago" if age else "just now")
    if why:
        note += ' · <span class="jerr" style="display:inline">' + esc(why) + "</span>"
    head = '<h2 class="jhead">Recent jobs</h2><div class="legend">' + note + "</div>"
    if not rows:
        return head + '<div class="legend">No job rows to show.</div>'
    cards = []
    for job in rows:
        meta = job.get("meta") if isinstance(job.get("meta"), dict) else {}
        status = str(job.get("status") or "?")
        colour = {"done": "#6ee7b7", "failed": "#fca5a5"}.get(status, "#fbbf24")
        ms = job.get("duration_ms")
        took = "—" if ms is None else (f"{ms / 1000:.1f} s" if ms >= 1000 else f"{ms} ms")
        facts = job_facts(meta)
        tries = meta.get("ai_tries") if isinstance(meta.get("ai_tries"), list) else []
        cards.append(
            '<div class="jobrow">'
            '<span class="jid">#' + esc(str(job.get("id"))) + "</span>"
            '<span class="jprod">' + esc(str(job.get("product"))) + "</span>"
            '<span class="jstat" style="color:' + colour + '">' + esc(status) + "</span>"
            '<span class="jms">' + esc(took) + "</span>"
            '<span class="jby">' + esc(job_provider(meta)) + "</span>"
            + ('<span class="jerr">' + esc(str(job.get("error"))[:160]) + "</span>"
               if job.get("error") else "")
            + ('<span class="jcost">' + esc(" · ".join(facts)) + "</span>" if facts else "")
            + ('<span class="jtries">tried: ' + esc(" → ".join(str(t) for t in tries)) + "</span>"
               if len(tries) > 1 else "")
            + "</div>"
        )
    return head + "".join(cards)


# ---------------------------------------------------------------------------
# /log — what each product costs per run (queue item 42).
#
# `npm run cost:report` (queue item 16) prints price beside measured cost per product, and
# the only place a person could read it was a terminal on this VM — while the page he
# actually opens on his phone is /log. This panel renders the SAME numbers by shelling out
# to the same script, because a second implementation on the page is exactly how a hosted
# product quietly goes back to reading "Rs 0". The rules therefore live once, in the script:
#
#   * the script reads `product_jobs` + `products` and one FX rate, so it takes ~4 s
#     (measured 4.08 s cold). Cached in-process for a minute: one run per minute, shared
#     by every request, and only /log ever pays it — / and /shots do not touch it;
#   * the script **exits 1** when a product's numbers contradict its catalogue row (a
#     local product showing billed neurons). That is not a reason to hide the table:
#     the failures are printed in red above it and `ok` is on the page;
#   * a product with a catalogue row but no run is rendered with the script's own words —
#     "no measured run" — never a Rs 0, because a zero is a claim this box cannot measure;
#   * when the read fails, the panel says why and keeps the last good one, so the page
#     still renders from a phone in a tunnel.
# ---------------------------------------------------------------------------

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COST_SCRIPT = os.environ.get("COST_SCRIPT", os.path.join(REPO, "scripts", "cost-report.mjs"))
COST_TTL = 60.0
COST_TIMEOUT = 90.0
COST_CACHE: dict = {"at": 0.0, "report": None, "code": None, "note": ""}
# One run per minute, shared by every request — but *reading* the cache is not enough to keep
# that promise: two requests arriving in the same second on a cold cache both see
# `report is None`, both spawn the script (~4 s cold and one Supabase read each), and the box
# that serves the live site pays twice. The server IS a ThreadingHTTPServer, so two handler
# threads really do run at the same instant — this is a race, not a theoretical one. The lock
# below makes the second caller wait for the first, and the double-check inside it means the
# waiter finds the fresh report and pays nothing. It is held only around the spawn.
COST_LOCK = threading.Lock()


def _node_bin() -> str:
    """The node this box really has: PATH first, then the Hermes runtime's own copy."""
    found = shutil.which("node")
    if found:
        return found
    for guess in (
        os.path.expanduser(r"~\AppData\Local\hermes\node\node.exe"),
        r"C:\Program Files\nodejs\node.exe",
    ):
        if os.path.isfile(guess):
            return guess
    return "node"


def product_costs() -> tuple[dict | None, str, int | None]:
    """The cost report as JSON, plus a reason when it could not be produced."""
    now = time.time()
    if COST_CACHE["report"] is not None and now - COST_CACHE["at"] < COST_TTL:
        return COST_CACHE["report"], COST_CACHE["note"], COST_CACHE["code"]
    if not os.path.isfile(COST_SCRIPT):
        return COST_CACHE["report"], "the cost script is not on this host (" + COST_SCRIPT + ")", None
    with COST_LOCK:
        # Double-checked: a caller that queued here while a sibling was running the script must
        # find that sibling's report and pay nothing, or every waiter spawns its own node.
        now = time.time()
        if COST_CACHE["report"] is not None and now - COST_CACHE["at"] < COST_TTL:
            return COST_CACHE["report"], COST_CACHE["note"], COST_CACHE["code"]
        try:
            proc = subprocess.run(
                [_node_bin(), COST_SCRIPT, "--json"],
                cwd=REPO, capture_output=True, text=True, timeout=COST_TIMEOUT,
            )
            report = json.loads(proc.stdout)
            if not isinstance(report, dict) or not isinstance(report.get("products"), list):
                raise ValueError("the script's answer was not the cost report")
            # A non-zero exit is the script's own gate (a number contradicts the catalogue): keep
            # the report and the code, so the page can show the failures beside the figures.
            COST_CACHE.update({"at": now, "report": report, "code": proc.returncode, "note": ""})
            return report, "", proc.returncode
        except subprocess.TimeoutExpired:
            why = "the cost script did not answer in " + str(int(COST_TIMEOUT)) + " s"
        except Exception as exc:
            why = "the cost script could not be read just now (" + type(exc).__name__ + ")"
    return COST_CACHE["report"], why, COST_CACHE["code"]


def _cost_row(row: dict, dim: bool = False) -> str:
    label = str(row.get("per_run_label"))
    faded = label in ("Rs 0", "no measured run") or row.get("kind") == "no-measured-run"
    cls = "ccost dim" if faded else "ccost"
    return (
        '<div class="crow' + (" dim" if dim else "") + '">'
        '<span class="cprod">' + esc(str(row.get("slug"))) + "</span>"
        '<span class="cprice">' + esc(str(row.get("price"))) + "</span>"
        '<span class="cruns">' + esc(str(row.get("runs") or "never run")) + "</span>"
        '<span class="cp50">' + esc(str(row.get("p50") or "—")) + "</span>"
        '<span class="' + cls + '">' + esc(label) + "</span>"
        '<span class="cbasis">' + esc(str(row.get("basis"))) + "</span>"
        "</div>"
    )


def render_costs() -> str:
    report, why, code = product_costs()
    note = ("one row per product — price beside the cost measured from its own jobs; the figures "
            "come from <code>scripts/cost-report.mjs</code> (item 16), which this page runs, so "
            "there is no second copy of the arithmetic")
    if report is not None:
        neurons = report.get("neurons") or {}
        fx = report.get("fx") or {}
        try:
            note += (" · neurons $" + str(neurons.get("usd_per_1k")) + " per 1,000, "
                     + str(neurons.get("free_per_day")) + " free/day")
        except Exception:
            pass
        if fx.get("usd_inr"):
            note += (" · USD 1 = INR " + f"{float(fx['usd_inr']):.2f}" + " (" + str(fx.get("source") or "?") + ")")
    if report is not None and COST_CACHE["at"]:
        age = int(max(0.0, time.time() - COST_CACHE["at"]))
        note += " · read " + (str(age) + " s ago" if age else "just now")
    if why:
        note += ' · <span class="cerr" style="display:inline">' + esc(why) + "</span>"
    head = '<h2 class="jhead">What each product costs per run</h2><div class="legend">' + note + "</div>"
    if report is None:
        return head + '<div class="legend">No cost figures to show yet.</div>'

    failures = report.get("failures") or []
    block = ""
    if failures or code:
        block = ('<div class="jobrow" style="border-color:#7f1d1d"><span class="jerr">'
                 + esc("cost report FAILED (" + str(code) + "): " + "; ".join(str(f) for f in failures))
                 + "</span></div>") if failures else ""
    rows = "".join(_cost_row(r) for r in report.get("products") or [])
    no_run = report.get("no_measured_run") or []
    tail = ""
    if no_run:
        tail = ('<div class="legend" style="margin-top:6px">'
                + esc(str(len(no_run)) + " products have a catalogue row and no measured run — "
                      + "each reads \"no measured run\", which is not a price:")
                + "</div>" + "".join(_cost_row(r, dim=True) for r in no_run))
    return (head + block
            + '<div class="crow chead"><span class="cprod">product</span><span class="cprice">price</span>'
              '<span class="cruns">runs</span><span class="cp50">p50</span>'
              '<span class="ccost">per run</span><span class="cbasis">basis</span></div>'
            + rows + tail)


def render_log() -> bytes:
    data = load_build_log()
    entries = data.get("entries") or []
    sub = (str(len(entries)) + " entries · newest first · written by "
           "<code>python scripts/build-log.py</code> · <a href=\"/\">test the apps</a> · "
           "<a href=\"/shots\">stills</a>")
    body = log_section(limit=0) if entries else log_section(limit=0)
    return (LOG_PAGE.replace("<!--JOBS-->", render_jobs())
            .replace("<!--COSTS-->", render_costs())
            .replace("<!--SUB-->", sub).replace("<!--BODY-->", body)).encode()


PERF_JSON = os.environ.get("PERF_JSON", r"C:\bridge\perf.json")
PERF_HIST = os.environ.get("PERF_HIST", r"C:\bridge\perf_history.json")
NEWS_JSON = os.environ.get("NEWS_JSON", r"C:\bridge\news.json")
QUANT_JSON = os.environ.get("QUANT_JSON", r"C:\bridge\quant_metrics.json")

PERF_CSS = """
  :root { color-scheme: dark; --bg:#0b1120; --card:#111827; --line:#1f2937; --ink:#e2e8f0; --dim:#94a3b8;
          --acc:#60a5fa; --good:#34d399; --bad:#f87171; --warn:#fbbf24; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  a { color: var(--acc); }
  header { padding:16px; border-bottom:1px solid var(--line); position:sticky; top:0; background:#0b1120f5;
           backdrop-filter: blur(8px); z-index:5; }
  h1 { margin:0 0 2px; font-size:18px; }
  .sub { color:var(--dim); font-size:12.5px; }
  .wrap { padding:14px; max-width:980px; margin:0 auto 60px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin:14px 0; }
  .kpi { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:11px 12px; }
  .kpi .lab { color:var(--dim); font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
  .kpi .val { font-size:20px; font-weight:600; margin-top:3px; font-variant-numeric:tabular-nums; }
  .pos { color:var(--good); } .neg { color:var(--bad); } .warn { color:var(--warn); }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line);
          border-radius:12px; overflow:hidden; font-size:13px; }
  th, td { padding:7px 9px; text-align:right; border-bottom:1px solid var(--line); font-variant-numeric:tabular-nums; }
  th:first-child, td:first-child { text-align:left; }
  th { color:var(--dim); font-weight:500; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
  h2 { font-size:14px; margin:20px 0 7px; color:var(--ink); }
  .health { border-radius:12px; padding:10px 12px; margin:12px 0; font-size:13px; border:1px solid var(--line);
            background:var(--card); }
  .health.bad { border-color:var(--bad); }
  .health.ok { border-color:#14532d; }
  .spark { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:8px; }
  .note { color:var(--dim); font-size:11.5px; margin-top:6px; }
"""


def render_perf() -> bytes:
    """The trading dashboard: real numbers only, and loud when the data is stale."""
    try:
        with open(PERF_JSON, "r", encoding="utf-8") as fh:
            d = json.load(fh)
    except Exception as e:
        return (f"<!doctype html><meta charset=utf-8><body style='background:#0b1120;color:#e2e8f0;"
                f"font:15px system-ui;padding:24px'><h1>No trading snapshot yet</h1>"
                f"<p>Run <code>C:\\Program Files\\Python311\\python.exe C:\\bridge\\perf_collect.py</code>, "
                f"or wait for the scheduled task.</p><p class=note>{html.escape(str(e))}</p>"
                f"<p><a href='/'>← snapshots</a></p>").encode()

    gen = d.get("generated_at", "")
    try:
        age_min = (datetime.now(timezone.utc) - datetime.fromisoformat(gen)).total_seconds() / 60
    except Exception:
        age_min = None
    stale = age_min is None or age_min > 30
    a = d.get("account") or {}
    r = d.get("realised") or {}
    h = d.get("health") or {}

    def money(v):
        if v is None:
            return "—"
        return f'<span class="{"pos" if v > 0 else "neg" if v < 0 else ""}">{v:+,.2f}</span>'

    # ---- equity sparkline -----------------------------------------------------
    spark = ""
    if os.path.isfile(PERF_HIST):
        try:
            with open(PERF_HIST) as fh:
                hist = json.load(fh)
            pts = [p.get("equity") or p.get("balance") for p in hist][-240:]
            pts = [p for p in pts if isinstance(p, (int, float))]
            if len(pts) >= 2:
                lo, hi = min(pts), max(pts)
                span = (hi - lo) or 1.0
                w, hh = 640, 120
                stepx = w / (len(pts) - 1)
                coords = " ".join(f"{i * stepx:.1f},{hh - (v - lo) / span * (hh - 12) - 6:.1f}" for i, v in enumerate(pts))
                spark = (f'<div class="spark"><svg viewBox="0 0 {w} {hh}" width="100%" height="{hh}" '
                         f'preserveAspectRatio="none"><polyline points="{coords}" fill="none" '
                         f'stroke="#60a5fa" stroke-width="2"/></svg>'
                         f'<div class="note">equity, {len(pts)} points · low {lo:,.2f} · high {hi:,.2f} · '
                         f'now {pts[-1]:,.2f}</div></div>')
        except Exception:
            spark = ""

    # ---- tables ---------------------------------------------------------------
    sym_rows = []
    for s in d.get("symbols", []):
        pct = s.get("spread_pct_of_stop")
        win = s.get("win_pct")
        pf = s.get("pf")
        avg = s.get("avg_per_trade")
        plan = s.get("plan_exp_r")
        pct_s = f"{pct:.1f}%" if pct is not None else ""
        win_s = f"{win:.0f}%" if win is not None else ""
        pf_s = f"{pf:.2f}" if pf is not None else ""
        avg_s = f"{avg:+.2f}" if avg is not None else ""
        plan_s = f"{plan:+.3f}R" if plan is not None else ""
        live = s.get("live_exp_r")
        live_s = f"{live:+.3f}R" if live is not None else ""
        note = html.escape(str(s.get("plan_note") or ""))
        sym_rows.append(
            "<tr>"
            + f"<td>{html.escape(s['symbol'])}</td>"
            + f"<td>{s['spread']:.5f}</td>"
            + f"<td>{pct_s}</td>"
            + f"<td>{s['trades_30d']}</td>"
            + f"<td>{win_s}</td>"
            + f"<td>{money(s['net_30d'])}</td>"
            + f"<td>{pf_s}</td>"
            + f"<td>{live_s}</td>"
            + f"<td>{plan_s}</td>"
            + f"<td style='text-align:left;color:var(--dim)'>{note}</td>"
            + "</tr>"
        )

    side_rows = []
    for k, v in (d.get("by_side") or {}).items():
        side_rows.append(
            f"<tr><td>{k}</td><td>{v['trades']}</td><td>{v['win_pct']:.0f}%</td><td>{money(v['net'])}</td>"
            f"<td>{v['avg']:+.2f}</td><td>{v['best']:+.2f}</td><td>{v['worst']:+.2f}</td></tr>")

    magic_rows = "".join(
        f"<tr><td>{html.escape(k)}</td><td>{v['trades']}</td><td>{money(v['net'])}</td></tr>"
        for k, v in (d.get("by_magic") or {}).items())

    pos_rows = "".join(
        f"<tr><td>{html.escape(p['symbol'])}</td><td>{p['type']}</td><td>{p['volume']}</td>"
        f"<td>{p['open']}</td><td>{money(p['profit'])}</td><td>{p['magic']}</td><td>{p['age_min']:.0f}m</td></tr>"
        for p in d.get("open_positions", []))

    day_rows = "".join(
        f"<tr><td>{html.escape(k)}</td><td>{money(v)}</td></tr>"
        for k, v in sorted((d.get("realised", {}).get("days") or {}).items(), reverse=True))

    health_class = "bad" if stale or not d.get("ok") else "ok"
    health_txt = (
        f"collector last ran {age_min:.0f} min ago" if age_min is not None else "collector timestamp unreadable"
    )
    if stale:
        health_txt += " — STALE, the scheduled collector may have stopped"
    if not d.get("ok"):
        health_txt += " — last run FAILED: " + html.escape("; ".join(d.get("errors") or []))

    # ---- news guard: what is about to hit the market ---------------------------
    news_html = ""
    try:
        with open(NEWS_JSON, "r", encoding="utf-8") as fh:
            nw = json.load(fh)
        state = nw.get("market_state", "?")
        cls = {"OK": "ok", "CAUTION": "warn", "STAND_ASIDE": "bad"}.get(state, "ok")
        ev_rows = "".join(
            f"<tr><td>{html.escape(e['title'])}</td><td>{html.escape(e['ccy'])}</td>"
            f"<td>{e['in_min']}m</td><td>{html.escape(e.get('forecast') or '—')}</td>"
            f"<td>{html.escape(e.get('previous') or '—')}</td></tr>"
            for e in (nw.get("next_events") or [])[:6])
        v_rows = ""
        for k, v in (nw.get("verdicts") or {}).items():
            mins = v.get("minutes")
            mins_txt = "" if mins is None else f" — in {mins} min"
            ev_txt = html.escape(str(v.get("event") or "nothing high-impact in 24h")) + mins_txt
            vclass = "bad" if v["verdict"] == "STAND_ASIDE" else "warn" if v["verdict"] == "CAUTION" else ""
            v_rows += (f"<tr><td>{html.escape(k)}</td><td class='{vclass}'>{v['verdict']}</td>"
                       f"<td style='text-align:left;color:var(--dim)'>{ev_txt}</td></tr>")
        news_html = f"""
  <h2>News guard — the calendar, not the narrative</h2>
  <div class="health {cls}">market state: <strong>{html.escape(state)}</strong>
   · feed updated {html.escape(str(nw.get('generated_at', ''))[:16].replace('T', ' '))} UTC
   · stand-aside inside ±{15} min of a high-impact release, caution inside ±60</div>
  <table><tr><th>event</th><th>ccy</th><th>in</th><th>forecast</th><th>previous</th></tr>
  {ev_rows or '<tr><td>none scheduled</td><td colspan=4></td></tr>'}</table>
  <h2>Per symbol</h2>
  <table><tr><th>symbol</th><th>verdict</th><th>next risk event</th></tr>{v_rows}</table>
  <div class="note">Source: Forex Factory weekly calendar (public json). A breakout system should not be
   opening positions into a rate decision: the spread widens and stops get hunted exactly where they sit.</div>"""
    except Exception as e:
        news_html = (f'<div class="health bad">news guard unavailable: {html.escape(str(e))}</div>')

    # ---- risk sizing study (QuantStats on the portfolio replay) ----------------
    quant_html = ""
    try:
        with open(QUANT_JSON, "r", encoding="utf-8") as fh:
            qm = json.load(fh)
        rows = []
        for label, m in qm.get("by_risk", {}).items():
            halved = m.get("prob_halved_in_30d_pct", 0)
            cls = "bad" if halved >= 1 else ("warn" if m.get("max_drawdown_pct", 0) >= 40 else "")
            rows.append(
                f"<tr><td>{html.escape(label)}</td><td>{m.get('sharpe')}</td><td>{m.get('sortino')}</td>"
                f"<td class='{cls}'>{m.get('max_drawdown_pct')}%</td>"
                f"<td>{m.get('mc_median_end')}</td><td>{m.get('mc_p05_end')}</td>"
                f"<td class='{cls}'>{halved}%</td></tr>")
        quant_html = f"""
  <h2>How much risk per trade — measured, not guessed</h2>
  <table>
    <tr><th>risk/trade</th><th>sharpe</th><th>sortino</th><th>max drawdown</th>
        <th>MC median 30d</th><th>MC 5th pct</th><th>P(halved in 30d)</th></tr>
    {''.join(rows)}
  </table>
  <div class="note">QuantStats + a 2,000-path bootstrap of the {qm.get('trades', 0)}-trade portfolio
   (341 days, gold + 3 indices + oil + crypto, session/side gates applied). Note what rising risk
   actually buys: the median outcome grows, but Sharpe FALLS, the drawdown grows, and the worst
   5% outcome gets WORSE, not better — at 10% the tail is deeper than at 2%. Drawdown is the cost;
   the risk governor (halve risk after 10% down, quarter after 20%) is what keeps it survivable.</div>"""
    except Exception:
        quant_html = ""

    # ---- guard banner: silent failures, made loud -------------------------------
    alerts = d.get("alerts") or []
    gstate = d.get("guard_state") or ("ok" if not alerts else "warn")
    gcls = {"ok": "ok", "warn": "warn", "alert": "bad"}.get(gstate, "warn")
    if alerts:
        gitems = "".join(
            f"<li><b>{html.escape(str(al.get('instance', '')))}</b> — {html.escape(str(al.get('msg', '')))}</li>"
            for al in alerts)
        guard_html = (f'<div class="health {gcls}"><b>Guards: {len(alerts)} alert(s)</b>'
                      f'<ul style="margin:6px 0 0 18px">{gitems}</ul></div>')
    else:
        guard_html = ('<div class="health ok">Guards: no alerts — every instance running, heartbeats fresh, '
                      'no naked positions, no out-of-window entries since the last restart, '
                      'sizes and spreads inside limits.</div>')

    # ---- verdict: is the edge showing, and does the SHAPE still clear zero? ---------
    v = d.get("verdict") or {}
    fired = v.get("fired") or []
    fired_html = (f'<div style="margin-top:5px">SWITCH-OFF TRIGGER FIRED: '
                  f'{html.escape(", ".join(str(x) for x in fired))}</div>') if fired else ""
    if v.get("live_r") is not None:
        vs = "bad" if (v.get("ci95") or [0, 0])[1] < 0 else (
            "ok" if (v.get("ci95") or [0, 0])[0] > 0 else "warn")
        verdict_html = (
            f'<div class="health {vs}"><b>Verdict: {html.escape(str(v.get("verdict", "")))}</b>'
            f'<div style="margin-top:5px">payoff <b>{v.get("payoff")}</b> '
            f'(plan {v.get("plan_payoff")}) · win rate <b>{v.get("win_rate")}%</b> '
            f'(plan {v.get("plan_win_rate")}%) · avg win <b>{v.get("avg_win_r")}R</b> · '
            f'avg loss <b>{v.get("avg_loss_r")}R</b> · break-even win rate '
            f'<b>{v.get("breakeven_win_rate")}%</b> · scratches {v.get("scratches")}</div>'
            f'<div style="margin-top:5px">{html.escape(str(v.get("shape_note", "")))}</div>'
            f'<div style="margin-top:5px">progress to a verdict: <b>{v.get("trades")}'
            f'/{v.get("trades_needed")}</b> trades · {html.escape(str(v.get("scale_up_rule", "")))}</div>'
            + fired_html + '</div>')
    else:
        verdict_html = ('<div class="health warn">Verdict: fewer than 5 live trades — '
                        'nothing can be concluded yet.</div>')

    body = f"""<header>
  <h1>Trading performance — account {html.escape(str(a.get('login', '?')))}</h1>
  <div class="sub">{html.escape(str(a.get('server', '')))} · {html.escape(str(a.get('currency', '')))}
   · leverage 1:{html.escape(str(a.get('leverage', '?')))} · updated {html.escape(gen[:19].replace('T', ' '))} UTC
   · <a href="/">snapshots</a></div>
</header>
<div class="wrap">
  <div class="health {health_class}">{html.escape(health_txt)}</div>
  {guard_html}
  {verdict_html}
  <div class="grid">
    <div class="kpi"><div class="lab">equity</div><div class="val">{a.get('equity', 0):,.2f}</div></div>
    <div class="kpi"><div class="lab">balance</div><div class="val">{a.get('balance', 0):,.2f}</div></div>
    <div class="kpi"><div class="lab">today</div><div class="val">{money(r.get('net_today'))}</div></div>
    <div class="kpi"><div class="lab">7 days</div><div class="val">{money(r.get('net_7d'))}</div></div>
    <div class="kpi"><div class="lab">30 days</div><div class="val">{money(r.get('net_30d'))}</div></div>
    <div class="kpi"><div class="lab">open</div><div class="val">{h.get('open_positions', 0)}</div></div>
    <div class="kpi"><div class="lab">free margin</div><div class="val">{a.get('margin_free', 0):,.2f}</div></div>
    <div class="kpi"><div class="lab">last deal</div><div class="val">{'' if h.get('last_deal_min_ago') is None else f"{h['last_deal_min_ago']:.0f}m"}</div></div>
  </div>
  {spark}
  {quant_html}
  {news_html}
  <h2>Daily P&amp;L (UTC)</h2>
  <table><tr><th>day</th><th>net</th></tr>{day_rows or '<tr><td>no closed trades yet</td><td></td></tr>'}</table>
  <h2>Long vs short — the "small wins, big losses" detector</h2>
  <table><tr><th>side</th><th>trades</th><th>win%</th><th>net</th><th>avg</th><th>best</th><th>worst</th></tr>
  {side_rows or '<tr><td>no data</td><td colspan=6></td></tr>'}</table>
  <div class="note">If avg is positive and worst is several times best, the risk per trade is too
   large for the account: the edge is real but one stop erases many wins.</div>
  <h2>By magic (234000 = live bot)</h2>
  <table><tr><th>magic</th><th>trades</th><th>net</th></tr>{magic_rows or '<tr><td>—</td><td></td><td></td></tr>'}</table>
  <h2>Symbols watched — live spread vs the backtest plan</h2>
  <table>
    <tr><th>symbol</th><th>spread</th><th>% of stop</th><th>trades 30d</th><th>win%</th><th>net 30d</th><th>PF</th>
        <th>live R/trade</th><th>plan R</th><th>rule</th></tr>
    {''.join(sym_rows)}
  </table>
  <div class="note">"plan" is the backtest edge per trade in R (208 days of M15 with this account's spreads);
   if live avg/trade stays well below it, the edge is not being harvested as modelled.</div>
  <h2>Open positions</h2>
  <table><tr><th>symbol</th><th>side</th><th>vol</th><th>open</th><th>P/L</th><th>magic</th><th>age</th></tr>
  {pos_rows or '<tr><td>flat</td><td colspan=6></td></tr>'}</table>
  <div class="note">Snapshot written by <code>C:\\bridge\\perf_collect.py</code> every 15 minutes
   (Windows task "DropBy-Perf-Collect"). Timeline: <a href="/perf.json">raw json</a>.</div>
</div>"""
    return PERF_DOC.format(css=PERF_CSS, body=body).encode()


PERF_DOC = "<!doctype html><html lang=en><head><meta charset=utf-8>" \
           "<meta name=viewport content='width=device-width,initial-scale=1'>" \
           "<title>Trading performance</title><style>{css}</style></head><body>{body}</body></html>"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        path = self.path.split("?")[0]
        if path in ("/perf", "/perf/"):
            self._send(render_perf(), "text/html; charset=utf-8")
            return
        if path in ("/perf.json", "/perf_history.json"):
            src = PERF_JSON if path == "/perf.json" else PERF_HIST
            try:
                with open(src, "rb") as fh:
                    self._send(fh.read(), "application/json")
            except Exception:
                self.send_response(404)
                self.send_header("Content-Length", "0")
                self.end_headers()
            return
        if path in ("/", "/index.html", "/live"):
            self._send(render_live(), "text/html; charset=utf-8")
            return
        if path in ("/log", "/log/"):
            self._send(render_log(), "text/html; charset=utf-8")
            return
        if path in ("/shots", "/shots/"):
            self._send(render(), "text/html; charset=utf-8")
            return
        if path == "/qr":
            query = urllib.parse.parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "")
            data = (query.get("d") or [""])[0]
            try:
                box = max(2, min(12, int((query.get("b") or ["6"])[0])))
            except ValueError:
                box = 6
            if not data or len(data) > 600 or not HAVE_QR:
                self.send_response(400 if not HAVE_QR else 404)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            svg = qr_svg(data, box)
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.send_header("Content-Length", str(len(svg)))
            self.end_headers()
            self.wfile.write(svg)
            return

        name = os.path.basename(path)
        is_thumb = path.startswith("/_thumbs/")
        if is_thumb:
            rel = path[len("/_thumbs/"):]
            full = os.path.join(THUMB_DIR, rel) if ".." not in rel else ""
        else:
            full = os.path.join(ROOT, name)
        ok_ext = name.lower().endswith((".jpeg", ".jpg")) if is_thumb else name.lower().endswith(IMAGE_EXT)
        if name and ok_ext and os.path.isfile(full):
            with open(full, "rb") as fh:
                data = fh.read()
            ctype = "image/jpeg" if name.lower().endswith((".jpg", ".jpeg")) else "image/png"
            self._send(data, ctype)
            return
        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _send(self, data: bytes, ctype: str):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    os.makedirs(ROOT, exist_ok=True)
    print(f"shots gallery on http://127.0.0.1:{PORT} serving {ROOT} (PIL={HAVE_PIL})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
