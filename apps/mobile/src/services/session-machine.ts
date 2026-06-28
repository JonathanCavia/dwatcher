import { SessionState } from '@dwatcher/types';

/** Actions the user can take on a monitoring session. */
export enum SessionAction {
  Start = 'start',
  Pause = 'pause',
  Resume = 'resume',
  Stop = 'stop',
}

/**
 * Allowed transitions for the session state machine.
 *
 *   idle ──start──→ monitoring
 *   monitoring ──pause──→ paused
 *   monitoring ──stop───→ ended
 *   paused ──resume──→ monitoring
 *   paused ──stop───→ ended
 *   ended ⟵ terminal
 */
const TRANSITIONS: Record<
  SessionState,
  Partial<Record<SessionAction, SessionState>>
> = {
  [SessionState.Idle]: { [SessionAction.Start]: SessionState.Monitoring },
  [SessionState.Monitoring]: {
    [SessionAction.Pause]: SessionState.Paused,
    [SessionAction.Stop]: SessionState.Ended,
  },
  [SessionState.Paused]: {
    [SessionAction.Resume]: SessionState.Monitoring,
    [SessionAction.Stop]: SessionState.Ended,
  },
  [SessionState.Ended]: {},
};

/**
 * Return the new state after applying `action` to `current`.
 * Throws if the transition is not allowed.
 */
export function transitionState(
  current: SessionState,
  action: SessionAction,
): SessionState {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error(`Invalid session transition: ${current} → ${action}`);
  }
  return next;
}

/**
 * Check whether a transition is allowed without throwing.
 */
export function canTransition(
  current: SessionState,
  action: SessionAction,
): boolean {
  return TRANSITIONS[current]?.[action] !== undefined;
}
