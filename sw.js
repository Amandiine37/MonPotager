/* Service worker — permet d'utiliser l'application hors connexion */

const CACHE = "potager-v1.1";

const FICHIERS = [
  "index.html",
  "styles.css",
  "app.js",
  "planning.js",
  "vues.js",
  "data-legumes.js",
  "data-aromatiques.js",
  "data-medicinales.js",
  "data-permaculture.js",
  "data-nouveautes.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FICHIERS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(c => c !== CACHE).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(reponse => {
        const copie = reponse.clone();
        caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => {});
        return reponse;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
