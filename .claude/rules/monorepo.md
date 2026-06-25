## Monorepo Structure & Package Responsibilities

### Workspace layout

```
dwatcher/
├── packages/
│   ├── config/ → @dwatcher/config
│   ├── types/  → @dwatcher/types
│   ├── audio/  → @dwatcher/audio
│   └── ml/     → @dwatcher/ml
└── apps/
    ├── mobile/  → @dwatcher/mobile  (Expo SDK 54+, dev-client)
    └── backend/ → @dwatcher/backend (Node.js backend)
```

### Package responsibilities

- `@dwatcher/config` — shared env validation (Zod schemas), shared constants, configuration utilities. Never reads `process.env` directly — values are passed in.
- `@dwatcher/types` — shared TypeScript types and interfaces only. No runtime logic. No executable code. Domain entities (Dog, BarkEvent, Session, AnxietyEvent). API request/response contracts. Shared enums (DetectionClass, AlertLevel, SessionState). No build step.
- `@dwatcher/audio` — PCM buffer processing, WAV encoding/decoding, volume computation (RMS, dB), mel-spectrogram generation, audio utility functions.
- `@dwatcher/ml` — TFLite model loading, inference runner, model version registry, pre/post-processing pipelines, feature extraction helpers.
- `apps/*` — final applications. Never imported by other packages or apps.
- `packages/*` — reusable internal libraries. Avoid app-specific logic here.

### Store patterns (Zustand)

Zustand stores live in `apps/mobile/src/store/`. Key store domains:

- **Audio capture state** — recording status, sample rate, buffer queue, active microphone
- **Monitoring session state** — session lifecycle (idle, monitoring, error), session metadata, timestamps
- **Detection event state** — detected events queue, classification results, confidence scores, timestamps

When a store represents a small multi-field draft or handoff object, prefer exposing:

- one **combined setter** for the common atomic success path, and
- **separate setters / clear helpers** for each sub-state field when callers may update only one part later.

Do not rely on passing `undefined` for omitted fields in a combined setter as a way to "leave the old value alone". In Zustand, update only the keys you intentionally want to change.

### Naming

- All internal packages use the `@dwatcher/` scope.
- New packages go in `packages/`, new apps go in `apps/`.
- Package name must match its directory: `packages/foo` → `@dwatcher/foo`.

### Referencing internal packages

Always use `workspace:*` — never pin versions between internal packages:

```json
{
  "dependencies": {
    "@dwatcher/types": "workspace:*",
    "@dwatcher/config": "workspace:*"
  }
}
```

### New package checklist

When creating a new package under `packages/`:

1. Add `package.json` with `"name": "@dwatcher/<name>"` and `"private": true`
2. Add `tsconfig.json` extending the repo base config
3. Create `src/index.ts` as the primary entry point
4. Add scripts your package needs (`build`, `lint`, `typecheck`, `test`, etc.)
5. Run `pnpm install` from the repo root to refresh the workspace lockfile; restart the mobile dev server if it is running so it picks up the new graph
