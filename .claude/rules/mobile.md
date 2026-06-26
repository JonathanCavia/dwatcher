## Mobile App — apps/mobileapp

### Execution environment (agents)

- **Run mobile work on the host.** Prefer repo-root pnpm workspace commands such as `pnpm --filter @nestled/mobileapp start`, `pnpm --filter @nestled/mobileapp lint`, and `pnpm --filter @nestled/mobileapp typecheck`.
- Use `cd apps/mobileapp` and `npx expo …` for Expo-native commands (`expo install`, `expo-doctor`, `expo prebuild`, EAS, simulators).
- Do **not** substitute Expo CLI with ad-hoc wrappers; use `make expo` or filtered `pnpm`/`npx expo` as documented.
- After changing mobile dependencies, run **`pnpm install` from the monorepo root on the host** so `pnpm-lock.yaml` stays in sync.

### Stack

- Framework: **React Native + Expo** (Expo Router)
- Package name: `@nestled/mobileapp`
- Location: `apps/mobileapp/`

### Router

Use **Expo Router** (file-based routing). Do not wire React Navigation manually unless Expo Router docs require it.

### Screens (`app/screens/`)

All screen UI lives under **`apps/mobileapp/app/screens/`** — one file per screen, named `PascalCase` + `Screen` (e.g. `WelcomeScreen.tsx`, `AddressScreen.tsx`).

- Export the screen as a **named** export (`export function WelcomeScreen()`). Do **not** default-export from `app/screens/` (Expo Router treats default exports under `app/` as routes).
- Route files at the `app/` root (e.g. `index.tsx`, `address.tsx`) are **thin re-exports only** — no screen layout, styles, or business logic:

```tsx
export { WelcomeScreen as default } from './screens/WelcomeScreen'
```

- Do **not** implement screen UI in route files, `_layout.tsx`, or other `app/` files. Shared UI belongs in `src/components/`; tokens in `@nestled/theme` / `src/theme/`.

### Environment variables

- Prefer Expo’s supported public env patterns (`EXPO_PUBLIC_*` in `apps/mobileapp/.env`).
- Keep secrets out of the repo; document keys (no real values) in `apps/mobileapp/.env.example`.
- **`EXPO_PUBLIC_API_BASE_URL` is required** for backend API calls (`@nestled/api`). Copy `apps/mobileapp/.env.example` → `.env`; use a host reachable from the emulator or device (see comments in the example). Restart Expo after changes.

### Internal package imports

```ts
import { … } from '@nestled/copy'
import type { … } from '@nestled/types'
import { … } from '@nestled/hooks'
import { … } from '@nestled/utils'
import { … } from '@nestled/api'
```

### Platform-specific code

Use `.ios.tsx` / `.android.tsx` file extensions for platform-specific implementations.
Use `Platform.OS` conditionals only for minor variations — prefer separate files for significant differences.

### Mobile-only features

The following features exist only in `apps/mobileapp` and must not be added to shared packages unless they are clearly cross-platform APIs:

- Camera API (barcode scan, photo capture, OCR)
- Push notifications
- Native OAuth (Google/Apple) flows
- Other device-only capabilities

### Development (host)

```bash
pnpm --filter @nestled/mobileapp start
```

### Production builds (host)

Use **EAS** from the app directory when profiles exist:

```bash
cd apps/mobileapp
eas build --platform ios --profile production               # iOS build
eas build --platform android --profile production           # Android build
eas submit --platform ios                                   # submit to App Store
eas submit --platform android                               # submit to Google Play
```

### EAS build profiles

When `apps/mobileapp/eas.json` exists, typical profiles are `development`, `staging`, and `production` (adjust to what is checked in).
