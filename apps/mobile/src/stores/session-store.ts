import type { Session, SessionState } from '@dwatcher/types';
import { create } from 'zustand';

import { SessionRepository } from '../db';
import {
  SessionAction,
  transitionState,
} from '../services/session-machine';

export interface SessionStore {
  /** The current active session, or null if none. */
  currentSession: Session | null;
  /** Current state of the session state machine. */
  sessionState: SessionState;
  /** Elapsed seconds since the session started (monitoring time only). */
  elapsedSeconds: number;
  /** Whether the store has been initialised from the database. */
  isInitialized: boolean;

  // ── Lifecycle ──────────────────────────────────────────

  /** Read the active session from SQLite. Call once on app mount. */
  initialize: () => void;
  startMonitoring: (dogId: string, batteryLevel: number) => void;
  pauseMonitoring: () => void;
  resumeMonitoring: () => void;
  stopMonitoring: () => void;
  /** Increment elapsedSeconds by 1. Called by a 1‑second interval. */
  tick: () => void;
  reset: () => void;
}

const repo = new SessionRepository();

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  sessionState: 'idle' as SessionState,
  elapsedSeconds: 0,
  isInitialized: false,

  // ── Lifecycle ──────────────────────────────────────────

  initialize() {
    const active = repo.getActiveSession();
    if (active) {
      set({
        currentSession: active,
        sessionState: active.state,
        elapsedSeconds: computeElapsed(active),
      });
    }
    set({ isInitialized: true });
  },

  startMonitoring(dogId: string, batteryLevel: number) {
    const next = transitionState(get().sessionState, SessionAction.Start);
    const session = repo.createSession(dogId, batteryLevel);
    set({ currentSession: session, sessionState: next, elapsedSeconds: 0 });
  },

  pauseMonitoring() {
    const { currentSession } = get();
    const next = transitionState(get().sessionState, SessionAction.Pause);
    if (currentSession) repo.updateSessionState(currentSession.id, next);
    set({ sessionState: next });
  },

  resumeMonitoring() {
    const { currentSession } = get();
    const next = transitionState(get().sessionState, SessionAction.Resume);
    if (currentSession) repo.updateSessionState(currentSession.id, next);
    set({ sessionState: next });
  },

  stopMonitoring() {
    const { currentSession } = get();
    const next = transitionState(get().sessionState, SessionAction.Stop);
    const endedAt = new Date().toISOString();
    if (currentSession) {
      repo.updateSessionState(currentSession.id, next, endedAt);
      set({
        currentSession: { ...currentSession, state: next, endedAt },
        sessionState: next,
      });
    } else {
      set({ sessionState: next });
    }
  },

  tick() {
    if (get().sessionState === 'monitoring') {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
    }
  },

  reset() {
    set({ currentSession: null, sessionState: 'idle' as SessionState, elapsedSeconds: 0 });
  },
}));

// ── Helpers ───────────────────────────────────────────────

function computeElapsed(session: Session): number {
  if (!session.startedAt) return 0;
  const start = new Date(session.startedAt).getTime();
  const end =
    session.endedAt && session.state === 'ended'
      ? new Date(session.endedAt).getTime()
      : Date.now();
  return Math.max(0, Math.floor((end - start) / 1000));
}
