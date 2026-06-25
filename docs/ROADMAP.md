# dwatcher — Feature Roadmap

The roadmap is organized into phases that build on each other. Each phase has a clear scope, deliverables, and exit criteria. Phases are designed to be developed in sequence, but some can overlap with careful coordination (e.g., Phase 2 ML work can proceed alongside Phase 1 audio service integration once the audio capture interface is agreed upon).

---

## Phase 0: Project Scaffold

**Goal**: Establish the repository structure, tooling, and CI pipeline so that all developers have a consistent development environment and can iterate rapidly.

**Dependencies**: None.

**Scope**: Repository setup

### Deliverables

1. **Monorepo initialization**
   - `pnpm-workspace.yaml` configured with `apps/` and `packages/` globs.
   - Root `package.json` with scripts (`lint`, `test`, `typecheck`, `build`) delegating to pnpm recursive commands.
   - `.npmrc` with `shamefully-hoist=false` (strict dependency resolution).

2. **Workspace creation**
   - `@dwatcher/mobile` (empty Expo app with dev-client configured).
   - `@dwatcher/backend` (empty Fastify/Express app).
   - `@dwatcher/types` (empty types package with `tsconfig.json` extending base).
   - `@dwatcher/config` (empty config package with Zod).
   - `@dwatcher/audio` (empty audio package skeleton).
   - `@dwatcher/ml` (empty ML package skeleton).

3. **TypeScript configuration**
   - `tsconfig.base.json` with `"strict": true`, appropriate module resolution, `ESNext` target.
   - Each workspace extends the base config.
   - Path aliases configured for clean imports.

4. **Code quality tooling**
   - `.eslintrc.cjs` with TypeScript rules, React Native rules, import ordering.
   - `.prettierrc` with consistent formatting settings.
   - Pre-commit hooks (lint-staged + husky) for formatting and linting.

5. **CI/CD pipeline**
   - `.github/workflows/ci.yml` running on pull requests and pushes to main:
     - `pnpm install`
     - `pnpm -r lint`
     - `pnpm -r typecheck`
     - `pnpm -r test`

6. **Basic Expo mobile app**
   - `npx create-expo-app` template with `expo-dev-client` config plugin.
   - `app.json` configured with app name, slug, SDK version, Android package name.
   - Minimal Expo Router setup with a single home screen.
   - Verify `npx expo run:android` builds and launches.

7. **Basic Node.js backend**
   - Fastify server with health endpoint (`GET /health`).
   - Basic error handling middleware.
   - Environment variable validation via `@dwatcher/config`.

8. **Documentation**
   - All 6 docs files in `docs/` (this document set).
   - `.env.example` files for both apps.

### Exit Criteria

- [ ] `pnpm install` succeeds from clean checkout
- [ ] `pnpm -r typecheck` passes with zero errors
- [ ] `pnpm -r lint` passes with zero warnings
- [ ] `pnpm -r test` runs all (empty) test suites successfully
- [ ] `cd apps/mobile && npx expo run:android` builds and shows home screen
- [ ] `pnpm --filter @dwatcher/backend dev` starts and `GET /health` returns 200
- [ ] CI pipeline passes on a test PR

### Estimated Effort

3-5 days for a single developer.

---

## Phase 1: Core Audio Monitoring

**Goal**: The app can record audio in the background (foreground service), display a real-time volume meter, and persist session data locally.

**Dependencies**: Phase 0 (project scaffold complete).

**Scope**: Mobile app + backend + audio package.

### Deliverables

1. **@siteed/expo-audio-studio integration**
   - Install package via `npx expo install @siteed/expo-audio-studio`.
   - Configure foreground service notification with type `microphone`.
   - Implement `AudioService` class: `startMonitoring()`, `stopMonitoring()`, event emitter for PCM data.
   - Handle permissions (request microphone permission on first use).
   - Handle service lifecycle (start/stop on app foreground/background transitions).

2. **Raw PCM buffer capture**
   - Configure audio source: `CAMCORDER`, 44100Hz sample rate, 16-bit, mono.
   - Register PCM data callback that fires every ~100ms with an `Int16Array` buffer.
   - Implement thread-safe circular buffer (3-second capacity: 48,000 samples at 16kHz).
   - Resample from 44.1kHz to 16kHz (required for ML input format).

