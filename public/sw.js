// BODYUP — service worker (PWA installable + notifications locales)
const CACHE = "bodyup-v1";

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

// Handler fetch minimal (requis pour l'installabilité). Réseau, sans interférer.
self.addEventListener("fetch", () => {});

// Push serveur (VAPID) : notification reçue MÊME APP FERMÉE (messages entre proches).
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* payload vide */ }
  e.waitUntil(self.registration.showNotification(d.title || "BODYUP", {
    body: d.body || "",
    icon: "/bodyup/icon-192.png",
    badge: "/bodyup/icon-192.png",
    tag: d.tag || "bodyup",
    renotify: true,
  }));
});

// Affiche une notification demandée par la page (rappels locaux).
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "notify" && self.registration.showNotification) {
    self.registration.showNotification(d.title || "BODYUP", {
      body: d.body || "",
      icon: "/bodyup/icon-192.png",
      badge: "/bodyup/icon-192.png",
      tag: d.tag || "bodyup",
      renotify: true,
    });
  }
});

// Clic sur une notification : focus l'app ou l'ouvre.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cls) => {
    for (const c of cls) if ("focus" in c) return c.focus();
    if (self.clients.openWindow) return self.clients.openWindow("/bodyup/");
  }));
});
