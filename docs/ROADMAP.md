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

### 🔄 In Progress

| Area | Current Work | Roadmap Reference |
|---|---|---|
| Mobile skeleton | Error boundary, splash screen lifecycle, HomeScreen placeholders | — |
| Expo prebuild | `android/` output committed, metro config stabilized for SDK 54 | — |
| Type system | Shared types for learning + anxiety entities defined | [T-DB](./roadmaps/technical/data-persistence.md) |

### 📋 Next Up

| Priority | Area | Roadmap |
|---|---|---|
| 1 | Foreground service + audio capture | [T-PM-01](./roadmaps/technical/passive-monitoring.md#stage-t-pm-01-servicio-foreground-y-ciclo-de-vida-de-sesión) |
| 1 | Session lifecycle (SQLite persistence) | [T-PM-01](./roadmaps/technical/passive-monitoring.md#stage-t-pm-01-servicio-foreground-y-ciclo-de-vida-de-sesión) |
| 2 | Audio meter and monitoring UI | [U-MON-01](./roadmaps/user-facing/monitoring-experience.md#stage-u-mon-01-iniciar-y-detener-una-sesión-de-monitoreo) |
| 2 | Learning goals + exercise catalog UI | [U-LS-01](./roadmaps/user-facing/learning-system.md#stage-u-ls-01-crear-y-gestionar-objetivos-de-aprendizaje) |

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
