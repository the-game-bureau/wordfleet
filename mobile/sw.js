/* Word Fleet service worker: the whole game works offline once loaded. */
var CACHE = 'wordfleet-v9';
var SHELL = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  '../dictionaries/languages.json',
  '../dictionaries/en-US.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Network first so updates land right away; fall back to cache when offline.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var mine = url.origin === location.origin;
  var fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!mine && !fonts) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok || res.type === 'opaque') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
        return hit || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error());
      });
    })
  );
});
