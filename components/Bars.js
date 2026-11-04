"use client";

// Barras de una sola serie: el título la nombra, sin leyenda. Cada barra muestra su valor al pasar el mouse o enfocar.
// data: [{ key, label, n }]; first/last: textos del eje; best: resalta la barra más alta.
export default function Bars({ title, sub, data, first, last, fmt = (n) => String(n), best }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const top = best ? data.reduce((a, d) => (d.n > a.n ? d : a), data[0]) : null;
  return (
    <section className="cs-adm-card">
      <header><h3>{title}</h3>{sub ? <span className="cs-muted">{sub}</span> : null}</header>
      <div className="cs-adm-bars" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${fmt(d.n)}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.key} className="cs-adm-bar" tabIndex={0} aria-label={`${d.label}: ${fmt(d.n)}`}>
            <i style={{ height: `${(d.n / max) * 100}%` }} className={d.n ? (top === d ? "is-best" : "") : "is-zero"} />
            <span className="cs-adm-tip"><b>{fmt(d.n)}</b>{d.label}</span>
          </div>
        ))}
      </div>
      <div className="cs-adm-axis"><span>{first ?? data[0]?.label}</span><span>{last ?? data.at(-1)?.label}</span></div>
    </section>
  );
}
