import { get, normalizeEvent, tri } from "./espn.js";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const WEB = "https://site.web.api.espn.com/apis/v2/sports/basketball/nba";
const CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";
const CONFS = ["East", "West"];

// Marca de ESPN → estado en la tabla.
const CLINCH = { z: "in", y: "in", x: "in", "*": "in", xp: "playin", pb: "playin", e: "out" };

export function normalizeStandings(d) {
  const out = {};
  for (const c of d.children || []) {
    const conf = c.abbreviation === "West" ? "West" : "East";
    out[conf] = (c.standings?.entries || []).map((e) => {
      const s = Object.fromEntries(e.stats.map((x) => [x.name, x]));
      const v = (k) => s[k]?.value, dv = (k) => s[k]?.displayValue;
      return {
        tri: tri(e.team.abbreviation), seed: v("playoffSeed"), w: v("wins"), l: v("losses"), pct: dv("winPercent"),
        gb: dv("gamesBehind"), streak: dv("streak"), l10: dv("Last Ten Games"), home: dv("Home"), road: dv("Road"),
        diff: v("pointDifferential"), clinch: CLINCH[dv("clincher")] || null,
      };
    }).sort((a, b) => a.seed - b.seed);
  }
  return out;
}

// "East 1st Round - Game 3" → { conf: "East", round: "r1" }; "NBA Play-In - West - 8th Seed Game" → { conf: "West", round: "pi8" }
export function roundOf(headline = "") {
  const pi = headline.match(/^NBA Play-In - (East|West) - (7th Place|9th Place|8th Seed)/);
  if (pi) return { conf: pi[1], round: { "7th Place": "pi78", "9th Place": "pi910", "8th Seed": "pi8" }[pi[2]] };
  if (/^NBA Finals/.test(headline)) return { conf: null, round: "finals" };
  const m = headline.match(/^(East|West) (1st Round|Semifinals|Finals)/);
  return m ? { conf: m[1], round: { "1st Round": "r1", Semifinals: "sf", Finals: "cf" }[m[2]] } : null;
}

const pair = (g) => [g.away.tri, g.home.tri].sort().join("-");

// Une los partidos de una ronda en series (al mejor de 7) por pareja de equipos.
export function seriesOf(games) {
  const by = {};
  for (const g of games) (by[`${g.round}:${pair(g)}`] ||= []).push(g);
  return Object.values(by).map((gs) => {
    gs.sort((x, y) => x.date.localeCompare(y.date));
    const [a, b] = pair(gs[0]).split("-");
    const wins = { [a]: 0, [b]: 0 };
    for (const g of gs) if (g.winner) wins[g.winner]++;
    const winner = wins[a] === 4 ? a : wins[b] === 4 ? b : null;
    const live = gs.find((g) => g.status === "live");
    const next = gs.find((g) => g.status === "scheduled");
    return { round: gs[0].round, conf: gs[0].conf, teams: [a, b], wins, winner, games: gs, live: live || null, next: winner ? null : next || null };
  });
}

