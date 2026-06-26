import { DetectionClass, AnxietyFactor } from '@dwatcher/types';
import { DETECTION_CLASS_LABELS } from './inference';

/**
 * Apply softmax to raw model logits to obtain class probabilities.
 */
export function applySoftmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > max) {
      max = logits[i];
    }
  }

  let sum = 0;
  const expValues = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    expValues[i] = Math.exp(logits[i] - max);
    sum += expValues[i];
  }

  for (let i = 0; i < expValues.length; i++) {
    expValues[i] /= sum;
  }

  return expValues;
}

/**
 * Get the class with the highest probability score.
 */
export function getTopClass(probabilities: Float32Array): {
  classIndex: number;
  className: DetectionClass;
  confidence: number;
} {
  let topIdx = 0;
  let topScore = probabilities[0];

  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > topScore) {
      topScore = probabilities[i];
      topIdx = i;
    }
  }

  return {
    classIndex: topIdx,
    className: DETECTION_CLASS_LABELS[topIdx] ?? DetectionClass.Other,
    confidence: topScore,
  };
}

/**
 * Determine if a detection class indicates a bark event.
 */
export function isBarkEvent(detectionClass: DetectionClass): boolean {
  return (
    detectionClass === DetectionClass.Bark ||
    detectionClass === DetectionClass.Whine ||
    detectionClass === DetectionClass.Growl ||
    detectionClass === DetectionClass.Howl
  );
}

/**
 * Compute a composite anxiety score from contributing factors and recent event history.
 *
 * Stub — full implementation would use a weighted formula or secondary model.
 *
 * @param factors - Array of detected anxiety factors
 * @param recentEventCount - Number of recent vocalization events
 * @returns Composite anxiety score between 0.0 and 1.0
 */
export function computeAnxietyScore(factors: AnxietyFactor[], recentEventCount: number): number {
  if (factors.length === 0 && recentEventCount === 0) {
    return 0;
  }

  let score = 0;

  // Base score from factor types
  for (const factor of factors) {
    switch (factor) {
      case AnxietyFactor.Whining:
        score += 0.2;
        break;
      case AnxietyFactor.Pacing:
        score += 0.3;
        break;
      case AnxietyFactor.ExcessiveBarking:
        score += 0.25;
        break;
      case AnxietyFactor.DestructiveBehavior:
        score += 0.4;
        break;
      case AnxietyFactor.Vocalization:
        score += 0.2;
        break;
    }
  }

  // Amplify by recent events
  score += Math.min(recentEventCount * 0.05, 0.3);

  return Math.min(score, 1.0);
}
