// Service worker: la app abre aunque no haya señal (el Excel de OneDrive sí necesita internet).
const CACHE = 'vin-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
const LIB_HOSTS = ['cdn.jsdelivr.net', 'alcdn.msauth.net'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) {
    // la app: red primero (para recibir actualizaciones), caché si no hay señal
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else if (LIB_HOSTS.includes(u.hostname)) {
    // librerías con versión fija: caché primero
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res;
    })));
  }
});
