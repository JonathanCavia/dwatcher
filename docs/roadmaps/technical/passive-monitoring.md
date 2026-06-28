# T-PM: Passive Monitoring (Technical)

Passive monitoring is the core of dwatcher: the unattended recording and analysis of a dog left alone at home. This roadmap defines the overarching technical system that integrates audio monitoring, video monitoring, session management, and multimodal behavior detection.

This roadmap has two sub-pillars with their own detailed roadmaps:
- **[T-AM: Audio Monitoring](./audio-monitoring.md)** — Audio capture, vocalization detection, and audio-based behavior classification
- **[T-VM: Video Monitoring](./video-monitoring.md)** — Camera pipeline, dog recognition, pose estimation, and visual behavior classification

Stages in this roadmap focus on cross-cutting concerns: the foreground service, session lifecycle, unified event system, and multimodal fusion.

---

## Stage T-PM-01: Servicio Foreground y Ciclo de Vida de Sesión

**Objetivo:** El teléfono puede grabar audio de forma desatendida mediante un servicio foreground de Android, con sesiones que persisten en base de datos local y sobreviven reinicios de la app.

**Categoría:** `infrastructure`, `database-modelling`

**Dependencias:** Ninguna.

### Tareas

#### T-PM-01.1: Integrar `@siteed/expo-audio-studio` con servicio foreground

- [ ] Instalar y configurar `@siteed/expo-audio-studio` en `@dwatcher/mobile`
- [ ] Configurar notificación de servicio foreground con tipo `microphone`
- [ ] Implementar `AudioService`: `startMonitoring()`, `stopMonitoring()`, event emitter para datos PCM
- [ ] Manejar permisos de micrófono (solicitar en primer uso)
- [ ] Manejar ciclo de vida del servicio (start/stop en transiciones foreground/background)

**Tests:**
- **[Automático]** `AudioService` — `startMonitoring()` emite eventos PCM dentro de 500ms de inicio
- **[Automático]** `AudioService` — `stopMonitoring()` detiene el servicio foreground y limpia recursos
- **[Manual]** Iniciar monitoreo, poner la app en background, verificar que la notificación del servicio foreground sigue visible y el audio se sigue grabando

#### T-PM-01.2: Implementar schema de sesiones en SQLite

- [ ] Crear tabla `sessions` con columnas: `id`, `dog_id`, `started_at`, `ended_at`, `state`, `device_battery_level`
- [ ] Implementar `SessionRepository` con operaciones CRUD
- [ ] Implementar migración inicial de base de datos

**Tests:**
- **[Automático]** `SessionRepository` — Insertar sesión → recuperar por ID → datos coinciden
- **[Automático]** `SessionRepository` — Listar sesiones con paginación → orden correcto por `started_at DESC`
- **[Automático]** `SessionRepository` — Actualizar `state` y `ended_at` al finalizar sesión

#### T-PM-01.3: Implementar pantalla de monitoreo con controles de sesión

- [ ] `MonitoringScreen`: botones start / pause / resume / stop
- [ ] Máquina de estados de sesión: `idle → monitoring → paused → monitoring → stopped`
- [ ] Persistir cambios de estado en SQLite en cada transición
- [ ] Notificación de servicio foreground con botón de acción "Stop"

**Tests:**
- **[Automático]** State machine — Todas las transiciones válidas funcionan; transiciones inválidas lanzan error
- **[Manual]** Iniciar sesión → pausar → reanudar → detener. Verificar en SQLite que los timestamps y estados son correctos
- **[Manual]** Cerrar la app durante monitoreo → reabrir → la sesión sigue activa y se puede detener

---

## Stage T-PM-02: Sistema Unificado de Eventos de Detección

**Objetivo:** Todos los eventos de detección (audio, video, manuales) usan un modelo de datos unificado que persiste en SQLite, se consulta con filtros, y dispara notificaciones locales.

**Categoría:** `database-modelling`, `behavior-detection`

**Dependencias:** T-PM-01 (sesiones funcionando)

### Tareas

#### T-PM-02.1: Diseñar e implementar schema de eventos de detección

- [ ] Crear tabla `detection_events`:
  ```sql
  CREATE TABLE detection_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    detected_at TEXT NOT NULL,        -- ISO 8601
    event_type TEXT NOT NULL,          -- DetectionClass enum
    confidence REAL NOT NULL,
    duration_ms INTEGER,
    peak_amplitude REAL,
    source TEXT NOT NULL DEFAULT 'audio', -- 'audio' | 'video' | 'manual'
    snapshot_uri TEXT,
    metadata TEXT,                     -- JSON para datos específicos del canal
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
  ```
- [ ] Crear índices: `(session_id, detected_at)`, `(event_type, detected_at)`
- [ ] Implementar `EventRepository`: `insertEvent()`, `queryEvents(sessionId, type, from, to)`, `countByType(sessionId)`

**Tests:**
- **[Automático]** `EventRepository` — Insertar 50 eventos, consultar por tipo → resultados filtrados correctos
- **[Automático]** `EventRepository` — Insertar batch de 100 eventos → todos persisten sin errores
- **[Automático]** `EventRepository` — `countByType` retorna conteos correctos por `DetectionClass`

