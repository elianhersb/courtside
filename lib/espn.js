// Datos de la NBA desde la API pública (no oficial) de ESPN, normalizados al formato que usan los componentes.
// shortcut: API sin documentación ni contrato; si ESPN cambia el formato, esto se rompe. Migrar a un proveedor con licencia si la app crece.
const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const COMMON = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba";

// ESPN usa abreviaturas distintas a las de la NBA en estos equipos.
const TRI = { GS: "GSW", NY: "NYK", SA: "SAS", NO: "NOP", UTAH: "UTA", WSH: "WAS" };
export const tri = (abbr) => TRI[abbr] || abbr;

async function get(url, revalidate = 15) {
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`ESPN ${r.status}: ${url}`);
  return r.json();
}

export function statusOf(st) {
  const state = st.type.state;
  if (state === "pre") return { status: "scheduled" };
  const period = st.period || 0, ot = period > 4;
  if (state === "post") return { status: "final", ot };
  const clock = st.type.name === "STATUS_HALFTIME" ? "Medio tiempo"
    : st.type.name === "STATUS_END_PERIOD" ? `Fin ${ot ? "OT" + (period - 4) : "Q" + period}`
    : `${ot ? "OT" + (period - 4) : "Q" + period} ${st.displayClock}`;
  return { status: "live", clock, ot };
}

const record = (c) => (c.records || c.record || []).find((r) => r.type === "total" || r.name === "overall")?.summary || "";

function pointsLeader(c) {
  const cat = (c.leaders || []).find((l) => l.name === "points");
  const L = cat?.leaders?.[0];
  return L ? { id: L.athlete.id, name: L.athlete.displayName, pts: Number(L.value ?? L.displayValue) } : null;
}

function broadcastNames(comp) {
  const geo = (comp.geoBroadcasts || []).map((b) => b.media?.shortName);
  const plain = (comp.broadcasts || []).flatMap((b) => b.names || b.media?.shortName || []);
  return [...new Set([...geo, ...plain].filter(Boolean))];
}

export function normalizeEvent(e) {
  const comp = e.competitions[0];
  const side = (ha) => comp.competitors.find((c) => c.homeAway === ha);
  const a = side("away"), h = side("home");
  const st = statusOf(e.status || comp.status);
  const game = {
    id: e.id,
    date: e.date,
    ...st,
    away: { tri: tri(a.team.abbreviation), record: record(a), score: st.status === "scheduled" ? undefined : Number(a.score) },
    home: { tri: tri(h.team.abbreviation), record: record(h), score: st.status === "scheduled" ? undefined : Number(h.score) },
    broadcasts: broadcastNames(comp),
    venue: comp.venue ? [comp.venue.fullName, comp.venue.address?.city].filter(Boolean).join(" · ") : "",
  };
  const la = pointsLeader(a), lh = pointsLeader(h);
  if (st.status !== "scheduled" && la && lh) game.leaders = { away: la, home: lh };
  // Explícito para el asistente: los modelos pequeños se confunden al deducir el ganador del marcador.
  if (st.status === "final") game.winner = game.away.score > game.home.score ? game.away.tri : game.home.tri;
  if (st.status === "final" && la && lh) {
    const short = (n) => n.split(" ").slice(1).join(" ") || n;
    game.summary = `${game.away.tri}: ${short(la.name)} ${la.pts} PTS · ${game.home.tri}: ${short(lh.name)} ${lh.pts} PTS`;
  }
  return game;
}

// date: "YYYYMMDD" (día de la liga, hora del Este de EE.UU.)
export async function getScoreboard(date) {
  const d = await get(`${SITE}/scoreboard?dates=${date}`);
  return (d.events || []).map(normalizeEvent);
}

const BOX = { MIN: "min", PTS: "pts", FG: "fg", "3PT": "tp", FT: "ft", REB: "reb", AST: "ast", STL: "stl", BLK: "blk", "+/-": "pm" };
const NUM = new Set(["min", "pts", "reb", "ast", "stl", "blk", "pm"]);

export function normalizeBox(teamBlock) {
  const s = teamBlock.statistics[0];
  return s.athletes.filter((x) => x.stats?.length).map((x) => {
    const row = { id: x.athlete.id, name: x.athlete.displayName, pos: x.athlete.position?.abbreviation || "", bench: !x.starter, onCourt: !!x.active };
    s.labels.forEach((lab, i) => { const k = BOX[lab]; if (k) row[k] = NUM.has(k) ? Number(x.stats[i]) || 0 : x.stats[i]; });
    return row;
  });
}

function teamStat(t, name) {
  const v = t.statistics.find((s) => s.name === name)?.displayValue;
  return v == null ? 0 : Number(v);
}

