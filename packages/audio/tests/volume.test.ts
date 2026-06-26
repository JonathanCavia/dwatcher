import { describe, it, expect } from 'vitest';
import { computeRms, computeDbfs, computePeakAmplitude } from '../src/volume';

describe('computeRms', () => {
  it('returns 0 for a silent buffer', () => {
    const samples = new Float32Array([0, 0, 0, 0]);
    expect(computeRms(samples)).toBeCloseTo(0);
  });

  it('computes RMS for a non-zero buffer', () => {
    const samples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
    const rms = computeRms(samples);
    expect(rms).toBeCloseTo(0.5, 5);
  });

  it('computes RMS for a constant buffer', () => {
    const samples = new Float32Array([0.8, 0.8, 0.8]);
    const rms = computeRms(samples);
    expect(rms).toBeCloseTo(0.8, 5);
  });
});

describe('computeDbfs', () => {
  it('returns -Infinity for silent input', () => {
    const samples = new Float32Array([0, 0, 0]);
    expect(computeDbfs(samples)).toBe(-Infinity);
  });

  it('returns ~0 dBFS for full-scale sine', () => {
    const samples = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
      samples[i] = Math.sin((2 * Math.PI * i) / 100);
    }
    const dbfs = computeDbfs(samples);
    expect(dbfs).toBeLessThan(0);
    expect(dbfs).toBeGreaterThan(-10);
  });
});

describe('computePeakAmplitude', () => {
  it('returns 0 for silent buffer', () => {
    const samples = new Float32Array([0, 0, 0]);
    expect(computePeakAmplitude(samples)).toBe(0);
  });

  it('returns the maximum absolute amplitude', () => {
    const samples = new Float32Array([0.1, -0.9, 0.5, -0.3]);
    expect(computePeakAmplitude(samples)).toBeCloseTo(0.9);
  });

  it('handles values at full scale', () => {
    const samples = new Float32Array([-1, 1]);
    expect(computePeakAmplitude(samples)).toBe(1);
  });
});
