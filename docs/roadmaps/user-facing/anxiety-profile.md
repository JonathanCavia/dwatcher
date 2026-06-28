# U-AP: Anxiety Profile (User-Facing)

The separation anxiety profile is the quantitative core of dwatcher. It gives the user an objective measurement of their dog's anxiety over time: baseline establishment, trend tracking, period comparison, and per-behavior breakdown.

**Depends on technical roadmaps:** [T-PM](../technical/passive-monitoring.md), [T-DB](../technical/data-persistence.md), [T-AM](../technical/audio-monitoring.md), [T-VM](../technical/video-monitoring.md)

---

## Stage U-AP-01: Ver Perfil de Ansiedad del Perro

**Objetivo:** El usuario puede ver el perfil de ansiedad de su perro: línea base, índice actual, tendencia reciente, y breakdown por comportamiento. Todo desde una pantalla dedicada.

**Categoría:** `mediciones`, `visualizacion`

**Dependencias técnicas:** T-PM-03 (cómputo de índice), T-DB (persistencia)

### Tareas

#### U-AP-01.1: Pantalla de perfil de ansiedad

- [ ] `AnxietyProfileScreen`:
  - **Línea base**: valor (0-100) + fecha de establecimiento + número de sesiones usadas
  - **Último índice**: valor + fecha + comparación vs línea base (↑/↓ + %)
  - **Tendencia**: mini sparkline de últimos 7-30 días
  - **Nivel actual**: Bajo (verde) / Moderado (amarillo) / Alto (naranja) / Crítico (rojo)
  - **Breakdown por comportamiento**: lista de comportamientos con:
    - Peso actual (tuneable)
    - Frecuencia promedio por sesión
    - Contribución al índice total (%)
    - Tendencia individual (↑ ↓ →)

**Tests:**
- **[Automático]** Profile screen — Con datos de sesiones → renderiza todos los campos correctamente
- **[Automático]** Profile screen — Sin sesiones (perro nuevo) → muestra "Complete 3 monitoring sessions to establish baseline"
- **[Manual]** Después de 5 sesiones → verificar que la línea base, tendencias, y breakdown son coherentes

#### U-AP-01.2: Niveles de ansiedad con código de colores

- [ ] Implementar escala visual:
  - 0-30: Verde — "Your dog is calm"
  - 30-60: Amarillo — "Moderate anxiety signs"
  - 60-80: Naranja — "Significant anxiety"
  - 80-100: Rojo — "Severe distress"
- [ ] Gauge circular animado que muestre el valor actual en la zona de color correspondiente
- [ ] Descripción contextual: "Your dog's anxiety is 45/100 — moderate. Main contributor: barking (60% of index)"

**Tests:**
- **[Automático]** Gauge — Valor 25 → zona verde, color verde
- **[Automático]** Gauge — Valor 75 → zona naranja, color naranja
- **[Automático]** Contextual text — Genera descripción correcta para cada nivel

---

## Stage U-AP-02: Establecer Línea Base

**Objetivo:** Las primeras 3-5 sesiones de monitoreo establecen automáticamente la línea base del perro — su nivel de ansiedad típico sin intervención. El usuario entiende qué es la línea base y por qué es importante.

**Categoría:** `mediciones`

**Dependencias técnicas:** T-PM-03 (cómputo de índice)

### Tareas

#### U-AP-02.1: Establecimiento automático de línea base

- [ ] Sistema calcula línea base automáticamente después de la 3ra sesión
- [ ] Línea base = promedio de índices de las primeras 3-5 sesiones
- [ ] Se recalcula al agregar más sesiones (hasta 5, luego se fija)
- [ ] Notificación/indicador: "Baseline established! Your dog's baseline anxiety is 71/100"

**Tests:**
- **[Automático]** Baseline — 3 sesiones con índices [68, 72, 73] → baseline = 71
- **[Automático]** Baseline — 2 sesiones → "Need 1 more session to establish baseline"
- **[Automático]** Baseline — Después de fijar baseline (5 sesiones), una 6ta sesión no la modifica
- **[Manual]** Completar 3 sesiones de monitoreo → ver notificación de baseline establecida

#### U-AP-02.2: Explicación educativa de la línea base

- [ ] Tooltip/ayuda contextual en la pantalla de perfil:
  - "The baseline is your dog's typical anxiety level when left alone, before any treatment."
  - "We use it as a reference point to measure improvement over time."
  - "3-5 sessions are needed for a reliable baseline."
- [ ] Visualización: línea horizontal punteada en gráficos de tendencia mostrando el valor de la baseline

