import type { SessionState } from '../enums/session';

export interface Session {
  id: string;
  dogId: string;
  startedAt: string;
  endedAt: string | null;
  state: SessionState;
  deviceBatteryLevel: number;
}
