"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";

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
          </div>
          <div style={{ position: "relative", height: 220 }}>
            {x.num ? <span className="cs-display" style={{ position: "absolute", right: 0, top: -10, fontSize: 96, fontWeight: 800, opacity: 0.18, lineHeight: 1 }}>#{x.num}</span> : null}
            <C.Img className="cs-portrait" src={C.headshotUrl(x.id)} label={x.name} w={230} h={168} style={{ position: "absolute", bottom: 0, right: -16 }} />
          </div>
        </div>
      </header>
      {x.avgs.length ? (
        <div className="cs-gut" style={{ marginTop: 16 }}>
          <h3 className="cs-h">Promedios de la temporada</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
            {x.avgs.map(([label, v]) => (
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
    </>
  );
}
