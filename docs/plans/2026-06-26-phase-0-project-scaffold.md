# Plan: Phase 0 — Project Scaffold for Android-Launchable Mobile App

## Context

The dwatcher repository has complete documentation (ARCHITECTURE.md, TECH-STACK.md, ROADMAP.md, etc.) and root config files (package.json, tsconfig.base.json, pnpm-workspace.yaml), but **zero source files exist on disk**. No `apps/` or `packages/` directories have been created. This plan scaffolds the entire monorepo so the Expo mobile app can be built and launched on Android.

The user is also **testing the `/implement-plan` command** itself — if agent calls fail, we pause, fix the error (with user approval), and resume.

## Target Outcome

`cd apps/mobile && npx expo run:android` launches the app on an Android device/emulator.

## Plan

### Stage 1 | Fix stale rule files to match dwatcher architecture
Update `.claude/rules/*.md` so they describe the actual dwatcher workspace layout (packages: config, types, audio, ml; apps: mobile, backend) instead of the nestled-ported structure (copy, hooks, utils, api, theme, webapp, mobileapp). The `@nestled/` → `@dwatcher/` scope rename was already done; this stage fixes the package names and directory paths.

- **Scope:** repo
- **Commit:** `fix(repo): align .claude/rules workspace layout with dwatcher architecture`
- **Files:** `.claude/rules/monorepo.md`, `.claude/rules/mobile.md`, `.claude/rules/dependencies.md`, `.claude/rules/typescript.md`, `.claude/rules/web.md`
- **Dependencies:** none
- **Verify:** Rules describe `@dwatcher/mobile` (not mobileapp), `@dwatcher/config`, `@dwatcher/types`, `@dwatcher/audio`, `@dwatcher/ml`

### Stage 2 | Create root infrastructure files
Create `.npmrc` (strict pnpm resolution), `Makefile` (wrapping pnpm commands), `.prettierrc`, and `.eslintrc.cjs`. Add devDependencies (typescript, eslint, prettier, @types/node) to root `package.json`.

- **Scope:** repo
- **Commit:** `chore(repo): add .npmrc, Makefile, Prettier, and ESLint config`
- **Files:** `.npmrc`, `Makefile`, `.prettierrc`, `.eslintrc.cjs`, `package.json`
- **Dependencies:** Stage 1
- **Verify:** `pnpm install` succeeds; `make lint` and `make typecheck` run without errors

### Stage 3 | Create @dwatcher/types (bottom of dependency graph)
No build step — ships source directly. Contains domain entities (Dog, Session, BarkEvent, AnxietyEvent, Snapshot), API request/response types, and enums (DetectionClass, SessionState, AlertLevel, AnxietyFactor, SignalMessageType). Barrel exports from `src/index.ts`.

- **Scope:** shared
- **Commit:** `feat(types): create @dwatcher/types with entities, API types, and enums`
- **Files:** `packages/types/package.json`, `packages/types/tsconfig.json`, `packages/types/src/index.ts`, `packages/types/src/entities/*.ts`, `packages/types/src/api/*.ts`, `packages/types/src/enums/*.ts`
- **Dependencies:** Stage 2
- **Verify:** `pnpm --filter @dwatcher/types typecheck` passes

### Stage 4 | Create @dwatcher/config
Zod schemas for runtime config validation. Exports `AppConfigSchema`, `SignalingConfigSchema`, and factory functions. Has a build step (`tsc`).

- **Scope:** shared
- **Commit:** `feat(config): create @dwatcher/config with Zod validation schemas`
- **Files:** `packages/config/package.json`, `packages/config/tsconfig.json`, `packages/config/src/index.ts`, `packages/config/src/schemas.ts`
- **Dependencies:** Stage 3
- **Verify:** `pnpm --filter @dwatcher/config typecheck` passes

### Stage 5 | Create @dwatcher/audio
Pure PCM/volume/feature/WAV utilities operating on raw buffers. No native modules. Includes `pcm.ts` (resample, normalize, int16ToFloat32), `volume.ts` (computeRms, computeDbfs, computePeakAmplitude), `features.ts` (computeMelSpectrogram stubs), `wav.ts` (encodeWav, decodeWav). Minimal vitest test for volume functions.

