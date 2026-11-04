import { test } from "node:test";
import assert from "node:assert/strict";
import { limiter } from "./ratelimit.js";

test("corta al llegar al máximo y se reinicia con la ventana", () => {
  const hit = limiter(2, 1000);
  assert.equal(hit("a", 0).ok, true);
  assert.equal(hit("a", 10).ok, true);
  assert.deepEqual(hit("a", 500), { ok: false, retry: 1 });
  assert.equal(hit("b", 500).ok, true);
  assert.equal(hit("a", 1000).ok, true);
});
