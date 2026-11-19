/* Service worker : garde le carnet et les billets chiffrés pour les ouvrir sans connexion. */
const V = 'carnet-v2';
const BASE = ['./', 'index.html', 'css/style.css?v=4', 'js/data.js?v=4', 'js/app.js?v=4', 'manifest.webmanifest', 'icon.svg', 'data/meta.json', 'data/secret.enc'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'carnet-fichiers-v1').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(rep => { if (rep.ok) { const copie = rep.clone(); const nom = new URL(r.url).pathname.includes('/files/') ? 'carnet-fichiers-v1' : V; caches.open(nom).then(c => c.put(r, copie)); } return rep; })
      .catch(() => caches.match(r, { ignoreSearch: false }).then(m => m || caches.match(r, { ignoreSearch: true })))
  );
});
