"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";
import { timeOf } from "@/lib/format";
import { Match, Trophy, LeagueSwitch, day, teamName as name } from "@/components/Bracket";

const CONF = { East: "Este", West: "Oeste" };
const PHASE = { groups: "Fase de grupos", knockout: "Eliminatorias", done: "Finalizada" };

function GroupCard({ g, favs, i }) {
  const played = g.rows.reduce((n, r) => n + r.played, 0) / 2;
  return (
    <section className="cs-grp" style={{ "--i": i }}>
      <header>
        <div><span className="cs-eyebrow">{CONF[g.conf]}</span><h3>Grupo {g.name}</h3></div>
        <div className="cs-grp-prog" title={`${played} de 10 partidos jugados`}>
          <span style={{ width: `${played * 10}%` }} /><small>{played}/10</small>
        </div>
      </header>
      <div className="cs-grp-row cs-grp-head"><span>#</span><span>Equipo</span><span>G-P</span><span>DIF</span></div>
      {g.rows.map((r, j) => (
        <div key={r.tri} className={`cs-grp-row${r.badge ? ` is-${r.badge}` : ""}${favs.includes(r.tri) ? " is-fav" : ""}`} style={{ "--c": C.TEAMS[r.tri]?.color }}>
          <span className="cs-grp-pos">{j + 1}</span>
          <span className="cs-grp-team"><C.TeamLogo team={r.tri} size="sm" /><b>{name(r.tri)}</b>
            {r.badge === "leader" ? <em>{g.done ? "Clasificado" : "Líder"}</em> : r.badge === "wildcard" ? <em className="is-wc">Wild card</em> : null}
          </span>
          <span className="cs-num">{r.w}-{r.l}</span>
          <span className={`cs-num ${r.diff > 0 ? "is-pos" : r.diff < 0 ? "is-neg" : ""}`}>{r.diff > 0 ? "+" : ""}{r.diff}</span>
        </div>
      ))}
    </section>
  );
}

function Groups({ data, favs }) {
  return (
    <div className="cs-stack" style={{ gap: 22 }}>
      {Object.keys(CONF).map((conf) => (
        <div key={conf} className="cs-stack" style={{ gap: 12 }}>
          <h2 className="cs-cup-conf"><span>Conferencia {CONF[conf]}</span></h2>
          <div className="cs-grps">
            {data.groups.filter((g) => g.conf === conf).map((g, i) => <GroupCard key={g.name} g={g} favs={favs} i={i} />)}
          </div>
          <div className="cs-wc">
            <span className="cs-eyebrow">Carrera por el wild card · {CONF[conf]}</span>
            <div className="cs-wc-list">
              {data.wildcards[conf].map((r, i) => (
                <div key={r.tri} className={`cs-wc-item${i === 0 ? " is-in" : ""}`}>
                  <C.TeamLogo team={r.tri} size="xs" /><b>{r.tri}</b><span className="cs-num">{r.w}-{r.l}</span>
                  <span className="cs-num cs-subtle">{r.diff > 0 ? "+" : ""}{r.diff}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <p className="cs-subtle" style={{ fontSize: 12, margin: 0 }}>
        Clasifican los 3 líderes de grupo y el mejor segundo (wild card) de cada conferencia. Desempate: duelo directo, diferencia de puntos y puntos a favor.
      </p>
    </div>
  );
}

function Bracket({ data }) {
  const b = data.bracket;
  const col = (conf) => (
    <>
      <div className="cs-br-round" data-r="qf"><div className="cs-br-h">Cuartos · {CONF[conf]}</div>{b[conf].qf.map((m, i) => <Match key={i} m={m} />)}</div>
      <div className="cs-br-round" data-r="sf"><div className="cs-br-h">Semifinal</div><Match m={b[conf].sf} /></div>
    </>
  );
  return (
    <div className="cs-stack" style={{ gap: 14 }}>
      {data.phase === "groups" ? (
        <div className="cs-cup-note"><C.Icon name="clock" />La llave se arma con la tabla actual y cambia con cada resultado de la fase de grupos.</div>
      ) : null}
      <div className="cs-br">
        <div className="cs-br-side is-west">{col("West")}</div>
        <div className="cs-br-center">
          <Trophy champion={b.champion} />
          <div className="cs-br-h">{b.champion ? `Campeón: ${name(b.champion)}` : "Final"}</div>
          <Match m={b.final} big />
          <div className="cs-subtle" style={{ fontSize: 12, textAlign: "center" }}>{data.finalVenue}<br />{day(`${data.finalDate}T20:00:00-05:00`)}</div>
        </div>
        <div className="cs-br-side is-east">{col("East")}</div>
      </div>
    </div>
  );
}

export default function Cup() {
  const [prefs] = usePrefs();
  const { data, error } = useJson("/api/cup", 60000);
  const [tab, setTab] = useState(null);
  useEffect(() => { if (data && !tab) setTab(data.phase === "groups" ? "groups" : "bracket"); }, [data, tab]);

  return (
    <>
      <LeagueSwitch />
      <div className="cs-cup-hero">
        <div className="cs-cup-hero-ic"><C.Icon name="trophy" weight={1.8} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="cs-eyebrow">Emirates NBA Cup</div>
          <h1>Copa NBA {data?.year || ""}</h1>
          <div className="cs-row" style={{ gap: 8, marginTop: 8 }}>
            {data ? <span className="cs-cup-chip">{PHASE[data.phase]}</span> : null}
            {data ? <span className="cs-muted" style={{ fontSize: 13 }}>Final · {day(`${data.finalDate}T20:00:00-05:00`)} · {data.finalVenue.split(" · ")[1]}</span> : null}
          </div>
        </div>
      </div>
      <div className="cs-gut" style={{ marginTop: 14 }}>
        <C.Tabs items={[{ key: "groups", label: "Fase de grupos" }, { key: "bracket", label: "Llaves" }]} value={tab || "groups"} onChange={setTab} />
      </div>
      <div className="cs-gut" style={{ marginTop: 16 }}>
        {error ? <div className="cs-error">{error}</div>
          : !data ? <div className="cs-grps">{[0, 1, 2].map((i) => <div key={i} className="cs-grp"><C.Skeleton w={100} /><C.Skeleton w="100%" h={180} r={12} /></div>)}</div>
          : (tab || "groups") === "groups" ? <Groups data={data} favs={prefs.favs} /> : <Bracket data={data} />}
        {data?.upcoming?.length ? (
          <section style={{ marginTop: 26 }}>
            <div className="cs-eyebrow" style={{ margin: "0 4px 10px" }}>Próximos partidos de la Copa</div>
            <div className="cs-cup-next">
              {data.upcoming.map((g) => (
                <Link key={g.id} href={`/partido/${g.id}`} className="cs-cup-game cs-press">
                  <span className="cs-cup-game-t">{g.status === "live" ? <C.LiveBadge clock={g.clock} /> : `${day(g.date)} · ${timeOf(g.date)}`}</span>
                  <span className="cs-row" style={{ gap: 8, flexWrap: "nowrap" }}><C.TeamLogo team={g.away.tri} size="sm" /><b>{g.away.tri}</b><span className="cs-subtle">vs</span><b>{g.home.tri}</b><C.TeamLogo team={g.home.tri} size="sm" /></span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
