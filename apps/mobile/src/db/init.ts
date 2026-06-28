import { type SQLiteDatabase, openDatabaseSync } from 'expo-sqlite';

import { runMigrations } from './migrations';

let _db: SQLiteDatabase | null = null;

/**
 * Returns the singleton SQLite database handle.
 * Opens the database on first call and runs pending migrations.
 */
export function getDatabase(): SQLiteDatabase {
  if (!_db) {
    _db = openDatabaseSync('dwatcher.db');
    _db.execSync('PRAGMA journal_mode = WAL;');
    _db.execSync('PRAGMA foreign_keys = ON;');
    runMigrations(_db);
  }
  return _db;
}

/**
 * Close and release the database handle.
 * Next call to `getDatabase()` will re-open a fresh handle.
 */
export function closeDatabase(): void {
  if (_db) {
    _db.closeSync();
    _db = null;
  }
}
