# dwatcher — Setup Reference

## 1. Prerequisites

### Required Software

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Node.js | >= 22.0.0 | LTS recommended. Install via `nvm` or `fnm`. |
| pnpm | >= 9.0.0 | Install via `npm install -g pnpm` or `brew install pnpm`. |
| Java | >= 17 | Required for Android builds. Use SDKMAN or adoptium.net. |
| Android Studio | Latest stable (Ladybug or newer) | Required for Android SDK, emulator, and build tooling. |
| Android SDK | API 34 (Android 14) or API 35 | Installed via Android Studio's SDK Manager. |
| Android NDK | >= 26.x | Required for native modules. Install via SDK Manager. |
| Expo CLI | Latest | Bundled with the project, no global install needed. Run via `npx expo`. |

### Hardware Requirements

- **Android device** (recommended): Physical device running Android 12+ with:
  - Good microphone (required for bark detection)
  - Decent camera (recommended for snapshots and streaming)
  - Wi-Fi or cellular data connection
- **Android emulator** (alternative):
  - Must have emulated microphone support enabled
  - Camera emulation (webcam passthrough)
  - Performance is significantly lower than physical device — ML inference will be slower
- **Development machine**:
  - macOS, Linux, or Windows (macOS recommended for iOS support in the future)
  - 16GB+ RAM recommended
  - 10GB+ free disk space (Android SDK + build artifacts)

### Setting Up Android Development Environment

