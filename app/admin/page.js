"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import C from "@/components/cs";
import { useAccount } from "@/components/Shell";
import { useJson } from "@/lib/useJson";
import { post } from "@/components/AuthForm";

const PLATFORM = { android: "Android", ios: "iPhone / iPad", desktop: "Escritorio" };
const ROLE = { user: "Usuario", admin: "Administrador" };
const fmt = (n) => new Intl.NumberFormat("es-VE").format(n);
const dayLabel = (d) => new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d));
const when = (ms) => (ms ? new Intl.DateTimeFormat("es-VE", { dateStyle: "medium" }).format(new Date(ms)) : "—");

function Tile({ label, value, sub }) {
  return (
    <div className="cs-adm-tile">
      <span className="cs-eyebrow">{label}</span>
      <b>{fmt(value)}</b>
      {sub ? <span className="cs-muted">{sub}</span> : null}
    </div>
  );
}

// Barras por día de una sola serie: el título la nombra, sin leyenda. Cada barra muestra su valor al pasar el mouse o enfocar.
function Bars({ title, data }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((s, d) => s + d.n, 0);
  return (
    <section className="cs-adm-card">
      <header><h3>{title}</h3><span className="cs-muted">{fmt(total)} en 30 días</span></header>
      <div className="cs-adm-bars" role="img" aria-label={`${title}: ${fmt(total)} en 30 días`}>
        {data.map((d) => (
          <div key={d.day} className="cs-adm-bar" tabIndex={0} aria-label={`${dayLabel(d.day)}: ${d.n}`}>
            <i style={{ height: `${(d.n / max) * 100}%` }} className={d.n ? "" : "is-zero"} />
            <span className="cs-adm-tip"><b>{fmt(d.n)}</b>{dayLabel(d.day)}</span>
          </div>
        ))}
      </div>
      <div className="cs-adm-axis"><span>{dayLabel(data[0].day)}</span><span>Hoy</span></div>
    </section>
  );
}

