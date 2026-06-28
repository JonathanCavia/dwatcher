# User-Facing Roadmaps

User-facing roadmaps describe the product from the user's perspective: what the user can do, see, and achieve with dwatcher. They decompose the user experience into sequential stages, each with concrete tasks and verifiable tests.

## Index

| Code | Roadmap | Description |
|---|---|---|
| `U-MON` | [Monitoring Experience](./monitoring-experience.md) | Passive monitoring from the user's perspective: starting sessions, viewing real-time feed, reviewing summaries, browsing history |
| `U-AP` | [Anxiety Profile](./anxiety-profile.md) | Separation anxiety tracking: baseline establishment, behavior weight tuning, period comparison, trend visualization |
| `U-LS` | [Learning System](./learning-system.md) | Unified learning sessions: training exercises, behavioral education, difficulty tracking, progress measurement |

## How to Read a User-Facing Roadmap

Each roadmap follows this structure:

```
Stage U-XX-NN: Stage Title
  ├── Objetivo: What the user can achieve after this stage
  ├── Categoría: User-facing category tags
  ├── Dependencias: Technical stages this depends on
  └── Tareas:
      ├── Task U-XX-NN.1: Task description
      │   └── Tests: [Automático] / [Manual] verification steps
      ├── Task U-XX-NN.2: ...
      └── ...
```

## Relationship to Technical Roadmaps

User-facing stages depend on technical stages being complete. Each user-facing stage lists its technical dependencies explicitly using technical stage codes (e.g., `T-AM-02`). This ensures traceability from user experience down to implementation.

```
User-Facing                  Technical Foundation
────────────                 ────────────────────
U-MON (Monitoring)  ──────── T-PM, T-AM, T-VM, T-ML, T-DB
U-AP (Anxiety Profile) ───── T-PM, T-DB, T-AM, T-VM
U-LS (Learning System) ───── T-DB
```

## Categories

| Category | Description |
|---|---|
| `monitoreo` | Passive monitoring features — starting sessions, viewing detections, reviewing summaries |
| `adiestramiento` | Training exercises — obedience commands, skill tracking, progress measurement |
| `educacion` | Behavioral education — LAT, desensitization, absence exposure, boundary setting |
| `visualizacion` | Data presentation — charts, timelines, heatmaps, dashboards |
| `mediciones` | Metrics and indices — anxiety scores, period comparisons, statistical summaries |
| `configuracion` | Settings — dog profiles, behavior weights, notification preferences |
