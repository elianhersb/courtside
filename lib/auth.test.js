import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DB_FILE = ":memory:";
process.env.ADMIN_EMAILS = "jefe@test.com";
const { hashPassword, verifyPassword, createUser, googleUser, can, consumeToken, issueToken } = await import("./auth.js");

test("clave: el hash verifica la correcta y rechaza otra", async () => {
  const h = await hashPassword("claveSegura1");
  assert.equal(await verifyPassword("claveSegura1", h), true);
  assert.equal(await verifyPassword("otraClave", h), false);
  assert.equal(await verifyPassword("x", null), false);
});

test("admin por correo solo con el correo verificado", () => {
  const u = createUser({ email: "jefe@test.com", passwordHash: "x" });
  assert.equal(u.role, "user");
  assert.equal(can(u, "admin.view"), false);
  const g = googleUser({ sub: "g-jefe", email: "jefe@test.com", name: "Jefe" });
  assert.equal(g.role, "admin");
  assert.equal(can(g, "users.manage"), true);
});

test("Google sobre una cuenta sin verificar borra la clave que pudo poner otro", () => {
  createUser({ email: "victima@test.com", passwordHash: "clave-del-atacante" });
  const g = googleUser({ sub: "g-1", email: "VICTIMA@test.com", name: "V" });
  assert.equal(g.password_hash, null);
  assert.equal(g.email_verified, 1);
  assert.equal(googleUser({ sub: "g-1", email: "victima@test.com" }).id, g.id);
});

test("tokens de un solo uso", () => {
  const u = createUser({ email: "t@test.com" });
  const t = issueToken(u.id, "reset", 60e3);
  assert.equal(consumeToken(t, "verify"), null);
  assert.equal(consumeToken(t, "reset"), u.id);
  assert.equal(consumeToken(t, "reset"), null);
  assert.equal(consumeToken(issueToken(u.id, "reset", -1), "reset"), null);
});
