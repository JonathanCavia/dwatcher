# dwatcher — Product Vision & Features

## 1. Vision

**dwatcher** es una herramienta objetiva para medir la respuesta al tratamiento de ansiedad por separación en perros. Convierte un teléfono Android en un dispositivo de monitoreo canino que graba audio y video de forma desatendida, detecta comportamientos asociados a la ansiedad usando machine learning on-device, y permite hacer un seguimiento cuantitativo de la evolución del perro a lo largo del tiempo.

### Problema que resuelve

La ansiedad por separación en perros afecta aproximadamente al 20-40% de los perros domésticos (Overall, 2013). El tratamiento existe pero **medir su efectividad es subjetivo**: los dueños reportan "me parece que está más tranquilo", los veterinarios dependen de relatos inconsistentes. No hay una herramienta objetiva, accesible y no invasiva que mida comportamientos específicos y su evolución temporal.

**dwatcher resuelve esto**: pone datos donde antes había impresiones.

### Principio rector

> **La tendencia importa más que la precisión absoluta.** No necesitamos detectar todos los comportamientos con precisión del 99%. Necesitamos detectar un subconjunto representativo con consistencia suficiente (≥80%) para que la tendencia a mediano-largo plazo sea válida y accionable.

---

## 2. Los Tres Pilares

```
┌──────────────────────────────────────────────────────────────┐
│                       dwatcher                                │
│                                                               │
│  ┌────────────────────┐  ┌───────────────────────────────┐   │
│  │  Monitoreo Pasivo  │  │  Sistema de Aprendizaje       │   │
│  │                    │  │  (LearningSession unificada)   │   │
│  │  Grabar audio y    │  │                                │   │
│  │  video desatendido │  │  ┌─────────────────────────┐  │   │
│  │  • Ladridos        │  │  │ Actividades mezclables  │  │   │
│  │  • Aullidos        │  │  │ (LAT → Obediencia → LAT)│  │   │
│  │  • Pacing          │  │  │                          │  │   │
│  │  • Zoomies         │  │  │ Training    │ Education  │  │   │
│  │  • Postura ansiosa │  │  │ • Obediencia│ • LAT      │  │   │
│  │                    │  │  │              │ • Desensib.│  │   │
│  │  ML on-device      │  │  │              │ • Ausencia │  │   │
│  │  (YAMNet + TFLite) │  │  │              │ • Límites  │  │   │
│  │                    │  │  │              │ • Custom   │  │   │
│  └────────┬───────────┘  │  └─────────────────────────┘  │   │
│           │              │                                │   │
│           │              │  Dificultores por repetición   │   │
│           │              │  • Presets (lugar + hora)      │   │
│           │              │  • Nivel de dificultad (0-1)   │   │
│           │              │  • Progreso por actividad      │   │
│           └──────────────┤                                │   │
│                          └────────────┬───────────────────┘   │
│                                       │                       │
│                                       ▼                       │
│         ┌─────────────────────────────────────────┐          │
│         │  Perfil de Ansiedad por Separación      │          │
│         │  • Línea base  • Índice compuesto       │          │
│         │  • Tendencias  • Comparación entre       │          │
│         │    períodos      comportamientos         │          │
│         │  • Pesos tuneables por comportamiento    │          │
│         └─────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### Pilar 1: Monitoreo Pasivo

El núcleo de la app. El dueño configura una sesión, deja el teléfono cargando, y se va. El teléfono graba audio y video de forma desatendida mediante un servicio foreground de Android.

Al volver, finaliza la sesión y recibe un **resumen del comportamiento observado**: qué comportamientos se detectaron, con qué frecuencia, y un puntaje compuesto de ansiedad.

**Detecciones automáticas (on-device ML):**

| Comportamiento | Canal | Tecnología |
|---|---|---|
| Ladridos excesivos | Audio | YAMNet + TFLite |
| Aullidos | Audio | YAMNet + TFLite |
| Quejidos / lloriqueos | Audio | YAMNet + TFLite |
| Pacing (ida y vuelta) | Visión | Pose estimation + tracking |
| Subirse a muebles | Visión | Object detection (perro + mobiliario) |
| Zoomies | Visión | Aceleración de keypoints |
| Temblor / postura ansiosa | Visión | Pose estimation |

**Reportes manuales (el dueño al volver):**

| Comportamiento | Motivo de ser manual |
|---|---|
| Micción inadecuada | Detección visual poco confiable |
| Defecación inadecuada | Detección visual poco confiable |
| Destrucción de objetos | Requiere detectar cambio de estado (muy complejo) |

### Pilar 2 & 3: Sistema de Aprendizaje Unificado

Adiestramiento y Educación comparten un mismo modelo de datos — `LearningSession`. Una sesión de aprendizaje puede contener múltiples actividades de cualquier tipo, incluso mezcladas (ej: LAT → Obediencia → LAT → Desensibilización en la misma sesión).

```
LearningSession (fecha, duración, notas)
  ├── SessionActivity: LAT (primera ronda)
  │   ├── Repetición 1: distancia 8m, baseline 30s, éxito ✓
  │   ├── Repetición 2: distancia 6m, se tunelizó, baseline 2min, éxito ✗
  │   └── Repetición 3: distancia 7m, baseline 20s, éxito ✓
  │
  ├── SessionActivity: Obediencia — "Sentado"
  │   ├── Repetición 1: distancia 5m, respondió, recompensado ✓
  │   ├── Repetición 2: distancia 8m, no respondió ✗
  │   └── Repetición 3: distancia 6m, respondió, recompensado ✓
  │
  └── SessionActivity: LAT (segunda ronda)
      ├── Repetición 1: distancia 5m, baseline 45s, éxito ✓
      └── Repetición 2: distancia 4m, baseline 1min, éxito ✓
