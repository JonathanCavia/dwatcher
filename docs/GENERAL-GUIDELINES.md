# dwatcher — General Development Guidelines

## 1. Where Commands Run

All commands run on the **host** machine. There is no Docker-based development environment for this project. Developers install tools locally and use pnpm workspace commands from the repository root.

### Root-Level Commands

```bash
pnpm install                          # Install all workspace dependencies
pnpm -r lint                          # Lint all workspaces
pnpm -r format                        # Check formatting in all workspaces
pnpm -r typecheck                     # Type-check all workspaces
pnpm -r test                          # Run tests in all workspaces
pnpm -r build                         # Build all workspaces that have a build step
```

### Workspace-Specific Commands (via pnpm --filter)

```bash
pnpm --filter @dwatcher/mobile start          # Start Expo dev server
pnpm --filter @dwatcher/mobile lint           # Lint mobile only
pnpm --filter @dwatcher/backend dev           # Start backend dev server
pnpm --filter @dwatcher/backend test          # Test backend only
pnpm --filter @dwatcher/audio build           # Build audio package
pnpm --filter @dwatcher/ml test               # Test ML package
```

### Mobile-Specific Commands (cd into apps/mobile)

```bash
cd apps/mobile
npx expo prebuild                    # Generate native android/ and ios/ directories
npx expo run:android                 # Build and run on Android device/emulator
npx expo install <package>           # Install Expo-compatible package
```

### Root Makefile

The root `Makefile` provides convenience wrappers:

```bash
make install                         # pnpm install
make lint                            # pnpm -r lint
make typecheck                       # pnpm -r typecheck
make test                            # pnpm -r test
make build                           # pnpm -r build
make clean                           # Remove node_modules and build artifacts
```

---

## 2. Dependency Management

### Adding Dependencies

**To the mobile app (Expo-compatible packages):**

```bash
cd apps/mobile && npx expo install <package>
```

For non-Expo packages that still work in an Expo dev-client:

```bash
pnpm --filter @dwatcher/mobile add <package>
```

**To the backend:**

```bash
pnpm --filter @dwatcher/backend add <package>
pnpm --filter @dwatcher/backend add -D <dev-package>
```

**To a shared package:**

```bash
pnpm --filter @dwatcher/audio add <package>
pnpm --filter @dwatcher/audio add -D <dev-package>
```

**To root (shared tooling):**

```bash
pnpm add -D <tool> -w
```

### After Dependency Changes

Always run `pnpm install` from the repository root after adding, removing, or updating any dependency, so that `pnpm-lock.yaml` is updated consistently:

```bash
pnpm install
```

### Internal Package Dependencies

Always use `workspace:*` when referencing other `@dwatcher/*` packages:

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

- **pnpm only.** Do not use npm or yarn for any operation.
- pnpm's strict dependency resolution prevents phantom dependencies (packages that work because of hoisting in npm/yarn but are not declared in `package.json`).

---

## 3. Coding Conventions

### TypeScript

- **Strict mode is mandatory** in every workspace. The root `tsconfig.base.json` enables `"strict": true`. No workspace overrides this.
- Use explicit types for function parameters and return types. Use type inference for local variables when the type is obvious.
- Prefer `interface` over `type` for object shapes. Use `type` for unions, intersections, and utility types.
- Use `const` assertions for literal types: `as const`.
- Avoid `any`. Use `unknown` when the type is genuinely not known, then narrow with type guards.

### Exports

- **Named exports** are the default for all modules. This enables better tree-shaking and IDE auto-completion.
- **Default exports** are used only for Expo Router route files, where Expo Router requires a default export:

```tsx
// app/monitoring.tsx — route file (thin re-export)
export { MonitoringScreen as default } from '../src/screens/MonitoringScreen';
```

### Styles

- Co-locate styles with components. Use `StyleSheet.create` in the same file for small components.
- For larger screens, extract styles to an adjacent `.styles.ts` file:

```
src/components/AudioMeter.tsx
src/components/AudioMeter.styles.ts
```

- Do not use inline styles except for truly dynamic values (e.g., animated values in `Animated.View`).
- Use the app's theme tokens for colors, spacing, and typography. Do not hard-code values.

### Shared Packages (No UI)

Packages under `packages/` contain **logic only** — no UI components, no JSX, no styles. UI belongs exclusively in `apps/mobile/src/components/` or `apps/mobile/src/screens/`.

Rationale:
- UI components tie the package to React Native, preventing reuse in non-React contexts (e.g., backend).
- UI components require native module access, which packages should not have.
- Separation keeps packages universally usable and testable in Node.js environments.

### File Naming

