const CACHE = 'attendance-v2';
const SHELL = ['./', './index.html', './manifest.json', './logo.png', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});

// App shell: network first, cache fallback. Firebase/ipify calls pass straight through.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : clients.openWindow('./index.html')));
});

// Optional true-push hook (needs FCM + a sender, see setup guide)
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'Attendance reminder', body: 'Your shift is starting soon.' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, tag: 'shift' }));
});
