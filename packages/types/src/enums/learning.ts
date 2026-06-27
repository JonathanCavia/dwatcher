/**
 * Learning system enums — unified model for both Training and Education.
 *
 * A LearningSession can contain activities of any type, mixed freely.
 * Each activity type defines its own metrics and progress variables.
 */

/**
 * Broad category of a learning goal or activity.
 * Used for filtering and analytics.
 */
export enum LearningCategory {
  /** Adiestramiento — punctual, technical commands */
  Training = 'training',
  /** Educación — general behavior, impulse control, desensitization */
  Education = 'education',
}

/**
 * Types of activities that can be performed within a learning session.
 *
 * Each type has its own:
 * - Progress variable (what is being measured)
 * - Repetition metrics (what data is recorded per repetition)
 * - Difficulty model (what makes it harder or easier)
 *
 * Extensible: add new activity types without changing the session model.
 */
export enum ActivityType {
  // —— Training ——
  /** Ejercicio de obediencia — commands like "sit", "stay", "come" */
  Obedience = 'obedience',

  // —— Education ——
  /** Look At That — controlled observation of a stimulus */
  LAT = 'lat',
  /** General desensitization to a stimulus */
  Desensitization = 'desensitization',
  /** Controlled practice of being alone */
  AbsenceExposure = 'absence_exposure',
  /** Teaching spatial and social boundaries */
  BoundarySetting = 'boundary_setting',

  // —— Extensible ——
  /** User-defined activity type */
  Custom = 'custom',
}

/**
 * Communication modalities used during an activity.
 * Simplified: each method has a type and a free-text description.
 */
export enum CommunicationType {
  /** Comandos verbales — spoken words */
  Verbal = 'verbal',
  /** Gestos físicos corporales — body gestures */
  Physical = 'physical',
  /** Silbidos — whistles (short, long, double, etc.) */
  Whistle = 'whistle',
  /** Expresiones faciales */
  Facial = 'facial',
}
