"""Static server with SPA fallback, so expo-router deep links resolve.

`python -m http.server` 404s on /passport because the file does not exist; an
expo-router web export is a single page whose routes are resolved in the browser,
so every unknown path must return index.html.
"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = sys.argv[1]
PORT = int(sys.argv[2])

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()

    def log_message(self, *a):
        pass

ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
