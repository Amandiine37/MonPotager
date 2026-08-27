/* Service worker — permet d'utiliser l'application hors connexion.

   À chaque livraison : incrémenter VERSION ici ET les ?v=… dans index.html.
   C'est ce qui garantit que le navigateur retélécharge bien tous les fichiers
   au lieu d'en garder d'anciens, ce qui donne des nouveautés qui « ne marchent pas ». */

const VERSION = "1.5";
const CACHE = "potager-v" + VERSION;

const FICHIERS = [
  "index.html",
  "styles.css?v=" + VERSION,
  "app.js?v=" + VERSION,
  "planning.js?v=" + VERSION,
  "meteo.js?v=" + VERSION,
  "autonomie.js?v=" + VERSION,
  "sauvegarde.js?v=" + VERSION,
  "vues.js?v=" + VERSION,
  "data-legumes.js?v=" + VERSION,
  "data-aromatiques.js?v=" + VERSION,
  "data-medicinales.js?v=" + VERSION,
  "data-permaculture.js?v=" + VERSION,
  "data-besoins.js?v=" + VERSION,
  "data-nouveautes.js?v=" + VERSION,
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
  // Les appels au service météo ne sont jamais mis en cache :
  // on veut des prévisions fraîches, et rien d'externe dans le cache.
  if (new URL(e.request.url).origin !== self.location.origin) return;
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
