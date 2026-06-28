# T-ML: ML Pipeline (Technical)

The ML pipeline roadmap covers the complete model lifecycle: YAMNet fine-tuning for canine vocalization, TFLite conversion with INT8 quantization, feature extraction (mel-spectrogram), inference pipeline, multi-class classification, and model versioning.

> **Note:** This roadmap is a placeholder. Detailed stages will be defined based on [ML-PIPELINE.md](../../ML-PIPELINE.md) and the specific requirements from [T-AM: Audio Monitoring](./audio-monitoring.md) and [T-VM: Video Monitoring](./video-monitoring.md).

## Planned Stages

| Stage | Objective | Category |
|---|---|---|
| T-ML-01 | Preparar modelo YAMNet fine-tuned para ladridos y convertir a TFLite INT8 | `ml-pipeline` |
| T-ML-02 | Extender a clasificación multi-clase (bark, howl, whine, growl, silence) | `ml-pipeline` |
| T-ML-03 | Model registry con versionado, validación de compatibilidad, y fallback | `ml-pipeline` |
| T-ML-04 | Pipeline de feature extraction (mel-spectrogram, STFT, Hann window) | `ml-pipeline`, `audio` |
| T-ML-05 | Modelo de object detection para perros (MobileNet SSD / EfficientDet-Lite) | `ml-pipeline`, `vision` |
| T-ML-06 | Modelo de pose estimation canina (keypoints) | `ml-pipeline`, `vision` |
| T-ML-07 | Modelo de embedding visual para identificación individual | `ml-pipeline`, `dog-recognition` |
| T-ML-08 | Optimización on-device: quantization, delegados GPU/NNAPI, medición de latencia | `ml-pipeline` |

## Dependencies

- T-ML depends on no other technical roadmaps (it's a leaf dependency)
- T-AM and T-VM depend on T-ML for model availability

## Referenced By

- [T-AM: Audio Monitoring](./audio-monitoring.md) — Uses YAMNet models
- [T-VM: Video Monitoring](./video-monitoring.md) — Uses vision models
- [T-PM: Passive Monitoring](./passive-monitoring.md) — Uses ML pipeline for detection
