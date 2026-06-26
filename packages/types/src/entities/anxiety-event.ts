import type { AnxietyFactor } from '../enums/anxiety';

export interface AnxietyEvent {
  id: string;
  sessionId: string;
  detectedAt: string;
  anxietyScore: number; // 0.0 – 1.0 composite score
  contributingFactors: AnxietyFactor[];
  durationMs: number;
  snapshotUri: string | null;
}
