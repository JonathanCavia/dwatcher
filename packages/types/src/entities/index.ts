export type { Dog } from './dog';
export type { Session } from './session';
export type { BarkEvent } from './bark-event';
export type { AnxietyEvent } from './anxiety-event';
export type { Snapshot } from './snapshot';

// — Learning System (unified Training + Education) —
export type { LearningGoal } from './learning-goal';
export type { Exercise } from './exercise';
export type {
  LearningSession,
  SessionActivity,
  ObedienceRepetition,
  LATRepetition,
  DesensitizationRepetition,
  AbsenceExposureRepetition,
  BoundarySettingRepetition,
  CustomRepetition,
  ActivityRepetition,
} from './learning-session';
export type { CommunicationMethod } from './communication-method';
export type { DifficultyPreset, DifficultyFactor } from './difficulty';

// — Separation Anxiety —
export type {
  SeparationAnxietyProfile,
  AnxietyIndexSnapshot,
  PeriodComparison,
  BehaviorPeriodComparison,
} from './separation-anxiety-profile';
export type { BehaviorCatalogEntry } from './behavior-catalog';
export { DEFAULT_BEHAVIOR_CATALOG } from './behavior-catalog';