3. **Volume/intensity meter**
   - Implement `@dwatcher/audio/src/volume.ts`:
     - `computeRms(samples: Float32Array): number`
     - `computeDbfs(samples: Float32Array): number`
     - `computePeakAmplitude(samples: Float32Array): number`
   - Zustand store (`audio-store.ts`) with `currentVolume`, `currentDbfs`, `isSilent` fields.
   - Wire PCM callback to volume computation → audio store update.
   - Build `AudioMeter` component: animated bar showing current dBFS level with color coding (green = normal, yellow = elevated, red = loud).

4. **Start/stop monitoring UI**
   - `HomeScreen`: big "Start Monitoring" button, dog selector (hardcoded for now).
   - `MonitoringScreen`: camera placeholder, audio meter, pause/resume/stop buttons.
   - Session lifecycle: start → monitoring → pause → resume → stop.
   - Foreground service notification with stop action button.

5. **Audio session persistence**
   - `expo-sqlite` database schema:
     ```sql
     CREATE TABLE sessions (
       id TEXT PRIMARY KEY,
       dog_id TEXT NOT NULL,
       started_at TEXT NOT NULL,    -- ISO 8601
       ended_at TEXT,
       state TEXT NOT NULL DEFAULT 'monitoring',
       device_battery_level REAL
     );
     ```
   - Implement `SessionRepository` with CRUD methods.
   - Persist session on start; update on state change; finalize on stop.
   - Query recent sessions for history screen.

6. **Backend REST API for sessions**
   - Database setup (PostgreSQL) with schema migration.
   - `POST /api/v1/sessions` — create session from mobile device.
   - `GET /api/v1/sessions/:id` — get session details.
   - `PATCH /api/v1/sessions/:id` — update session state.
   - `GET /api/v1/sessions` — list sessions with pagination.
   - JWT authentication middleware.

7. **Unit and integration tests**
   - `@dwatcher/audio`: Test `computeRms`, `computeDbfs` with known PCM values.
   - `AudioService`: Test start/stop lifecycle, buffer overflow, permission handling.
   - `SessionRepository`: Test CRUD, edge cases (empty results, concurrent writes).
   - Backend: Test session CRUD endpoints.

### Exit Criteria

- [ ] App records audio continuously in foreground service (visible notification)
- [ ] Audio meter responds to sound in real time (<200ms latency)
- [ ] Sessions persist across app restarts (SQLite)
- [ ] Start/stop/pause monitoring works correctly
- [ ] Backend session CRUD endpoints tested via curl
- [ ] Test coverage >70% for audio package and session management

### Estimated Effort

2-3 weeks for a single developer.

---

## Phase 2: Bark Detection

**Goal**: The app detects dog barks using on-device ML, logs them as events, and sends local notifications.

**Dependencies**: Phase 1 (audio capture + circular buffer operational).

**Scope**: Mobile app + ML package + audio package.

### Deliverables

1. **YAMNet TFLite model preparation**
   - Source or train the fine-tuned YAMNet model (see ML-PIPELINE.md for details).
   - Convert to TFLite format with INT8 quantization.
   - Place model file at `packages/ml/models/v1/yamnet_bark_int8.tflite`.
   - Create model metadata JSON: version, input/output shapes, class labels, accuracy metrics.

2. **Model registry and loading**
   - Implement `@dwatcher/ml/src/registry.ts`:
     - `ModelRegistry` class managing version lookup and fallback.
     - Load model from app assets or filesystem.
     - Validate model version compatibility.
   - Implement `@dwatcher/ml/src/inference.ts`:
     - `loadModel(modelPath: string): Promise<TFLiteModel>`
     - `runInference(model: TFLiteModel, inputTensor: Float32Array): Float32Array`
     - Input/output shape validation.

