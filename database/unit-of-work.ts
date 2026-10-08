import { Platform } from "react-native";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { getDatabase } from "./auth-database";

export type DatabaseExecutor = Pick<SQLiteDatabase, "getFirstAsync" | "getAllAsync" | "runAsync">;
let queue: Promise<unknown> = Promise.resolve();
export function serializeDatabase<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work); queue = result.catch(() => undefined); return result;
}
export async function withPosTransaction<T>(work: (tx: DatabaseExecutor) => Promise<T>) {
  return serializeDatabase(async () => {
    const db = await getDatabase(); let value!: T;
    if (Platform.OS === "web") await db.withTransactionAsync(async () => { value = await work(db); });
    else {
      // Owned connection prevents unrelated queries from joining this transaction.
      // FK enforcement must be set before BEGIN, separately for every connection.
      const owned = await openDatabaseAsync("pos.db", { useNewConnection: true });
      try {
        await owned.execAsync("PRAGMA foreign_keys = ON");
        await owned.withTransactionAsync(async () => { value = await work(owned); });
      } finally { await owned.closeAsync(); }
    }
    return value;
  });
}
