import type { SQLiteDatabase } from 'expo-sqlite';

const CREATE_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    dog_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    state TEXT NOT NULL DEFAULT 'idle'
      CHECK(state IN ('idle', 'monitoring', 'paused', 'ended')),
    device_battery_level REAL NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const CREATE_SESSIONS_STATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_sessions_state
  ON sessions(state);
`;

const CREATE_SESSIONS_STARTED_AT_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_sessions_started_at
  ON sessions(started_at DESC);
`;

export function up(db: SQLiteDatabase): void {
  db.execSync(CREATE_SESSIONS_TABLE);
  db.execSync(CREATE_SESSIONS_STATE_INDEX);
  db.execSync(CREATE_SESSIONS_STARTED_AT_INDEX);
}
