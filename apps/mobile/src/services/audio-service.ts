import { type EventSubscription } from 'expo-modules-core';

import AudioStudioModule from '@siteed/audio-studio';

import { CircularBuffer } from '../audio/CircularBuffer';
import {
  computeDbfs,
  computeRms,
  normalizePcm,
} from '@dwatcher/audio';

// ─── Types from @siteed/audio-studio (not re-exported from public API) ───

/** Payload delivered by the native audio event listener. */
interface AudioEventPayload {
  /** Float32 samples in [-1, 1] range. Android → Float32Array; iOS → number[]. */
  pcmFloat32?: Float32Array | number[];
  fileUri: string;
  position: number;
  totalSize: number;
  streamUuid: string;
  mimeType: string;
}

/** Minimal recording config accepted by the native module. */
interface NativeRecordingConfig {
  sampleRate: number;
  channels: number;
  encoding: string;
  interval: number;
  keepFullAnalysis?: boolean;
  enableProcessing?: boolean;
}

// ─── Service ─────────────────────────────────────────────────

export interface AudioServiceCallbacks {
  onVolumeUpdate?: (rms: number, dbfs: number) => void;
  onError?: (error: Error) => void;
}

export class AudioService {
  private circularBuffer: CircularBuffer;
  private isActive = false;
  private audioEventSubscription: EventSubscription | null = null;
  private callbacks: AudioServiceCallbacks = {};

  constructor(circularBuffer: CircularBuffer) {
    this.circularBuffer = circularBuffer;
  }

  get active(): boolean {
    return this.isActive;
  }

  async startMonitoring(callbacks: AudioServiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    // Request microphone permission via the native module
    const perm = await (AudioStudioModule as any).requestPermissionsAsync();
    if (!perm?.granted) {
      throw new Error('Microphone permission is required to start monitoring.');
    }

    const config: NativeRecordingConfig = {
      sampleRate: 16000,
      channels: 1,
      encoding: 'pcm_32bit',
      interval: 100,
      keepFullAnalysis: false,
      enableProcessing: false,
    };

    // Register the audio event listener before starting
    this.audioEventSubscription?.remove();
    this.audioEventSubscription = this.subscribeToAudioEvents();

    // Cast through `any` — the public type for AudioStudioModule is `any`
    const module = AudioStudioModule as any;
    await module.prepareRecording(config);
    await module.startRecording(config);
    this.isActive = true;
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isActive) return;

    try {
      await (AudioStudioModule as any).stopRecording();
    } catch {
      // Service may already be stopped
    }

    this.audioEventSubscription?.remove();
    this.audioEventSubscription = null;
    this.isActive = false;
    this.circularBuffer.clear();
  }

  async pauseMonitoring(): Promise<void> {
    if (!this.isActive) return;
    await (AudioStudioModule as any).pauseRecording();
    this.isActive = false;
  }

  async resumeMonitoring(): Promise<void> {
    if (this.isActive) return;
    await (AudioStudioModule as any).resumeRecording();
    this.isActive = true;
  }

  getCircularBuffer(): CircularBuffer {
    return this.circularBuffer;
  }

  // ─── Private ──────────────────────────────────────────────

  /**
   * Subscribe to audio events using the legacy event emitter pattern
   * that @siteed/audio-studio uses internally.
   */
  private subscribeToAudioEvents(): EventSubscription {
    // The native module uses `expo-modules-core` LegacyEventEmitter under
    // the hood. We listen for the 'AudioData' event directly.
    const module = AudioStudioModule as any;

    const subscription = module.addListener?.('AudioData', (event: AudioEventPayload) => {
      this.handleAudioEvent(event);
    });

    if (!subscription) {
      throw new Error('AudioStudioModule does not support addListener.');
    }

    return subscription;
  }

  private handleAudioEvent(event: AudioEventPayload): void {
    try {
      const rawData = event.pcmFloat32;
      if (!rawData) return;

      const samples =
        rawData instanceof Float32Array
          ? rawData
          : new Float32Array(rawData as number[]);

      if (samples.length === 0) return;

      // Normalize and write to circular buffer
      const normalized = normalizePcm(samples);
      this.circularBuffer.write(normalized);

      // Compute volume metrics
      const rms = computeRms(normalized);
      const dbfs = computeDbfs(normalized);

      this.callbacks.onVolumeUpdate?.(rms, dbfs);
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }
}
