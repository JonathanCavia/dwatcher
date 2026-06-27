import type { ActivityType } from '../enums/learning';
import type { CommunicationMethod } from './communication-method';
import type { DifficultyFactor } from './difficulty';

// ────────────────────────────────────────────
// Learning Session — unified container
// ────────────────────────────────────────────

/**
 * A learning session — the unified container for both training and
 * education activities.
 *
 * A single session can mix activities of different types:
 * e.g., LAT → Obedience → LAT → Desensitization.
 *
 * Each session has a date, optional duration, and a list of activities.
 */
export interface LearningSession {
  id: string;
  dogId: string;
  /** When the session took place */
  date: string; // ISO 8601
  /** Total session duration in minutes (nullable — can be filled later) */
  durationMinutes: number | null;
  /** Free-text notes about the session overall */
  notes: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ────────────────────────────────────────────
// Session Activity — one activity within a session
// ────────────────────────────────────────────

/**
 * A single activity performed within a learning session.
 *
 * Each activity references an exercise template and has a specific
 * type that determines what metrics are tracked in its repetitions.
 */
export interface SessionActivity {
  id: string;
  learningSessionId: string;
  /** The exercise template used (references Exercise.id) */
  exerciseId: string;
  /** The type of activity — determines which repetition type is used */
  activityType: ActivityType;
  /** Order of this activity within the session (1-based) */
  order: number;
  /** Communication methods used during this activity */
  communicationMethods: CommunicationMethod[];
  /** Free-text notes about this activity */
  notes: string | null;
}

// ────────────────────────────────────────────
// Repetition types — discriminated union by ActivityType
// ────────────────────────────────────────────

/**
 * Base fields shared by all repetition types.
 * Not exported — use the discriminated union `ActivityRepetition`.
 */
interface BaseRepetition {
  id: string;
  sessionActivityId: string;
  /** Order of this repetition within the activity (1-based) */
  order: number;
  /** Whether this repetition was successful (dog performed correctly) */
  success: boolean;
  /** Duration of this repetition in seconds */
  durationSeconds: number | null;
  /** Environmental difficulty factors for this repetition */
  difficulty: DifficultyFactor;
  /** Free-text observations */
  notes: string | null;
}

/**
 * Repetition for obedience exercises (sentado, quieto, junto, etc.).
 *
 * Progress variable: distance at which the dog responds to the command.
 * Example: "perro responde a 'quieto' a 5 metros en ambiente difícil"
 */
export interface ObedienceRepetition extends BaseRepetition {
  activityType: 'obedience';
  /** Whether the dog was rewarded for this repetition */
  rewarded: boolean;
  /** Response time in seconds (command → correct behavior) */
  responseTimeSeconds: number | null;
  /**
   * Progress variable — the measurable value being tracked.
   * For obedience, this is typically the distance (in meters)
   * at which the dog responds correctly.
   * Can also be used for other measurable variables like
   * duration of "stay", number of distractions, etc.
   */
  progressValue: number | null;
  /** Unit of the progress value (e.g., "m", "s", "steps") */
  progressUnit: string | null;
}

/**
 * Repetition for LAT (Look At That) exercises.
 *
 * Progress variable: stimulus distance at which the dog can observe
 * without reacting. Measured in meters.
 *
 * Intensity is derived from distance: closer = more intense.
 */
export interface LATRepetition extends BaseRepetition {
  activityType: 'lat';
  /** Distance from dog to stimulus in meters */
  stimulusDistanceMeters: number;
  /**
   * Intensity derived from distance (0.0 – 1.0).
   * Closer distance → higher intensity.
   * Can be auto-calculated or manually adjusted.
   */
  intensity: number;
  /** Whether the dog became sensitized (crossed tunnel threshold) */
  sensitized: boolean;
  /** Time in seconds to return to baseline after sensitization. null if not sensitized. */
  baselineRestoreTimeSeconds: number | null;
}

/**
 * Repetition for desensitization exercises (general stimulus exposure).
 *
 * Progress variable: distance/intensity at which the dog remains calm.
 */
export interface DesensitizationRepetition extends BaseRepetition {
  activityType: 'desensitization';
  /** Distance from dog to stimulus in meters (nullable for non-distance stimuli) */
  stimulusDistanceMeters: number | null;
  /** Intensity of the exposure (0.0 – 1.0) */
  intensity: number;
  /** Whether the dog became sensitized */
  sensitized: boolean;
  /** Time in seconds to return to baseline */
  baselineRestoreTimeSeconds: number | null;
}

/**
 * Repetition for absence exposure exercises.
 *
 * Progress variable: duration of absence the dog can tolerate.
 *
 * This is the bridge between education and separation anxiety monitoring.
 */
export interface AbsenceExposureRepetition extends BaseRepetition {
  activityType: 'absence_exposure';
  /** Duration of the absence period in seconds */
  absenceDurationSeconds: number;
  /** Intensity derived from duration (0.0 – 1.0). Longer = more intense. */
  intensity: number;
  /** Whether the dog vocalized during the absence */
  vocalizations: boolean;
  /** Whether the dog became sensitized */
  sensitized: boolean;
  /** Time in seconds to return to baseline */
  baselineRestoreTimeSeconds: number | null;
}

/**
 * Repetition for boundary setting exercises (respecting limits).
 *
 * Progress variable: response time to boundary cue.
 */
export interface BoundarySettingRepetition extends BaseRepetition {
  activityType: 'boundary_setting';
  /** Subjective intensity of the boundary challenge (0.0 – 1.0) */
  intensity: number;
  /** Response time in seconds (cue → respecting the boundary) */
  responseTimeSeconds: number | null;
}

/**
 * Repetition for custom / user-defined activity types.
 *
 * Uses a flexible metrics record for arbitrary data.
 * The `customTypeName` allows the user to label their activity.
 */
export interface CustomRepetition extends BaseRepetition {
  activityType: 'custom';
  /** User-defined name for this custom activity type */
  customTypeName: string;
  /** Measurable progress value (user-defined meaning) */
  progressValue: number | null;
  /** Unit of the progress value */
  progressUnit: string | null;
  /** Flexible key-value metrics for custom data */
  metrics: Record<string, number | string | boolean | null>;
}

/**
 * Discriminated union of all repetition types.
 *
 * Use the `activityType` discriminant to narrow:
 *
 * ```typescript
 * switch (rep.activityType) {
 *   case 'obedience':       // rep is ObedienceRepetition
 *   case 'lat':             // rep is LATRepetition
 *   case 'desensitization': // rep is DesensitizationRepetition
 *   case 'absence_exposure': // rep is AbsenceExposureRepetition
 *   case 'boundary_setting': // rep is BoundarySettingRepetition
 *   case 'custom':          // rep is CustomRepetition
 * }
 * ```
 */
export type ActivityRepetition =
  | ObedienceRepetition
  | LATRepetition
  | DesensitizationRepetition
  | AbsenceExposureRepetition
  | BoundarySettingRepetition
  | CustomRepetition;
