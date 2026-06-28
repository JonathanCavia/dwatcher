import { CircularBuffer } from '../audio/CircularBuffer';
import { SessionRepository } from '../db';
import { useSessionStore } from '../stores/session-store';
import { useAudioStore } from '../stores/audio-store';
import { AudioService } from './audio-service';

export class MonitoringService {
  private audioService: AudioService;
  private sessionRepo: SessionRepository;
  private circularBuffer: CircularBuffer;

  constructor() {
    this.circularBuffer = new CircularBuffer();
    this.audioService = new AudioService(this.circularBuffer);
    this.sessionRepo = new SessionRepository();
  }

  async startSession(dogId: string): Promise<void> {
    await this.audioService.startMonitoring({
      onVolumeUpdate: (rms, dbfs) => {
        useAudioStore.getState().setAudioLevel(rms, dbfs);
      },
      onError: (error) => {
        console.warn('[MonitoringService] Audio error:', error.message);
      },
    });

    const batteryLevel = 100; // TODO: integrate expo-battery
    await useSessionStore.getState().startMonitoring(dogId, batteryLevel);
    useAudioStore.getState().setMonitoring(true);
  }

  async pauseSession(): Promise<void> {
    this.audioService.pauseMonitoring();
    await useSessionStore.getState().pauseMonitoring();
    useAudioStore.getState().setMonitoring(false);
  }

  async resumeSession(): Promise<void> {
    this.audioService.resumeMonitoring();
    await useSessionStore.getState().resumeMonitoring();
    useAudioStore.getState().setMonitoring(true);
  }

  async stopSession(): Promise<void> {
    await this.audioService.stopMonitoring();
    useAudioStore.getState().reset();
    await useSessionStore.getState().stopMonitoring();
  }

  getBuffer(): CircularBuffer {
    return this.circularBuffer;
  }

  get isActive(): boolean {
    return this.audioService.active;
  }
}

export const monitoringService = new MonitoringService();
