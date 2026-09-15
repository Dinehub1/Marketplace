#!/usr/bin/env python3
"""
Shots gallery — a phone-friendly page showing every screenshot the agents produce.

Scans the shots folder on every request, so a new PNG appears the moment an agent
writes it; no build, no cache, nothing to restart. Served behind the tunnel at
shots.dropby.co.in.

Run: python services/tools/shots_server.py <folder> <port>
"""
from __future__ import annotations

import html
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "shots")
PORT = int(sys.argv[2] if len(sys.argv) > 2 else 8092)
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")

PAGE = """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DropBy — app snapshots</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: #0b1120; color: #e2e8f0;
         font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
  header {{ padding: 22px 18px 12px; position: sticky; top: 0; background: #0b1120ee;
            backdrop-filter: blur(8px); border-bottom: 1px solid #1e293b; z-index: 5; }}
  h1 {{ margin: 0 0 4px; font-size: 19px; letter-spacing: -.2px; }}
  .sub {{ color: #94a3b8; font-size: 13px; }}
  .wrap {{ padding: 16px 14px 60px; max-width: 900px; margin: 0 auto; }}
  .card {{ background: #111827; border: 1px solid #1f2937; border-radius: 14px;
           overflow: hidden; margin-bottom: 18px; }}
  .card h2 {{ margin: 0; padding: 12px 14px; font-size: 14px; font-weight: 600;
              display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }}
  .meta {{ color: #64748b; font-size: 11px; font-weight: 400; white-space: nowrap; }}
  .card img {{ display: block; width: 100%; background: #000; }}
  .empty {{ padding: 40px 18px; text-align: center; color: #94a3b8;
            border: 1px dashed #334155; border-radius: 14px; }}
  .pill {{ display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px;
           background: #1e293b; color: #94a3b8; margin-right: 6px; }}
  a {{ color: #60a5fa; }}
</style></head><body>
<header>
  <h1>DropBy — app snapshots</h1>
  <div class="sub">{count} image(s) · page refreshes on every load · <a href="/">reload</a></div>
</header>
<div class="wrap">
{body}
</div></body></html>"""


def render() -> bytes:
    files = []
    if os.path.isdir(ROOT):
        for name in os.listdir(ROOT):
            p = os.path.join(ROOT, name)
            if os.path.isfile(p) and name.lower().endswith(IMAGE_EXT):
                files.append((os.path.getmtime(p), name, os.path.getsize(p)))
    files.sort(reverse=True)

    if not files:
        body = ("""<div class="empty"><p><strong>No snapshots yet.</strong></p>
        <p>The screenshot agent is still installing Chromium and capturing.<br>
        This page updates itself the moment a PNG lands.</p>
        <p class="meta">watching: %s</p></div>""" % html.escape(ROOT))
    else:
        cards = []
        for mtime, name, size in files:
            when = time.strftime("%d %b %H:%M", time.localtime(mtime))
            kb = f"{size/1024:.0f} KB" if size < 1024 * 1024 else f"{size/1048576:.1f} MB"
            label = name.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title()
            cards.append(f"""  <div class="card">
    <h2>{html.escape(label)}<span class="meta">{html.escape(name)} · {kb} · {when}</span></h2>
    <a href="/{html.escape(name)}" target="_blank"><img src="/{html.escape(name)}" alt="{html.escape(label)}" loading="lazy"></a>
  </div>""")
        body = "\n".join(cards)

    return PAGE.format(count=len(files), body=body).encode()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            body = render()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        name = os.path.basename(path)
        full = os.path.join(ROOT, name)
        if name and os.path.isfile(full) and name.lower().endswith(IMAGE_EXT):
            with open(full, "rb") as fh:
                data = fh.read()
            self.send_response(200)
            self.send_header("Content-Type", "image/png" if name.endswith(".png") else "image/jpeg")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    os.makedirs(ROOT, exist_ok=True)
    print(f"shots gallery on http://127.0.0.1:{PORT} serving {ROOT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
