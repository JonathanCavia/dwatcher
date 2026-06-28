# U-LS: Learning System (User-Facing)

The unified learning system allows the user to track both training (adiestramiento) and behavioral education (educación) in a single, flexible session format. Activities can be mixed freely — LAT followed by obedience followed by more LAT — and every repetition is tracked with type-specific metrics.

**Depends on technical roadmaps:** [T-DB](../technical/data-persistence.md)

---

## Stage U-LS-01: Crear y Gestionar Objetivos de Aprendizaje

**Objetivo:** El usuario puede crear, explorar, y gestionar objetivos de aprendizaje (Learning Goals) para su perro, tanto de adiestramiento como de educación, usando un catálogo predefinido y la opción de crear objetivos personalizados.

**Categoría:** `adiestramiento`, `educacion`

**Dependencias técnicas:** T-DB (schema de learning goals)

### Tareas

#### U-LS-01.1: Catálogo de objetivos predefinidos

- [ ] `GoalCatalogScreen`:
  - Lista de objetivos predefinidos filtrable por categoría: `training` | `education` | `all`
  - Cada goal muestra: nombre, categoría (badge), descripción corta, ejercicios asociados
  - Goals de training predefinidos: "Sentado", "Quieto", "Venir", "Junto", "Suelta", "Mira"
  - Goals de education predefinidos: "LAT (Look At That)", "Desensibilización a ruidos", "Exposición a la ausencia", "Control de impulsos", "Límites en casa", "Socialización"
  - Tocar un goal → ver detalle con ejercicios sugeridos

**Tests:**
- **[Automático]** Catalog — Filtro `training` → solo muestra goals de tipo training
- **[Automático]** Catalog — Filtro `education` → solo muestra goals de tipo education
- **[Manual]** Navegar al catálogo → ver lista completa → tocar un goal → ver detalle con ejercicios

#### U-LS-01.2: Crear objetivo personalizado

- [ ] Formulario `CreateGoalScreen`:
  - Nombre del objetivo
  - Categoría: `training` | `education`
  - Descripción (opcional)
  - Notas (opcional, texto libre)
- [ ] Validación: nombre requerido, no duplicado
- [ ] El objetivo personalizado aparece en el catálogo con badge "Custom"

**Tests:**
- **[Automático]** Create goal — Form válido → goal persiste y aparece en catálogo
- **[Automático]** Create goal — Nombre duplicado → error de validación
- **[Manual]** Crear goal personalizado "Nosework" → aparece en catálogo con badge "Custom"

#### U-LS-01.3: Catálogo de ejercicios

- [ ] `ExerciseCatalogScreen`:
  - Ejercicios predefinidos agrupados por goal
  - Cada ejercicio: nombre, tipo de actividad, descripción, métricas que registra
  - Ejercicios de training: "Sentado con distancia", "Quieto con distracción", "Llamada de emergencia"
  - Ejercicios de education: "LAT en la ventana", "Desensibilización a timbre", "Ausencia controlada 5min"
  - Botón "Create Custom Exercise" → mismo formulario que predefinidos

**Tests:**
- **[Automático]** Exercise catalog — Agrupado por goal, cada ejercicio muestra su tipo de actividad
- **[Manual]** Explorar ejercicios de "LAT" → ver ejercicios predefinidos → crear uno custom

---

## Stage U-LS-02: Realizar una Sesión de Aprendizaje

**Objetivo:** El usuario puede crear y conducir una sesión de aprendizaje que contenga una o más actividades de cualquier tipo, mezcladas libremente, con seguimiento en tiempo real de repeticiones.

**Categoría:** `adiestramiento`, `educacion`

**Dependencias técnicas:** T-DB (schema de learning sessions)

### Tareas

#### U-LS-02.1: Pantalla de nueva sesión de aprendizaje

- [ ] `NewLearningSessionScreen`:
  - Seleccionar perro
  - Fecha y hora (default: ahora)
  - Notas iniciales (opcional)
  - Botón "Start Session" → entra en modo sesión activa

**Tests:**
- **[Automático]** New session — Crear con perro válido → sesión persiste en estado `active`
- **[Manual]** Iniciar nueva sesión → pantalla de sesión activa con timer corriendo

#### U-LS-02.2: Agregar actividades durante la sesión

- [ ] `ActiveLearningSessionScreen`:
  - Timer de sesión corriendo
  - Lista de actividades agregadas (inicialmente vacía)
  - Botón "+" para agregar actividad:
    - Seleccionar tipo: Obedience / LAT / Desensitization / Absence Exposure / Boundary Setting / Custom
    - Seleccionar ejercicio (del catálogo) o crear ad-hoc
    - Seleccionar medios de comunicación usados (verbal, physical, whistle, facial)
  - Las actividades se agregan en orden y se pueden reordenar

