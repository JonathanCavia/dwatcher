import { type Session, SessionState } from '@dwatcher/types';

import { getDatabase } from '../init';

function generateId(): string {
  // Simple UUID v4 generation using available APIs
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  // Set version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

interface SessionRow {
  id: string;
  dog_id: string;
  started_at: string;
  ended_at: string | null;
  state: string;
  device_battery_level: number;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    dogId: row.dog_id,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    state: row.state as SessionState,
    deviceBatteryLevel: row.device_battery_level,
  };
}

export class SessionRepository {
  /**
   * Create a new monitoring session and return the Session entity.
   */
  createSession(dogId: string, batteryLevel: number): Session {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO sessions (id, dog_id, started_at, state, device_battery_level)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      dogId,
      now,
      SessionState.Monitoring,
      batteryLevel,
    );

    return {
      id,
      dogId,
      startedAt: now,
      endedAt: null,
      state: SessionState.Monitoring,
      deviceBatteryLevel: batteryLevel,
    };
  }

  /**
   * Retrieve a session by its ID.
   */
  getSession(id: string): Session | null {
    const db = getDatabase();
    const row = db.getFirstSync<SessionRow>('SELECT * FROM sessions WHERE id = ?', id);
    return row ? rowToSession(row) : null;
  }

  /**
   * Update the session state and optionally set the ended_at timestamp.
   */
  updateSessionState(id: string, state: SessionState, endedAt?: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    if (endedAt !== undefined || state === 'ended') {
      db.runSync(
        'UPDATE sessions SET state = ?, ended_at = ?, updated_at = ? WHERE id = ?',
        state,
        endedAt ?? now,
        now,
        id,
      );
    } else {
      db.runSync(
        'UPDATE sessions SET state = ?, updated_at = ? WHERE id = ?',
        state,
        now,
        id,
      );
    }
  }

  /**
   * Get the currently active session, if any.
   * An active session is one in 'monitoring' or 'paused' state.
   */
  getActiveSession(): Session | null {
    const db = getDatabase();
    const row = db.getFirstSync<SessionRow>(
      "SELECT * FROM sessions WHERE state IN ('monitoring', 'paused') ORDER BY started_at DESC LIMIT 1",
    );
    return row ? rowToSession(row) : null;
  }

  /**
   * List sessions ordered by most recent first.
   */
  listSessions(limit = 20, offset = 0): Session[] {
    const db = getDatabase();
    const rows = db.getAllSync<SessionRow>(
      'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ? OFFSET ?',
      limit,
      offset,
    );
    return rows.map(rowToSession);
  }

  /**
   * Delete a session and its associated data.
   */
  deleteSession(id: string): void {
    const db = getDatabase();
    db.runSync('DELETE FROM sessions WHERE id = ?', id);
  }
}
