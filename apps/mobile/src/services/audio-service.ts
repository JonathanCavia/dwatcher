import { AudioRecorder, RecordingNotificationManager } from 'react-native-audio-api';
import type { OnAudioReadyEventType } from 'react-native-audio-api/lib/typescript/events/types';

import { CircularBuffer } from '../audio/CircularBuffer';
import { computeDbfs, computeRms } from '@dwatcher/audio';

// ─── Types ────────────────────────────────────────────────

export interface AudioServiceCallbacks {
  onVolumeUpdate?: (rms: number, dbfs: number) => void;
  onError?: (error: Error) => void;
}

// ─── PCM callback config ──────────────────────────────────

/** 100ms chunks at 16kHz mono → 1600 samples per callback. */
const PCM_OPTIONS = {
  sampleRate: 16000,
  bufferLength: 1600,
  channelCount: 1,
};

// ─── Service ──────────────────────────────────────────────

export class AudioService {
  private recorder = new AudioRecorder();
  private buffer: CircularBuffer;
  private isActive = false;
  private callbacks: AudioServiceCallbacks = {};
  private onReadyCallback: ((event: OnAudioReadyEventType) => void) | null = null;

  constructor(circularBuffer: CircularBuffer) {
    this.buffer = circularBuffer;
  }

  get active(): boolean {
    return this.isActive;
  }

  async startMonitoring(callbacks: AudioServiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    // Foreground service notification
    RecordingNotificationManager.show({
      title: 'dwatcher is monitoring',
      contentText: 'Your dog is being watched',
    });

    // Register PCM callback
    this.onReadyCallback = (event: OnAudioReadyEventType) => {
      const pcm = event.buffer.getChannelData(0);
      this.buffer.write(pcm);
      const rms = computeRms(pcm);
      const dbfs = computeDbfs(pcm);
      callbacks.onVolumeUpdate?.(rms, dbfs);
    };

    this.recorder.onAudioReady(PCM_OPTIONS, this.onReadyCallback);
    this.recorder.start({});
    this.isActive = true;
  }

  async stopMonitoring(): Promise<void> {
    if (this.onReadyCallback) {
      this.recorder.clearOnAudioReady();
      this.onReadyCallback = null;
    }
    this.recorder.stop();
    RecordingNotificationManager.hide();
    this.buffer.clear();
    this.isActive = false;
  }

  pauseMonitoring(): void {
    this.recorder.pause();
    this.isActive = false;
  }

  resumeMonitoring(): void {
    this.recorder.resume();
    this.isActive = true;
  }

  getCircularBuffer(): CircularBuffer {
    return this.buffer;
  }
}
