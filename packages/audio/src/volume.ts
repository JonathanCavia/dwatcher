/**
 * Compute the root-mean-square amplitude of a sample buffer.
 */
export function computeRms(samples: Float32Array): number {
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i];
  }
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Compute decibels relative to full scale (dBFS).
 * Returns -Infinity for silent input (all zeros).
 */
export function computeDbfs(samples: Float32Array): number {
  const rms = computeRms(samples);
  if (rms === 0) {
    return -Infinity;
  }
  return 20 * Math.log10(rms);
}

/**
 * Compute the peak amplitude (maximum absolute value) of a sample buffer.
 */
export function computePeakAmplitude(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) {
      peak = abs;
    }
  }
  return peak;
}
