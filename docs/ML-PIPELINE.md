# dwatcher — Machine Learning Pipeline

## 1. Overview

dwatcher performs on-device audio classification for real-time dog vocalization detection using a fine-tuned YAMNet model running on TensorFlow Lite. The entire pipeline executes on the Android device — no audio data ever leaves the phone. This ensures privacy (household audio stays local), reliability (works offline), and low latency (20-40ms inference).

### Pipeline Summary

```
Microphone PCM → Circular Buffer → Feature Extraction (Mel-Spectrogram)
→ TFLite Inference → Post-Processing (Softmax, Thresholding, Cooldown)
→ Event Dispatch (SQLite, Zustand, Notifications)
```

### Supported Classes (Phase 5+)

| Class | Label | Intended Detection |
|-------|-------|-------------------|
| `/m/0bwd_0` | Bark | Normal barking |
| `/m/02p0tk0` | Whine | Whining / whimpering |
| `/m/07s0dt` | Growl | Growling / snarling |
| `/m/0bh9flk` | Howl | Howling / baying |
| — | Silence | No vocalization detected |
| — | Other | Non-vocalization sounds (TV, traffic, etc.) |

---

## 2. YAMNet Architecture

### Base Model

YAMNet (Yet Another Mobile Network) is a deep neural network that takes an audio waveform as input and produces scores for 521 audio event classes from the AudioSet dataset.

**Architecture details:**

| Component | Description |
|-----------|-------------|
| **Backbone** | MobileNet v1 Depthwise-Separable Convolutions |
| **Input** | 0.96 seconds of 16kHz mono audio (15,600 samples) |
| **Front-end** | Mel-spectrogram: 64 mel bins, 96 frames (25ms window, 10ms stride) |
| **Feature extractor** | 14 MobileNet depthwise-separable layers |
| **Embedding** | 1024-D bottleneck feature vector (can be used for transfer learning) |
| **Classification head** | 521-class logistic regression layer |
| **Total parameters** | ~3.2M |
| **Model size (FP32)** | ~3.8MB |
| **Model size (INT8 quantized)** | ~1.5MB |
| **Trained on** | AudioSet (2M+ 10-second YouTube clips, 521 audio event classes) |

### Key YAMNet-specific details

**Input processing pipeline** (inside YAMNet, before the MobileNet backbone):

1. Frame the waveform into 25ms overlapping frames with 10ms stride:
   - 25ms at 16kHz = 400 samples per frame
   - 10ms stride = 160 sample hop
   - 0.96 seconds / 0.01 stride = 96 frames (the last frame is zero-padded)
2. Apply a Hann window to each frame.
3. Compute the power spectrogram (magnitude squared of STFT, FFT size 512).
4. Compute mel-spectrogram using 64 mel bands spanning 125Hz to 7500Hz.
5. Apply log compression: `log(mel-spectrogram + 0.001)`.
6. Normalize to zero mean and unit variance (using statistics computed from AudioSet).

**Important**: When doing transfer learning with YAMNet, it is critical to replicate this exact preprocessing pipeline, or the learned MobileNet weights will not respond correctly to the input features.

### Relevant AudioSet Classes for Dog Monitoring

| AudioSet Label | AudioSet ID | YAMNet Index | Notes |
|---------------|-------------|--------------|-------|
| Bark | `/m/0bwd_0` | 97 | Primary target |
| Yell | `/m/07pp8cl` | 10 | Potential false positive |
| Growling | `/m/07s0dt` | 96 | Secondary target (may need fine-tuning) |
| Whimper (dog) | `/m/0n0xwf9` | Not directly in AudioSet | Requires custom class |
| Howl | `/m/0bh9flk` | 95 | May need fine-tuning |
| Animal vocalization | `/m/04rlf` | 94 | General animal sounds |
| Silence | — | — | Add as custom class |
| Other | — | — | Catch-all |

---

## 3. Fine-Tuning Process

### When Fine-Tuning Is Necessary

