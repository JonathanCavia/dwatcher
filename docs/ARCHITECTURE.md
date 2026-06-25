# dwatcher — System Architecture

## 1. Overview

dwatcher is a mobile dog monitoring and surveillance application that turns an Android phone into a dedicated dog-watching device. It captures audio and video through the phone's built-in sensors, performs on-device machine learning inference for bark detection and anxiety classification, streams live feeds via WebRTC, and logs events for long-term behavior analysis.

### Purpose

- **Real-time monitoring**: Watch and listen to your dog when you are away from home.
- **On-device intelligence**: Detect barks, whines, growls, pacing, and other behaviors without sending raw audio to the cloud.
- **Live streaming**: Peer-to-peer audio/video streaming directly from the device to a viewer dashboard.
- **Behavior analytics**: Track patterns over time — when your dog is most active, anxious, or vocal.

### Monorepo Approach

The project uses a pnpm monorepo with the following rationale:

- **Shared packages**: Audio processing utilities, ML inference pipelines, configuration schemas, and TypeScript types are shared between the mobile app and backend.
- **Single source of truth**: One version of types, one dependency graph, one build pipeline.
- **Isolation without duplication**: Each package has its own responsibility and can be versioned, tested, and built independently while sharing the same monorepo tooling.
- **Workspace-first dependency resolution**: Internal packages reference each other via `workspace:*` in `package.json`, ensuring the monorepo graph is always consistent.

---

## 2. Repository Layout

```
dwatcher/
├── apps/
│   ├── mobile/                    # @dwatcher/mobile — Expo dev-client mobile app
│   │   ├── app/                   # Expo Router routes (thin re-exports only)
│   │   ├── src/
│   │   │   ├── components/        # Screen-level and shared UI components
│   │   │   ├── screens/           # Screen implementations (Home, Monitoring, History, Settings)
│   │   │   ├── services/          # Native module wrappers (camera, audio, webrtc, ml)
│   │   │   ├── stores/            # Zustand stores
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   └── theme/             # App-specific theme overrides
│   │   ├── android/               # Prebuilt native Android project (generated, tracked)
│   │   ├── app.json               # Expo configuration
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── backend/                   # @dwatcher/backend — Node.js backend
│       ├── src/
│       │   ├── routes/            # REST API route handlers
│       │   ├── services/          # Business logic (session management, event aggregation)
│       │   ├── signaling/         # WebSocket signaling server for WebRTC
│       │   ├── middleware/        # Auth, logging, error handling
│       │   ├── db/                # Database client and migrations
│       │   └── index.ts           # Entry point
│       ├── tests/
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── config/                    # @dwatcher/config — Shared environment/configuration
│   │   ├── src/
│   │   │   ├── schemas.ts         # Zod schemas for environment validation
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── types/                     # @dwatcher/types — Shared TypeScript types ONLY
│   │   ├── src/
│   │   │   ├── entities/          # Domain entities (Dog, BarkEvent, Session, AnxietyEvent)
│   │   │   ├── api/               # API request/response shapes
│   │   │   ├── enums/             # Shared enums
│   │   │   └── index.ts           # Re-exports everything
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── audio/                     # @dwatcher/audio — Audio processing utilities
│   │   ├── src/
│   │   │   ├── pcm.ts             # PCM buffer helpers (alignment, trimming, resampling)
│   │   │   ├── volume.ts          # dBFS and RMS computation
│   │   │   ├── features.ts        # Mel-spectrogram generation for ML input
│   │   │   ├── wav.ts             # WAV encoding/decoding
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ml/                        # @dwatcher/ml — Machine learning utilities
│       ├── models/                # Stored TFLite model files (git LFS or committed)
│       │   ├── v1/
│       │   │   ├── yamnet_bark_int8.tflite
│       │   │   └── metadata.json
│       │   └── v2/
│       ├── src/
│       │   ├── inference.ts       # TFLite model loading and inference runner
│       │   ├── pipeline.ts        # Full pre-processing → inference → post-processing pipeline
│       │   ├── registry.ts        # Model version registry
│       │   ├── postprocess.ts     # Softmax, thresholding, cooldown logic
│       │   └── index.ts
│       ├── tests/
│       ├── tsconfig.json
│       └── package.json
│
├── docs/                          # Project documentation
│   ├── ARCHITECTURE.md            # This file
│   ├── GENERAL-GUIDELINES.md      # Development guidelines
│   ├── SETUP-REFERENCE.md         # Setup and configuration reference
│   ├── TECH-STACK.md              # Technology decision records
│   ├── ROADMAP.md                 # Feature roadmap by phase
│   ├── ML-PIPELINE.md             # Machine learning pipeline deep-dive
│   └── plans/                     # Staged implementation plans
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI (lint, typecheck, test on PR)
│
├── pnpm-workspace.yaml            # Workspace definition
├── tsconfig.base.json             # Shared TypeScript configuration (strict mode)
├── .eslintrc.cjs                  # Shared ESLint configuration
├── .prettierrc                    # Shared Prettier configuration
├── Makefile                       # Convenience wrappers for common commands
├── .gitignore
└── package.json                   # Root package.json (private, no deps beyond tooling)
```

