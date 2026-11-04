"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import C from "./cs";
import { ChatProvider, ChatFab } from "./Chat";

const DEFAULTS = { favs: [], subs: ["leaguepass"], country: "VE", theme: "dark", notify: { start: true, end: false, close: true } };
const KEY = "courtside:prefs";
const Prefs = createContext([DEFAULTS, () => {}]);
export const usePrefs = () => useContext(Prefs);

const TABS = { hoy: "/", jugadores: "/jugadores", copa: "/copa", asistente: "/asistente", perfil: "/perfil" };
const tabOf = (path) => Object.keys(TABS).find((k) => k !== "hoy" && path.startsWith(TABS[k])) || "hoy";

function read() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULTS; }
}

export default function Shell({ children }) {
  const path = usePathname(), router = useRouter();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [install, setInstall] = useState(null); // null | "ios" | "android"
  const [deferred, setDeferred] = useState(null);

  useEffect(() => { setPrefs(read()); }, []);
  const update = (patch) => setPrefs((p) => {
    const next = { ...p, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  });

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
    </Prefs.Provider>
  );
}
