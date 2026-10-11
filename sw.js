// Service worker: permette di aprire l'app anche senza connessione.
// Strategia: prima la rete (cosi' i menu aggiornati arrivano subito), poi la copia salvata.
const CACHE = 'menu-mensa-v3';
const FILE = ['./', 'index.html', 'style.css', 'app.js', 'menu-data.js',
              'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chiavi => Promise.all(chiavi.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Font di Google: dalla copia salvata, aggiornata in background
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const salvata = await c.match(req);
        const rete = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => salvata);
        return salvata || rete;
      })
    );
    return;
  }

  // Immagini esterne (weekend, Natale, Pasqua): copia salvata, aggiornata in background
  if (url.origin !== location.origin) {
    if (req.destination === 'image') {
      e.respondWith(
        caches.open(CACHE).then(async c => {
          const salvata = await c.match(req);
          const rete = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => salvata);
          return salvata || rete;
        })
      );
    }
    return;
  }

  e.respondWith(
    fetch(req)
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
