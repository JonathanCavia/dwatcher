import type { LearningCategory } from '../enums/learning';

/**
 * A learning goal (objetivo de aprendizaje).
 *
 * Not all processes train commands — some train emotional states
 * or general behaviors. A LearningGoal captures the *what* being trained.
 *
 * Examples:
 * - Training: "Sentado", "Quieto", "Junto", "Venir"
 * - Education: "Reducir reactividad", "Ansiedad por separación",
 *   "Manejo de impulsos", "Respetar límites"
 *
 * Goals and exercises share the same category table — filterable in the UI.
 */
export interface LearningGoal {
  id: string;
  name: string;
  category: LearningCategory;
  description: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