YAMNet's pre-trained classifier already recognizes dog barks with reasonable accuracy (class index 97, confidence typically >0.5 for clean bark samples). Fine-tuning is required for:

1. **Multi-class dog vocalization**: YAMNet does not distinguish between bark, whine, growl, and howl at the AudioSet level — these are aggregated under "Bark" and a few other general classes. Fine-tuning adds explicit class labels for each vocalization type.
2. **Domain adaptation**: YAMNet was trained on YouTube clips (typically clear, foreground audio). Domestic settings have different acoustics (rooms, background noise, distance) that reduce accuracy without adaptation.
3. **False positive reduction**: Without fine-tuning, YAMNet may classify similar sounds (door slams, coughs, TV barks) as dog barks. Fine-tuning on negative examples reduces false positives.

### Fine-Tuning Strategy

**Approach**: Transfer learning — freeze the YAMNet MobileNet backbone and replace the classification head.

**Steps:**

1. **Load pre-trained YAMNet** (with or without weights frozen).
2. **Remove the original classification head** (521 classes).
3. **Add a new classification head**:
   ```
   Input: 1024-D YAMNet embedding
   → Dense(256, ReLU)
   → Dropout(0.3)
   → Dense(128, ReLU)
   → Dropout(0.2)
   → Dense(N_classes, Softmax)
   Output: N-class probability distribution
   ```

4. **Freeze MobileNet backbone layers** for initial training (only train the new head).
5. **Gradual unfreezing** (optional): Unfreeze the last 1-2 depthwise-separable blocks and train with a lower learning rate (1e-5) for domain adaptation.

### Training Data Requirements

| Class | Target Samples | Minimum Samples | Sources |
|-------|---------------|-----------------|---------|
| Bark | 1000 | 500 | YouTube AudioSet clips, custom recordings |
| Whine | 500 | 250 | Custom recordings, veterinary behavior archives |
| Growl | 500 | 250 | YouTube, custom recordings |
| Howl | 500 | 200 | YouTube (wolf/dog howls), custom recordings |
| Silence | 1000 | 500 | Room tone recordings from target environment |
| Other | 2000 | 1000 | General non-dog sounds (TV, traffic, footsteps, slamming doors) |

### Data Augmentation

Applied during training to improve generalization:

| Augmentation | Parameters | Notes |
|-------------|------------|-------|
| Noise injection | Gaussian noise, σ ∈ [0.001, 0.01] | Simulates recording noise |
| Background mixing | Mix with room tone or TV noise at SNR 10-20dB | Simulates real-world conditions |
| Pitch shifting | ±2 semitones (sample rate adjustment) | Simulates different dogs/distance |
| Time stretching | 0.8x–1.2x | Simulates different dog sizes/speed |
| Gain augmentation | ±6dB random volume change | Simulates different distances |
| SpecAugment | Time masking (2-5 frames), frequency masking (2-4 bands) | Applied to mel-spectrograms |

### Training Framework

```python
# Conceptual training script (Python)
import tensorflow as tf
import tensorflow_hub as hub

# Load pre-trained YAMNet as feature extractor
yamnet = hub.load('https://tfhub.dev/google/yamnet/1')
feature_extractor = tf.keras.models.Model(
    inputs=yamnet.inputs,
    outputs=yamnet.get_layer('embeddings').output
)

# Freeze backbone
feature_extractor.trainable = False

# New classification head
model = tf.keras.Sequential([
    feature_extractor,
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(N_CLASSES, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
```

### Export to TFLite

```python
# Convert to TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# FP16 quantization (default, minimal accuracy loss)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
fp16_model = converter.convert()

# INT8 quantization (full integer, smaller size)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data  # ~100 calibration samples
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8
int8_model = converter.convert()
```

---

## 4. TFLite Conversion & Optimization

### Quantization Options

