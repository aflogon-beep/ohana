/* Caché para jugar sin conexión */
const V = 'ohana-v9';
const FILES = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/audio.js', 'js/map.js', 'js/fx.js', 'js/chest.js', 'js/puzzle.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/fredoka.woff2', 'fonts/nunito.woff2', 'fonts/caveat.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // red primero (para recibir cambios), caché si no hay conexión
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (e.request.url.startsWith(self.location.origin))) {
      const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
