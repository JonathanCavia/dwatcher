import { create } from 'zustand';

export interface AudioStore {
  /** Normalized RMS amplitude (0–1). */
  currentRms: number;
  /** Current dBFS level (−∞ to 0). */
  currentDbfs: number;
  /** Whether the audio level is below the silence threshold. */
  isSilent: boolean;
  /** Peak dBFS observed during the current session. */
  peakDbfs: number;
  /** Whether the audio service is actively recording. */
  isMonitoring: boolean;

  /** Update volume readings from the audio callback. */
  setAudioLevel: (rms: number, dbfs: number) => void;
  /** Set the silence flag. */
  setSilent: (silent: boolean) => void;
  /** Set whether monitoring is active. */
  setMonitoring: (active: boolean) => void;
  /** Reset all values to defaults. */
  reset: () => void;
}

function initialAudioState() {
  return {
    currentRms: 0,
    currentDbfs: -Infinity,
    isSilent: true,
    peakDbfs: -Infinity,
    isMonitoring: false,
  };
}

export const useAudioStore = create<AudioStore>((set) => ({
  ...initialAudioState(),

  setAudioLevel(rms: number, dbfs: number) {
    set((state) => ({
      currentRms: rms,
      currentDbfs: dbfs,
      peakDbfs: dbfs > state.peakDbfs ? dbfs : state.peakDbfs,
    }));
  },

  setSilent(silent: boolean) {
    set({ isSilent: silent });
  },

  setMonitoring(active: boolean) {
    set({ isMonitoring: active });
  },

  reset() {
    set(initialAudioState());
  },
}));