**Tests:**
- **[Manual]** Ver perfil antes de tener baseline → se muestra explicación de qué es y cuántas sesiones faltan
- **[Manual]** Ver perfil con baseline → línea punteada visible en el gráfico de tendencia

---

## Stage U-AP-03: Ajustar Pesos de Comportamientos

**Objetivo:** Cada perro expresa la ansiedad de manera distinta. El usuario puede ajustar los pesos de cada comportamiento en el índice para reflejar el perfil de síntomas de su perro específico.

**Categoría:** `configuracion`, `mediciones`

**Dependencias técnicas:** T-PM-03 (cómputo de índice con pesos)

### Tareas

#### U-AP-03.1: Editor de pesos de comportamientos

- [ ] `BehaviorWeightEditor`:
  - Lista de comportamientos automáticos con:
    - Nombre y descripción
    - Peso actual (slider 0.0 – 1.0)
    - Peso default (marcado como referencia)
    - Severidad base (ícono: leve/moderado/severo)
  - Los pesos se normalizan para sumar 1.0 (el usuario mueve sliders, el sistema ajusta)
  - Botón "Reset to defaults"
  - Botón "Save" persiste los pesos en el perfil del perro

**Tests:**
- **[Automático]** Weight editor — Cambiar peso de ladrido de 0.20 a 0.30 → los demás pesos se renormalizan
- **[Automático]** Weight editor — Reset to defaults → todos los pesos vuelven a valores originales
- **[Manual]** Ajustar pesos → iniciar sesión → verificar que el breakdown refleja los nuevos pesos

#### U-AP-03.2: Vista previa del impacto

- [ ] Al ajustar pesos, mostrar impacto en sesiones pasadas:
  - "With these weights, your last session would score 62 instead of 58"
  - Mini-tabla: sesiones recientes con índice original vs índice con pesos nuevos
- [ ] Confirmación: "Apply these weights to future sessions only, or recalculate past sessions too?"

**Tests:**
- **[Automático]** Preview — Cambiar pesos → recalcula índices de últimas 3 sesiones correctamente
- **[Manual]** Ajustar peso de aullido al máximo → ver que sesiones con aullidos suben su índice significativamente

---

## Stage U-AP-04: Comparar Períodos

**Objetivo:** El usuario puede seleccionar dos períodos de tiempo (ej: "Semana 1-2" vs "Semana 5-6") y ver una comparación estadística detallada de cómo cambió la ansiedad de su perro.

**Categoría:** `mediciones`, `visualizacion`

**Dependencias técnicas:** T-PM-03 (analíticas), T-DB (queries de agregación)

### Tareas

#### U-AP-04.1: Selector de períodos

- [ ] `PeriodComparisonScreen`:
  - Selector de Período A: fecha inicio → fecha fin (date pickers)
  - Selector de Período B: fecha inicio → fecha fin
  - Presets rápidos: "Last 7 days", "Last 30 days", "This month vs Last month"
  - Validación: Período A y B no se solapan, cada uno debe tener al menos 2 sesiones

**Tests:**
- **[Automático]** Period picker — Seleccionar fechas válidas → botón "Compare" se habilita
- **[Automático]** Period picker — Períodos solapados → error de validación
- **[Manual]** Seleccionar "This month vs Last month" → los date pickers se llenan automáticamente

#### U-AP-04.2: Pantalla de comparación

- [ ] Vista side-by-side:
  ```
  ┌─────────────────────────────────────────────────┐
  │  Period A: Jun 1-14    │  Period B: Jun 15-28   │
  │                          │                        │
  │  Avg Anxiety: 71 /100   │  Avg Anxiety: 45 /100  │
  │  Std Dev: ±8            │  Std Dev: ±6           │
  │  Sessions: 5            │  Sessions: 5           │
  │                          │                        │
  │  Trend: IMPROVING ↓36% ✅                        │
  │                                                  │
  │  Behaviors that changed most:                    │
  │  • Howling:    -62%                              │
  │  • Barking:    -41%                              │
  │  • Pacing:     -28%                              │
  │  • Whining:    +5%  (no change)                  │
  └─────────────────────────────────────────────────┘
  ```
- [ ] Gráfico de barras: comparación por comportamiento (barra A vs barra B)
- [ ] Clasificación de tendencia: "Improving ✅" / "Worsening ⚠️" / "Stable ➡️"

**Tests:**
- **[Automático]** Comparison — Con datos de período conocidos, verifica promedios, stddev, y cambio %
- **[Automático]** Comparison — Período B peor que A → "Worsening ⚠️" con % negativo
- **[Manual]** Comparar dos períodos reales → verificar que los números y visualizaciones son correctos

#### U-AP-04.3: Compartir comparación

