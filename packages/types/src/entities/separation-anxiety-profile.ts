/**
 * Per-dog separation anxiety profile.
 *
 * This profile ties together the three pillars of the app:
 * 1. Passive monitoring (behavior detection sessions)
 * 2. Active training (adiestramiento)
 * 3. Behavior education (educación — LAT, absence exposure, etc.)
 *
 * It tracks the dog's baseline anxiety index, custom behavior weights,
 * and provides the foundation for treatment response measurement over time.
 */
export interface SeparationAnxietyProfile {
  id: string;
  dogId: string;

  /**
   * Baseline anxiety index (0–100) established from the first
   * N monitoring sessions. Used as the reference point for
   * measuring treatment response.
   *
   * null until baseline is established (typically 3–5 sessions).
   */
  baselineAnxietyIndex: number | null;

  /** Number of monitoring sessions used to establish the baseline */
  baselineSessionCount: number;

  /** Whether enough sessions have been recorded to establish baseline */
  baselineEstablished: boolean;

  /**
   * Custom weight overrides for each behavior in the catalog.
   * Key = BehaviorCatalogEntry.id, Value = custom weight (0.0 – 1.0).
   *
   * Allows owners and trainers to tune which behaviors matter most
   * for their specific dog's symptom profile.
   *
   * Automatic behavior weights should sum to 1.0.
   * Manual behaviors act as modifiers (added on top).
   */
  behaviorWeights: Record<string, number>;

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * A single data point for tracking anxiety index over time.
 *
 * Computed after each monitoring session. Used to visualize
 * trends and compare time periods.
 */
export interface AnxietyIndexSnapshot {
  /** Date of the monitoring session */
  date: string; // ISO 8601
  /** Session ID this snapshot corresponds to */
  sessionId: string;
  /**
   * Composite anxiety index (0–100).
   * Weighted sum of detected behaviors, normalized by session duration.
   */
  anxietyIndex: number;
  /**
   * Breakdown of each behavior's contribution to the index.
   * Key = BehaviorCatalogEntry.id, Value = contribution value.
   */
  behaviorContributions: Record<string, number>;
  /** Total duration of the monitoring session in minutes */
  sessionDurationMinutes: number;
}

/**
 * A comparison between two time periods for treatment response analysis.
 *
 * Compares metrics like average anxiety index, standard deviation,
 * behavior frequency distribution, and trend direction.
 */
export interface PeriodComparison {
  /** Label for the first period (e.g., "Week 1-2", "Baseline") */
  periodALabel: string;
  /** Label for the second period (e.g., "Week 5-6", "After Treatment") */
  periodBLabel: string;

  /** Average anxiety index for period A */
  periodAAvg: number;
  /** Average anxiety index for period B */
  periodBAvg: number;

  /** Absolute change: periodB - periodA (negative = improvement) */
  absoluteChange: number;
  /** Relative change as percentage: ((periodB - periodA) / periodA) * 100 */
  relativeChangePercent: number;

  /** Standard deviation of anxiety index within period A */
  periodAStdDev: number;
  /** Standard deviation of anxiety index within period B */
  periodBStdDev: number;

  /** Number of sessions in period A */
  periodASessionCount: number;
  /** Number of sessions in period B */
  periodBSessionCount: number;

  /**
   * Per-behavior breakdown of changes between periods.
   * Key = BehaviorCatalogEntry.id
   */
  behaviorBreakdown: Record<string, BehaviorPeriodComparison>;

  /** Whether the trend indicates improvement, worsening, or no change */
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Per-behavior comparison between two periods.
 */
export interface BehaviorPeriodComparison {
  behaviorName: string;
  /** Average events per hour in period A */
  periodAAvgPerHour: number;
  /** Average events per hour in period B */
  periodBAvgPerHour: number;
  /** Absolute change in events per hour */
  absoluteChange: number;
  /** Relative change as percentage */
  relativeChangePercent: number;
}
