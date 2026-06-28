import { type Session, SessionState } from '@dwatcher/types';
import { Paths, File as ExpoFile } from 'expo-file-system';

const SESSIONS_FILENAME = 'sessions.json';

interface SessionRow {
  id: string;
  dog_id: string;
  started_at: string;
  ended_at: string | null;
  state: string;
  device_battery_level: number;
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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function sessionsFile(): ExpoFile {
  return new ExpoFile(Paths.document, SESSIONS_FILENAME);
}

async function readAll(): Promise<SessionRow[]> {
  try {
    const file = sessionsFile();
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    return text ? JSON.parse(text) : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: SessionRow[]): Promise<void> {
  const file = sessionsFile();
  const stream = file.writableStream();
  const writer = stream.getWriter();
  const encoded = new TextEncoder().encode(JSON.stringify(rows));
  await writer.write(encoded);
  await writer.close();
}

export class SessionRepository {
  async createSession(dogId: string, batteryLevel: number): Promise<Session> {
    const rows = await readAll();
    const now = new Date().toISOString();
    const row: SessionRow = {
      id: generateId(),
      dog_id: dogId,
      started_at: now,
      ended_at: null,
      state: SessionState.Monitoring,
      device_battery_level: batteryLevel,
    };
    rows.push(row);
    await writeAll(rows);
    return rowToSession(row);
  }

  async getSession(id: string): Promise<Session | null> {
    const rows = await readAll();
    const row = rows.find((r) => r.id === id);
    return row ? rowToSession(row) : null;
  }

  async updateSessionState(id: string, state: SessionState, endedAt?: string): Promise<void> {
    const rows = await readAll();
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    row.state = state;
    if (endedAt !== undefined || state === SessionState.Ended) {
      row.ended_at = endedAt ?? new Date().toISOString();
    }
    await writeAll(rows);
  }

  async getActiveSession(): Promise<Session | null> {
    const rows = await readAll();
    const active = rows.find((r) =>
      [SessionState.Monitoring, SessionState.Paused].includes(r.state as SessionState),
    );
    return active ? rowToSession(active) : null;
  }

  async listSessions(limit = 20, offset = 0): Promise<Session[]> {
    const rows = await readAll();
    return rows
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(offset, offset + limit)
      .map(rowToSession);
  }

  async deleteSession(id: string): Promise<void> {
    const rows = await readAll();
    await writeAll(rows.filter((r) => r.id !== id));
  }
}