```

**Conceptos clave:**

| Concepto | Definición |
|---|---|
| **LearningGoal** | *Qué* se entrena. Ej: "Sentado", "Reducir reactividad", "Ansiedad por separación". Pertenece a una categoría (`training` o `education`). Misma tabla, filtrable. |
| **Exercise** | *Cómo* se entrena. Una plantilla de actividad. Puede ser predefinida o custom. Varios ejercicios pueden apuntar al mismo goal. |
| **LearningSession** | *Cuándo* se entrenó. Contenedor unificado con fecha, duración, y lista de actividades. |
| **SessionActivity** | Una actividad dentro de la sesión. Referencia un exercise, tiene un tipo (`ActivityType`), y una lista de repeticiones. |
| **Repetición** | La unidad atómica de progreso. Cada repetición registra: éxito/fallo, duración, dificultad del ambiente, y métricas específicas según el tipo de actividad. |

**Tipos de actividad y sus métricas:**

| Tipo | Categoría | Variable de progreso | Métricas por repetición |
|---|---|---|---|
| `obedience` | Training | Distancia de respuesta al comando | éxito, recompensado, tiempo de respuesta, distancia |
| `lat` | Education | Distancia al estímulo sin reaccionar | distancia, intensidad, ¿se tunelizó?, tiempo hasta baseline |
| `desensitization` | Education | Distancia/intensidad tolerable | distancia, intensidad, ¿se tunelizó?, tiempo hasta baseline |
| `absence_exposure` | Education | Duración de ausencia tolerada | duración, intensidad, ¿vocalizó?, ¿se tunelizó?, tiempo hasta baseline |
| `boundary_setting` | Education | Tiempo de respuesta al límite | intensidad, tiempo de respuesta |
| `custom` | Cualquiera | Definida por el usuario | campo libre `metrics: Record<string, any>` |

**Sistema de dificultad:**

Cada repetición registra las condiciones ambientales que afectaron su dificultad:

```
DifficultyFactor {
  presetId?        // referencia a un preset guardado (lugar + hora)
  location?        // ubicación (si no usa preset)
  timeOfDay?       // momento del día (si no usa preset)
  difficultyLevel  // 0.0 (más fácil) – 1.0 (más difícil)
  notes?           // qué hizo esta repetición más fácil o difícil
}
```

Los **presets** (`DifficultyPreset`) permiten guardar combinaciones frecuentes de lugar + hora para comparar repeticiones en condiciones similares de forma científica. Ej: "Casa living mañana", "Plaza tarde", "Veterinaria".

**Medios de comunicación:**

Cada actividad registra qué medios se usaron. Simplificado a tipo + descripción libre:

```typescript
{ type: 'verbal', description: '"Sentado" en tono neutro' }
{ type: 'physical', description: 'Mano abierta hacia arriba, gesto pequeño' }
{ type: 'whistle', description: 'Silbido corto seguido de uno largo' }
{ type: 'facial', description: 'Ceño fruncido para marcar corrección' }
```

**Progreso por actividad:**

El progreso de una actividad se mide en su variable específica, combinada con la dificultad del ambiente. Esto permite comparar de forma científica:

> "El perro respondió a 'quieto' a 5 metros en el living (dificultad 0.2) vs 8 metros en la plaza (dificultad 0.7). Está progresando en entornos más difíciles."

**Extensibilidad:**

Nuevos tipos de actividades (ej: Nosework, Cooperative Care) se agregan como nuevos miembros al enum `ActivityType` y su correspondiente interfaz de repetición — sin cambiar el modelo de sesión.

---

## 3. Catálogo de Comportamientos de Ansiedad por Separación

Basado en literatura clínica veterinaria (Overall, 2013; Sherman & Mills, 2008).

### Comportamientos automáticos (detectados por la app)

| # | Comportamiento | Categoría | Severidad | Canal | Peso default |
|---|---|---|---|---|---|
| 1 | Ladridos excesivos | Vocalización | Moderado | Audio | 0.20 |
| 2 | Aullidos | Vocalización | Severo | Audio | 0.25 |
| 3 | Quejidos / lloriqueos | Vocalización | Leve | Audio | 0.10 |
| 4 | Pacing | Motor | Moderado | Visión | 0.15 |
| 5 | Subirse a muebles/mesas | Espacial | Moderado | Visión | 0.10 |
| 6 | Zoomies (carreras frenéticas) | Motor | Moderado | Visión | 0.10 |
| 7 | Temblor / postura ansiosa | Motor | Severo | Visión | 0.10 |

**Pesos default suman 1.0** para comportamientos automáticos. Son **ajustables por perro** desde la app: si un perro particular no aúlla pero tiembla mucho, el dueño puede subir el peso de temblor y bajar el de aullido.

### Comportamientos manuales (reportados por el dueño)

| # | Comportamiento | Categoría | Severidad | Canal |
|---|---|---|---|---|
| 8 | Micción inadecuada | Eliminación | Severo | Manual |
| 9 | Defecación inadecuada | Eliminación | Severo | Manual |
| 10 | Destrucción de objetos | Destructivo | Severo | Manual |

Estos comportamientos no contribuyen al índice automático pero se incorporan como **modificadores** al puntaje final de la sesión cuando el dueño los reporta al volver.

---

## 4. Índice de Ansiedad

### Cálculo

El índice de ansiedad por sesión (0-100) se calcula como:

```
anxietyIndex = Σ (w_i × f_i × s_i) × (60 / durationMinutes) × 100
```

Donde:
- `w_i` = peso del comportamiento `i` (tuneable, del perfil del perro)
- `f_i` = frecuencia del comportamiento `i` (eventos detectados / duración de sesión en horas)
- `s_i` = factor de severidad base (leve=0.5, moderado=0.75, severo=1.0)
- `durationMinutes` = duración total de la sesión de monitoreo

El índice se normaliza para que sesiones de distinta duración sean comparables.

### Línea base

Las primeras 3-5 sesiones de monitoreo establecen la **línea base** del perro: su nivel de ansiedad típico cuando se queda solo sin intervención. Esta línea base es el punto de referencia contra el cual se mide cualquier cambio futuro.

```
Sesión 1: 68     ─┐
Sesión 2: 72     ─┤── Línea base: 71/100
Sesión 3: 73     ─┘
                    ↓ se inicia tratamiento
