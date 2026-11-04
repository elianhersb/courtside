"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import C from "@/components/cs";
import { usePrefs } from "@/components/Shell";
import { channelsFor, COUNTRIES } from "@/lib/channels";
import { timeOf } from "@/lib/format";
import RichText from "@/components/RichText";

const SUGGESTIONS = ["¿Qué pasó ayer en la NBA?", "¿Quién juega hoy?", "¿Cómo le fue a Stephen Curry en su último partido?", "¿Dónde veo el próximo partido de los Lakers?"];

export default function Assistant() {
  const router = useRouter();
  const [prefs] = usePrefs();
  const [msgs, setMsgs] = useState([]); // { role, content, cards?, error? }
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy]);
  // Pregunta que llega desde el panel del escritorio (/asistente?q=...).
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q) { history.replaceState(null, "", "/asistente"); send(q); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const ORDER = { live: 0, final: 1, scheduled: 2 };
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
      <div className="cs-screen-h">
        <div>
          <h1>Asistente</h1>
          <div className="cs-muted" style={{ fontSize: 13, marginTop: 2 }}>Pregunta por partidos, jugadores y dónde verlos</div>
        </div>
      </div>
      {!msgs.length ? (
        <div className="cs-gut cs-pop-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "64px 24px 24px" }}>
          <C.AppMark size={64} />
          <div style={{ fontWeight: 650, fontSize: 17, marginTop: 14 }}>¿Qué quieres saber hoy?</div>
          <div className="cs-muted" style={{ fontSize: 14, lineHeight: "20px", marginTop: 6, maxWidth: 280 }}>Respondo con datos en vivo de la NBA y te digo por dónde ver cada partido.</div>
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
        <div className="cs-chips">
          {SUGGESTIONS.map((s) => <C.SuggestionChip key={s} onClick={() => send(s)}>{s}</C.SuggestionChip>)}
        </div>
        <C.Composer placeholder="Pregunta sobre partidos o jugadores" onSend={send} disabled={busy} />
      </div>
    </>
  );
}
