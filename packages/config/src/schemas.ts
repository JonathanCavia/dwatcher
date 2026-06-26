import { z } from 'zod';

export const AppConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  audioSampleRate: z.number().default(16000),
  audioBufferDurationMs: z.number().default(2000),
  detectionThreshold: z.number().min(0).max(1).default(0.5),
  cooldownMs: z.number().default(3000),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const SignalingConfigSchema = z.object({
  signalingUrl: z.string().url(),
  reconnectInterval: z.number().default(3000),
  maxReconnectAttempts: z.number().default(10),
});

export type SignalingConfig = z.infer<typeof SignalingConfigSchema>;

export const MonitoringConfigSchema = z.object({
  cameraEnabled: z.boolean().default(true),
  audioEnabled: z.boolean().default(true),
  motionDetectionEnabled: z.boolean().default(false),
  snapshotIntervalMs: z.number().default(30000),
});

export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;

export function createAppConfig(raw: Record<string, unknown>): AppConfig {
  return AppConfigSchema.parse(raw);
}

export function createSignalingConfig(raw: Record<string, unknown>): SignalingConfig {
  return SignalingConfigSchema.parse(raw);
}

export function createMonitoringConfig(raw: Record<string, unknown>): MonitoringConfig {
  return MonitoringConfigSchema.parse(raw);
}