Sesión 4: 65     ── inicio de tendencia
Sesión 5: 58     ── mejoría detectable
Sesión 6: 49     ── tendencia clara a la baja
```

### Niveles de ansiedad

| Rango | Nivel | Color | Significado |
|---|---|---|---|
| 0-30 | Bajo | Verde | El perro está tranquilo, comportamientos mínimos |
| 30-60 | Moderado | Amarillo | Hay signos de ansiedad, requiere atención |
| 60-80 | Alto | Naranja | Ansiedad significativa, múltiples comportamientos |
| 80-100 | Crítico | Rojo | Distrés severo, intervención necesaria |

---

## 5. Medición de Respuesta al Tratamiento

### Comparación entre períodos

La app permite seleccionar dos períodos de tiempo y compararlos con métricas estadísticas:

| Métrica | Descripción |
|---|---|
| **Promedio** | Índice de ansiedad promedio en cada período |
| **Desviación estándar** | Variabilidad dentro del período |
| **Cambio absoluto** | Diferencia entre promedios (B - A) |
| **Cambio relativo** | Porcentaje de cambio respecto al período A |
| **Tendencia** | Mejorando / Empeorando / Estable |
| **Desglose por comportamiento** | Qué comportamientos específicos cambiaron más |

### Visualización

```
┌────────────────────────────────────────────────────────────┐
│  Período A: Semanas 1-2    │  Período B: Semanas 5-6      │
│  (Pre-tratamiento)         │  (Post-tratamiento)           │
│                             │                               │
│  Promedio:    71 /100      │  Promedio:    45 /100  ↓36%  │
│  Std Dev:     ±8           │  Std Dev:     ±6              │
│  Sesiones:    5            │  Sesiones:    5               │
│                             │                               │
│  ████████████████          │  ██████████                  │
│                             │                               │
│  Tendencia: MEJORANDO ✅    │                               │
│                             │                               │
│  Comportamientos que más bajaron:                          │
│  • Aullidos:       -62%                                    │
│  • Ladridos:       -41%                                    │
│  • Pacing:         -28%                                    │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Ciclo de Uso Típico

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CICLO DE USO                                  │
│                                                                      │
│  1. CONFIGURACIÓN INICIAL                                            │
│     • Crear perfil del perro (nombre, raza, peso, foto)              │
│     • Revisar catálogo de comportamientos (pesos default)            │
│     • Opcional: ajustar pesos según el perfil de síntomas del perro  │
│                                                                      │
│  2. ESTABLECER LÍNEA BASE                                           │
│     • 3-5 sesiones de monitoreo sin intervención                     │
│     • La app calcula el índice de ansiedad base automáticamente      │
│                                                                      │
│  3. INTERVENCIÓN (TRATAMIENTO)                                       │
│     • Sesiones de educación: LAT, exposición a la ausencia           │
│     • Sesiones de adiestramiento: comandos, ejercicios               │
│     • Ambas se registran en la app para seguimiento                  │
│                                                                      │
│  4. MONITOREO CONTINUO                                               │
│     • Sesiones de monitoreo regulares (cuando el dueño sale)         │
│     • La app compara cada sesión contra la línea base                │
│     • Reportes manuales de comportamientos no detectables            │
│                                                                      │
│  5. EVALUACIÓN                                                       │
│     • Comparación entre períodos (antes vs después)                  │
│     • Visualización de tendencias                                    │
│     • Ajuste de estrategia de tratamiento basado en datos            │
│                                                                      │
│  6. ITERACIÓN                                                        │
│     • El ciclo se repite: monitoreo → evaluación → ajuste            │
│     • A largo plazo, la tendencia muestra si el tratamiento funciona │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Funcionalidades por Fase

