# dwatcher — Project Roadmap

## About This Document

**This file is the source of truth for the current state of the dwatcher project.** It defines what has been built, what is being built, what comes next, and what is intentionally deferred. Every other document in the repository should be consistent with the information here.

For detailed implementation stages — with concrete technical tasks, per-task tests (automatic and manual), and precise cross-references — see the structured roadmaps under [`docs/roadmaps/`](./roadmaps/):

| Directory | Content |
|---|---|
| [`roadmaps/technical/`](./roadmaps/technical/) | Implementation stages: audio, video, ML, database, backend |
| [`roadmaps/user-facing/`](./roadmaps/user-facing/) | Product experience stages: monitoring, anxiety profile, learning |

For the product vision, behavior catalog, and anxiety index definition, see [`docs/PRODUCT.md`](./PRODUCT.md).

---

## Current State

### ✅ Complete: Phase 0 — Project Scaffold

**Actual deliverables** (what was built vs what was planned):

| Planned | Delivered | Notes |
|---|---|---|
| Monorepo initialization (pnpm) | ✅ Done | `pnpm-workspace.yaml`, `.npmrc`, root `package.json` |
| 6 workspaces created | ✅ Done | `@dwatcher/mobile`, `backend`, `types`, `config`, `audio`, `ml` |
| TypeScript strict mode | ✅ Done | `tsconfig.base.json` with `strict: true`, extended by all workspaces |
| Code quality (ESLint, Prettier) | ✅ Done | `.eslintrc.cjs`, `.prettierrc` |
| CI pipeline (GitHub Actions) | ❌ Skipped | CI was not set up — deferred until first integration tests exist |
| Basic Expo mobile app | ✅ Done | Expo Router with HomeScreen, theme system, base UI components |
| Basic Node.js backend | ⚠️ Partial | Fastify scaffold exists; REST endpoints not yet implemented |
| Documentation | ✅ Done | 7 docs files in `docs/`, plus `.claude/rules/` for path-scoped conventions |

**What was built that wasn't in the original Phase 0 plan:**
- Theme system: `dwatcher` palette, spacing, radii, shadows, typography
- Base UI components: `ScreenShell`, `SideMenuOverlay`, `PrimaryButton`, `GhostButton`
- `ErrorBoundary` with dev logging, `LoadingState` component
- Zustand stores scaffolded: `session-store`, `event-store`, `settings-store`
- TanStack Query client provider
- Unified learning system types in `@dwatcher/types` (LearningGoal, Exercise, LearningSession, SessionActivity, ActivityRepetition, DifficultyFactor, DifficultyPreset, CommunicationMethod)
- Separation anxiety types in `@dwatcher/types` (AnxietyProfile, BehaviorWeight, PeriodComparison, SessionSummary)
- Claude Code agent definitions

### ✅ Complete: Phase 1 — Primera Sesión de Monitoreo (2026-06-28)

**Stages cubiertos:** T-PM-01 (parcial), T-DB-01 (storage alternativo), U-MON-01, U-MON-02.1 (parcial)

| Planned | Delivered | Notes |
|---|---|---|
| Foreground service + audio capture (`@siteed/expo-audio-studio`) | ⚠️ Stub | **Bloqueado por incompatibilidad de versiones** (ver abajo). AudioService usa metering simulado. |
| Session lifecycle (SQLite via `expo-sqlite`) | ⚠️ Alternativo | `expo-sqlite@56.x` es incompatible con Expo 54. Reemplazado por JSON file storage via `expo-file-system`. |
| MonitoringScreen con timer, audio meter, pause/resume/stop | ✅ Done | `MonitoringScreen.tsx` implementado con estado idle/monitoring/paused/ended |
| AudioMeter component | ✅ Done | Barra animada con dBFS simulado (verde/amarillo/rojo) |
| Zustand stores (session + audio) | ✅ Done | `session-store.ts` y `audio-store.ts` implementados |
| Session state machine | ✅ Done | `session-machine.ts` con transiciones validadas |
| HomeScreen "Start Monitoring" | ✅ Done | Botón funcional, navega a `/monitoring` |
| Session rehydration | ✅ Done | `_layout.tsx` restaura sesión activa del almacenamiento |
| Route `/monitoring` | ✅ Done | Thin re-export en `app/monitoring.tsx` |
| `@dwatcher/types` entry point | ✅ Done | Exports completos de learning + separation-anxiety types |
| `src/hooks/` directory | ✅ Done | Creado (vacío, listo para hooks futuros) |

**⚠️ Bloqueo técnico: expo-modules-core version incompatibility**