---

## 3. Package Responsibilities

### @dwatcher/mobile (apps/mobile/)

**Role**: The primary mobile application — an Expo dev-client app that runs on Android devices.

**Key Responsibilities**:
- **Android foreground service**: Runs a persistent foreground service with type `microphone` to capture audio even when the app is backgrounded.
- **Camera integration**: Uses `react-native-vision-camera` for front and back camera capture, including frame processors for on-device ML on video frames.
- **Audio capture**: Uses `@siteed/expo-audio-studio` to capture raw PCM audio buffers in real time.
- **ML inference**: Loads and runs TFLite models through native bindings, coordinating with the `@dwatcher/ml` package for preprocessing and classification logic.
- **WebRTC streaming**: Uses `react-native-webrtc` to establish peer-to-peer audio/video streams with a viewer dashboard.
- **Local storage**: Uses `expo-sqlite` to persist detection events, session metadata, captured frames, and behavior logs.
- **Notifications**: Uses `expo-notifications` for local alert notifications when barks or anxiety events are detected, and push notification integration for remote alerts.

**Not responsible for**: Backend logic, model training, database migrations (those live in backend or separate tooling).

---

### @dwatcher/backend (apps/backend/)

**Role**: The Node.js backend providing REST API endpoints, WebSocket signaling for WebRTC, and optional TURN server integration.

**Key Responsibilities**:
- **REST API**: CRUD operations for monitoring sessions, event logs, user settings, and device registration.
- **WebSocket signaling server**: Facilitates WebRTC peer connection establishment between the mobile device and viewer dashboards.
- **TURN server integration**: Manages TURN credentials and relays media streams when direct peer-to-peer connections fail (NAT traversal).
- **Event aggregation**: Provides aggregated analytics endpoints for long-term behavior reports (daily/weekly summaries, trend data).
- **Push notifications**: Sends remote push notifications when the mobile app is offline or when configured alert thresholds are met.
- **Authentication**: JWT-based authentication for API access and WebSocket connections.

**Not responsible for**: On-device ML inference, camera control, audio capture, foreground services.

---

### @dwatcher/config (packages/config/)

**Role**: Shared configuration and environment validation using Zod schemas.

**Key Principles**:
- **No `process.env` reads**: Values are passed in via function arguments or returned from validated schema parsers.
- **Zod schemas**: Every configuration object has a Zod schema that validates types, required fields, and value constraints.
- **Reusable across apps**: Both mobile and backend use the same schema definitions for consistent validation.

**Example exports**:
```typescript
import { z } from 'zod';

export const SignalingConfigSchema = z.object({
  signalingUrl: z.string().url(),
  reconnectInterval: z.number().default(3000),
  maxReconnectAttempts: z.number().default(10),
});

export type SignalingConfig = z.infer<typeof SignalingConfigSchema>;

export function createSignalingConfig(raw: Record<string, unknown>): SignalingConfig {
  return SignalingConfigSchema.parse(raw);
}
```

---

### @dwatcher/types (packages/types/)

