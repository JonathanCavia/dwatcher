# T-BE: Backend Infrastructure (Technical)

The backend infrastructure roadmap covers the server-side components: REST API, WebSocket signaling for WebRTC, JWT authentication, TURN server deployment, database setup, and optional cloud sync.

> **Note:** This roadmap is a placeholder. Detailed stages will be defined based on [ARCHITECTURE.md](../../ARCHITECTURE.md) and the specific backend requirements from the monitoring and streaming systems.

## Planned Stages

| Stage | Objective | Category |
|---|---|---|
| T-BE-01 | Fastify/Express server con health endpoint y error handling | `infrastructure` |
| T-BE-02 | REST API para sesiones: CRUD + listado con paginación | `infrastructure` |
| T-BE-03 | REST API para eventos: recepción y consulta de detection events | `infrastructure` |
| T-BE-04 | JWT authentication middleware para todas las rutas | `infrastructure` |
| T-BE-05 | WebSocket signaling server para WebRTC (rooms, offer/answer/candidate relay) | `infrastructure` |
| T-BE-06 | TURN server (Coturn) deployment y credential management | `infrastructure` |
| T-BE-07 | REST API para perros: CRUD de perfiles caninos | `infrastructure` |
| T-BE-08 | REST API para analíticas: agregaciones diarias, semanales, comparación de períodos | `infrastructure` |
| T-BE-09 | Cloud sync: sincronización offline-first entre SQLite local y PostgreSQL remoto | `infrastructure` |
| T-BE-10 | Web dashboard: visor WebRTC + timeline de eventos en tiempo real | `infrastructure` |

## Dependencies

- T-BE depends on T-DB (database schemas define the API contracts)
- T-PM, T-AM, T-VM may depend on T-BE for remote features (sync, streaming)

## Referenced By

- [T-PM: Passive Monitoring](./passive-monitoring.md) — Backend session API
- [U-MON: Monitoring Experience](../user-facing/monitoring-experience.md) — Remote streaming features
