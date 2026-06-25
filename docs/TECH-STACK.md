# dwatcher — Technology Stack

This document records each major technology decision in the dwatcher project. Every entry covers the decision, alternatives considered, rationale, and trade-offs.

---

## 1. Expo SDK 54+ with Dev-Client

**Decision**: Use Expo SDK 54 or later with the `expo-dev-client` workflow.

**Alternatives considered**:
- **Expo managed workflow (Expo Go)**: The default Expo experience where the app runs in the Expo Go sandbox app. No native code customization possible.
- **Bare React Native**: Initialize with `npx react-native init` and manually configure every native module, build pipeline, and project config.

**Rationale**:
- Managed Expo Go cannot provide the native modules dwatcher requires: Android foreground service type `microphone`, raw PCM audio buffers, TFLite inference, and WebRTC peer connections. These require native-level system access that Expo Go's sandbox does not expose.
- Bare React Native would require manual configuration for every native module, build toolchain, and project scaffolding — hundreds of hours of effort that the Expo toolchain handles automatically through config plugins and prebuild.
- Dev-client gives the best of both worlds: full native module access AND Expo's tooling (EAS builds, config plugins, OTA updates, Metro bundler, `expo install` with compatibility checking).

**Trade-offs**:
- More complex initial setup than managed workflow. Requires `npx expo prebuild` to generate native projects before first build.
- Cannot use Expo Go for quick testing. Every native module change requires a rebuild.
- Native project files (`android/`, `ios/`) must be tracked in version control for reproducible builds, increasing repository size.
- Config plugins can sometimes conflict, requiring manual resolution in the generated native files.

---

## 2. react-native-vision-camera for Camera

**Decision**: Use `react-native-vision-camera` for camera capture and preview.

**Alternatives considered**:
- **expo-camera**: Expo's built-in camera module. Supports photo and video capture, barcode scanning, and live preview.
- **react-native-camera**: Community camera module (deprecated in favor of vision-camera).

**Rationale**:
- Frame processor API: `react-native-vision-camera` exposes a frame processor pipeline that runs on every camera frame at up to 30 FPS. This is essential for future on-video ML inference (e.g., motion analysis for pacing detection, person detection to verify the dog is alone). `expo-camera` does not provide frame-level access.
- Hardware-accelerated encoding: The library uses Android's CameraX API with hardware-accelerated frame processing, minimizing battery drain during extended monitoring.
- Active maintenance and wide adoption: `react-native-vision-camera` is the current standard for React Native camera apps requiring advanced features.
- Built-in support for front/back camera switching, zoom, flash, and focus modes.

**Trade-offs**:
- Requires dev-client (not available in Expo Go).
- Larger binary size due to native CameraX dependencies.
- CameraX backend can have compatibility issues on some Android device models (particularly older or low-end devices).
- Frame processor plugins require additional native configuration and can be complex to develop.

---

## 3. @siteed/expo-audio-studio for Microphone

**Decision**: Use `@siteed/expo-audio-studio` for raw audio capture with foreground service.

**Alternatives considered**:
- **expo-audio**: Expo's built-in audio module (replacement for deprecated `expo-av`). Provides recording to files and playback.
- **react-native-audio-api**: Third-party audio module with raw PCM access.