- **React components**: PascalCase (`AudioMeter.tsx`, `CameraView.tsx`)
- **Hooks**: camelCase, prefixed with `use` (`useAudioCapture.ts`, `useDetectionEvents.ts`)
- **Services**: camelCase (`audio-service.ts`, `event-dispatcher.ts`)
- **Stores**: camelCase, suffixed with `-store` (`session-store.ts`, `event-store.ts`)
- **Tests**: same as source file with `.test.` or `.spec.` suffix (`audio-service.test.ts`)
- **Types**: PascalCase for type definitions, camelCase for filenames (`bark-event.ts`)

### Platform-Specific Code

- Use `.android.ts` / `.android.tsx` and `.ios.ts` / `.ios.tsx` file extensions for platform-specific implementations.
- Use `Platform.OS` conditionals only for minor platform variations (one-liners).
- For significant platform differences, prefer separate files over conditionals. Metro bundler automatically picks the correct platform extension.

### Imports (Internal Packages)

Always import from a package's entry point, never from internal paths:

```typescript
// Correct
import { BarkEvent } from '@dwatcher/types';
import { computeMelSpectrogram } from '@dwatcher/audio';

// Incorrect
import { BarkEvent } from '@dwatcher/types/src/entities/bark-event';
import { computeMelSpectrogram } from '../../../packages/audio/src/features';
```

### Code Formatting

- **Prettier** is configured at the repo root for consistent formatting.
- Run `pnpm -r format` before committing.
- Configure your editor to format on save using the root `.prettierrc`.

---

## 4. Testing Expectations

### Test Runners

| Workspace | Test Runner | Testing Library |
|-----------|-------------|-----------------|
| `@dwatcher/mobile` | Jest | React Native Testing Library |
| `@dwatcher/backend` | Vitest | -- |
| `@dwatcher/audio` | Vitest | -- |
| `@dwatcher/ml` | Vitest | -- |

### Coverage Expectations

- **Overall**: 80% unit / 20% integration test split.
- **Unit tests**: Test individual functions, services, and utilities in isolation. Mock external dependencies and native modules.
- **Integration tests**: Test interactions between modules (e.g., audio service + event dispatcher, ML pipeline + post-processor).
- **E2E tests**: Optional, for critical user flows (monitoring session lifecycle).

### Mocking Guidelines

- **Mock native modules** (react-native-vision-camera, @siteed/expo-audio-studio, react-native-webrtc, expo-sqlite) with Jest mocks.
- **Do not mock your own code**. Test the actual implementations of `@dwatcher/audio`, `@dwatcher/ml`, and mobile services directly.
- **Mock external APIs** (backend requests, signaling server) to avoid network dependencies in tests.

### Test File Placement

Tests live alongside the source files they test:

```
packages/audio/src/features.ts
packages/audio/tests/features.test.ts

apps/mobile/src/services/audio-service.ts
apps/mobile/src/services/audio-service.test.ts

packages/ml/src/pipeline.ts
packages/ml/tests/pipeline.test.ts
```

### Running Tests

```bash
# All workspaces
pnpm -r test

# Single workspace
pnpm --filter @dwatcher/audio test

# Watch mode
pnpm --filter @dwatcher/audio test -- --watch
```

---

## 5. Git Conventions

### Conventional Commits

All commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description
```

**Types:**

| Type | Usage |
|------|-------|
| `feat` | New feature (minor version bump in semantic versioning) |
| `fix` | Bug fix (patch version bump) |
| `chore` | Maintenance tasks (build config, dependency updates, tooling) |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `style` | Formatting, linting, whitespace (not CSS style) |

**Scopes:**

| Scope | Usage |
|-------|-------|
| `mobile` | Changes to `apps/mobile/` |
| `backend` | Changes to `apps/backend/` |
| `audio` | Changes to `packages/audio/` |
| `ml` | Changes to `packages/ml/` |
| `types` | Changes to `packages/types/` |
| `config` | Changes to `packages/config/` |
| `shared` | Changes affecting multiple packages |
| `docs` | Documentation changes |
| `repo` | Root-level configuration (eslint, prettier, tsconfig, CI) |

**Examples:**

```
feat(mobile): add audio meter visualization to monitoring screen
fix(ml): correct mel-filterbank frequency range for YAMNet input
chore(backend): upgrade fastify to v5
docs(ml): document feature extraction pipeline
test(audio): add unit tests for PCM resampling
feat(shared): add DetectionResult type to types package
```

### Branch Naming

```
<type>/<scope>/<short-description>
```

Examples:
```
feat/mobile/bark-detection-ui
fix/ml/confidence-threshold-overflow
chore/repo/eslint-upgrade
```

### Pull Requests

- Every PR should address a single concern (feature, fix, refactor).
- PR description includes:
  - **Summary**: What the change does and why.
  - **Tasks**: Checklist of implementation steps.
  - **Notes**: Anything the reviewer should pay attention to.
- PRs are squash-merged into the main branch.

---

## 6. Plan Conventions

### Location

Implementation plans live in `docs/plans/`. Each plan is a markdown file named with the feature and date:

```
docs/plans/2026-06-24-audio-service-integration.md
docs/plans/2026-06-25-tflite-inference-pipeline.md
```

### Structure

Each plan follows a staged format:

```markdown
# Plan: Audio Service Integration

