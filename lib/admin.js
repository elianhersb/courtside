import { getDb, now } from "./db.js";

const DAY = 864e5;
const days = (n) => Array.from({ length: n }, (_, i) => new Date(now() - (n - 1 - i) * DAY).toISOString().slice(0, 10));

// Todas las cifras del panel en una consulta por bloque.
export function stats() {
  const db = getDb(), t = now();
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const n = (sql, ...a) => Object.values(one(sql, ...a))[0];
  const last30 = days(30);
  const counters = db.prepare("SELECT day, kind, n FROM counters WHERE day >= ?").all(last30[0]);
  const series = (kind) => last30.map((d) => ({ day: d, n: counters.find((c) => c.day === d && c.kind === kind)?.n || 0 }));
  const sum = (kind, from) => counters.filter((c) => c.kind === kind && c.day >= from).reduce((s, c) => s + c.n, 0);

  // Equipos más seguidos: favoritos de las cuentas y de las alertas.
  const teams = {};
  for (const r of db.prepare("SELECT prefs FROM users WHERE prefs IS NOT NULL").all()) { try { for (const tri of JSON.parse(r.prefs).favs || []) teams[tri] = (teams[tri] || 0) + 1; } catch {} }
  for (const r of db.prepare("SELECT teams FROM push_subs").all()) for (const tri of JSON.parse(r.teams)) teams[tri] = (teams[tri] || 0) + 1;

  return {
    devices: {
      total: n("SELECT COUNT(*) FROM devices"),
      installed: n("SELECT COUNT(*) FROM devices WHERE installed_at IS NOT NULL"),
      active1: n("SELECT COUNT(*) FROM devices WHERE last_seen > ?", t - DAY),
      active7: n("SELECT COUNT(*) FROM devices WHERE last_seen > ?", t - 7 * DAY),
      active30: n("SELECT COUNT(*) FROM devices WHERE last_seen > ?", t - 30 * DAY),
      platforms: db.prepare("SELECT platform, COUNT(*) n, SUM(installed_at IS NOT NULL) installed FROM devices GROUP BY platform ORDER BY n DESC").all(),
    },
    users: {
      total: n("SELECT COUNT(*) FROM users"),
      verified: n("SELECT COUNT(*) FROM users WHERE email_verified = 1"),
      google: n("SELECT COUNT(*) FROM users WHERE google_sub IS NOT NULL"),
      new7: n("SELECT COUNT(*) FROM users WHERE created_at > ?", t - 7 * DAY),
      admins: n("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
    },
    push: { subs: n("SELECT COUNT(*) FROM push_subs"), sent7: sum("push_sent", last30[23]) },
    chat: { today: sum("chat", last30[29]), last7: sum("chat", last30[23]), last30: sum("chat", last30[0]) },
    series: { devices: series("device_new"), installs: series("install"), chat: series("chat"), signups: series("signup") },
    teams: Object.entries(teams).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tri, n]) => ({ tri, n })),
  };
}

export function listUsers(q = "", page = 0) {
  const like = `%${q.trim()}%`;
  return getDb().prepare(`SELECT id, email, name, role, disabled, email_verified verified, google_sub IS NOT NULL google, password_hash IS NOT NULL password, created_at, last_login_at
    FROM users WHERE email LIKE ? OR name LIKE ? ORDER BY created_at DESC LIMIT 50 OFFSET ?`).all(like, like, page * 50)
    .map((u) => ({ ...u, disabled: !!u.disabled, verified: !!u.verified, google: !!u.google, password: !!u.password }));
}
