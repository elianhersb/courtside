"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";

// La búsqueda de ESPN da el nombre completo del equipo ("Los Angeles Lakers"); se cruza con el apodo.
const triOf = (teamName) => Object.values(C.TEAMS).find((t) => teamName.endsWith(t.name))?.tri;
const TABS = [{ key: "best", label: "Líderes" }, { key: "worst", label: "Lo peor" }, { key: "injuries", label: "Lesionados" }];
const shortDate = (ymd) => new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short" }).format(new Date(`${ymd}T12:00:00`));

function Row({ x, i }) {
  const team = x.team || triOf(x.teamName);
  const sub = [x.teamName, x.pos, x.num && `#${x.num}`].filter(Boolean).join(" · ");
  return (
    <Link href={`/jugadores/${x.id}`} className="cs-li cs-press cs-enter" style={{ width: "100%", textDecoration: "none", color: "inherit", "--i": i }}>
      <C.PlayerAvatar id={x.id} name={x.name} size="md" team={team} />
      <div className="cs-li-main">
        <div style={{ fontWeight: 600 }}>{x.name}</div>
        <div className="cs-li-sub cs-row" style={{ gap: 6 }}>{team ? <C.TeamLogo team={team} size="xs" /> : null}{sub}</div>
      </div>
      <C.Icon name="next" style={{ width: 18, height: 18, color: "var(--ink-subtle)" }} />
    </Link>
  );
}

// Destacado: el líder de una categoría con foto grande sobre el color de su equipo.
function Spot({ board, bad, i }) {
  const top = board.players[0];
  if (!top) return null;
  const t = C.TEAMS[top.team] || {};
  const pct = board.unit === "%";
  return (
    <Link href={`/jugadores/${top.id}`} className={`cs-spot cs-press${bad ? " is-bad" : ""}`} style={{ "--c": t.color || "var(--brand)", "--c2": t.color2 || "var(--surface)", "--i": i }}>
      <img src={C.headshotUrl(top.id)} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
      <span className="cs-spot-logo"><C.TeamLogo team={top.team} size="md" /></span>
      <div className="cs-spot-info">
        <span className="cs-eyebrow">{board.title}</span>
        <b className="cs-spot-v"><C.CountUp value={top.value} decimals={1} suffix={pct ? "%" : ""} />{pct ? null : <small>{board.unit}</small>}</b>
        <span className="cs-spot-name">{top.name}</span>
      </div>
    </Link>
  );
}

