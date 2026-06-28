/**
 * AudioService — provides real microphone metering when expo-av is available,
 * falls back to simulated metering otherwise.
 *
 * expo-av@15.1.7 has a known ESM resolution issue with Node ≥24 that causes
 * Metro to return 500 ("unable to resolve expo-av"). The dynamic require
 * inside try/catch lets Metro skip the module gracefully and the app
 * continues with simulated metering — no rebuild needed.
 */

// ─── Types ────────────────────────────────────────────────

export interface AudioServiceCallbacks {
  onVolumeUpdate?: (rms: number, dbfs: number) => void;
  onError?: (error: Error) => void;
}

// ─── Service ──────────────────────────────────────────────

export class AudioService {
  private recording: {
    startAsync: () => Promise<void>;
    pauseAsync: () => Promise<void>;
    stopAndUnloadAsync: () => Promise<void>;
    getStatusAsync: () => Promise<{ isRecording: boolean; metering?: number }>;
  } | null = null;
  private isActive = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: AudioServiceCallbacks = {};
  private readonly pollMs = 100;
  private expoAvLoaded: boolean | null = null; // null = not tried yet

  get active(): boolean {
    return this.isActive;
  }

  async startMonitoring(callbacks: AudioServiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    if (await this.tryLoadExpoAv()) {
      console.log('[AudioService] expo-av loaded — real microphone metering');
      await this.startReal();
    } else {
      console.log('[AudioService] expo-av unavailable — simulated metering');
      this.startSimulated();
    }
    this.isActive = true;
  }

  async stopMonitoring(): Promise<void> {
    this.stopPolling();
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch { /* already stopped */ }
      this.recording = null;
    }
    this.isActive = false;
  }

  async pauseMonitoring(): Promise<void> {
    if (!this.isActive) return;
    this.stopPolling();
    if (this.recording) {
      try { await this.recording.pauseAsync(); } catch { /* ok */ }
    }
    this.isActive = false;
  }

  async resumeMonitoring(): Promise<void> {
    if (this.isActive) return;
    if (this.recording) {
      try { await this.recording.startAsync(); } catch { return; }
      this.startPollingReal(this.recording);
    } else {
      this.startSimulated();
    }
    this.isActive = true;
  }

  // ─── Private: expo-av loading ────────────────────────────

  private async tryLoadExpoAv(): Promise<boolean> {
    if (this.expoAvLoaded !== null) return this.expoAvLoaded;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const av = require('expo-av');
      // Test that the Audio API is actually available
      this.expoAvLoaded =
        !!av?.Audio?.Recording?.createAsync && !!av?.Audio?.requestPermissionsAsync;
    } catch {
      this.expoAvLoaded = false;
    }
    return this.expoAvLoaded;
  }

  // ─── Private: real expo-av recording ─────────────────────

  private async startReal(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av');

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) throw new Error('Microphone permission required.');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const { recording } = await Audio.Recording.createAsync({
      isMeteringEnabled: true,
      android: {
        extension: '.wav',
        outputFormat: 0,
        audioEncoder: 0,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
      },
      ios: {
        extension: '.wav',
        outputFormat: 'lpcm',
        audioQuality: 0,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
      },
      web: {
        mimeType: 'audio/wav',
        bitsPerSecond: 256000,
      },
    });

    this.recording = recording;
    this.startPollingReal(recording);
  }

  private startPollingReal(
    rec: NonNullable<AudioService['recording']>,
  ): void {
    this.pollInterval = setInterval(async () => {
      try {
        const status = await rec.getStatusAsync();
        if (!status.isRecording) return;
        const db: number = status.metering ?? -60;
        const dbfs = Math.max(-60, Number.isFinite(db) ? db : -60);
        this.callbacks.onVolumeUpdate?.(Math.pow(10, dbfs / 20), dbfs);
      } catch { /* non-fatal */ }
    }, this.pollMs);
  }

  // ─── Private: simulated metering ─────────────────────────

  private startSimulated(): void {
    this.pollInterval = setInterval(() => {
      const dbfs = -42 + (Math.random() - 0.5) * 6;
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
