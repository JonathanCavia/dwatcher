# T-AM: Audio Monitoring (Technical)

Audio monitoring is the first operational pillar of passive monitoring. This roadmap covers the complete audio pipeline: from raw PCM capture to high-level behavior classification and individual dog identification by voice.

Referenced by: [T-PM: Passive Monitoring](./passive-monitoring.md)

---

## Stage T-AM-01: Captura de Audio y Buffer Circular

**Objetivo:** La app captura audio PCM crudo del micrófono del dispositivo, lo almacena en un buffer circular thread-safe, y aplica resampling a 16kHz mono para el pipeline de ML.

**Categoría:** `audio`

**Dependencias:** T-PM-01 (servicio foreground funcionando)

### Tareas

#### T-AM-01.1: Configurar fuente de audio y callback PCM

- [ ] Configurar `@siteed/expo-audio-studio` con:
  - Audio source: `CAMCORDER` (para capturar en background)
  - Sample rate: 44100Hz (nativo del dispositivo)
  - Bit depth: 16-bit
  - Canales: mono
- [ ] Registrar callback PCM que dispara cada ~100ms con un `Int16Array`
- [ ] Verificar que el callback sigue funcionando con la app en background

**Tests:**
- **[Automático]** PCM callback — Frecuencia de callback es 8-12 por segundo (cada ~100ms)
- **[Automático]** PCM callback — `Int16Array.length > 0` en cada callback
- **[Manual]** Iniciar captura, poner app en background por 2 minutos, verificar que se recibieron callbacks durante todo el período

#### T-AM-01.2: Implementar buffer circular thread-safe

- [ ] Implementar `CircularBuffer` class:
  - Capacidad: 3 segundos de audio a 16kHz = 48,000 samples
  - `write(samples: Int16Array): void` — thread-safe
  - `read(durationMs: number): Float32Array` — lee los últimos N ms
  - Sobrescritura de datos viejos cuando el buffer está lleno
- [ ] Manejar concurrencia: write desde thread de audio, read desde thread de ML

**Tests:**
- **[Automático]** `CircularBuffer` — Escribir 1000 samples, leer 500ms → datos correctos
- **[Automático]** `CircularBuffer` — Escribir más que la capacidad → datos viejos se sobrescriben, no crashea
- **[Automático]** `CircularBuffer` — Lectura concurrente mientras se escribe → sin race conditions
- **[Automático]** `CircularBuffer` — Leer más samples de los disponibles → retorna lo que hay, no crashea

#### T-AM-01.3: Implementar resampling 44.1kHz → 16kHz

- [ ] Implementar `resample44kTo16k(samples: Int16Array): Float32Array`
- [ ] Usar interpolación lineal con factor de resampling racional
- [ ] Aplicar filtro anti-aliasing low-pass antes del diezmado (cutoff: 8kHz)
- [ ] Convertir `Int16` → `Float32` normalizado [-1.0, 1.0]

**Tests:**
- **[Automático]** Resampling — Input: 4410 samples @ 44.1kHz (100ms) → output: 1600 samples @ 16kHz
- **[Automático]** Resampling — Tono puro de 1kHz @ 44.1kHz → resampleado a 16kHz, la frecuencia se preserva
- **[Automático]** Resampling — Señal de silencio → output es silencio (valores ≈ 0)

---

## Stage T-AM-02: Detección de Ladridos en Audio

**Objetivo:** Detectar ladridos caninos en el flujo de audio usando ML on-device (YAMNet + TFLite), con ≥80% de precisión en ambientes silenciosos y tasa de falsos positivos <5%.

**Categoría:** `audio`, `ml-pipeline`, `behavior-detection`

**Dependencias:** T-AM-01 (buffer circular funcionando), T-ML-01 (modelo YAMNet preparado)

### Tareas

#### T-AM-02.1: Implementar extracción de features (mel-spectrogram)

- [ ] Implementar `computeMelSpectrogram(pcm: Float32Array, sampleRate: 16000)`:
  - Hann window, tamaño de ventana 512 samples (32ms), hop 160 samples (10ms)
  - STFT via FFT real de 512 puntos
  - 64 mel bands entre 125Hz y 7500Hz
  - Log-compression: `log(mel_energy + 1e-6)`
  - Output shape: [96, 64] (96 time frames, 64 frequency bins) para 0.96s de audio
