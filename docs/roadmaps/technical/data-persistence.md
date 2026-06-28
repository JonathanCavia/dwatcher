# T-DB: Data Persistence (Technical)

The data persistence roadmap covers database schema design, migrations, repository implementations, and data access patterns for both local (SQLite on mobile) and remote (PostgreSQL on backend) storage.

> **Note:** This roadmap is a placeholder. Detailed stages will be defined as the data model from [T-PM: Passive Monitoring](./passive-monitoring.md) and the learning system solidify.

## Planned Stages

| Stage | Objective | Category |
|---|---|---|
| T-DB-01 | Schema de sesiones de monitoreo (SQLite + PostgreSQL) | `database-modelling` |
| T-DB-02 | Schema de eventos de detección unificados (audio, video, manual) | `database-modelling` |
| T-DB-03 | Schema de aprendizaje: goals, exercises, sessions, activities, repetitions, presets | `database-modelling` |
| T-DB-04 | Schema de perfil canino: dogs, identities, reference media, behavior weights | `database-modelling` |
| T-DB-05 | Sistema de migraciones (local y remoto) | `database-modelling` |
| T-DB-06 | Repository pattern con operaciones CRUD tipadas para cada entidad | `database-modelling` |
| T-DB-07 | Queries de agregación para analíticas (sesiones, eventos, progreso) | `database-modelling` |
| T-DB-08 | Sincronización local ↔ remoto (offline-first, conflict resolution) | `infrastructure` |

## Key Entities

```
sessions ──────── detection_events
  │
  └── dogs ─────── dog_identities
       │
       └── learning_sessions ─────── session_activities
                                        │
                                        └── activity_repetitions
                                             │
                                             └── difficulty_factors
```

## Dependencies

- T-DB depends on no other technical roadmaps (it's a leaf dependency)
- All other roadmaps depend on T-DB for persistence

## Referenced By

- [T-PM: Passive Monitoring](./passive-monitoring.md) — Session and event persistence
- [T-AM: Audio Monitoring](./audio-monitoring.md) — Detection event storage
- [T-VM: Video Monitoring](./video-monitoring.md) — Snapshot and identity storage
- [U-LS: Learning System](../user-facing/learning-system.md) — Learning data persistence
