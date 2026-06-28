# U-MON: Monitoring Experience (User-Facing)

The passive monitoring experience from the user's perspective. This roadmap covers everything the user does with monitoring: configuring a session, starting it, viewing real-time feedback, receiving the post-session summary, and browsing history.

**Depends on technical roadmaps:** [T-PM](../technical/passive-monitoring.md), [T-AM](../technical/audio-monitoring.md), [T-VM](../technical/video-monitoring.md), [T-DB](../technical/data-persistence.md)

---

## Stage U-MON-01: Iniciar y Detener una Sesión de Monitoreo

**Objetivo:** El usuario puede iniciar una sesión de monitoreo con un botón, ver que está grabando (indicador visual), pausar/reanudar si lo necesita, y detenerla al volver a casa.

**Categoría:** `monitoreo`

**Dependencias técnicas:** T-PM-01 (servicio foreground y sesiones)

### Tareas

#### U-MON-01.1: Pantalla de inicio con botón de monitoreo

- [ ] `HomeScreen`: botón grande "Start Monitoring" como acción principal
- [ ] Selector de perro (si hay más de uno registrado)
- [ ] Indicador de última sesión: fecha, duración, índice de ansiedad
- [ ] Si no hay perro registrado → guiar al usuario a crear uno primero

**Tests:**
- **[Automático]** `HomeScreen` — Renderiza botón "Start Monitoring" cuando hay al menos un perro registrado
- **[Automático]** `HomeScreen` — Muestra mensaje "Add a dog first" cuando no hay perros registrados
- **[Manual]** Tocar "Start Monitoring" → transición a `MonitoringScreen` con cámara y medidor de audio activos

#### U-MON-01.2: Controles de sesión (pausar, reanudar, detener)

- [ ] `MonitoringScreen`:
  - Botón de pausa: pausa grabación, ícono cambia a "play" (reanudar)
  - Botón de stop: confirma con diálogo "End monitoring session?"
  - Timer de sesión en pantalla: `00:32:15`
  - Indicador de estado: círculo verde (activo), amarillo (pausado), gris (detenido)

**Tests:**
- **[Automático]** Session controls — Pausar → estado cambia a `paused`, timer se congela
- **[Automático]** Session controls — Reanudar → estado vuelve a `monitoring`, timer continúa
- **[Manual]** Tocar "Stop" → diálogo de confirmación → "Yes" → sesión finaliza y navega al resumen

#### U-MON-01.3: Servicio foreground con notificación

- [ ] Notificación persistente durante monitoreo: "dwatcher is monitoring your dog"
- [ ] Acción "Stop" en la notificación (sin abrir la app)
- [ ] La app puede estar en background o el teléfono bloqueado → el monitoreo continúa

**Tests:**
- **[Manual]** Iniciar monitoreo → poner app en background → ver notificación "dwatcher is monitoring" en barra de estado
- **[Manual]** Tocar "Stop" en la notificación → sesión finaliza sin abrir la app
- **[Manual]** Teléfono bloqueado durante monitoreo → al desbloquear y abrir la app, la sesión sigue activa

---

## Stage U-MON-02: Ver Feedback en Tiempo Real

**Objetivo:** Durante una sesión de monitoreo activa, el usuario puede ver (si está mirando la pantalla) qué está detectando la app en tiempo real: medidor de audio, eventos detectados, y preview de cámara.

**Categoría:** `monitoreo`, `visualizacion`

**Dependencias técnicas:** T-PM-02 (eventos unificados), T-AM-02 (detección de ladridos), T-VM-01 (cámara)

### Tareas

#### U-MON-02.1: Medidor de audio en tiempo real

- [ ] Barra de volumen animada: nivel dBFS actual con código de colores
  - Verde: sonido ambiente normal (-60dB a -30dB)
  - Amarillo: sonido elevado (-30dB a -10dB)
  - Rojo: sonido fuerte (-10dB a 0dB)
- [ ] Indicador de silencio: "Silence detected — your dog is quiet"

**Tests:**
- **[Automático]** Audio meter — dBFS=-40 → barra verde proporcional al nivel
- **[Automático]** Audio meter — dBFS=-5 → barra roja
- **[Manual]** Hacer ruido cerca del teléfono → la barra de audio reacciona en tiempo real (<200ms)

#### U-MON-02.2: Timeline de eventos en vivo

- [ ] Lista de eventos recientes con scroll:
  - Ícono: 🐕 ladrido, 🐺 aullido, 😢 quejido, 🏃 zoomies, 🔄 pacing
  - Timestamp relativo: "2 min ago", "30s ago", "just now"
  - Badge de confianza: "92%"
  - Thumbnail de snapshot (si hay cámara activa)
- [ ] Contador de eventos por tipo durante la sesión

**Tests:**
- **[Automático]** Event timeline — Renderiza evento con ícono, timestamp, y confidence badge correctos
- **[Manual]** Durante monitoreo con audio de ladrido → evento aparece en la timeline en <2s

#### U-MON-02.3: Preview de cámara con anotaciones

- [ ] Preview de cámara en vivo en `MonitoringScreen`
- [ ] Bounding boxes alrededor de perros detectados
- [ ] Nombre del perro sobre el bounding box (si identificado)
- [ ] Indicador de presencia: "Dog visible" / "Dog not in view"

**Tests:**
- **[Manual]** Apuntar cámara al perro → bounding box aparece con "Dog visible"
- **[Manual]** Perro sale del frame → indicador cambia a "Dog not in view"

---

## Stage U-MON-03: Revisar Resumen Post-Sesión

**Objetivo:** Al detener una sesión, el usuario ve un resumen automático con los comportamientos detectados, un índice de ansiedad, y puede reportar comportamientos que la app no pudo detectar automáticamente.