- [ ] Extraer ventana de 0.96s del buffer circular cada 500ms (50% overlap)

**Tests:**
- **[Automático]** Mel-spectrogram — Input: 0.96s de silencio → output: matriz de valores cercanos a log(1e-6)
- **[Automático]** Mel-spectrogram — Input: tono puro de 1kHz → output: energía concentrada en bins correspondientes a ~1kHz
- **[Automático]** Mel-spectrogram — Output shape es [96, 64] para input de exactamente 0.96s @ 16kHz
- **[Automático]** Mel-spectrogram — Comparar contra referencia de `librosa.feature.melspectrogram` con mismos parámetros → error < 5%

#### T-AM-02.2: Implementar pipeline de inferencia YAMNet → TFLite

- [ ] Cargar modelo `yamnet_bark_int8.tflite` desde assets
- [ ] Agregar batch dimension al mel-spectrogram: [1, 96, 64, 1]
- [ ] Ejecutar `interpreter.run(inputTensor)` → logits
- [ ] Aplicar softmax para obtener distribución de probabilidad
- [ ] Extraer clase top-1 y su confidence

**Tests:**
- **[Automático]** Inference — Audio de ladrido conocido → `className = 'bark'`, `confidence > 0.7`
- **[Automático]** Inference — Audio de silencio → `className = 'silence'`, `confidence(bark) < 0.3`
- **[Automático]** Inference — Tiempo de inferencia <50ms en dispositivo Android mid-range
- **[Manual]** Grabar 10 ladridos reales del perro del usuario → ≥8/10 detectados como `bark` con confidence > 0.7

#### T-AM-02.3: Implementar post-procesamiento: thresholding y cooldown

- [ ] `applyThreshold(result, threshold: 0.7)`: filtrar detecciones bajo confidence
- [ ] `applyCooldown(className, lastDetectionTime, cooldownMs: 5000)`: evitar eventos duplicados en ventana de 5s
- [ ] Onset detection: comparar energía del frame actual contra rolling average de 1s
- [ ] `DetectionResult` type: `{ className, confidence, timestamp, duration_ms, peakAmplitude }`

**Tests:**
- **[Automático]** Threshold — confidence 0.5 con threshold 0.7 → no se emite evento
- **[Automático]** Threshold — confidence 0.85 con threshold 0.7 → se emite evento
- **[Automático]** Cooldown — Dos detecciones de `bark` con 2s de diferencia → solo se emite la primera
- **[Automático]** Cooldown — Dos detecciones de `bark` con 10s de diferencia → ambas se emiten
- **[Automático]** Onset detection — Audio subiendo de silencio a ladrido → detecta onset correctamente

---

## Stage T-AM-03: Detección de Aullidos en Audio

**Objetivo:** Extender el pipeline de clasificación para detectar aullidos caninos, diferenciándolos de ladridos y otros sonidos, con ≥80% de precisión.

**Categoría:** `audio`, `ml-pipeline`, `behavior-detection`

**Dependencias:** T-AM-02 (detección de ladridos funcionando), T-ML-02 (modelo multi-clase)

### Tareas

#### T-AM-03.1: Extender modelo a clasificación multi-clase

- [ ] Fine-tunear YAMNet con clases: `bark`, `howl`, `whine`, `growl`, `silence`, `other`
- [ ] Recolectar/curar dataset de aullidos: 500+ samples de distintas razas y entornos
- [ ] Balancear dataset para evitar sesgo hacia `bark`
- [ ] Convertir modelo multi-clase a TFLite INT8

**Tests:**
- **[Automático]** Modelo multi-clase — Audio de aullido → `className = 'howl'`, `confidence > 0.7`
- **[Automático]** Modelo multi-clase — Audio de ladrido → `className = 'bark'`, `confidence(howl) < 0.2`
- **[Automático]** Modelo multi-clase — Audio de quejido → `className = 'whine'`, `confidence > 0.6`
- **[Manual]** Grabar 5 aullidos reales del perro del usuario → ≥4/5 detectados como `howl`