**Tests:**
- **[Automático]** Add activity — Seleccionar tipo "LAT", ejercicio "LAT en la ventana" → actividad agregada a la sesión
- **[Automático]** Reorder — Arrastrar actividad 2 a posición 1 → orden actualizado
- **[Manual]** Crear sesión con 3 actividades: LAT → Obediencia → LAT → verlas en orden correcto

#### U-LS-02.3: Registrar repeticiones en tiempo real

- [ ] Durante una actividad activa:
  - Contador de repeticiones
  - Botón "Success ✓" / "Fail ✗" (grandes, fáciles de tocar)
  - Campos específicos según tipo de actividad:
    - **Obediencia**: distancia, tiempo de respuesta, ¿recompensado?
    - **LAT**: distancia al estímulo, intensidad, ¿se tunelizó?, tiempo hasta baseline
    - **Desensibilización**: distancia, intensidad, ¿se tunelizó?, tiempo hasta baseline
    - **Ausencia**: duración de ausencia, intensidad, ¿vocalizó?, ¿se tunelizó?
    - **Límites**: intensidad, tiempo de respuesta
    - **Custom**: campos libres (key-value)
  - Botón "Next Repetition" para iniciar siguiente repetición

**Tests:**
- **[Automático]** Repetition — Registrar obediencia exitosa con distancia 5m → datos persisten correctamente
- **[Automático]** Repetition — Registrar LAT con tunelización → flag `tunneled: true` guardado
- **[Manual]** Durante sesión real de LAT → registrar 5 repeticiones → ver contador y datos guardados

#### U-LS-02.4: Finalizar sesión

- [ ] Botón "End Session"
- [ ] Confirmación: resumen de la sesión (duración, N actividades, N repeticiones totales, % éxito)
- [ ] Notas finales (opcional)
- [ ] Persistir todo → navegar al resumen de la sesión

**Tests:**
- **[Automático]** End session — Sesión con 2 actividades y 10 repeticiones → estado cambia a `completed`, todos los datos persisten
- **[Manual]** Finalizar sesión real → ver resumen → confirmar → sesión aparece en historial

---

## Stage U-LS-03: Gestionar Factores de Dificultad

**Objetivo:** El usuario puede crear presets de dificultad (lugar + hora) y aplicarlos a las repeticiones para comparar científicamente el desempeño del perro en distintas condiciones.

**Categoría:** `adiestramiento`, `educacion`, `mediciones`

**Dependencias técnicas:** T-DB (schema de difficulty presets)

### Tareas

#### U-LS-03.1: Crear y gestionar presets de dificultad

- [ ] `DifficultyPresetsScreen`:
  - Lista de presets guardados
  - Cada preset: nombre, ubicación, hora del día, nivel de dificultad base (0-1)
  - Ejemplos: "Casa living mañana" (0.2), "Plaza tarde" (0.7), "Veterinaria" (0.9)
  - Botón "New Preset" → formulario:
    - Nombre (ej: "Parque con perros")
    - Ubicación (texto libre)
    - Hora del día (mañana/tarde/noche o hora específica)
    - Nivel de dificultad base: slider 0.0 (más fácil) – 1.0 (más difícil)
    - Notas: ¿qué hace este entorno más fácil o difícil?

**Tests:**
- **[Automático]** Presets CRUD — Crear, editar, eliminar preset → persiste correctamente
- **[Manual]** Crear preset "Plaza 8am" con dificultad 0.6 → aparece en lista de presets disponibles

#### U-LS-03.2: Aplicar dificultad a repeticiones

- [ ] Durante una repetición (U-LS-02.3):
  - Selector de preset: elegir de la lista de presets guardados
  - Opción "Ad-hoc": ingresar ubicación, hora, y nivel manualmente
  - El nivel de dificultad se registra con la repetición
- [ ] Vista de comparación: "Sentado a 5m en living (dificultad 0.2) vs Sentado a 8m en plaza (dificultad 0.7)"

**Tests:**
- **[Automático]** Apply preset — Repetición con preset "Casa living mañana" → `difficultyLevel: 0.2` guardado
- **[Manual]** Registrar 5 repeticiones del mismo ejercicio en 2 presets distintos → ver comparación

---

## Stage U-LS-04: Ver Progreso de Aprendizaje

**Objetivo:** El usuario puede ver el progreso de su perro en cada objetivo de aprendizaje: éxito por actividad, evolución en el tiempo, y comparación entre condiciones de dificultad.

