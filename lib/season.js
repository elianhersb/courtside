import { get, normalizeEvent, tri } from "./espn.js";

const pair = (g) => [g.away.tri, g.home.tri].sort().join("-");
// Desde 1984 juegan 16 equipos con llave 1-8, 4-5, 3-6, 2-7: el mismo cuadro sirve para todas.
export const FIRST_SEASON = 1985;
// Partidos que nunca se jugaron (p. ej., los suspendidos de la burbuja de 2020): ESPN los marca como terminados.
const DROPPED = new Set(["STATUS_POSTPONED", "STATUS_CANCELED", "STATUS_SUSPENDED"]);
// Victorias para ganar una serie: la 1.ª ronda fue al mejor de 5 hasta 2002.
export const winsNeeded = (round, year) => (round === "r1" && year <= 2002 ? 3 : 4);

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
        tri: tri(e.team.abbreviation), name: e.team.shortDisplayName || e.team.name, seed: v("playoffSeed"), w: v("wins"), l: v("losses"), pct: dv("winPercent"),
        gb: dv("gamesBehind"), streak: dv("streak"), l10: dv("Last Ten Games"), home: dv("Home"), road: dv("Road"),
        diff: v("pointDifferential"), clinch: CLINCH[dv("clincher")] || null,
      };
    });
    // En temporadas viejas los no clasificados vienen con puesto 0: van después, ordenados por % de victorias.
    const pct = (r) => r.w / Math.max(1, r.w + r.l);
    const ranked = out[conf].filter((r) => r.seed > 0).sort((a, b) => a.seed - b.seed);
    const rest = out[conf].filter((r) => !(r.seed > 0)).sort((a, b) => pct(b) - pct(a));
    out[conf] = [...ranked, ...rest.map((r, i) => ({ ...r, seed: ranked.length + i + 1, clinch: r.clinch || "out" }))];
  }
  return out;
}

// "East 1st Round - Game 3" o "EASTERN CONFERENCE 1st ROUND - GAME 2" → { conf: "East", round: "r1" };
// "NBA Play-In - West - 8th Seed Game" → { conf: "West", round: "pi8" }
export function roundOf(headline = "") {
  const pi = headline.match(/^NBA Play-In - (East|West) - (7th Place|9th Place|8th Seed)/);
  if (pi) return { conf: pi[1], round: { "7th Place": "pi78", "9th Place": "pi910", "8th Seed": "pi8" }[pi[2]] };
  if (/^NBA Finals/i.test(headline)) return { conf: null, round: "finals" };
  const m = headline.match(/^(East|West)(?:ern Conference)? (1st Round|First Round|Semifinals|Finals)/i);
  if (!m) return null;
  const conf = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  return { conf, round: { "1st round": "r1", "first round": "r1", semifinals: "sf", finals: "cf" }[m[2].toLowerCase()] };
}

// Temporadas viejas: ESPN no dice la ronda. Se deduce por orden: la 1.ª serie de un equipo es la 1.ª ronda,
// la 2.ª las semifinales, la 3.ª la final de conferencia; una serie entre conferencias es la final.
export function inferRounds(games, confOf) {
  const first = {};
  for (const g of games) { const k = pair(g); if (!first[k] || g.date < first[k]) first[k] = g.date; }
  const played = {}, roundOfPair = {};
  for (const k of Object.keys(first).sort((a, b) => first[a].localeCompare(first[b]))) {
    const [a, b] = k.split("-");
    const conf = confOf[a] && confOf[a] === confOf[b] ? confOf[a] : null;
    const n = Math.max(played[a] || 0, played[b] || 0);
    roundOfPair[k] = conf ? { conf, round: ["r1", "sf", "cf"][n] || "cf" } : { conf: null, round: "finals" };
    played[a] = n + 1; played[b] = n + 1;
  }
  return games.map((g) => ({ ...g, ...roundOfPair[pair(g)] }));
}