### Fase A: Núcleo de Monitoreo (prioridad máxima)

- [ ] Servicio foreground para grabación de audio desatendida
- [ ] Detección de vocalizaciones (ladrido, aullido, quejido) vía YAMNet + TFLite
- [ ] Persistencia local de eventos (SQLite)
- [ ] Cálculo de índice de ansiedad por sesión
- [ ] Establecimiento de línea base (3-5 sesiones)
- [ ] Resumen post-sesión

### Fase B: Visión y Movimiento

- [ ] Cámara: snapshots en detecciones, video por disparo de movimiento
- [ ] Pose estimation para detección de pacing y zoomies
- [ ] Object detection para detección de perro en muebles
- [ ] Reportes manuales de comportamientos no detectables

### Fase C: Adiestramiento y Educación

- [ ] Registro de sesiones de adiestramiento (tipo, ejercicios, métricas)
- [ ] Registro de sesiones de educación (LAT, exposición a la ausencia, desensibilización)
- [ ] Catálogo de habilidades y ejercicios (predefinidos + custom)
- [ ] Medios de comunicación por ejercicio
- [ ] Seguimiento de umbrales y baseline en ejercicios de educación

### Fase D: Analíticas Avanzadas

- [ ] Comparación entre períodos con métricas estadísticas
- [ ] Gráficos de tendencia (diario, semanal, mensual)
- [ ] Desglose por comportamiento
- [ ] Pesos de comportamientos ajustables por perro
- [ ] Exportación de datos (CSV/JSON)

