# Technical Roadmaps

Technical roadmaps describe the engineering work required to build dwatcher. They decompose features into sequential stages, each with concrete tasks and verifiable tests.

## Index

| Code | Roadmap | Description |
|---|---|---|
| `T-PM` | [Passive Monitoring](./passive-monitoring.md) | Overarching passive monitoring system: foreground service, session lifecycle, unified event system, and multimodal fusion |
| `T-AM` | [Audio Monitoring](./audio-monitoring.md) | Audio capture pipeline: recording, bark/howling/zoomies detection, play-vs-anxiety classification, audio-based dog identification |
| `T-VM` | [Video Monitoring](./video-monitoring.md) | Camera pipeline: camera access, dog presence recognition, individual dog identification, pose estimation, behavior classification |
| `T-ML` | [ML Pipeline](./ml-pipeline.md) | Model lifecycle: YAMNet fine-tuning, TFLite conversion, feature extraction, inference pipeline, multi-class classification |
| `T-DB` | [Data Persistence](./data-persistence.md) | Database schema design, migrations, repositories, local (SQLite) and remote (PostgreSQL) persistence |
| `T-BE` | [Backend Infrastructure](./backend-infrastructure.md) | REST API, WebSocket signaling, authentication, TURN deployment, cloud sync |

## How to Read a Technical Roadmap

Each roadmap follows this structure:

```
Stage T-XX-NN: Stage Title
  ├── Objetivo: What this stage achieves
  ├── Categoría: Technical category tags
  ├── Dependencias: Other stages this depends on
  └── Tareas:
      ├── Task T-XX-NN.1: Task description
      │   └── Tests: [Automático] / [Manual] verification steps
      ├── Task T-XX-NN.2: ...
      └── ...
```

## Dependency Graph

```
T-PM (Passive Monitoring) ─────────────────────────────┐
├── T-AM (Audio Monitoring) ────── T-ML (ML Pipeline)   │
├── T-VM (Video Monitoring) ────── T-ML (ML Pipeline)   │
├── T-DB (Data Persistence)                              │
└── T-BE (Backend Infrastructure)                        │
```

Audio and Video roadmaps both depend on the ML Pipeline for inference. Passive Monitoring ties them together with session management and multimodal fusion. Data Persistence and Backend Infrastructure support all other roadmaps.
