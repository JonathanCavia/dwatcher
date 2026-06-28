# T-VM: Video Monitoring (Technical)

Video monitoring is the second pillar of passive monitoring. This roadmap covers the complete camera and vision pipeline: from camera access to individual dog identification and behavior classification from video frames.

Referenced by: [T-PM: Passive Monitoring](./passive-monitoring.md)

---

## Stage T-VM-01: Acceso a la Cámara

**Objetivo:** La app puede abrir la cámara del dispositivo, mostrar un preview en pantalla, cambiar entre cámara frontal y trasera, y capturar frames individuales (snapshots).

**Categoría:** `vision`

**Dependencias:** T-PM-01 (servicio foreground y sesiones funcionando)

### Tareas

#### T-VM-01.1: Integrar `react-native-vision-camera`

- [ ] Instalar `react-native-vision-camera` via `npx expo install`
- [ ] Configurar permisos de cámara en `app.json` (`NSCameraUsageDescription`, `android.permission.CAMERA`)
- [ ] Solicitar permiso de cámara en runtime (primera apertura)
- [ ] Renderizar `<Camera>` component en `MonitoringScreen` con estilo full-screen o partial

**Tests:**
- **[Automático]** Camera permissions — `requestCameraPermission()` resuelve con `'granted'` después de que el usuario acepta
- **[Automático]** Camera component — Renderiza sin errores con permisos concedidos
- **[Manual]** Abrir la app, navegar a MonitoringScreen → se ve el preview de la cámara en tiempo real

#### T-VM-01.2: Implementar toggle cámara frontal/trasera

- [ ] Botón de toggle en `MonitoringScreen`
- [ ] Estado: `'front'` | `'back'`
- [ ] Cambiar dispositivo de cámara sin reiniciar el preview
- [ ] Persistir preferencia en AsyncStorage

**Tests:**
- **[Automático]** Camera toggle — `toggleCamera()` cambia `cameraFacing` state correctamente
- **[Manual]** Tocar botón de toggle → el preview cambia de cámara frontal a trasera sin flicker

#### T-VM-01.3: Implementar captura de snapshots

- [ ] `camera.current.takeSnapshot()` → guardar en directorio de documentos de la app
- [ ] Nombre de archivo: `snapshot_{sessionId}_{timestamp}.jpg`
- [ ] Trigger manual: botón en la UI
- [ ] Trigger automático: al detectar evento (conexión con T-PM-02)

**Tests:**
- **[Automático]** Snapshot — `takeSnapshot()` resuelve con `{ path: string, width: number, height: number }`
- **[Automático]** Snapshot — Archivo existe en filesystem después de captura
- **[Manual]** Tocar botón de snapshot → se guarda una foto y aparece miniatura en la UI

---

## Stage T-VM-02: Reconocer Presencia de un Perro

**Objetivo:** El sistema detecta si hay un perro presente en el frame de video, usando un modelo de object detection on-device (TFLite). Esto permite saber si el perro está en el área monitoreada.

**Categoría:** `vision`, `ml-pipeline`

**Dependencias:** T-VM-01 (cámara funcionando), T-ML-01 (pipeline TFLite)

### Tareas

#### T-VM-02.1: Integrar modelo de object detection para perros

- [ ] Seleccionar modelo: MobileNet SSD o EfficientDet-Lite (pre-entrenado en COCO, clase `dog`)
- [ ] Convertir a TFLite con cuantización INT8
- [ ] Cargar modelo en la app
- [ ] Configurar frame processor de `react-native-vision-camera` para ejecutar inferencia

**Tests:**
- **[Automático]** Dog detection — Frame con un perro visible → bounding box alrededor del perro
- **[Automático]** Dog detection — Frame sin perro → sin detecciones
- **[Automático]** Inference time — < 100ms por frame en dispositivo Android mid-range
- **[Manual]** Apuntar la cámara al perro → se dibuja un bounding box en el preview
- **[Manual]** Apuntar la cámara a una habitación vacía → sin bounding boxes

#### T-VM-02.2: Implementar tracking de presencia

- [ ] `DogPresenceTracker`:
  - Estado: `present` | `absent` | `unknown` (confianza baja)
  - Smoothing: se requieren N frames consecutivos con/sin detección para cambiar estado (evitar flicker)
  - Timeout: si no se detecta perro por >30s → `absent`
  - Evento `dog_presence_changed` emitido al sistema de eventos (T-PM-02)

