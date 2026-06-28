import type { SQLiteDatabase } from 'expo-sqlite';

import { up as migration001 } from './001_create_sessions';

/**
 * All migrations in order.
 * Each migration exports an `up(db)` function.
 * Migrations use IF NOT EXISTS so they are safe to run multiple times.
 */
const migrations = [migration001];

/**
 * Run all pending migrations against the database.
 */
export function runMigrations(db: SQLiteDatabase): void {
  for (const migration of migrations) {
    migration(db);
  }
}
