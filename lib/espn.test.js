import { test } from "node:test";
import assert from "node:assert/strict";
import { statusOf, normalizeEvent, tri } from "./espn.js";
import { channelsFor } from "./channels.js";

test("estado del partido", () => {
  assert.deepEqual(statusOf({ type: { state: "pre" } }), { status: "scheduled" });
  assert.deepEqual(statusOf({ type: { state: "in", name: "STATUS_IN_PROGRESS" }, period: 3, displayClock: "4:21" }), { status: "live", clock: "Q3 4:21", ot: false });
  assert.equal(statusOf({ type: { state: "in", name: "STATUS_IN_PROGRESS" }, period: 5, displayClock: "1:00" }).clock, "OT1 1:00");
  assert.deepEqual(statusOf({ type: { state: "post" }, period: 5 }), { status: "final", ot: true });
});

test("abreviaturas ESPN → NBA", () => {
  assert.equal(tri("GS"), "GSW");
  assert.equal(tri("LAL"), "LAL");
});

test("normaliza un evento", () => {
  const team = (abbr, ha, score) => ({ homeAway: ha, score, team: { abbreviation: abbr }, records: [{ type: "total", summary: "3-1" }] });
  const g = normalizeEvent({ id: "1", date: "2026-11-05T00:00Z", status: { type: { state: "pre" } }, competitions: [{ competitors: [team("NY", "away", "0"), team("BOS", "home", "0")], geoBroadcasts: [{ media: { shortName: "ESPN" } }] }] });
  assert.equal(g.away.tri, "NYK");
  assert.equal(g.away.score, undefined);
  assert.deepEqual(g.broadcasts, ["ESPN"]);
});

test("ganador del partido final", () => {
  const team = (abbr, ha, score) => ({ homeAway: ha, score, team: { abbreviation: abbr } });
  const g = normalizeEvent({ id: "2", date: "", status: { type: { state: "post" }, period: 5 }, competitions: [{ competitors: [team("NO", "away", "135"), team("MEM", "home", "134")] }] });
  assert.equal(g.winner, "NOP");
});

test("dónde verlo por país", () => {
  assert.deepEqual(channelsFor(["ESPN"], "VE"), ["espn", "disney", "leaguepass"]);
  assert.deepEqual(channelsFor(["Prime Video"], "VE"), ["leaguepass"]);
  assert.deepEqual(channelsFor(["Prime Video"], "US"), ["prime", "leaguepass"]);
});