**Role**: Shared TypeScript type definitions only. No runtime code, no executable logic, no build step.

**Key Principles**:
- **Types only**: Interfaces, type aliases, and enums exclusively. No functions, classes, or runtime values.
- **No build step**: `package.json` points directly to `./src/index.ts` for both `main` and `types`.
- **No internal imports**: Must never import from any other `@dwatcher/*` package.

**Domain Entities**:

```typescript
// entities/dog.ts
export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  weightKg: number | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// entities/session.ts
export interface Session {
  id: string;
  dogId: string;
  startedAt: string;
  endedAt: string | null;
  state: SessionState;
  deviceBatteryLevel: number;
}

// entities/bark-event.ts
export interface BarkEvent {
  id: string;
  sessionId: string;
  detectedAt: string;
  confidence: number;        // 0.0 – 1.0
  durationMs: number;
  peakAmplitude: number;     // dBFS
  classification: DetectionClass;
  snapshotUri: string | null; // Camera snapshot taken concurrently
}

// entities/anxiety-event.ts
export interface AnxietyEvent {
  id: string;
  sessionId: string;
  detectedAt: string;
  anxietyScore: number;      // 0.0 – 1.0 composite score
  contributingFactors: AnxietyFactor[];
  durationMs: number;
  snapshotUri: string | null;
}

// entities/snapshot.ts
export interface Snapshot {
  id: string;
  sessionId: string;
  capturedAt: string;
  uri: string;               // Local file path or remote URL
  camera: 'front' | 'back';
}
```

**API Contracts**:

```typescript
// api/session.ts
export interface CreateSessionRequest {
  dog_id: string;
  device_battery_level: number;
}

export interface CreateSessionResponse {
  id: string;
  started_at: string;
}

export interface ListEventsQuery {
  session_id: string;
  event_type: 'bark' | 'anxiety' | 'all';
  from?: string;      // ISO 8601
  to?: string;
  limit?: number;
  offset?: number;
}

export interface EventListResponse {
  events: BarkEvent[] | AnxietyEvent[];
  total: number;
  has_more: boolean;
}
```

**Enums**:

```typescript
// enums/detection.ts
export enum DetectionClass {
  Bark = 'bark',
  Whine = 'whine',
  Growl = 'growl',
  Howl = 'howl',
  Silence = 'silence',
  Other = 'other',
}

// enums/session.ts
export enum SessionState {
  Idle = 'idle',
  Monitoring = 'monitoring',
  Paused = 'paused',
  Ended = 'ended',
}

// enums/alert.ts
export enum AlertLevel {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

// enums/anxiety.ts
export enum AnxietyFactor {
  Whining = 'whining',
  Pacing = 'pacing',
  ExcessiveBarking = 'excessive_barking',
  DestructiveBehavior = 'destructive_behavior',
  Vocalization = 'vocalization',
}
```

---

### @dwatcher/audio (packages/audio/)

**Role**: Pure audio processing utilities used by both mobile and ML pipelines. No native module bindings — operates on raw PCM buffers as `Float32Array` or `Int16Array`.

**Key Exports**:

- **`pcm.ts`**:
  - `resamplePcm(buffer: Int16Array, fromSampleRate: number, toSampleRate: number): Int16Array` — Linear interpolation resampling to the target sample rate (16kHz for ML).
  - `normalizePcm(buffer: Float32Array): Float32Array` — Normalize samples to [-1, 1] range.
  - `int16ToFloat32(buffer: Int16Array): Float32Array` — Convert 16-bit integer samples to float.
  - `alignToWindow(buffer: Float32Array, windowSize: number, hopSize: number): Float32Array[]` — Split a buffer into overlapping frames.

- **`volume.ts`**:
  - `computeRms(samples: Float32Array): number` — Root mean square amplitude.
  - `computeDbfs(samples: Float32Array): number` — Decibels relative to full scale.
  - `computePeakAmplitude(samples: Float32Array): number` — Maximum absolute amplitude.
  - `computeVolumeLevel(samples: Float32Array): { rms: number; dbfs: number; peak: number }` — Convenience aggregator.

