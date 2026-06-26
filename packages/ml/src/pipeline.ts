import type { DetectionClass, AnxietyFactor } from '@dwatcher/types';
import { int16ToFloat32, resamplePcm, computeRms } from '@dwatcher/audio';
import type { TFLiteModel, InferenceResult } from './inference';
import { runInference } from './inference';
import { applySoftmax, getTopClass, isBarkEvent, computeAnxietyScore } from './postprocess';

/**
 * Configuration for the classification pipeline.
 */
export interface PipelineConfig {
  /** Minimum confidence threshold for a detection to be reported (0.0 – 1.0). */
  detectionThreshold: number;
  /** Cooldown period in ms to prevent duplicate events. */
  cooldownMs: number;
  /** Expected sample rate for model input. */
  targetSampleRate: number;
}

const DEFAULT_CONFIG: PipelineConfig = {
  detectionThreshold: 0.5,
  cooldownMs: 3000,
  targetSampleRate: 16000,
};

/**
 * Result of a single classification pass.
 */
export interface ClassificationResult {
  detected: boolean;
  detectionClass: DetectionClass | null;
  confidence: number;
  anxietyScore: number;
  rms: number;
  inferenceMs: number;
}

/**
 * Main classification pipeline: audio → features → inference → post-processing.
 *
 * Orchestrates the full ML inference workflow for bark/behavior detection.
 */
export class ClassificationPipeline {
  private model: TFLiteModel | null = null;
  private config: PipelineConfig;
  private lastDetectionTime = 0;
  private recentEventCount = 0;

  constructor(config?: Partial<PipelineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the model to use for inference.
   */
  setModel(model: TFLiteModel): void {
    this.model = model;
  }

  /**
   * Update pipeline configuration.
   */
  configure(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Process a raw audio buffer through the full pipeline.
   *
   * @param audioBuffer - Raw 16-bit PCM audio samples
   * @param sampleRate - Sample rate of the input buffer
   * @returns Classification result
   */
  async process(audioBuffer: Int16Array, sampleRate: number): Promise<ClassificationResult> {
    if (!this.model) {
      throw new Error('No model set. Call setModel() before process().');
    }

    // 1. Resample to target sample rate
    const resampled = resamplePcm(audioBuffer, sampleRate, this.config.targetSampleRate);

    // 2. Convert to float
    const floatSamples = int16ToFloat32(resampled);

    // 3. Compute volume (for auxiliary analysis)
    const rms = computeRms(floatSamples);

    // 4. Run inference
    let inferenceResult: InferenceResult;
    try {
      inferenceResult = await runInference(this.model, floatSamples);
    } catch {
      return {
        detected: false,
        detectionClass: null,
        confidence: 0,
        anxietyScore: 0,
        rms,
        inferenceMs: 0,
      };
    }

    // 5. Apply softmax and get top class
    const probabilities = applySoftmax(inferenceResult.output);
    const topClass = getTopClass(probabilities);

    // 6. Check detection threshold and cooldown
    const now = Date.now();
    const inCooldown = now - this.lastDetectionTime < this.config.cooldownMs;

    const detected = topClass.confidence >= this.config.detectionThreshold && !inCooldown;

    if (detected) {
      this.lastDetectionTime = now;
      if (isBarkEvent(topClass.className)) {
        this.recentEventCount++;
      }
    }

    // 7. Compute anxiety score (periodic, not every frame)
    const anxietyScore = computeAnxietyScore(
      this.getDetectedFactors(topClass.className),
      this.recentEventCount,
    );

    return {
      detected,
      detectionClass: detected ? topClass.className : null,
      confidence: topClass.confidence,
      anxietyScore,
      rms,
      inferenceMs: inferenceResult.inferenceMs,
    };
  }

  /**
   * Reset pipeline state (cooldown, event count).
   */
  reset(): void {
    this.lastDetectionTime = 0;
    this.recentEventCount = 0;
  }

  private getDetectedFactors(_className: DetectionClass): AnxietyFactor[] {
    // Stub: return empty factors; full implementation maps detection class to factors
    return [];
  }
}