### Fase E: Expansión (futuro)

- [ ] Streaming en vivo (WebRTC) — funcionalidad secundaria
- [ ] Identificación visual de perro (para hogares multi-perro)
- [ ] Estimación de emoción canina (modelo multimodal audio + visión)
- [ ] Dashboard web para veterinarios / etólogos
- [ ] Notificaciones push en tiempo real

---

## 8. Supuestos y Restricciones

### Supuestos

1. **Un perro por hogar** como punto de partida. El sistema asume que hay un solo perro frente a la cámara. La diferenciación multi-perro es una fase futura.
2. **Teléfono enchufado** durante sesiones de monitoreo. El modo desatendido consume batería; se recomienda tener el cargador conectado.
3. **Teléfono fijo** apuntando al área donde el perro pasa la mayor parte del tiempo cuando está solo.
4. **Detección consistente > exhaustiva**. Priorizamos precisión en los comportamientos más detectables sobre cobertura de todos los comportamientos posibles.
5. **El dueño como validador**. La app permite (y alienta) que el dueño revise y confirme/descarte detecciones para mejorar la precisión con el tiempo.

### Restricciones técnicas

1. **On-device**: Todo el ML corre en el dispositivo. Nada de audio/video crudo sale del teléfono. Privacidad total.
2. **Android-first**: Desarrollo inicial exclusivamente para Android (Expo dev-client).
3. **Sin dependencia de conectividad**: El monitoreo funciona 100% offline. La sincronización con backend es opcional y posterior.
4. **Modelos cuantizados**: TFLite con INT8 para que el inference sea viable en batería (target: <5% batería por hora).

---

## 9. Glosario

| Término | Definición |
|---|---|
| **Adiestramiento** | Entrenamiento de habilidades técnicas y comandos puntuales con principio y final claros. |
| **Educación** | Trabajo sobre el comportamiento general del perro: control de impulsos, desensibilización, respeto de límites. |
| **LAT** (Look At That) | Técnica de educación donde el perro aprende a mirar un estímulo sin reaccionar, trabajando en el umbral de reactividad. |
| **Umbral** | Distancia a la que un estímulo es lo suficientemente fuerte como para que el perro no pueda ignorarlo completamente. Es la zona de trabajo. |
| **Umbral de tunelización** | Distancia a la que el perro queda completamente fijado en el estímulo ("tuneleado") y deja de responder. Se debe evitar cruzar este umbral. |
| **Baseline** (línea base) | Estado de calma del perro. En monitoreo: nivel de ansiedad típico sin intervención. En educación: estado de calma al que se debe volver después de una exposición. |
| **Índice de ansiedad** | Puntaje compuesto (0-100) que agrega todos los comportamientos detectados en una sesión, ponderados por su severidad y frecuencia. |
| **Exposición a la ausencia** | Ejercicio de educación donde se practica dejar al perro solo por períodos controlados y crecientes. Es el puente entre educación y monitoreo. |
| **Zoomies** | Carreras frenéticas y erráticas. En contexto de ansiedad por separación, son un comportamiento de desplazamiento, no juego. |
| **Pacing** | Caminar repetitivo de un lado a otro, generalmente en un patrón fijo. Comportamiento estereotípico asociado a ansiedad. |
