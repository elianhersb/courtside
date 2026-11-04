"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import C from "./cs";

export const seasonLabel = (y) => `${y - 1}-${String(y).slice(2)}`;

// Selector de temporada: flechas para ir a la anterior/siguiente y un panel con todas, agrupadas por década.
// En el teléfono el panel sube desde abajo; en escritorio se abre debajo del botón.
export default function SeasonPicker({ value, onChange, first, last }) {
  const [open, setOpen] = useState(false);
  const panel = useRef(null), button = useRef(null);
  const years = Array.from({ length: last - first + 1 }, (_, i) => last - i);
  const decades = [];
  for (const y of years) {
    const d = Math.floor((y - 1) / 10) * 10; // la temporada 1989-90 es de los 80: cuenta el año en que empieza
    (decades.at(-1)?.d === d ? decades.at(-1).years : (decades.push({ d, years: [] }), decades.at(-1).years)).push(y);
  }
  // En el teléfono el panel va al <body>: dentro del contenedor con scroll quedaría debajo de la barra inferior.
  const [phone, setPhone] = useState(false);
  useEffect(() => { const mq = matchMedia("(max-width: 699px)"); const f = () => setPhone(mq.matches); f(); mq.addEventListener("change", f); return () => mq.removeEventListener("change", f); }, []);
  const pick = (y) => { onChange(y); setOpen(false); button.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("[aria-selected=true]")?.scrollIntoView({ block: "center" });
    panel.current?.querySelector("[aria-selected=true]")?.focus();
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    const onDown = (e) => { if (!panel.current?.contains(e.target) && !button.current?.contains(e.target)) setOpen(false); };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown);
    return () => { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown); };
  }, [open]);

  return (
    <div className="cs-sp">
      <button type="button" className="cs-sp-step cs-press" onClick={() => onChange(value - 1)} disabled={value <= first} aria-label="Temporada anterior"><C.Icon name="back" /></button>
      <button ref={button} type="button" className="cs-sp-btn cs-press" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        <span className="cs-sp-k">Temporada</span>
        <b>{seasonLabel(value)}</b>
        <C.Icon name="next" className="cs-sp-chev" />
      </button>
      <button type="button" className="cs-sp-step cs-press" onClick={() => onChange(value + 1)} disabled={value >= last} aria-label="Temporada siguiente"><C.Icon name="next" /></button>
      {open ? ((node) => (phone ? createPortal(node, document.body) : node))(
        <>
          <div className="cs-sp-scrim" aria-hidden="true" />
          <div ref={panel} className="cs-sp-panel" role="dialog" aria-label="Elegir temporada">
            <header>
              <b>Elige una temporada</b>
              <button type="button" className="cs-icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar"><C.Icon name="x" /></button>
            </header>
            <div className="cs-sp-list">
              {decades.map(({ d, years: ys }) => (
                <section key={d}>
                  <h4>{d === Math.floor((last - 1) / 10) * 10 ? "Esta década" : `Década de ${d}`}</h4>
                  <div className="cs-sp-grid" role="listbox" aria-label={`Temporadas de ${d}`}>
                    {ys.map((y) => (
                      <button key={y} type="button" role="option" aria-selected={y === value} className={`cs-sp-opt cs-press${y === value ? " is-on" : ""}${y === last ? " is-now" : ""}`} onClick={() => pick(y)}>
                        {seasonLabel(y)}{y === last ? <small>Actual</small> : null}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
