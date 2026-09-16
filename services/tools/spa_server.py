"""Static server with SPA fallback and an /api pass-through.

Two jobs, both learned the hard way.

**SPA fallback.** `python -m http.server` 404s on /passport because the file does
not exist; an expo-router web export is a single page whose routes are resolved in
the browser, so every unknown path must return index.html.

**/api pass-through.** The app posts its jobs to a *relative* `/api/job` on web
(`lib/tools.ts`: on web the page and the route share an origin). That is true on
the marketplace site, but this preview is served from its own host — expo.dropby.co.in
— where a static file server answers every POST with `501 Unsupported method`. So
the passport photo maker and the PDF toolkit looked broken in the browser build
while the engine behind them was perfectly healthy: the request never left the
static server. Forwarding /api/* to the real Next app (127.0.0.1:8080) makes the
call same-origin for the phone, which also means no CORS and no app rebuild.

Run: python spa_server.py <dist-dir> <port> [api-target]   (api-target defaults to 127.0.0.1:8080)
"""
import http.client
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = sys.argv[1]
PORT = int(sys.argv[2])
API_TARGET = sys.argv[3] if len(sys.argv) > 3 else "127.0.0.1:8080"
API_PREFIX = "/api/"

# A passport job loads a ~350 MB segmentation model on its first call, so the
# proxy waits like the phone does rather than cutting a slow-but-working job off.
API_TIMEOUT = float(os.environ.get("API_TIMEOUT", "300"))
HOP_HEADERS = {"host", "connection", "transfer-encoding", "content-length", "keep-alive"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    # --- /api -> the Next app -------------------------------------------------
    def _read_chunked(self) -> bytes:
        chunks = []
        while True:
            line = self.rfile.readline().strip()
            try:
                size = int(line.split(b";")[0], 16)
            except ValueError:
                break
            if size == 0:
                self.rfile.readline()
                break
            chunks.append(self.rfile.read(size))
            self.rfile.readline()
        return b"".join(chunks)

    def _proxy(self, method: str):
        body = None
        if method not in ("GET", "HEAD"):
            length = self.headers.get("Content-Length")
            if length:
                body = self.rfile.read(int(length))
            elif self.headers.get("Transfer-Encoding", "").lower() == "chunked":
                body = self._read_chunked()
        headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP_HEADERS}
        # The origin the app talks to must be the origin the API sees, or a
        # host-checking route would reject a request that is perfectly local.
        headers["X-Forwarded-Host"] = self.headers.get("Host", "")
        headers["X-Forwarded-Proto"] = "https"
        conn = http.client.HTTPConnection(API_TARGET, timeout=API_TIMEOUT)
        try:
            conn.request(method, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            data = b"" if method == "HEAD" else resp.read()
            status, hdrs = resp.status, resp.getheaders()
        except Exception as e:  # the API being down is a 502, not a stack trace
            msg = f'{{"error":"api unreachable: {type(e).__name__}"}}'.encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return
        finally:
            conn.close()

        self.send_response(status)
        for k, v in hdrs:
            if k.lower() in HOP_HEADERS:
                continue
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if data:
            self.wfile.write(data)

    # --- static ---------------------------------------------------------------
    def send_head(self):
        if self.path.split("?")[0].startswith(API_PREFIX):
            return None
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()

    def do_GET(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("GET")
        super().do_GET()

    def do_HEAD(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("HEAD")
        super().do_HEAD()

    def do_POST(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("POST")
        self.send_error(501, "Unsupported method")

    def do_PUT(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("PUT")
        self.send_error(501, "Unsupported method")

    def do_PATCH(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("PATCH")
        self.send_error(501, "Unsupported method")

    def do_DELETE(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("DELETE")
        self.send_error(501, "Unsupported method")

    def do_OPTIONS(self):  # noqa: N802
        if self.path.startswith(API_PREFIX):
            return self._proxy("OPTIONS")
        self.send_error(501, "Unsupported method")

    def log_message(self, *a):
        pass


ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
