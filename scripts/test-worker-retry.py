#!/usr/bin/env python3
"""Prove the Workers AI retry in services/tools/worker.py (queue item 29).

Why a real socket and not a mock: the thing being tested is *one more HTTP call*, so the
test counts the calls a server actually receives. A monkeypatched urlopen can only prove
the code called itself. This starts a scripted HTTP server, points CF_AI_BASE at it, and
counts what arrived.

Run:  python scripts/test-worker-retry.py
Exit: 0 when every case matches, 1 otherwise.
"""
from __future__ import annotations

import base64
import importlib.util
import io
import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location(
    "worker_under_test", os.path.join(ROOT, "services", "tools", "worker.py"))
worker = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(worker)

from PIL import Image  # noqa: E402  — after the worker import, same interpreter

TOKEN = "test-token-not-a-real-one"
MODEL = "@cf/black-forest-labs/flux-1-schnell"


def tiny_jpeg() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (200, 30, 90)).save(buf, "JPEG")
    return buf.getvalue()


JPEG = tiny_jpeg()
IMAGE_JSON = json.dumps({"result": {"image": base64.b64encode(JPEG).decode()}}).encode()


class Scripted(BaseHTTPRequestHandler):
    """Answers a scripted list of (status, content_type, body), one per request.

    The last entry repeats, so a 3rd request is answerable. `seen` is the evidence: the
    test asserts on how many calls arrived, not on what the client believed it did.
    """

    script: list[tuple[int, str, bytes]] = []
    seen: list[dict] = []
    delay = 0.0

    def do_POST(self):  # noqa: N802
        body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        Scripted.seen.append({
            "path": self.path,
            "body": body,
            "auth": self.headers.get("Authorization"),
        })
        idx = len(Scripted.seen) - 1
        if Scripted.delay:
            time.sleep(Scripted.delay)
        status, ctype, payload = Scripted.script[min(idx, len(Scripted.script) - 1)]
        try:
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # the client gave up on purpose (the deadline case)

    def log_message(self, *args):  # keep the output to the test's own table
        pass


def script(entries, delay=0.0):
    Scripted.script = entries
    Scripted.seen = []
    Scripted.delay = delay
    return Scripted.seen


results: list[tuple[bool, str, str]] = []


def check(name: str, ok: bool, detail: str):
    results.append((bool(ok), name, detail))


def main() -> int:
    srv = HTTPServer(("127.0.0.1", 0), Scripted)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    # The seam the helper was written with: the endpoint is a constant, so the call can be
    # pointed at this server without touching the code under test.
    worker.CF_AI_BASE = f"http://127.0.0.1:{port}/ai/run/{{model}}"
    worker.CF_AI_TOKEN_ENV = TOKEN

    # 1 — the measured case (item 20): a 400 off the edge, then a normal answer.
    seen = script([(400, "application/json", b'{"success":false,"errors":[{"code":10000}]}'),
                   (200, "application/json", IMAGE_JSON)])
    out, meta = worker.ai_image({"prompt": "a red kite over a field"})
    check("400 then 200 is recovered", meta["attempts"] == 2 and out == JPEG,
          f"attempts={meta['attempts']} bytes={meta['bytes']} calls={len(seen)}")
    check("the retry really made two calls", len(seen) == 2, f"calls={len(seen)}")
    check("the model name is in the URL", seen[0]["path"] == f"/ai/run/{MODEL}", seen[0]["path"])
    check("the token is sent", seen[0]["auth"] == "Bearer " + TOKEN, str(seen[0]["auth"]))
    check("the prompt is the body", json.loads(seen[0]["body"]) == {"prompt": "a red kite over a field"},
          seen[0]["body"].decode())

    # 2 — a 500, then a normal answer.
    seen = script([(500, "application/json", b'{"errors":[{"message":"internal"}]}'),
                   (200, "application/json", IMAGE_JSON)])
    _out, meta = worker.ai_image({"prompt": "x"})
    check("500 then 200 is recovered", meta["attempts"] == 2 and len(seen) == 2,
          f"attempts={meta['attempts']} calls={len(seen)}")

    # 3 — the happy path is untouched: exactly one call, attempts 1.
    seen = script([(200, "application/json", IMAGE_JSON)])
    _out, meta = worker.ai_image({"prompt": "x"})
    check("a working call is not retried", meta["attempts"] == 1 and len(seen) == 1,
          f"attempts={meta['attempts']} calls={len(seen)}")

    # 4 — 403 is an answer, not a hiccup: one call, and the sentence names the status.
    seen = script([(403, "application/json", b'{"errors":[{"message":"Model Agreement"}]}')])
    msg = ""
    try:
        worker.ai_image({"prompt": "x"})
    except RuntimeError as exc:
        msg = str(exc)
    check("403 is not retried", len(seen) == 1, f"calls={len(seen)}")
    check("403 is named in the error", "403" in msg and "after 1 attempt" in msg, msg[:120])

    # 5 — a persistent 500: two calls, then the error says so.
    seen = script([(500, "application/json", b'{"errors":[{"message":"internal"}]}')])
    msg = ""
    try:
        worker.ai_image({"prompt": "x"})
    except RuntimeError as exc:
        msg = str(exc)
    check("a real outage stops at two calls", len(seen) == 2, f"calls={len(seen)}")
    check("the error names the attempts", "after 2 attempts" in msg, msg[:160])

    # 6 — the translate contract is preserved: a non-retryable status still arrives as an
    #     HTTPError, because that chain reads the code to tell "pair refused" (400) from
    #     "server broke" (500). A RuntimeError here would turn a caller mistake into a 502.
    seen = script([(404, "application/json", b'{"errors":[{"message":"no such model"}]}')])
    kind = ""
    try:
        worker._cf_ai_json(MODEL, {"text": "hola"}, TOKEN)
    except Exception as exc:  # noqa: BLE001 — the type is the assertion
        kind = type(exc).__name__
    check("the translate chain still sees an HTTPError", kind == "HTTPError",
          f"{kind} after {len(seen)} call(s)")

    # 7 — the retry cannot double the time a job hangs: with 1s of budget and a server that
    #     takes 2s to answer, there is one call and no second one.
    seen = script([(200, "application/json", IMAGE_JSON)], delay=2.0)
    started = time.monotonic()
    msg = ""
    try:
        worker._cf_ai_run(MODEL, {"prompt": "x"}, TOKEN, timeout=1)
    except RuntimeError as exc:
        msg = str(exc)
    took = time.monotonic() - started
    check("no second call when the budget is spent", len(seen) == 1,
          f"calls={len(seen)} in {took:.2f}s")
    check("the deadline is reported", took < 2.5 and "after 1 attempt" in msg,
          f"{took:.2f}s — {msg[:90]}")

    srv.shutdown()

    failed = [r for r in results if not r[0]]
    for ok, name, detail in results:
        print(f"  {'ok  ' if ok else 'FAIL'} {name} — {detail}")
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
