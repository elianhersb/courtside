"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { useJson } from "@/lib/useJson";
import { channelsFor } from "@/lib/channels";
import { dayList, longDay, timeOf, tz } from "@/lib/format";

export default function Today() {
  const router = useRouter();
  const [prefs, setPrefs] = usePrefs();
  const days = useMemo(() => dayList(), []);
  const [day, setDay] = useState(days[1].key);
  const [filter, setFilter] = useState("all");
  const live = useRef(false);
  const { data, error, loading, at } = useJson(`/api/scoreboard?date=${day}`, () => (live.current ? 15000 : 60000));

  const games = (data || []).map((g) => {
    const channels = channelsFor(g.broadcasts, prefs.country);
    return { ...g, time: g.status === "scheduled" ? timeOf(g.date) : undefined, tz: tz(), channels, watchable: channels.some((c) => prefs.subs.includes(c)) };
  });
  live.current = games.some((g) => g.status === "live");
  const isFav = (g) => prefs.favs.includes(g.away.tri) || prefs.favs.includes(g.home.tri);
  const toggle = (g) => {
    const on = isFav(g);
    setPrefs({ favs: on ? prefs.favs.filter((t) => t !== g.away.tri && t !== g.home.tri) : [...prefs.favs, g.home.tri] });
  };
  const list = games.filter((g) => filter === "all" || isFav(g));
  const sel = days.find((d) => d.key === day);
  const offline = error && data;

  let idx = 0;
  const section = (title, status) => {
    const items = list.filter((g) => g.status === status);
    if (!items.length) return null;
    return (
      <div key={status} className="cs-stack" style={{ gap: 14 }}>
        <div className="cs-eyebrow" style={{ margin: "8px 4px 0" }}>{title}</div>
        {items.map((g) => (
          <C.GameCard key={g.id} game={g} index={idx++} owned={prefs.subs} favorite={isFav(g)} onToggleFav={() => toggle(g)} onPress={() => router.push(`/partido/${g.id}`)} />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="cs-screen-h">
        <div>
          <h1>{sel.label === "Ayer" || sel.label === "Hoy" ? sel.label : longDay(sel.date)}</h1>
          <div className="cs-muted" style={{ fontSize: 13, marginTop: 2 }}>{longDay(sel.date)} · tu hora local ({tz()})</div>
        </div>
        <Link href="/perfil" className="cs-iconbtn" aria-label="Notificaciones" style={{ color: "inherit" }}><C.Icon name="bell" /></Link>
      </div>
      <div className="cs-gut">
        <C.DatePicker days={days} value={day} onChange={setDay} />
      </div>
      <div className="cs-gut cs-row" style={{ justifyContent: "space-between", margin: "14px 0 6px" }}>
        <C.Segmented items={[{ key: "all", label: "Todos" }, { key: "mine", label: "Mis equipos" }]} value={filter} onChange={setFilter} />
        <span className="cs-watch-flag"><C.Icon name="tv" style={{ width: 14, height: 14 }} />= con tus suscripciones</span>
      </div>
      {offline ? (
        <div className="cs-gut" style={{ marginTop: 8 }}>
          <C.OfflineBanner time={at ? timeOf(at) : ""} onRetry={() => location.reload()} />
        </div>
      ) : null}
      {loading ? (
        <>
          <C.PullToRefresh />
          <div className="cs-gut cs-stack" style={{ gap: 20, marginTop: 8 }}>
            <C.GameCardSkeleton /><C.GameCardSkeleton /><C.GameCardSkeleton />
          </div>
        </>
      ) : error && !data ? (
        <C.EmptyState kind="offline" title="No pudimos cargar los partidos" body={error} action={<C.Button variant="secondary" onClick={() => location.reload()}>Reintentar</C.Button>} />
      ) : !list.length ? (
        <C.EmptyState
          title={filter === "mine" && games.length ? "Tus equipos no juegan este día" : "No hay partidos este día"}
          body={filter === "mine" && games.length ? "Cambia a “Todos” o sigue más equipos con la estrella." : "La liga descansa. Mira lo que viene mañana o revisa los resultados de ayer."}
          action={<C.Button variant="secondary" onClick={() => { const i = days.findIndex((d) => d.key === day); setDay(days[Math.min(i + 1, days.length - 1)].key); }}>Ver el día siguiente</C.Button>}
        />
      ) : (
        <div className="cs-gut cs-stack" style={{ gap: 14, marginTop: 8 }}>
          {section("En vivo", "live")}
          {section("Próximos", "scheduled")}
          {section("Finalizados", "final")}
        </div>
      )}
    </>
  );
}
