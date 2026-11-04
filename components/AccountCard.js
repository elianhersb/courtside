"use client";
import { useState } from "react";
import Link from "next/link";
import C from "./cs";
import { useAccount } from "./Shell";
import { post } from "./AuthForm";

// Bloque de cuenta al inicio del perfil: invitación a entrar, o los datos de la cuenta con sus acciones.
export default function AccountCard({ notice }) {
  const { user, ready, logout, refresh } = useAccount();
  const [msg, setMsg] = useState(notice === "ok" ? "Listo: tu correo quedó confirmado." : notice === "vencido" ? "Ese enlace venció o ya se usó." : null);
  if (!ready) return <div className="cs-acct"><C.Skeleton w="100%" h={64} r={12} /></div>;
  if (!user) {
    return (
      <div className="cs-acct is-guest">
        <div className="cs-acct-ic"><C.Icon name="profile" /></div>
        <div className="cs-acct-main"><b>Guarda tu configuración</b><span className="cs-muted">Crea una cuenta opcional para tener tus equipos y alertas en todos tus dispositivos.</span></div>
        <div className="cs-acct-actions">
          <Link className="cs-btn cs-btn-primary cs-press" href="/cuenta">Entrar</Link>
          <Link className="cs-btn cs-btn-secondary cs-press" href="/cuenta?modo=registro">Crear cuenta</Link>
        </div>
      </div>
    );
  }
  const resend = async () => { try { await post("/api/auth/verify", {}); setMsg("Te enviamos el correo de confirmación."); } catch (e) { setMsg(e.message); } };
  const remove = async () => {
    if (!confirm("¿Borrar tu cuenta? Se borran tus datos guardados; la configuración de este navegador se mantiene.")) return;
    try { await post("/api/me", {}, "DELETE"); await refresh(); } catch (e) { setMsg(e.message); }
  };
  return (
    <div className="cs-stack" style={{ gap: 10 }}>
      <div className="cs-acct">
        <div className="cs-acct-ic is-user">{(user.name || user.email)[0].toUpperCase()}</div>
        <div className="cs-acct-main">
          <b>{user.name || user.email.split("@")[0]}{user.role === "admin" ? <em className="cs-acct-role">Admin</em> : null}</b>
          <span className="cs-muted">{user.email}{user.google ? " · Google" : ""}</span>
        </div>
      </div>
      {msg ? <div className="cs-auth-ok" role="status">{msg}</div> : null}
      <div className="cs-list">
        {!user.verified ? (
          <button className="cs-li cs-li-btn" onClick={resend}>
            <C.Icon name="bell" style={{ width: 20, height: 20, color: "var(--star)" }} />
            <div className="cs-li-main">Confirma tu correo<div className="cs-li-sub">Hace falta para recuperar tu clave. Toca para reenviar el correo.</div></div>
          </button>
        ) : null}
        <div className="cs-li">
          <C.Icon name="check" style={{ width: 20, height: 20, color: "var(--ink-muted)" }} />
          <div className="cs-li-main">Configuración guardada en tu cuenta<div className="cs-li-sub">Equipos, suscripciones, país, avisos y tema</div></div>
        </div>
        {user.perms.includes("admin.view") ? (
          <Link className="cs-li cs-li-btn" href="/admin">
            <C.Icon name="chart" style={{ width: 20, height: 20, color: "var(--brand-ink)" }} />
            <div className="cs-li-main">Panel de administración<div className="cs-li-sub">Instalaciones, usuarios y uso</div></div>
            <C.Icon name="next" style={{ width: 18, height: 18, color: "var(--ink-subtle)" }} />
          </Link>
        ) : null}
        {!user.hasPassword ? (
          <Link className="cs-li cs-li-btn" href="/cuenta/recuperar">
            <C.Icon name="lock" style={{ width: 20, height: 20, color: "var(--ink-muted)" }} />
            <div className="cs-li-main">Crear una clave<div className="cs-li-sub">Para entrar también con tu correo, sin Google</div></div>
          </Link>
        ) : null}
        <button className="cs-li cs-li-btn" onClick={logout}>
          <C.Icon name="logout" style={{ width: 20, height: 20, color: "var(--ink-muted)" }} />
          <div className="cs-li-main">Cerrar sesión</div>
        </button>
        <button className="cs-li cs-li-btn is-danger" onClick={remove}>
          <div className="cs-li-main">Borrar mi cuenta</div>
        </button>
      </div>
    </div>
  );
}
