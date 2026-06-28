import type { Session, SessionState } from '@dwatcher/types';
import { create } from 'zustand';

import { SessionRepository } from '../db';
import { SessionAction, transitionState } from '../services/session-machine';

export interface SessionStore {
  currentSession: Session | null;
  sessionState: SessionState;
  elapsedSeconds: number;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  startMonitoring: (dogId: string, batteryLevel: number) => Promise<void>;
  pauseMonitoring: () => Promise<void>;
  resumeMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  tick: () => void;
  reset: () => void;
}

const repo = new SessionRepository();

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  sessionState: 'idle' as SessionState,
  elapsedSeconds: 0,
  isInitialized: false,

  async initialize() {
    const active = await repo.getActiveSession();
    if (active) {
      set({
        currentSession: active,
        sessionState: active.state,
        elapsedSeconds: computeElapsed(active),
      });
    }
    set({ isInitialized: true });
  },

  async startMonitoring(dogId: string, batteryLevel: number) {
    const next = transitionState(get().sessionState, SessionAction.Start);
    const session = await repo.createSession(dogId, batteryLevel);
    set({ currentSession: session, sessionState: next, elapsedSeconds: 0 });
  },

  async pauseMonitoring() {
    const { currentSession } = get();
    const next = transitionState(get().sessionState, SessionAction.Pause);
    if (currentSession) await repo.updateSessionState(currentSession.id, next);
    set({ sessionState: next });
  },

  async resumeMonitoring() {
    const { currentSession } = get();
    const next = transitionState(get().sessionState, SessionAction.Resume);
    if (currentSession) await repo.updateSessionState(currentSession.id, next);
    set({ sessionState: next });
  },

  async stopMonitoring() {
    const { currentSession } = get();
    const next = transitionState(get().sessionState, SessionAction.Stop);
    const endedAt = new Date().toISOString();
    if (currentSession) {
      await repo.updateSessionState(currentSession.id, next, endedAt);
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
    set({
      currentSession: null,
      sessionState: 'idle' as SessionState,
      elapsedSeconds: 0,
    });
  },
}));

function computeElapsed(session: Session): number {
  if (!session.startedAt) return 0;
  const start = new Date(session.startedAt).getTime();
  const end =
    session.endedAt && session.state === 'ended'
      ? new Date(session.endedAt).getTime()
      : Date.now();
  return Math.max(0, Math.floor((end - start) / 1000));
}