| Quantization | Model Size | Accuracy vs FP32 | Speed vs FP32 | Use Case |
|-------------|-----------|------------------|---------------|----------|
| None (FP32) | ~3.8MB | Baseline | 1.0x (baseline) | Reference/development |
| FP16 | ~1.9MB | <0.5% loss | 1.5-2x faster | Production (default) |
| INT8 | ~1.0MB | 2-3% loss | 3-4x faster | Production (battery-sensitive) |

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Model file size | <5MB (INT8 preferred) | For reasonable app download size |
| Inference time (CPU) | <50ms | Mid-range Android (Snapdragon 7 Gen 1) |
| Inference time (GPU) | <20ms | With GPU delegate |
| Peak memory usage | <50MB | During inference |
| Model load time | <500ms | On app startup, cached after first load |
| Battery drain | <5% per hour | Continuous inference at 2Hz |

### Hardware Acceleration

TFLite supports hardware acceleration delegates on Android:

| Delegate | Supported Devices | Performance Gain | Notes |
|----------|------------------|------------------|-------|
| XNNPACK | All modern CPUs | 2-3x over FP32 | Default for CPU, no extra configuration |
| GPU (OpenGL/OpenCL) | Most Android GPUs | 3-5x over FP32 | Good for FP16 models |
| NNAPI | Android 8.1+ with DSP/NPU | Variable | Use for Qualcomm Hexagon DSP |
| GPU with Vulkan | Android 10+ | 3-6x over FP32 | May not work on all devices |

Implementation approach:
1. Try to load with GPU delegate.
2. If GPU delegate fails (unsupported device), fall back to XNNPACK (CPU).
3. If XNNPACK is unavailable, fall back to default TFLite CPU interpreter.

---

## 5. Feature Extraction Pipeline

This is the on-device audio-to-feature transformation that runs before inference. It converts raw 16kHz PCM audio into a mel-spectrogram tensor of shape `[1, 96, 64, 1]`.

### Pipeline Steps

```
Raw PCM (16kHz, 16-bit, mono)
     │
     ▼
Step 1: Frame Windowing
────────────────────────────────
  Window size: 25ms = 400 samples
  Hop size:    10ms = 160 samples
  Total frames: 96 (for 0.96s input)
  Output: 96 frames, each 400 samples
  Edge case: If buffer is shorter than 0.96s, zero-pad final frames

     │
     ▼
Step 2: Hann Window
────────────────────────────────
  w[n] = 0.5 * (1 - cos(2πn/(N-1))), for n = 0, ..., N-1 (N=400)
  Apply: frame_samples[n] = frame_samples[n] * w[n]
  Purpose: Reduces spectral leakage from frame edges

     │
     ▼
Step 3: Short-Time Fourier Transform (STFT)
────────────────────────────────
  FFT size: 512 (zero-pad 400-sample frame to 512)
  Output: 96 complex spectrograms, each with 257 frequency bins (512/2 + 1)
  Magnitude: |FFT| = sqrt(real² + imag²)
  Power: |FFT|²

     │
     ▼
Step 4: Mel Filterbank
────────────────────────────────
  Number of mel filters: 64
  Frequency range: 125Hz – 7500Hz (covers dog vocalization range)
    
  Mel scale conversion:
    m = 2595 * log10(1 + f/700)
    
  Triangular filters: 64 filters, equally spaced in mel domain
  Each filter weighted by overlapping triangular window
  Apply dot product: mel_spectrum[f] = Σ(power_spectrum * filter[f])

     │
     ▼
Step 5: Log Compression
────────────────────────────────
  log_mel_spectrum = log(mel_spectrum + epsilon)
  where epsilon = 0.001 (prevents log(0))
  Output shape: [96, 64]

     │
     ▼
Step 6: Normalization
────────────────────────────────
  Mean subtraction (per-frequency-band)
  Variance normalization (per-frequency-band)
  Statistics computed from representative training data
  Output: Normalized mel-spectrogram

     │
     ▼
Step 7: Batch Dimension
────────────────────────────────
  Add batch and channel dimensions: [1, 96, 64, 1]
  This is the final input tensor for the TFLite model
```

