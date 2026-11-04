"use client";
import { useEffect, useState } from "react";

// GET con refresco periódico; conserva el último dato si una actualización falla (sin conexión).
export function useJson(url, every = 0) {
  const [state, set] = useState({ data: null, error: null, loading: !!url });
  useEffect(() => {
    if (!url) return;
    let alive = true, timer;
    set((s) => ({ ...s, loading: true, data: null, error: null }));
    const load = async () => {
      try {
        const r = await fetch(url);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
        if (alive) set({ data: j, error: null, loading: false, at: new Date() });
      } catch (e) {
        if (alive) set((s) => ({ ...s, error: e.message, loading: false }));
      }
      const ms = typeof every === "function" ? every() : every;
      if (alive && ms) timer = setTimeout(load, ms);
    };
    load();
    return () => { alive = false; clearTimeout(timer); };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
