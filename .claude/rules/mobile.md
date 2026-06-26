## Mobile App — apps/mobile

### Execution environment (agents)

- **Run mobile work on the host.** Prefer repo-root pnpm workspace commands such as `pnpm --filter @dwatcher/mobile start`, `pnpm --filter @dwatcher/mobile lint`, and `pnpm --filter @dwatcher/mobile typecheck`.
- Use `cd apps/mobile` and `npx expo …` for Expo-native commands (`expo install`, `expo-doctor`, `expo prebuild`, EAS, simulators).
- Do **not** substitute Expo CLI with ad-hoc wrappers; use `make expo` or filtered `pnpm`/`npx expo` as documented.
- After changing mobile dependencies, run **`pnpm install` from the monorepo root on the host** so `pnpm-lock.yaml` stays in sync.

### Stack

- Framework: **React Native + Expo** (Expo Router, dev-client)
- Package name: `@dwatcher/mobile`
- Location: `apps/mobile/`

### Router

Use **Expo Router** (file-based routing). Do not wire React Navigation manually unless Expo Router docs require it.

### Screens (`src/screens/`)

All screen UI lives under **`apps/mobile/src/screens/`** — one file per screen, named `PascalCase` + `Screen` (e.g. `HomeScreen.tsx`, `MonitoringScreen.tsx`).

- Export the screen as a **named** export (`export function HomeScreen()`). Do **not** default-export from `src/screens/` (Expo Router treats default exports under `app/` as routes).
- Route files at the `app/` root (e.g. `app/index.tsx`) are **thin re-exports only** — no screen layout, styles, or business logic:

```tsx
export { HomeScreen as default } from '../src/screens/HomeScreen';
```

- Do **not** implement screen UI in route files, `_layout.tsx`, or other `app/` files. Shared UI belongs in `src/components/`.

### Environment variables

- Prefer Expo’s supported public env patterns (`EXPO_PUBLIC_*` in `apps/mobile/.env`).
- Keep secrets out of the repo; document keys (no real values) in `apps/mobile/.env.example`.
- **`EXPO_PUBLIC_API_BASE_URL` is required** for backend API calls. Copy `apps/mobile/.env.example` → `.env`; use a host reachable from the emulator or device (see comments in the example). Restart Expo after changes.

### Internal package imports

```ts
import type { … } from '@dwatcher/types'
import { … } from '@dwatcher/config'
import { … } from '@dwatcher/audio'
import { … } from '@dwatcher/ml'
```

### Platform-specific code

Use `.ios.tsx` / `.android.tsx` file extensions for platform-specific implementations.
Use `Platform.OS` conditionals only for minor variations — prefer separate files for significant differences.

### Mobile-only features

The following features exist only in `apps/mobile` and must not be added to shared packages unless they are clearly cross-platform APIs:

- Camera API (photo capture, video streaming)
- Foreground service (audio monitoring while backgrounded, via `@siteed/expo-audio-studio`)
- WebRTC (peer-to-peer audio/video streaming)
- TFLite on-device inference (via `tflite-react-native` or similar)
- Push notifications
- Other device-only capabilities

### Development (host)

```bash
pnpm --filter @dwatcher/mobile start
cd apps/mobile && npx expo run:android
```

### Production builds (host)

Use **EAS** from the app directory when profiles exist:

```bash
cd apps/mobile
eas build --platform android --profile production
eas submit --platform android
```

### EAS build profiles

When `apps/mobile/eas.json` exists, typical profiles are `development`, `staging`, and `production` (adjust to what is checked in).