- **Scope:** shared
- **Commit:** `feat(audio): create @dwatcher/audio with PCM, volume, spectrogram, and WAV utilities`
- **Files:** `packages/audio/package.json`, `packages/audio/tsconfig.json`, `packages/audio/src/index.ts`, `packages/audio/src/pcm.ts`, `packages/audio/src/volume.ts`, `packages/audio/src/features.ts`, `packages/audio/src/wav.ts`, `packages/audio/tests/volume.test.ts`
- **Dependencies:** Stage 3
- **Verify:** `pnpm --filter @dwatcher/audio typecheck` and `pnpm --filter @dwatcher/audio test` pass

### Stage 6 | Create @dwatcher/ml (skeleton)
ML inference pipeline skeleton — function signatures match ARCHITECTURE.md. `inference.ts` (TFLiteModel interface, loadModel/runInference stubs), `postprocess.ts` (applySoftmax, getTopClass, isBarkEvent, computeAnxietyScore), `registry.ts` (ModelRegistry class), `pipeline.ts` (ClassificationPipeline). Depends on `@dwatcher/types` and `@dwatcher/audio`.

- **Scope:** shared
- **Commit:** `feat(ml): create @dwatcher/ml with pipeline, inference, and post-processing skeleton`
- **Files:** `packages/ml/package.json`, `packages/ml/tsconfig.json`, `packages/ml/src/index.ts`, `packages/ml/src/inference.ts`, `packages/ml/src/postprocess.ts`, `packages/ml/src/registry.ts`, `packages/ml/src/pipeline.ts`
- **Dependencies:** Stage 5
- **Verify:** `pnpm --filter @dwatcher/ml typecheck` passes

### Stage 7 | Create @dwatcher/mobile Expo dev-client app
The core deliverable. Full Expo dev-client Android app with Expo Router. Includes:
- `package.json` with Expo SDK 52 deps (expo, expo-router, react-native, etc.)
- `app.json` with Android config (permissions, adaptive icon)
- `babel.config.js`, `metro.config.js` (monorepo watchFolders for packages/)
- `tsconfig.json` extending root base
- `app/_layout.tsx` (Stack navigator)
- `app/index.tsx` (thin re-export of HomeScreen)
- `src/screens/HomeScreen.tsx` (title: "dwatcher", subtitle, start monitoring button)
- `.env.example` with `EXPO_PUBLIC_API_BASE_URL`

