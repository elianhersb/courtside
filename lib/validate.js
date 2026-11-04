// Reglas de los formularios de cuenta. Las usan el navegador (mensajes al instante) y el servidor (la validación que cuenta).

export function emailError(e) {
  const v = typeof e === "string" ? e.trim() : "";
  if (!v) return "Escribe tu correo";
  if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Ese correo no parece válido (ejemplo: nombre@correo.com)";
  return null;
}

export function passwordError(p, email = "") {
  if (typeof p !== "string" || !p) return "Escribe una clave";
  if (p.length < 8) return "Usa al menos 8 caracteres";
  if (p.length > 128) return "Usa como máximo 128 caracteres";
  if (!/[A-Za-zÀ-ÿ]/.test(p) || !/\d/.test(p)) return "Combina letras y números";
  if (p.trim() !== p) return "La clave no puede empezar ni terminar con espacios";
  const user = String(email).split("@")[0].toLowerCase();
  if (user.length >= 4 && p.toLowerCase().includes(user)) return "No uses tu correo dentro de la clave";
  return null;
}

export function nameError(n) {
  const v = typeof n === "string" ? n.trim() : "";
  if (v.length > 80) return "Usa como máximo 80 caracteres";
  if (/[<>]/.test(v)) return "El nombre no puede tener < ni >";
  return null;
}

export const confirmError = (p, c) => (!c ? "Repite la clave" : p !== c ? "Las claves no coinciden" : null);

// Solo orientativo para el medidor: 0 vacía, 1 débil, 2 aceptable, 3 fuerte.
export function strength(p = "") {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return passwordError(p) ? 1 : s >= 3 ? 3 : 2;
}