#### T-AM-03.2: Implementar thresholds y cooldowns por clase

- [ ] Thresholds independientes por clase: `bark=0.7`, `howl=0.7`, `whine=0.6`, `growl=0.65`
- [ ] Cooldowns independientes por clase: cada clase tiene su propio timer de 5s
- [ ] Dos clases pueden disparar simultáneamente si ambas superan su threshold (ej: bark + howl overlap)

**Tests:**
- **[Automático]** Per-class cooldown — Ladrido en t=0s, aullido en t=2s → ambos se emiten (clases distintas)
- **[Automático]** Per-class cooldown — Ladrido en t=0s, ladrido en t=2s → solo el primero se emite
- **[Automático]** Per-class threshold — Audio ambiguo con `bark=0.5, howl=0.4` → ningún evento emitido

---

## Stage T-AM-04: Detección de Carreras y Zoomies en Audio

**Objetivo:** Detectar patrones acústicos asociados a movimiento rápido: uñas sobre superficie dura, carreras frenéticas (zoomies), saltos y caídas, diferenciándolos de pasos normales.

**Categoría:** `audio`, `behavior-detection`

**Dependencias:** T-AM-02 (pipeline de features funcionando)

### Tareas

#### T-AM-04.1: Investigar y diseñar features para detección de movimiento por audio

- [ ] Investigar características acústicas de:
  - Uñas sobre madera/cerámica (ritmo rápido e irregular)
  - Saltos desde muebles (impulso transitorio de baja frecuencia)
  - Zoomies (secuencia de bursts de alta frecuencia)
- [ ] Evaluar features candidatas:
  - Spectral flux (cambios rápidos en espectro)
  - Onset strength (ataques transitorios)
  - High-frequency energy ratio (>4kHz / total)
  - Eventos por segundo (tasa de bursts acústicos)
- [ ] Documentar hallazgos y seleccionar combinación de features

**Tests:**
- **[Manual]** Grabar 3 sesiones de zoomies del perro del usuario → verificar que los features seleccionados muestran diferencia clara vs pasos normales
- **[Manual]** Grabar 3 sesiones de pasos normales → verificar baja activación en features de movimiento

#### T-AM-04.2: Implementar detector de movimiento por audio

- [ ] Implementar `MotionAudioDetector`:
  - Computar spectral flux en ventanas de 100ms
  - Contar onsets por segundo (onset detection function)
  - Si onsets/segundo > threshold durante ≥3s → `running`
  - Si onsets/segundo > threshold alto durante ≥5s y patrón irregular → `zoomies`
  - Si impulso transitorio aislado de baja frecuencia → `jump`
- [ ] Integrar con sistema de eventos unificado (T-PM-02)

**Tests:**
- **[Automático]** Motion detector — Audio sintético con bursts rítmicos a 4Hz → `running`
- **[Automático]** Motion detector — Audio sintético con bursts irregulares de alta intensidad → `zoomies`
- **[Automático]** Motion detector — Audio de silencio → sin detección de movimiento
- **[Manual]** Reproducir grabación de zoomies reales → el detector clasifica correctamente

---

## Stage T-AM-05: Distinguir Sonidos de Juego vs Ansiedad

**Objetivo:** Clasificar vocalizaciones caninas según su contexto emocional: juego/excitación vs ansiedad/estrés, basándose en características acústicas (no en contenido semántico).

**Categoría:** `audio`, `behavior-detection`

**Dependencias:** T-AM-03 (detección multi-clase), T-AM-04 (detección de movimiento)

### Tareas

#### T-AM-05.1: Investigar marcadores acústicos de estrés vs juego en perros

- [ ] Revisar literatura científica sobre vocalización canina y emociones
- [ ] Identificar features diferenciadoras potenciales:
  - F0 (frecuencia fundamental): más alta en estrés
  - Jitter y shimmer (variabilidad de pitch y amplitud): mayores en estrés
  - Duración de vocalización: más corta y repetitiva en estrés
  - Formantes: distribución diferente entre estados emocionales
  - Harmonic-to-noise ratio: menor en vocalizaciones estresadas (más ruido)
  - Tasa de vocalización: contexto dependiente
- [ ] Evaluar features con dataset etiquetado (grabaciones de dueños que identificaron contexto)

