## Dependency Management

### Package manager

This repo uses **pnpm** exclusively. Never use npm or yarn.

### Where dependency commands run

Use **host `pnpm` from the repo root** for the whole monorepo.

### Installing dependencies

```bash
# Refresh all workspace dependencies / lockfile
pnpm install

# Add to a specific workspace
pnpm --filter @dwatcher/mobile add react-native-vision-camera
pnpm --filter @dwatcher/backend add zod
pnpm --filter @dwatcher/mobile add -D @types/react

# Add tooling to the root (eslint, typescript, etc.)
pnpm add -D eslint -w
```

For Expo-managed mobile packages, prefer Expo's installer on the host:

```bash
cd apps/mobile && npx expo install <package>
```

After dependency changes, run `pnpm install` from the repo root so `pnpm-lock.yaml` matches; restart the mobile dev server if it is running.

### Common host commands

```bash
pnpm -r lint                          # lint all workspaces
pnpm -r typecheck                     # type-check all workspaces
pnpm -r test                          # run workspace tests
pnpm --filter @dwatcher/mobile build  # one-off production build
pnpm --filter @dwatcher/mobile start  # Expo dev server from repo root
pnpm --filter @dwatcher/backend build # build backend
pnpm --filter @dwatcher/backend dev   # start backend dev server
```

### Build order

Apps depend on packages; bump or build packages before relying on new exports in apps. Follow each workspace's `package.json` scripts when a package has a build step.

Note: `@dwatcher/types` requires no build — it ships source directly.

### Key mobile dependencies

| Package | Purpose |
|---------|---------|
| `react-native-vision-camera` | Camera preview + frame processing for ML |
| `@siteed/expo-audio-studio` | Raw PCM buffer access, foreground service, 16kHz/16-bit/mono recording |
| `react-native-webrtc` | WebRTC peer connections for audio streaming |
| `tflite-react-native` | On-device TFLite model inference |
| `expo-sqlite` | Local storage of detection events and sessions |
| `zustand` | State management for audio capture, monitoring sessions, detection events |

### Environment variables

- **Mobile** (`apps/mobile`): Use `EXPO_PUBLIC_*` prefix for all public env vars. Documented in `apps/mobile/.env.example`.
- **Backend** (`apps/backend`): Use Zod validation via `@dwatcher/config` to parse and validate environment variables at startup.
- Internal packages should avoid reading `process.env` directly for app-specific config — pass values from the app.

```ts
// ❌ Avoid in a reusable package
const url = process.env.EXPO_PUBLIC_SIGNALING_URL

// ✅ Prefer configuration passed in
export function createSignalingClient(config: { signalingUrl: string }) {
  /* ... */
}
```