- **`features.ts`**:
  - `computeMelSpectrogram(samples: Float32Array, sampleRate: number, fftSize: number, hopLength: number, nMels: number, fMin: number, fMax: number): Float32Array` — Full mel-spectrogram computation pipeline.
  - `computeStft(samples: Float32Array, fftSize: number, hopLength: number, windowFn: 'hann' | 'hamming' | 'blackman'): Float32Array[]` — Short-Time Fourier Transform.
  - `applyMelFilterbank(magnitudeSpectra: Float32Array[], sampleRate: number, fftSize: number, nMels: number, fMin: number, fMax: number): Float32Array` — Mel-scale filterbank application.
  - `applyLogCompression(melSpectrogram: Float32Array, epsilon: number): Float32Array` — Log(spectrum + epsilon).

- **`wav.ts`**:
  - `encodeWav(samples: Int16Array, sampleRate: number, numChannels: number): ArrayBuffer` — WAV file encoding from PCM samples.
  - `decodeWav(buffer: ArrayBuffer): { samples: Int16Array; sampleRate: number; numChannels: number }` — WAV file decoding to PCM samples.

---

### @dwatcher/ml (packages/ml/)

**Role**: Machine learning utilities for model loading, inference orchestration, and result post-processing. Contains the model registry and pipeline orchestration logic.

**Key Exports**:

- **`inference.ts`**:
  - `loadModel(modelPath: string): Promise<TFLiteModel>` — Load a TFLite model from the app's assets or filesystem.
  - `runInference(model: TFLiteModel, inputTensor: Float32Array): Float32Array` — Run inference on a single input tensor and return the output.
  - `TFLiteModel` interface — wraps the interpreter with input/output shape validation.

- **`pipeline.ts`**:
  - `ClassificationPipeline` class — Orchestrates the full feature extraction → inference → post-processing pipeline:
    - `processAudioFrame(pcmBuffer: Float32Array): DetectionResult | null`
    - `reset()` — Clear internal state between sessions.
    - Configurable parameters: sample rate, FFT size, hop length, confidence threshold, cooldown period.

- **`registry.ts`**:
  - `ModelRegistry` — Manages available model versions with fallback logic:
    - `getLatestVersion(): ModelVersion`
    - `getVersion(version: string): ModelVersion`
    - `resolveModel(version?: string): Promise<TFLiteModel>`
    - `listVersions(): ModelVersion[]`
  - `ModelVersion` interface: version string, date, accuracy metrics, input/output shapes, file path.

- **`postprocess.ts`**:
  - `applySoftmax(scores: Float32Array): Float32Array` — Convert logits to probability distribution.
  - `getTopClass(scores: Float32Array, classLabels: string[]): { className: string; confidence: number }` — Return the highest-confidence class.
  - `isBarkEvent(result: DetectionResult, config: DetectionConfig): boolean` — Evaluate detection result against threshold and cooldown configuration.
  - `computeAnxietyScore(results: DetectionResult[], windowMs: number): number` — Composite anxiety score from a time window of detections.

---

## 4. Data Flow