3. **Feature extraction pipeline**
   - Implement `@dwatcher/audio/src/features.ts`:
     - `computeMelSpectrogram()`: Full pipeline from raw PCM to mel-spectrogram.
     - Hann window, STFT (FFT 512, hop 160), 64 mel bands (125Hz–7500Hz), log compression.
     - Output shape: [96, 64] (96 time frames, 64 frequency bins).
   - Implement in `@dwatcher/ml/src/pipeline.ts`:
     - `ClassificationPipeline` class orchestrating feature extraction → inference → post-processing.
     - Extract 0.96-second window from circular buffer every 500ms.
     - Add batch dimension to mel-spectrogram: [1, 96, 64, 1].

4. **Post-processing and event generation**
   - Implement `@dwatcher/ml/src/postprocess.ts`:
     - `applySoftmax()`: Convert logits to probability distribution.
     - `getTopClass()`: Return highest-confidence class label.
     - `isBarkEvent()`: Evaluate against confidence threshold (default 0.7) and cooldown (5s).
     - Onset detection: Compare current frame energy to 1-second rolling average.
   - `DetectionResult` type: `{ className: DetectionClass, confidence: number, timestamp: number }`.

5. **Event logging to SQLite**
   - Database schema (add to existing database):
     ```sql
     CREATE TABLE detection_events (
       id TEXT PRIMARY KEY,
       session_id TEXT NOT NULL,
       detected_at TEXT NOT NULL,
       event_type TEXT NOT NULL,       -- 'bark', 'whine', 'growl', etc.
       confidence REAL NOT NULL,
       duration_ms INTEGER,
       peak_amplitude REAL,
       classification TEXT NOT NULL,   -- DetectionClass enum value
       snapshot_uri TEXT,
       FOREIGN KEY (session_id) REFERENCES sessions(id)
     );
     ```
   - `EventRepository`: `insertEvent()`, `queryEvents(sessionId, type, from, to)`.
   - Batch writes to avoid blocking the audio thread.

6. **Local push notifications**
   - Configure notification channel: "Bark Alerts", high importance, custom sound.
   - On bark detection (confidence > threshold): fire local notification.
   - Notification content: "Bark detected! Confidence: 92%"
   - Notification grouping: group multiple barks within 30 seconds.

7. **Detection visualization**
   - `EventTimeline` component: scrollable list of recent detections with type icon, timestamp, confidence badge.
   - `BarkCounter` component: session total count, rate per minute, peak interval.
   - Update `MonitoringScreen` to show event timeline and bark counter below the audio meter.

8. **Unit and integration tests**
   - `@dwatcher/ml`: Test inference pipeline with known input, test post-processing (softmax, thresholding, cooldown).
   - `@dwatcher/audio`: Test mel-spectrogram computation against reference implementation.
   - Integration test: feed known bark audio → verify detection event and notification.

### Exit Criteria

- [ ] App detects barks with >80% accuracy in quiet environments
- [ ] False positive rate <5% in quiet home environment (no TV, no traffic)
- [ ] Inference completes in <50ms on mid-range Android device (Snapdragon 7-series)
- [ ] Events persist to SQLite and display in the timeline
- [ ] Local notification fires on detection with correct content
- [ ] Cooldown prevents duplicate events within 5-second window
- [ ] Test coverage >70% for ML pipeline

### Estimated Effort

3-4 weeks for a single developer (includes model preparation time).

---

## Phase 3: Camera Integration

**Goal**: The app captures camera frames, toggles between front and back cameras, and saves snapshots triggered by detection events.

**Dependencies**: Phase 2 (detection events provide the trigger for snapshots).

**Scope**: Mobile app.

### Deliverables

1. **react-native-vision-camera setup**
   - Install via `npx expo install react-native-vision-camera`.
   - Configure camera permissions in `app.json`.
   - Set up camera preview in `MonitoringScreen`.
   - Toggle front/back camera with a button.

2. **Snapshot capture on detection**
   - When a bark event is detected (from Phase 2), trigger `camera.takeSnapshot()`.
   - Save snapshot to app's document directory.
   - Persist snapshot URI in the `detection_events` table.
   - Display snapshot thumbnail in `EventTimeline` for events that have snapshots.

3. **Frame processor integration (optional for now)**
   - Set up frame processor plugin placeholder.
   - Future use: motion analysis for pacing detection (Phase 5).

