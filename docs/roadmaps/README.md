# dwatcher — Roadmaps

This directory contains the structured roadmap documentation for the dwatcher project. Roadmaps are split into two perspectives:

| Directory | Purpose |
|---|---|
| [`technical/`](./technical/) | Technical features, infrastructure, and implementation stages — what needs to be built and how |
| [`user-facing/`](./user-facing/) | Product features from the user's perspective — what the user can do and experience |

> **Source of truth:** [`docs/ROADMAP.md`](../ROADMAP.md) defines the current project state, development priorities, and intentionally deferred features. These roadmaps are the detailed breakdown — always consistent with ROADMAP.md.

## How Roadmaps Work

Each roadmap document describes a feature or system decomposed into **stages**. Stages are numbered, sequential blocks of work. Each stage contains:

- **A concrete objective** — what the stage achieves, in user-verifiable terms
- **A category tag** — for filtering and cross-referencing
- **A list of technical tasks** — the implementation work
- **A list of tests per task** — verification criteria (automatic when possible, manual when user input is required)

## Coding Scheme

Every stage has a unique code that can be referenced from any other document:

### Technical Codes

```
T-{ABBREVIATION}-{STAGE_NUM}
```

| Prefix | Roadmap | File |
|---|---|---|
| `T-PM` | Passive Monitoring (overarching) | `technical/passive-monitoring.md` |
| `T-AM` | Audio Monitoring | `technical/audio-monitoring.md` |
| `T-VM` | Video Monitoring | `technical/video-monitoring.md` |
| `T-ML` | ML Pipeline | `technical/ml-pipeline.md` |
| `T-DB` | Database Modelling | `technical/data-persistence.md` |
| `T-BE` | Backend Infrastructure | `technical/backend-infrastructure.md` |

### User-Facing Codes

```
U-{ABBREVIATION}-{STAGE_NUM}
```

| Prefix | Roadmap | File |
|---|---|---|
| `U-MON` | Monitoring Experience | `user-facing/monitoring-experience.md` |
| `U-AP` | Anxiety Profile | `user-facing/anxiety-profile.md` |
| `U-LS` | Learning System | `user-facing/learning-system.md` |

## Cross-Referencing

Stages can depend on other stages. When they do, the dependency is listed explicitly using the stage code:

```markdown
**Dependencias:** T-AM-01 (captura de audio funcionando), T-DB-01 (schema de sesiones)
```

This makes it possible to trace the full dependency graph of any feature — from user-facing experience down to the technical foundations.

## Categories

### Technical Categories

| Category | Description |
|---|---|
| `audio` | Audio capture, processing, feature extraction |
| `vision` | Camera, frame processing, pose estimation |
| `behavior-detection` | ML inference for behavior classification |
| `ml-pipeline` | Model training, conversion, deployment, inference |
| `dog-recognition` | Individual dog identification and differentiation |
| `database-modelling` | Schema design, migrations, repositories |
| `frontend-design` | UI components, screens, navigation |
| `infrastructure` | Servers, signaling, deployment, CI/CD |
| `statistics-visualization` | Charts, analytics, data presentation |

### User-Facing Categories

| Category | Description |
|---|---|
| `monitoreo` | Passive monitoring features |
| `adiestramiento` | Training exercises and tracking |
| `educacion` | Behavioral education (LAT, desensitization, etc.) |
| `visualizacion` | Charts, trends, data presentation |
| `mediciones` | Metrics, indices, quantitative comparisons |
| `configuracion` | Settings, preferences, customization |

## Tests Convention

Tests are listed per task and tagged:

- **`[Automático]`** — Can be run by the test suite without user intervention. Mocking should be minimized.
- **`[Manual]`** — Requires user action (e.g., recording a video, uploading a file). The exact steps the user must perform are described explicitly.

## Related Documents

- [Product Vision](../PRODUCT.md) — What dwatcher is and why it exists
- [Architecture](../ARCHITECTURE.md) — System design and data flow
- [Original Roadmap](../ROADMAP.md) — Phase-based development plan (broader strokes)
