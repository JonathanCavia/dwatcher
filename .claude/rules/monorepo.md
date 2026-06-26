## Monorepo Structure & Package Responsibilities

### Workspace layout

```
dwatcher/
├── packages/
│   ├── config/     → @dwatcher/config  — Zod schemas for runtime env/config validation
│   ├── types/      → @dwatcher/types   — Shared TypeScript types and enums (no build)
│   ├── audio/      → @dwatcher/audio   — PCM, volume, mel-spectrogram, WAV utilities
│   └── ml/         → @dwatcher/ml      — TFLite inference pipeline (bark/behavior detection)
└── apps/
    ├── mobile/     → @dwatcher/mobile  — Expo dev-client Android app (Expo Router)
    └── backend/    → @dwatcher/backend  — Node.js backend (REST + WebSocket signaling)
```

### Package responsibilities

- `@dwatcher/config` — Zod schemas for env validation. Never reads `process.env` directly.
- `@dwatcher/types` — shared TypeScript types and interfaces only. No runtime logic. No executable code. No build step.
- `@dwatcher/audio` — pure PCM/volume/feature/WAV utilities operating on raw buffers. No native modules.
- `@dwatcher/ml` — TFLite inference pipeline skeleton. Depends on `@dwatcher/types` and `@dwatcher/audio`.
- `apps/*` — final applications. Never imported by other packages or apps.
- `packages/*` — reusable internal libraries. No UI components in shared packages.

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
    "@dwatcher/audio": "workspace:*"
  }
}
```

### New package checklist

When creating a new package under `packages/`:

1. Add `package.json` with `"name": "@dwatcher/<name>"` and `"private": true`
2. Add `tsconfig.json` extending the repo base config
3. Create `src/index.ts` as the primary entry point
4. Add scripts your package needs (`build`, `lint`, `typecheck`, `test`, etc.)
5. Run `make install` from the repo root on the host to refresh the workspace lockfile