### Implementation Strategy

**Performance-critical portions** (STFT, filterbank multiplication) should be implemented as a native C++ module for optimal performance. A JavaScript fallback exists for development and testing.

**C++ (JNI) implementation**:
- Uses Android's `libc` and standard math library.
- Pre-computed Hann window and mel filterbank lookup tables (computed once at startup, stored as constants).
- SIMD-optimized vector operations where possible.
- No heap allocations during inference (pre-allocated buffers).

**JavaScript fallback implementation**:
- Uses `Float32Array` operations.
- Slower by a factor of 5-10x compared to native.
- Suitable for testing and non-real-time analysis.
- Used as a reference for validating the native implementation.

### Validation

Feature extraction output should be validated against the reference YAMNet Python implementation:

```typescript
// Validation test
const pcmBuffer = loadReferencePcm('test/fixtures/dog-bark-16khz.pcm');
const mel = computeMelSpectrogram({
  samples: pcmBuffer,
  sampleRate: 16000,
  fftSize: 512,
  hopLength: 160,
  nMels: 64,
  fMin: 125,
  fMax: 7500,
});

// Compare against Python YAMNet mel output (pre-computed reference)
const referenceMel = loadReferenceMel('test/fixtures/dog-bark-mel.bin');
const mse = computeMeanSquaredError(mel, referenceMel);
assert(mse < 0.01, 'Mel-spectrogram should match reference');
```

---

## 6. On-Device Inference Architecture

### Runtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Audio Signal Chain                                              │
│  (Runs on audio thread, NOT the main JS thread)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ PCM chunks arrive every ~100ms
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Circular Buffer (3 seconds, 48,000 samples @ 16kHz)            │
│  • Thread-safe (lock-free ring buffer for audio thread safety)  │
│  • Write index tracked by audio callback                        │
│  • Read index independent (can lag behind write)                │
│  • Buffer wraps around: oldest samples overwritten first        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Every 500ms: inference tick
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Inference Scheduler                                            │
│  • Runs on a dedicated background thread (not UI thread)        │
│  • Adaptive scheduling:                                        │
│    - 500ms interval when recent energy > silence threshold      │
│    - 2000ms interval when silent (reduce battery drain)         │
│  • Extracts 0.96s window (15,360 samples) from circular buffer  │
│  • Aligns window to latest available audio                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Float32Array[15360]
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Feature Extractor (Native C++ / JNI)                            │
│  • Hann window → STFT → Mel filterbank → Log → Normalize       │
│  • Output: Float32Array[6144] (96 * 64 mel bins)                │
│  • Reshaped to [1, 96, 64, 1] tensor for TFLite                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Tensor<uint8>[1, 96, 64, 1] (INT8 model)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  TFLite Interpreter                                              │
│  • Pre-allocated tensors (no allocation per inference)          │
│  • GPU delegate (try) → XNNPACK (fallback) → CPU (last resort) │
│  • Inference time: ~20-40ms (INT8 on mid-range CPU)             │
│  • Output: INT8 scores tensor [1, N_CLASSES]                    │
│  • Dequantize: float_score = (int8_score - zero_point) * scale  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Float32Array[N_CLASSES]
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Post-Processor (JavaScript, runs on same background thread)     │
│  • Apply softmax: p_i = exp(s_i) / Σ exp(s_j)                   │
│  • Extract top-3 classes with confidence scores                  │
│    [{class: 'bark', confidence: 0.92}, ...]                      │
│  • Check per-class confidence threshold                         │
│    - Bark: 0.7, Whine: 0.6, Growl: 0.65, Howl: 0.7             │
│  • Apply per-class cooldown timer (5s default)                   │
│    - Track last detection time per class                         │
│    - Skip if last detection < cooldown ago                       │
│  • Onset detection (energy-based):                               │
│    - Compute short-term energy (100ms window)                    │
│    - Compute long-term energy (1s rolling average)               │
│    - Onset if: short_term / long_term > onset_threshold (2.0)    │
│  • Output: DetectionResult | null                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ DetectionResult
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Event Dispatcher (JavaScript, main thread notification)         │
│  • Post detection to main thread via event emitter               │
│  • Persist to expo-sqlite (async, non-blocking)                  │
│  • Update Zustand store (triggers UI re-render)                  │
│  • If threshold met: fire expo-notification (local alert)        │
│  • If streaming: emit detection event on WebSocket data channel  │
│  • Queue for backend sync (when online)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Thread Safety Considerations