## Stage 1: Initialize @siteed/expo-audio-studio
- Add package via `npx expo install @siteed/expo-audio-studio`
- Create `AudioService` class with start/stop recording
- Wire foreground service notification
- Commit message: `feat(mobile): initialize expo-audio-studio with foreground service`

## Stage 2: PCM Buffer Processing
- Implement circular buffer in `AudioService`
- Wire `@dwatcher/audio` PCM utilities (resampling, normalization)
- Connect volume meter to Zustand store
- Commit message: `feat(mobile): implement PCM circular buffer and volume meter`

## Stage 3: Integration Testing
- Write integration tests for AudioService
- Test foreground service lifecycle
- Test buffer overflow handling
- Commit message: `test(mobile): add audio service integration tests`
```

### Process

1. Write or review the plan before starting implementation.
2. Implement stage by stage, committing after each stage with the specified message.
3. When all stages are complete, create a PR with the plan's summary, task list, and notes.

---

## 7. Code Review

Every pull request must be reviewed before merging. Reviewers check for:

### Correctness

- Does the code do what it claims to do?
- Are edge cases handled (empty states, errors, timeouts)?
- Are there race conditions or threading issues (especially in audio and ML code)?
- Does the code handle lifecycle events (app background/foreground, service restart)?

### TypeScript Strictness

- Are there any `any` types that should be `unknown`?
- Are type guards used where narrowing is needed?
- Are all function parameters and return types explicitly typed?
- Are null/undefined checks in place where types allow them?

### Test Coverage

- Are there tests for the new code?
- Do tests cover edge cases and error states?
- Are native modules properly mocked?
- Are integration tests included where multiple modules interact?

### Reuse

- Does the code duplicate logic that already exists in a shared package?
- Could the new functionality benefit from being in a shared package?
- Are platform-specific implementations properly isolated?

### Package Boundaries

- Are UI components still outside shared packages?
- Does `@dwatcher/types` import from any other internal package?
- Are environment variables passed in rather than read directly in packages?
- Are `workspace:*` references used for internal dependencies?

### Performance

- Is audio processing done off the main JavaScript thread?
- Are TFLite inference calls wrapped to avoid blocking the UI?
- Is the circular buffer thread-safe?
- Are expo-sqlite operations batched where possible?

---

## 8. Environment Variables

### Mobile App (apps/mobile)

- Client-accessible variables use the `EXPO_PUBLIC_` prefix (Expo convention for public env vars).
- Stored in `apps/mobile/.env.local` (not committed).
- Documented in `apps/mobile/.env.example` (committed, contains placeholder values).

```
# apps/mobile/.env.example
EXPO_PUBLIC_SIGNALING_URL=ws://localhost:8080
EXPO_PUBLIC_TURN_URL=turn:localhost:3478
EXPO_PUBLIC_TURN_USERNAME=your-username
EXPO_PUBLIC_TURN_CREDENTIAL=your-credential
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Backend (apps/backend)

- Server-side variables use `process.env` with Zod validation through `@dwatcher/config`.
- Stored in `apps/backend/.env.local` (not committed).
- Documented in `apps/backend/.env.example` (committed).

```
# apps/backend/.env.example
DATABASE_URL=postgresql://localhost:5432/dwatcher
SIGNALING_PORT=8080
API_PORT=4000
JWT_SECRET=your-jwt-secret
TURN_SECRET=your-turn-secret
```

### Shared Packages (packages/*)

- **Packages never read `process.env` directly.**
- Configuration values are passed into packages via function arguments or constructor parameters.
- Zod schemas in `@dwatcher/config` validate configuration objects at runtime.

```typescript
// Correct: values passed in
import { createSignalingConfig } from '@dwatcher/config';

const config = createSignalingConfig({
  signalingUrl: process.env.EXPO_PUBLIC_SIGNALING_URL,
});

// Incorrect: package reads process.env directly
const url = process.env.EXPO_PUBLIC_SIGNALING_URL; // ❌ Never in packages
```
