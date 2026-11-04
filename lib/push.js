import webpush from "web-push";
import { getScoreboard } from "./espn.js";
import { getDb, now, count } from "./db.js";

export const MAX_SUBS = 5000;

export function subscribe(sub, teams, notify) {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM push_subs WHERE endpoint = ?").get(sub.endpoint);
  if (!exists && db.prepare("SELECT COUNT(*) n FROM push_subs").get().n >= MAX_SUBS) return false;
  db.prepare(`INSERT INTO push_subs (endpoint, sub, teams, notify, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET sub = excluded.sub, teams = excluded.teams, notify = excluded.notify`)
    .run(sub.endpoint, JSON.stringify(sub), JSON.stringify(teams), JSON.stringify(notify), now());
  return true;
}
export function unsubscribe(endpoint) {
  getDb().prepare("DELETE FROM push_subs WHERE endpoint = ?").run(endpoint);
}

// "Q4 3:21" / "OT1 0:45" → { late: true, mins: 3 }
const clockOf = (clock = "") => {
  const m = clock.match(/^(Q(\d)|OT\d*) (\d+):/);
  return m ? { late: !m[2] || Number(m[2]) >= 4, mins: Number(m[3]) } : { late: false, mins: 99 };
};

// Compara el estado anterior de cada partido con el nuevo y devuelve las alertas que tocan.
// En la primera vuelta solo memoriza: al reiniciar el servidor no manda avisos atrasados.
export function alertsFor(prev, games) {
  const out = [];
  for (const g of games) {
    const p = prev[g.id];
    const s = { status: g.status, close: p?.close || false };
    const vs = `${g.away.tri} @ ${g.home.tri}`, score = `${g.away.tri} ${g.away.score} - ${g.home.score} ${g.home.tri}`;
    if (p && p.status === "scheduled" && g.status === "live") out.push({ kind: "start", g, title: `Empezó ${vs}`, body: "El partido ya está en juego." });
    if (p && p.status !== "final" && g.status === "final") out.push({ kind: "end", g, title: `Final: ${score}`, body: g.ot ? "Terminó en tiempo extra." : "Terminó el partido." });
    if (g.status === "live" && !s.close) {
      const c = clockOf(g.clock);
      if (c.late && c.mins < 5 && Math.abs(g.away.score - g.home.score) <= 5) {
        s.close = true;
        if (p) out.push({ kind: "close", g, title: `Partido cerrado: ${score}`, body: `${g.clock}. Se define al final.` });
      }
    }
    prev[g.id] = s;
  }
  return out;
}

async function send(alerts) {
  const rows = getDb().prepare("SELECT endpoint, sub, teams, notify FROM push_subs").all()
    .map((r) => ({ endpoint: r.endpoint, sub: JSON.parse(r.sub), teams: JSON.parse(r.teams), notify: JSON.parse(r.notify) }));
  await Promise.all(rows.flatMap((r) => alerts
    .filter((a) => r.notify[a.kind] && (r.teams.includes(a.g.away.tri) || r.teams.includes(a.g.home.tri)))
    .map((a) => webpush.sendNotification(r.sub, JSON.stringify({ title: a.title, body: a.body, url: `/partido/${a.g.id}`, tag: `${a.g.id}-${a.kind}` }), { TTL: 600 })
      .then(() => count("push_sent"))
      .catch((e) => {
        // 404/410: el navegador ya no tiene esa suscripción.
        if (e.statusCode === 404 || e.statusCode === 410) unsubscribe(r.endpoint);
        else console.error("push:", e.statusCode ?? "", e.message);
      }))));
}

// Día de la liga en hora del Este, como lo usa ESPN.
const etDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d).replaceAll("-", "");

export function start(every = 60000) {
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject = "mailto:admin@courtside.app" } = process.env;
  if (!pub || !priv) return console.log("push: sin VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY, alertas apagadas");
  webpush.setVapidDetails(subject, pub, priv);
  const prev = {};
  const tick = async () => {
    try {
      const now = Date.now();
      // Ayer también: los partidos de la noche terminan pasada la medianoche del Este.
      const days = [...new Set([etDay(new Date(now - 864e5)), etDay(new Date(now))])];
      const games = (await Promise.all(days.map(getScoreboard))).flat();
      const alerts = alertsFor(prev, games);
      if (alerts.length) await send(alerts);
    } catch (e) {
      console.error("push:", e.message);
    }
  };
  tick();
  setInterval(tick, every);
}
