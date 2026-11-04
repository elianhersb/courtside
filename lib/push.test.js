import { test } from "node:test";
import assert from "node:assert/strict";
import { alertsFor } from "./push.js";

const g = (status, a, h, clock) => ({ id: "1", status, clock, away: { tri: "LAL", score: a }, home: { tri: "BOS", score: h } });

test("avisa inicio, partido cerrado una sola vez y final; nada en la primera vuelta", () => {
  const prev = {};
  assert.deepEqual(alertsFor(prev, [g("live", 50, 40, "Q3 2:00")]), []);
  const prev2 = {};
  alertsFor(prev2, [g("scheduled")]);
  assert.deepEqual(alertsFor(prev2, [g("live", 0, 0, "Q1 12:00")]).map((x) => x.kind), ["start"]);
  assert.deepEqual(alertsFor(prev2, [g("live", 90, 95, "Q4 6:10")]), []);
  assert.deepEqual(alertsFor(prev2, [g("live", 98, 101, "Q4 3:20")]).map((x) => x.kind), ["close"]);
  assert.deepEqual(alertsFor(prev2, [g("live", 100, 101, "Q4 1:00")]), []);
  const end = alertsFor(prev2, [g("final", 104, 101)]);
  assert.deepEqual(end.map((x) => x.kind), ["end"]);
  assert.equal(end[0].title, "Final: LAL 104 - 101 BOS");
  assert.deepEqual(alertsFor(prev2, [g("final", 104, 101)]), []);
});
