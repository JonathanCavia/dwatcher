import type { DetectionClass } from '../enums/detection';

export interface BarkEvent {
  id: string;
  sessionId: string;
  detectedAt: string;
  confidence: number; // 0.0 – 1.0
  durationMs: number;
  peakAmplitude: number; // dBFS
  classification: DetectionClass;
  snapshotUri: string | null; // Camera snapshot taken concurrently
}
