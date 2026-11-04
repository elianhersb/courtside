import Anthropic from "@anthropic-ai/sdk";
import { getScoreboard, getGame, searchPlayers, getPlayer, getLeaders, getInjuries } from "@/lib/espn";
import { getSeason } from "@/lib/season";
import { getCup } from "@/lib/cup";

const tools = [
  {
    name: "get_games",
    description: "Lista los partidos NBA de un día con marcador, estado, récords y televisoras de EE.UU. Úsala para '¿qué pasó ayer?', '¿quién juega hoy?' o para encontrar el id de un partido.",
    input_schema: { type: "object", properties: { date: { type: "string", description: "Día de la liga en formato YYYYMMDD" } }, required: ["date"], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_game_details",
    description: "Detalle de un partido: marcador por cuarto, box score de cada jugador, líderes, estadísticas de equipo y últimas jugadas.",
    input_schema: { type: "object", properties: { game_id: { type: "string" } }, required: ["game_id"], additionalProperties: false },
    strict: true,
  },
  {
    name: "search_player",
    description: "Busca jugadores NBA por nombre y devuelve sus ids.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_player",
    description: "Ficha de un jugador: equipo, posición, promedios de la temporada y últimos 5 partidos.",
    input_schema: { type: "object", properties: { player_id: { type: "string" } }, required: ["player_id"], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_leaders",
    description: "Líderes de la liga en la temporada (top 5, promedios por partido y porcentajes): puntos, rebotes, asistencias, robos, tapones, minutos y % de tiro; y los peores: más pérdidas, peor % de tiro, triples y libres, más faltas.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "get_injuries",
    description: "Jugadores lesionados de toda la liga: estado (Fuera, Día a día…), lesión, fecha estimada de regreso y nota. Filtra por equipo con el código de 3 letras (LAL, GSW…) o deja vacío para todos.",
    input_schema: { type: "object", properties: { team: { type: "string" } }, required: ["team"], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_standings",
    description: "Temporada actual: tabla de posiciones por conferencia (puesto, G-P, juegos detrás, racha, últimos 10), el play-in y la llave de playoffs (series reales con victorias, o la proyección si aún no empiezan).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "get_cup",
    description: "Copa NBA (Emirates NBA Cup) de esta temporada: tabla de cada grupo, carrera por el wild card, llave de eliminatorias (cuartos, semis y final) y próximos partidos de la Copa.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
];

// Resúmenes compactos para el modelo: menos tokens y nada que tenga que deducir.
const sideOf = (m) => [m.a, m.b].map((t) => (t ? `${t.tri}${t.wins !== undefined ? ` ${t.wins}` : t.score !== undefined ? ` ${t.score}` : ""}` : "por definir")).join(" vs ");
const matchOf = (m) => ({ cruce: sideOf(m), estado: m.winner ? `ganó ${m.winner}` : m.projected ? "proyección" : m.status });

async function runTool(name, input, cards) {
  if (name === "get_games") {
    const games = await getScoreboard(input.date);
    if (games.length) cards.push({ type: "games", games });
    return { total: games.length, games };
  }
  if (name === "get_game_details") {
    const g = await getGame(input.game_id);
    cards.push({ type: "games", games: [{ ...g, box: undefined, plays: undefined }] });
    return { ...g, box: { away: g.box.away.slice(0, 8), home: g.box.home.slice(0, 8) }, plays: g.plays.slice(0, 15) };
  }
  if (name === "search_player") return searchPlayers(input.name);
  if (name === "get_player") {
    const p = await getPlayer(input.player_id);
    cards.push({ type: "player", player: p });
    return p;
  }
  if (name === "get_leaders") return getLeaders();
  if (name === "get_injuries") {
    const all = await getInjuries();
    const team = (input.team || "").toUpperCase();
    return team ? all.filter((i) => i.team === team) : all.slice(0, 40);
  }
  if (name === "get_standings") {
    const s = await getSeason();
    const table = Object.fromEntries(Object.entries(s.standings).map(([c, rows]) => [c, rows.map((r) => `${r.seed}. ${r.tri} ${r.w}-${r.l} JD ${r.gb} racha ${r.streak} últ10 ${r.l10}${r.clinch ? ` (${{ in: "clasificado", playin: "play-in", out: "eliminado" }[r.clinch]})` : ""}`)]));
    const b = s.bracket, conf = (c) => ({ primera_ronda: b[c].r1.map(matchOf), semifinales: b[c].sf.map(matchOf), final_conferencia: matchOf(b[c].cf) });
    return { temporada: s.label, fase: s.phase, tabla: table, play_in: Object.fromEntries(Object.entries(s.playin).map(([c, p]) => [c, [p.a, p.b, p.c].map(matchOf)])), playoffs: { East: conf("East"), West: conf("West"), finales: matchOf(b.finals), campeon: b.champion } };
  }
  if (name === "get_cup") {
    const c = await getCup();
    return {
      fase: c.phase, final: `${c.finalDate} · ${c.finalVenue}`,
      grupos: c.groups.map((g) => ({ grupo: `${g.conf} ${g.name}`, lider: g.rows[0].tri, tabla: g.rows.map((r, i) => `${i + 1}. ${r.tri} ${r.w}-${r.l} dif ${r.diff}${r.badge ? ` (${r.badge === "leader" ? "líder" : "wild card"})` : ""}`) })),
      llave: { East: [...c.bracket.East.qf, c.bracket.East.sf].map(matchOf), West: [...c.bracket.West.qf, c.bracket.West.sf].map(matchOf), final: matchOf(c.bracket.final), campeon: c.bracket.champion },
      proximos: c.upcoming.map((g) => `${g.date} ${g.away.tri} @ ${g.home.tri}`),
    };
  }
  throw new Error(`Herramienta desconocida: ${name}`);
}

const system = (today) => `Eres el asistente de CourtSide, una app para seguir la NBA desde Venezuela. Hoy es ${today}.
Responde en español con datos concretos y este formato (la app lo muestra como una tarjeta):
# Un titular corto y llamativo (máximo 8 palabras)
Una frase de contexto.
- De 2 a 4 viñetas breves, una idea por viñeta
Usa **negritas** solo para nombres, marcadores y cifras clave. Nada de tablas, enlaces ni otros símbolos de Markdown. Los marcadores y tarjetas de los partidos se muestran solos debajo, no los listes todos. Usa siempre las herramientas para marcadores y estadísticas; nunca inventes números.
Las fechas de las herramientas son días de la liga (hora del Este de EE.UU.); "ayer" es el día anterior a hoy.
Sobre dónde ver un partido en Venezuela: siempre está NBA League Pass; si en EE.UU. lo pasa ESPN o ABC, en Latinoamérica suele ir por ESPN y Disney+. No afirmes canales locales sin datos.`;

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const history = Array.isArray(body?.messages) ? body.messages : [];
  // Solo texto plano de usuario/asistente; el cliente no puede inyectar bloques de herramientas.
  const messages = history.slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (messages.at(-1)?.role !== "user") return Response.json({ error: "Falta la pregunta" }, { status: 400 });

  const today = new Intl.DateTimeFormat("es-VE", { dateStyle: "full", timeZone: "America/Caracas" }).format(new Date());
  const cards = [];
  try {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return Response.json({ error: "Falta configurar la key del asistente en .env.local" }, { status: 500 });
    const client = new Anthropic();
    for (let turn = 0; turn < 8; turn++) {
      const res = await client.beta.messages.create({
        model: process.env.CHAT_MODEL || "claude-haiku-5-5",
        max_tokens: 16000,
        output_config: { effort: "medium" },
        // El respaldo ante rechazos es de la API de Anthropic; OpenRouter no lo acepta.
        ...(process.env.ANTHROPIC_BASE_URL ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }),
        system: system(today),
        tools,
        messages,
      });
      if (res.stop_reason === "refusal") return Response.json({ text: "No puedo responder eso. Prueba con otra pregunta sobre la NBA.", cards: [] });
      if (res.stop_reason !== "tool_use") {
        const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        return Response.json({ text, cards: cards.slice(-2) });
      }
      messages.push({ role: "assistant", content: res.content });
      const calls = res.content.filter((b) => b.type === "tool_use");
      const results = await Promise.all(calls.map(async (b) => {
        try {
          return { type: "tool_result", tool_use_id: b.id, content: JSON.stringify(await runTool(b.name, b.input, cards)) };
        } catch (e) {
          return { type: "tool_result", tool_use_id: b.id, content: e.message, is_error: true };
        }
      }));
      messages.push({ role: "user", content: results });
    }
    return Response.json({ text: "La consulta tomó demasiados pasos. Intenta una pregunta más específica.", cards: [] });
  } catch (e) {
    console.error("chat:", e.status ?? "", e.message);
    if (e instanceof Anthropic.AuthenticationError) return Response.json({ error: "La key del asistente no es válida" }, { status: 500 });
    if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "Demasiadas consultas, intenta en un momento" }, { status: 429 });
    if (e instanceof Anthropic.APIError) return Response.json({ error: `Error del asistente (${e.status})` }, { status: 502 });
    return Response.json({ error: "No se pudo completar la consulta" }, { status: 500 });
  }
}