// Une los partidos de una ronda en series (al mejor de 7) por pareja de equipos.
export function seriesOf(games, year = 9999) {
  const by = {};
  for (const g of games) (by[`${g.round}:${pair(g)}`] ||= []).push(g);
  return Object.values(by).map((gs) => {
    gs.sort((x, y) => x.date.localeCompare(y.date));
    const [a, b] = pair(gs[0]).split("-");
    const wins = { [a]: 0, [b]: 0 };
    for (const g of gs) if (g.winner) wins[g.winner]++;
    const need = winsNeeded(gs[0].round, year);
    const winner = wins[a] === need ? a : wins[b] === need ? b : null;
    const live = gs.find((g) => g.status === "live");
    const next = gs.find((g) => g.status === "scheduled");
    return { round: gs[0].round, conf: gs[0].conf, teams: [a, b], wins, need, winner, games: gs, live: live || null, next: winner ? null : next || null };
  });
}

// A ESPN le faltan partidos de algunas series viejas. En una temporada terminada, el ganador es el que aparece
// en la ronda siguiente o, en la final, el que tiene más victorias registradas.
export function fillWinners(series) {
  const next = { r1: "sf", sf: "cf", cf: "finals" };
  for (const s of series) {
    if (s.winner) continue;
    const later = series.find((x) => x.round === next[s.round] && x.teams.some((t) => s.teams.includes(t)));
    const [a, b] = s.teams;
    s.winner = later ? later.teams.find((t) => s.teams.includes(t)) : s.wins[a] !== s.wins[b] ? (s.wins[a] > s.wins[b] ? a : b) : null;
    s.incomplete = true;
  }
  return series;
}

