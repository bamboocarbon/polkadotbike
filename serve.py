#!/usr/bin/env python3
"""No-cache dev server for Polka Dot Bike. Run from ~/cycle gears/"""
import http.server, socketserver

PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()
    def log_message(self, fmt, *args):
        pass  # silence request logs

socketserver.TCPServer.allow_reuse_address = True

print(f'Serving on http://localhost:{PORT}  (Ctrl+C to stop)')
with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    httpd.serve_forever()

