import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// SQLite en un archivo dentro de DATA_DIR (en Docker es un volumen). Una sola conexión por proceso.
// shortcut: SQLite sirve para una réplica con miles de usuarios; si se escala a varias réplicas, pasar a Postgres.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  google_sub TEXT UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'user',
  disabled INTEGER NOT NULL DEFAULT 0,
  prefs TEXT,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT '',
  standalone INTEGER NOT NULL DEFAULT 0,
  installed_at INTEGER,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS push_subs (
  endpoint TEXT PRIMARY KEY,
  sub TEXT NOT NULL,
  teams TEXT NOT NULL,
  notify TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS counters (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS devices_seen ON devices(last_seen);
`;

let db;
export function getDb() {
  if (db) return db;
  const dir = process.env.DATA_DIR || ".data";
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(process.env.DB_FILE || path.join(dir, "courtside.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;");
  db.exec(SCHEMA);
  return db;
}

export const now = () => Date.now();
export const today = () => new Date().toISOString().slice(0, 10);

// Contador diario simple para las métricas del panel (preguntas al chat, registros…).
export function count(kind, n = 1) {
  getDb().prepare("INSERT INTO counters (day, kind, n) VALUES (?, ?, ?) ON CONFLICT(day, kind) DO UPDATE SET n = n + excluded.n").run(today(), kind, n);
}