Expo SDK 54 usa `expo-modules-core@3.0.30`. Los paquetes del ecosistema Expo con versión `56.x` (`expo-audio`, `expo-av`, `expo-sqlite`, `expo-notifications`) están compilados contra `expo-modules-core@56.x`, que introduce la clase `AnyTypeCache`. Al incluir cualquier paquete `56.x`, la app crashea al inicio con `NoClassDefFoundError: expo/modules/kotlin/types/AnyTypeCache`.

`expo-modules-core@56.x` **no se puede usar** como reemplazo porque tiene incompatibilidades con React Native 0.81.5 (el de Expo 54): errores de compilación C++ (`EventQueue::UpdateMode`) y Kotlin (`Promise.reject`).

**Estrategia de mitigación aplicada:**
- `AudioService` → stub con metering simulado (sin dependencia nativa)
- `SessionRepository` → JSON via `expo-file-system` (`Paths.document`)
- Notificaciones → removidas (no necesarias sin servicio foreground real)
- Plugins nativos → solo `expo-router` + `expo-dev-client`

**Path forward para desbloquear:**
1. Esperar a que Expo SDK 56 sea estable → migrar todo el proyecto (recomendado a largo plazo)
2. Escribir un módulo nativo delgado para grabación PCM (evita dependencias del ecosistema)
3. Usar `expo-av@15.1.7` (última version pre-56.x) — requiere testear compatibilidad

### 🔄 In Progress

| Area | Current Work | Roadmap Reference |
|---|---|---|
| — | Ningún trabajo activo en este momento | — |

### 📋 Next Up