**Tests:**
- **[Manual]** Proveer 10 grabaciones del perro jugando y 10 grabaciones del perro con ansiedad (etiquetadas por el dueño) → ≥80% de separabilidad con features seleccionadas

#### T-AM-05.2: Implementar clasificador de contexto emocional

- [ ] `EmotionContextClassifier`:
  - Input: secuencia de eventos de audio en ventana de 30s
  - Features: F0 stats, jitter, shimmer, duration stats, HNR, vocalization rate
  - Output: `play` | `anxiety` | `uncertain`
  - Confidence basada en distancia a hiperplano de clasificación
- [ ] Reglas heurísticas como fallback:
  - Alta tasa de vocalización + presencia de zoomies → `play`
  - Vocalizaciones aisladas + baja tasa + alta variabilidad de pitch → `anxiety`

**Tests:**
- **[Automático]** Emotion classifier — Secuencia: bark(3s), bark(5s), bark(8s), zoomies(4-10s), bark(12s) → `play`
- **[Automático]** Emotion classifier — Secuencia: howl(0s), silencio(5s), howl(8s), whine(12s), silencio → `anxiety`
- **[Automático]** Emotion classifier — Solo un bark aislado en 30s → `uncertain`
- **[Manual]** Sesión real de monitoreo con perro jugando → ≥70% de ventanas clasificadas como `play`
- **[Manual]** Sesión real con perro ansioso (dueño confirma) → ≥70% clasificado como `anxiety`

---

## Stage T-AM-06: Huella de Vocalización Canina (Audio Fingerprint)

**Objetivo:** Identificar a un perro individual por sus vocalizaciones, sin depender de video. Crear una "huella" acústica basada en características espectrales consistentes del ladrido, quejido, y aullido del perro.

**Categoría:** `audio`, `dog-recognition`

**Dependencias:** T-AM-03 (detección multi-clase funcionando)

### Tareas

#### T-AM-06.1: Investigar viabilidad de identificación canina por audio

- [ ] Revisar literatura sobre speaker identification aplicada a vocalizaciones animales
- [ ] Identificar features candidatas para identificación individual:
  - MFCCs (Mel-Frequency Cepstral Coefficients) — efectivos en identificación de voz humana y animal
  - Formantes (F1, F2, F3) — dependen de anatomía del tracto vocal
  - Pitch contour — patrón de subida/bajada característico
  - Spectral envelope — forma general del espectro
  - Duración típica de vocalización
- [ ] Determinar si es viable con ≤10 samples de referencia por perro
- [ ] Determinar si el enfoque de audio-only es suficiente o si se requiere video como complemento

**Tests:**
- **[Manual]** Grabar 10 ladridos de cada uno de 2-3 perros distintos → evaluar separabilidad visual y estadística de features
- **[Manual]** Determinar tasa de false match / false non-match con los datos recolectados

#### T-AM-06.2: Implementar sistema de fingerprinting por vocalización

- [ ] `BarkFingerprint` extractor:
  - Por cada evento de vocalización, computar vector de features: MFCCs (13 coeffs) + delta + delta-delta + formantes + duración
  - Normalizar por nivel de volumen
- [ ] `DogVoiceIdentifier`:
  - Por cada perro registrado, almacenar N fingerprints de referencia
  - Matching: distancia euclidiana en espacio de features entre fingerprint del evento y fingerprints de referencia
  - Threshold de identidad determinado empíricamente
  - Si la distancia al vecino más cercano es < threshold → identificar; si no → `unknown`

**Tests:**
- **[Automático]** Fingerprint — Dos ladridos del mismo perro → distancia < threshold
- **[Automático]** Fingerprint — Ladrido de perro A vs ladrido de perro B → distancia > threshold
- **[Manual]** Registrar perro con 10 ladridos de referencia → grabar 10 ladridos nuevos del mismo perro → ≥8/10 identificados correctamente
- **[Manual]** Grabar 10 ladridos de un perro no registrado → 0/10 identificados como un perro conocido

---

## Stage T-AM-07: Investigación de Robustez y Estrategia de Integración