- **Scope:** mobile
- **Commit:** `feat(mobile): create Expo dev-client app with Expo Router scaffold`
- **Files:** `apps/mobile/package.json`, `apps/mobile/tsconfig.json`, `apps/mobile/app.json`, `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js`, `apps/mobile/.env.example`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/src/screens/HomeScreen.tsx`
- **Dependencies:** Stage 4, Stage 6
- **Verify:** `pnpm --filter @dwatcher/mobile typecheck` passes

### Stage 8 | Install dependencies and verify workspace integrity
Run `pnpm install` from repo root, then `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`. Fix any issues discovered.

- **Scope:** repo
- **Commit:** `chore(repo): install workspace deps and fix typecheck/lint/test issues`
- **Files:** (fixes only — no new files)
- **Dependencies:** Stage 7
- **Verify:** All three commands pass with zero errors

### Stage 9 | Verify Android build readiness
Run `npx expo prebuild --platform android` from `apps/mobile/` to generate `android/` directory. Verify native project structure exists. If Android SDK and device/emulator are available, run `npx expo run:android`.

- **Scope:** mobile
- **Commit:** `chore(mobile): verify Expo prebuild generates android/ successfully`
- **Files:** `apps/mobile/android/` (generated, gitignored)
- **Dependencies:** Stage 8
- **Verify:** `android/app/build.gradle` exists after prebuild

---

## Reused Patterns

- **pnpm workspace architecture** — `pnpm-workspace.yaml` already defines `apps/*` and `packages/*`
- **TypeScript strict mode** — `tsconfig.base.json` already enforces strict with path aliases
- **Expo Router thin re-export** — route files only re-export named screens (from docs/ARCHITECTURE.md:130)
- **Zustand store interfaces** — from docs/ARCHITECTURE.md:576-618
- **Domain entities and enums** — from docs/ARCHITECTURE.md:199-287
- **Zod config pattern** — from docs/ARCHITECTURE.md:170-184

## Trade-offs

| Decision | Alternative | Reason |
|---|---|---|
| Fix rules first (Stage 1) | Fix later | Agents read rules during implementation — stale names would mislead |
| Backend app excluded | Include backend | User wants mobile launchable first; backend is follow-up |
| ML is skeleton only | Full TFLite implementation | Native bindings require android/ directory (not available until Stage 9) |
| Expo SDK 52 | SDK 51 | Latest stable, supports New Architecture |

## Verification (End-to-End)

1. `pnpm install` from repo root — no errors
2. `pnpm -r typecheck` — all workspaces pass
3. `pnpm -r lint` — all workspaces pass
4. `pnpm -r test` — all workspace tests pass
5. `cd apps/mobile && npx expo prebuild --platform android` — generates `android/`
6. `cd apps/mobile && npx expo run:android` — app launches on device/emulator (if available)

---

## Review Fixes Applied

Post-implementation review found 5 blockers. Fixes applied:

| # | Blocker | Fix |
|---|---|---|
| 1 | Missing `<SafeAreaProvider>` in root layout | Wrapped `<Stack>` in `<SafeAreaProvider>` in `_layout.tsx` |
| 2 | Missing `expo-dev-client` dependency | Added `expo-dev-client` to mobile `package.json` |
| 3 | Metro `watchFolders` included entire monorepo (including `node_modules/`) | Scoped to `packages/` and `apps/` directories only |
| 4 | Multi-channel WAV decoding had broken frame iteration | Rewrote `decodeWav` with proper chunk scanning and frame-based extraction |
| 5 | `noEmit: false` override fragility | Verified correct — false alarm, override works as intended |

## Tests Added

- **pcm.test.ts** — 17 tests covering `resamplePcm` (upsample/downsample/same-rate/empty), `normalizePcm` (silent/normalized/unity), `int16ToFloat32` (max/zero/min), `alignToWindow` (exact/overlap/partial/empty)
- **wav.test.ts** — 10 tests covering round-trip encode/decode, non-RIFF rejection, non-WAVE rejection, non-PCM rejection, non-16-bit rejection, missing data chunk, varying sample values

Total: **35 tests** (8 volume + 17 pcm + 10 wav), all passing.

## Dockerization

### Approach
- **Expo runs on the HOST**, not in Docker. Android emulators require KVM which is unavailable inside containers on macOS. The Metro bundler must be reachable from the emulator via `10.0.2.2` (Android emulator's host loopback).
- **Backend services** (Node.js API, PostgreSQL, pgAdmin, Coturn TURN) run in Docker via `docker-compose.yml`.
- **asdf** (`.tool-versions`) manages host-level runtimes: Node.js 24.15.0, pnpm 9.1.0, Java zulu-17.54.21.

### Docker Compose Services
```
docker compose up           # backend + postgres (core)
docker compose --profile tools up    # + pgAdmin
docker compose --profile webrtc up   # + Coturn TURN/STUN
```

Ports: backend (3000, 3001), PostgreSQL (5432), pgAdmin (5050), TURN (3478 tcp+udp)

### Why Expo NOT in Docker
1. **KVM requirement** — Android emulator needs hardware acceleration (KVM/HAXM), not available in macOS Docker
2. **ADB connectivity** — Metro ↔ emulator communication relies on `10.0.2.2:<port>` which is simpler host-side
3. **Fast Refresh latency** — File watching across Docker bind mounts adds latency and can miss events on macOS
4. **Port conflicts** — Expo uses 8081 (Metro), 19000 (CLI), 19001 (dev tools), 19002 (QR); exposing these from Docker adds complexity with no benefit

### CI Alternative
For CI builds, use **EAS Build** (`eas build --platform android`) instead of Docker-based Android builds.

## Makefile

Enhanced with Android-specific targets from the nestled project pattern:
- `make expo` — start Expo dev server
- `make expo-android` — build and run on connected device/emulator
- `make expo-android-dev` — prebuild + run (full dev cycle)
- `make expo-android-emulator` — launch dwatcher-dev AVD
- `make expo-android-all` — emulator + prebuild + run
- `make test-all` — lint + typecheck + format + test

Closes #0