4. **Gallery view**
   - `HistoryScreen` shows captured snapshots grouped by session.
   - Tap to enlarge, swipe to navigate.
   - Share/export individual snapshots.

5. **Camera settings**
   - Settings screen: camera preference (front/back), resolution (low/medium/high), snapshot behavior (on detection / off).
   - Persist camera settings in AsyncStorage.

### Exit Criteria

- [ ] Camera preview renders smoothly on monitoring screen
- [ ] Front/back toggle works correctly
- [ ] Snapshots are captured automatically on bark detection
- [ ] Snapshots persist and appear in history view
- [ ] Camera settings are configurable and persist across app restarts

### Estimated Effort

1-2 weeks for a single developer.

---

## Phase 4: Live Streaming

**Goal**: Stream live audio and video from the device to a web viewer via WebRTC, enabling real-time remote monitoring.

**Dependencies**: Phase 3 (camera working), Phase 1 (audio capture working), Phase 0 (backend scaffold).

**Scope**: Mobile app + backend.

### Deliverables

1. **WebRTC signaling server**
   - WebSocket server in `@dwatcher/backend` on port 8080.
   - Room-based signaling: device creates room, viewer joins room.
   - Message protocol: `join`, `offer`, `answer`, `candidate`, `peer_joined`, `peer_left`.
   - Authentication: JWT verification for WebSocket connections.
   - Session cleanup: remove rooms when all peers disconnect.

2. **react-native-webrtc integration**
   - Install via `npx expo install react-native-webrtc`.
   - Create `RTCPeerConnection` with STUN/TURN configuration.
   - Add local audio track (from microphone via WebRTC getUserMedia).
   - Add local video track (from camera via vision-camera WebRTC integration or separate camera stream).
   - Handle ICE candidate gathering and exchange.
   - Handle connection state changes and reconnection.

3. **TURN server (Coturn) deployment**
   - Deploy Coturn server (for local dev or cloud).
   - Generate TURN credentials with time-limited tokens.
   - Configure `react-native-webrtc` with TURN endpoints.

4. **Stream toggle UI**
   - Add "Enable Streaming" toggle to `MonitoringScreen`.
   - Show WebRTC connection status (connecting, connected, disconnected, failed).
   - Start/stop streaming independently of monitoring.

5. **Minimal web viewer**
   - Static HTML page with WebRTC client.
   - Connect to signaling server, receive audio/video stream.
   - Display live video with basic controls (mute, fullscreen).
   - Serve from `@dwatcher/backend` at `/viewer.html`.

6. **Unit and integration tests**
   - Signaling server: test join/leave/offer/answer message flow.
   - WebRTC service: test connection lifecycle (mocked native module).

### Exit Criteria

- [ ] Signaling server correctly relays offer/answer/candidate between device and viewer
- [ ] WebRTC peer connection establishes between device and web viewer
- [ ] Live audio/video plays in web viewer with <2 second latency
- [ ] Stream starts/stops correctly from the mobile app
- [ ] TURN relay works when direct P2P connection fails
- [ ] Connection state displayed correctly on mobile app
- [ ] Reconnection works when connection drops

### Estimated Effort

3-4 weeks for a single developer.

---

## Phase 5: Anxiety Detection & Behavior Analysis

**Goal**: Extend ML classification to detect multiple vocalization types (whining, howling, growling) and compute a composite anxiety score incorporating camera-based motion analysis.

**Dependencies**: Phase 2 (ML pipeline), Phase 3 (camera frame processor).

**Scope**: Mobile app + ML package + audio package.

### Deliverables

1. **Multi-class model fine-tuning**
   - Extend YAMNet fine-tuning to N classes: bark, whine, growl, howl, silence, other.
   - Collect or source training data for whining, growling, howling (500+ samples per class).
   - Retrain the classification head with new labels.
   - Export as v2 model: `packages/ml/models/v2/yamnet_dog_vocalizations_int8.tflite`.
   - Update model registry with v2 metadata.