### Audio Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  @siteed/expo-audio-studio                                          │
│  (Android foreground service, type "microphone")                    │
│  Raw PCM at 44100Hz, 16-bit, mono, callback every ~100ms            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Int16Array PCM chunk (4410 samples @ 44.1kHz)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Audio Service (apps/mobile/src/services/audio-service.ts)          │
│  - Resamples 44.1kHz → 16kHz (TFLite native input rate)            │
│  - Converts Int16 → Float32                                         │
│  - Pushes into circular buffer (3 seconds = 48,000 samples)         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Float32Array PCM @ 16kHz
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Volume Meter                                                       │
│  (apps/mobile/src/services/volume-meter.ts)                         │
│  - Computes RMS and dBFS on the latest chunk                        │
│  - Updates Zustand store (UI meter animation)                       │
│  - Triggers adaptive sampling if volume is below silence threshold  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Every 500ms (or adaptive interval)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Feature Extractor                                                  │
│  (@dwatcher/audio features.ts — called from @dwatcher/ml pipeline)  │
│  - Extracts 0.96-second window from circular buffer (15,360 samples)│
│  - Applies Hann window                                              │
│  - Computes STFT (FFT size 512, hop 160 → 96 frames)               │
│  - Computes 64-band Mel filterbank (125Hz–7500Hz)                  │
│  - Log compression                                                  │
│  - Output: Float32Array[1, 96, 64, 1] (batch, time, freq, channel) │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Mel-spectrogram tensor
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TFLite Inference (@dwatcher/ml inference.ts)                       │
│  - Loads YAMNet fine-tuned model (INT8 quantized, ~1.5MB)          │
│  - Runs inference (20-40ms on mid-range Android)                    │
│  - Outputs: 521 class scores (raw logits) + 1024-D embedding       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Raw class scores (Float32Array[521])
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Post-Processor (@dwatcher/ml postprocess.ts)                       │
│  - Apply softmax → probability distribution                        │
│  - Extract top-3 classes with confidence scores                     │
│  - Check confidence threshold (default: >0.7 for bark)              │
│  - Apply cooldown timer (5 seconds between same-class events)       │
│  - Onset detection: compare energy to 1-second rolling average      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ DetectionResult | null
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Event Dispatcher (apps/mobile/src/services/event-dispatcher.ts)    │
│  - If detection: persist to expo-sqlite (BarkEvent row)            │
│  - Update Zustand store (recent events array, detection UI)         │
│  - If threshold met: trigger expo-notification (local alert)        │
│  - Queue for backend sync when online                               │
│  - If anxiety score above threshold: trigger anxiety event flow     │
└─────────────────────────────────────────────────────────────────────┘
```

### Video Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  Camera Service (apps/mobile/src/services/camera-service.ts)        │
│  - react-native-vision-camera                                      │
│  - Front/back camera toggle                                        │
│  - Video recording (H.264) or real-time preview                     │
│  - Frame processor plugin for optional ML on video frames           │
│  - Periodic snapshot capture on detection events                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Camera frames (H.264 encoded stream)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WebRTC Peer Connection (apps/mobile/src/services/webrtc-service.ts)│
│  - react-native-webrtc                                             │
│  - Creates RTCPeerConnection with STUN/TURN configuration          │
│  - Adds local video track from camera (H.264, hardware encoded)    │
│  - Adds local audio track from mic (Opus, via WebRTC audio)        │
│  - SDP offer/answer exchange via signaling WebSocket                │
│  - ICE candidate exchange                                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Encoded media through ICE candidates
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Signaling Server (@dwatcher/backend: WebSocket)                    │
│  - Relays SDP offers/answers between device and viewer              │
│  - Relays ICE candidates                                            │
│  - Manages room-based sessions (device + viewer pairs)              │
│  - Authenticates connections via JWT                                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ If P2P fails → TURN relay
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Web Viewer (browser-based dashboard)                               │
│  - Receives H.264 video + Opus audio via WebRTC                     │
│  - Displays live stream and detection overlay                       │
│  - Controls: toggle stream, request snapshot                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Alert Pipeline

```
Detection Event (Bark or Anxiety)
         │
         ├── Confidence > 0.7? ──No──→ Silent log only
         │
        Yes
         │
         ├── Cooldown elapsed? ──No──→ Skip notification (log only)
         │
        Yes
         │
         ├── App foreground? ──Yes──→ Zustand store update (UI shows in-app alert)
         │                           → expo-notifications (local, heads-up)
         │
         └── App background? ──Yes──→ expo-notifications (local, persistent)
                                      → Push notification (via backend, if configured)
                                      → Camera snapshot capture (if enabled)
                                      → Store in expo-sqlite for later review
