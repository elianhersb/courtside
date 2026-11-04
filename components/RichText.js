"use client";
import { Fragment, useEffect, useState } from "react";

// Markdown mínimo que pide el asistente: "# título", "- viñeta" y **negritas**. Se arma con elementos de React (nunca HTML crudo).
function inline(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

export function parse(text) {
  const blocks = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#+\s/.test(line)) blocks.push({ type: "title", text: line.replace(/^#+\s/, "") });
    else if (/^[-*•]\s/.test(line)) {
      const last = blocks.at(-1);
      const item = line.replace(/^[-*•]\s/, "");
      if (last?.type === "list") last.items.push(item); else blocks.push({ type: "list", items: [item] });
    } else blocks.push({ type: "p", text: line });
  }
  return blocks;
}

// Revela el texto palabra por palabra, como si se escribiera en vivo.
function useStream(text, run) {
  const [n, setN] = useState(run ? 0 : Infinity);
  useEffect(() => {
    if (!run || matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(Infinity); return; }
    setN(0);
    const t = setInterval(() => setN((x) => x + 1), 30);
    return () => clearInterval(t);
  }, [text, run]);
  const words = text.split(/(\s+)/);
  return { shown: words.slice(0, n * 2).join(""), done: n * 2 >= words.length };
}

export default function RichText({ text, stream = false }) {
  const { shown, done } = useStream(text, stream);
  const blocks = parse(shown);
  return (
    <div className="cs-rt">
      {blocks.map((b, i) =>
        b.type === "title" ? <h4 key={i}>{inline(b.text)}</h4>
        : b.type === "list" ? <ul key={i}>{b.items.map((it, j) => <li key={j} style={{ "--i": j }}>{inline(it)}</li>)}</ul>
        : <p key={i}>{inline(b.text)}</p>)}
      {done ? null : <span className="cs-caret" />}
    </div>
  );
}
