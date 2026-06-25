## Mobile App — apps/mobile

### Execution environment (agents)

- **Run mobile work on the host.** Prefer repo-root pnpm workspace commands such as `pnpm --filter @dwatcher/mobile start`, `pnpm --filter @dwatcher/mobile lint`, and `pnpm --filter @dwatcher/mobile typecheck`.
- Use `cd apps/mobile && npx expo ...` for Expo-native commands (`expo install`, `expo-doctor`, `expo prebuild`, EAS, simulators).
- Do **not** substitute Expo CLI with ad-hoc wrappers; use `npx expo` or filtered `pnpm` as documented.
- After changing mobile dependencies, run **`pnpm install` from the monorepo root on the host** so `pnpm-lock.yaml` stays in sync.

### Stack

- Framework: **React Native + Expo SDK 54+** with **expo-dev-client**
- **CRITICAL: This project uses expo-dev-client, NOT the managed workflow / Expo Go.**
- Package name: `@dwatcher/mobile`
- Location: `apps/mobile/`

### Router

Use **Expo Router** (file-based routing). Do not wire React Navigation manually unless Expo Router docs require it.

### Screens (`app/screens/`)

All screen UI lives under **`apps/mobile/app/screens/`** — one file per screen, named `PascalCase` + `Screen` (e.g. `MonitoringScreen.tsx`, `SettingsScreen.tsx`).

- Export the screen as a **named** export (`export function MonitoringScreen()`). Do **not** default-export from `app/screens/` (Expo Router treats default exports under `app/` as routes).
- Route files at the `app/` root (e.g. `index.tsx`, `monitoring.tsx`) are **thin re-exports only** — no screen layout, styles, or business logic:

```tsx
export { MonitoringScreen as default } from './screens/MonitoringScreen'
```

- Do **not** implement screen UI in route files, `_layout.tsx`, or other `app/` files. Shared UI belongs in `src/components/`.

### Dev-client workflow

- **After native changes** (native modules, config plugins, podfile/gradle changes):
  ```bash
  cd apps/mobile && npx expo run:android
  ```
- **JS-only changes** (no native rebuild needed):
  ```bash
  pnpm --filter @dwatcher/mobile start
  ```

### Android Foreground Service

- Audio capture uses `@siteed/expo-audio-studio` built-in foreground service with type `"microphone"`.
- A persistent notification is **required** while the foreground service is active.
- **`FOREGROUND_SERVICE_MICROPHONE`** permission is required for Android 14+ (API 34+). This must be declared in `AndroidManifest.xml` via the expo-dev-client app config.
- The foreground service notification should display recording status and elapsed time.

### Camera

- **`react-native-vision-camera`** is the primary camera library. Use for:
  - Camera preview while monitoring
  - Frame processor API for real-time inference
- **`expo-camera`** should be used **ONLY** for simple photo capture tasks that do not involve ML (e.g., taking a picture of the dog for profile setup).
- Frame processor API (`useFrameProcessor`) is preferred for passing camera frames to TFLite inference.

### Audio

- **`@siteed/expo-audio-studio`** is the primary audio library. Use for:
  - Raw PCM buffer access via recording events
  - Foreground service integration for persistent microphone recording
  - Recording format: **16kHz, 16-bit, mono PCM**
- **`expo-audio`** should be used **ONLY** for simple file-based recording playback (e.g., playing back saved bark recordings).
- Audio buffer chunks are passed from the native layer to `@dwatcher/audio` for processing (volume computation, mel-spectrogram generation).

### ML

- **`tflite-react-native`** for on-device TFLite model inference.
- Trained models live in **`packages/ml/models/`**.
- Feature extraction (mel-spectrogram) runs in native code for performance — implemented in C++ via JNI.
- A JavaScript fallback using `@dwatcher/audio` exists for development/testing without the native build.
- Inference pipeline: raw PCM -> feature extraction (native C++) -> TFLite model -> classification result.

### WebRTC

- **`react-native-webrtc`** for real-time audio streaming.
- Requires expo-dev-client and `npx expo run:android` after installation (native module).
- Config plugin: `@config-plugins/react-native-webrtc` must be added to app config.
- Signaling server runs in `apps/backend`.
- Use cases: streaming audio to a remote viewer, receiving control commands.

### Platform-specific code

- Use `.android.tsx` / `.android.ts` extensions for Android-specific implementations (primary platform).
- Use `.ios.tsx` / `.ios.ts` extensions for iOS-specific implementations (secondary).
- Use `Platform.OS` conditionals only for minor variations — prefer separate files for significant differences.
- **Android-first development.** Core features (foreground service, ML inference) target Android first.

### Environment variables

Documented in `apps/mobile/.env.example`. Key vars:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SIGNALING_URL` | WebRTC signaling server URL |
| `EXPO_PUBLIC_TURN_URL` | TURN server URL |
| `EXPO_PUBLIC_TURN_USERNAME` | TURN server username |
| `EXPO_PUBLIC_TURN_CREDENTIAL` | TURN server credential |
| `EXPO_PUBLIC_API_BASE_URL` | Backend REST API base URL |

Copy `apps/mobile/.env.example` → `apps/mobile/.env` with real values. Restart Expo after changes.

### Internal package imports

```ts
import { ... } from '@dwatcher/config'
import type { ... } from '@dwatcher/types'
import { ... } from '@dwatcher/audio'
import { ... } from '@dwatcher/ml'
```

### Mobile-only features

The following features exist only in `apps/mobile` and must not be added to shared packages unless they are clearly cross-platform APIs:

- Camera API (`react-native-vision-camera` preview, frame processing)
- Microphone / audio capture (`@siteed/expo-audio-studio` foreground service)
- On-device ML inference (`tflite-react-native`)
- WebRTC streaming (`react-native-webrtc`)
- Push notifications
- Android foreground service

### Development (host)

```bash
pnpm --filter @dwatcher/mobile start
```

### Production builds (host)

Use **EAS** from the app directory:

```bash
cd apps/mobile
eas build --platform android --profile production       # Android build
eas build --platform ios --profile production           # iOS build
eas submit --platform android                           # submit to Google Play
eas submit --platform ios                               # submit to App Store
```

### EAS build profiles

When `apps/mobile/eas.json` exists, typical profiles are `development`, `staging`, and `production` (adjust to what is checked in).
