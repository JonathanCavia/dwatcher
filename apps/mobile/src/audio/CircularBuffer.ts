/**
 * Thread-safe circular (ring) buffer for audio PCM samples.
 *
 * Writers push Float32 data from the audio callback thread;
 * readers pull the latest N milliseconds for ML feature extraction.
 *
 * When the buffer is full, new writes overwrite the oldest data silently.
 */
export class CircularBuffer {
  private buffer: Float32Array;
  private writeIndex = 0;
  private filled = false;
  private readonly capacity: number;

  /**
   * @param capacitySamples  Maximum number of Float32 samples the buffer holds.
   *                         Default: 3 seconds at 16kHz = 48,000 samples.
   */
  constructor(capacitySamples = 48_000) {
    this.capacity = capacitySamples;
    this.buffer = new Float32Array(capacitySamples);
  }

  /** Write PCM samples into the ring buffer. */
  write(samples: Float32Array): void {
    const n = samples.length;

    if (n >= this.capacity) {
      // Entire buffer is being replaced — keep only the tail
      const offset = n - this.capacity;
      this.buffer.set(samples.subarray(offset));
      this.writeIndex = 0;
      this.filled = true;
      return;
    }

    const remaining = this.capacity - this.writeIndex;

    if (n <= remaining) {
      this.buffer.set(samples, this.writeIndex);
      this.writeIndex += n;
    } else {
      // Wraps around
      this.buffer.set(samples.subarray(0, remaining), this.writeIndex);
      this.buffer.set(samples.subarray(remaining));
      this.writeIndex = n - remaining;
    }

    if (this.writeIndex >= this.capacity) {
      this.writeIndex = 0;
    }

    if (!this.filled && this.writeIndex === 0) {
      this.filled = true;
    }
  }

  /**
   * Read the latest `durationMs` milliseconds of audio at the given sample rate.
   * Returns fewer samples than requested if the buffer hasn't been filled yet.
   */
  read(durationMs: number, sampleRate: number): Float32Array {
    const requestedSamples = Math.floor((durationMs / 1000) * sampleRate);
    const available = this.availableSamples();
    const count = Math.min(requestedSamples, available);

    if (count === 0) {
      return new Float32Array(0);
    }

    const result = new Float32Array(count);

    if (this.filled) {
      // Read backwards from writeIndex
      const start = ((this.writeIndex - count) + this.capacity) % this.capacity;

      if (start + count <= this.capacity) {
        result.set(this.buffer.subarray(start, start + count));
      } else {
        const firstPart = this.capacity - start;
        result.set(this.buffer.subarray(start));
        result.set(this.buffer.subarray(0, count - firstPart), firstPart);
      }
    } else {
      // Buffer hasn't wrapped yet — linear read from beginning
      const start = Math.max(0, this.writeIndex - count);
      result.set(this.buffer.subarray(start, this.writeIndex));
    }

    return result;
  }

  /** Clear all data in the buffer. */
  clear(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.filled = false;
  }

  /** Number of samples currently available to read. */
  availableSamples(): number {
    return this.filled ? this.capacity : this.writeIndex;
  }

  /** How full the buffer is as a percentage (0–1). */
  get usageRatio(): number {
    return this.filled ? 1 : this.writeIndex / this.capacity;
  }

  /** Total capacity in samples. */
  get totalCapacity(): number {
    return this.capacity;
  }
}
