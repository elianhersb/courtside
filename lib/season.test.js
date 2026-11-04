import { test } from "node:test";
import assert from "node:assert/strict";
import { roundOf, seriesOf, playoffBracket, playIn, normalizeStandings } from "./season.js";

const T = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"];
const table = (p) => T.map((t, i) => ({ tri: p + t, seed: i + 1 }));
const standings = { East: table("E"), West: table("W") };
let n = 0;
const g = (round, conf, away, home, winner, status = "final") => ({ id: String(++n), date: `2027-04-${String(10 + n).padStart(2, "0")}`, round, conf, status, away: { tri: away, score: winner === away ? 110 : 100 }, home: { tri: home, score: winner === home ? 110 : 100 }, winner: status === "final" ? winner : undefined });

test("rondas desde el titular de ESPN", () => {
  assert.deepEqual(roundOf("East 1st Round - Game 3"), { conf: "East", round: "r1" });
  assert.deepEqual(roundOf("West Finals - Game 7"), { conf: "West", round: "cf" });
  assert.deepEqual(roundOf("NBA Finals - Game 2"), { conf: null, round: "finals" });
  assert.deepEqual(roundOf("NBA Play-In - West - 8th Seed Game"), { conf: "West", round: "pi8" });
  assert.equal(roundOf("NBA Cup - Group Play"), null);
});

test("tabla: marca clasificados, play-in y eliminados", () => {
  const e = (abbr, seed, clincher) => ({ team: { abbreviation: abbr }, stats: [{ name: "playoffSeed", value: seed }, { name: "wins", value: 50 }, { name: "losses", value: 32 }, { name: "clincher", displayValue: clincher }] });
  const st = normalizeStandings({ children: [{ abbreviation: "East", standings: { entries: [e("NY", 2, "x"), e("BOS", 1, "z"), e("MIA", 9, "pb")] } }] });
  assert.deepEqual(st.East.map((r) => [r.tri, r.clinch]), [["BOS", "in"], ["NYK", "in"], ["MIA", "playin"]]);
});

test("proyección de llave 1-8, 4-5, 3-6, 2-7", () => {
  const b = playoffBracket(standings, [], playIn(standings, []));
  assert.deepEqual(b.East.r1.map((m) => [m.a.tri, m.b.tri]), [["EA1", "EA8"], ["EA4", "EA5"], ["EA3", "EA6"], ["EA2", "EA7"]]);
  assert.equal(b.East.r1[0].projected, true);
  assert.equal(b.finals.status, "tbd");
});

test("series reales: cuenta victorias y avanza al ganador; el play-in define el 8.º", () => {
  const pi = [g("pi78", "East", "EA8", "EA7", "EA7"), g("pi910", "East", "EA10", "EA9", "EA10"), g("pi8", "East", "EA10", "EA8", "EA10")];
  const r1 = [1, 2, 3, 4].map(() => g("r1", "East", "EA10", "EA1", "EA1"));
  const play = playIn(standings, pi);
  assert.equal(play.East.c.winner, "EA10");
  const b = playoffBracket(standings, seriesOf(r1), play);
  assert.deepEqual([b.East.r1[0].a.tri, b.East.r1[0].b.tri], ["EA1", "EA10"]);
  assert.equal(b.East.r1[0].a.wins, 4);
  assert.equal(b.East.r1[0].winner, "EA1");
  assert.equal(b.East.sf[0].a.tri, "EA1");
  const open = seriesOf([g("r1", "West", "WA8", "WA1", "WA8"), g("r1", "West", "WA8", "WA1", null, "scheduled")]);
  assert.equal(open[0].winner, null);
  assert.equal(open[0].next.status, "scheduled");
});

test("temporadas viejas: ronda por orden, al mejor de 5 hasta 2002 y ganadores faltantes", async () => {
  const { inferRounds, fillWinners, winsNeeded } = await import("./season.js");
  assert.deepEqual(roundOf("WESTERN CONFERENCE FIRST ROUND"), { conf: "West", round: "r1" });
  const confOf = { A: "East", B: "East", C: "East", D: "East", W: "West", X: "West" };
  const mk = (d, a, h, w) => ({ id: d, date: `1998-${d}`, status: "final", away: { tri: a }, home: { tri: h }, winner: w });
  const games = inferRounds([mk("04-20", "B", "A", "A"), mk("04-21", "D", "C", "C"), mk("05-05", "C", "A", "A"), mk("06-01", "W", "A", "A")], confOf);
  assert.deepEqual(games.map((g) => g.round), ["r1", "r1", "sf", "finals"]);
  assert.equal(winsNeeded("r1", 1998), 3);
  assert.equal(winsNeeded("r1", 2003), 4);
  const s = seriesOf([...[1, 2].map((i) => ({ ...mk(`04-2${i}`, "B", "A", "A"), round: "r1", conf: "East" })), { ...mk("05-05", "C", "A", "A"), round: "sf", conf: "East" }], 1998);
  assert.equal(s[0].winner, null);
  fillWinners(s);
  assert.equal(s[0].winner, "A");
  assert.equal(s[0].incomplete, true);
});
