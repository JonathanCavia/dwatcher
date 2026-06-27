import type { ActivityType } from '../enums/learning';

/**
 * An exercise template — the *how* of training a learning goal.
 *
 * Exercises can be predefined (shipped with the app) or custom
 * (created by the user). Multiple exercises can target the same
 * learning goal.
 *
 * Examples:
 * - Goal "Sentado" → Exercise "Sentado con gesto", Exercise "Sentado verbal"
 * - Goal "Reducir reactividad" → Exercise "LAT con perros", Exercise "LAT con bicis"
 */
export interface Exercise {
  id: string;
  /** The learning goal this exercise targets */
  learningGoalId: string;
  /** The type of activity this exercise involves */
  activityType: ActivityType;
  /** Display name */
  name: string;
  /** Whether predefined or user-created */
  type: 'predefined' | 'custom';
  description: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
