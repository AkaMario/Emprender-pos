import { getDatabase } from './auth-database';
import { serializeDatabase } from './unit-of-work';
import type { BusinessModel } from '../domain/business';

const key = (model: BusinessModel) => `business_tutorial_seen:${model}`;
export function hasSeenBusinessTutorial(model: BusinessModel) {
  return serializeDatabase(async () => {
    const row = await (await getDatabase()).getFirstAsync<{ value: string | null }>('SELECT value FROM settings WHERE key=?', [key(model)]);
    return row?.value === '1';
  });
}
export function markBusinessTutorialSeen(model: BusinessModel) {
  return serializeDatabase(async () => {
    await (await getDatabase()).runAsync('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,?)', [key(model), '1', Date.now()]);
  });
}
