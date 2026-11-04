"use client";
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
function Side({ s, winner, live, compact }) {
  if (!s) return <div className="cs-mt-side is-tbd"><span className="cs-mt-logo" /><b>Por definir</b></div>;
  const lost = winner && winner !== s.tri;
  return (
    <div className={`cs-mt-side${winner === s.tri ? " is-win" : ""}${lost ? " is-lost" : ""}`}>
      {s.seed ? <span className="cs-mt-seed">{s.seed}</span> : null}
      <C.TeamLogo team={s.tri} size="sm" />
      <b>{compact ? s.tri : teamName(s.tri)}</b>
      {s.wins !== undefined ? (
        <span className="cs-mt-wins" aria-label={`${s.wins} victorias`}>
          {[0, 1, 2, 3].map((i) => <i key={i} className={i < s.wins ? "is-on" : ""} />)}<em>{s.wins}</em>
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

export function Match({ m, label, big, compact }) {
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
      <Side s={m.a} winner={m.winner} live={live} compact={compact} />
      <Side s={m.b} winner={m.winner} live={live} compact={compact} />
      {foot ? <div className="cs-mt-foot">{foot}</div> : null}
    </>
  );
  const id = m.id || (m.live || m.next || m.games?.at(-1))?.id;
  const cls = `cs-mt${big ? " is-final" : ""}${m.projected ? " is-proj" : ""}${live ? " is-live" : ""}`;
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
