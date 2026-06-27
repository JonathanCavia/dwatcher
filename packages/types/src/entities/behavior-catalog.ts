import type {
  BehaviorCategory,
  SeverityLevel,
  DetectionSource,
} from '../enums/separation-anxiety';

/**
 * A single entry in the separation anxiety behavior catalog.
 *
 * This catalog serves as the reference table of observable behaviors,
 * their clinical severity, how they are detected, and their default
 * contribution to the anxiety index.
 *
 * The catalog is tunable: owners can adjust the weight of each behavior
 * to customize the anxiety index for their dog's specific symptom profile.
 */
export interface BehaviorCatalogEntry {
  id: string;
  /** Display name (e.g., "Excessive Barking", "Pacing", "Howling") */
  name: string;
  /** Broad category for grouping in analytics */
  category: BehaviorCategory;
  /** Clinical severity of this behavior when observed */
  severity: SeverityLevel;
  /** How this behavior is identified (audio, vision, multimodal, manual) */
  detectionSource: DetectionSource;
  /**
   * Whether this behavior is detected automatically by the app.
   * false = requires manual entry by the owner after the session.
   */
  isAutomatic: boolean;
  /**
   * Default weight in the anxiety index calculation (0.0 – 1.0).
   * All automatic behavior weights should sum to 1.0.
   * Can be overridden per-dog via SeparationAnxietyProfile.
   */
  defaultWeight: number;
  /** Human-readable description of what to look for */
  description: string;
}

/**
 * Predefined separation anxiety behavior catalog.
 *
 * Based on clinical veterinary behavior literature:
 * - Overall, K.L. (2013) "Manual of Clinical Behavioral Medicine for Dogs and Cats"
 * - Sherman, B.L. & Mills, D.S. (2008) "Canine anxieties and phobias"
 *
 * Behaviors 1-7 are automatically detected (audio + vision).
 * Behaviors 8-10 are manual (owner-reported after session).
 */
export const DEFAULT_BEHAVIOR_CATALOG: Omit<BehaviorCatalogEntry, 'id'>[] = [
  // —— Automatically detected ——
  {
    name: 'Excessive Barking',
    category: 'vocalization' as BehaviorCategory,
    severity: 'moderate' as SeverityLevel,
    detectionSource: 'audio' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.20,
    description:
      'Repetitive, sustained barking beyond normal alert behavior. Often high-pitched and rhythmic when related to separation distress.',
  },
  {
    name: 'Howling',
    category: 'vocalization' as BehaviorCategory,
    severity: 'severe' as SeverityLevel,
    detectionSource: 'audio' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.25,
    description:
      'Prolonged, tonal vocalization. In separation anxiety, howling is a distress call — an attempt to reunite with the absent owner.',
  },
  {
    name: 'Whining / Whimpering',
    category: 'vocalization' as BehaviorCategory,
    severity: 'mild' as SeverityLevel,
    detectionSource: 'audio' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.10,
    description:
      'High-pitched, repetitive vocalization indicating mild to moderate distress. Often precedes escalation to barking or howling.',
  },
  {
    name: 'Pacing',
    category: 'motor' as BehaviorCategory,
    severity: 'moderate' as SeverityLevel,
    detectionSource: 'vision' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.15,
    description:
      'Repetitive back-and-forth walking, often along a fixed path (e.g., door to window). A stereotypic motor pattern associated with anxiety.',
  },
  {
    name: 'Counter / Furniture Surfing',
    category: 'spatial' as BehaviorCategory,
    severity: 'moderate' as SeverityLevel,
    detectionSource: 'vision' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.10,
    description:
      'Jumping onto tables, counters, or furniture that the dog normally avoids when the owner is present. Can indicate seeking escape or the owner\'s scent.',
  },
  {
    name: 'Zoomies (Frantic Running)',
    category: 'motor' as BehaviorCategory,
    severity: 'moderate' as SeverityLevel,
    detectionSource: 'vision' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.10,
    description:
      'Sudden bursts of high-speed, erratic running often with tucked tail. In separation context, this is a displacement behavior — not playful zoomies.',
  },
  {
    name: 'Trembling / Anxious Posture',
    category: 'motor' as BehaviorCategory,
    severity: 'severe' as SeverityLevel,
    detectionSource: 'vision' as DetectionSource,
    isAutomatic: true,
    defaultWeight: 0.10,
    description:
      'Visible trembling, crouched posture, ears back, tail tucked. A strong physiological indicator of fear and distress.',
  },

  // —— Manually reported (owner enters after returning home) ——
  {
    name: 'Inappropriate Urination',
    category: 'elimination' as BehaviorCategory,
    severity: 'severe' as SeverityLevel,
    detectionSource: 'manual' as DetectionSource,
    isAutomatic: false,
    defaultWeight: 0,
    description:
      'Urination inside the house despite being house-trained. In separation anxiety, this is emotional (not a training issue).',
  },
  {
    name: 'Inappropriate Defecation',
    category: 'elimination' as BehaviorCategory,
    severity: 'severe' as SeverityLevel,
    detectionSource: 'manual' as DetectionSource,
    isAutomatic: false,
    defaultWeight: 0,
    description:
      'Defecation inside the house despite being house-trained. Often accompanied by other anxiety signs.',
  },
  {
    name: 'Destructive Behavior',
    category: 'destructive' as BehaviorCategory,
    severity: 'severe' as SeverityLevel,
    detectionSource: 'manual' as DetectionSource,
    isAutomatic: false,
    defaultWeight: 0,
    description:
      'Chewing, scratching, or destroying objects (doors, windows, furniture, personal items). In separation anxiety, often focused on exit points or owner-scented items.',
  },
];
