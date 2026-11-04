import { test } from "node:test";
import assert from "node:assert/strict";
import { standings, bracket } from "./cup.js";

const game = (away, as, home, hs, round = "group") => ({ round, status: "final", away: { tri: away, score: as }, home: { tri: home, score: hs }, winner: as > hs ? away : home });

test("tabla de grupo con desempate por duelo directo y wild card", () => {
  const st = standings([game("DET", 100, "TOR", 90), game("TOR", 130, "ORL", 90), game("ORL", 99, "DET", 98), game("NYK", 120, "CLE", 100)]);
  const a = st.groups.find((g) => g.conf === "East" && g.name === "A");
  // DET, TOR y ORL 1-1: es triple empate, así que decide la diferencia (TOR +30).
  assert.deepEqual(a.rows.slice(0, 3).map((r) => r.tri), ["TOR", "DET", "ORL"]);
  assert.equal(a.rows[0].badge, "leader");
  assert.equal(st.seeds.East.length, 4);
  assert.equal(a.done, false);
});

test("la llave usa los partidos reales y avanza al ganador", () => {
  const seeds = { East: ["NYK", "ORL", "TOR", "MIA"], West: ["OKC", "SAS", "LAL", "PHX"] };
  const games = [game("MIA", 100, "NYK", 117, "qf"), game("TOR", 101, "ORL", 104, "qf"), game("ORL", 90, "NYK", 110, "sf")];
  const b = bracket(games, seeds, false);
  assert.equal(b.East.qf[0].winner, "NYK");
  assert.equal(b.East.qf[0].a.seed, 1);
  assert.equal(b.East.sf.winner, "NYK");
  assert.equal(b.West.sf.status, "tbd");
  assert.equal(b.final.a.tri, "NYK");
  assert.equal(b.final.b, null);
});