// Llave de playoffs: con las series reales cuando existen; si no, la proyección desde la tabla (1-8, 4-5, 3-6, 2-7).
export function playoffBracket(standings, series, playin = {}) {
  const nameOf = Object.fromEntries(CONFS.flatMap((c) => (standings[c] || []).map((r) => [r.tri, r.name])));
  const side = (t, seedOf, wins) => (t ? { tri: t, name: nameOf[t], seed: seedOf[t], wins: wins?.[t] } : null);
  const make = (teams, real, seedOf, projected) => {
    const s = real || null;
    const [a, b] = s ? [...s.teams].sort((x, y) => (seedOf[x] || 99) - (seedOf[y] || 99)) : teams;
    return {
      a: side(a, seedOf, s?.wins), b: side(b, seedOf, s?.wins), need: s?.need || 4, winner: s?.winner || null, projected: !s && projected,
      status: !s ? "tbd" : s.winner ? "final" : s.live ? "live" : "active",
      live: s?.live || null, next: s?.next || null, games: s?.games || [], incomplete: !!s?.incomplete,
    };
  };
  const find = (round, conf, candidates) => series.find((s) => s.round === round && (!conf || s.conf === conf) && s.teams.some((t) => candidates.includes(t)));
  const out = {};
  for (const conf of CONFS) {
    const rows = standings[conf] || [];
    const seedOf = Object.fromEntries(rows.map((r) => [r.tri, r.seed]));
    const realR1 = series.filter((s) => s.round === "r1" && s.conf === conf);
    if (realR1.length === 4) {
      out[conf] = fromSeries(rows, realR1, series.filter((s) => s.round === "sf" && s.conf === conf), series.find((s) => s.round === "cf" && s.conf === conf), make);
      continue;
    }
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
  // Los puestos de la final, los mismos que se mostraron en cada conferencia.
  const seedOf = Object.fromEntries(CONFS.flatMap((c) => out[c].r1.flatMap((m) => [m.a, m.b]).filter(Boolean).map((t) => [t.tri, t.seed])));
  const finals = make([out.West.cf.winner, out.East.cf.winner], series.find((s) => s.round === "finals"), seedOf, false);
  return { ...out, finals, champion: finals.winner };
}

// Con la 1.ª ronda completa, la llave sale de las series jugadas: así no depende de que ESPN tenga bien los puestos
// (en temporadas viejas a veces no los tiene). Los puestos se toman de la tabla si son coherentes; si no, por % de victorias.
// shortcut: antes de 2016 los campeones de división subían de puesto; ahí el número mostrado puede diferir del oficial, los cruces no.
function fromSeries(rows, r1, sf, cf, make) {
  const teams = r1.flatMap((s) => s.teams);
  const seeds = teams.map((t) => rows.find((r) => r.tri === t)?.seed);
  const seedOf = new Set(seeds).size === 8 && seeds.every((x) => x >= 1 && x <= 8)
    ? Object.fromEntries(teams.map((t, i) => [t, seeds[i]]))
    : Object.fromEntries(teams.map((t) => rows.find((r) => r.tri === t) || { tri: t, w: 0, l: 1 }).sort((a, b) => b.w / (b.w + b.l) - a.w / (a.w + a.l)).map((r, i) => [r.tri, i + 1]));
  const best = (s) => Math.min(...s.teams.map((t) => seedOf[t] ?? 99));
  const byBest = [...r1].sort((a, b) => best(a) - best(b));
  let order = [byBest[0], byBest[3], byBest[2], byBest[1]]; // 1-8, 4-5, 3-6, 2-7
  // Si ya hay semifinales, los cruces que alimentan cada una quedan juntos.
  const semi = sf.find((x) => x.teams.some((t) => order[0].teams.includes(t)));
  if (semi) { const top = order.filter((r) => r.teams.some((t) => semi.teams.includes(t))); order = [...top, ...order.filter((r) => !top.includes(r))]; }
  const R1 = order.map((s) => make(null, s, seedOf, false));
  const SF = [0, 2].map((i) => {
    const pool = [...order[i].teams, ...order[i + 1].teams];
    return make([R1[i].winner, R1[i + 1].winner], sf.find((x) => x.teams.some((t) => pool.includes(t))), seedOf, false);
  });
  return { r1: R1, sf: SF, cf: make([SF[0].winner, SF[1].winner], cf, seedOf, false) };
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
    get(`${WEB}/standings?level=2&season=${year}`, year < currentSeason() ? 86400 : 300),
    // El play-in existe desde 2020: antes ESPN responde 404.
    get(`${CORE}/seasons/${year}/types/5`, 86400).catch(() => null),
    get(`${CORE}/seasons/${year}/types/3`, 86400),
  ]);
  const standings = normalizeStandings(st);
  const confOf = Object.fromEntries(CONFS.flatMap((c) => (standings[c] || []).map((r) => [r.tri, c])));
  let games = [];
  // En temporadas viejas ESPN a veces da fechas de playoffs corridas (del año siguiente, o que terminan antes de las Finales):
  // ahí se recorre de abril a junio y cada partido dice si es de postemporada (season.type 3).
  const shifted = new Date(po.startDate).getUTCFullYear() !== year && year < 2020;
  const from = pi ? new Date(pi.startDate) : shifted ? new Date(`${year}-04-10`) : new Date(po.startDate);
  const end = year < currentSeason(now) ? Math.max(shifted ? 0 : new Date(po.endDate), new Date(`${year}-06-30`)) : new Date(po.endDate);
  const to = new Date(Math.min(end, now.getTime() + 7 * 86400e3));
  if (now >= from) {
    const days = [];
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) days.push(new Date(d));
    const boards = await Promise.all(days.map((d) => get(`${SITE}/scoreboard?dates=${ymd(d)}`, now - d > 2 * 86400e3 ? 86400 : 30).catch(() => ({ events: [] }))));
    // Un partido puede salir en dos días seguidos (por la zona horaria): se cuenta una sola vez.
    const seen = new Set();
    const all = boards.flatMap((b) => b.events || []).filter((e) => (!e.season?.type || e.season.type >= 3) && !DROPPED.has(e.status?.type?.name) && !seen.has(e.id) && seen.add(e.id))
      .map((e) => ({ ...normalizeEvent(e), ...roundOf(e.competitions[0].notes?.[0]?.headline) }));
    // Si casi todos los partidos traen la ronda en el título, se usan esos (y se descartan los sin título, como los
    // partidos de siembra de la burbuja de 2020). En las temporadas viejas los títulos dicen "PLAYOFFS" o nada: ahí se deduce.
    const post = all.filter((g) => confOf[g.away.tri] && confOf[g.home.tri]);
    const labeled = post.filter((g) => g.round);
    games = labeled.length >= post.length * 0.8 ? labeled
      : [...labeled.filter((g) => g.round.startsWith("pi")), ...inferRounds(post.filter((g) => !g.round), confOf)];
  }
  const playin = playIn(standings, games);
  const series = seriesOf(games.filter((g) => !g.round.startsWith("pi")), year);
  if (year < currentSeason(now)) fillWinners(series);
  const bracket = playoffBracket(standings, series, playin);
  const phase = bracket.champion ? "done" : series.length ? "playoffs" : games.length ? "playin" : "regular";
  return { year, label: `${year - 1}-${String(year).slice(2)}`, phase, hasPlayIn: !!pi, standings, playin, bracket };
}
