export type { Dog, Session, BarkEvent, AnxietyEvent, Snapshot } from './entities';

// — Learning System —
export type {
  LearningGoal,
  Exercise,
  LearningSession,
  SessionActivity,
  ObedienceRepetition,
  LATRepetition,
  DesensitizationRepetition,
  AbsenceExposureRepetition,
  BoundarySettingRepetition,
  CustomRepetition,
  ActivityRepetition,
  CommunicationMethod,
  DifficultyPreset,
  DifficultyFactor,
} from './entities';

// — Separation Anxiety —
export type {
  SeparationAnxietyProfile,
  AnxietyIndexSnapshot,
  PeriodComparison,
  BehaviorPeriodComparison,
  BehaviorCatalogEntry,
} from './entities';
export { DEFAULT_BEHAVIOR_CATALOG } from './entities';

export type {
  CreateSessionRequest,
  CreateSessionResponse,
  ListEventsQuery,
  EventListResponse,
} from './api';

export {
  DetectionClass,
  SessionState,
  AlertLevel,
  AnxietyFactor,
  SignalMessageType,
} from './enums';

// — Learning System enums —
export {
  LearningCategory,
  ActivityType,
  CommunicationType,
} from './enums';

// — Separation Anxiety enums —
export {
  SeverityLevel,
  BehaviorCategory,
  DetectionSource,
} from './enums';