**Categoría:** `visualizacion`, `mediciones`, `adiestramiento`, `educacion`

**Dependencias técnicas:** T-DB (queries de agregación)

### Tareas

#### U-LS-04.1: Pantalla de progreso por objetivo

- [ ] `GoalProgressScreen`:
  - Selector de goal
  - **Métrica principal**: evolución de la variable clave del goal en el tiempo
    - Obediencia: distancia de respuesta (↑ es mejor)
    - LAT: distancia al estímulo sin reaccionar (↓ es mejor)
    - Ausencia: duración tolerada (↑ es mejor)
  - **Tasa de éxito**: % de repeticiones exitosas en el tiempo
  - **Dificultad**: nivel de dificultad promedio de las sesiones
  - Gráfico combinado: métrica principal (línea) + dificultad (barras de fondo)

**Tests:**
- **[Automático]** Progress — Obediencia: distancias [3, 5, 5, 8, 10] → tendencia positiva
- **[Automático]** Progress — LAT: distancias [8, 6, 7, 5, 4] m → tendencia positiva (más cerca sin reaccionar)
- **[Manual]** Ver progreso de "LAT" después de 5 sesiones → gráfico de distancia vs tiempo

#### U-LS-04.2: Progreso comparativo por dificultad

- [ ] Vista: mismo ejercicio, distintos niveles de dificultad
  - Tabla: filas = fechas, columnas = presets, celdas = tasa de éxito
  - Insight: "Sentado tiene 90% éxito en living (dificultad 0.2) pero solo 40% en plaza (dificultad 0.7). Está progresando en entornos más difíciles."

**Tests:**
- **[Automático]** Difficulty comparison — Datos de 2 presets distintos → tabla comparativa correcta
- **[Manual]** Ver comparación de dificultad para "Sentado" → identificar en qué entornos el perro rinde mejor/peor

---

## Stage U-LS-05: Integración con Perfil de Ansiedad

**Objetivo:** Las sesiones de educación (especialmente exposición a la ausencia) se conectan con el perfil de ansiedad por separación, permitiendo ver la relación entre el entrenamiento y los resultados del monitoreo pasivo.

**Categoría:** `educacion`, `mediciones`

**Dependencias técnicas:** T-DB, [U-AP-01](anxiety-profile.md) (perfil de ansiedad)

### Tareas

#### U-LS-05.1: Conectar sesiones de ausencia con monitoreo

- [ ] En el perfil de ansiedad (U-AP-01), mostrar sesiones de aprendizaje de tipo `absence_exposure`:
  - "You've done 8 absence exposure sessions (max: 45 min)"
  - "Your dog's monitoring anxiety dropped from 71 to 45 since starting exposure training"
- [ ] Gráfico combinado: índice de ansiedad (monitoreo) + duración de ausencia entrenada (learning)
  - Eje Y izquierdo: anxiety index (0-100)
  - Eje Y derecho: absence duration (minutos)
  - Eje X: tiempo

**Tests:**
- **[Automático]** Combined chart — Datos de monitoreo + datos de ausencia → dos líneas en ejes correctos
- **[Manual]** Ver perfil de ansiedad → se muestran datos de sesiones de ausencia correlacionados

#### U-LS-05.2: Recomendaciones basadas en datos

- [ ] Sistema sugiere próximos pasos basado en correlación monitoreo-adiestramiento:
  - "Your dog's anxiety spikes when absence exceeds 30min. Try an absence exposure session at 35min."
  - "Barking decreased after you started boundary setting exercises. Keep it up."
- [ ] Recomendaciones aparecen como cards en el perfil de ansiedad

**Tests:**
- **[Automático]** Recommendation — Datos muestran ansiedad sube a >60min ausencia → sugiere sesión de 35min
- **[Manual]** Ver recomendaciones después de usar ambos sistemas → sugerencias son relevantes

---

## Dependency Reference

| This Stage | Depends On (Technical) | Description |
|---|---|---|
| U-LS-01 | T-DB | Goal catalog |
| U-LS-02 | T-DB | Learning sessions |
| U-LS-03 | T-DB | Difficulty presets |
| U-LS-04 | T-DB | Progress visualization |
| U-LS-05 | T-DB, U-AP-01 | Anxiety profile integration |

## Referenced Roadmaps

- [U-AP: Anxiety Profile](./anxiety-profile.md) — Connected through absence exposure data
- [U-MON: Monitoring Experience](./monitoring-experience.md) — Monitoring sessions that feed the anxiety profile
- [T-DB: Data Persistence](../technical/data-persistence.md) — Database foundation for all learning data
