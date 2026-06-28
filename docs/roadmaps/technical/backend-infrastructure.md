# T-BE: Backend Infrastructure (Technical)

The backend infrastructure roadmap covers the server-side components: REST API, WebSocket signaling for WebRTC, JWT authentication, TURN server deployment, database setup, and optional cloud sync.

> **Note:** This roadmap is a placeholder. Detailed stages will be defined based on [ARCHITECTURE.md](../../ARCHITECTURE.md) and the specific backend requirements from the monitoring and streaming systems.
>
> **Priority note:** Stages T-BE-05 through T-BE-10 (WebRTC streaming, TURN, web dashboard, push notifications, cloud sync) are **intentionally deferred** — see [`ROADMAP.md`](../../ROADMAP.md#intentionally-deferred). The current focus is on-device functionality (local SQLite, on-device ML, local notifications). Backend work is limited to the REST API needed for future sync.

## Planned Stages

### Active Priority

| Stage | Objective | Category |
|---|---|---|
| T-BE-01 | Fastify/Express server con health endpoint y error handling | `infrastructure` |
| T-BE-02 | REST API para sesiones: CRUD + listado con paginación | `infrastructure` |
| T-BE-03 | REST API para eventos: recepción y consulta de detection events | `infrastructure` |
| T-BE-04 | JWT authentication middleware para todas las rutas | `infrastructure` |
| T-BE-07 | REST API para perros: CRUD de perfiles caninos | `infrastructure` |
| T-BE-08 | REST API para analíticas: agregaciones diarias, semanales, comparación de períodos | `infrastructure` |

### Intentionally Deferred

These stages are documented here so they are not lost. They will be detailed and prioritized when the core monitoring + learning product is stable. See [`ROADMAP.md`](../../ROADMAP.md#intentionally-deferred) for rationale.

| Stage | Objective | Category |
|---|---|---|
| T-BE-05 | WebSocket signaling server para WebRTC (rooms, offer/answer/candidate relay) | `infrastructure` |
| T-BE-06 | TURN server (Coturn) deployment y credential management | `infrastructure` |
| T-BE-09 | Cloud sync: sincronización offline-first entre SQLite local y PostgreSQL remoto | `infrastructure` |
| T-BE-10 | Web dashboard: visor WebRTC + timeline de eventos en tiempo real | `infrastructure` |
| T-BE-11 | Push notifications (remote): FCM/Expo Push, event-driven, quiet hours | `infrastructure` |
| T-BE-12 | Multi-device management: register, associate, switch between devices | `infrastructure` |

## Dependencies

- T-BE depends on T-DB (database schemas define the API contracts)
- T-PM, T-AM, T-VM may depend on T-BE for remote features (sync, streaming)

## Referenced By

- [T-PM: Passive Monitoring](./passive-monitoring.md) — Backend session API
- [ROADMAP.md](../../ROADMAP.md) — Current priorities and deferred features
