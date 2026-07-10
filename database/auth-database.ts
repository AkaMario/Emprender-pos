import * as SQLite from "expo-sqlite";
import { File, Paths } from "expo-file-system";

const DATABASE_NAME = "pos.db";
const DATABASE_VERSION = 1;

type UserRow = {
  id: number;
  username: string;
  password: string;
  pin: string;
  security_question: string;
  security_answer: string;
  created_at: number;
  updated_at: number;
};

export type AuthUser = {
  id: number;
  username: string;
  password: string;
  pin: string;
  securityQuestion: string;
  securityAnswer: string;
};

export type CreateAuthUserInput = {
  username: string;
  password: string;
  pin: string;
  securityQuestion: string;
  securityAnswer: string;
};

type SecurityQuestionRow = {
  security_question: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    pin: row.pin,
    securityQuestion: row.security_question,
    securityAnswer: row.security_answer,
  };
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

async function migrateDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      pin TEXT NOT NULL,
      security_question TEXT NOT NULL,
      security_answer TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrateDatabase(db);
      return db;
    });
  }

  return databasePromise;
}

export async function getFirstUser() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users ORDER BY id ASC LIMIT 1"
  );

  return row ? mapUser(row) : null;
}

export async function getUserByCredentials(username: string, password: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1",
    [username, password]
  );

  return row ? mapUser(row) : null;
}

export async function getUserByUsername(username: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return row ? mapUser(row) : null;
}

export async function getSecurityQuestionByUsername(username: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SecurityQuestionRow>(
    "SELECT security_question FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return row?.security_question ?? null;
}

export async function createUser(input: CreateAuthUserInput) {
  const db = await getDatabase();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO users (
      username,
      password,
      pin,
      security_question,
      security_answer,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.username,
      input.password,
      input.pin,
      input.securityQuestion,
      input.securityAnswer,
      now,
      now,
    ]
  );

  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [result.lastInsertRowId]
  );

  if (!row) {
    throw new Error("No se pudo crear el usuario local.");
  }

  return mapUser(row);
}

export async function createSession(userId: number, token: string, expiresAt: number) {
  const db = await getDatabase();

  await db.runAsync(
    "INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)",
    [userId, token, expiresAt, Date.now()]
  );
}

export async function getValidSessionUser() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    `SELECT users.*
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.expires_at > ?
     ORDER BY sessions.expires_at DESC
     LIMIT 1`,
    [Date.now()]
  );

  return row ? mapUser(row) : null;
}

export async function deleteExpiredSessions() {
  const db = await getDatabase();

  await db.runAsync("DELETE FROM sessions WHERE expires_at <= ?", [Date.now()]);
}

export async function clearSessions() {
  const db = await getDatabase();

  await db.runAsync("DELETE FROM sessions");
}

export async function updatePasswordWithRecovery(
  username: string,
  pin: string,
  securityAnswer: string,
  newPassword: string
) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE users
     SET password = ?, updated_at = ?
     WHERE username = ? AND pin = ? AND security_answer = ?`,
    [newPassword, Date.now(), username, pin, normalizeAnswer(securityAnswer)]
  );

  if (result.changes === 0) {
    throw new Error("PIN o respuesta de seguridad incorrectos.");
  }
}

export async function updatePinWithSecurityAnswer(
  username: string,
  securityAnswer: string,
  newPin: string
) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE users
     SET pin = ?, updated_at = ?
     WHERE username = ? AND security_answer = ?`,
    [newPin, Date.now(), username, normalizeAnswer(securityAnswer)]
  );

  if (result.changes === 0) {
    throw new Error("Respuesta de seguridad incorrecta.");
  }
}

export async function updateSecurityQuestionWithPin(
  username: string,
  pin: string,
  securityQuestion: string,
  securityAnswer: string
) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE users
     SET security_question = ?, security_answer = ?, updated_at = ?
     WHERE username = ? AND pin = ?`,
    [securityQuestion, normalizeAnswer(securityAnswer), Date.now(), username, pin]
  );

  if (result.changes === 0) {
    throw new Error("PIN incorrecto.");
  }
}

export async function exportDatabaseFile() {
  const db = await getDatabase();
  const bytes = await db.serializeAsync();
  const exportedFile = new File(Paths.cache, `pos-export-${Date.now()}.db`);

  exportedFile.create({ overwrite: true });
  exportedFile.write(bytes);

  return exportedFile.uri;
}
