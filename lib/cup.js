import { get, normalizeEvent } from "./espn.js";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

// ESPN no publica los grupos: se cargan por temporada (sorteo oficial de la NBA).
// shortcut: hay que agregar los grupos de cada temporada nueva aquí, al salir el sorteo (julio).
export const SEASON = {
  year: 2026,
  from: "2026-10-30", // primer día de fase de grupos
  to: "2026-12-11", // final
  finalVenue: "Hinkle Fieldhouse · Indianápolis",
  groups: {
    East: { A: ["DET", "TOR", "ORL", "MIL", "BKN"], B: ["NYK", "CLE", "PHI", "MIA", "IND"], C: ["BOS", "ATL", "CHA", "CHI", "WAS"] },
    West: { A: ["DEN", "HOU", "PHX", "DAL", "UTA"], B: ["OKC", "MIN", "LAC", "NOP", "MEM"], C: ["SAS", "LAL", "POR", "GSW", "SAC"] },
  },
};

const ROUND = { "NBA Cup - Group Play": "group", "NBA Cup - Quarterfinals": "qf", "NBA Cup - Semifinals": "sf", "NBA Cup Championship": "final" };

// Ordena con el desempate oficial: victorias, duelo directo (empate de dos), diferencia de puntos y puntos a favor.
function rank(rows, games) {
  const h2h = (a, b) => {
    const g = games.find((x) => x.status === "final" && [x.away.tri, x.home.tri].includes(a.tri) && [x.away.tri, x.home.tri].includes(b.tri));
    return g ? (g.winner === a.tri ? -1 : 1) : 0;
  };
  return rows.sort((a, b) => {
    if (b.w !== a.w) return b.w - a.w;
    const tied = rows.filter((r) => r.w === a.w).length === 2;
    return (tied && h2h(a, b)) || b.diff - a.diff || b.pf - a.pf;
  });
}

export function standings(games) {
  const groupOf = {};
  for (const [conf, gs] of Object.entries(SEASON.groups)) for (const [g, teams] of Object.entries(gs)) for (const t of teams) groupOf[t] = `${conf}-${g}`;
  const row = (tri) => ({ tri, w: 0, l: 0, pf: 0, pa: 0, diff: 0, played: 0 });
  const rows = Object.fromEntries(Object.keys(groupOf).map((t) => [t, row(t)]));
  const group = games.filter((g) => g.round === "group");
  for (const g of group.filter((x) => x.status === "final")) {
    for (const [me, op] of [[g.away, g.home], [g.home, g.away]]) {
      const r = rows[me.tri];
      if (!r) continue;
      r.played++; r.pf += me.score; r.pa += op.score; r.diff = r.pf - r.pa;
      if (g.winner === me.tri) r.w++; else r.l++;
    }
  }
  const groups = [], seeds = {};
  for (const [conf, gs] of Object.entries(SEASON.groups)) {
    const list = Object.entries(gs).map(([name, teams]) => ({ conf, name, rows: rank(teams.map((t) => rows[t]), group) }));
    const winners = rank(list.map((x) => x.rows[0]), []);
    const wild = rank(list.map((x) => x.rows[1]), []);
    winners.forEach((r) => (r.badge = "leader"));
    wild[0].badge = "wildcard";
    seeds[conf] = [...winners, wild[0]].map((r) => r.tri);
    groups.push(...list.map((x) => ({ ...x, done: x.rows.every((r) => r.played === 4) })));
  }
  return { groups, seeds, wildcards: Object.fromEntries(Object.keys(SEASON.groups).map((c) => [c, rank(groups.filter((g) => g.conf === c).map((g) => g.rows[1]), [])])) };
}

// Llave: cuartos 1-4 y 2-3 por conferencia; si ESPN ya tiene el partido real, manda el partido real.
export function bracket(games, seeds, projected) {
  const find = (round, a, b) => games.find((g) => g.round === round && (!a || [g.away.tri, g.home.tri].includes(a)) && (!b || [g.away.tri, g.home.tri].includes(b)));
  const match = (round, a, b, seedOf) => {
    const g = a && b ? find(round, a, b) : null;
    const side = (t) => (t ? { tri: t, seed: seedOf?.[t], score: g ? (g.away.tri === t ? g.away : g.home).score : undefined } : null);
    return { a: side(a), b: side(b), id: g?.id, date: g?.date, status: g?.status || "tbd", clock: g?.clock, winner: g?.winner, projected: projected && round === "qf" };
  };
  const conf = {};
  for (const [c, s] of Object.entries(seeds)) {
    const seedOf = Object.fromEntries(s.map((t, i) => [t, i + 1]));
    const qf = [match("qf", s[0], s[3], seedOf), match("qf", s[1], s[2], seedOf)];
    const sf = match("sf", qf[0].winner, qf[1].winner, seedOf);
    conf[c] = { qf, sf };
  }
  const final = match("final", conf.East.sf.winner, conf.West.sf.winner);
  return { ...conf, final, champion: final.winner || null };
}

const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");

export async function getCup(now = new Date()) {
  const days = [];
  for (let d = new Date(`${SEASON.from}T12:00:00Z`); d <= new Date(`${SEASON.to}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) days.push(new Date(d));
  // Los días viejos casi no cambian: se cachean más tiempo que hoy y ayer.
  const boards = await Promise.all(days.map((d) => get(`${SITE}/scoreboard?dates=${ymd(d)}`, now - d > 2 * 86400e3 ? 3600 : 30).catch(() => ({ events: [] }))));
  const games = boards.flatMap((b) => b.events || []).flatMap((e) => {
    const round = ROUND[e.competitions[0].notes?.[0]?.headline];
    return round ? [{ ...normalizeEvent(e), round }] : [];
  });
  const st = standings(games);
  const groupsDone = st.groups.every((g) => g.done);
  const b = bracket(games, st.seeds, !groupsDone);
  const phase = b.champion ? "done" : groupsDone || games.some((g) => g.round !== "group" && g.status !== "scheduled") ? "knockout" : "groups";
  const upcoming = games.filter((g) => g.status !== "final").sort((x, y) => x.date.localeCompare(y.date)).slice(0, 6);
  return { year: SEASON.year, finalDate: SEASON.to, finalVenue: SEASON.finalVenue, phase, groups: st.groups, wildcards: st.wildcards, bracket: b, upcoming };
}
