"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import C from "./cs";
import { usePrefs } from "./Shell";
import { channelsFor, COUNTRIES } from "@/lib/channels";
import { timeOf } from "@/lib/format";
import RichText from "./RichText";
import ChatInput from "./ChatInput";

// [ícono, título, pregunta]
const SUGGESTIONS = [
  ["today", "Resultados de ayer", "¿Qué pasó ayer en la NBA?"],
  ["tv", "Dónde verlo", "¿Dónde veo el próximo partido de los Lakers?"],
  ["players", "Líderes de la liga", "¿Quién lidera la NBA en rebotes y asistencias?"],
  ["bell", "Lesionados", "¿Qué jugadores de los Warriors están lesionados?"],
  ["star", "Un jugador", "¿Cómo le fue a Stephen Curry en su último partido?"],
  ["clock", "Hoy", "¿Quién juega hoy y a qué hora?"],
];

// Una sola conversación para la página del asistente y el chat flotante del escritorio.
const Ctx = createContext(null);
export function ChatProvider({ children }) {
  const [msgs, setMsgs] = useState([]); // { role, content, cards?, error? }
  const [busy, setBusy] = useState(false);
  async function send(text) {
    if (busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      setMsgs([...next, { role: "assistant", content: j.text, cards: j.cards }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: e.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }
  return <Ctx.Provider value={{ msgs, busy, send }}>{children}</Ctx.Provider>;
}

const ORDER = { live: 0, final: 1, scheduled: 2 };

export default function Chat({ panel = false }) {
  const router = useRouter();
  const [prefs] = usePrefs();
  const { msgs, busy, send } = useContext(Ctx);
  const end = useRef(null);
  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy]);

  const gameCard = (game) => {
    const g = { ...game, time: game.status === "scheduled" ? timeOf(game.date) : undefined };
    return <C.ChatGameCard key={g.id} game={g} onPress={() => router.push(`/partido/${g.id}`)} />;
  };
  const card = (c, i) => {
    if (c.type === "player") {
      const p = c.player;
      return <C.ChatPlayerCard key={i} player={{ ...p, context: p.last5[0] ? `Último: ${p.last5[0].opp} · ${p.last5[0].pts} PTS` : "", stats: p.avgs.slice(0, 3).map(([l, v]) => [l, v, 1]) }} onPress={() => router.push(`/jugadores/${p.id}`)} />;
    }
    const games = [...(c.games || [])].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
    if (!games.length) return null;
    if (games.length > 1) return <div key={i} className="cs-carousel">{games.map(gameCard)}</div>;
    const g = games[0];
    return [
      gameCard(g),
      g.status === "scheduled" ? <C.ChatWatchCard key={`w${i}`} channels={channelsFor(g.broadcasts, prefs.country)} owned={prefs.subs} country={COUNTRIES[prefs.country]} /> : null,
    ];
  };

  return (
    <>
      {!msgs.length ? (
        <div className="cs-gut cs-welcome">
          <div className="cs-welcome-mark"><C.AppMark size={panel ? 48 : 64} /></div>
          <h2>¿Qué quieres saber hoy?</h2>
          <p className="cs-muted">Respondo con datos en vivo de la NBA y te digo por dónde ver cada partido.</p>
          <div className="cs-suggest-grid">
            {SUGGESTIONS.slice(0, panel ? 4 : 6).map(([icon, title, q], i) => (
              <button key={q} className="cs-suggest-card cs-press" style={{ "--i": i }} onClick={() => send(q)}>
                <span className="cs-suggest-ic"><C.Icon name={icon} /></span>
                <b>{title}</b>
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="cs-gut cs-stack cs-chat" style={{ gap: 12 }}>
        {msgs.map((m, i) => m.role === "user"
          ? <C.ChatBubble key={i} from="user">{m.content}</C.ChatBubble>
          : (
            <article key={i} className={`cs-answer${m.error ? " is-error" : ""}`}>
              <div className="cs-answer-h"><C.AppMark size={22} />CourtSide IA</div>
              {m.error ? <p className="cs-error" style={{ padding: 0, margin: 0 }}>{m.content}</p> : <RichText text={m.content} stream={i === msgs.length - 1} />}
              {m.cards?.length ? <div className="cs-answer-cards">{m.cards.map(card)}</div> : null}
            </article>
          ))}
        {busy ? <C.TypingIndicator querying label="Consultando datos de la NBA…" /> : null}
        <div ref={end} />
      </div>
      <div className="cs-dock">
        {msgs.length && !busy ? (
          <div className="cs-chips">
            {SUGGESTIONS.map(([icon, title, q]) => (
              <button key={q} className="cs-chip-q cs-press" onClick={() => send(q)}><C.Icon name={icon} />{title}</button>
            ))}
          </div>
        ) : null}
        <ChatInput onSend={send} busy={busy} />
        <div className="cs-input-hint">CourtSide IA puede equivocarse. Revisa los datos importantes.</div>
      </div>
    </>
  );
}

// Botón flotante del escritorio: abre el chat en una ventana, sin salir de la página.
export function ChatFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { busy } = useContext(Ctx);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="cs-desk-only">
      {open ? (
        <section className="cs-chatpanel" role="dialog" aria-label="Asistente CourtSide">
          <header className="cs-chatpanel-h">
            <C.AppMark size={28} />
            <div style={{ flex: 1, minWidth: 0 }}><b>CourtSide IA</b><span>{busy ? "Consultando datos…" : "Datos en vivo de la NBA"}</span></div>
            <button className="cs-icon-btn cs-press" aria-label="Abrir en pantalla completa" onClick={() => { setOpen(false); router.push("/asistente"); }}><C.Icon name="share" /></button>
            <button className="cs-icon-btn cs-press" aria-label="Cerrar" onClick={() => setOpen(false)}><C.Icon name="x" /></button>
          </header>
          <div className="cs-chatpanel-body"><Chat panel /></div>
        </section>
      ) : null}
      <button className={`cs-fab cs-press${open ? " is-open" : ""}`} aria-label={open ? "Cerrar asistente" : "Abrir asistente"} aria-expanded={open} onClick={() => setOpen(!open)}>
        <C.Icon name={open ? "x" : "assistant"} weight={2.2} />
        {busy && !open ? <span className="cs-fab-dot" /> : null}
      </button>
    </div>
  );
}