```

---

## 5. Component Architecture (Mobile)

### Screen Tree

```
App Root
 ├── HomeScreen (default route)
 │    ├── Current dog selector
 │    ├── Quick-start "Start Monitoring" button
 │    ├── Session history preview (last 3 sessions)
 │    └── Quick status: "Last monitored: 2h ago"
 │
 ├── MonitoringScreen (active session)
 │    ├── Camera preview (front/back toggle)
 │    ├── Audio meter overlay (animated RMS bar)
 │    ├── Detection event timeline (scrollable, recent events)
 │    ├── Bark counter (session total, rate per minute)
 │    ├── Anxiety gauge (0-100 scale, color-coded)
 │    ├── Session controls (pause, stop, snapshot)
 │    ├── Live streaming indicator (WebRTC status)
 │    └── Battery/network status footer
 │
 ├── HistoryScreen (past events)
 │    ├── Session list (date, duration, event count)
 │    ├── Session detail view (event timeline, snapshots)
 │    ├── Filter controls (event type, date range)
 │    ├── Event playback (audio snippet, snapshot)
 │    └── Export/share event data
 │
 └── SettingsScreen (configuration)
      ├── Dog profile management (name, breed, weight, photo)
      ├── Detection thresholds (confidence, cooldown, sensitivity)
      ├── Notification preferences (local, push, quiet hours)
      ├── Camera settings (resolution, toggle default, snapshot behavior)
      ├── Streaming settings (quality, TURN config, auto-stream on detection)
      ├── Data management (storage usage, sync frequency, export)
      └── About & debug info (model version, inference stats, logs)
