import {
  type AudioRecorder,
  type RecorderState,
  type RecordingOptions,
} from 'expo-audio';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { AudioModule } from 'expo-audio';

// ─── Types ────────────────────────────────────────────────

export interface AudioServiceCallbacks {
  onVolumeUpdate?: (rms: number, dbfs: number) => void;
  onError?: (error: Error) => void;
}

// ─── Recording options ────────────────────────────────────

const RECORDING_OPTIONS: RecordingOptions = {
  isMeteringEnabled: true,
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  android: { outputFormat: 'default', audioEncoder: 'default' },
  ios: { outputFormat: 'lpcm', audioQuality: 0 },
};

// ─── Service ──────────────────────────────────────────────

export class AudioService {
  private recorder: AudioRecorder | null = null;
  private isActive = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: AudioServiceCallbacks = {};
  private readonly pollMs = 100;

  get active(): boolean {
    return this.isActive;
  }

  async startMonitoring(callbacks: AudioServiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    // Permission
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) throw new Error('Microphone permission required.');

    // Foreground service via audio mode
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

    // Create and start recorder
    const recorder = new AudioModule.AudioRecorder(RECORDING_OPTIONS);
    await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
    recorder.record();
    this.recorder = recorder;
    this.isActive = true;
    this.startPolling();
  }

  async stopMonitoring(): Promise<void> {
    this.stopPolling();
    if (this.recorder) {
      try { await this.recorder.stop(); } catch { /* ok */ }
      this.recorder = null;
    }
    this.isActive = false;
  }

  async pauseMonitoring(): Promise<void> {
    if (!this.isActive) return;
    this.stopPolling();
    this.recorder?.pause();
    this.isActive = false;
  }

  async resumeMonitoring(): Promise<void> {
    if (this.isActive || !this.recorder) return;
    this.recorder.record();
    this.isActive = true;
    this.startPolling();
  }

  // ─── Private ──────────────────────────────────────────────

  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      const rec = this.recorder;
      if (!rec) return;
      const state: RecorderState = rec.getStatus();
      if (!state.isRecording) return;
      const db: number = state.metering ?? -60;
      const dbfs = Math.max(-60, Number.isFinite(db) ? db : -60);
      this.callbacks.onVolumeUpdate?.(Math.pow(10, dbfs / 20), dbfs);
    }, this.pollMs);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
