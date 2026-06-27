/**
 * Difficulty model — captures *why* a repetition was easier or harder.
 *
 * This enables scientific comparison: two repetitions of the same
 * activity can only be compared fairly if we account for environmental
 * difficulty factors (dificultores).
 */

/**
 * A difficulty preset — a saved combination of location + time of day
 * that the user considers a "similar environment" for comparisons.
 *
 * Presets allow the user to quickly tag repetitions without re-entering
 * the same location/time each time.
 *
 * Examples:
 * - "Casa - Living, Mañana"
 * - "Plaza, Media tarde"
 * - "Veterinaria"
 */
export interface DifficultyPreset {
  id: string;
  /** User-assigned label */
  name: string;
  /** Physical location */
  location: string;
  /** Time of day descriptor (free text: "mañana", "tarde", "noche", "14:00") */
  timeOfDay: string;
  /**
   * User-assigned base difficulty level for this preset (0.0 – 1.0).
   * 0 = easiest, 1 = hardest.
   */
  baseDifficulty: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Difficulty factors recorded for a single repetition.
 *
 * Captures the environmental conditions that affected difficulty.
 * Can reference a preset or be entered ad-hoc.
 */
export interface DifficultyFactor {
  /** Optional reference to a saved preset */
  presetId: string | null;
  /** Physical location (if not using preset or overriding) */
  location: string | null;
  /** Time of day (if not using preset or overriding) */
  timeOfDay: string | null;
  /**
   * User-assigned difficulty level for this specific repetition (0.0 – 1.0).
   * 0 = easiest conditions, 1 = hardest conditions.
   *
   * When using a preset, this can be adjusted up/down from the preset's base.
   */
  difficultyLevel: number;
  /** Free-text notes about what made this repetition harder or easier */
  notes: string | null;
}
