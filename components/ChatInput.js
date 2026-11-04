"use client";
import { useRef, useState } from "react";
import C from "./cs";

const MAX = 500;

// Campo del asistente: crece con el texto, Enter envía y Shift+Enter hace salto de línea.
export default function ChatInput({ onSend, busy, placeholder = "Pregunta lo que quieras de la NBA…" }) {
  const [v, setV] = useState("");
  const ref = useRef(null);
  const send = () => {
    const t = v.trim();
    if (!t || busy) return;
    onSend(t);
    setV("");
    if (ref.current) ref.current.style.height = "";
  };
  const grow = (el) => { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; };

  return (
    <form className={`cs-input${busy ? " is-busy" : ""}`} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <span className="cs-input-ic" aria-hidden="true"><C.Icon name="assistant" /></span>
      <textarea
        ref={ref} rows={1} value={v} maxLength={MAX} placeholder={placeholder} aria-label="Mensaje para el asistente"
        onChange={(e) => { setV(e.target.value); grow(e.target); }}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
      />
      {v.length > MAX - 100 ? <span className="cs-input-count">{MAX - v.length}</span> : null}
      <button type="submit" className="cs-input-send cs-press" aria-label="Enviar" disabled={busy || !v.trim()}>
        {busy ? <span className="cs-spin" /> : <C.Icon name="send" weight={2.4} />}
      </button>
    </form>
  );
}
