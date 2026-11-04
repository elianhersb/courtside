"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";
import { Match, Trophy, LeagueSwitch, SeriesGames, teamName } from "@/components/Bracket";

const CONF = { East: "Este", West: "Oeste" };
const PHASE = { regular: "Temporada regular", playin: "Play-in", playoffs: "Playoffs", done: "Finalizada" };
const ZONE = { in: "Clasificado", playin: "Play-in", out: "Eliminado" };
// La temporada actual va de octubre a junio: en ESPN se nombra por el año en que termina.
const thisSeason = () => { const d = new Date(); return d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear(); };

function Table({ conf, rows, favs }) {
  return (
    <section className="cs-std">
      <h2 className="cs-cup-conf"><span>Conferencia {CONF[conf]}</span></h2>
      <div className="cs-std-card">
        <div className="cs-std-row cs-std-head">
          <span>#</span><span>Equipo</span><span>G</span><span>P</span><span>%</span><span>JD</span><span className="cs-std-x">Racha</span><span className="cs-std-x">Últ. 10</span><span className="cs-std-xx">Local</span><span className="cs-std-xx">Visita</span>
        </div>
        {rows.map((r) => (
          <div key={r.tri} className={`cs-std-row is-z${r.seed <= 6 ? 1 : r.seed <= 10 ? 2 : 3}${r.seed === 6 || r.seed === 10 ? " is-cut" : ""}${favs.includes(r.tri) ? " is-fav" : ""}`} style={{ "--c": C.TEAMS[r.tri]?.color }}>
            <span className="cs-grp-pos">{r.seed}</span>
            <span className="cs-grp-team"><C.TeamLogo team={r.tri} size="sm" /><b>{teamName(r.tri)}</b>{r.clinch ? <em className={`is-${r.clinch}`}>{ZONE[r.clinch]}</em> : null}</span>
            <span className="cs-num">{r.w}</span><span className="cs-num">{r.l}</span>
            <span className="cs-num cs-muted">{r.pct}</span><span className="cs-num cs-muted">{r.gb}</span>
            <span className={`cs-num cs-std-x ${r.streak?.startsWith("W") ? "is-pos" : "is-neg"}`}>{r.streak?.replace("W", "G").replace("L", "P")}</span>
            <span className="cs-num cs-std-x cs-muted">{r.l10}</span>
            <span className="cs-num cs-std-xx cs-muted">{r.home}</span><span className="cs-num cs-std-xx cs-muted">{r.road}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Standings({ data, favs }) {
  const [conf, setConf] = useState("East");
  return (
    <div className="cs-stack" style={{ gap: 14 }}>
      <div className="cs-phone-only"><C.Segmented items={[{ key: "East", label: "Este" }, { key: "West", label: "Oeste" }]} value={conf} onChange={setConf} /></div>
      <div className="cs-stds">
        {Object.keys(CONF).map((c) => <div key={c} className={c === conf ? "" : "cs-desk-show"}><Table conf={c} rows={data.standings[c] || []} favs={favs} /></div>)}
      </div>
      <div className="cs-std-legend">
        <span className="is-z1">1–6 · Playoffs directos</span><span className="is-z2">7–10 · Play-in</span><span className="is-z3">11–15 · Fuera</span>
      </div>
    </div>
  );
}

function PlayIn({ data }) {
  return (
    <div className="cs-stack" style={{ gap: 14 }}>
      {data.phase === "regular" ? <div className="cs-cup-note"><C.Icon name="clock" />Proyección con la tabla actual. El play-in se juega al terminar la temporada regular.</div> : null}
      <div className="cs-pi">
        {Object.keys(CONF).map((c) => {
          const p = data.playin[c];
          return (
            <section key={c} className="cs-pi-conf">
              <h2 className="cs-cup-conf"><span>{CONF[c]}</span></h2>
              <Match m={p.a} label="7.º vs 8.º · el ganador es el 7.º" />
              <Match m={p.b} label="9.º vs 10.º · el que pierde queda fuera" />
              <Match m={p.c} label="Por el 8.º puesto" big />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Playoffs({ data }) {
  const b = data.bracket;
  const [pick, setPick] = useState(null);
  const key = (m) => m?.a && m?.b ? `${m.a.tri}-${m.b.tri}` : null;
  const sel = (m) => setPick((p) => (p === key(m) ? null : key(m)));
  const all = ["West", "East"].flatMap((c) => [...b[c].r1, ...b[c].sf, b[c].cf]).concat(b.finals);
  const picked = all.find((m) => key(m) === pick);
  const mt = (m, i, extra) => <Match key={i} m={m} onPick={sel} picked={key(m) === pick} {...extra} />;
  const side = (c) => (
    <div className={`cs-br-side is-po is-${c === "West" ? "west" : "east"}`}>
      <div className="cs-br-round" data-r="r1"><div className="cs-br-h">1.ª ronda · {CONF[c]}</div>{b[c].r1.map((m, i) => mt(m, i, { compact: true }))}</div>
      <div className="cs-br-round" data-r="sf"><div className="cs-br-h">Semifinal</div>{b[c].sf.map((m, i) => mt(m, i, { compact: true }))}</div>
      <div className="cs-br-round" data-r="cf"><div className="cs-br-h">Final {CONF[c]}</div>{mt(b[c].cf, 0, { compact: true })}</div>
    </div>
  );
  return (
    <div className="cs-stack" style={{ gap: 14 }}>
      {data.phase === "regular" || data.phase === "playin" ? (
        <div className="cs-cup-note"><C.Icon name="clock" />Si los playoffs empezaran hoy: la llave se arma con la tabla y cambia con cada resultado.</div>
      ) : null}
      <div className="cs-br cs-br-po">
        {side("West")}
        <div className="cs-br-center">
          <Trophy champion={b.champion} />
          <div className="cs-br-h">{b.champion ? `Campeón: ${teamName(b.champion)}` : "Finales NBA"}</div>
          {mt(b.finals, 0, { big: true })}
        </div>
        {side("East")}
      </div>
      {picked ? <SeriesGames m={picked} onClose={() => setPick(null)} /> : null}
    </div>
  );
}

export default function Season() {
  const [prefs] = usePrefs();
  const [year, setYear] = useState(thisSeason);
  const { data, error } = useJson(`/api/season?year=${year}`, 60000);
  const [tab, setTab] = useState(null);
  useEffect(() => { if (data) setTab((t) => t || (data.phase === "regular" ? "table" : data.phase === "playin" ? "playin" : "playoffs")); }, [data]);
  const label = (y) => `${y - 1}-${String(y).slice(2)}`;

  return (
    <>
      <LeagueSwitch />
      <div className="cs-cup-hero is-season">
        <div className="cs-cup-hero-ic"><C.Icon name="trophy" weight={1.8} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="cs-eyebrow">NBA</div>
          <h1>Temporada {label(year)}</h1>
          <div className="cs-row" style={{ gap: 8, marginTop: 8 }}>
            {data ? <span className="cs-cup-chip">{PHASE[data.phase]}</span> : null}
            {data?.bracket.champion ? <span className="cs-muted" style={{ fontSize: 13 }}>Campeón: <b>{teamName(data.bracket.champion)}</b></span> : null}
          </div>
        </div>
        <div className="cs-season-pick"><C.Segmented items={[{ key: thisSeason(), label: label(thisSeason()) }, { key: thisSeason() - 1, label: label(thisSeason() - 1) }]} value={year} onChange={(y) => { setYear(y); setTab(null); }} /></div>
      </div>
      <div className="cs-gut" style={{ marginTop: 14 }}>
        <C.Tabs items={[{ key: "table", label: "Posiciones" }, { key: "playin", label: "Play-in" }, { key: "playoffs", label: "Playoffs" }]} value={tab || "table"} onChange={setTab} />
      </div>
      <div className="cs-gut" style={{ marginTop: 16 }}>
        {error ? <div className="cs-error">{error}</div>
          : !data || data.year !== year ? <div className="cs-stds">{[0, 1].map((i) => <div key={i} className="cs-std-card" style={{ padding: 14 }}><C.Skeleton w={140} /><C.Skeleton w="100%" h={320} r={12} /></div>)}</div>
          : (tab || "table") === "table" ? <Standings data={data} favs={prefs.favs} />
          : tab === "playin" ? <PlayIn data={data} />
          : <Playoffs data={data} />}
      </div>
      <p className="cs-gut cs-subtle" style={{ fontSize: 12, marginTop: 18 }}>
        Datos de ESPN. Toca una serie para ver sus juegos. <Link href="/copa" style={{ color: "var(--brand-ink)" }}>Ver la Copa NBA →</Link>
      </p>
    </>
  );
}
