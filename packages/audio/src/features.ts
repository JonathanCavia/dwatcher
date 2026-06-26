/**
 * Compute a mel-spectrogram from raw PCM samples.
 *
 * Stub implementation — returns a placeholder matrix.
 * Full implementation requires an FFT library and mel filterbank.
 */
export function computeMelSpectrogram(
  samples: Float32Array,
  sampleRate: number,
  opts?: {
    nFft?: number;
    hopLength?: number;
    nMels?: number;
    fMin?: number;
    fMax?: number;
  },
): number[][] {
  const nFft = opts?.nFft ?? 512;
  const hopLength = opts?.hopLength ?? 256;
  const nMels = opts?.nMels ?? 64;
  const frameCount = Math.max(1, Math.floor((samples.length - nFft) / hopLength) + 1);

  const spectrogram: number[][] = [];
  for (let i = 0; i < frameCount; i++) {
    const frame = new Float32Array(nMels);
    for (let j = 0; j < nMels; j++) {
      frame[j] = 0;
    }
    spectrogram.push(Array.from(frame));
  }

  return spectrogram;
}
