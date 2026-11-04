// Formato de horas y fechas en la zona horaria del teléfono.
const tzName = () => new Intl.DateTimeFormat("es", { timeZoneName: "short" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value || "";

export const timeOf = (iso) => new Intl.DateTimeFormat("es-VE", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const tz = tzName;
export const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
export const longDay = (d) => new Intl.DateTimeFormat("es-VE", { weekday: "long", day: "numeric", month: "short" }).format(d);

// Hoy, ayer y los próximos 5 días para el selector de fecha.
export function dayList(now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i - 1);
    const label = i === 0 ? "Ayer" : i === 1 ? "Hoy" : new Intl.DateTimeFormat("es-VE", { weekday: "short" }).format(d).replace(".", "");
    return { key: ymd(d), label: label[0].toUpperCase() + label.slice(1), day: d.getDate(), date: d, live: i === 1 };
  });
}
