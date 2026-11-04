// Service worker: red primero y caché como respaldo, para abrir la app y ver los últimos datos sin conexión.
const CACHE = "courtside-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/chat")) return;
  // Los archivos de /_next/static llevan hash en el nombre: nunca cambian, se sirven desde caché.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match("/"))));
});

// Alertas push de los equipos favoritos: el servidor manda { title, body, url, tag }.
self.addEventListener("push", (e) => {
  const d = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(d.title || "CourtSide", { body: d.body, tag: d.tag, data: { url: d.url || "/" }, icon: "/icon-192.png", badge: "/icon-192.png" }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    const w = ws.find((c) => new URL(c.url).origin === location.origin);
    return w ? w.focus().then(() => w.navigate(url)) : self.clients.openWindow(url);
  }));
});
