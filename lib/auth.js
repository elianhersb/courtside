import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers.js"; // con .js para que también cargue en node --test
import { getDb, now } from "./db.js";

// Roles y lo que puede hacer cada uno. Un permiso nuevo se agrega aquí y se pide con can(user, "…").
export const ROLES = {
  user: [],
  admin: ["admin.view", "users.manage"],
};
export const can = (user, perm) => !!user && !user.disabled && (ROLES[user.role] || []).includes(perm);

const SESSION = "cs_session";
const SESSION_DAYS = 30;
const scryptAsync = promisify(scrypt);
const sha = (t) => createHash("sha256").update(t).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");

export { emailError, passwordError, nameError } from "./validate.js";

export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}
export async function verifyPassword(pw, stored) {
  const [alg, salt, hash] = (stored || "").split("$");
  if (alg !== "scrypt") return false;
  const key = await scryptAsync(pw, Buffer.from(salt, "base64"), 64);
  return timingSafeEqual(key, Buffer.from(hash, "base64"));
}

// Los correos de ADMIN_EMAILS son administradores, pero solo con el correo verificado:
// si no, cualquiera podría registrarse con ese correo y quedar como admin.
const adminEmails = () => (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
export function promoteIfAdmin(user) {
  if (user.email_verified && user.role !== "admin" && adminEmails().includes(user.email.toLowerCase())) {
    getDb().prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
    user.role = "admin";
  }
  return user;
}

export const userById = (id) => getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
export const userByEmail = (email) => getDb().prepare("SELECT * FROM users WHERE email = ?").get(email.trim());

export function createUser({ email, name = "", passwordHash = null, googleSub = null, verified = false }) {
  const r = getDb().prepare("INSERT INTO users (email, name, password_hash, google_sub, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(email.trim(), name.slice(0, 80), passwordHash, googleSub, verified ? 1 : 0, now());
  return promoteIfAdmin(userById(Number(r.lastInsertRowid)));
}

// Lo que ve el cliente: nunca el hash ni ids externos.
export const publicUser = (u) => u && {
  id: u.id, email: u.email, name: u.name, role: u.role, verified: !!u.email_verified,
  hasPassword: !!u.password_hash, google: !!u.google_sub, perms: ROLES[u.role] || [],
};

export async function startSession(userId) {
  const token = randomToken();
  const db = getDb();
  db.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(sha(token), userId, now(), now() + SESSION_DAYS * 864e5);
  db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(now(), userId);
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
  (await cookies()).set(SESSION, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400 });
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION)?.value;
  if (!token) return null;
  const u = getDb().prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?").get(sha(token), now());
  return u && !u.disabled ? u : null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  jar.delete(SESSION);
}

export const endAllSessions = (userId) => getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);

// Tokens de un solo uso para verificar el correo y recuperar la clave. En la base solo queda el hash.
export function issueToken(userId, kind, ttlMs) {
  const token = randomToken();
  const db = getDb();
  db.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = ?").run(userId, kind);
  db.prepare("INSERT INTO tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)").run(sha(token), userId, kind, now() + ttlMs);
  return token;
}
// peek: solo mira a quién pertenece, sin gastarlo (para validar antes de usarlo).
export function consumeToken(token, kind, peek = false) {
  if (typeof token !== "string" || token.length > 100) return null;
  const db = getDb();
  const row = db.prepare("SELECT user_id, expires_at FROM tokens WHERE token_hash = ? AND kind = ?").get(sha(token), kind);
  if (!row) return null;
  if (!peek) db.prepare("DELETE FROM tokens WHERE token_hash = ?").run(sha(token));
  return row.expires_at > now() ? row.user_id : null;
}

// Entrar con Google: por el id de Google, o enlazando una cuenta con el mismo correo.
export function googleUser({ sub, email, name }) {
  const db = getDb();
  let u = db.prepare("SELECT * FROM users WHERE google_sub = ?").get(sub);
  if (u) return u;
  u = userByEmail(email);
  if (!u) return createUser({ email, name: name || "", googleSub: sub, verified: true });
  // Si la cuenta existente nunca verificó el correo, la clave pudo ponerla otra persona: se borra.
  db.prepare(`UPDATE users SET google_sub = ?, email_verified = 1, name = CASE WHEN name = '' THEN ? ELSE name END${u.email_verified ? "" : ", password_hash = NULL"} WHERE id = ?`).run(sub, name || "", u.id);
  if (!u.email_verified) endAllSessions(u.id);
  return promoteIfAdmin(userById(u.id));
}

// Base para los enlaces de los correos y el regreso de Google. En producción tiene que venir de APP_URL:
// armarla con el Host del pedido permitiría mandar enlaces de recuperación a un dominio ajeno.
export function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("Falta APP_URL");
  return new URL(req.url).origin;
}