| Resource | Thread Safety Strategy |
|----------|----------------------|
| Circular buffer | Lock-free ring buffer with atomic write index. Single writer (audio callback), single reader (inference thread). |
| TFLite interpreter | Not thread-safe. Single-threaded access guaranteed by inference scheduler. |
| SQLite writes | Queue-based writes on a dedicated database thread. Batch writes every 500ms. |
| Zustand store updates | Thread-safe by design (synchronous updates on JS thread). Detection events posted to JS thread via emitter. |

### Adaptive Sampling

To reduce battery consumption when no sounds are detected:

```
Monitor 100ms volume chunks
         │
         ├── RMS > silence_threshold (0.01) ──Yes──→ Schedule ML inference in 500ms
         │
         └── RMS ≤ silence_threshold ──Yes──→ Schedule ML inference in 2000ms
                                                 (fewer inferences = lower battery drain)
```

The silence threshold is adaptive: it is recalculated every 30 seconds as the median RMS of the last 30 seconds of audio, plus a 3dB headroom. This adapts to the ambient noise floor of the room.

---

## 7. Model Versioning

### Model File Storage

Models are stored in `packages/ml/models/` and bundled with the mobile app as assets:

```
packages/ml/models/
├── v1/
│   ├── yamnet_bark_int8.tflite      # INT8 quantized, single-class (bark only)
│   └── metadata.json                # Version 1 metadata
├── v2/
│   ├── yamnet_dog_vocalizations_int8.tflite  # INT8, multi-class (bark, whine, growl, howl)
│   └── metadata.json                # Version 2 metadata
└── staging/
    └── (work-in-progress models for A/B testing)
```

### Metadata Format

```json
// packages/ml/models/v2/metadata.json
{
  "version": "2.0.0",
  "modelName": "YAMNet Dog Vocalizations",
  "date": "2026-06-01",
  "framework": "TensorFlow Lite",
  "quantization": "INT8",
  "inputShape": [1, 96, 64, 1],
  "inputDataType": "INT8",
  "outputShape": [1, 6],
  "outputDataType": "INT8",
  "classLabels": ["bark", "whine", "growl", "howl", "silence", "other"],
  "accuracy": {
    "overall": 0.89,
    "perClass": {
      "bark": 0.93,
      "whine": 0.81,
      "growl": 0.85,
      "howl": 0.87,
      "silence": 0.95,
      "other": 0.88
    }
  },
  "confusionMatrix": "data:... (base64-encoded or reference to separate file)",
  "trainingData": {
    "samplesPerClass": {
      "bark": 1200,
      "whine": 600,
      "growl": 500,
      "howl": 400,
      "silence": 1500,
      "other": 2500
    },
    "totalSamples": 6700,
    "source": "AudioSet subset + custom recordings + room tone",
    "augmentationFactor": 5.0
  },
  "minAndroidApi": 26,
  "recommendedDelegate": "GPU",
  "fallbackDelegates": ["XNNPACK", "CPU"],
  "metadataFile": "packages/ml/models/v2/metadata.json"
}
```

### Model Registry (TypeScript)

