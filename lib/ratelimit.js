// Ventana fija en memoria: { key → [inicio, cuenta] }.
// shortcut: vive en un solo proceso y se pierde al reiniciar; si se corre más de una réplica, pasar a Redis.
export function limiter(max, windowMs) {
  const hits = new Map();
  return (key, now = Date.now()) => {
    const h = hits.get(key);
    if (!h || now - h[0] >= windowMs) {
      if (hits.size > 10000) hits.clear();
      hits.set(key, [now, 1]);
      return { ok: true, retry: 0 };
    }
    if (h[1] >= max) return { ok: false, retry: Math.ceil((h[0] + windowMs - now) / 1000) };
    h[1]++;
    return { ok: true, retry: 0 };
  };
}

// Solo pedidos desde la propia app: el navegador manda Origin en los POST.
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return !origin || origin.replace(/^https?:\/\//, "") === host;
}
