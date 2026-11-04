import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import webpush from "web-push";
import { getScoreboard } from "./espn.js";

// Suscripciones en un JSON: { [endpoint]: { sub, teams: ["LAL"], notify: { start, end, close } } }.
// shortcut: un archivo en disco, para una sola réplica; con más usuarios o réplicas, pasar a una base de datos.
const FILE = path.join(process.env.DATA_DIR || ".data", "push.json");
export const MAX_SUBS = 5000;
let subs = null;

async function load() {
  if (subs) return subs;
  try { subs = JSON.parse(await readFile(FILE, "utf8")); } catch { subs = {}; }
  return subs;
}
async function save() {
  await mkdir(path.dirname(FILE), { recursive: true });
  // Escribe a un temporal y renombra: si el proceso muere a mitad, el archivo anterior queda entero.
  await writeFile(`${FILE}.tmp`, JSON.stringify(subs));
  await rename(`${FILE}.tmp`, FILE);
}

export async function subscribe(sub, teams, notify) {
  const all = await load();
  if (!all[sub.endpoint] && Object.keys(all).length >= MAX_SUBS) return false;
  all[sub.endpoint] = { sub, teams, notify };
  await save();
  return true;
}
export async function unsubscribe(endpoint) {
  const all = await load();
  if (all[endpoint]) { delete all[endpoint]; await save(); }
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
  const all = await load();
  let changed = false;
  await Promise.all(Object.entries(all).flatMap(([endpoint, r]) => alerts
    .filter((a) => r.notify?.[a.kind] && (r.teams.includes(a.g.away.tri) || r.teams.includes(a.g.home.tri)))
    .map((a) => webpush.sendNotification(r.sub, JSON.stringify({ title: a.title, body: a.body, url: `/partido/${a.g.id}`, tag: `${a.g.id}-${a.kind}` }), { TTL: 600 })
      .catch((e) => {
        // 404/410: el navegador ya no tiene esa suscripción.
        if (e.statusCode === 404 || e.statusCode === 410) { delete all[endpoint]; changed = true; }
        else console.error("push:", e.statusCode ?? "", e.message);
      }))));
  if (changed) await save();
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
