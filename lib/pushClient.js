"use client";
// Suscripción a las alertas desde el navegador; el servidor guarda equipos y tipos de aviso.
export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const send = (method, body) => fetch("/api/push", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  .then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Error ${r.status}`); });
const save = (sub, prefs) => send("POST", { subscription: sub.toJSON(), teams: prefs.favs, notify: prefs.notify });
const current = async () => (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
// La clave VAPID viene en base64url; Safari pide los bytes.
const bytes = (b64) => Uint8Array.from(atob(b64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export async function enablePush(prefs) {
  if (await Notification.requestPermission() !== "granted") throw new Error("El navegador no dio permiso para notificaciones");
  const r = await fetch("/api/push");
  const { key, error } = await r.json();
  if (!key) throw new Error(error || "Las alertas no están disponibles");
  await navigator.serviceWorker.register("/sw.js");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(key) }));
  await save(sub, prefs);
}

export async function syncPush(prefs) {
  const sub = await current();
  if (sub) await save(sub, prefs);
}

export async function disablePush() {
  const sub = await current();
  if (!sub) return;
  await send("DELETE", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
}
