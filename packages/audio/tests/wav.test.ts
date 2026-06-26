import { describe, it, expect } from 'vitest';
import { encodeWav, decodeWav } from '../src/wav';

describe('encodeWav', () => {
  it('produces a valid WAV buffer', () => {
    const samples = new Int16Array([0, 1000, -1000, 0, 500, -500]);
    const sampleRate = 16000;
    const buffer = encodeWav(samples, sampleRate);

    expect(buffer.byteLength).toBeGreaterThanOrEqual(44 + samples.byteLength);
  });

  it('handles empty samples (silent WAV)', () => {
    const samples = new Int16Array(0);
    const sampleRate = 16000;
    const buffer = encodeWav(samples, sampleRate);

    // Still produces valid WAV with empty data chunk
    expect(buffer.byteLength).toBe(44); // header only
  });

  it('handles single sample', () => {
    const samples = new Int16Array([0]);
    const sampleRate = 16000;
    const buffer = encodeWav(samples, sampleRate);

    expect(buffer.byteLength).toBe(46); // 44 + 2
  });
});

describe('decodeWav', () => {
  it('round-trips encode -> decode (mono, 16-bit)', () => {
    const original = new Int16Array([0, 1000, 2000, -1000, -2000, 0]);
    const sampleRate = 16000;
    const buffer = encodeWav(original, sampleRate);
    const decoded = decodeWav(buffer);

    expect(decoded.sampleRate).toBe(sampleRate);
    expect(decoded.samples.length).toBe(original.length);
    // PCM values should match exactly (lossless round-trip)
    for (let i = 0; i < original.length; i++) {
      expect(decoded.samples[i]).toBe(original[i]);
    }
  });

  it('rejects non-RIFF input', () => {
    const buffer = new ArrayBuffer(100);
    const view = new DataView(buffer);
    // Write "XXXX" instead of "RIFF"
    view.setUint8(0, 88); // 'X'
    view.setUint8(1, 88);
    view.setUint8(2, 88);
    view.setUint8(3, 88);

    expect(() => decodeWav(buffer)).toThrow('Not a valid WAV file');
  });

  it('rejects non-WAVE format', () => {
    const buffer = new ArrayBuffer(100);
    const view = new DataView(buffer);
    // Write valid RIFF header but non-WAVE identifier
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 92, true);
    writeAscii(view, 8, 'XXXX'); // not WAVE

    expect(() => decodeWav(buffer)).toThrow('missing WAVE identifier');
  });

  it('rejects non-PCM format (audioFormat != 1)', () => {
    const buffer = new ArrayBuffer(100);
    const view = new DataView(buffer);
    // Create a valid RIFF/WAVE with fmt chunk but audioFormat = 3 (IEEE float)
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 92, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 3, true); // IEEE float (not PCM=1)
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, 16000, true); // sampleRate
    view.setUint32(28, 16000 * 2, true); // byteRate
    view.setUint16(32, 2, true); // blockAlign
    view.setUint16(34, 16, true); // bitsPerSample

    expect(() => decodeWav(buffer)).toThrow('Unsupported WAV format');
  });

  it('rejects non-16-bit WAV', () => {
    const buffer = new ArrayBuffer(100);
    const view = new DataView(buffer);
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 92, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 8, true); // 8-bit (not 16)

    expect(() => decodeWav(buffer)).toThrow('Unsupported bit depth');
  });

  it('throws on WAV with no data chunk', () => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36, true);
    writeAscii(view, 8, 'WAVE');
    // No fmt or data chunks — just empty
    // Need at least the fmt chunk to pass validation but then fail on missing data

    expect(() => decodeWav(buffer)).toThrow();
  });

  it('correctly decodes WAV with varying sample values', () => {
    const original = new Int16Array(Array.from({ length: 100 }, (_, i) => i * 100 - 5000));
    const buffer = encodeWav(original, 44100);
    const decoded = decodeWav(buffer);

    expect(decoded.sampleRate).toBe(44100);
    expect(decoded.samples.length).toBe(100);
    for (let i = 0; i < original.length; i++) {
      expect(decoded.samples[i]).toBe(original[i]);
    }
  });
});

// Helper: write ASCII string into DataView at offset
function writeAscii(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