function Overview() {
  const { data, error } = useJson("/api/admin/stats", 60000);
  if (error) return <div className="cs-error">{error}</div>;
  if (!data) return <div className="cs-adm-tiles">{[0, 1, 2, 3].map((i) => <div key={i} className="cs-adm-tile"><C.Skeleton w="100%" h={60} r={10} /></div>)}</div>;
  const d = data.devices, u = data.users;
  return (
    <div className="cs-stack" style={{ gap: 18 }}>
      <div className="cs-adm-tiles">
        <Tile label="Instalaciones" value={d.installed} sub={`de ${fmt(d.total)} dispositivos`} />
        <Tile label="Activos hoy" value={d.active1} sub={`${fmt(d.active7)} en 7 días · ${fmt(d.active30)} en 30`} />
        <Tile label="Cuentas" value={u.total} sub={`${fmt(u.new7)} nuevas en 7 días`} />
        <Tile label="Con alertas" value={data.push.subs} sub={`${fmt(data.push.sent7)} avisos en 7 días`} />
        <Tile label="Preguntas al asistente" value={data.chat.today} sub={`hoy · ${fmt(data.chat.last7)} en 7 días`} />
      </div>
      <div className="cs-adm-grid">
        <Bars title="Dispositivos nuevos por día" data={data.series.devices} />
        <Bars title="Instalaciones por día" data={data.series.installs} />
        <Bars title="Cuentas nuevas por día" data={data.series.signups} />
        <Bars title="Preguntas al asistente por día" data={data.series.chat} />
      </div>
      <div className="cs-adm-grid">
        <section className="cs-adm-card">
          <header><h3>Plataformas</h3></header>
          <table className="cs-adm-table">
            <thead><tr><th>Plataforma</th><th>Dispositivos</th><th>Instaladas</th></tr></thead>
            <tbody>{d.platforms.map((p) => <tr key={p.platform}><td>{PLATFORM[p.platform] || p.platform}</td><td>{fmt(p.n)}</td><td>{fmt(p.installed)}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="cs-adm-card">
          <header><h3>Cuentas</h3></header>
          <table className="cs-adm-table">
            <tbody>
              <tr><td>Correo confirmado</td><td>{fmt(u.verified)}</td></tr>
              <tr><td>Entran con Google</td><td>{fmt(u.google)}</td></tr>
              <tr><td>Administradores</td><td>{fmt(u.admins)}</td></tr>
            </tbody>
          </table>
        </section>
        <section className="cs-adm-card">
          <header><h3>Equipos más seguidos</h3><span className="cs-muted">cuentas y alertas</span></header>
          {data.teams.length ? (
            <ol className="cs-adm-teams">
              {data.teams.map((t) => <li key={t.tri}><C.TeamLogo team={t.tri} size="xs" /><b>{C.TEAMS[t.tri]?.name || t.tri}</b><span className="cs-num">{fmt(t.n)}</span></li>)}
            </ol>
          ) : <p className="cs-muted" style={{ margin: 0, fontSize: 13 }}>Todavía nadie eligió favoritos.</p>}
        </section>
      </div>
      <p className="cs-subtle" style={{ fontSize: 12, margin: 0 }}>
        Una instalación es un dispositivo que abrió CourtSide desde la pantalla de inicio o aceptó instalarla. Los dispositivos se cuentan con un id anónimo guardado en el navegador: borrar los datos del sitio cuenta como uno nuevo.
      </p>
    </div>
  );
}

function Users({ me }) {
  const [q, setQ] = useState(""), [search, setSearch] = useState("");
  const [tick, setTick] = useState(0), [msg, setMsg] = useState(null);
  const { data, error } = useJson(`/api/admin/users?q=${encodeURIComponent(search)}&t=${tick}`);
  useEffect(() => { const t = setTimeout(() => setSearch(q), 300); return () => clearTimeout(t); }, [q]);
  const change = async (id, patch) => {
    setMsg(null);
    try { await post("/api/admin/users", { id, ...patch }, "PATCH"); setTick((t) => t + 1); } catch (e) { setMsg(e.message); }
  };
  const canManage = me.perms.includes("users.manage");
  return (
    <div className="cs-stack" style={{ gap: 12 }}>
      <C.SearchField placeholder="Buscar por correo o nombre" value={q} onChange={setQ} />
      {msg ? <div className="cs-form-error">{msg}</div> : null}
      {error ? <div className="cs-error">{error}</div> : !data ? <C.Skeleton w="100%" h={200} r={12} /> : (
        <div className="cs-adm-card cs-adm-scroll">
          <table className="cs-adm-table cs-adm-users">
            <thead><tr><th>Cuenta</th><th>Acceso</th><th>Creada</th><th>Última vez</th><th>Rol</th><th>Estado</th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className={u.disabled ? "is-off" : ""}>
                  <td><b>{u.name || "—"}</b><br /><span className="cs-muted">{u.email}</span>{u.verified ? null : <em className="cs-adm-flag">sin confirmar</em>}</td>
                  <td>{[u.google && "Google", u.password && "Clave"].filter(Boolean).join(" · ")}</td>
                  <td>{when(u.created_at)}</td>
                  <td>{when(u.last_login_at)}</td>
                  <td>
                    {canManage && u.id !== me.id ? (
                      <select value={u.role} onChange={(e) => change(u.id, { role: e.target.value })} aria-label={`Rol de ${u.email}`}>
                        {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : ROLE[u.role] || u.role}
                  </td>
                  <td>
                    {canManage && u.id !== me.id ? (
                      <button className="cs-btn cs-btn-secondary cs-adm-mini" onClick={() => change(u.id, { disabled: !u.disabled })}>{u.disabled ? "Reactivar" : "Desactivar"}</button>
                    ) : u.id === me.id ? "Tú" : u.disabled ? "Desactivada" : "Activa"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.users.length ? <p className="cs-muted" style={{ padding: 14, margin: 0 }}>No hay cuentas que coincidan.</p> : null}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user, ready } = useAccount();
  const [tab, setTab] = useState("overview");
  if (!ready) return <div className="cs-gut"><C.Skeleton w="100%" h={120} r={12} /></div>;
  if (!user?.perms.includes("admin.view")) {
    return (
      <>
        <div className="cs-screen-h"><h1>Panel</h1></div>
        <div className="cs-gut cs-auth">
          <div className="cs-auth-ok"><b>Sin acceso</b><p className="cs-muted">Esta sección es solo para administradores.</p><Link className="cs-auth-link" href={user ? "/perfil" : "/cuenta"}>{user ? "Volver al perfil" : "Entrar"}</Link></div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="cs-screen-h"><h1>Panel</h1></div>
      <div className="cs-gut"><C.Tabs items={[{ key: "overview", label: "Resumen" }, { key: "users", label: "Usuarios" }]} value={tab} onChange={setTab} /></div>
      <div className="cs-gut" style={{ marginTop: 16 }}>{tab === "overview" ? <Overview /> : <Users me={user} />}</div>
    </>
  );
}
