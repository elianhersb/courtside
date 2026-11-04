// Partido → canales/suscripciones por país, a partir de las televisoras de EE.UU. que reporta ESPN.
// shortcut: reglas fijas por país; los canales locales (Meridiano, Televen) no salen hasta conectar el scraper de guías EPG.
const US = { ESPN: "espn", ESPN2: "espn", ABC: "abc", NBC: "nbc", NBCSN: "nbc", Peacock: "peacock", "Prime Video": "prime" };

export const COUNTRIES = { VE: "Venezuela", US: "Estados Unidos" };

export function channelsFor(broadcasts = [], country = "VE") {
  const us = [...new Set(broadcasts.map((b) => US[b]).filter(Boolean))];
  const out = [];
  if (country === "US") out.push(...us);
  // En Latinoamérica los juegos de ESPN/ABC de EE.UU. suelen ir por ESPN, y ESPN en streaming está en Disney+.
  else if (us.includes("espn") || us.includes("abc")) out.push("espn", "disney");
  out.push("leaguepass");
  return out;
}
