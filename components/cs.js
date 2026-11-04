"use client";
/* Sistema de componentes CourtSide, exportado desde Claude Design (bundle.js) y convertido a módulo ES. */
import React from "react";
const C = (function () {
  var h = React.createElement, useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useLayoutEffect = React.useLayoutEffect, Fragment = React.Fragment;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }

  /* ================= Datos de referencia ================= */
  var TEAM_LIST = [
    ["ATL", 1610612737, "Hawks", "Atlanta"], ["BOS", 1610612738, "Celtics", "Boston"], ["BKN", 1610612751, "Nets", "Brooklyn"], ["CHA", 1610612766, "Hornets", "Charlotte"],
    ["CHI", 1610612741, "Bulls", "Chicago"], ["CLE", 1610612739, "Cavaliers", "Cleveland"], ["DAL", 1610612742, "Mavericks", "Dallas"], ["DEN", 1610612743, "Nuggets", "Denver"],
    ["DET", 1610612765, "Pistons", "Detroit"], ["GSW", 1610612744, "Warriors", "Golden State"], ["HOU", 1610612745, "Rockets", "Houston"], ["IND", 1610612754, "Pacers", "Indiana"],
    ["LAC", 1610612746, "Clippers", "LA"], ["LAL", 1610612747, "Lakers", "Los Ángeles"], ["MEM", 1610612763, "Grizzlies", "Memphis"], ["MIA", 1610612748, "Heat", "Miami"],
    ["MIL", 1610612749, "Bucks", "Milwaukee"], ["MIN", 1610612750, "Timberwolves", "Minnesota"], ["NOP", 1610612740, "Pelicans", "Nueva Orleans"], ["NYK", 1610612752, "Knicks", "Nueva York"],
    ["OKC", 1610612760, "Thunder", "Oklahoma City"], ["ORL", 1610612753, "Magic", "Orlando"], ["PHI", 1610612755, "76ers", "Filadelfia"], ["PHX", 1610612756, "Suns", "Phoenix"],
    ["POR", 1610612757, "Trail Blazers", "Portland"], ["SAC", 1610612758, "Kings", "Sacramento"], ["SAS", 1610612759, "Spurs", "San Antonio"], ["TOR", 1610612761, "Raptors", "Toronto"],
    ["UTA", 1610612762, "Jazz", "Utah"], ["WAS", 1610612764, "Wizards", "Washington"]
  ];
  var TEAMS = {};
  TEAM_LIST.forEach(function (t) { TEAMS[t[0]] = { tri: t[0], id: t[1], name: t[2], city: t[3], color: "var(--team-" + t[0].toLowerCase() + ")", color2: "var(--team-" + t[0].toLowerCase() + "-2)" }; });
  function teamLogoUrl(tri) { var t = TEAMS[tri]; return t ? "https://cdn.nba.com/logos/nba/" + t.id + "/global/L/logo.svg" : null; }
  /* Los IDs de jugador son de ESPN (la fuente de datos), así que las fotos salen de su CDN. */
  function headshotUrl(id) { return "https://a.espncdn.com/i/headshots/nba/players/full/" + id + ".png"; }

  var CHANNELS = {
    espn: { name: "ESPN", type: "Cable" }, disney: { name: "Disney+", type: "Streaming" }, prime: { name: "Prime Video", type: "Streaming" },
    peacock: { name: "Peacock", type: "Streaming" }, nbc: { name: "NBC", type: "TV abierta" }, abc: { name: "ABC", type: "TV abierta" },
    leaguepass: { name: "NBA League Pass", short: "League Pass", type: "Streaming" }, meridiano: { name: "Meridiano", type: "TV abierta" }, televen: { name: "Televen", type: "TV abierta" }
  };
  /* Ruta de los logos de canal en el proyecto Next.js: /logos/channels/{key}.svg (las marcas los proveen). */
  var CHANNEL_LOGO_BASE = null;
  function channelLogoUrl(key) { return CHANNEL_LOGO_BASE ? CHANNEL_LOGO_BASE + key + ".svg" : null; }

  /* ================= Íconos (trazo 2px, 24×24) ================= */
  var IC = {
    today: "M4 5h16a1 1 0 0 1 1 1v14H3V6a1 1 0 0 1 1-1zM3 10h18M8 3v4M16 3v4",
    players: "M8 3h8l1.2 2.2L21 6.5V12l-3-1v10H6V11l-3 1V6.5l3.8-1.3z",
    assistant: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c.8-4 4-6 8-6s7.2 2 8 6",
    trophy: "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8 21h8M9 17h6v4H9z",
    star: "M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z",
    bell: "M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0",
    search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM21 21l-5.2-5.2",
    back: "M15 5l-7 7 7 7", next: "M9 5l7 7-7 7", check: "M5 12.5l4.5 4.5L19 7.5", x: "M6 6l12 12M18 6L6 18",
    share: "M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v8h14v-8", plusbox: "M4 4h16v16H4zM12 8v8M8 12h8",
    send: "M12 19V5M5.5 11.5L12 5l6.5 6.5", tv: "M3 6h18v12H3zM8 21h8", wifioff: "M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 5",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z",
    moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z", clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    menu: "M12 5h.01M12 12h.01M12 19h.01", download: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14", filter: "M4 6h16M7 12h10M10 18h4"
  };
  function Icon(p) {
    var d = IC[p.name] || "";
    return h("svg", { viewBox: "0 0 24 24", fill: p.filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: p.weight || 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, className: p.className, style: p.style }, h("path", { d: d }));
  }
  function Ball(p) {
    return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true, className: p.className },
      h("circle", { cx: 12, cy: 12, r: 9.5, fill: "currentColor", fillOpacity: .18 }), h("path", { d: "M2.5 12h19M12 2.5v19M5.3 5.3c2.4 2.2 3.6 4.4 3.6 6.7s-1.2 4.5-3.6 6.7M18.7 5.3c-2.4 2.2-3.6 4.4-3.6 6.7s1.2 4.5 3.6 6.7" }));
  }
  /* Marca de CourtSide: cuadro redondeado naranja con media cancha. */
  function AppMark(p) {
    var s = p.size || 48;
    return h("svg", { viewBox: "0 0 96 96", width: s, height: s, className: p.className, role: "img", "aria-label": "CourtSide" },
      h("rect", { width: 96, height: 96, rx: 24, fill: "var(--brand)" }),
      h("path", { d: "M18 76h60M30 76V58a18 18 0 0 1 36 0v18M48 76V64", fill: "none", stroke: "var(--on-brand)", strokeWidth: 6, strokeLinecap: "round" }),
      h("circle", { cx: 48, cy: 30, r: 11, fill: "var(--on-brand)" }));
  }

  /* ================= Imagen con placeholder ================= */
  function Img(p) {
    var st = useState(!p.src), failed = st[0], setFailed = st[1];
    useEffect(function () { setFailed(!p.src); }, [p.src]);
    return h("span", { className: cx("cs-img", p.className), style: Object.assign({ width: p.w, height: p.h }, p.style), "data-size": p.size, "data-team": p.team ? "" : undefined, title: p.label },
      failed ? h("span", { className: "cs-ph", "aria-label": p.label }, p.phText || p.label)
        : h("img", { src: p.src, alt: p.label, loading: "lazy", decoding: "async", onError: function () { setFailed(true); } }));
  }
  var LOGO_SIZES = { xs: 20, sm: 28, md: 40, lg: 72, xl: 96 };
  function TeamLogo(p) {
    var t = TEAMS[p.team] || { name: p.team, tri: p.team }, px = LOGO_SIZES[p.size || "md"];
    var ph = px < 56 ? t.tri : t.name;
    return h(Img, { className: "cs-logo", size: p.size || "md", w: px, h: px, src: p.src !== undefined ? p.src : teamLogoUrl(p.team), label: "Logo " + t.name, phText: ph });
  }
  var AVATAR_SIZES = { xs: 28, sm: 32, md: 44, lg: 64 };
  function PlayerAvatar(p) {
    var px = AVATAR_SIZES[p.size || "md"], t = TEAMS[p.team];
    return h(Img, { className: "cs-avatar", w: px, h: px, team: !!t, style: t ? { "--avatar-team": t.color } : null, src: p.src !== undefined ? p.src : (p.id ? headshotUrl(p.id) : null), label: p.name, phText: p.short || (px <= 32 ? initials(p.name) : shortName(p.name)) });
  }
  function initials(n) { return (n || "").split(" ").map(function (w) { return w[0]; }).join("").slice(0, 3); }
  function shortName(n) { if (!n) return ""; var a = n.split(" "); return a.length > 1 ? a[0][0] + ". " + a.slice(1).join(" ") : n; }

  /* ================= Badge EN VIVO ================= */
  function LiveBadge(p) {
    return h("span", { className: "cs-live", role: "status" }, h("span", { className: "cs-live-dot" }), "EN VIVO", p.clock ? h("span", { className: "cs-live-clock" }, p.clock) : null);
  }

  /* ================= Marcador animado ================= */
  function Digit(p) {
    var prev = useRef(p.d), st = useState(null), out = st[0], setOut = st[1], k = useState(0), key = k[0], setKey = k[1];
    useEffect(function () {
      if (prev.current !== p.d) { setOut(prev.current); setKey(function (x) { return x + 1; }); prev.current = p.d; var t = setTimeout(function () { setOut(null); }, 480); return function () { clearTimeout(t); }; }
    }, [p.d]);
    return h("span", { className: cx("cs-digit", out !== null && "is-rolling") },
      out !== null ? h("span", { className: "cs-digit-out", key: "o" + key }, out) : null,
      h("span", { className: "cs-digit-in", key: "i" + key }, p.d));
  }
  function AnimatedScore(p) {
    var s = String(p.value == null ? "–" : p.value);
    var digits = s.split("");
    return h("span", { className: cx("cs-score", p.dim && "is-dim"), "data-size": p.size || "lg", "aria-label": s, "aria-live": "polite" },
      digits.map(function (d, i) { return h(Digit, { key: digits.length - i, d: d }); }));
  }

  /* ================= Chip de canal ================= */
  function ChannelChip(p) {
    if (p.loading) return h("span", { className: "cs-chip cs-skel is-loading" });
    var c = CHANNELS[p.channel] || { name: p.channel };
    return h("span", { className: cx("cs-chip", p.owned && "is-owned"), "data-size": p.size },
      h(Img, { src: p.logo !== undefined ? p.logo : channelLogoUrl(p.channel), label: c.name, phText: c.short || c.name }),
      p.showType ? h("span", { className: "cs-chip-txt" }, h("span", null, c.name), h("span", { className: "cs-chip-type" }, c.type)) : h("span", null, p.compact ? (c.short || c.name) : c.name),
      p.owned ? h(Icon, { name: "check", className: "cs-chip-check", weight: 2.6 }) : null);
  }

  /* ================= Estrella de favorito ================= */
  function FavoriteStar(p) {
    var st = useState(false), pop = st[0], setPop = st[1];
    return h("button", {
      className: cx("cs-star", p.on && "is-on", pop && "is-popping"), "aria-pressed": !!p.on, "aria-label": p.on ? "Quitar de favoritos" : "Seguir equipo",
      onClick: function (e) { e.stopPropagation(); if (!p.on) { setPop(true); setTimeout(function () { setPop(false); }, 450); } p.onToggle && p.onToggle(!p.on); }
    }, h(Icon, { name: "star", filled: p.on }));
  }

  /* ================= Tarjeta de partido ================= */
  function TeamRow(p) {
    var t = TEAMS[p.side.tri] || { name: p.side.tri };
    return h("div", { className: cx("cs-team", p.result === "W" && "is-winner", p.result === "L" && "is-loser") },
      h(TeamLogo, { team: p.side.tri, size: "md" }),
      h("div", null, h("div", { className: "cs-team-name" }, t.name), h("div", { className: "cs-team-rec" }, p.side.record)),
      p.status === "scheduled" ? null : h(AnimatedScore, { value: p.side.score, size: "lg", dim: p.result === "L" }));
  }
  function GameCard(p) {
    var g = p.game, a = TEAMS[g.away.tri] || {}, hm = TEAMS[g.home.tri] || {};
    var prev = useRef({ a: g.away.score, h: g.home.score }), fl = useState(null), flash = fl[0], setFlash = fl[1];
    useEffect(function () {
      var side = null;
      if (g.away.score > (prev.current.a || 0)) side = "away"; else if (g.home.score > (prev.current.h || 0)) side = "home";
      prev.current = { a: g.away.score, h: g.home.score };
      if (side && g.status === "live") { setFlash({ side: side, k: Date.now() }); var t = setTimeout(function () { setFlash(null); }, 800); return function () { clearTimeout(t); }; }
    }, [g.away.score, g.home.score]);
    var res = {};
    if (g.status === "final") { res.away = g.away.score > g.home.score ? "W" : "L"; res.home = res.away === "W" ? "L" : "W"; }
    var top;
    if (g.status === "live") top = h(LiveBadge, { clock: g.clock });
    else if (g.status === "final") top = h("span", { className: "cs-card-status" }, g.ot ? "Final/OT" : "Final");
    else top = h("span", null, h("span", { className: "cs-card-time" }, g.time), h("span", { className: "cs-card-tz" }, g.tz || "VET"));
    var foot = null;
    if (g.status === "live" && g.leaders) {
      foot = h("div", { className: "cs-leaders" }, ["away", "home"].map(function (s) {
        var L = g.leaders[s]; return h("div", { className: "cs-leader", key: s }, h(PlayerAvatar, { id: L.id, name: L.name, size: "xs", team: g[s].tri }), h("span", null, shortName(L.name)), h("b", null, L.pts + " PTS"));
      }));
    } else if (g.status === "scheduled" && g.channels) {
      foot = h(Fragment, null, g.watchable ? h("span", { className: "cs-watch-flag" }, h(Icon, { name: "tv", style: { width: 14, height: 14 } }), "Puedes verlo") : null,
        g.channels.map(function (c) { return h(ChannelChip, { key: c, channel: c, compact: true, owned: p.owned && p.owned.indexOf(c) >= 0 }); }));
    } else if (g.status === "final" && g.summary) {
      foot = h("span", { className: "cs-muted", style: { fontSize: 13 } }, g.summary);
    }
    var down = useState(false), pressed = down[0], setPressed = down[1];
    return h("article", {
      className: cx("cs-card cs-press", p.animateIn !== false && "cs-enter", g.watchable && g.status === "scheduled" && "is-watchable", pressed && "is-pressed"),
      style: { "--c-away": a.color, "--c-home": hm.color, "--i": p.index || 0 }, tabIndex: 0, role: "button",
      "aria-label": a.name + " vs " + hm.name, onClick: p.onPress, onPointerDown: function () { setPressed(true); }, onPointerUp: function () { setPressed(false); }, onPointerLeave: function () { setPressed(false); }
    },
      flash ? h("span", { key: flash.k, className: "cs-card-flash", style: { "--flash": (flash.side === "away" ? a : hm).color, "--fx": flash.side === "away" ? "0%" : "100%" } }) : null,
      h("div", { className: "cs-card-top" }, top, p.onToggleFav ? h(FavoriteStar, { on: p.favorite, onToggle: p.onToggleFav }) : null),
      h(TeamRow, { side: g.away, status: g.status, result: res.away }),
      h(TeamRow, { side: g.home, status: g.status, result: res.home }),
      foot ? h("div", { className: "cs-card-foot" }, foot) : null);
  }
  function GameCardSkeleton() {
    var row = function (k) { return h("div", { className: "cs-team", key: k }, h("span", { className: "cs-skel", style: { width: 40, height: 40, borderRadius: 12 } }), h("div", { className: "cs-stack", style: { gap: 6 } }, h("span", { className: "cs-skel", style: { width: 110, height: 14 } }), h("span", { className: "cs-skel", style: { width: 48, height: 10 } })), h("span", { className: "cs-skel", style: { width: 44, height: 30 } })); };
    return h("div", { className: "cs-card", "aria-busy": true, style: { "--c-away": "transparent", "--c-home": "transparent" } },
      h("div", { className: "cs-card-top" }, h("span", { className: "cs-skel", style: { width: 84, height: 20, borderRadius: 999 } })), row(1), h("div", { style: { height: 12 } }), row(2),
      h("div", { className: "cs-card-foot" }, h(ChannelChip, { loading: true }), h(ChannelChip, { loading: true })));
  }
  function Skeleton(p) { return h("span", { className: "cs-skel", style: { width: p.w, height: p.h || 14, borderRadius: p.r } }); }

  /* ================= Indicador deslizante compartido ================= */
  function useIndicator(ref, index, deps) {
    var st = useState({ x: 0, w: 0 }), pos = st[0], set = st[1];
    useLayoutEffect(function () {
      var el = ref.current; if (!el) return; var items = el.querySelectorAll("[data-ind]"), it = items[index]; if (!it) return;
      set({ x: it.offsetLeft, w: it.offsetWidth });
      if (p_scroll(el, it)) {}
    }, [index].concat(deps || []));
    return pos;
  }
  function p_scroll(el, it) { if (el.scrollWidth > el.clientWidth) { var target = it.offsetLeft - (el.clientWidth - it.offsetWidth) / 2; try { el.scrollTo({ left: target, behavior: reduced() ? "auto" : "smooth" }); } catch (e) { el.scrollLeft = target; } } return true; }

  /* ================= Selector de fecha ================= */
  function DatePicker(p) {
    var ref = useRef(null), idx = Math.max(0, p.days.findIndex(function (d) { return d.key === p.value; })), pos = useIndicator(ref, idx);
    return h("div", { className: "cs-dates", ref: ref, role: "tablist", "aria-label": "Fecha" },
      h("span", { className: "cs-indicator", style: { width: pos.w, transform: "translateX(" + (pos.x - 4) + "px)", left: 4 } }),
      p.days.map(function (d, i) {
        return h("button", { key: d.key, "data-ind": "", role: "tab", "aria-selected": i === idx, className: cx("cs-date cs-press", i === idx && "is-active"), onClick: function () { p.onChange && p.onChange(d.key); } },
          h("small", null, d.label), h("b", null, d.day), d.live ? h("span", { className: "cs-date-dot" }) : h("span", { style: { height: 7 } }));
      }));
  }

  /* ================= Pestañas ================= */
  function Tabs(p) {
    var ref = useRef(null), idx = Math.max(0, p.items.findIndex(function (t) { return t.key === p.value; })), pos = useIndicator(ref, idx);
    return h("div", { className: "cs-tabs", ref: ref, role: "tablist" },
      p.items.map(function (t, i) { return h("button", { key: t.key, "data-ind": "", role: "tab", "aria-selected": i === idx, className: cx("cs-tab", i === idx && "is-active"), onClick: function () { p.onChange && p.onChange(t.key); } }, t.label); }),
      h("span", { className: "cs-tabs-bar", style: { width: pos.w, transform: "translateX(" + pos.x + "px)" } }));
  }
  function TabPanel(p) { return h("div", { className: "cs-tabpanel", key: p.k, role: "tabpanel", style: { "--dir": (p.dir || 1) * 12 + "px" } }, p.children); }
  function Segmented(p) {
    return h("div", { className: "cs-seg", role: "tablist" }, p.items.map(function (t) { return h("button", { key: t.key, className: t.key === p.value ? "is-active" : "", onClick: function () { p.onChange && p.onChange(t.key); } }, t.label); }));
  }

  /* ================= Visibilidad / count-up ================= */
  function useInView(ref) {
    var st = useState(false), v = st[0], set = st[1];
    useEffect(function () {
      var el = ref.current; if (!el) return; if (!("IntersectionObserver" in window)) { set(true); return; }
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { set(true); io.disconnect(); } }); }, { threshold: .3 }); io.observe(el); return function () { io.disconnect(); };
    }, []);
    return v;
  }
  function useCountUp(target, run, dur) {
    var st = useState(0), v = st[0], set = st[1];
    useEffect(function () {
      if (!run) return; if (reduced()) { set(target); return; }
      var t0 = performance.now(), raf; dur = dur || 900;
      function step(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); set(target * e); if (k < 1) raf = requestAnimationFrame(step); }
      raf = requestAnimationFrame(step); return function () { cancelAnimationFrame(raf); };
    }, [target, run]);
    return v;
  }
  function CountUp(p) {
    var ref = useRef(null), vis = useInView(ref), v = useCountUp(p.value, vis, p.duration);
    return h("span", { ref: ref, className: "cs-num" }, v.toFixed(p.decimals || 0) + (p.suffix || ""));
  }
  function StatTile(p) {
    return h("div", { className: "cs-tile" }, h("div", { className: "cs-tile-v" }, h(CountUp, { value: p.value, decimals: p.decimals, suffix: p.suffix })), h("div", { className: "cs-tile-l" }, p.label));
  }

  /* ================= Barras de comparación ================= */
  function CompareBar(p) {
    var ref = useRef(null), vis = useInView(ref), tot = (p.away + p.home) || 1, inv = p.lowerIsBetter;
    var aLead = inv ? p.away < p.home : p.away > p.home, hLead = inv ? p.home < p.away : p.home > p.away;
    var fmt = function (v) { return p.percent ? v.toFixed(1) + "%" : String(v); };
    var wa = p.percent ? p.away : (p.away / tot) * 100, wh = p.percent ? p.home : (p.home / tot) * 100;
    return h("div", { className: "cs-cmp", ref: ref },
      h("div", { className: "cs-cmp-label" }, p.label),
      h("span", { className: cx("cs-cmp-val", aLead && "is-lead") }, fmt(p.away)),
      h("div", { className: "cs-cmp-track" },
        h("div", null, h("span", { className: "cs-cmp-fill", style: { width: vis ? wa + "%" : 0, background: aLead ? p.awayColor : "var(--line-strong)" } })),
        h("div", null, h("span", { className: "cs-cmp-fill", style: { width: vis ? wh + "%" : 0, background: hLead ? p.homeColor : "var(--line-strong)", transitionDelay: "80ms" } }))),
      h("span", { className: cx("cs-cmp-val is-r", hLead && "is-lead") }, fmt(p.home)));
  }

  /* ================= Gráfico de puntos por partido ================= */
  function PointsChart(p) {
    var ref = useRef(null), vis = useInView(ref), W = 340, H = 150, pad = 20, vals = p.values, max = Math.max.apply(null, vals) * 1.15, n = vals.length;
    var pts = vals.map(function (v, i) { return [pad + i * (W - pad * 2) / (n - 1), H - 22 - (v / max) * (H - 44)]; });
    var d = pts.map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" ");
    var len = 0; for (var i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    var avg = vals.reduce(function (a, b) { return a + b; }, 0) / n, ay = H - 22 - (avg / max) * (H - 44);
    return h("svg", { ref: ref, className: cx("cs-chart", vis && "is-in"), viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Puntos por partido: " + vals.join(", ") },
      h("line", { className: "cs-chart-grid", x1: pad, x2: W - pad, y1: ay, y2: ay, strokeDasharray: "3 4" }),
      h("text", { className: "cs-chart-lab", x: 0, y: ay + 3, textAnchor: "start" }, "Prom."),
      h("path", { className: "cs-chart-area", d: d + " L" + pts[n - 1][0] + " " + (H - 22) + " L" + pts[0][0] + " " + (H - 22) + " Z" }),
      h("path", { className: "cs-chart-line", d: d, style: { "--len": Math.ceil(len) } }),
      pts.map(function (q, i) { return h("g", { key: i }, h("circle", { className: "cs-chart-dot", cx: q[0], cy: q[1], r: 4, style: { "--i": i } }), h("text", { className: "cs-chart-val", x: q[0], y: q[1] - 10, textAnchor: "middle", style: { opacity: vis ? 1 : 0, transition: "opacity 300ms " + (i * 90 + 300) + "ms" } }, vals[i]), h("text", { className: "cs-chart-lab", x: q[0], y: H - 4, textAnchor: "middle" }, p.labels ? p.labels[i] : "")); }));
  }

  /* ================= Tabla de estadísticas (box score) ================= */
  var BOX_COLS = [["min", "MIN"], ["pts", "PTS"], ["reb", "REB"], ["ast", "AST"], ["stl", "ROB"], ["blk", "TAP"], ["fg", "TC"], ["tp", "3P"], ["ft", "TL"], ["pm", "+/-"]];
  function StatTable(p) {
    if (p.loading) return h("div", { className: "cs-table-wrap", style: { padding: 16 } }, h("div", { className: "cs-stack" }, [1, 2, 3, 4, 5].map(function (i) { return h("div", { key: i, className: "cs-row", style: { flexWrap: "nowrap" } }, h(Skeleton, { w: 32, h: 32, r: 16 }), h(Skeleton, { w: 120 }), h("span", { style: { flex: 1 } }), h(Skeleton, { w: 140 })); })));
    var maxPts = Math.max.apply(null, p.players.map(function (x) { return x.pts; }));
    return h("div", { className: "cs-table-wrap" }, h("table", { className: "cs-table" },
      h("thead", null, h("tr", null, h("th", { className: "cs-sticky" }, h("span", { className: "cs-row", style: { gap: 8 } }, h(TeamLogo, { team: p.team, size: "xs" }), (TEAMS[p.team] || {}).name)), BOX_COLS.map(function (c) { return h("th", { key: c[0] }, c[1]); }))),
      h("tbody", null, p.players.map(function (pl, i) {
        return h("tr", { key: pl.id || i, className: pl.bench ? "is-bench" : "" },
          h("td", { className: "cs-sticky" }, h("div", { className: "cs-pl" }, h(PlayerAvatar, { id: pl.id, name: pl.name, size: "sm", team: p.team }), h("div", null, h("div", null, h("span", { className: "cs-pl-name" }, shortName(pl.name)), p.live && pl.onCourt ? h("span", { className: "cs-oncourt", title: "En cancha", "aria-label": "En cancha" }) : null), h("div", { className: "cs-pl-pos" }, pl.pos)))),
          BOX_COLS.map(function (c) { var v = pl[c[0]]; var cls = c[0] === "pts" && v === maxPts ? "is-hi" : c[0] === "pm" ? (v > 0 ? "is-pos" : v < 0 ? "is-neg" : "") : ""; return h("td", { key: c[0], className: cls }, c[0] === "pm" && v > 0 ? "+" + v : c[0] === "pm" && v < 0 ? "−" + Math.abs(v) : v); }));
      }))));
  }
  function LineScore(p) {
    var g = p.game, q = g.periods || { away: [], home: [] };
    return h("table", { className: "cs-ls" },
      h("thead", null, h("tr", null, h("th", null, ""), q.away.map(function (_, i) { return h("th", { key: i }, i < 4 ? "Q" + (i + 1) : "OT" + (i - 3)); }), h("th", null, "T"))),
      h("tbody", null, ["away", "home"].map(function (s) { return h("tr", { key: s }, h("td", null, h("span", { className: "cs-row", style: { gap: 8, fontWeight: 600 } }, h(TeamLogo, { team: g[s].tri, size: "xs" }), g[s].tri)), q[s].map(function (v, i) { return h("td", { key: i }, v == null ? "–" : v); }), h("td", null, g[s].score)); })));
  }

  /* ================= Jugada a jugada ================= */
  function PlayItem(p) {
    var pl = p.play;
    return h("div", { className: cx("cs-play", pl.scoring && "is-score", p.isNew && "is-new"), style: p.isNew ? { "--flash": (TEAMS[pl.team] || {}).color } : null },
      h("span", { className: "cs-play-t" }, pl.clock), h(TeamLogo, { team: pl.team, size: "xs" }),
      h("span", { className: "cs-play-txt" }, pl.text), pl.score ? h("span", { className: "cs-play-s" }, pl.score) : h("span"));
  }

  /* ================= Navegación inferior ================= */
  var NAV = [["hoy", "Hoy", "today"], ["jugadores", "Jugadores", "players"], ["copa", "Copa", "trophy"], ["asistente", "Asistente", "assistant"], ["perfil", "Perfil", "profile"]];
  function BottomNav(p) {
    return h("nav", { className: "cs-nav", "aria-label": "Principal" }, NAV.map(function (n) {
      var on = p.value === n[0];
      return h("button", { key: n[0], className: cx("cs-nav-btn cs-press", on && "is-active"), "aria-current": on ? "page" : undefined, onClick: function () { p.onChange && p.onChange(n[0]); } }, h(Icon, { name: n[2], filled: false }), n[1]);
    }));
  }
  function SideRail(p) {
    return h("nav", { className: "cs-rail" }, h("div", { className: "cs-row", style: { gap: 10, padding: "0 12px 16px" } }, h(AppMark, { size: 32 }), h("b", { className: "cs-display", style: { fontSize: 24 } }, "CourtSide")),
      NAV.map(function (n) { return h("button", { key: n[0], className: cx("cs-rail-btn", p.value === n[0] && "is-active"), onClick: function () { p.onChange && p.onChange(n[0]); } }, h(Icon, { name: n[2] }), n[1]); }));
  }

  /* ================= Botón ================= */
  function Button(p) {
    return h("button", { className: cx("cs-btn cs-press", "cs-btn-" + (p.variant || "primary"), p.on && "is-on", p.className), disabled: p.disabled || p.loading, onClick: p.onClick, style: p.style, "aria-busy": p.loading || undefined },
      p.loading ? h("span", { className: "cs-spin" }) : p.icon ? h(Icon, { name: p.icon }) : null, p.children);
  }
  function AlertButton(p) {
    var st = useState(!!p.on), on = st[0], set = st[1], ld = useState(false), loading = ld[0], setL = ld[1];
    return h(Button, { variant: "secondary", on: on, loading: loading, icon: on ? "check" : "bell", onClick: function () { setL(true); setTimeout(function () { setL(false); set(!on); }, 700); }, style: p.style }, on ? "Alerta activada" : "Activar alerta");
  }

  /* ================= Chat ================= */
  function ChatBubble(p) {
    var ai = p.from !== "user";
    return h("div", { className: cx("cs-msg", ai ? "is-ai" : "is-user") }, ai ? h(AppMark, { size: 28, className: "cs-ai-mark" }) : null,
      h("div", { style: { display: "flex", flexDirection: "column", gap: 8, maxWidth: ai ? "86%" : "82%", alignItems: ai ? "flex-start" : "flex-end" } },
        p.children != null ? h("div", { className: "cs-bubble", style: { maxWidth: "100%" } }, p.children, p.streaming ? h("span", { className: "cs-caret" }) : null) : null, p.attachments));
  }
  function useStream(text, run, speed) {
    var st = useState(run ? "" : text), v = st[0], set = st[1];
    useEffect(function () {
      if (!run) { set(text); return; } if (reduced()) { set(text); return; }
      var i = 0, words = text.split(" "); set("");
      var t = setInterval(function () { i++; set(words.slice(0, i).join(" ")); if (i >= words.length) clearInterval(t); }, speed || 45); return function () { clearInterval(t); };
    }, [text, run]);
    return v;
  }
  function StreamText(p) { var v = useStream(p.text, p.run !== false, p.speed); return h(Fragment, null, v, v.length < p.text.length ? h("span", { className: "cs-caret" }) : null); }
  function TypingIndicator(p) {
    return h("div", { className: "cs-msg is-ai" }, h(AppMark, { size: 28, className: "cs-ai-mark" }), h("div", { className: "cs-bubble", "aria-label": "Escribiendo" },
      p.querying ? h("span", { className: "cs-querying" }, h("span", { className: "cs-querying-ball" }, h(Ball, {})), p.label || "Consultando datos de la NBA…") : h("span", { className: "cs-typing" }, h("i"), h("i"), h("i"))));
  }
  function SuggestionChip(p) { return h("button", { className: "cs-suggest cs-press", onClick: p.onClick }, p.children); }
  function ChatGameCard(p) {
    var g = p.game, a = TEAMS[g.away.tri] || {}, hm = TEAMS[g.home.tri] || {};
    var status = g.status === "live" ? h(LiveBadge, { clock: g.clock }) : g.status === "final" ? h("span", { className: "cs-card-status" }, g.ot ? "Final/OT" : "Final") : h("span", { className: "cs-card-status" }, g.time + " VET");
    var side = function (s) { var t = TEAMS[g[s].tri] || {}; var lose = g.status === "final" && g[s].score < g[s === "away" ? "home" : "away"].score; return h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 72 } }, h(TeamLogo, { team: g[s].tri, size: "sm" }), h("span", { style: { fontSize: 12, fontWeight: 600, color: lose ? "var(--ink-muted)" : "var(--ink)" } }, t.name)); };
    return h("div", { className: "cs-rich cs-press", style: { "--c-away": a.color, "--c-home": hm.color, width: 280 }, role: "button", tabIndex: 0, onClick: p.onPress },
      h("div", { className: "cs-row", style: { justifyContent: "space-between", marginBottom: 8 } }, status, h("span", { className: "cs-subtle", style: { fontSize: 12, fontWeight: 600 } }, "Ver partido ›")),
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, side("away"),
        g.status === "scheduled" ? h("span", { className: "cs-display", style: { fontSize: 22, fontWeight: 700 } }, "vs") : h("span", { style: { display: "flex", gap: 10, alignItems: "center" } }, h(AnimatedScore, { value: g.away.score, size: "md", dim: g.status === "final" && g.away.score < g.home.score }), h("span", { className: "cs-subtle" }, "–"), h(AnimatedScore, { value: g.home.score, size: "md", dim: g.status === "final" && g.home.score < g.away.score })),
        side("home")));
  }
  function ChatPlayerCard(p) {
    var pl = p.player, t = TEAMS[pl.team] || {};
    return h("div", { className: "cs-rich cs-press", style: { "--c-away": t.color, "--c-home": t.color2, width: 280 }, role: "button", tabIndex: 0, onClick: p.onPress },
      h("div", { className: "cs-row", style: { flexWrap: "nowrap", gap: 12, marginBottom: 12 } }, h(PlayerAvatar, { id: pl.id, name: pl.name, size: "lg", team: pl.team }),
        h("div", { style: { minWidth: 0 } }, h("div", { style: { fontWeight: 650, fontSize: 15 } }, pl.name), h("div", { className: "cs-row", style: { gap: 6, marginTop: 2 } }, h(TeamLogo, { team: pl.team, size: "xs" }), h("span", { className: "cs-muted", style: { fontSize: 12 } }, t.name + " · " + pl.pos)), pl.context ? h("div", { className: "cs-subtle", style: { fontSize: 12, marginTop: 2 } }, pl.context) : null)),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 } }, pl.stats.map(function (s) { return h("div", { key: s[0], className: "cs-tile", style: { padding: "8px 10px" } }, h("div", { className: "cs-tile-v", style: { fontSize: 22 } }, h(CountUp, { value: s[1], decimals: s[2] || 0 })), h("div", { className: "cs-tile-l" }, s[0])); })));
  }
  function ChatWatchCard(p) {
    return h("div", { className: "cs-rich", style: { width: 280 } }, h("div", { className: "cs-eyebrow", style: { marginBottom: 8 } }, "Dónde verlo · " + (p.country || "Venezuela")),
      h("div", { className: "cs-row" }, p.channels.map(function (c) { return h(ChannelChip, { key: c, channel: c, owned: p.owned && p.owned.indexOf(c) >= 0 }); })));
  }
  function Composer(p) {
    var st = useState(""), v = st[0], setV = st[1];
    return h("form", { className: "cs-composer", onSubmit: function (e) { e.preventDefault(); var t = v.trim(); if (!t || p.disabled) return; setV(""); p.onSend && p.onSend(t); } }, h("input", { placeholder: p.placeholder || "Pregunta sobre partidos o jugadores", "aria-label": "Mensaje", value: v, onChange: function (e) { setV(e.target.value); } }), h("button", { className: "cs-send cs-press", "aria-label": "Enviar", disabled: p.disabled }, h(Icon, { name: "send", weight: 2.4 })));
  }

  /* ================= Encabezado del partido ================= */
  function GameHeader(p) {
    var g = p.game, a = TEAMS[g.away.tri] || {}, hm = TEAMS[g.home.tri] || {};
    var team = function (s) { var t = TEAMS[g[s].tri] || {}; return h("div", { className: "cs-hero-team" }, h(TeamLogo, { team: g[s].tri, size: "lg" }), h("b", null, t.name), h("small", null, g[s].record)); };
    var mid = g.status === "scheduled"
      ? h("div", { className: "cs-hero-mid" }, h("span", { className: "cs-display", style: { fontSize: 40, fontWeight: 800, lineHeight: 1 } }, g.time), h("span", { className: "cs-hero-status" }, (g.dateLabel || "Hoy") + " · " + (g.tz || "hora local")))
      : h("div", { className: "cs-hero-mid" }, h("div", { className: "cs-hero-score" }, h(AnimatedScore, { value: g.away.score, size: "xl", dim: g.status === "final" && g.away.score < g.home.score }), h("span", { style: { opacity: .5, fontSize: 24 } }, "–"), h(AnimatedScore, { value: g.home.score, size: "xl", dim: g.status === "final" && g.home.score < g.away.score })),
        g.status === "live" ? h(LiveBadge, { clock: g.clock }) : h("span", { className: "cs-hero-status" }, g.ot ? "Final/OT" : "Final"));
    return h("header", { className: "cs-hero", style: { "--c-away": a.color, "--c-home": hm.color, paddingTop: p.top } },
      p.nav !== false ? h("div", { className: "cs-row", style: { justifyContent: "space-between", marginBottom: 12, flexWrap: "nowrap" } }, h("button", { className: "cs-iconbtn", "aria-label": "Volver", onClick: p.onBack }, h(Icon, { name: "back" })), h("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--on-media-muted)" } }, g.venue || ""), h("button", { className: "cs-iconbtn", "aria-label": "Compartir", onClick: p.onShare }, h(Icon, { name: "share" }))) : null,
      h("div", { className: "cs-hero-grid" }, team("away"), mid, team("home")));
  }
  function WatchSection(p) {
    var list = p.channels || [];
    return h("section", { className: "cs-panel" },
      h("div", { className: "cs-row", style: { justifyContent: "space-between", marginBottom: 12 } }, h("h3", { className: "cs-h", style: { margin: 0 } }, "Dónde verlo"), h("button", { className: "cs-row cs-muted", style: { gap: 4, fontSize: 13, fontWeight: 600 }, onClick: p.onCountry }, h(Icon, { name: "globe", style: { width: 16, height: 16 } }), p.country || "Venezuela", h(Icon, { name: "next", style: { width: 14, height: 14 } }))),
      h("div", { className: "cs-row" }, list.map(function (c) { return h(ChannelChip, { key: c, channel: c, size: "lg", showType: true, owned: p.owned && p.owned.indexOf(c) >= 0 }); })));
  }
  function LeaderRow(p) {
    var L = p.leader;
    return h("div", { className: "cs-row", style: { flexWrap: "nowrap", justifyContent: "space-between", padding: "10px 0", borderTop: p.first ? 0 : "1px solid var(--line)" } },
      ["away", "home"].map(function (s, i) { var x = L[s]; return h("div", { key: s, className: "cs-row", style: { flexWrap: "nowrap", gap: 10, flexDirection: i ? "row-reverse" : "row", textAlign: i ? "right" : "left", width: "42%" } }, h(PlayerAvatar, { id: x.id, name: x.name, size: "md", team: x.team }), h("div", { style: { minWidth: 0 } }, h("div", { className: "cs-display", style: { fontSize: 24, fontWeight: 700, lineHeight: 1 } }, h(CountUp, { value: x.v })), h("div", { style: { fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, shortName(x.name)))); }).reduce(function (acc, el, i) { if (i === 1) acc.push(h("span", { key: "m", className: "cs-eyebrow" }, L.label)); acc.push(el); return acc; }, []));
  }

  /* ================= Estados y extras ================= */
  function PullToRefresh(p) { return h("div", { className: "cs-ptr", "aria-label": "Actualizando" }, h("span", { className: "cs-ptr-ball" }, h(Ball, {}))); }
  function EmptyState(p) {
    var kind = p.kind || "no-games";
    var ill = kind === "offline"
      ? h("svg", { className: "cs-ill", viewBox: "0 0 160 120", fill: "none" }, h("rect", { x: 20, y: 26, width: 120, height: 74, rx: 14, fill: "var(--surface-raised)", stroke: "var(--line-strong)" }), h("path", { d: "M58 70a30 30 0 0 1 44 0M68 80a16 16 0 0 1 24 0", stroke: "var(--ink-subtle)", strokeWidth: 4, strokeLinecap: "round" }), h("circle", { cx: 80, cy: 88, r: 4, fill: "var(--ink-subtle)" }), h("path", { d: "M52 44l56 52", stroke: "var(--live)", strokeWidth: 4, strokeLinecap: "round" }))
      : h("svg", { className: "cs-ill", viewBox: "0 0 160 120", fill: "none" }, h("rect", { x: 10, y: 70, width: 140, height: 40, rx: 8, fill: "var(--surface-raised)" }), h("path", { d: "M10 90h140M80 70v40M58 110a22 22 0 0 1 44 0", stroke: "var(--line-strong)", strokeWidth: 2 }), h("g", { style: { color: "var(--brand)" } }, h("g", { transform: "translate(62 18) scale(1.5)" }, h(Ball, {}))), h("ellipse", { cx: 80, cy: 68, rx: 16, ry: 3, fill: "var(--line)" }));
    var title = p.title || (kind === "offline" ? "Sin conexión" : "No hay partidos este día");
    var body = p.body || (kind === "offline" ? "Te mostramos los últimos datos guardados. Actualizaremos apenas vuelva la conexión." : "Descansa la liga. Mira lo que viene mañana o revisa los resultados de ayer.");
    return h("div", { className: "cs-empty cs-pop-in" }, ill, h("h3", null, title), h("p", null, body), p.action ? h("div", { style: { marginTop: 8 } }, p.action) : null);
  }
  function OfflineBanner(p) { return h("div", { className: "cs-banner", role: "status" }, h(Icon, { name: "wifioff" }), h("div", { style: { flex: 1 } }, h("b", null, "Sin conexión. "), h("span", { className: "cs-muted" }, "Datos de las " + (p.time || "8:42 p. m."))), h("button", { className: "cs-btn-ghost", style: { fontWeight: 700, fontSize: 13 }, onClick: p.onRetry }, "Reintentar")); }
  function InstallPrompt(p) {
    var ios = p.platform === "ios";
    return h("div", { className: "cs-sheet", role: "dialog", "aria-label": "Instalar CourtSide" },
      h("div", { className: "cs-row", style: { flexWrap: "nowrap", gap: 14, marginBottom: 14 } }, h(AppMark, { size: 56 }), h("div", { style: { flex: 1 } }, h("div", { style: { fontWeight: 700, fontSize: 17 } }, "Instala CourtSide"), h("div", { className: "cs-muted", style: { fontSize: 13, lineHeight: "18px" } }, "Abre más rápido, recibe alertas de inicio y sigue los marcadores sin abrir el navegador.")), h("button", { className: "cs-iconbtn", "aria-label": "Cerrar", style: { alignSelf: "flex-start" }, onClick: p.onClose }, h(Icon, { name: "x" }))),
      ios ? h("div", null,
        [["1", "Toca Compartir en la barra de Safari", "share"], ["2", "Elige “Agregar a pantalla de inicio”", "plusbox"], ["3", "Confirma con “Agregar”", "check"]].map(function (s) { return h("div", { className: "cs-step", key: s[0] }, h("span", { className: "cs-step-n" }, s[0]), h("span", null, s[1]), h("span", { className: "cs-step-ic" }, h(Icon, { name: s[2] }))); }))
        : h("div", { className: "cs-row", style: { flexWrap: "nowrap" } }, h(Button, { variant: "secondary", style: { flex: 1 }, onClick: p.onClose }, "Ahora no"), h(Button, { variant: "primary", icon: "download", style: { flex: 1.4 }, onClick: p.onInstall }, "Instalar")));
  }
  function Splash(p) { return h("div", { className: "cs-splash", style: { height: p.height || 320, borderRadius: p.radius } }, h("div", { className: "cs-splash-mark", key: p.k }, h(AppMark, { size: 96 })), h("div", { className: "cs-splash-word", key: "w" + p.k }, "CourtSide")); }
  function Switch(p) { return h("button", { className: cx("cs-switch", p.on && "is-on"), role: "switch", "aria-checked": !!p.on, onClick: function () { p.onChange && p.onChange(!p.on); } }); }
  function SearchField(p) { return h("label", { className: "cs-search" }, h(Icon, { name: "search" }), h("input", { placeholder: p.placeholder || "Buscar jugador", value: p.value, onChange: function (e) { p.onChange && p.onChange(e.target.value); }, type: "search" })); }
  function PickTile(p) { return h("button", { className: cx("cs-pick cs-press", p.on && "is-on"), "aria-pressed": !!p.on, onClick: p.onClick }, p.on ? h("span", { className: "cs-pick-check" }, h(Icon, { name: "check", weight: 3 })) : null, p.children, h("span", null, p.label)); }

  return {
    TEAMS: TEAMS, CHANNELS: CHANNELS, teamLogoUrl: teamLogoUrl, headshotUrl: headshotUrl, cx: cx,
    Icon: Icon, Ball: Ball, AppMark: AppMark, Img: Img, TeamLogo: TeamLogo, PlayerAvatar: PlayerAvatar, LiveBadge: LiveBadge, AnimatedScore: AnimatedScore,
    ChannelChip: ChannelChip, FavoriteStar: FavoriteStar, GameCard: GameCard, GameCardSkeleton: GameCardSkeleton, Skeleton: Skeleton, DatePicker: DatePicker,
    Tabs: Tabs, TabPanel: TabPanel, Segmented: Segmented, CountUp: CountUp, StatTile: StatTile, CompareBar: CompareBar, PointsChart: PointsChart,
    StatTable: StatTable, LineScore: LineScore, PlayItem: PlayItem, BottomNav: BottomNav, SideRail: SideRail, Button: Button, AlertButton: AlertButton,
    ChatBubble: ChatBubble, StreamText: StreamText, TypingIndicator: TypingIndicator, SuggestionChip: SuggestionChip, ChatGameCard: ChatGameCard,
    ChatPlayerCard: ChatPlayerCard, ChatWatchCard: ChatWatchCard, Composer: Composer, GameHeader: GameHeader, WatchSection: WatchSection, LeaderRow: LeaderRow,
    PullToRefresh: PullToRefresh, EmptyState: EmptyState, OfflineBanner: OfflineBanner, InstallPrompt: InstallPrompt, Splash: Splash, Switch: Switch,
    SearchField: SearchField, PickTile: PickTile, shortName: shortName
  };
})();
export default C;
