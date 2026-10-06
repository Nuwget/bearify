#!/usr/bin/env python3
"""Servidor estático com suporte a byte-range (o Safari/iOS exige 206 p/ áudio)."""
import http.server
import os
import re
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()
        path = self.translate_path(self.path.split("?", 1)[0].split("#", 1)[0])
        if os.path.isdir(path) or not os.path.exists(path):
            return super().send_head()
        size = os.path.getsize(path)
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        if not m:
            return super().send_head()
        a, b = m.groups()
        start = int(a) if a else max(0, size - (int(b) if b else 0))
        end = int(b) if b else size - 1
        end = min(end, size - 1)
        if start >= size or start > end:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None
        ctype = self.guess_type(path)
        if self.command == "HEAD":
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(end - start + 1))
            self.end_headers()
            return None
        self.send_response(206)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        with open(path, "rb") as f:
            f.seek(start)
            self.wfile.write(f.read(end - start + 1))
        return None

    def log_message(self, *args):
        if self.path.startswith("/media/"):
            super().log_message(*args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