**Tests:**
- **[Automático]** Presence tracker — 10 frames consecutivos con dog detection → `present`
- **[Automático]** Presence tracker — 10 frames consecutivos sin dog detection → `absent`
- **[Automático]** Presence tracker — 3 frames con, 1 sin, 6 con → se mantiene `present` (smoothing)
- **[Manual]** Perro entra y sale del frame → la UI refleja cambios de presencia en <2s

---

## Stage T-VM-03: Identificar un Perro Individual y Diferenciarlo de Otros

**Objetivo:** Dado un video del perro provisto por el usuario como referencia, el sistema puede identificar a ese perro específico en el frame y diferenciarlo de otros perros que puedan aparecer.

**Categoría:** `vision`, `dog-recognition`

**Dependencias:** T-VM-02 (detección de presencia canina)

### Tareas

#### T-VM-03.1: Implementar sistema de embedding visual del perro

- [ ] Usar MobileNet o EfficientNet como backbone para extraer embedding visual del perro
- [ ] Input: recorte del bounding box del perro detectado → embedding vector (128-d o 256-d)
- [ ] Fine-tuning con triplet loss en dataset de perros (mismo perro = distancia pequeña, distintos perros = distancia grande)
- [ ] Convertir modelo a TFLite

**Tests:**
- **[Automático]** Embedding — Dos fotos del mismo perro (distintos ángulos) → distancia coseno < 0.3
- **[Automático]** Embedding — Foto de perro A vs foto de perro B → distancia coseno > 0.7
- **[Manual]** Proveer 5 fotos de referencia del perro del usuario → embedding extraído correctamente

#### T-VM-03.2: Implementar registro de perro con video de referencia

- [ ] UI: `DogRegistrationScreen`
  - Usuario graba/elige un video corto (10-30s) del perro
  - Opción de subir video existente de la galería
  - Mostrar preview del video
- [ ] Pipeline de registro:
  - Extraer frames del video a 1fps
  - Detectar perro en cada frame (T-VM-02)
  - Extraer embedding de cada frame con perro visible
  - Calcular embedding de referencia: promedio de embeddings por frame
  - Almacenar embedding + metadata en SQLite (`dog_identities` table)

**Tests:**
- **[Automático]** Registration — Video de 10s con perro visible → al menos 5 embeddings extraídos
- **[Automático]** Registration — Video sin perro → error descriptivo, no crashea
- **[Manual]** Grabar video de referencia del perro → registro completa exitosamente, se muestra confirmación

#### T-VM-03.3: Implementar identificación en tiempo real

- [ ] `DogIdentifier` class:
  - Por cada frame con dog detection:
    - Recortar bounding box
    - Extraer embedding
    - Comparar (distancia coseno) contra embeddings de referencia de todos los perros registrados
    - Si distancia < threshold (0.4) → identificar como ese perro
    - Si distancia > threshold para todos → `unknown_dog`
  - Smoothing: identidad requiere N frames consecutivos con la misma clasificación
  - Emitir evento `dog_identified` con `dog_id` y `confidence`

**Tests:**
- **[Automático]** Dog identifier — Frame del perro registrado → `dog_id` correcto, `confidence > 0.8`
- **[Automático]** Dog identifier — Frame de perro no registrado → `unknown_dog`
- **[Automático]** Dog identifier — Frame con dos perros → ambos se clasifican independientemente
- **[Manual]** Con 2 perros en la casa, registrar ambos → durante monitoreo, cada uno se identifica correctamente

#### T-VM-03.4: Implementar UI de diferenciación visual

- [ ] En `MonitoringScreen`, cada bounding box muestra:
  - Nombre del perro (si identificado) o "Unknown"
  - Color distinto por perro (azul para perro 1, verde para perro 2)
  - Confidence de identificación
- [ ] Panel de estado: "Dog A: visible (92%)", "Dog B: not visible"

**Tests:**
- **[Manual]** Con dos perros visibles en cámara → se dibujan dos bounding boxes con nombres y colores distintos
- **[Manual]** Perro sale del frame y vuelve a entrar → se re-identifica con el mismo nombre

---

## Stage T-VM-04: Pose Estimation y Análisis de Movimiento

**Objetivo:** Estimar la pose del perro (keypoints) y analizar patrones de movimiento para detectar comportamientos motores: pacing (caminar de un lado a otro repetitivamente), zoomies (carreras frenéticas), y postura ansiosa (temblor, agachado).

**Categoría:** `vision`, `behavior-detection`