// Llave de playoffs: con las series reales cuando existen; si no, la proyección desde la tabla (1-8, 4-5, 3-6, 2-7).
export function playoffBracket(standings, series, playin = {}) {
  const side = (t, seedOf, wins) => (t ? { tri: t, seed: seedOf[t], wins: wins?.[t] } : null);
  const make = (teams, real, seedOf, projected) => {
    const s = real || null;
    const [a, b] = s ? [...s.teams].sort((x, y) => (seedOf[x] || 99) - (seedOf[y] || 99)) : teams;
    return {
      a: side(a, seedOf, s?.wins), b: side(b, seedOf, s?.wins), winner: s?.winner || null, projected: !s && projected,
      status: !s ? "tbd" : s.winner ? "final" : s.live ? "live" : "active",
      live: s?.live || null, next: s?.next || null, games: s?.games || [],
    };
  };
  const find = (round, conf, candidates) => series.find((s) => s.round === round && (!conf || s.conf === conf) && s.teams.some((t) => candidates.includes(t)));
  const out = {};
  for (const conf of CONFS) {
    const rows = standings[conf] || [];
    const seedOf = Object.fromEntries(rows.map((r) => [r.tri, r.seed]));
    // Los puestos 7 y 8 salen del play-in cuando ya se jugó.
    const s7 = playin[conf]?.a?.winner || rows[6]?.tri, s8 = playin[conf]?.c?.winner || rows[7]?.tri;
    if (playin[conf]?.a?.winner) { seedOf[s7] = 7; if (playin[conf]?.c?.winner) seedOf[s8] = 8; }
    const seeds = [rows[0]?.tri, rows[1]?.tri, rows[2]?.tri, rows[3]?.tri, rows[4]?.tri, rows[5]?.tri, s7, s8];
    const projected = !series.some((s) => s.conf === conf);
    const r1 = [[0, 7], [3, 4], [2, 5], [1, 6]].map(([i, j]) => make([seeds[i], seeds[j]], find("r1", conf, [seeds[i], seeds[j]]), seedOf, projected));
    const sf = [[r1[0], r1[1]], [r1[2], r1[3]]].map(([x, y]) => {
      const pool = [x.a, x.b, y.a, y.b].filter(Boolean).map((t) => t.tri);
      return make([x.winner, y.winner], find("sf", conf, pool), seedOf, false);
    });
    const pool = sf.flatMap((x) => [x.a, x.b]).filter(Boolean).map((t) => t.tri).concat(r1.flatMap((x) => [x.a?.tri, x.b?.tri]));
    const cf = make([sf[0].winner, sf[1].winner], find("cf", conf, pool), seedOf, false);
    out[conf] = { r1, sf, cf };
  }
  const seedOf = Object.fromEntries(CONFS.flatMap((c) => (standings[c] || []).map((r) => [r.tri, r.seed])));
  const finals = make([out.West.cf.winner, out.East.cf.winner], series.find((s) => s.round === "finals"), seedOf, false);
  return { ...out, finals, champion: finals.winner };
}

// Play-in por conferencia: 7-8 (a), 9-10 (b) y el partido por el 8.º puesto (c) entre el perdedor de a y el ganador de b.
export function playIn(standings, games) {
  const out = {};
  for (const conf of CONFS) {
    const rows = standings[conf] || [];
    const g = (round) => games.find((x) => x.round === round && x.conf === conf);
    const m = (round, a, b) => {
      const x = g(round);
      if (x) { const [h, l] = [x.home, x.away]; return { a: { tri: h.tri, score: h.score }, b: { tri: l.tri, score: l.score }, id: x.id, date: x.date, status: x.status, clock: x.clock, winner: x.winner || null }; }
      return { a: a ? { tri: a } : null, b: b ? { tri: b } : null, status: "tbd", projected: !!(a && b), winner: null };
    };
    const a = m("pi78", rows[6]?.tri, rows[7]?.tri), b = m("pi910", rows[8]?.tri, rows[9]?.tri);
    const loserA = a.winner && [a.a, a.b].find((t) => t.tri !== a.winner)?.tri;
    out[conf] = { a, b, c: m("pi8", loserA, b.winner) };
  }
  return out;
}

const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
// La temporada 2026-27 es "2027" para ESPN; arranca en octubre.
export const currentSeason = (now = new Date()) => (now.getUTCMonth() >= 9 ? now.getUTCFullYear() + 1 : now.getUTCFullYear());

export async function getSeason(year = currentSeason(), now = new Date()) {
  const [st, pi, po] = await Promise.all([
    get(`${WEB}/standings?level=2&season=${year}`, 300),
    get(`${CORE}/seasons/${year}/types/5`, 86400),
    get(`${CORE}/seasons/${year}/types/3`, 86400),
  ]);
  const standings = normalizeStandings(st);
  let games = [];
  const from = new Date(pi.startDate), to = new Date(Math.min(new Date(po.endDate), now.getTime() + 7 * 86400e3));
  if (now >= from) {
    const days = [];
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) days.push(new Date(d));
    const boards = await Promise.all(days.map((d) => get(`${SITE}/scoreboard?dates=${ymd(d)}`, now - d > 2 * 86400e3 ? 3600 : 30).catch(() => ({ events: [] }))));
    games = boards.flatMap((b) => b.events || []).flatMap((e) => {
      const r = roundOf(e.competitions[0].notes?.[0]?.headline);
      return r ? [{ ...normalizeEvent(e), ...r }] : [];
    });
  }
  const playin = playIn(standings, games);
  const series = seriesOf(games.filter((g) => !g.round.startsWith("pi")));
  const bracket = playoffBracket(standings, series, playin);
  const phase = bracket.champion ? "done" : series.length ? "playoffs" : games.length ? "playin" : "regular";
  return { year, label: `${year - 1}-${String(year).slice(2)}`, phase, standings, playin, bracket };
}
