import * as SQLite from "expo-sqlite";
import { File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";

const DATABASE_NAME = "pos.db";
const DATABASE_VERSION = 1;
const HASH_PREFIX = "sha256-v1";
const HASH_ITERATIONS = 1500;

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

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isHashedValue(value: string) {
  return value.startsWith(`${HASH_PREFIX}$`);
}

async function hashSecret(value: string, salt = bytesToHex(Crypto.getRandomBytes(16))) {
  let digest = `${salt}:${value}`;

  for (let index = 0; index < HASH_ITERATIONS; index += 1) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${digest}`
    );
  }

  return `${HASH_PREFIX}$${salt}$${HASH_ITERATIONS}$${digest}`;
}

async function verifySecret(value: string, storedValue: string) {
  if (!isHashedValue(storedValue)) {
    return value === storedValue;
  }

  const [, salt, iterationsText, expectedDigest] = storedValue.split("$");
  const iterations = Number(iterationsText);

  if (!salt || !iterations || !expectedDigest) {
    return false;
  }

  let digest = `${salt}:${value}`;

  for (let index = 0; index < iterations; index += 1) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${digest}`
    );
  }

  return digest === expectedDigest;
}

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
  await migratePlainTextSecrets(db);
}

async function migratePlainTextSecrets(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<UserRow>("SELECT * FROM users");

  for (const row of rows) {
    const nextPassword = isHashedValue(row.password)
      ? row.password
      : await hashSecret(row.password);
    const nextPin = isHashedValue(row.pin) ? row.pin : await hashSecret(row.pin);
    const nextSecurityAnswer = isHashedValue(row.security_answer)
      ? row.security_answer
      : await hashSecret(normalizeAnswer(row.security_answer));

    if (
      nextPassword !== row.password ||
      nextPin !== row.pin ||
      nextSecurityAnswer !== row.security_answer
    ) {
      await db.runAsync(
        `UPDATE users
         SET password = ?, pin = ?, security_answer = ?, updated_at = ?
         WHERE id = ?`,
        [nextPassword, nextPin, nextSecurityAnswer, Date.now(), row.id]
      );
    }
  }
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
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (!row || !(await verifySecret(password, row.password))) {
    return null;
  }

  return mapUser(row);
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

export async function verifyUserPin(username: string, pin: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return row ? verifySecret(pin, row.pin) : false;
}

export async function verifySecurityAnswer(username: string, securityAnswer: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return row ? verifySecret(normalizeAnswer(securityAnswer), row.security_answer) : false;
}

export async function createUser(input: CreateAuthUserInput) {
  const db = await getDatabase();
  const now = Date.now();
  const hashedPassword = await hashSecret(input.password);
  const hashedPin = await hashSecret(input.pin);
  const hashedSecurityAnswer = await hashSecret(normalizeAnswer(input.securityAnswer));
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
      hashedPassword,
      hashedPin,
      input.securityQuestion,
      hashedSecurityAnswer,
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
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (
    !row ||
    !(await verifySecret(pin, row.pin)) ||
    !(await verifySecret(normalizeAnswer(securityAnswer), row.security_answer))
  ) {
    throw new Error("PIN o respuesta de seguridad incorrectos.");
  }

  const result = await db.runAsync(
    `UPDATE users
     SET password = ?, updated_at = ?
     WHERE id = ?`,
    [await hashSecret(newPassword), Date.now(), row.id]
  );

  if (result.changes === 0) {
    throw new Error("PIN o respuesta de seguridad incorrectos.");
  }
}

export async function updatePasswordWithSecurityAnswer(
  username: string,
  securityAnswer: string,
  newPassword: string
) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (!row || !(await verifySecret(normalizeAnswer(securityAnswer), row.security_answer))) {
    throw new Error("Respuesta de seguridad incorrecta.");
  }

  const result = await db.runAsync(
    `UPDATE users
     SET password = ?, updated_at = ?
     WHERE id = ?`,
    [await hashSecret(newPassword), Date.now(), row.id]
  );

  if (result.changes === 0) {
    throw new Error("Respuesta de seguridad incorrecta.");
  }
}

export async function updatePinWithSecurityAnswer(
  username: string,
  securityAnswer: string,
  newPin: string
) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (!row || !(await verifySecret(normalizeAnswer(securityAnswer), row.security_answer))) {
    throw new Error("Respuesta de seguridad incorrecta.");
  }

  const result = await db.runAsync(
    `UPDATE users
     SET pin = ?, updated_at = ?
     WHERE id = ?`,
    [await hashSecret(newPin), Date.now(), row.id]
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
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (!row || !(await verifySecret(pin, row.pin))) {
    throw new Error("PIN incorrecto.");
  }

  const result = await db.runAsync(
    `UPDATE users
     SET security_question = ?, security_answer = ?, updated_at = ?
     WHERE id = ?`,
    [securityQuestion, await hashSecret(normalizeAnswer(securityAnswer)), Date.now(), row.id]
  );

  if (result.changes === 0) {
    throw new Error("PIN incorrecto.");
  }
}

export async function updateSecurityQuestionWithSecurityAnswer(
  username: string,
  currentSecurityAnswer: string,
  securityQuestion: string,
  securityAnswer: string
) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserRow>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (!row || !(await verifySecret(normalizeAnswer(currentSecurityAnswer), row.security_answer))) {
    throw new Error("Respuesta de seguridad incorrecta.");
  }

  const result = await db.runAsync(
    `UPDATE users
     SET security_question = ?, security_answer = ?, updated_at = ?
     WHERE id = ?`,
    [securityQuestion, await hashSecret(normalizeAnswer(securityAnswer)), Date.now(), row.id]
  );

  if (result.changes === 0) {
    throw new Error("Respuesta de seguridad incorrecta.");
  }
}

export async function exportDatabaseFile() {
  const db = await getDatabase();
  const bytes = await db.serializeAsync();
  const exportedFile = new File(Paths.cache, `pos-backup-${formatBackupDate(new Date())}.db`);

  exportedFile.create({ overwrite: true });
  exportedFile.write(bytes);

  return exportedFile.uri;
}

function formatBackupDate(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours()
  )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export async function importDatabaseBackup(fileUri: string) {
  const pickedFile = new File(fileUri);
  const bytes = await pickedFile.bytes();
  const sourceDb = await SQLite.deserializeDatabaseAsync(bytes);
  const destDb = await getDatabase();

  try {
    const hasUsersTable = await sourceDb.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users' LIMIT 1"
    );
    const hasSessionsTable = await sourceDb.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sessions' LIMIT 1"
    );

    if (!hasUsersTable || !hasSessionsTable) {
      throw new Error("El archivo seleccionado no es un backup valido de POS.");
    }

    await SQLite.backupDatabaseAsync({
      sourceDatabase: sourceDb,
      destDatabase: destDb,
    });
    await migrateDatabase(destDb);
    await clearSessions();
  } finally {
    await sourceDb.closeAsync();
  }
}
