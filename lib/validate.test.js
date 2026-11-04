import { test } from "node:test";
import assert from "node:assert/strict";
import { emailError, passwordError, confirmError, nameError, strength } from "./validate.js";

test("correo", () => {
  assert.equal(emailError(" ana@correo.com "), null);
  assert.equal(emailError(""), "Escribe tu correo");
  for (const bad of ["ana", "ana@", "ana@correo", "ana @correo.com", "ana@correo.c"]) assert.ok(emailError(bad), bad);
});

test("clave", () => {
  assert.equal(passwordError("cancha2026"), null);
  assert.equal(passwordError("corta1"), "Usa al menos 8 caracteres");
  assert.equal(passwordError("soloLetras"), "Combina letras y números");
  assert.equal(passwordError("12345678"), "Combina letras y números");
  assert.equal(passwordError(" cancha2026"), "La clave no puede empezar ni terminar con espacios");
  assert.equal(passwordError("elianhers99", "elianhers@correo.com"), "No uses tu correo dentro de la clave");
  assert.equal(confirmError("cancha2026", "cancha2025"), "Las claves no coinciden");
  assert.equal(confirmError("cancha2026", "cancha2026"), null);
  assert.equal(nameError("<script>"), "El nombre no puede tener < ni >");
  assert.deepEqual(["corta", "cancha2026", "Cancha-2026-final"].map((p) => strength(p)), [1, 2, 3]);
});