2. **Multi-class pipeline update**
   - Update `ClassificationPipeline` to output multi-class results.
   - Separate thresholds per class (bark: 0.7, whine: 0.6, growl: 0.65, howl: 0.7).
   - Individual cooldown timers per class.
   - Update `DetectionResult` to include all class probabilities.

3. **Camera-based motion analysis**
   - Implement frame processor for motion detection.
   - Calculate frame-to-frame difference (pixel intensity changes).
   - Classify motion types: stationary, pacing (back-and-forth), rapid movement.
   - Integrate motion analysis into anxiety scoring.

4. **Composite anxiety score algorithm**
   - Factors:
     - Vocalization intensity (whining: +0.4, howling: +0.3, barking: +0.2, growling: +0.3)
     - Frequency (events per minute): normalize to 0.0–0.3 contribution
     - Duration (total vocalization seconds per minute): normalize to 0.0–0.2 contribution
     - Motion score (pacing: +0.3, rapid movement: +0.2): normalize to 0.0–0.3 contribution
     - Silence fraction (low silence = higher anxiety): 0.0–0.2 contribution
   - Total anxiety score: weighted sum, normalized to 0.0–1.0.
   - Scoring window: rolling 2-minute window, updated every 30 seconds.
   - Color-coded levels: 0.0–0.3 (green/low), 0.3–0.6 (yellow/moderate), 0.6–0.8 (orange/high), 0.8–1.0 (red/critical).

5. **Anxiety gauge UI**
   - `AnxietyGauge` component: circular gauge showing current anxiety score with color zone transitions.
   - History of anxiety scores over the session (mini line chart).
   - Contributing factors breakdown (which behaviors are driving the score).

6. **Anxiety event notifications**
   - Trigger local notification when anxiety score crosses into "high" (0.6+) or "critical" (0.8+) territory.
   - "Anxiety alert" notification channel, separate from bark alerts.
   - Notification includes score, contributing factors, and duration.

7. **Unit and integration tests**
   - Test multi-class inference with known audio samples.
   - Test motion analysis with synthetic frame sequences.
   - Test anxiety score algorithm against manually calculated reference values.
   - Integration test: feed multi-class audio + motion → verify anxiety score.

### Exit Criteria

- [ ] Multi-class inference correctly classifies bark, whine, growl, howl, silence
- [ ] Per-class thresholds and cooldowns work independently
- [ ] Motion analysis correctly identifies pacing behavior
- [ ] Anxiety score correlates with known anxiety patterns (validated against test data)
- [ ] Anxiety gauge UI updates smoothly and color-codes correctly
- [ ] Notifications fire at appropriate anxiety thresholds
- [ ] Test coverage >70% for new ML features

### Estimated Effort

4-6 weeks for a single developer (includes data collection and model retraining time).

---

## Phase 6: Long-Term Analytics

**Goal**: Track and visualize behavior patterns over days and weeks, providing insights into the dog's activity patterns when the owner is away.

**Dependencies**: Phase 2 (event logging), Phase 5 (multi-class + anxiety detection).

**Scope**: Mobile app + backend.

### Deliverables

1. **Local analytics queries**
   - Implement `AnalyticsRepository` with SQL aggregations:
     - Bark frequency per hour/day/week.
     - Anxiety score trends over time.
     - Time-of-day activity distribution.
     - Session duration statistics.
     - Most active/least active hours.

2. **Analytics UI — History Screen**
   - `HistoryScreen` revamp with sections:
     - **Timeline**: Scrollable list of all sessions with summary cards.
     - **Charts**: Day/week views with bar charts (bark frequency) and line charts (anxiety trends).
     - **Calendar**: Mini calendar heatmap showing daily activity level.
     - **Insights**: Auto-generated text summaries ("Your dog was most active between 2-4 PM this week.").

3. **Backend aggregation API**
   - `GET /api/v1/reports/daily?date=2026-06-24` — Daily summary (total barks, anxiety peaks, most active hours, snapshot count).
   - `GET /api/v1/reports/weekly?week_start=2026-06-22` — Weekly trends (day-over-day comparison, averages, anomaly detection).
   - `GET /api/v1/reports/raw?from=...&to=...` — Raw event data for custom analysis.