| Priority | Area | Roadmap | Blocker |
|---|---|---|---|
| 1 | Audio real (captura PCM + buffer circular) | [T-AM-01](./roadmaps/technical/audio-monitoring.md#stage-t-am-01-captura-de-audio-y-buffer-circular) | expo-modules-core 3.x vs 56.x |
| 1 | Servicio foreground Android | [T-PM-01](./roadmaps/technical/passive-monitoring.md#stage-t-pm-01-servicio-foreground-y-ciclo-de-vida-de-sesión) | expo-modules-core 3.x vs 56.x |
| 2 | Migrar SessionRepository a SQLite | [T-DB-01](./roadmaps/technical/data-persistence.md) | expo-modules-core 3.x vs 56.x |
| 2 | Learning goals + exercise catalog UI | [U-LS-01](./roadmaps/user-facing/learning-system.md#stage-u-ls-01-crear-y-gestionar-objetivos-de-aprendizaje) | — |
| 2 | Event timeline + local notifications | [T-PM-02](./roadmaps/technical/passive-monitoring.md#stage-t-pm-02-sistema-unificado-de-eventos-de-detección) | — |

---

## Development Priorities

### Two Parallel Tracks

Both tracks are **equally important** and can be developed in parallel. They share the database and type foundations.

```
Track A: Monitoreo Pasivo                    Track B: Sistema de Aprendizaje
────────────────────────                     ──────────────────────────────
Audio capture (T-AM-01)                     Learning goals catalog (U-LS-01)
  → Bark detection (T-AM-02)                  → Learning sessions CRUD (U-LS-02)
  → Multi-class vocalization (T-AM-03)        → Difficulty presets (U-LS-03)
  → Audio movement detection (T-AM-04)        → Progress visualization (U-LS-04)
  → Play vs anxiety (T-AM-05)
                                            Camera access (T-VM-01)
                                              → Dog presence (T-VM-02)
                                              → Dog identification (T-VM-03)
                                              → Pose estimation (T-VM-04)
                                              → Visual behavior (T-VM-05)

                    ↓                           ↓
            Shared: T-DB (Data Persistence)
            Shared: T-ML (ML Pipeline)
                    ↓                           ↓
            T-PM-03: Post-session computation
            U-AP: Anxiety Profile & Analytics
            U-LS-05: Learning ↔ Anxiety integration
```

### Priority Order Within Each Track

Track A stages within each pillar are sequential (T-AM-02 depends on T-AM-01, etc.). Track B stages are sequential. But Track A and Track B are independent of each other — they only converge at the analytics layer (U-AP, U-LS-05).

---

## Intentionally Deferred

The following features are explicitly documented but **not prioritized** for the current development phase. They are recorded here and in their respective roadmap files so they are not lost when priorities are re-evaluated.

| Feature | Where Documented | Rationale for Deferral |
|---|---|---|
| **WebRTC live streaming** | [T-BE-05, T-BE-06](./roadmaps/technical/backend-infrastructure.md) | Secondary feature; core monitoring + learning deliver more user value first |
| **TURN server deployment** | [T-BE-06](./roadmaps/technical/backend-infrastructure.md) | Only needed when live streaming is prioritized |
| **Web viewer dashboard** | [T-BE-10](./roadmaps/technical/backend-infrastructure.md) | Depends on WebRTC streaming |
| **Push notifications (remote)** | [T-BE-09](./roadmaps/technical/backend-infrastructure.md) | Requires backend infrastructure not yet built; local notifications are prioritized |
| **Multi-device support** | [T-BE](./roadmaps/technical/backend-infrastructure.md) | Single-device use case comes first |
| **iOS support** | — | Android-first development; iOS requires different foreground service, camera, and ML APIs |
| **Multi-dog household** | [T-PM-05](./roadmaps/technical/passive-monitoring.md#stage-t-pm-05-identificación-y-diferenciación-canina) | One dog per household is the starting assumption; differentiation is a future phase |
| **Treat dispenser integration** | — | Hardware integration; requires partnership and is far-future |
| **Veterinary insights API** | — | Requires backend infra + multi-user auth; far-future |
| **Predictive alerts** | — | Requires large dataset of anxiety patterns before ML prediction is viable |
| **Two-way audio** | — | Requires speaker access + echo cancellation; adds complexity without clear SA treatment benefit |
| **Native audio capture (PCM)** | [T-AM-01](./roadmaps/technical/audio-monitoring.md#stage-t-am-01-captura-de-audio-y-buffer-circular) | **Blocked by expo-modules-core 3.x vs 56.x incompatibility.** All Expo audio packages (expo-av 16.x, expo-audio 56.x) require expo-modules-core 56.x which is incompatible with Expo 54's React Native 0.81.5. Currently using stub AudioService with simulated metering. Resolution: migrate to Expo SDK 56 when stable, or build thin native module. |
| **SQLite persistence** | [T-DB-01](./roadmaps/technical/data-persistence.md) | **Blocked by same expo-modules-core incompatibility.** expo-sqlite 56.x requires expo-modules-core 56.x. Currently using JSON file storage via expo-file-system as temporary replacement. Path forward: migrate to expo-sqlite when expo-modules-core incompatibility is resolved. |
| **Local notifications** | [T-PM-02](./roadmaps/technical/passive-monitoring.md#stage-t-pm-02-sistema-unificado-de-eventos-de-detección) | **Blocked by same expo-modules-core incompatibility.** expo-notifications 56.x requires expo-modules-core 56.x. Local notifications are deferred until the incompatibility is resolved. |

### What Is NOT in Any Roadmap (Yet)

These are documented only here to prevent them from being forgotten:

- **Emotion estimation model** (multimodal audio + vision): mentioned in PRODUCT.md §2 but no technical investigation has started
- **Hardware integration** (treat dispensers, smart home): out of scope until core product is validated
- **Social/community features** (sharing progress with other dog owners): intentionally excluded — dwatcher is a measurement tool, not a social network

---

## Development Principles

1. **Parallel where possible.** Monitoring and learning tracks are independent and should be built concurrently.
2. **Test from the start.** Every stage in `docs/roadmaps/` includes tests. Prefer automatic; describe manual steps explicitly when user input is required.
3. **Source of truth is here.** When a plan changes, this document and the relevant roadmap are updated in the same commit. Code and docs must never diverge.
4. **Deferred means documented.** Everything intentionally left out has a record of what it is, where it's documented, and why it's deferred — so it can be picked up or re-prioritized without rediscovery.
5. **Record actuals, not plans.** When implementation differs from the roadmap, the roadmap is updated to reflect what was actually built. The git history preserves the original plan.

---

## How to Use This Document

- **To understand what's built**: read "Current State" above
- **To know what to work on next**: read "Next Up" and the parallel tracks
- **To find detailed implementation steps**: follow the roadmap references to `docs/roadmaps/`
- **To understand why something isn't built**: read "Intentionally Deferred"
- **To propose a priority change**: update this file and the relevant roadmaps in the same PR
- **To verify consistency**: cross-check PRODUCT.md vision, roadmaps/stages, and this file — they should all agree

## Related Documents

| Document | Purpose |
|---|---|
| [`PRODUCT.md`](./PRODUCT.md) | Product vision, three pillars, behavior catalog, anxiety index formula |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System architecture, package responsibilities, data flow |
| [`ML-PIPELINE.md`](./ML-PIPELINE.md) | ML model details, training pipeline, dataset info |
| [`TECH-STACK.md`](./TECH-STACK.md) | Technology decisions with rationale |
| [`roadmaps/README.md`](./roadmaps/README.md) | Roadmap system overview: coding scheme, categories, cross-referencing |
| [`roadmaps/technical/`](./roadmaps/technical/) | Technical implementation stages with tasks and tests |
| [`roadmaps/user-facing/`](./roadmaps/user-facing/) | Product experience stages with tasks and tests |