```

### Shared Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `CameraView` | Wraps react-native-vision-camera, provides front/back toggle, frame processor slot | `src/components/CameraView.tsx` |
| `AudioMeter` | Animated volume level bar with RMS/dBFS display, silence threshold indicator | `src/components/AudioMeter.tsx` |
| `EventTimeline` | Chronological event list with type icons, timestamps, confidence badges | `src/components/EventTimeline.tsx` |
| `BarkCounter` | Session bark counter showing total, rate/min, and peak hour indicator | `src/components/BarkCounter.tsx` |
| `AnxietyGauge` | Circular or bar gauge showing composite anxiety score, color-coded (green/yellow/red) | `src/components/AnxietyGauge.tsx` |
| `SessionCard` | Session summary card for history lists (date, duration, event count, thumbnail) | `src/components/SessionCard.tsx` |
| `PrimaryButton` | Full-width action button consistent across screens (rounded-xl, press animation) | `src/components/PrimaryButton.tsx` |
| `StatusBadge` | Network, battery, and service status indicator | `src/components/StatusBadge.tsx` |

### Zustand Stores

```typescript
// stores/session-store.ts
interface SessionStore {
  currentSession: Session | null;
  sessionState: SessionState;
  startSession: (dogId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  setBatteryLevel: (level: number) => void;
}

// stores/event-store.ts
interface EventStore {
  recentEvents: DetectionEvent[];
  barkCount: number;
  anxietyScore: number;
  addEvent: (event: DetectionEvent) => void;
  clearEvents: () => void;
  setAnxietyScore: (score: number) => void;
}

// stores/audio-store.ts
interface AudioStore {
  currentVolume: number;   // RMS
  currentDbfs: number;
  isSilent: boolean;
  setVolume: (rms: number, dbfs: number) => void;
  setIsSilent: (silent: boolean) => void;
}

// stores/settings-store.ts
interface SettingsStore {
  dog: Dog | null;
  detectionThreshold: number;      // 0.0 – 1.0
  cooldownMs: number;
  notificationsEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  cameraPreference: 'front' | 'back';
  streamingEnabled: boolean;
  updateSettings: (partial: Partial<SettingsState>) => void;
  setDog: (dog: Dog) => void;
}
```

---

## 6. API Design

### REST Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/sessions` | Create a new monitoring session |
| `GET` | `/api/v1/sessions/:id` | Get session details |
| `PATCH` | `/api/v1/sessions/:id` | Update session state (pause, resume, end) |
| `GET` | `/api/v1/sessions` | List sessions (paginated, filterable) |
| `POST` | `/api/v1/events` | Sync detected events from device |
| `GET` | `/api/v1/events` | List events (filterable by type, session, date range) |
| `GET` | `/api/v1/events/:id` | Get event details |
| `POST` | `/api/v1/snapshots` | Upload captured snapshot |
| `GET` | `/api/v1/snapshots/:id` | Get snapshot (serves image) |
| `GET` | `/api/v1/reports/daily` | Daily behavior summary |
| `GET` | `/api/v1/reports/weekly` | Weekly trend analysis |
| `POST` | `/api/v1/auth/register` | Register device |
| `POST` | `/api/v1/auth/token` | Get JWT for device |

### Payload Convention

- **Wire format**: `snake_case` for JSON payloads sent over the wire (REST API).
- **Frontend state**: `camelCase` after deserialization in the mobile app.
- **Transformation**: Each API service method transforms the `snake_case` response into `camelCase` before storing in Zustand or component state.

```typescript
// Backend response (wire format)
{
  "bark_events": [
    {
      "id": "evt_abc123",
      "session_id": "ses_def456",
      "detected_at": "2026-06-24T14:30:00Z",
      "confidence": 0.92,
      "duration_ms": 450
    }
  ],
  "total": 1,
  "has_more": false
}

// Frontend state (camelCase)
{
  barkEvents: [
    {
      id: 'evt_abc123',
      sessionId: 'ses_def456',
      detectedAt: '2026-06-24T14:30:00Z',
      confidence: 0.92,
      durationMs: 450,
    },
  ],
  total: 1,
  hasMore: false,
}
```

### WebSocket Signaling Protocol

```
Client → Server:
  { "type": "join", "room": "session_<id>", "token": "<jwt>" }
  { "type": "offer", "sdp": "<SDP string>" }
  { "type": "candidate", "candidate": "<ICE candidate>" }

Server → Client:
  { "type": "joined", "room": "session_<id>" }
  { "type": "answer", "sdp": "<SDP string>" }
  { "type": "candidate", "candidate": "<ICE candidate>" }
  { "type": "peer_joined" }
  { "type": "peer_left" }
  { "type": "error", "message": "..." }
```

---

## 7. Conventions

### Package Scope

All internal packages use the `@dwatcher/` scope:

| Package | npm scope | Directory |
|---------|-----------|-----------|
| Mobile app | `@dwatcher/mobile` | `apps/mobile/` |
| Backend | `@dwatcher/backend` | `apps/backend/` |
| Config | `@dwatcher/config` | `packages/config/` |
| Types | `@dwatcher/types` | `packages/types/` |
| Audio | `@dwatcher/audio` | `packages/audio/` |
| ML | `@dwatcher/ml` | `packages/ml/` |

### Dependency References

All internal packages are referenced with `workspace:*`:

```json
{
  "dependencies": {
    "@dwatcher/types": "workspace:*",
    "@dwatcher/audio": "workspace:*",
    "@dwatcher/ml": "workspace:*",
    "@dwatcher/config": "workspace:*"
  }
}
```

### Package Manager

- **pnpm only**. Never use npm or yarn.
- Commands run from the repo root via `pnpm --filter <workspace>` or `pnpm -r` for recursive.
- The root `Makefile` wraps common commands (`make install`, `make lint`, `make typecheck`, `make test`).

### Platform-Specific Code

- Use `.android.ts` / `.android.tsx` extensions for Android-specific implementations.
- Use `.ios.ts` / `.ios.tsx` extensions for iOS-specific implementations (future iOS support).
- Use `Platform.OS` conditionals only for minor variation.
- For significant platform differences, prefer separate files over conditionals.

### TypeScript

- Strict mode enabled everywhere via `tsconfig.base.json`.
- No package disables strict mode.
- `@dwatcher/types` has no build step and must never import from other `@dwatcher/*` packages.
- All other packages require a build step for their compiled output.

### Imports

Always import from a package's entry point, never from internal paths:

```typescript
// Correct
import { BarkEvent } from '@dwatcher/types';
import { computeMelSpectrogram } from '@dwatcher/audio';
import { ClassificationPipeline } from '@dwatcher/ml';

// Incorrect
import { BarkEvent } from '@dwatcher/types/src/entities/bark-event';
```

### Testing

- Mobile: Jest + React Native Testing Library.
- Backend: Vitest.
- Packages: Vitest.
- 80% unit / 20% integration test split.
- Mock native modules; do not mock your own code.
- Write tests alongside implementation (test-first approach encouraged).