**Objetivo:** Determinar la estrategia óptima para detección robusta de comportamiento: audio-only, video-only, audio+video fusionados, o ambos enfoques en paralelo con selección dinámica. Documentar la decisión y su justificación.

**Categoría:** `audio`, `behavior-detection`

**Dependencias:** T-AM-06 (fingerprinting por audio), T-VM-03 (identificación por video), T-VM-05 (clasificación visual de comportamiento)

### Tareas

#### T-AM-07.1: Evaluar enfoque Audio-Only

- [ ] Ventajas:
  - Funciona con el perro fuera de cámara
  - Menor consumo de batería (no requiere cámara)
  - Menor carga de CPU/GPU
  - Privacidad (no se graba video)
- [ ] Desventajas:
  - No puede detectar comportamientos silenciosos (pacing, postura ansiosa)
  - Ambigüedad en fuente de sonido (¿fue mi perro o el del vecino?)
  - Difícil distinguir juego de ansiedad sin contexto visual
  - Fingerprinting de audio menos confiable que reconocimiento visual

**Tests:**
- **[Manual]** Sesión de monitoreo audio-only de 30min → comparar detecciones contra ground truth (grabación de video para verificación manual)

#### T-AM-07.2: Evaluar enfoque Video + Audio Fusionados

- [ ] Ventajas:
  - Audio resuelve lo que video no puede (perro fuera de vista pero audible)
  - Video resuelve lo que audio no puede (comportamientos silenciosos, identidad visual)
  - Fusión temporal permite matching de fuente → reduce falsos positivos
  - Identificación visual más confiable que fingerprinting de audio
- [ ] Desventajas:
  - Mayor consumo de batería (cámara + micrófono + doble pipeline ML)
  - Mayor complejidad de implementación
  - Requiere que el perro esté en campo visual de la cámara parte del tiempo

**Tests:**
- **[Manual]** Sesión de monitoreo audio+video de 30min → comparar detecciones fusionadas contra audio-only y video-only → fusión supera a ambos canales individuales

#### T-AM-07.3: Evaluar enfoque Dual (ambos sistemas en paralelo)

- [ ] Arquitectura:
  - Pipeline de audio y pipeline de video corren independientemente
  - Cada uno produce eventos con confidence
  - Motor de fusión corre como capa superior (T-PM-04)
  - Si un canal no está disponible (cámara tapada, perro fuera de vista), el otro canal sigue funcionando
- [ ] Modo "Audio Only" como fallback cuando:
  - Batería < 20%
  - Cámara obstruida
  - Usuario configura "Privacy Mode"

**Tests:**
- **[Manual]** Sesión con cámara tapada a los 15min → el sistema sigue detectando por audio sin degradación
- **[Manual]** Sesión con micrófono silenciado → el sistema sigue detectando movimiento y postura por video

#### T-AM-07.4: Documentar decisión de arquitectura

- [ ] Escribir documento de decisión técnica (ADR) en `docs/decisions/`
- [ ] Incluir:
  - Opciones consideradas (audio-only, video+audio, dual)
  - Criterios de evaluación: precisión, cobertura, consumo de batería, complejidad, privacidad
  - Decisión final con justificación
  - Plan de migración si se cambia de enfoque en el futuro

**Tests:**
- **[N/A]** Documento revisado y aprobado por el equipo

---

## Dependency Reference

| This Stage | Depends On | Description |
|---|---|---|
| T-AM-01 | T-PM-01 | Audio capture foundation |
| T-AM-02 | T-AM-01, T-ML-01 | Bark detection |
| T-AM-03 | T-AM-02, T-ML-02 | Multi-class vocalization |
| T-AM-04 | T-AM-02 | Movement detection from audio |
| T-AM-05 | T-AM-03, T-AM-04 | Play vs anxiety classification |
| T-AM-06 | T-AM-03 | Audio fingerprinting |
| T-AM-07 | T-AM-06, T-VM-03, T-VM-05 | Robustness strategy |

## Referenced Roadmaps

- [T-PM: Passive Monitoring](./passive-monitoring.md) — Parent roadmap
- [T-VM: Video Monitoring](./video-monitoring.md) — Sibling pillar
- [T-ML: ML Pipeline](./ml-pipeline.md) — Model preparation and inference