#### T-PM-02.2: Implementar sistema de notificaciones locales

- [ ] Configurar canal de notificación: "Bark Alerts", importancia alta
- [ ] Configurar canal de notificación: "Anxiety Alerts", importancia alta
- [ ] Agrupar notificaciones del mismo tipo en ventanas de 30 segundos
- [ ] Notificación incluye: tipo de evento, confianza, timestamp

**Tests:**
- **[Automático]** Notification service — Al recibir evento de tipo `bark` con confidence > threshold → notificación se encola
- **[Automático]** Notification service — Eventos del mismo tipo en ≤30s → se agrupan en una sola notificación
- **[Manual]** Iniciar sesión de monitoreo, reproducir audio de ladrido → verificar que la notificación aparece en el dispositivo

#### T-PM-02.3: Implementar timeline de eventos en tiempo real

- [ ] Componente `EventTimeline`: lista scrollable de detecciones recientes con icono de tipo, timestamp, badge de confianza
- [ ] Componente `BarkCounter`: contador total de sesión, tasa por minuto, intervalo pico
- [ ] Actualizar `MonitoringScreen` con timeline y contadores debajo del medidor de audio

**Tests:**
- **[Automático]** `EventTimeline` — Renderiza 20 eventos correctamente con iconos y timestamps
- **[Automático]** `BarkCounter` — Calcula tasa por minuto correctamente dado un conjunto de eventos
- **[Manual]** Durante una sesión, verificar que nuevos eventos aparecen en la timeline en tiempo real

---

## Stage T-PM-03: Cómputo y Resumen Post-Sesión

**Objetivo:** Al finalizar una sesión de monitoreo, el sistema calcula automáticamente métricas agregadas y presenta un resumen estructurado al usuario.

**Categoría:** `statistics-visualization`, `behavior-detection`

**Dependencias:** T-PM-02 (eventos unificados), T-AM-02 (detección de ladridos)

### Tareas

#### T-PM-03.1: Implementar algoritmo de índice de ansiedad por sesión

- [ ] Implementar `computeAnxietyIndex(sessionId, behaviorWeights)`:
  ```
  anxietyIndex = Σ (w_i × f_i × s_i) × (60 / durationMinutes) × 100
  ```
  - `w_i` = peso del comportamiento (del perfil del perro)
  - `f_i` = frecuencia (eventos detectados / duración en horas)
  - `s_i` = factor de severidad (leve=0.5, moderado=0.75, severo=1.0)
- [ ] Normalizar para que sesiones de distinta duración sean comparables
- [ ] Calcular contribución por comportamiento (breakdown)

**Tests:**
- **[Automático]** `computeAnxietyIndex` — Sesión de 30min con 5 ladridos, pesos default → resultado coincide con cálculo manual
- **[Automático]** `computeAnxietyIndex` — Sesión de 60min con los mismos eventos → índice ≈50% del anterior (normalización por duración)
- **[Automático]** `computeAnxietyIndex` — Sesión sin eventos → índice = 0

#### T-PM-03.2: Implementar pantalla de resumen post-sesión

- [ ] `SessionSummaryScreen`: muestra duración, eventos totales, índice de ansiedad, breakdown por comportamiento
- [ ] Checklist de comportamientos manuales (micción, defecación, destrucción)
- [ ] Comparación contra línea base: "Compared to your baseline of 71, today scored 58 — 18% improvement"
- [ ] Navegación automática al detener sesión → resumen

**Tests:**
- **[Automático]** `SessionSummaryScreen` — Renderiza correctamente con datos de una sesión completada
- **[Manual]** Completar una sesión real → verificar que el resumen se muestra con datos correctos
- **[Manual]** Reportar comportamiento manual en el checklist → verificar que modifica el índice final

#### T-PM-03.3: Implementar queries de analíticas locales

- [ ] `AnalyticsRepository` con agregaciones SQL:
  - Frecuencia de eventos por hora/día/semana
  - Tendencias de índice de ansiedad en el tiempo
  - Distribución de actividad por hora del día
  - Estadísticas de duración de sesión
- [ ] Cacheo de resultados de queries frecuentes

**Tests:**
- **[Automático]** `AnalyticsRepository` — `getDailyStats(date)` retorna agregación correcta
- **[Automático]** `AnalyticsRepository` — `getWeeklyTrend(weekStart)` retorna 7 datos diarios
- **[Automático]** `AnalyticsRepository` — Sin datos para un día → retorna ceros, no error

---

## Stage T-PM-04: Fusión Multimodal (Audio + Video)

**Objetivo:** Combinar detecciones de audio y video para producir una clasificación de comportamiento más robusta, resolviendo ambigüedades que ningún canal puede resolver solo (ej: distinguir juego de ansiedad).

**Categoría:** `behavior-detection`, `vision`, `audio`

**Dependencias:** T-AM-05 (distinguir juego vs ansiedad en audio), T-VM-05 (clasificación de comportamiento por video), T-PM-02 (eventos unificados)

### Tareas

#### T-PM-04.1: Implementar sincronización temporal audio-video