function LeaderCard({ board, bad, i }) {
  const [top, ...rest] = board.players;
  if (!top) return null;
  const t = C.TEAMS[top.team] || {};
  const pct = board.unit === "%";
  return (
    <section className={`cs-lead${bad ? " is-bad" : ""}`} style={{ "--c": t.color || "var(--brand)", "--i": i }}>
      <div className="cs-eyebrow">{board.title}</div>
      <Link href={`/jugadores/${top.id}`} className="cs-lead-top cs-press">
        <C.PlayerAvatar id={top.id} name={top.name} size="lg" team={top.team} />
        <div style={{ minWidth: 0 }}>
          <div className="cs-lead-name">{top.name}</div>
          <div className="cs-row cs-muted" style={{ gap: 6, fontSize: 12, marginTop: 4 }}><C.TeamLogo team={top.team} size="xs" />{t.name || top.team}</div>
        </div>
        <div className="cs-lead-v"><C.CountUp value={top.value} decimals={1} suffix={pct ? "%" : ""} /><small>{pct ? "" : board.unit}</small></div>
      </Link>
      <ol>
        {rest.map((p, j) => (
          <li key={p.id}>
            <Link href={`/jugadores/${p.id}`} className="cs-press">
              <span className="cs-lead-rank">{j + 2}</span>
              <C.PlayerAvatar id={p.id} name={p.name} size="sm" team={p.team} />
              <span className="cs-lead-row-name">{p.name}</span>
              <C.TeamLogo team={p.team} size="xs" />
              <b>{p.value.toFixed(1)}{pct ? "%" : ""}</b>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Injuries({ list, favs }) {
  const [filter, setFilter] = useState("all");
  const shown = filter === "mine" ? list.filter((x) => favs.includes(x.team)) : list;
  const out = shown.filter((x) => x.out).length;
  return (
    <div className="cs-stack" style={{ gap: 14 }}>
      <div className="cs-inj-top">
        <C.Segmented items={[{ key: "all", label: "Toda la liga" }, { key: "mine", label: "Mis equipos" }]} value={filter} onChange={setFilter} />
        <div className="cs-inj-sum">
          <span><b>{shown.length}</b> reportados</span>
          <span className="is-out"><b>{out}</b> fuera</span>
          <span className="is-dtd"><b>{shown.length - out}</b> en duda</span>
        </div>
      </div>
      {shown.length ? (
        <div className="cs-inj-grid">
          {shown.map((x, i) => (
            <Link key={x.id + x.date} href={`/jugadores/${x.id}`} className={`cs-li cs-inj cs-press cs-enter${x.out ? " is-out" : ""}`} style={{ width: "100%", textDecoration: "none", color: "inherit", "--i": Math.min(i, 12), "--c": (C.TEAMS[x.team] || {}).color, alignItems: "flex-start" }}>
              <C.PlayerAvatar id={x.id} name={x.name} size="md" team={x.team} />
              <div className="cs-li-main">
                <div className="cs-row" style={{ gap: 8, justifyContent: "space-between", flexWrap: "nowrap" }}>
                  <span style={{ fontWeight: 650 }}>{x.name}</span>
                  <span className={`cs-badge${x.out ? "" : " is-dtd"}`}>{x.status}</span>
                </div>
                <div className="cs-li-sub cs-row" style={{ gap: 6 }}>
                  <C.TeamLogo team={x.team} size="xs" />{(C.TEAMS[x.team] || {}).name || x.team}{x.pos ? ` · ${x.pos}` : ""}
                </div>
                <div className="cs-inj-detail">
                  {x.injury ? <span>{x.injury}</span> : null}
                  {x.returnDate ? <span>Regreso estimado: <b>{shortDate(x.returnDate)}</b></span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : <C.EmptyState title={filter === "mine" ? "Tus equipos no tienen lesionados" : "No hay lesionados reportados"} body={filter === "mine" ? "Buenas noticias. Revisa “Toda la liga” para ver el resto." : "La enfermería está vacía."} />}
    </div>
  );
}

export default function Players() {
  const [prefs] = usePrefs();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [tab, setTab] = useState("best");
  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const searching = term.length >= 2;
  const search = useJson(searching ? `/api/players?q=${encodeURIComponent(term)}` : null);
  const leaders = useJson("/api/leaders");
  const injuries = useJson(tab === "injuries" ? "/api/injuries" : null);

  const skeleton = <div className="cs-leads">{[0, 1, 2, 3].map((i) => <div key={i} className="cs-lead"><C.Skeleton w={90} /><div className="cs-row" style={{ margin: "14px 0", flexWrap: "nowrap" }}><C.Skeleton w={64} h={64} r={32} /><C.Skeleton w={140} /></div><C.Skeleton w="100%" h={100} r={12} /></div>)}</div>;

  let body;
  if (searching) {
    body = search.loading ? <div className="cs-list">{[0, 1, 2].map((i) => <div key={i} className="cs-li"><C.Skeleton w={44} h={44} r={22} /><C.Skeleton w={160} /></div>)}</div>
      : search.error ? <div className="cs-error">{search.error}</div>
      : search.data?.length ? <div className="cs-list">{search.data.map((x, i) => <Row key={x.id} x={x} i={i} />)}</div>
      : <div className="cs-muted" style={{ padding: "8px 4px" }}>No encontramos jugadores con ese nombre.</div>;
  } else if (tab === "injuries") {
    body = injuries.error ? <div className="cs-error">{injuries.error}</div> : injuries.data ? <Injuries list={injuries.data} favs={prefs.favs} /> : skeleton;
  } else {
    const boards = leaders.data?.[tab];
    body = leaders.error ? <div className="cs-error">{leaders.error}</div>
      : boards ? (
        <>
          {tab === "worst" ? <p className="cs-muted" style={{ fontSize: 13, margin: "0 4px 12px" }}>Entre los jugadores con suficientes partidos y tiros para calificar.</p> : null}
          <div className="cs-spots">{boards.slice(0, 4).map((b, i) => <Spot key={b.key + tab} board={b} bad={tab === "worst"} i={i} />)}</div>
          <div className="cs-eyebrow" style={{ margin: "22px 4px 10px" }}>Top 5 por categoría</div>
          <div className="cs-leads">{boards.map((b, i) => <LeaderCard key={b.key + tab} board={b} bad={tab === "worst"} i={i} />)}</div>
        </>
      ) : skeleton;
  }

  return (
    <>
      <div className="cs-pl-head">
        <div className="cs-screen-h"><div><h1>Jugadores</h1><div className="cs-muted" style={{ fontSize: 13, marginTop: 2 }}>Temporada regular · promedios por partido</div></div></div>
        <div className="cs-gut cs-pl-search"><C.SearchField placeholder="Busca un jugador por nombre" value={q} onChange={setQ} /></div>
      </div>
      {searching ? (
        <div className="cs-gut" style={{ marginTop: 16 }}>
          <div className="cs-eyebrow" style={{ margin: "0 4px 8px" }}>Resultados para “{term}”{search.data ? ` · ${search.data.length}` : ""}</div>
          {body}
        </div>
      ) : (
        <>
          <div className="cs-gut" style={{ marginTop: 12 }}><C.Tabs items={TABS} value={tab} onChange={setTab} /></div>
          <div className="cs-gut" style={{ marginTop: 14 }}>{body}</div>
        </>
      )}
    </>
  );
}
