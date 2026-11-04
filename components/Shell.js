"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import C from "./cs";
import { ChatProvider, ChatFab } from "./Chat";
import { syncPush } from "@/lib/pushClient";

const DEFAULTS = { favs: [], subs: ["leaguepass"], country: "VE", theme: "dark", notify: { start: true, end: false, close: true }, push: false };
const KEY = "courtside:prefs";
const Prefs = createContext([DEFAULTS, () => {}]);
export const usePrefs = () => useContext(Prefs);
// Cuenta opcional: { user, ready, refresh, logout }. Sin cuenta la app funciona igual, con la configuración en el navegador.
const Account = createContext({ user: null, ready: false, refresh: async () => {}, logout: async () => {} });
export const useAccount = () => useContext(Account);

const TABS = { hoy: "/", jugadores: "/jugadores", liga: "/temporada", asistente: "/asistente", perfil: "/perfil" };
const tabOf = (path) => (path.startsWith("/copa") ? "liga" : path.startsWith("/cuenta") || path.startsWith("/admin") ? "perfil" : Object.keys(TABS).find((k) => k !== "hoy" && path.startsWith(TABS[k])) || "hoy");

// Id anónimo del dispositivo para contar instalaciones y visitas; no contiene datos personales.
function deviceId() {
  try {
    let id = localStorage.getItem("courtside:device");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("courtside:device", id); }
    return id;
  } catch { return null; }
}
const platform = () => (/android/i.test(navigator.userAgent) ? "android" : /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "desktop");
const track = (extra) => {
  const id = deviceId();
  if (!id) return;
  const standalone = matchMedia("(display-mode: standalone)").matches || !!navigator.standalone;
  fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, platform: platform(), standalone, ...extra }), keepalive: true }).catch(() => {});
};

function read() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULTS; }
}

export default function Shell({ children }) {
  const path = usePathname(), router = useRouter();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [install, setInstall] = useState(null); // null | "ios" | "android"
  const [deferred, setDeferred] = useState(null);

  const [account, setAccount] = useState({ user: null, ready: false });
  const synced = useRef(false);

  const update = (patch) => setPrefs((p) => {
    const next = { ...p, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  // Al entrar: si la cuenta ya tiene configuración guardada, manda esa; si no, se sube la de este navegador.
  const refresh = async () => {
    const r = await fetch("/api/me").then((x) => x.json()).catch(() => ({ user: null }));
    if (r.user && r.prefs) update({ ...r.prefs, push: read().push });
    synced.current = !!r.user && !!r.prefs;
    setAccount({ user: r.user, ready: true });
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    synced.current = false;
    setAccount({ user: null, ready: true });
  };

  useEffect(() => { setPrefs(read()); refresh(); track(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Con sesión, cada cambio de configuración se guarda en la cuenta (sin el estado de las alertas, que es de cada dispositivo).
  useEffect(() => {
    if (!account.user) return;
    const t = setTimeout(() => {
      const { push, ...rest } = prefs; // eslint-disable-line no-unused-vars
      fetch("/api/me", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefs: rest }) }).catch(() => {});
      synced.current = true;
    }, synced.current ? 800 : 0);
    return () => clearTimeout(t);
  }, [account.user, prefs]);

  // Con las alertas activas, el servidor necesita saber los equipos y avisos elegidos.
  useEffect(() => {
    if (!prefs.push) return;
    const t = setTimeout(() => syncPush(prefs).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [prefs.push, prefs.favs, prefs.notify]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const apply = () => {
      const dark = prefs.theme === "system" ? matchMedia("(prefers-color-scheme: dark)").matches : prefs.theme !== "light";
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    };
    apply();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [prefs.theme]);

  useEffect(() => {
    // Solo en producción: en desarrollo los archivos de /_next/static no llevan hash y el caché serviría código viejo.
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
      else navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    }
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    let dismissed = false;
    try { dismissed = !!localStorage.getItem("courtside:install-dismissed"); } catch {}
    if (standalone || dismissed) return;
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); setInstall("android"); };
    addEventListener("appinstalled", () => track({ installed: true }), { once: true });
    addEventListener("beforeinstallprompt", onPrompt);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const t = ios ? setTimeout(() => setInstall("ios"), 4000) : null;
    return () => { removeEventListener("beforeinstallprompt", onPrompt); clearTimeout(t); };
  }, []);

  const closeInstall = () => {
    setInstall(null);
    try { localStorage.setItem("courtside:install-dismissed", "1"); } catch {}
  };
  const doInstall = async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => {}); }
    setDeferred(null);
    closeInstall();
  };

  return (
    <Prefs.Provider value={[prefs, update]}>
    <Account.Provider value={{ ...account, refresh, logout }}>
      <ChatProvider>
      <div className="cs-app">
        <div className="cs-desk-only"><C.SideRail value={tabOf(path)} onChange={(k) => router.push(TABS[k])} /></div>
        <div className="cs-phone-scroll" key={path}>{children}</div>
        {path.startsWith("/asistente") ? null : <ChatFab />}
        <div className="cs-phone-nav">
          <C.BottomNav value={tabOf(path)} onChange={(k) => router.push(TABS[k])} />
        </div>
        {install ? (
          <>
            <div style={{ position: "fixed", inset: 0, background: "var(--scrim)", zIndex: 50, animation: "cs-fade-only var(--dur-base) var(--ease-out) both" }} onClick={closeInstall} />
            <div style={{ position: "fixed", left: 10, right: 10, bottom: 24, zIndex: 60, maxWidth: 440, margin: "0 auto" }}>
              <C.InstallPrompt platform={install} onClose={closeInstall} onInstall={doInstall} />
            </div>
          </>
        ) : null}
      </div>
      </ChatProvider>
    </Account.Provider>
    </Prefs.Provider>
  );
}