**Categoría:** `monitoreo`, `mediciones`

**Dependencias técnicas:** T-PM-03 (cómputo post-sesión)

### Tareas

#### U-MON-03.1: Pantalla de resumen post-sesión

- [ ] `SessionSummaryScreen`:
  - **Duración total** de la sesión
  - **Índice de ansiedad** (0-100) con gauge circular codificado por colores
  - **Comparación con línea base**: "Your baseline is 71 — today scored 58 (↓18%)"
  - **Breakdown por comportamiento**:
    - Ladridos: 12 eventos (↓41% vs línea base)
    - Aullidos: 3 eventos (↓62%)
    - Pacing: 18 min (↓28%)
  - **Galería de snapshots** capturados durante la sesión

**Tests:**
- **[Automático]** Summary — Renderiza correctamente con datos de sesión mock (todos los campos visibles)
- **[Manual]** Completar sesión real de 15min con ladridos → verificar que el resumen muestra datos coherentes
- **[Manual]** Verificar que el índice de ansiedad es 0 para una sesión sin eventos

#### U-MON-03.2: Checklist de comportamientos manuales

- [ ] Sección "Did anything else happen?":
  - ☐ Inappropriate urination
  - ☐ Inappropriate defecation
  - ☐ Object destruction
  - ☐ Other: [texto libre]
- [ ] Al marcar un comportamiento manual, el índice de ansiedad se actualiza en tiempo real
- [ ] Botón "Save & Finish" persiste el reporte y cierra la sesión

**Tests:**
- **[Automático]** Manual report — Marcar "Inappropriate urination" → el índice de ansiedad se recalcula al alza
- **[Manual]** Completar checklist manual en sesión real → los comportamientos se guardan y aparecen en el historial

---

## Stage U-MON-04: Explorar Historial de Sesiones

**Objetivo:** El usuario puede navegar su historial de sesiones pasadas, ver el resumen de cada una, y acceder a los detalles completos.

**Categoría:** `monitoreo`, `visualizacion`

**Dependencias técnicas:** T-PM-03 (cómputo post-sesión), T-DB (persistencia)

### Tareas

#### U-MON-04.1: Pantalla de historial

- [ ] `HistoryScreen`:
  - Lista de sesiones ordenadas por fecha (más reciente primero)
  - Cada item muestra:
    - Fecha y hora
    - Duración
    - Índice de ansiedad (con color)
    - Número de eventos detectados
    - Thumbnail de snapshot (primer snapshot de la sesión)
  - Pull-to-refresh
  - Búsqueda por fecha (calendario)

**Tests:**
- **[Automático]** History — Lista renderiza 10 sesiones en orden cronológico inverso
- **[Automático]** History — Sesión sin eventos muestra "No events" e índice 0
- **[Manual]** Navegar al historial después de 3 sesiones → ver las 3 con datos correctos

#### U-MON-04.2: Pantalla de detalle de sesión

- [ ] `SessionDetailScreen`:
  - Mismos datos que el resumen post-sesión (U-MON-03.1)
  - Timeline completa de eventos (todos, no solo recientes)
  - Galería de snapshots expandible
  - Reportes manuales (si los hubo)
  - Botón "Share" (exportar sesión como imagen/texto)

**Tests:**
- **[Automático]** Session detail — Carga y muestra todos los campos correctamente desde SQLite
- **[Manual]** Tocar una sesión en el historial → ver detalle completo con timeline y snapshots

---

## Stage U-MON-05: Configurar Preferencias de Monitoreo

**Objetivo:** El usuario puede ajustar cómo se comporta el monitoreo: sensibilidad de detección, preferencias de cámara, notificaciones, y privacidad.

**Categoría:** `configuracion`

**Dependencias técnicas:** T-DB (persistencia de settings)

### Tareas

#### U-MON-05.1: Pantalla de configuración de monitoreo

- [ ] `MonitoringSettingsScreen`:
  - **Audio sensitivity**: slider (afecta thresholds de detección)
  - **Camera preferences**: on/off, front/back auto
  - **Camera resolution**: low/medium/high
  - **Snapshot behavior**: on detection / off / manual only
  - **Privacy mode**: grabar solo audio, no video
  - **Battery saver**: reducir frame rate de cámara si batería < 30%

**Tests:**
- **[Automático]** Settings — Cambiar audio sensitivity → persiste en AsyncStorage
- **[Automático]** Settings — Activar Privacy Mode → cámara no se enciende en siguiente sesión
- **[Manual]** Cambiar camera resolution a "low" → verificar que la calidad de snapshot es menor pero la app es más fluida

#### U-MON-05.2: Preferencias de notificación

- [ ] Sección "Notifications":
  - Bark alerts: on/off
  - Anxiety alerts: on/off (threshold configurable: low/medium/high)
  - Session ended unexpectedly: on/off
  - Quiet hours: horario donde no se envían notificaciones

**Tests:**
- **[Manual]** Desactivar "Bark alerts" → durante sesión, no se reciben notificaciones de ladrido
- **[Manual]** Configurar quiet hours 22:00-08:00 → ladrido a las 23:00 no genera notificación

---

## Dependency Reference

| This Stage | Depends On (Technical) | Description |
|---|---|---|
| U-MON-01 | T-PM-01 | Start/stop session |
| U-MON-02 | T-PM-02, T-AM-02, T-VM-01 | Real-time feedback |
| U-MON-03 | T-PM-03 | Post-session summary |
| U-MON-04 | T-PM-03, T-DB | Session history |
| U-MON-05 | T-DB | Monitoring preferences |

## Referenced Roadmaps

- [U-AP: Anxiety Profile](./anxiety-profile.md) — Post-session analytics and trends
- [T-PM: Passive Monitoring](../technical/passive-monitoring.md) — Technical foundation
