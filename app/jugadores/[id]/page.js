"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";
import Bars from "@/components/Bars";

const fmt = (n) => new Intl.NumberFormat("es-VE").format(n);
const birth = (iso) => new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

function Career({ x }) {
  const c = x.career;
  const best = c.seasons.reduce((a, s) => (s.pts > a.pts ? s : a), c.seasons[0]);
  const bio = [
    ["Nacimiento", [x.bio.born && birth(x.bio.born), x.bio.birthPlace].filter(Boolean).join(" · ")],
    ["Físico", [x.ht, x.bio.weight].filter(Boolean).join(" · ")],
    ["Universidad", x.bio.college],
    ["Draft", x.bio.draft],
  ].filter(([, v]) => v);
  return (
    <>
      <div className="cs-gut" style={{ marginTop: 18 }}>
        <h3 className="cs-h">Carrera</h3>
        <div className="cs-career">
          <div className="cs-tile"><div className="cs-tile-v">{c.seasons.length}</div><div className="cs-tile-l">Temporadas</div></div>
          <div className="cs-tile"><div className="cs-tile-v">{fmt(c.gp)}</div><div className="cs-tile-l">Partidos</div></div>
          {c.pts ? <div className="cs-tile"><div className="cs-tile-v">{fmt(c.pts)}</div><div className="cs-tile-l">Puntos totales</div></div> : null}
          <div className="cs-tile cs-career-teams">
            <div className="cs-row" style={{ gap: 4, justifyContent: "center" }}>{c.teams.map((t) => <C.TeamLogo key={t} team={t} size="sm" />)}</div>
            <div className="cs-tile-l">{c.teams.length === 1 ? "Un solo equipo" : `${c.teams.length} equipos`}</div>
          </div>
        </div>
      </div>
      {bio.length ? (
        <div className="cs-gut" style={{ marginTop: 14 }}>
          <div className="cs-list">
            {bio.map(([k, v]) => <div key={k} className="cs-li"><div className="cs-li-main cs-muted" style={{ flex: "none", width: 110 }}>{k}</div><div style={{ fontWeight: 600 }}>{v}</div></div>)}
          </div>
        </div>
      ) : null}
      {c.seasons.length >= 2 ? (
        <div className="cs-gut" style={{ marginTop: 14 }}>
          <Bars title="Puntos por partido en cada temporada" sub={`Mejor: ${best.pts.toFixed(1)} en ${best.label}`} best fmt={(n) => n.toFixed(1)}
            data={c.seasons.map((s, i) => ({ key: `${s.year}-${i}`, label: `${s.label}${s.team ? ` · ${s.team}` : ""}`, n: s.pts }))}
            first={c.seasons[0].label} last={c.seasons.at(-1).label} />
        </div>
      ) : null}
      <div className="cs-gut" style={{ marginTop: 14 }}>
        <h3 className="cs-h">Temporada por temporada</h3>
        <div className="cs-table-wrap">
          <table className="cs-table" style={{ width: "100%" }}>
            <thead><tr><th style={{ textAlign: "left" }}>Temporada</th><th>PJ</th><th>PTS</th><th>REB</th><th>AST</th><th>% TC</th></tr></thead>
            <tbody>
              {c.seasons.slice().reverse().map((r, i) => (
                <tr key={`${r.year}-${i}`}>
                  <td style={{ textAlign: "left" }}><div className="cs-row" style={{ gap: 8, flexWrap: "nowrap" }}>{r.team ? <C.TeamLogo team={r.team} size="xs" /> : null}<div><div style={{ fontWeight: 600 }}>{r.label}</div><div className="cs-subtle" style={{ fontSize: 11 }}>{r.teamName}</div></div></div></td>
                  <td>{r.gp}</td><td className={r === best ? "is-hi" : ""}>{r.pts.toFixed(1)}</td><td>{r.reb.toFixed(1)}</td><td>{r.ast.toFixed(1)}</td><td>{r.fg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const shortDate = (iso) => new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short" }).format(new Date(iso));

export default function Player({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [prefs, setPrefs] = usePrefs();
  const { data: x, error } = useJson(`/api/player/${id}`);

  if (error) return <C.EmptyState kind="offline" title="No pudimos cargar el jugador" body={error} action={<C.Button variant="secondary" onClick={() => router.back()}>Volver</C.Button>} />;
  if (!x) return <div className="cs-gut cs-stack" style={{ gap: 16, paddingTop: 60 }}><C.Skeleton w="100%" h={220} r={20} /><C.Skeleton w="100%" h={70} r={14} /><C.Skeleton w="100%" h={150} r={14} /></div>;

  const t = C.TEAMS[x.team] || { name: x.teamName, color: "var(--surface-raised)", color2: "var(--surface)" };
  const fav = prefs.favs.includes(x.team);
  const games = x.last5.slice().reverse(); // de más antiguo a más reciente para el gráfico

  return (
    <>
      <header className="cs-hero" style={{ "--c-away": t.color, "--c-home": t.color2, paddingBottom: 0 }}>
        <div className="cs-row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
          <button className="cs-iconbtn" onClick={() => router.back()} aria-label="Volver"><C.Icon name="back" /></button>
          {x.team ? <C.FavoriteStar on={fav} onToggle={(on) => setPrefs({ favs: on ? [...prefs.favs, x.team] : prefs.favs.filter((f) => f !== x.team) })} /> : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignItems: "end", marginTop: 8 }}>
          <div style={{ paddingBottom: 18 }}>
            {x.team ? <C.TeamLogo team={x.team} size="lg" /> : null}
            <div className="cs-display" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginTop: 10 }}>{x.name}</div>
            <div style={{ color: "var(--on-media-muted)", fontSize: 13, marginTop: 6 }}>{[t.name, x.pos, x.ht].filter(Boolean).join(" · ")}</div>
            {!x.active && x.career ? <span className="cs-retired">Retirado · {x.career.first - 1}–{x.career.last}</span> : null}
          </div>
          <div style={{ position: "relative", height: 220 }}>
            {x.num ? <span className="cs-display" style={{ position: "absolute", right: 0, top: -10, fontSize: 96, fontWeight: 800, opacity: 0.18, lineHeight: 1 }}>#{x.num}</span> : null}
            <C.Img className="cs-portrait" src={C.headshotUrl(x.id)} label={x.name} phText={initials(x.name)} w={230} h={168} style={{ position: "absolute", bottom: 0, right: -16 }} />
          </div>
        </div>
      </header>
      {(x.avgs.length ? x.avgs : x.career?.avgs || []).length ? (
        <div className="cs-gut" style={{ marginTop: 16 }}>
          <h3 className="cs-h">{x.avgs.length ? "Promedios de la temporada" : "Promedios de carrera"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
            {(x.avgs.length ? x.avgs : x.career.avgs).map(([label, v]) => (
              <div key={label} className="cs-tile" style={{ padding: "10px 6px", textAlign: "center" }}>
                <div className="cs-tile-v" style={{ fontSize: 22 }}><C.CountUp value={v} decimals={1} /></div>
                <div className="cs-tile-l">{label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {games.length >= 2 ? (
        <div className="cs-gut" style={{ marginTop: 18 }}>
          <div className="cs-panel"><h3 className="cs-h">Puntos por partido</h3><C.PointsChart values={games.map((g) => g.pts)} labels={games.map((g) => g.opp)} /></div>
        </div>
      ) : null}
      {x.last5.length ? (
        <div className="cs-gut" style={{ marginTop: 14 }}>
          <h3 className="cs-h">Últimos {x.last5.length} partidos</h3>
          <div className="cs-table-wrap">
            <table className="cs-table" style={{ width: "100%" }}>
              <thead><tr><th style={{ textAlign: "left" }}>Rival</th><th>PTS</th><th>REB</th><th>AST</th><th>TC</th></tr></thead>
              <tbody>
                {x.last5.map((r) => (
                  <tr key={r.date}>
                    <td style={{ textAlign: "left" }}><div style={{ fontWeight: 600 }}>{r.opp}</div><div className="cs-subtle" style={{ fontSize: 11 }}>{shortDate(r.date)} · {r.result === "W" ? "Victoria" : "Derrota"}</div></td>
                    <td className={r.pts >= 30 ? "is-hi" : ""}>{r.pts}</td><td>{r.reb}</td><td>{r.ast}</td><td>{r.fg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {x.career?.seasons.length ? <Career x={x} /> : null}
    </>
  );
}
