"""Kleiner lokaler Dienst für figuren-render.html: nimmt PNGs an und legt sie in assets/figuren/ ab.
Start: py tools/speicherdienst.py   (lauscht nur auf localhost:8766)
"""
import os
import re
from http.server import BaseHTTPRequestHandler, HTTPServer

ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'figuren')


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:8765')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        name = self.path.strip('/')
        if not re.fullmatch(r'[a-z_]+\.png', name):
            self.send_response(400); self._cors(); self.end_headers(); return
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        os.makedirs(ZIEL, exist_ok=True)
        with open(os.path.join(ZIEL, name), 'wb') as f:
            f.write(data)
        self.send_response(200); self._cors(); self.end_headers()
        self.wfile.write(b'ok')


if __name__ == '__main__':
    HTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
