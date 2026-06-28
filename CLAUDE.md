# dwatcher — Agent Instructions

## Project Overview

**dwatcher** (Dog Watcher) is an Android mobile app for canine surveillance and behavior monitoring. It turns an Android phone into a dedicated dog-watching device: capturing audio and video through built-in sensors, performing on-device ML inference for bark detection and anxiety classification, streaming live feeds via WebRTC, and logging events for behavior analysis.

This is a **pnpm monorepo** located at `/Users/jon4/Desktop/hwatcher` with 2 apps and 4 packages.

## Quick Reference Commands

| Command                                  | Purpose                                     |
| ---------------------------------------- | ------------------------------------------- |
| `pnpm install`                           | Install all workspace dependencies          |
| `pnpm -r typecheck`                      | Type-check all workspaces                   |
| `pnpm -r lint`                           | Lint all workspaces                         |
| `pnpm -r test`                           | Run tests in all workspaces                 |
| `pnpm -r build`                          | Build all workspaces with a build step      |
| `pnpm --filter @dwatcher/mobile start`   | Start Expo dev server                       |
| `cd apps/mobile && npx expo run:android` | Build and launch on Android device/emulator |
| `pnpm --filter @dwatcher/backend dev`    | Start backend dev server                    |

Makefile wrappers also available: `make install`, `make lint`, `make typecheck`, `make test`, `make build`, `make clean`.

## Architecture

```presentation
dwatcher/
├── apps/
│   ├── mobile/        @dwatcher/mobile  — Expo dev-client Android app (Expo Router)
│   └── backend/       @dwatcher/backend — Node.js backend (REST + WebSocket signaling)
└── packages/
    ├── config/        @dwatcher/config  — Zod schemas for env validation
    ├── types/         @dwatcher/types   — Shared TypeScript types (no build step)
    ├── audio/         @dwatcher/audio   — PCM, volume, mel-spectrogram, WAV utilities
    └── ml/            @dwatcher/ml      — TFLite inference pipeline for bark/behavior detection
```

See `docs/ARCHITECTURE.md` for the full system architecture.

## Path-Scoped Rules

The following `.claude/rules/*.md` files apply to specific paths in the repo:

| Path                         | Applies                          |
| ---------------------------- | -------------------------------- |
| `apps/mobile/**`             | `mobile.md`                      |
| `packages/types/**`          | `typescript.md`                  |
| `packages/*/**`, `apps/*/**` | `dependencies.md`, `monorepo.md` |

## Key Technical Decisions

- **Expo dev-client** (NOT managed workflow) — required for native modules (foreground service, TFLite, WebRTC). Prebuild generates `android/` from config plugins.
- **Android-first development** — iOS support not planned at this stage.
- **On-device ML** via YAMNet + TensorFlow Lite models. No cloud inference. Pipeline: audio features → TFLite → softmax + thresholding + cooldown.
- **WebRTC** for live audio/video streaming via peer-to-peer connections with a signaling server.
- **Foreground service** for persistent audio monitoring using `@siteed/expo-audio-studio`, even when the app is backgrounded.
- **react-native-vision-camera** for camera capture and frame processing (future on-video ML for motion/pacing detection).

## Documentation Index

| File                         | Content                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `docs/PRODUCT.md`            | Product vision, three pillars, behavior catalog, anxiety index |
| `docs/ARCHITECTURE.md`       | Full system architecture, package responsibilities, data flow |
| `docs/GENERAL-GUIDELINES.md` | Development conventions, command reference, coding standards  |
| `docs/SETUP-REFERENCE.md`    | Prerequisites, environment setup, build instructions          |
| `docs/TECH-STACK.md`         | Technology decisions with rationale and trade-offs            |
| `docs/ROADMAP.md`            | **Source of truth** — current state, priorities, direction, deferred features |
| `docs/roadmaps/`             | Structured roadmaps (technical + user-facing) with stages, tasks, and tests |
| `docs/ML-PIPELINE.md`        | ML model details, training pipeline, and dataset info         |

## Workflow

This project follows **Specification-Driven Development (SDD)**:

- Use `/implement-feature` to scaffold new features from a spec.
- Feature plans go in `docs/plans/`.
- Commit messages follow conventional commits: `type(scope): description`
  - Scopes: `mobile`, `backend`, `shared`, `docs`, `repo`
  - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

## Source of Truth

**`docs/ROADMAP.md` is the authoritative source of truth for the current project state.** It defines what is built, in progress, next, and intentionally deferred. When any implementation differs from what ROADMAP.md says, update ROADMAP.md in the same commit. Code, other docs, and roadmaps must be consistent with ROADMAP.md.

- Before starting work on a feature, check ROADMAP.md for current state and priorities.
- Before marking work as complete, check if ROADMAP.md needs to be updated.
- When in doubt about whether a feature is in scope, consult ROADMAP.md's "Intentionally Deferred" section.
- The `docs/roadmaps/` directory contains detailed implementation stages referenced by ROADMAP.md.

## Important Constraints

- `@dwatcher/types` has **no build step** — ships source directly. `package.json` points to `./src/index.ts` for both `main` and `types`.
- **No UI in shared packages** — `packages/` contain logic only (config, types, audio, ml). UI components belong in the consuming app.
- **Packages never read `process.env` directly** — configuration values are passed in from the app layer.
- **`workspace:*` for all internal dependencies** — never pin versions between internal packages.
- **pnpm only** — never use npm or yarn for any command.
- **TypeScript strict mode** enabled everywhere via `tsconfig.base.json`. Do not disable.
- **`@dwatcher/types` depends on nothing internal** — it is the bottom of the dependency graph.
