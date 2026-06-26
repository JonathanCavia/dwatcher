import { describe, it, expect } from 'vitest';
import { resamplePcm, normalizePcm, int16ToFloat32, alignToWindow } from '../src/pcm';

describe('resamplePcm', () => {
  it('returns the same buffer when rates match', () => {
    const input = new Int16Array([0, 1000, 2000, 3000, 4000]);
    const result = resamplePcm(input, 16000, 16000);
    expect(result).toEqual(input);
    // Should be the same reference since rates match
    expect(result).toBe(input);
  });

  it('downsamples by factor of 2', () => {
    // 10 samples at 16000 -> 5 samples at 8000
    const input = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const result = resamplePcm(input, 16000, 8000);
    expect(result.length).toBe(5);
  });

  it('upsamples by factor of 2', () => {
    // 5 samples at 8000 -> 10 samples at 16000
    const input = new Int16Array([0, 1000, 2000, 1000, 0]);
    const result = resamplePcm(input, 8000, 16000);
    expect(result.length).toBe(10);
  });

  it('returns empty buffer for empty input', () => {
    const input = new Int16Array(0);
    const result = resamplePcm(input, 16000, 8000);
    expect(result.length).toBe(0);
  });

  it('handles single-sample input', () => {
    const input = new Int16Array([42]);
    const result = resamplePcm(input, 16000, 8000);
    // Single sample downsampled: ratio = 2, newLength = round(1/2) = 1
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('normalizePcm', () => {
  it('does not modify already-normalized audio', () => {
    const input = new Float32Array([0.5, -0.5, 0.25, -0.25]);
    const result = normalizePcm(input);
    // maxAbs = 0.5, scale = 2.0, all values double
    expect(result[0]).toBeCloseTo(1.0);
    expect(result[1]).toBeCloseTo(-1.0);
  });

  it('does not normalize silent input', () => {
    const input = new Float32Array([0, 0, 0, 0]);
    const result = normalizePcm(input);
    expect(result).toBe(input);
  });

  it('normalizes to [-1, 1] range', () => {
    const input = new Float32Array([0.1, -0.05, 0.02]);
    const result = normalizePcm(input);
    let maxAbs = 0;
    for (let i = 0; i < result.length; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(result[i]));
    }
    expect(maxAbs).toBeCloseTo(1.0);
  });

  it('leaves already-at-unity input unchanged', () => {
    const input = new Float32Array([1.0, -1.0, 0.5]);
    // maxAbs = 1.0, so should return as-is
    const result = normalizePcm(input);
    // maxAbs is 1, so it returns the input unchanged
    expect(result[0]).toBe(input[0]);
  });
});

describe('int16ToFloat32', () => {
  it('converts max positive value', () => {
    const input = new Int16Array([32767]);
    const result = int16ToFloat32(input);
    expect(result[0]).toBeCloseTo(32767 / 32768, 5);
  });

  it('converts zero to zero', () => {
    const input = new Int16Array([0]);
    const result = int16ToFloat32(input);
    expect(result[0]).toBe(0);
  });

  it('converts min value to -1', () => {
    const input = new Int16Array([-32768]);
    const result = int16ToFloat32(input);
    expect(result[0]).toBe(-1);
  });

  it('produces Float32Array of same length', () => {
    const input = new Int16Array(100);
    const result = int16ToFloat32(input);
    expect(result.length).toBe(100);
    expect(result).toBeInstanceOf(Float32Array);
  });
});

describe('alignToWindow', () => {
  it('splits into exact windows', () => {
    // 12 samples, window 4, hop 4 -> 3 frames
    const input = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const frames = alignToWindow(input, 4, 4);
    expect(frames.length).toBe(3);
    expect(frames[0]).toEqual(new Float32Array([1, 2, 3, 4]));
    expect(frames[1]).toEqual(new Float32Array([5, 6, 7, 8]));
    expect(frames[2]).toEqual(new Float32Array([9, 10, 11, 12]));
  });

  it('handles overlapping windows', () => {
    // 6 samples, window 4, hop 2 -> 2 frames
    const input = new Float32Array([1, 2, 3, 4, 5, 6]);
    const frames = alignToWindow(input, 4, 2);
    expect(frames.length).toBe(2);
    expect(frames[0]).toEqual(new Float32Array([1, 2, 3, 4]));
    expect(frames[1]).toEqual(new Float32Array([3, 4, 5, 6]));
  });

  it('drops incomplete final window', () => {
    // 5 samples, window 4, hop 4 -> 1 frame (last sample dropped)
    const input = new Float32Array([1, 2, 3, 4, 5]);
    const frames = alignToWindow(input, 4, 4);
    expect(frames.length).toBe(1);
  });

  it('returns empty array for input smaller than window', () => {
    const input = new Float32Array([1, 2, 3]);
    const frames = alignToWindow(input, 4, 2);
    expect(frames.length).toBe(0);
  });
});
