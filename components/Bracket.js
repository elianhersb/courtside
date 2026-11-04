"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import C from "./cs";
import { timeOf } from "@/lib/format";

export const day = (iso) => new Intl.DateTimeFormat("es-VE", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
export const teamName = (tri) => C.TEAMS[tri]?.name || tri;

// Selector entre las dos secciones de la pestaña Liga.
export function LeagueSwitch() {
  const path = usePathname();
  return (
    <nav className="cs-league-sw" aria-label="Secciones de la liga">
      {[["/temporada", "Temporada y playoffs"], ["/copa", "Copa NBA"]].map(([href, label]) => (
        <Link key={href} href={href} className={`cs-press${path.startsWith(href) ? " is-on" : ""}`} aria-current={path.startsWith(href) ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}

// Un equipo dentro de un cruce: marcador (partido único) o victorias de la serie (al mejor de 7).
function Side({ s, winner, live, compact, need = 4 }) {
  if (!s) return <div className="cs-mt-side is-tbd"><span className="cs-mt-logo" /><b>Por definir</b></div>;
  const lost = winner && winner !== s.tri;
  return (
    <div className={`cs-mt-side${winner === s.tri ? " is-win" : ""}${lost ? " is-lost" : ""}`}>
      {s.seed ? <span className="cs-mt-seed">{s.seed}</span> : null}
      <C.TeamLogo team={s.tri} size="sm" />
      <b>{compact ? s.tri : s.name || teamName(s.tri)}</b>
      {s.wins !== undefined ? (
        <span className="cs-mt-wins" aria-label={`${s.wins} victorias`}>
          {Array.from({ length: need }, (_, i) => <i key={i} className={i < s.wins ? "is-on" : ""} />)}<em>{s.wins}</em>
        </span>
      ) : s.score !== undefined ? <span className={`cs-mt-score${live ? " is-live" : ""}`}>{s.score}</span> : null}
    </div>
  );
}

function seriesFoot(m) {
  const { a, b } = m;
  if (m.winner) { const w = m.winner === a.tri ? a : b, l = w === a ? b : a; return `${w.tri} gana ${w.wins}-${l.wins}`; }
  const lead = a.wins === b.wins ? `Empate ${a.wins}-${b.wins}` : a.wins > b.wins ? `${a.tri} lidera ${a.wins}-${b.wins}` : `${b.tri} lidera ${b.wins}-${a.wins}`;
  return m.next ? `${lead} · ${day(m.next.date)}` : lead;
}

export function Match({ m, label, big, compact, onPick, picked }) {
  const live = m.status === "live";
  const series = m.a?.wins !== undefined;
  const foot = live ? <C.LiveBadge clock={m.live?.clock || m.clock} />
    : series ? seriesFoot(m)
    : m.status === "final" ? "Final"
    : m.date ? `${day(m.date)} · ${timeOf(m.date)}`
    : m.projected && m.a && m.b ? "Proyección" : "";
  const body = (
    <>
      {label ? <div className="cs-mt-label">{label}</div> : null}
      <Side s={m.a} winner={m.winner} live={live} compact={compact} need={m.need} />
      <Side s={m.b} winner={m.winner} live={live} compact={compact} need={m.need} />
      {foot ? <div className="cs-mt-foot">{foot}</div> : null}
    </>
  );
  const id = m.id || (m.live || m.next || m.games?.at(-1))?.id;
  const cls = `cs-mt${big ? " is-final" : ""}${m.projected ? " is-proj" : ""}${live ? " is-live" : ""}${picked ? " is-picked" : ""}`;
  // Una serie ya empezada abre su lista de juegos en vez de un solo partido.
  if (onPick && m.games?.length) return <button type="button" className={`${cls} cs-press`} onClick={() => onPick(m)} aria-pressed={!!picked}>{body}</button>;
  return id ? <Link href={`/partido/${id}`} className={`${cls} cs-press`}>{body}</Link> : <div className={cls}>{body}</div>;
}

// Copa del centro de la llave: el trofeo o el logo del campeón.
export function Trophy({ champion }) {
  return (
    <div className={`cs-br-trophy${champion ? " has-champ" : ""}`}>
      {champion ? <C.TeamLogo team={champion} size="lg" /> : <C.Icon name="trophy" weight={1.6} />}
    </div>
  );
}

// Los juegos de una serie de playoffs, del 1 al 7.
export function SeriesGames({ m, onClose }) {
  const ref = useRef(null);
  // La lista sale debajo de la llave: en el teléfono queda fuera de la vista si no se desplaza.
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [m]);
  return (
    <section ref={ref} className="cs-sg">
      <header>
        <b>{m.a.name || teamName(m.a.tri)} vs {m.b.name || teamName(m.b.tri)}</b>
        <span className="cs-muted">{seriesFoot(m)}</span>
        <button type="button" className="cs-icon-btn" onClick={onClose} aria-label="Cerrar"><C.Icon name="x" /></button>
      </header>
      <div className="cs-sg-list">
        {m.games.map((g, i) => (
          <Link key={g.id} href={`/partido/${g.id}`} className="cs-sg-game cs-press">
            <span className="cs-eyebrow">Juego {i + 1}</span>
            <span className="cs-muted">{day(g.date)}</span>
            {[g.away, g.home].map((t) => (
              <span key={t.tri} className={`cs-sg-team${g.winner && g.winner !== t.tri ? " is-lost" : ""}`}>
                <C.TeamLogo team={t.tri} size="xs" /><b>{t.tri}</b>
                <span className="cs-num">{g.status === "scheduled" ? "" : t.score}</span>
              </span>
            ))}
            <span className="cs-sg-st">{g.status === "live" ? <C.LiveBadge clock={g.clock} /> : g.status === "scheduled" ? timeOf(g.date) : "Final"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
