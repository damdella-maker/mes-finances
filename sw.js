/* Mes finances · service worker
   - met en cache la coquille (HTML, icônes, manifest) pour ouvrir l'appli hors ligne
   - data.enc (données CHIFFRÉES) : réseau d'abord, copie chiffrée en secours hors ligne
   - aucune donnée déchiffrée n'est jamais mise en cache */
const VERSION = 'mf-v7';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req.url, { cache: 'no-cache' });
      if (res && res.ok) cache.put(url.pathname.endsWith('data.enc') ? './data.enc' : req, res.clone());
      return res;
    } catch (err) {
      const hit = (await cache.match(url.pathname.endsWith('data.enc') ? './data.enc' : req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
