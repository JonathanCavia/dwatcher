/**
 * Resample a buffer from one sample rate to another using linear interpolation.
 */
export function resamplePcm(
  buffer: Int16Array,
  fromSampleRate: number,
  toSampleRate: number,
): Int16Array {
  if (fromSampleRate === toSampleRate) {
    return buffer;
  }

  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const lo = Math.floor(srcIndex);
    const hi = Math.min(lo + 1, buffer.length - 1);
    const frac = srcIndex - lo;
    result[i] = Math.round(buffer[lo] + (buffer[hi] - buffer[lo]) * frac);
  }

  return result;
}

/**
 * Normalize samples to the [-1, 1] range.
 */
export function normalizePcm(buffer: Float32Array): Float32Array {
  let maxAbs = 0;
  for (let i = 0; i < buffer.length; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > maxAbs) {
      maxAbs = abs;
    }
  }

  if (maxAbs === 0 || maxAbs === 1) {
    return buffer;
  }

  const scale = 1 / maxAbs;
  const result = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] * scale;
  }

  return result;
}

/**
 * Convert 16-bit integer PCM samples to 32-bit floats in the [-1, 1] range.
 */
export function int16ToFloat32(buffer: Int16Array): Float32Array {
  const result = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] / 32768;
  }
  return result;
}

/**
 * Split a buffer into overlapping frames of a given window size and hop size.
 */
export function alignToWindow(
  buffer: Float32Array,
  windowSize: number,
  hopSize: number,
): Float32Array[] {
  const frames: Float32Array[] = [];
  for (let offset = 0; offset + windowSize <= buffer.length; offset += hopSize) {
    frames.push(buffer.slice(offset, offset + windowSize));
  }
  return frames;
}