**Dependencias:** T-VM-02 (detección de perro en frame)

### Tareas

#### T-VM-04.1: Integrar modelo de pose estimation para perros

- [ ] Seleccionar modelo: MobileNet-based pose estimation (tipo MoveNet/AnimalPose)
- [ ] Fine-tunear en dataset de keypoints caninos (Stanford Dogs + anotaciones)
- [ ] Convertir a TFLite INT8
- [ ] Keypoints: nariz, ojos, orejas, hombros, codos, caderas, rodillas, patas, base de cola (~17 keypoints)

**Tests:**
- **[Automático]** Pose estimation — Frame con perro de perfil → keypoints detectados con confidence > 0.5
- **[Automático]** Pose estimation — Frame sin perro → sin keypoints
- **[Automático]** Inference time — < 50ms por frame
- **[Manual]** Mostrar keypoints superpuestos en el preview → siguen al perro al moverse

#### T-VM-04.2: Implementar detector de pacing

- [ ] `PacingDetector`:
  - Trackear posición del perro (centroide de keypoints) en los últimos N frames
  - Calcular path: secuencia de posiciones (x, y) normalizadas
  - Detectar patrón de ida y vuelta: la trayectoria cruza el mismo punto al menos 3 veces en dirección opuesta
  - Ventana de análisis: 10 segundos
  - Si patrón de ida y vuelta persiste >3 ciclos → `pacing`

**Tests:**
- **[Automático]** Pacing — Trayectoria sintética: (0,0)→(1,0)→(0,0)→(1,0)→(0,0) → `pacing`
- **[Automático]** Pacing — Trayectoria sintética: caminata aleatoria sin patrón repetitivo → sin detección
- **[Manual]** Grabar video del perro haciendo pacing → el sistema lo detecta

#### T-VM-04.3: Implementar detector de zoomies

- [ ] `ZoomiesDetector`:
  - Calcular velocidad del perro (desplazamiento del centroide / delta tiempo)
  - Calcular aceleración (cambio de velocidad)
  - Zoomies = velocidad alta (>umbral) + aceleración alta y errática + cambios de dirección frecuentes
  - Duración típica: bursts de 5-30 segundos
  - Si velocidad y aceleración superan umbrales por >3s → `zoomies`

**Tests:**
- **[Automático]** Zoomies — Trayectoria sintética con alta velocidad y cambios bruscos → `zoomies`
- **[Automático]** Zoomies — Caminata normal a velocidad constante → sin detección
- **[Manual]** Grabar video del perro teniendo zoomies → el sistema lo detecta

#### T-VM-04.4: Implementar detector de postura ansiosa (temblor / agachado)

- [ ] `AnxiousPostureDetector`:
  - Features:
    - Body height ratio: altura de hombros / altura esperada (perro agachado = ratio bajo)
    - Tail position: base de cola baja y estática → ansiedad
    - High-frequency jitter en keypoints → temblor
    - Ears back: orejas hacia atrás de forma sostenida
  - Clasificar cada frame: `normal` | `anxious_posture` | `trembling`
  - Smoothing: requiere ≥2s de postura ansiosa sostenida para emitir evento

**Tests:**
- **[Automático]** Posture — Keypoints con altura de hombros < 70% de baseline → `anxious_posture`
- **[Automático]** Posture — Keypoints con jitter de alta frecuencia (>5Hz) en todos los puntos → `trembling`
- **[Manual]** Grabar video de perro en postura ansiosa (confirmado por dueño) → el sistema lo detecta

---

## Stage T-VM-05: Clasificación de Comportamiento por Video

**Objetivo:** Integrar todas las señales visuales (presencia, identidad, pose, movimiento) en un clasificador unificado de comportamiento que emite eventos de alto nivel: `pacing`, `zoomies`, `anxious_posture`, `on_furniture`, `playing`, `resting`.

**Categoría:** `vision`, `behavior-detection`

**Dependencias:** T-VM-03 (identificación), T-VM-04 (pose y movimiento)

### Tareas

#### T-VM-05.1: Implementar clasificador unificado de comportamiento visual

- [ ] `VisualBehaviorClassifier`:
  - Input: presencia + identidad + pose keypoints + motion features
  - Reglas de clasificación (extensibles):
    - `pacing`: T-VM-04.2 activo
    - `zoomies`: T-VM-04.3 activo
    - `anxious_posture`: T-VM-04.4 activo
    - `on_furniture`: bounding box del perro overlap con bounding box de mueble (requiere T-VM-05.2)
    - `playing`: movimiento rápido + postura de juego (keypoints: cuartos traseros arriba, cola arriba)
    - `resting`: sin movimiento significativo por >60s + postura horizontal
  - Emitir `VisualBehaviorEvent` con tipo, confidence, timestamp, dog_id

