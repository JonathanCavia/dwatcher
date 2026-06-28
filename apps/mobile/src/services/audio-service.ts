import { Audio } from 'expo-av';

// ─── Types ────────────────────────────────────────────────

export interface AudioServiceCallbacks {
  onVolumeUpdate?: (rms: number, dbfs: number) => void;
  onError?: (error: Error) => void;
}

// ─── Service ──────────────────────────────────────────────

export class AudioService {
  private recording: Audio.Recording | null = null;
  private isActive = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: AudioServiceCallbacks = {};
  private readonly pollMs = 100;

  get active(): boolean {
    return this.isActive;
  }

  async startMonitoring(callbacks: AudioServiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    // 1. Request microphone permission
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      throw new Error('Microphone permission is required to start monitoring.');
    }

    // 2. Enable background audio → foreground service on Android
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    // 3. Start recording as WAV with metering enabled
    const { recording } = await Audio.Recording.createAsync({
      isMeteringEnabled: true,
      android: {
        extension: '.wav',
        outputFormat: 0,   // DEFAULT
        audioEncoder: 0,    // DEFAULT → PCM 16-bit WAV
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
    this.isActive = true;

    // 4. Start polling for volume metering
    this.startPolling();
  }

  async stopMonitoring(): Promise<void> {
    this.stopPolling();

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // May already be stopped
      }
      this.recording = null;
    }

    this.isActive = false;
  }

  async pauseMonitoring(): Promise<void> {
    if (!this.recording || !this.isActive) return;
    this.stopPolling();
    try {
      await this.recording.pauseAsync();
    } catch {
      // Recording may already be paused
    }
    this.isActive = false;
  }

  async resumeMonitoring(): Promise<void> {
    if (!this.recording || this.isActive) return;
    try {
      await this.recording.startAsync();
    } catch {
      return;
    }
    this.isActive = true;
    this.startPolling();
  }

  // ─── Private ──────────────────────────────────────────────

  private startPolling(): void {
    this.pollInterval = setInterval(async () => {
      try {
        if (!this.recording) return;
        const status = await this.recording.getStatusAsync();
        if (!status.isRecording) return;

        // metering is in dB, typically -160 (silence) to 0 (max)
        const meteringDb: number = (status as any).metering ?? -60;
        const dbfs = Math.max(-60, Number.isFinite(meteringDb) ? meteringDb : -60);
        const rms = Math.pow(10, dbfs / 20);

        this.callbacks.onVolumeUpdate?.(rms, dbfs);
      } catch {
        // Polling errors are non-fatal
      }
    }, this.pollMs);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
