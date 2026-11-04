"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";
import { channelsFor, COUNTRIES } from "@/lib/channels";
import { timeOf, tz } from "@/lib/format";

const TABS = [{ key: "resumen", label: "Resumen" }, { key: "box", label: "Box score" }, { key: "pbp", label: "Jugada a jugada" }, { key: "cmp", label: "Comparación" }];
const ORDER = TABS.map((t) => t.key);

export default function Game({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [prefs] = usePrefs();
  const live = useRef(false);
  const { data: g, error } = useJson(`/api/game/${id}`, () => (live.current ? 10000 : 0));
  const [tab, setTab] = useState("resumen");
  const [dir, setDir] = useState(1);
  const [side, setSide] = useState("away");
  const [quarter, setQuarter] = useState("all");
  const firstPlay = useRef(null);

  if (error && !g) return <C.EmptyState kind="offline" title="No pudimos cargar el partido" body={error} action={<C.Button variant="secondary" onClick={() => router.back()}>Volver</C.Button>} />;
  if (!g) return <div className="cs-gut cs-stack" style={{ gap: 20, paddingTop: 60 }}><C.GameCardSkeleton /><C.StatTable loading /></div>;

  live.current = g.status === "live";
  const channels = channelsFor(g.broadcasts, prefs.country);
  const game = { ...g, time: g.status === "scheduled" ? timeOf(g.date) : undefined, tz: tz() };
  const a = C.TEAMS[g.away.tri] || {}, hm = C.TEAMS[g.home.tri] || {};
  const go = (k) => { setDir(ORDER.indexOf(k) >= ORDER.indexOf(tab) ? 1 : -1); setTab(k); };
  const share = () => navigator.share?.({ title: `${a.name} vs ${hm.name}`, url: location.href }).catch(() => {});

  // Resalta la jugada más reciente solo cuando llega una nueva.
  const topKey = g.plays[0] ? g.plays[0].clock + g.plays[0].text : null;
  const fresh = firstPlay.current !== null && firstPlay.current !== topKey;
  firstPlay.current = topKey;
  const plays = quarter === "all" ? g.plays : g.plays.filter((p) => String(p.period) === quarter);
  const periods = Math.max(4, g.periods.away.length);
  const quarters = [{ key: "all", label: "Todo" }, ...Array.from({ length: periods }, (_, i) => ({ key: String(i + 1), label: i < 4 ? `Q${i + 1}` : `OT${i - 3}` }))];

  let body;
  if (tab === "resumen") body = (
    <div className="cs-stack" style={{ gap: 14 }}>
      <div className="cs-panel"><h3 className="cs-h">Marcador por cuarto</h3><C.LineScore game={g} /></div>
      {g.gameLeaders.length ? (
        <div className="cs-panel">
          <h3 className="cs-h" style={{ marginBottom: 4 }}>Líderes del partido</h3>
          {g.gameLeaders.map((L, i) => <C.LeaderRow key={L.label} leader={L} first={i === 0} />)}
        </div>
      ) : null}
    </div>
  );
  else if (tab === "box") body = (
    <div className="cs-stack" style={{ gap: 12 }}>
      <C.Segmented items={[{ key: "away", label: a.name }, { key: "home", label: hm.name }]} value={side} onChange={setSide} />
      {g.box[side].length ? <C.StatTable team={g[side].tri} players={g.box[side]} live={g.status === "live"} /> : <div className="cs-muted">Sin estadísticas todavía.</div>}
      <div className="cs-subtle" style={{ fontSize: 12 }}>
        {g.status === "live" ? <><span className="cs-oncourt" style={{ marginLeft: 0, marginRight: 6 }} />En cancha ahora · </> : null}desliza la tabla →
      </div>
    </div>
  );
  else if (tab === "pbp") body = (
    <div className="cs-stack" style={{ gap: 12 }}>
      <C.Segmented items={quarters} value={quarter} onChange={setQuarter} />
      <div className="cs-panel" style={{ padding: 0, overflow: "hidden" }}>
        {plays.length ? plays.map((p, i) => <C.PlayItem key={p.clock + p.text + i} play={p} isNew={i === 0 && fresh && quarter === "all"} />)
          : <C.EmptyState title="Sin jugadas en este cuarto" body="Elige otro cuarto o “Todo”." />}
      </div>
    </div>
  );
  else body = g.compare ? (
    <div className="cs-panel cs-stack" style={{ gap: 18 }}>
      <div className="cs-row" style={{ justifyContent: "space-between" }}>
        <C.TeamLogo team={g.away.tri} size="sm" /><span className="cs-h" style={{ margin: 0 }}>Estadísticas del equipo</span><C.TeamLogo team={g.home.tri} size="sm" />
      </div>
      {g.compare.map((c) => <C.CompareBar key={c.label} label={c.label} away={c.away} home={c.home} percent={c.percent} lowerIsBetter={c.lower} awayColor={a.color} homeColor={hm.color} />)}
    </div>
  ) : <div className="cs-muted">Sin estadísticas todavía.</div>;

  return (
    <>
      <C.GameHeader game={game} onBack={() => router.back()} onShare={share} />
      <div className="cs-gut cs-stack" style={{ marginTop: 14, gap: 14 }}>
        <C.WatchSection channels={channels} owned={prefs.subs} country={COUNTRIES[prefs.country]} onCountry={() => router.push("/perfil")} />
      </div>
      {g.status === "scheduled" ? (
        <div className="cs-gut" style={{ marginTop: 18 }}>
          <div className="cs-list">
            <div className="cs-li"><C.Icon name="clock" /><div className="cs-li-main">Inicio<div className="cs-li-sub">Tu hora local</div></div><span className="cs-num" style={{ fontWeight: 700 }}>{game.time} {game.tz}</span></div>
            {g.venue ? <div className="cs-li"><C.Icon name="globe" /><div className="cs-li-main">Sede</div><span className="cs-muted" style={{ fontWeight: 600 }}>{g.venue}</span></div> : null}
          </div>
        </div>
      ) : (
        <>
          <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--glass)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", marginTop: 8 }}>
            <div className="cs-gut"><C.Tabs items={TABS} value={tab} onChange={go} /></div>
          </div>
          <div className="cs-gut" style={{ marginTop: 14 }}>
            <C.TabPanel k={tab} dir={dir}>{body}</C.TabPanel>
          </div>
        </>
      )}
    </>
  );
}
