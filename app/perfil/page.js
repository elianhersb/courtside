"use client";
import { useEffect, useState } from "react";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { COUNTRIES } from "@/lib/channels";
import { tz } from "@/lib/format";
import { pushSupported, enablePush, disablePush } from "@/lib/pushClient";
import AccountCard from "@/components/AccountCard";

const SUBS = ["disney", "espn", "leaguepass", "prime", "peacock", "meridiano", "televen", "nbc", "abc"];
const NOTIFY = [["start", "Inicio de partido", "De tus equipos favoritos"], ["end", "Resultado final", "Marcador al terminar"], ["close", "Partidos cerrados", "Diferencia ≤ 5 en el último cuarto"]];

export default function Profile() {
  const [prefs, setPrefs] = usePrefs();
  const [allTeams, setAllTeams] = useState(false);
  const [push, setPush] = useState({ busy: false, error: null });
  // Se mira en el cliente: en el servidor no hay navigator y el HTML no coincidiría.
  const [supported, setSupported] = useState(true);
  const [notice, setNotice] = useState(null);
  useEffect(() => { setSupported(pushSupported()); setNotice(new URLSearchParams(location.search).get("correo")); }, []);
  const togglePush = async (on) => {
    setPush({ busy: true, error: null });
    try {
      await (on ? enablePush(prefs) : disablePush());
      setPrefs({ push: on });
      setPush({ busy: false, error: null });
    } catch (e) {
      setPush({ busy: false, error: e.message });
    }
  };
  const toggle = (key, k) => setPrefs({ [key]: prefs[key].includes(k) ? prefs[key].filter((x) => x !== k) : [...prefs[key], k] });
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop().replace(/_/g, " ");

  return (
    <>
      <div className="cs-screen-h"><h1>Perfil</h1></div>
      <div className="cs-gut cs-stack" style={{ gap: 22 }}>
        <AccountCard key={notice || "x"} notice={notice} />
        <div className="cs-list">
          <label className="cs-li">
            <C.Icon name="globe" style={{ width: 20, height: 20, color: "var(--ink-muted)" }} />
            <div className="cs-li-main">País<div className="cs-li-sub">Define los canales de “Dónde verlo”</div></div>
            <select value={prefs.country} onChange={(e) => setPrefs({ country: e.target.value })} aria-label="País"
              style={{ background: "transparent", color: "var(--ink-muted)", border: 0, font: "inherit", fontWeight: 600 }}>
              {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <div className="cs-li">
            <C.Icon name="clock" style={{ width: 20, height: 20, color: "var(--ink-muted)" }} />
            <div className="cs-li-main">Zona horaria<div className="cs-li-sub">Automática</div></div>
            <span className="cs-muted" style={{ fontWeight: 600 }}>{zone} · {tz()}</span>
          </div>
        </div>
        <section>
          <div className="cs-row" style={{ justifyContent: "space-between" }}>
            <h3 className="cs-h">Equipos favoritos</h3>
            <span className="cs-subtle" style={{ fontSize: 12, marginBottom: 12 }}>{prefs.favs.length} seleccionados</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            {Object.keys(C.TEAMS).slice(0, allTeams ? 30 : 12).map((k) => (
              <C.PickTile key={k} on={prefs.favs.includes(k)} label={C.TEAMS[k].name} onClick={() => toggle("favs", k)}><C.TeamLogo team={k} size="md" /></C.PickTile>
            ))}
          </div>
          {allTeams ? null : <button className="cs-btn cs-btn-ghost" style={{ width: "100%", marginTop: 4 }} onClick={() => setAllTeams(true)}>Ver los 30 equipos</button>}
        </section>
        <section>
          <h3 className="cs-h">Mis suscripciones</h3>
          <p className="cs-muted" style={{ fontSize: 13, margin: "-6px 0 12px" }}>Resaltamos los partidos que puedes ver con lo que ya tienes.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {SUBS.map((k) => {
              const c = C.CHANNELS[k];
              return <C.PickTile key={k} on={prefs.subs.includes(k)} label={c.short || c.name} onClick={() => toggle("subs", k)}><C.Img label={c.name} phText={c.short || c.name} w={56} h={28} style={{ borderRadius: 6 }} /></C.PickTile>;
            })}
          </div>
        </section>
        <section>
          <h3 className="cs-h">Notificaciones</h3>
          <p className="cs-muted" style={{ fontSize: 13, margin: "-6px 0 12px" }}>
            {!supported ? "Este navegador no admite alertas. En iPhone, primero instala CourtSide en la pantalla de inicio."
              : !prefs.favs.length ? "Elige al menos un equipo favorito: las alertas son de sus partidos."
              : "Avisos de los partidos de tus equipos favoritos, aunque la app esté cerrada."}
          </p>
          <div className="cs-list">
            <div className="cs-li">
              <C.Icon name="bell" style={{ width: 20, height: 20, color: "var(--ink-muted)" }} />
              <div className="cs-li-main">Alertas en este dispositivo<div className="cs-li-sub">{push.busy ? "Un momento…" : push.error || (prefs.push ? "Activadas" : "Apagadas")}</div></div>
              <C.Switch on={prefs.push} onChange={(v) => !push.busy && supported && togglePush(v)} />
            </div>
            {NOTIFY.map(([k, title, sub]) => (
              <div className="cs-li" key={k}>
                <div className="cs-li-main">{title}<div className="cs-li-sub">{sub}</div></div>
                <C.Switch on={prefs.notify[k]} onChange={(v) => setPrefs({ notify: { ...prefs.notify, [k]: v } })} />
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="cs-h">Tema</h3>
          <C.Segmented items={[{ key: "dark", label: "Oscuro" }, { key: "light", label: "Claro" }, { key: "system", label: "Sistema" }]} value={prefs.theme} onChange={(k) => setPrefs({ theme: k })} />
        </section>
      </div>
    </>
  );
}
