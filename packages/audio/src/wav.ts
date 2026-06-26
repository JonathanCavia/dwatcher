const WAV_HEADER_BYTE_LENGTH = 44;

/**
 * Encode 16-bit PCM samples as a WAV byte buffer.
 *
 * @param samples - 16-bit integer PCM samples
 * @param sampleRate - sample rate in Hz (e.g. 16000)
 * @returns WAV file as an ArrayBuffer
 */
export function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.byteLength;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTE_LENGTH + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const dst = new Int16Array(buffer, WAV_HEADER_BYTE_LENGTH, samples.length);
  dst.set(samples);

  return buffer;
}

/**
 * Decode a WAV byte buffer into 16-bit PCM samples and metadata.
 *
 * Supports only PCM (uncompressed) mono WAV files.
 *
 * @param buffer - WAV file as an ArrayBuffer
 * @returns decoded samples and sample rate
 */
export function decodeWav(buffer: ArrayBuffer): {
  samples: Int16Array;
  sampleRate: number;
} {
  const view = new DataView(buffer);

  const riffId = readString(view, 0, 4);
  if (riffId !== 'RIFF') {
    throw new Error('Not a valid WAV file: missing RIFF header');
  }

  const waveId = readString(view, 8, 4);
  if (waveId !== 'WAVE') {
    throw new Error('Not a valid WAV file: missing WAVE identifier');
  }

  // Scan sub-chunks (fmt, data, etc.) starting after WAVE identifier
  let offset = 12;
  let audioFormat = 0;
  let numChannels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = readString(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      audioFormat = view.getUint16(offset + 8, true);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      // Don't break — keep scanning in case 'fmt ' comes after 'data'
      // (though in practice it shouldn't)
    }

    offset += 8 + chunkSize;
  }

  if (audioFormat !== 1) {
    throw new Error(`Unsupported WAV format: ${audioFormat}. Only PCM (1) is supported.`);
  }
  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported bit depth: ${bitsPerSample}. Only 16-bit is supported.`);
  }
  if (dataOffset < 0) {
    throw new Error('No data chunk found in WAV file');
  }

  const totalSamples = dataSize / (bitsPerSample / 8);
  const monoSampleCount = Math.floor(totalSamples / numChannels);
  const samples = new Int16Array(monoSampleCount);

  // Read interleaved channel data; extract only channel 0 (left/mono)
  let outIdx = 0;
  for (let frame = 0; frame < monoSampleCount; frame++) {
    const byteOffset = dataOffset + frame * numChannels * (bitsPerSample / 8);
    if (byteOffset + 2 > buffer.byteLength) break;
    samples[outIdx++] = view.getInt16(byteOffset, true);
  }

  return { samples, sampleRate };
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function readString(view: DataView, offset: number, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(view.getUint8(offset + i));
  }
  return result;
}
