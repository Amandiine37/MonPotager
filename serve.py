"""Petit serveur local pour tester l'app (usage developpement uniquement).

Lancer avec :  python serve.py     puis ouvrir  http://localhost:4176
"""
import functools
import http.server
import os

PORT = 4176
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 annonce la taille des fichiers a l'avance : sans cela, sous
    # Windows, le navigateur recoit parfois un fichier tronque et l'appli
    # ne demarre pas.
    protocol_version = "HTTP/1.1"

    def guess_type(self, path):
        if path == "/" or path.endswith(".html"):
            return "text/html; charset=utf-8"
        if path.endswith(".js"):
            return "text/javascript; charset=utf-8"
        if path.endswith(".css"):
            return "text/css; charset=utf-8"
        if path.endswith(".webmanifest"):
            return "application/manifest+json; charset=utf-8"
        return super().guess_type(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


Handler = functools.partial(Handler, directory=DIRECTORY)

with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
    httpd.daemon_threads = True
    print("Mon Potager -> http://localhost:%d" % PORT)
    httpd.serve_forever()
