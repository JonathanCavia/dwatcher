/**
 * AudioService — stub implementation.
 *
 * Real audio capture from the microphone requires a native module compatible
 * with Expo SDK 54 (expo-modules-core 3.x).  Currently no Expo-blessed audio
 * recording package ships with 3.x-compatible native code — expo-av 16.x and
 * expo-audio 56.x both require expo-modules-core 4.x at runtime.
 *
 * This stub simulates volume metering so the MonitoringScreen UI is fully
 * functional while we wait for a compatible audio package or build our own
 * thin native module.
 */
export interface AudioServiceCallbacks {
  onVolumeUpdate?: (rms: number, dbfs: number) => void;
  onError?: (error: Error) => void;
}

export class AudioService {
  private isActive = false;
  private meterInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: AudioServiceCallbacks = {};
  private readonly pollMs = 120;

  get active(): boolean {
    return this.isActive;
  }

  async startMonitoring(callbacks: AudioServiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;
    this.isActive = true;
    this.startSimulatedMetering();
  }

  async stopMonitoring(): Promise<void> {
    this.stopMetering();
    this.isActive = false;
  }

  async pauseMonitoring(): Promise<void> {
    this.stopMetering();
    this.isActive = false;
  }

  async resumeMonitoring(): Promise<void> {
    this.isActive = true;
    this.startSimulatedMetering();
  }

  // ─── Simulated metering ─────────────────────────────────

  private startSimulatedMetering(): void {
    this.meterInterval = setInterval(() => {
      // Simulate ambient room noise around -42 dBFS with slight variation
      const dbfs = -42 + (Math.random() - 0.5) * 6;
      const rms = Math.pow(10, dbfs / 20);
      this.callbacks.onVolumeUpdate?.(rms, dbfs);
    }, this.pollMs);
  }

  private stopMetering(): void {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
      this.meterInterval = null;
    }
  }
}
