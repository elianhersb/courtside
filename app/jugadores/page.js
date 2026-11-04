"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import C from "@/components/cs";
import { useJson } from "@/lib/useJson";

// La búsqueda de ESPN da el nombre completo del equipo ("Los Angeles Lakers"); se cruza con el apodo.
const triOf = (teamName) => Object.values(C.TEAMS).find((t) => teamName.endsWith(t.name))?.tri;

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

export default function Players() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const searching = term.length >= 2;
  const { data, error, loading } = useJson(`/api/players${searching ? `?q=${encodeURIComponent(term)}` : ""}`);

  return (
    <>
      <div className="cs-screen-h"><h1>Jugadores</h1></div>
      <div className="cs-gut"><C.SearchField placeholder="Busca por nombre" value={q} onChange={setQ} /></div>
      <div className="cs-gut" style={{ marginTop: 16 }}>
        <div className="cs-eyebrow" style={{ margin: "0 4px 8px" }}>{searching ? `Resultados para “${term}”${data ? ` · ${data.length}` : ""}` : "Populares"}</div>
        {error ? <div className="cs-error">{error}</div> : null}
        {loading ? (
          <div className="cs-list">{[0, 1, 2, 3].map((i) => <div key={i} className="cs-li"><C.Skeleton w={44} h={44} r={22} /><C.Skeleton w={160} /></div>)}</div>
        ) : data?.length ? (
          <div className="cs-list">{data.map((x, i) => <Row key={x.id} x={x} i={i} />)}</div>
        ) : searching ? <div className="cs-muted" style={{ padding: "8px 4px" }}>No encontramos jugadores con ese nombre.</div> : null}
      </div>
    </>
  );
}
