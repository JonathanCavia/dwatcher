import { SessionRepository } from '../db';
import { useSessionStore } from '../stores/session-store';
import { useAudioStore } from '../stores/audio-store';
import { AudioService } from './audio-service';
import { requestMicrophonePermission } from '../utils/permissions';

/**
 * Orchestrator that coordinates AudioService, SessionRepository, and Zustand
 * stores during a monitoring session.
 *
 * Provides a single, imperative API that the UI layer calls — the UI never
 * talks to stores or services directly except through this class.
 */
export class MonitoringService {
  private audioService: AudioService;
  private sessionRepo: SessionRepository;

  constructor() {
    this.audioService = new AudioService();
    this.sessionRepo = new SessionRepository();
  }

  // ── Session lifecycle ──────────────────────────────────

  async startSession(dogId: string): Promise<void> {
    // 1. Permission gate
    const granted = await requestMicrophonePermission();
    if (!granted) {
      throw new Error('Microphone permission is required to monitor your dog.');
    }

    // 2. Start audio capture (foreground service on Android)
    await this.audioService.startMonitoring({
      onVolumeUpdate: (rms, dbfs) => {
        useAudioStore.getState().setAudioLevel(rms, dbfs);
      },
      onError: (error) => {
        console.warn('[MonitoringService] Audio error:', error.message);
      },
    });

    // 3. Persist session row
    const batteryLevel = 100; // TODO: integrate expo-battery
    await useSessionStore.getState().startMonitoring(dogId, batteryLevel);

    // 4. Sync audio store flag
    useAudioStore.getState().setMonitoring(true);
  }

  async pauseSession(): Promise<void> {
    await this.audioService.pauseMonitoring();
    await useSessionStore.getState().pauseMonitoring();
    useAudioStore.getState().setMonitoring(false);
  }

  async resumeSession(): Promise<void> {
    await this.audioService.resumeMonitoring();
    await useSessionStore.getState().resumeMonitoring();
    useAudioStore.getState().setMonitoring(true);
  }

  async stopSession(): Promise<void> {
    await this.audioService.stopMonitoring();
    useAudioStore.getState().reset();
    await useSessionStore.getState().stopMonitoring();
    // TODO T-PM-03: trigger post-session computation + navigate to summary
  }

  // ── Getters ─────────────────────────────────────────────

  get isActive(): boolean {
    return this.audioService.active;
  }
}

/** Singleton instance for the app. */
export const monitoringService = new MonitoringService();
