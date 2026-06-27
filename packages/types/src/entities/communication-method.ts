import type { CommunicationType } from '../enums/learning';

/**
 * A communication method used during an activity.
 *
 * Simplified model: type + free-text description.
 * The user describes what they did in their own words.
 *
 * Examples:
 * - { type: 'verbal', description: '"Sentado" en tono neutro' }
 * - { type: 'physical', description: 'Mano abierta hacia arriba, gesto pequeño' }
 * - { type: 'whistle', description: 'Silbido corto seguido de uno largo' }
 * - { type: 'facial', description: 'Ceño fruncido para marcar corrección' }
 */
export interface CommunicationMethod {
  type: CommunicationType;
  /** Free-text description of how this method was used */
  description: string;
}