export async function getGame(id) {
  const d = await get(`${SITE}/summary?event=${id}`, 10);
  const comp = d.header.competitions[0];
  const game = normalizeEvent({ id, date: comp.date, status: comp.status, competitions: [{ ...comp, venue: d.gameInfo?.venue, broadcasts: [], geoBroadcasts: d.broadcasts?.length ? d.broadcasts : comp.broadcasts }] });
  const byHA = (ha) => comp.competitors.find((c) => c.homeAway === ha);
  game.periods = { away: (byHA("away").linescores || []).map((l) => Number(l.displayValue)), home: (byHA("home").linescores || []).map((l) => Number(l.displayValue)) };

  const teamTri = {};
  comp.competitors.forEach((c) => { teamTri[c.team.id] = tri(c.team.abbreviation); });
  const sideOfTeam = (teamId) => (byHA("away").team.id === teamId ? "away" : "home");

  game.box = { away: [], home: [] };
  (d.boxscore?.players || []).forEach((p) => { game.box[sideOfTeam(p.team.id)] = normalizeBox(p); });

  const ts = {};
  (d.boxscore?.teams || []).forEach((t) => { ts[sideOfTeam(t.team.id)] = t; });
  if (ts.away?.statistics && ts.home?.statistics) {
    const row = (label, name, percent, lower) => ({ label, away: teamStat(ts.away, name), home: teamStat(ts.home, name), percent, lower });
    game.compare = [
      row("% Tiros de campo", "fieldGoalPct", true), row("% Triples", "threePointFieldGoalPct", true),
      row("Rebotes", "totalRebounds"), row("Asistencias", "assists"), row("Pérdidas", "totalTurnovers", false, true),
    ];
  }

  const lead = {};
  (d.leaders || []).forEach((t) => { lead[sideOfTeam(t.team.id)] = t.leaders || []; });
  game.gameLeaders = [["points", "PTS"], ["rebounds", "REB"], ["assists", "AST"]].map(([name, label]) => {
    const pick = (s) => {
      const L = (lead[s] || []).find((c) => c.name === name)?.leaders?.[0];
      return L ? { id: L.athlete.id, name: L.athlete.displayName, v: Number(L.mainStat?.value ?? L.displayValue.split(" ")[0]) || 0, team: game[s].tri } : null;
    };
    return { label, away: pick("away"), home: pick("home") };
  }).filter((L) => L.away && L.home);

  game.plays = (d.plays || []).filter((p) => p.team).slice(-60).reverse().map((p) => ({
    clock: p.clock?.displayValue, period: p.period?.number, team: teamTri[p.team.id], text: p.text,
    score: p.scoringPlay ? `${p.awayScore}-${p.homeScore}` : "", scoring: !!p.scoringPlay,
  }));
  return game;
}

export async function searchPlayers(q) {
  const d = await get(`https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(q)}&limit=10&type=player`, 3600);
  const items = d.results?.find((r) => r.type === "player")?.contents || [];
  return items.filter((c) => c.defaultLeagueSlug === "nba").map((c) => ({ id: c.uid.split("a:")[1], name: c.displayName, teamName: c.subtitle || "" }));
}

// Ficha básica: nombre, equipo, posición, número.
export async function getAthlete(id) {
  const at = (await get(`https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}`, 3600)).athlete;
  return {
    id: at.id, name: at.displayName, team: tri(at.team?.abbreviation || ""), teamName: at.team?.shortDisplayName || at.team?.name || "",
    pos: at.position?.displayName || "", num: at.jersey || "", ht: at.displayHeight || "",
  };
}

export async function getPlayer(id) {
  const [base, ov, gl] = await Promise.all([
    getAthlete(id),
    get(`${COMMON}/athletes/${id}/overview`, 600),
    get(`${COMMON}/athletes/${id}/gamelog`, 600).catch(() => null),
  ]);
  const st = ov.statistics || {};
  const season = (st.splits || []).find((s) => /Regular Season|Postseason/.test(s.displayName)) || st.splits?.[0];
  const val = (lab) => (season ? Number(season.stats[st.labels.indexOf(lab)]) : 0);
  const player = {
    ...base,
    avgs: season ? [["PTS", val("PTS")], ["REB", val("REB")], ["AST", val("AST")], ["% TC", val("FG%")], ["% 3P", val("3P%")]] : [],
    last5: [],
  };
  if (gl) {
    const L = gl.labels || [];
    const rows = (gl.seasonTypes?.[0]?.categories || []).flatMap((c) => c.events || []);
    player.last5 = rows.map((r) => {
      const ev = gl.events[r.eventId];
      const s = (lab) => r.stats[L.indexOf(lab)];
      return { date: ev.gameDate, opp: `${ev.atVs === "@" ? "@" : "vs"} ${tri(ev.opponent.abbreviation)}`, result: ev.gameResult, pts: Number(s("PTS")), reb: Number(s("REB")), ast: Number(s("AST")), fg: s("FG") };
    }).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);
  }
  return player;
}