```typescript
// packages/ml/src/registry.ts

interface ModelVersion {
  version: string;
  filePath: string;
  metadata: ModelMetadata;
  isAvailable: boolean;
}

class ModelRegistry {
  private versions: Map<string, ModelVersion> = new Map();
  private defaultVersion: string;

  constructor(config: { defaultVersion: string }) {
    this.defaultVersion = config.defaultVersion;
  }

  register(version: ModelVersion): void {
    this.versions.set(version.version, version);
  }

  getVersion(version: string): ModelVersion {
    const model = this.versions.get(version);
    if (!model) {
      throw new Error(`Model version '${version}' not found in registry`);
    }
    return model;
  }

  getLatestVersion(): ModelVersion {
    return this.getVersion(this.defaultVersion);
  }

  async resolveModel(version?: string): Promise<TFLiteModel> {
    const targetVersion = version ?? this.defaultVersion;
    
    // Try specified version first
    try {
      const modelVersion = this.getVersion(targetVersion);
      return await loadModel(modelVersion.filePath);
    } catch (error) {
      // Fallback: try previous version
      console.warn(`Failed to load model v${targetVersion}, trying fallback`);
      
      // Get sorted versions, try each one
      const sortedVersions = this.getSortedVersions();
      for (const v of sortedVersions) {
        if (v.version !== targetVersion) {
          try {
            return await loadModel(v.filePath);
          } catch {
            continue; // Try next version
          }
        }
      }
      
      throw new Error('No model version could be loaded');
    }
  }

  private getSortedVersions(): ModelVersion[] {
    return Array.from(this.versions.values())
      .sort((a, b) => compareVersions(b.version, a.version));
  }

  listVersions(): ModelVersion[] {
    return Array.from(this.versions.values());
  }
}

function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] ?? 0;
    const bVal = bParts[i] ?? 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  return 0;
}
```

### Fallback Chain

```
resolveModel('2.0.0')
  │
  ├── Try v2.0.0 ──success──→ Return model
  │     │
  │     └── failed ──→ Try v1.0.0
  │                       │
  │                       ├── success──→ Return model, log warning
  │                       │
  │                       └── failed ──→ Throw error (no model available)
  │
  └── Result: Model loaded or error thrown
```

---

## 8. Performance Considerations

### Battery Impact

| Component | Power Draw | Notes |
|-----------|-----------|-------|
| Microphone (always on) | 1-2% per hour | Baseline cost of having the mic enabled |
| Audio callback + circular buffer | 0.5% per hour | Minimal CPU for buffer management |
| Feature extraction (native C++) | 1-2% per hour | Efficient native implementation |
| TFLite inference (2Hz, INT8, CPU) | 1-2% per hour | Main inference cost |
| **Total (active monitoring, no streaming)** | **~3-5% per hour** | On modern Android (Snapdragon 7 Gen 1) |
| WebRTC streaming (additional) | 5-10% per hour | Additional camera + encoding + network |

### Optimization Techniques

1. **Adaptive sampling**: Reduce inference to 0.5Hz during silence periods. Estimated 30-40% reduction in ML-related battery drain.

2. **CPU affinity**: Pin inference thread to a big core (performance core) for faster inference, allowing the thread to sleep longer between cycles.

3. **Batch inference**: If processing backlogged audio (e.g., when resuming from background), process multiple 0.96-second frames in a single TFLite interpreter invocation.

4. **Wake lock management**: Acquire a partial wake lock only during active audio processing (feature extraction + inference). Release between cycles. Do not hold the wake lock continuously.

5. **Pre-allocated buffers**: All buffers (PCM, mel-spectrogram, input tensor, output tensor) are allocated once at startup and reused. Zero GC pressure during the inference loop.

6. **Model caching**: The TFLite model is loaded once and kept in memory for the lifetime of the monitoring session. A new session reloads the model (to release any stale memory).

### Memory Profile (per inference cycle)