- [ ] Compartir reloj de sesión entre pipelines de audio y video
- [ ] Cada evento de detección incluye `timestamp` de sesión común
- [ ] Algoritmo de matching: eventos de audio y video dentro de la misma ventana temporal (2s) se consideran correlacionados

**Tests:**
- **[Automático]** Time sync — Evento de audio y video generados simultáneamente → timestamps difieren en <100ms
- **[Automático]** Matching — Evento de audio en t=5.0s y evento de video en t=6.5s → matchean (dentro de ventana 2s)
- **[Automático]** Matching — Evento de audio en t=5.0s y evento de video en t=8.0s → no matchean

#### T-PM-04.2: Implementar motor de fusión multimodal

- [ ] `MultimodalFusion` class:
  - Recibe eventos de audio y video con timestamps
  - Aplica reglas de fusión:
    - Audio(ladrido) + Video(perro visible, boca abierta) → confidence boost +20%
    - Audio(ladrido) + Video(perro visible, jugando) → clasificar como `play_vocalization`, no `bark`
    - Audio(aullido) + Video(perro no visible) → mantener `howl`, es ansiedad
    - Video(zoomies) + Audio(silencio) → mantener `zoomies`, es ansiedad
    - Video(pacing) + Audio(quejido) → confidence boost mutuo +15%
  - Emite `FusedEvent` con fuente `multimodal`, confidence ajustada, y referencias a eventos origen

**Tests:**
- **[Automático]** Fusion — Audio(bark, 0.8) + Video(dog_visible_barking, 0.7) → FusedEvent(bark, confidence > 0.8)
- **[Automático]** Fusion — Audio(bark, 0.8) + Video(dog_playing, 0.7) → FusedEvent(play_vocalization)
- **[Automático]** Fusion — Audio(howl, 0.9) + sin evento de video → FusedEvent(howl, 0.9)
- **[Automático]** Fusion — Sin eventos → sin fused events

#### T-PM-04.3: Actualizar índice de ansiedad con eventos fusionados

- [ ] El índice de ansiedad usa `FusedEvent` en lugar de eventos crudos cuando existen
- [ ] Eventos no fusionados (de un solo canal) siguen contribuyendo con su peso original
- [ ] Métricas de comparación: tracking de cuántos eventos fueron fusionados vs sin fusionar

**Tests:**
- **[Automático]** Anxiety index — Mismos eventos crudos, con y sin fusión → índices coherentes (la fusión no rompe el cálculo)
- **[Automático]** Fusion rate — Sesión con audio y video → ≥50% de eventos audio son fusionados con video

---

## Stage T-PM-05: Identificación y Diferenciación Canina

**Objetivo:** En hogares multi-perro, el sistema puede identificar qué perro específico generó cada evento de detección, permitiendo perfiles de ansiedad individuales.

**Categoría:** `dog-recognition`

**Dependencias:** T-VM-03 (identificar perro individual por video), T-AM-06 (huella de ladrido por audio)

### Tareas

#### T-PM-05.1: Implementar sistema de identidad canina

- [ ] Entidad `DogIdentity` en base de datos: `id`, `name`, `reference_photos[]`, `reference_audio_samples[]`
- [ ] Cada evento de detección puede tener `dog_id` opcional (null = perro no identificado)
- [ ] Pipeline de identificación: video recognition → si confianza > threshold, asignar `dog_id`; si no, intentar audio fingerprint → si confianza > threshold, asignar `dog_id`

**Tests:**
- **[Automático]** `DogIdentity` — CRUD completo de identidad canina con fotos y samples de referencia
- **[Manual]** Grabar video de referencia de dos perros distintos → verificar que el sistema asigna `dog_id` correcto a eventos de cada perro

#### T-PM-05.2: Adaptar perfil de ansiedad para multi-perro

- [ ] Índice de ansiedad se calcula por perro, no por sesión global
- [ ] Pantalla de comparación permite seleccionar perro
- [ ] Eventos sin `dog_id` se asignan a "Unknown" y se muestran aparte

**Tests:**
- **[Automático]** Multi-dog anxiety — Sesión con eventos de 2 perros → índices separados por `dog_id`
- **[Automático]** Unknown events — Eventos sin `dog_id` no rompen el cálculo y se reportan como "unassigned"

---

## Dependency Reference

| This Stage | Depends On | Description |
|---|---|---|
| T-PM-01 | — | Foundation: foreground service, session persistence |
| T-PM-02 | T-PM-01 | Unified event system |
| T-PM-03 | T-PM-02, T-AM-02 | Post-session computation |
| T-PM-04 | T-AM-05, T-VM-05, T-PM-02 | Multimodal fusion |
| T-PM-05 | T-VM-03, T-AM-06 | Dog identification |

## Referenced Roadmaps

- [T-AM: Audio Monitoring](./audio-monitoring.md) — Sub-pillar: audio capture and analysis
- [T-VM: Video Monitoring](./video-monitoring.md) — Sub-pillar: camera and visual analysis
- [T-ML: ML Pipeline](./ml-pipeline.md) — Model training, conversion, and inference
- [T-DB: Data Persistence](./data-persistence.md) — Database schemas and repositories
