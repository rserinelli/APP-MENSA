// Service worker: permette di aprire l'app anche senza connessione.
// Strategia: prima la rete (sempre con controllo di versione, cosi' i menu aggiornati
// arrivano subito e i file non si mescolano), poi la copia salvata se manca la connessione.
// menu-data.js e' letto anche qui, per salvare in anticipo le immagini messe nella cartella "immagini"
try { importScripts('menu-data.js'); } catch (err) { /* non bloccante */ }
const CACHE = 'menu-mensa-v8';
const FILE = ['./', 'index.html', 'style.css', 'app.js', 'menu-data.js',
              'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
              'icons/favicon-48.png', 'img/barbarigo.png', 'icons/apple-touch-icon.png'];

// Immagini locali indicate in menu-data.js (quelle con un link http restano esterne)
function immaginiLocali() {
  const m = self.MENU || {};
  const lista = Object.values(m.iconeWeekend || {}).concat((m.chiusure || []).map(c => c.immagine));
  return lista.filter(x => x && !/^(https?:)?\/\//i.test(x));
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILE.map(f =>
        fetch(new Request(f, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(f); return c.put(f, r); })
      )))
      // le immagini locali si salvano senza far fallire l'installazione se un file manca
      .then(() => caches.open(CACHE).then(c => Promise.all(immaginiLocali().map(f =>
        fetch(new Request(f, { cache: 'reload' })).then(r => r.ok ? c.put(f, r) : null).catch(() => null)
      ))))
      .then(() => self.skipWaiting())
  );
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

  // File dell'app: rete con controllo di versione, altrimenti copia salvata
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
