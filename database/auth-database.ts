import * as SQLite from "expo-sqlite";
import { File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { BUSINESS_SCHEMA } from "./business-schema";

const DATABASE_NAME = "pos.db";
const DATABASE_VERSION = 4;
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
  const version = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  if ((version?.user_version ?? 0) > DATABASE_VERSION) {
    throw new Error("Este backup requiere una versión más reciente de la aplicación.");
  }
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

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      current_quantity REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL NOT NULL DEFAULT 0,
      critical_stock_threshold REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      category TEXT NOT NULL,
      size TEXT NOT NULL,
      image_uri TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dish_recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dish_id INTEGER NOT NULL,
      inventory_item_id INTEGER NOT NULL,
      quantity REAL NOT NULL CHECK (quantity > 0),
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT NOT NULL UNIQUE,
      order_type TEXT NOT NULL,
      table_number TEXT,
      customer_id INTEGER,
      customer_name TEXT,
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      payment_method TEXT,
      amount_received INTEGER,
      change_amount INTEGER,
      transfer_reference TEXT,
      status TEXT NOT NULL,
      cancellation_reason TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      cancelled_at INTEGER,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      dish_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_item_id INTEGER NOT NULL,
      sale_id INTEGER,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reason TEXT,
      supplier TEXT,
      invoice_number TEXT,
      unit_cost INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      message TEXT NOT NULL,
      source_key TEXT,
      status TEXT NOT NULL DEFAULT 'Pendiente',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      resolved_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_dishes_active_category ON dishes(is_active, category);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT NOT NULL PRIMARY KEY,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  await ensureColumn(db, "alerts", "source_key", "TEXT");
  await ensureColumn(db, "alerts", "status", "TEXT NOT NULL DEFAULT 'Pendiente'");
  await ensureColumn(db, "alerts", "resolved_at", "INTEGER");
  await ensureColumn(db, "inventory_items", "category", "TEXT NOT NULL DEFAULT 'Otro'");
  await ensureColumn(db, "inventory_movements", "supplier", "TEXT");
  await ensureColumn(db, "inventory_movements", "invoice_number", "TEXT");
  await ensureColumn(db, "inventory_movements", "unit_cost", "INTEGER");
  await ensureColumn(db, "inventory_movements", "notes", "TEXT");
  await db.execAsync("CREATE INDEX IF NOT EXISTS idx_alerts_pending ON alerts(is_read, resolved_at)");
  await db.execAsync("CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_source_key ON alerts(source_key)");

  await syncProductCategoriesFromDishes(db);
  await syncInventoryCategoriesFromItems(db);

  await db.withTransactionAsync(async () => {
    await db.execAsync(BUSINESS_SCHEMA);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
  await migratePlainTextSecrets(db);
}

async function syncProductCategoriesFromDishes(db: SQLite.SQLiteDatabase) {
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO product_categories (name, created_at, updated_at)
     SELECT DISTINCT TRIM(category), ?, ?
     FROM dishes
     WHERE TRIM(category) <> ''`,
    [now, now]
  );
}

async function syncInventoryCategoriesFromItems(db: SQLite.SQLiteDatabase) {
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO inventory_categories (name, created_at, updated_at)
     SELECT DISTINCT TRIM(category), ?, ?
     FROM inventory_items
     WHERE TRIM(category) <> ''`,
    [now, now]
  );
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  definition: string
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);

  if (!columns.some((column) => column.name === columnName)) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
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
      try {
        await migrateDatabase(db);
        return db;
      } catch (error) {
        await db.closeAsync();
        throw error;
      }
    }).catch((error) => { databasePromise = null; throw error; });
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

    const sourceVersion = await sourceDb.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    if ((sourceVersion?.user_version ?? 0) > DATABASE_VERSION) {
      throw new Error("Este backup pertenece a una versión más reciente. Actualiza la aplicación antes de importarlo.");
    }
    const integrity = await sourceDb.getFirstAsync<{ integrity_check: string }>("PRAGMA integrity_check");
    if (integrity?.integrity_check !== "ok") throw new Error("El backup tiene errores de integridad.");
    // Upgrade the staging database before replacing the current business.
    await migrateDatabase(sourceDb);
    const violations = await sourceDb.getAllAsync("PRAGMA foreign_key_check");
    if (violations.length) throw new Error("El backup tiene relaciones de datos inválidas.");

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
