/**
 * Separation anxiety specific enums.
 *
 * These classify the observable behaviors associated with separation anxiety
 * in canines, along with their clinical severity.
 */

/**
 * Severity level of a separation anxiety behavior.
 * Based on clinical veterinary behavior literature (Overall, 2013;
 * Sherman & Mills, 2008).
 */
export enum SeverityLevel {
  /** Mild — noticeable but not harmful to the dog or environment */
  Mild = 'mild',
  /** Moderate — disruptive, may cause minor damage or stress */
  Moderate = 'moderate',
  /** Severe — harmful to the dog, environment, or indicates high distress */
  Severe = 'severe',
}

/**
 * Broad category of a separation anxiety behavior.
 * Used for grouping in the behavior catalog and analytics.
 */
export enum BehaviorCategory {
  /** Vocalizations: barking, howling, whining */
  Vocalization = 'vocalization',
  /** Motor behaviors: pacing, zoomies, trembling */
  Motor = 'motor',
  /** Elimination: inappropriate urination or defecation */
  Elimination = 'elimination',
  /** Destructive: chewing, scratching, breaking objects */
  Destructive = 'destructive',
  /** Spatial: counter-surfing, escaping, hiding */
  Spatial = 'spatial',
}

/**
 * Detection source for a behavior — how it is identified.
 */
export enum DetectionSource {
  /** Automatically detected via on-device audio ML */
  Audio = 'audio',
  /** Automatically detected via on-device vision ML */
  Vision = 'vision',
  /** Fused from both audio and vision */
  Multimodal = 'multimodal',
  /** Manual entry by the owner after reviewing the session */
  Manual = 'manual',
}