4. **Daily summary report**
   - Generate daily summary when a monitoring session ends:
     - Total monitoring time
     - Bark count and rate
     - Anxiety score range and peak
     - Most vocal hour
     - Camera snapshots taken
   - Display in app as a notification or in-app card.

5. **Data export**
   - Export event data as CSV or JSON.
   - Share via system share sheet (email, messaging apps).

### Exit Criteria

- [ ] History screen shows session list with summary stats
- [ ] Charts render correctly (bar for bark frequency, line for anxiety trends)
- [ ] Calendar heatmap shows daily activity levels
- [ ] Backend aggregation endpoints return correct data
- [ ] Daily summary report is informative and accurate
- [ ] Data export produces valid CSV/JSON

### Estimated Effort

2-3 weeks for a single developer.

---

## Phase 7: Remote Dashboard & Alerts

**Goal**: Create a comprehensive remote monitoring experience with a web dashboard, push notifications, settings management, and multi-device support.

**Dependencies**: Phase 4 (live streaming), Phase 6 (analytics), Phase 5 (anxiety detection).

**Scope**: Mobile app + backend + (potentially) new web app.

### Deliverables

1. **Web viewer dashboard (full app)**
   - Responsive web app (React or plain HTML/JS) served from backend.
   - Features:
     - Live stream viewer (WebRTC from Phase 4).
     - Real-time event timeline (streamed via WebSocket from device).
     - Session history browser.
     - Daily/weekly analytics charts.
     - Anxiety score gauge (real-time).
     - Multi-camera support (switch between devices).
   - Authentication: JWT-based login from web.
   - Secure WebSocket for real-time data.

2. **Push notification enhancements**
   - Backend push notification service (Expo Push Notifications or Firebase Cloud Messaging).
   - Event-driven push notifications:
     - Bark detected (configurable threshold).
     - Anxiety threshold crossed (configurable level).
     - Session ended unexpectedly (device lost power/network).
     - No activity detected for N hours (dog might have escaped or device failed).
   - Quiet hours: suppress notifications during specified times.
   - Notification preference management in Settings screen.

3. **Settings management**
   - Remote settings sync: change detection thresholds, notification preferences, camera settings from the web dashboard.
   - Settings are pushed to the device via WebSocket when the device is connected, or queued for delivery when the device reconnects.
   - Settings persistence: database-backed settings per device/dog.

4. **Multi-device support**
   - Register multiple dwatcher devices per account.
   - Associate each device with a different dog.
   - Web dashboard: select which device to view/stream.
   - Mobile app: switch between monitored dogs.
   - Backend: device management API (register, update, delete).

5. **Alert escalation**
   - Configurable escalation rules:
     - Critical anxiety (>0.8) for >5 minutes: escalate to push notification.
     - No response to alert for >10 minutes: escalate via SMS/email (future).
     - Consecutive monitoring failures: alert device offline.
   - Alert history log in backend.

### Exit Criteria

- [ ] Web dashboard displays live stream with <2 second latency
- [ ] Real-time event timeline on web dashboard matches mobile app
- [ ] Push notifications arrive within 30 seconds of detection event
- [ ] Settings changes from web dashboard sync to device within 60 seconds
- [ ] Multi-device switching works correctly in web dashboard
- [ ] Quiet hours suppress notifications as configured
- [ ] Alert escalation works for critical anxiety events

### Estimated Effort

6-8 weeks for a single developer (or 3-4 weeks with two developers).

---

## Future Considerations (Beyond Phase 7)

- **iOS support**: Port the mobile app to iOS. Requires adapting foreground service pattern to iOS background modes, different camera/audio APIs, and Core ML for TFLite inference.
- **Multiple dogs per household**: Detect and differentiate multiple dogs in the same household using audio fingerprinting or visual recognition.
- **Two-way audio**: Enable speaking to the dog through the device speaker (requires speaker access and echo cancellation).
- **Treat dispenser integration**: Hardware integration with auto treat dispensers, triggered when the dog is calm.
- **Veterinary insights API**: Share behavior data with veterinarians through a secure API for remote behavioral health assessment.
- **Home security integration**: Integrate with home security systems (alarm panel, smart locks) for coordinated response.