| Component | Memory | Notes |
|-----------|--------|-------|
| Circular buffer | 96KB | 48,000 samples × 2 bytes (Int16) |
| Working PCM window | 60KB | 15,360 samples × 4 bytes (Float32) |
| STFT buffers | 200KB | Complex spectrum, intermediate buffers |
| Mel-spectrogram | 24KB | 96 × 64 × 4 bytes (Float32) |
| TFLite input tensor | 6KB | 96 × 64 × 1 (INT8) |
| TFLite output tensor | 0.5KB | 6 classes (INT8) |
| TFLite interpreter overhead | 5-10MB | Model weights, intermediate tensors, workspace |
| **Total per-inference working set** | **~400KB** | Plus interpreter overhead |

---

## 9. Testing & Validation

### Unit Tests

| Test | Description |
|------|-------------|
| `mel-spectrogram matches reference` | Feed known PCM → compare mel output against Python reference (MSE < 0.01) |
| `softmax outputs valid probabilities` | Input random logits → verify output sums to 1.0, all values in [0,1] |
| `cooldown prevents duplicate events` | Send two identical detections within cooldown → only first produces event |
| `cooldown allows after elapsed` | Send two identical detections with interval > cooldown → both produce events |
| `threshold filtering` | Send detections below threshold → no events produced |
| `model registry fallback` | Request unavailable version → fallback to next available version |
| `circular buffer wrap-around` | Write more than buffer capacity → oldest data overwritten, read correct |
| `onset detection` | Compute short-term/long-term energy ratio → verify onset flag |
| `adaptive sampling` | Silence → reduced inference rate; sound → increased inference rate |
| `PCM resampling` | Known 44.1kHz sine → 16kHz output matches expected samples |

### Integration Tests

| Test | Description |
|------|-------------|
| `end-to-end bark detection pipeline` | Feed recorded bark audio (WAV file) → verify DetectionResult produced with class 'bark' and confidence >0.7 |
| `end-to-end silence pipeline` | Feed room tone audio → verify DetectionResult is null (no false positive) |
| `session lifecycle with ML` | Start session, feed audio events, stop session → verify events persisted in SQLite |
| `model loading and fallback` | Point to non-existent model → verify fallback loads correct version |
| `notification on detection` | Feed bark audio → verify expo-notification was scheduled |
| `multi-class classification` | Feed bark, whine, growl, howl audio samples → verify correct class per sample |

### Accuracy Benchmarks

| Benchmark | Target | Method |
|-----------|--------|--------|
| Bark detection accuracy | >85% | Confusion matrix on 500 held-out bark/non-bark samples |
| False positive rate (home) | <5% | 1 hour of home ambient audio (no dog present), count false bark detections |
| False negative rate | <10% | 100 known bark samples, count missed detections |
| Multi-class accuracy | >80% per class | Confusion matrix on 200 held-out samples per class |
| Anxiety score correlation | >0.7 | Compare against manual scoring of 50 test recordings |
| Inference latency (CPU, INT8) | <50ms | Average of 1000 inferences on Snapdragon 7 Gen 1 |
| Inference latency (GPU, INT8) | <20ms | Average of 1000 inferences with GPU delegate |
| Memory leak check | <100KB leak | Run 1000 inference cycles, measure RSS before/after |

### Field Testing Protocol

1. **Quiet home environment**: Place phone in the room where the dog will be monitored. Test with and without the dog present. Measure false positive rate over 1 hour of ambient audio.

2. **TV/radio playing**: Test with background media noise at various volumes. Ensure bark detection is not triggered by TV dog barks or other media.

3. **Multiple rooms**: Test with the phone in different rooms relative to the dog. Measure detection accuracy at 1m, 5m, 10m, 15m distances.

4. **Multiple dogs**: If available, test with different dog breeds and sizes to verify model generalization.

5. **Background noise**: Test with common household sounds: vacuum cleaner, door slams, footsteps, kitchen sounds, traffic noise from windows.

6. **Nighttime**: Test in dark conditions (camera testing) with quiet household ambient noise.

7. **Extended monitoring**: Run continuous monitoring for 4+ hours. Measure battery drain, memory growth, and detection consistency over time.