- [ ] Botón "Share" genera una imagen con el resumen de comparación
- [ ] Formato: cards visuales con los datos clave, diseñado para compartir con veterinario/etólogo
- [ ] Opción de exportar CSV con datos crudos de ambos períodos

**Tests:**
- **[Manual]** Tocar "Share" → se genera imagen con datos de comparación → compartir por WhatsApp/email

---

## Stage U-AP-05: Ver Tendencias y Progreso

**Objetivo:** El usuario puede visualizar la evolución temporal de la ansiedad de su perro en diferentes escalas (diaria, semanal, mensual) y ver si el tratamiento está funcionando.

**Categoría:** `visualizacion`, `mediciones`

**Dependencias técnicas:** T-PM-03 (analíticas)

### Tareas

#### U-AP-05.1: Gráficos de tendencia

- [ ] `TrendsScreen`:
  - **Gráfico de líneas**: índice de ansiedad en el tiempo
    - Toggle: vista diaria / semanal / mensual
    - Línea horizontal punteada: baseline
    - Línea de tendencia (regresión lineal simple)
    - Zonas de color de fondo: verde/amarillo/naranja/rojo según nivel
  - **Gráfico de barras**: frecuencia de cada comportamiento por semana
  - **Heatmap de calendario**: intensidad de ansiedad por día (color del día)

**Tests:**
- **[Automático]** Trend line — Datos: [70, 68, 65, 60, 58, 55, 50] → pendiente negativa, "Improving"
- **[Automático]** Calendar heatmap — Renderiza 30 días con colores correctos según índice
- **[Manual]** Navegar a Trends después de 2 semanas de uso → ver gráficos con datos reales

#### U-AP-05.2: Insights automáticos

- [ ] Sistema genera frases de insight basadas en los datos:
  - "Your dog's anxiety peaks between 2-4 PM on weekdays"
  - "Monday sessions consistently score higher than Friday sessions"
  - "Howling has decreased 62% since you started treatment"
  - "Your dog was calmest during the session on June 24 (index: 28)"
- [ ] Insights se muestran como cards en la pantalla de tendencias
- [ ] Insights se actualizan cuando hay datos nuevos

**Tests:**
- **[Automático]** Insights — Datos con pico a las 3PM → genera insight de horario pico
- **[Automático]** Insights — Sin suficientes datos → "Complete more sessions to unlock insights"
- **[Manual]** Ver insights después de 10 sesiones → los insights son relevantes y correctos

---

## Stage U-AP-06: Exportar Datos y Compartir

**Objetivo:** El usuario puede exportar los datos de ansiedad de su perro en formatos estándar (CSV, JSON) para compartir con su veterinario, etólogo, o para su propio análisis.

**Categoría:** `configuracion`

**Dependencias técnicas:** T-DB (queries de datos)

### Tareas

#### U-AP-06.1: Exportación de datos

- [ ] `ExportScreen`:
  - Seleccionar rango de fechas (todo / último mes / personalizado)
  - Seleccionar formato: CSV / JSON
  - Seleccionar qué exportar: sesiones + eventos / solo resúmenes / datos crudos
  - Vista previa de las primeras filas del export
  - Botón "Export" → generar archivo → compartir via system share sheet

**Tests:**
- **[Automático]** Export CSV — 5 sesiones → archivo CSV generado con headers correctos y 5 filas
- **[Automático]** Export JSON — Estructura JSON válida con arrays de sessions y events
- **[Manual]** Exportar datos de 1 mes → abrir CSV en computadora → verificar datos correctos

#### U-AP-06.2: Reporte para veterinario

- [ ] Plantilla de reporte "For your veterinarian":
  - Datos del perro (nombre, raza, edad, peso)
  - Período del reporte
  - Línea base y tendencia
  - Gráfico de evolución
  - Tabla de comparación de comportamientos
  - Espacio para notas del dueño
- [ ] Generar como PDF o imagen

**Tests:**
- **[Manual]** Generar reporte para veterinario → el PDF/JPEG contiene todos los datos relevantes y es profesional

---

## Dependency Reference

| This Stage | Depends On (Technical) | Description |
|---|---|---|
| U-AP-01 | T-PM-03, T-DB | View anxiety profile |
| U-AP-02 | T-PM-03 | Establish baseline |
| U-AP-03 | T-PM-03 | Adjust behavior weights |
| U-AP-04 | T-PM-03, T-DB | Compare periods |
| U-AP-05 | T-PM-03 | View trends |
| U-AP-06 | T-DB | Export data |

## Referenced Roadmaps

- [U-MON: Monitoring Experience](./monitoring-experience.md) — Sessions that feed the anxiety profile
- [T-PM: Passive Monitoring](../technical/passive-monitoring.md) — Technical foundation