**Tests:**
- **[Automático]** Classifier — Pacing keys + sin otros signals → `pacing`
- **[Automático]** Classifier — No motion por 60s + postura horizontal → `resting`
- **[Automático]** Classifier — Movimiento rápido + play posture → `playing`
- **[Manual]** Sesión de monitoreo real → los comportamientos detectados coinciden con lo que el dueño observa en el video

#### T-VM-05.2: Implementar detección de perro en muebles

- [ ] Fine-tunear detector de objetos para muebles: `sofa`, `bed`, `table`, `chair`
- [ ] En cada frame con perro detectado:
  - Verificar overlap (IoU) entre bounding box del perro y bounding box de muebles
  - Si IoU > 0.3 por >2s → `on_furniture`
  - Emitir evento con tipo de mueble

**Tests:**
- **[Automático]** Furniture — Frame con perro sobre sillón (IoU > 0.3) → `on_furniture` con tipo `sofa`
- **[Automático]** Furniture — Frame con perro en el piso (sin overlap con muebles) → sin evento
- **[Manual]** Perro se sube al sillón durante monitoreo → evento `on_furniture` detectado

---

## Stage T-VM-06: Identificación Visual por Video de Referencia

**Objetivo:** El usuario provee un video corto de su perro como referencia, y el sistema usa este video para entrenar/fine-tunear el modelo de identificación visual específico para ese perro.

**Categoría:** `vision`, `dog-recognition`

**Dependencias:** T-VM-03 (identificación por embedding)

### Tareas

#### T-VM-06.1: Optimizar pipeline de registro con video de referencia

- [ ] Mejorar T-VM-03.2 con:
  - Extracción de frames a 2fps (mejor cobertura de ángulos)
  - Filtrado de frames: solo frames donde el perro está bien iluminado y de frente/perfil
  - Data augmentation on-device: rotación, flip horizontal, ajuste de brillo
  - Calcular embedding de referencia como promedio ponderado (frames más nítidos pesan más)
- [ ] Múltiples videos de referencia (opcional): el usuario puede agregar más videos para mejorar accuracy

**Tests:**
- **[Automático]** Registration — Video de 20s → ≥15 frames válidos extraídos (iluminación OK, perro visible)
- **[Automático]** Registration — Agregar segundo video de referencia → embedding se actualiza, no se reemplaza
- **[Manual]** Registrar con 1 video → identificar en condiciones distintas (otro día, otra luz) → accuracy >70%

#### T-VM-06.2: Implementar verificación de calidad de video de referencia

- [ ] `ReferenceVideoValidator`:
  - Verificar que el video contiene un perro (usando T-VM-02)
  - Verificar duración mínima (10s)
  - Verificar variedad de ángulos (el perro se ve de frente, perfil, y en movimiento)
  - Verificar iluminación adecuada (no totalmente oscuro ni sobreexpuesto)
  - Feedback al usuario: "El video necesita mostrar al perro desde distintos ángulos" o "La iluminación es muy baja"

**Tests:**
- **[Automático]** Validator — Video de 5s → rechazado: "El video debe durar al menos 10 segundos"
- **[Automático]** Validator — Video sin perro → rechazado: "No se detectó un perro en el video"
- **[Manual]** Subir video que no cumple criterios → mensaje de feedback claro y accionable

---

## Dependency Reference

| This Stage | Depends On | Description |
|---|---|---|
| T-VM-01 | T-PM-01 | Camera access |
| T-VM-02 | T-VM-01, T-ML-01 | Dog presence detection |
| T-VM-03 | T-VM-02 | Individual dog identification |
| T-VM-04 | T-VM-02 | Pose estimation and movement |
| T-VM-05 | T-VM-03, T-VM-04 | Unified visual behavior classification |
| T-VM-06 | T-VM-03 | Reference video optimization |

## Referenced Roadmaps

- [T-PM: Passive Monitoring](./passive-monitoring.md) — Parent roadmap
- [T-AM: Audio Monitoring](./audio-monitoring.md) — Sibling pillar
- [T-ML: ML Pipeline](./ml-pipeline.md) — Model preparation and inference