1. Install Android Studio from [developer.android.com/studio](https://developer.android.com/studio).
2. Open Android Studio, go to **SDK Manager** (Tools > SDK Manager), and install:
   - Android SDK Platform 34 (or 35)
   - Android SDK Build-Tools 34.x.x
   - Android SDK Command-line Tools (latest)
   - Android NDK (side-by-side, version 26.x or higher)
3. Set environment variables:

```bash
# Add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

4. Verify the setup:

```bash
adb --version
java --version
npx expo --version
```

---

## 2. Clone and Install

### Clone the Repository

```bash
git clone <repo-url> dwatcher
cd dwatcher
```

### Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies, including:
- Root-level tooling (ESLint, Prettier, TypeScript)
- Mobile app dependencies (Expo SDK, React Native, native modules)
- Backend dependencies (Fastify/Express, WebSocket, database client)
- Shared packages (audio, ml, config, types)

### Verify Installation

```bash
pnpm -r typecheck    # TypeScript type checking — must pass with zero errors
pnpm -r lint         # Linting — must pass
pnpm -r test         # Unit tests — must pass
```

---

## 3. Environment Configuration

### Mobile App (apps/mobile)

Copy the example environment file and fill in your values:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

**Required variables:**

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `EXPO_PUBLIC_SIGNALING_URL` | WebSocket URL for WebRTC signaling server | `ws://192.168.1.100:8080` |
| `EXPO_PUBLIC_TURN_URL` | TURN server URL for WebRTC relay | `turn:192.168.1.100:3478` |
| `EXPO_PUBLIC_TURN_USERNAME` | TURN server username | `dwatcher-dev` |
| `EXPO_PUBLIC_TURN_CREDENTIAL` | TURN server credential | `temporary-dev-credential` |
| `EXPO_PUBLIC_API_BASE_URL` | Backend REST API base URL | `http://192.168.1.100:4000` |

**Important notes:**
- For local development, use your machine's LAN IP address (not `localhost`) so the Android device can reach the backend.
- The Android emulator can reach the host via `10.0.2.2`. If using the emulator, set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000`.
- Do not commit `.env.local` — it is in `.gitignore`.

### Backend (apps/backend)

Copy the example environment file and fill in your values:

```bash
cp apps/backend/.env.example apps/backend/.env.local
```

**Required variables:**

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dwatcher` |
| `SIGNALING_PORT` | WebSocket signaling server port | `8080` |
| `API_PORT` | REST API server port | `4000` |
| `JWT_SECRET` | Secret for JWT token signing | `generate-a-random-secret` |
| `TURN_SECRET` | Secret for TURN credential generation | `generate-another-random-secret` |

**Optional variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |
| `RATE_LIMIT_MAX` | Max requests per rate limit window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` |

---

## 4. Running the Mobile App

### Important: Dev-Client Required

dwatcher **requires** the Expo dev-client workflow. It **cannot** run in Expo Go (managed workflow) because the following native modules are required:

- `react-native-vision-camera` — Camera access with frame processors
- `@siteed/expo-audio-studio` — Raw PCM audio with Android foreground service
- `react-native-webrtc` — WebRTC peer connections
- `tflite-react-native` or equivalent — TFLite model inference
- `expo-sqlite` — Local SQLite storage
- `expo-notifications` — Alert notifications

### First-Time Setup (Native Project Generation)

```bash
cd apps/mobile

# Generate the native android/ and ios/ directories
npx expo prebuild
```

This creates `android/` and `ios/` directories with full native project files. These are generated from `app.json` and the Expo config plugins in `app.config.ts`. The directories should be tracked in version control to ensure reproducible builds.

### Running on Android

```bash
cd apps/mobile

# Build and install on connected device or running emulator
npx expo run:android
```

This will:
1. Build the native Android app (including all native modules)
2. Install it on the connected device or running emulator
3. Start the Metro bundler for JavaScript bundling
4. Enable hot-reload for JavaScript changes

### Hot Reload (JavaScript-Only Changes)

For changes that do not touch native code (no new native modules, no changes to Expo config plugins):

```bash
# Start the Metro dev server (do this after npx expo run:android has the app running)
pnpm --filter @dwatcher/mobile start
```

Or start from the project root:

```bash
cd apps/mobile
npx expo start
```

Then press `a` to open on Android, or scan the QR code with Expo Go for the JavaScript layer only (note: native modules will not work in Expo Go, but the dev-client app on the device will receive Metro updates via the same server).

### Common Issues and Solutions

**"No connected devices" error:**
```bash
adb devices          # Check if device is detected
adb kill-server      # Restart adb if device is unauthorized
adb start-server
```

**"Execution failed for task :app:compileDebugKotlin":**
```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

**"SDK location not found":**
- Ensure `ANDROID_HOME` is set correctly in your shell profile.
- Create `apps/mobile/android/local.properties` with:
  ```
  sdk.dir=/Users/yourname/Library/Android/sdk
  ```

**"Metro bundler throws cryptic errors":**
```bash
npx expo start --clear    # Clear Metro cache and restart
```

---

## 5. Running the Backend

### Prerequisites

The backend requires a PostgreSQL database. You can use a local install or Docker:

```bash
# Option A: Local PostgreSQL (via Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb dwatcher

# Option B: Docker
docker run -d \
  --name dwatcher-db \
  -e POSTGRES_USER=dwatcher \
  -e POSTGRES_PASSWORD=dwatcher \
  -e POSTGRES_DB=dwatcher \
  -p 5432:5432 \
  postgres:16
```

### Database Migrations

```bash
cd apps/backend
pnpm run db:migrate     # Apply pending migrations
pnpm run db:seed        # Seed development data (optional)
```

### Start the Backend

```bash
# Development mode with hot-reload
pnpm --filter @dwatcher/backend dev

# Or from the backend directory
cd apps/backend
pnpm run dev
```

The backend starts two servers:
- **REST API** on port 4000 (configurable via `API_PORT`)
- **WebSocket signaling server** on port 8080 (configurable via `SIGNALING_PORT`)

### Verify Backend is Running

```bash
curl http://localhost:4000/health
# Expected response: {"status":"ok","timestamp":"2026-06-24T12:00:00Z"}

curl http://localhost:4000/api/v1/sessions
# Expected response: {"sessions":[],"total":0,"has_more":false}
```

---

## 6. Development Workflow

### Typical Workflow

1. **Start the backend** (in one terminal):
   ```bash
   pnpm --filter @dwatcher/backend dev
   ```

2. **Prebuild native projects** (first time only or after native config changes):
   ```bash
   cd apps/mobile && npx expo prebuild
   ```

3. **Run the mobile app** (in another terminal):
   ```bash
   cd apps/mobile && npx expo run:android
   ```

4. **Make changes, see hot-reload** — Metro bundler provides near-instant updates for JavaScript/TypeScript changes.

### After Native Dependency Changes

If you add a new native module or change an Expo config plugin:

```bash
cd apps/mobile
npx expo prebuild --clean    # Regenerate native projects from scratch
npx expo run:android         # Rebuild native app
```

### After JavaScript Dependency Changes

If you add, remove, or update any `npm` package (not just native):

```bash
pnpm install                 # From repo root, updates pnpm-lock.yaml
# Then restart dev servers (Metro will pick up changes after cache clear)
npx expo start --clear
```

### After Shared Package Changes

If you modify `@dwatcher/audio`, `@dwatcher/ml`, or any shared package:

1. Ensure the package has been built (if it has a build step):
   ```bash
   pnpm --filter @dwatcher/audio build
   ```

2. Restart the consuming app (Metro should re-bundle, but a restart is safest).

3. Run the shared package's tests first:
   ```bash
   pnpm --filter @dwatcher/audio test
   ```

### Working on Packages in Development

For iterative development on a shared package that the mobile app consumes, you can use pnpm's workspace behavior — Metro will follow the workspace symlink and hot-reload changes from the package source. However, if the package has a build step (compiling TypeScript), you need to either:

- Run the build in watch mode: `pnpm --filter @dwatcher/audio build --watch`
- Or configure the consuming app to resolve the package's source directly

For `@dwatcher/types`, which has no build step, changes are immediately available.

---

## 7. Verification Checklist

Use this checklist to verify that your development environment is fully set up and working:

### Repository Setup
- [ ] `pnpm install` completes without errors
- [ ] `pnpm -r typecheck` passes with zero TypeScript errors
- [ ] `pnpm -r lint` passes with no lint errors
- [ ] `pnpm -r test` passes with all tests green

### Mobile App
- [ ] `cd apps/mobile && npx expo prebuild` generates `android/` and `ios/` directories
- [ ] `cd apps/mobile && npx expo run:android` builds and launches on device/emulator
- [ ] The app shows the home screen after launch
- [ ] Metro dev server hot-reload works (edit a component, see it update)
- [ ] Debug menu opens (shake device or press Ctrl+M / Cmd+M in emulator)

### Backend
- [ ] Database is running and reachable
- [ ] `pnpm --filter @dwatcher/backend dev` starts without errors
- [ ] REST API health endpoint responds: `curl http://localhost:4000/health`
- [ ] WebSocket signaling server is reachable: `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8080` (should return 101 switching protocols response from WebSocket)

### End-to-End Connectivity
- [ ] Mobile app can reach the backend API (check logs on both sides)
- [ ] Mobile app can connect to the signaling WebSocket
- [ ] Events logged on the mobile app sync to the backend (if sync is configured)

### Native Module Verification
- [ ] Camera permission prompt shows on first launch
- [ ] Microphone permission prompt shows on first launch
- [ ] Notification permission prompt shows on first launch
- [ ] Foreground service notification appears when monitoring starts
- [ ] Audio level meter shows movement when sound is detected
- [ ] Camera preview renders correctly

---

## 8. Troubleshooting

### Build Failures

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `Execution failed for task ':app:compileDebugKotlin'` | Kotlin version mismatch | Check `android/build.gradle` Kotlin version matches the Expo requirement |
| `A problem occurred configuring project ':react-native-vision-camera'` | NDK not installed | Install NDK via SDK Manager |
| `Unable to load script from assets index.android.bundle` | Metro bundle not generated | Run `npx expo run:android` (not just `npx expo start`) |
| `error: package android.media.microphone does not exist` | SDK version too low | Ensure compileSdkVersion >= 34 |

### Runtime Errors

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| App crashes on launch | Missing native module or config plugin | Run `npx expo prebuild --clean` then rebuild |
| Camera not working | Permission not granted | Check app settings, grant camera permission |
| Microphone not working | Permission not granted or foreground service error | Check app settings, grant microphone permission, check service notification config |
| WebRTC connection fails | Signaling server unreachable or TURN misconfigured | Verify `EXPO_PUBLIC_SIGNALING_URL` points to running server |
| ML inference returns NaN | Input tensor shape mismatch | Verify mel-spectrogram output matches model input shape [1, 96, 64, 1] |
| SQLite errors on write | Schema not migrated | Check `expo-sqlite` version and table creation logic |

### Expo-Specific Issues

| Symptom | Solution |
|---------|----------|
| `@siteed/expo-audio-studio` not finding native module | Ensure `expo prebuild` has been run; the config plugin must generate the native code |
| Expo Go link opens instead of dev-client | Press `a` in the Metro terminal to open via ADB, or scan the QR code with the dev-client app, not Expo Go |
| `react-native-webrtc` screen sharing not working | Ensure the app has the `FOREGROUND_SERVICE` permission in `AndroidManifest.xml` (generated by the config plugin) |

### Metro Bundler Issues

```bash
# Clear all Metro caches
npx expo start --clear

# If issues persist, reset Metro's cache
npx react-native start --reset-cache
# or, for Expo
npx expo start -c
```