**Rationale**:
- Raw PCM buffer access: `@siteed/expo-audio-studio` provides periodic callbacks with raw PCM `Int16Array` buffers. This is essential for the ML feature extraction pipeline — the mel-spectrogram computation requires raw sample values, not encoded audio files. `expo-audio` only provides file-based recording (no real-time buffer access).
- Android foreground service: The library has built-in support for Android foreground service with notification type `microphone`. This is legally and technically required for persistent background audio recording on Android 12+. The foreground service notification tells the user the app is recording audio, which is both a legal requirement (in many jurisdictions) and a system requirement (Android kills background services without a persistent notification).
- Configurable audio source: Supports `CAMCORDER` audio source (the device's primary microphone, typically directional and noise-filtered) which is better for capturing dog barks than the default `MIC` source.
- Sample rate control: Can configure the recording sample rate (44.1kHz native, resampled to 16kHz for ML).

**Trade-offs**:
- Smaller community than Expo's built-in modules. API may change between versions.
- Third-party dependency with no Expo SDK integration guarantees (though it follows the expo-modules-core API pattern).
- Limited documentation compared to `expo-audio`.
- iOS support may lag behind Android (primary target is Android, but iOS support is planned).

---

## 4. WebRTC for Live Streaming

**Decision**: Use WebRTC via `react-native-webrtc` for live audio/video streaming.

**Alternatives considered**:
- **RTMP via ffmpeg**: Stream H.264/AAC encoded media to an RTMP server, then serve via HLS for viewing.
- **Agora SDK**: Commercial SDK providing managed WebRTC infrastructure.
- **LiveKit**: Open-source, self-hostable WebRTC platform with client SDKs and server components.
- **Custom TCP/UDP streaming**: Raw socket-based streaming with custom protocol.

**Rationale**:
- Sub-second latency: WebRTC provides end-to-end latency under 500ms in optimal conditions, essential for real-time monitoring (hearing a bark as it happens). HLS typically has 6-30 second latency.
- Peer-to-peer architecture: WebRTC establishes direct peer-to-peer connections where possible, reducing server bandwidth costs and eliminating single points of failure.
- Open standard: No vendor lock-in. The protocol is standardized by the W3C and IETF. STUN/TURN servers can be self-hosted with open-source software (Coturn).
- Hardware-accelerated encoding: Android's WebRTC implementation uses hardware H.264 encoding on supported devices, minimizing CPU usage and battery drain.
- Bidirectional: WebRTC supports data channels for sending commands back to the device (request snapshot, adjust settings).
- Adaptive bitrate: WebRTC adjusts stream quality based on network conditions, preventing dropped connections on poor connections.

**Trade-offs**:
- Infrastructure complexity: Requires a signaling server (WebSocket) for connection establishment and a TURN server for NAT traversal. This is more complex than a simple RTMP/HLS setup.
- TURN server bandwidth costs: When peer-to-peer connections fail (common on cellular networks), media is relayed through the TURN server, incurring bandwidth costs.
- Concurrent viewer limitations: WebRTC is designed for 1:1 or small group streaming. Large-scale broadcasting would require SFU (Selective Forwarding Unit) infrastructure (e.g., LiveKit, Mediasoup, Jitsi).
- NAT traversal is not always reliable: Some restrictive networks (corporate Wi-Fi, certain cellular carriers) may block UDP, preventing WebRTC connections entirely.
- Connection management: WebRTC requires careful handling of reconnection, ICE restart, and connection state monitoring.

---

## 5. YAMNet + TensorFlow Lite for On-Device Bark Detection

**Decision**: Use a fine-tuned YAMNet model converted to TensorFlow Lite for on-device audio classification.

**Alternatives considered**:
- **Cloud API** (Google Cloud Audio Intelligence, AWS Transcribe, Azure Speech): Send audio to a cloud service for classification.
- **MediaPipe Audio Classifier**: Google's on-device audio classification solution with pre-trained models.
- **Custom CNN model**: Design and train a custom convolutional neural network from scratch for bark detection.
- **Spectrogram + Logistic Regression**: Extract mel-spectrogram features and use a simple classifier on top.

**Rationale**:
- **No network dependency**: On-device inference works entirely offline. This is critical for a monitoring app — if the Wi-Fi goes down, cloud APIs stop working, but on-device detection continues.
- **Privacy**: Raw audio never leaves the device. All feature extraction and classification happen locally. This eliminates privacy concerns around sending household audio to third-party servers.
- **Lower latency**: On-device inference completes in 20-40ms on mid-range Android hardware, compared to 200-500ms for a cloud API round trip. This enables real-time event logging and instant local notifications.
- **YAMNet's pre-training**: YAMNet is pre-trained on AudioSet, a dataset of 2M+ YouTube clips labeled with 521 audio event classes. The dog bark class (`/m/0bwd_0`) is well-represented in AudioSet, providing strong baseline performance without any custom training data.
- **Transfer learning efficiency**: Fine-tuning YAMNet requires only replacing the classification head and training on a modest dataset (500+ samples per class). The MobileNet backbone provides a strong general audio feature extractor.
- **TFLite optimization**: TensorFlow Lite provides INT8 quantization (4x smaller model, ~2-3% accuracy drop) and hardware acceleration delegates (GPU, NNAPI) for production deployment on Android.

**Trade-offs**:
- Less accurate than cloud models: Google's cloud audio API has access to larger, proprietary models and more training data. On-device models may have higher false positive/negative rates.
- Model must be bundled in the app: The TFLite model file (~1.5MB INT8 quantized, ~3.8MB FP32) increases app size. Model updates require an app update or a model download mechanism.
- YAMNet's input is 0.96 seconds of audio. Short barks (<0.5 seconds) may not provide sufficient signal for confident classification.
- Fine-tuning requires collecting or sourcing a labeled dataset of dog vocalizations, which takes time and effort.
- Background noise (TV, traffic, other animals) can increase false positive rates in home environments.

---

## 6. expo-sqlite for Local Storage

**Decision**: Use `expo-sqlite` for structured local data storage on the mobile device.

**Alternatives considered**:
- **AsyncStorage**: Key-value storage built into React Native.
- **react-native-mmkv**: High-performance key-value storage using MMKV (Mozilla's storage engine).
- **Realm**: Object-oriented mobile database with synchronization.
- **WatermelonDB**: High-performance SQLite-based database designed for React Native.

**Rationale**:
- **Structured querying**: Detection events need to be queried by time range, event type, session ID, and confidence threshold. SQL's `SELECT ... WHERE ... ORDER BY ... LIMIT ...` is far more expressive than key-value lookups.
- **Aggregation queries**: Behavior analysis requires aggregations (e.g., "how many barks per hour for the last 7 days"). `GROUP BY` and window functions in SQL make this trivial.
- **Built into Expo**: `expo-sqlite` is a first-party Expo module, which means compatibility is guaranteed by the Expo team. No extra native module configuration required.
- **No vendor lock-in**: SQLite is the most widely deployed database engine in the world. Data can be exported, inspected, and migrated with standard SQL tools. This is important for a monitoring app that may accumulate months of valuable behavior data.
- **Small footprint**: SQLite adds approximately 500KB to the app binary.

**Trade-offs**:
- **Slower than MMKV for simple operations**: For key-value storage patterns (e.g., session state, user preferences), MMKV is 10-100x faster. dwatcher uses MMKV-adjacent AsyncStorage for such data and SQLite only for structured event data.
- **Schema migrations required**: Adding columns or tables requires migration logic. This adds complexity compared to schema-less key-value stores.
- **Not ideal for real-time writes**: High-frequency writes (every detection event) can trigger disk I/O. dwatcher batches writes and uses in-memory stores (Zustand) for the real-time UI, persisting to SQLite asynchronously.
- **Thread safety**: SQLite is single-writer. Concurrent writes from multiple services (audio processor, ML pipeline, camera snapshot handler) must be serialized or queued.

---

## 7. expo-notifications for Alerts

**Decision**: Use `expo-notifications` for local push notifications when events are detected.

**Alternatives considered**:
- **Notifee**: Advanced React Native notification library with custom notification layouts, notification actions, and channel management.
- **react-native-push-notification**: Popular community notification module.
- **OneSignal**: Managed push notification service with React Native SDK.

**Rationale**:
- **Built into Expo**: `expo-notifications` is a first-party Expo module. No additional native module configuration, no extra dependency.
- **Local notifications**: The primary notification pattern is local — when the on-device ML detects a bark, the app fires a local notification. This works offline and has no latency.
- **Push notifications**: Also supports remote push notifications via Expo's push service, enabling alerts when the app is in the background or killed, with backend-triggered notifications.
- **Notification channel management**: Supports Android notification channels with configurable importance, sound, vibration, and LED color.
- **Foreground service integration**: Notifications can be triggered from within the Android foreground service, which is how the alert pipeline works during active monitoring.

**Trade-offs**:
- Less feature-rich than Notifee for custom notification layouts (media attachments, inline reply, custom UI).
- Push notification delivery goes through Expo's push service, which is a dependency on a third-party service for critical alerts.
- Notification grouping and summary notifications (Android notification groups) are more cumbersome to configure than in Notifee.
- Notification actions (e.g., "Mark as safe" button directly in the notification) require more boilerplate than in Notifee.

---

## 8. Zustand for State Management (Mobile)

**Decision**: Use Zustand for client-side state management in the mobile app.

**Alternatives considered**:
- **Redux Toolkit**: Full-featured state management with reducers, actions, middleware, and DevTools.
- **Jotai**: Atomic state management with a Recoil-like API.
- **MobX**: Observable-based state management with automatic reactivity.
- **React Context + useReducer**: Built-in React state management.

**Rationale**:
- **Minimal boilerplate**: Zustand stores are plain functions with no providers, reducers, or action creators. A typical store is 10-20 lines of code.
- **Works outside React components**: Zustand stores can be created and accessed from plain TypeScript modules. This is critical for dwatcher: the audio service, ML pipeline, and event dispatcher run outside the React component tree (in services and callbacks) but need to update UI state. With Zustand, these non-React services can directly call `useStore.getState()` and `useStore.getState().setX()`.
- **No Provider needed**: Zustand does not require wrapping the app in a `<Provider>` component. This simplifies the component tree and avoids render-tree coupling.
- **TypeScript-first**: Zustand provides excellent TypeScript inference without extra type annotations.
- **Subscriptions with selectors**: Components subscribe to specific slices of state with selectors, preventing unnecessary re-renders when unrelated state changes.
- **Middleware support**: Built-in middleware for persistence (zustand/middleware), immutability checks (immer), and devtools integration.

**Trade-offs**:
- **Less ecosystem than Redux**: Redux has a vast ecosystem of middleware, DevTools extensions, and community patterns. Zustand's ecosystem is smaller.
- **DevTools less mature**: Redux DevTools are the gold standard. Zustand's DevTools integration works but is less polished.
- **No built-in side effect management**: Unlike Redux Saga or Redux Thunk, Zustand has no built-in patterns for side effects. dwatcher handles this through separate service modules (audio service, ML service, API client) that coordinate with stores.
- **Community patterns vary**: Redux has well-established patterns (ducks, slices, RTK). Zustand codebases vary more in structure.

---

## 9. pnpm as Package Manager

**Decision**: Use pnpm as the package manager for the monorepo.

**Alternatives considered**:
- **npm**: The default Node.js package manager (workspaces support).
- **yarn**: Facebook's package manager (workspaces and Plug'n'Play).

**Rationale**:
- **Strict dependency resolution**: pnpm enforces that every package can only access dependencies declared in its own `package.json`. This prevents phantom dependencies (code that works because of hoisting but has undeclared dependencies). This catches bugs early and ensures the monorepo's dependency graph is honest.
- **Disk efficiency**: pnpm uses a content-addressable store and hard links/symlinks, so the 20+ copies of `typescript` that npm/yarn would create (one per workspace) become a single copy in the store plus symlinks. This saves significant disk space.
- **Fast installation**: pnpm installs dependencies in parallel and caches aggressively, making `pnpm install` significantly faster than `npm install` for monorepos.
- **Excellent workspace support**: pnpm workspaces are mature, with `--filter` for targeting specific workspaces, `-r` for recursive commands, and `.npmrc` configuration for workspace-global settings.
- **Monorepo ecosystem fit**: pnpm is the package manager of choice for modern monorepos (Vue, Prisma, Nuxt, Vite all use pnpm).

**Trade-offs**:
- **Occasional compatibility issues**: Some packages assume node_modules hoisting (npm/yarn behavior) and fail to resolve their own dependencies under pnpm's strict structure. These are usually fixable by adding the missing dependency to `package.json` or using `pnpm.overrides` / `pnpm.packageExtensions`.
- **Different mental model**: Developers accustomed to npm/yarn's flat node_modules need to learn pnpm's nested structure and understand that `require.resolve` may behave differently.
- **Tooling integration**: Some tools (older versions of ESLint plugins, TypeScript path aliases) assume flat node_modules and may require additional configuration with pnpm.

---

## Technology Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Mobile Framework** | Expo SDK | 54+ | React Native toolchain, dev-client, config plugins |
| **Mobile Runtime** | React Native | 0.76+ | Cross-platform mobile UI framework |
| **Mobile Router** | Expo Router | 4+ | File-based routing for React Native |
| **Camera** | react-native-vision-camera | 4+ | Camera capture with frame processors |
| **Microphone** | @siteed/expo-audio-studio | latest | Raw PCM audio + foreground service |
| **Live Streaming** | react-native-webrtc | latest | WebRTC peer connections for audio/video |
| **ML Framework** | TensorFlow Lite | latest | On-device ML inference |
| **ML Model** | YAMNet (fine-tuned) | latest | AudioSet pre-trained, custom dog sounds |
| **Local Storage** | expo-sqlite | latest | Structured event data persistence |
| **Notifications** | expo-notifications | latest | Local + push alert notifications |
| **State Management** | Zustand | 5+ | Lightweight client state management |
| **Backend Framework** | Fastify | 5+ | Node.js REST API server |
| **WebSocket** | ws | latest | WebRTC signaling server |
| **Configuration** | Zod | 3+ | Runtime schema validation |
| **Audio Processing** | Custom (packages/audio) | — | PCM utils, mel-spectrogram, volume analysis |
| **ML Pipeline** | Custom (packages/ml) | — | Inference runner, model registry, post-processing |
| **Shared Types** | Custom (packages/types) | — | Domain entities, API contracts, enums |
| **Package Manager** | pnpm | 9+ | Monorepo dependency management |
| **Mobile Build** | EAS Build | latest | Production builds and submissions |
| **Testing (Mobile)** | Jest + RNTL | latest | Unit + integration tests |
| **Testing (Backend)** | Vitest | latest | Unit + integration tests |
| **Type Checking** | TypeScript (strict) | 5.5+ | Static type checking (all workspaces) |
| **Linting** | ESLint + Prettier | latest | Code quality and formatting |
| **CI** | GitHub Actions | — | CI pipeline (lint, typecheck, test) |
