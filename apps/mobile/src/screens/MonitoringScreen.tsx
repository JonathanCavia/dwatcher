import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AudioMeter } from '../components/audio/AudioMeter';
import { LoadingState } from '../components/ui/LoadingState';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GhostButton } from '../components/ui/GhostButton';
import { ScreenShell } from '../components/layout/ScreenShell';
import { monitoringService } from '../services/monitoring-service';
import { useSessionStore } from '../stores/session-store';
import { useAudioStore } from '../stores/audio-store';
import { colors, dwatcherSpacing } from '../theme';

export function MonitoringScreen() {
  const router = useRouter();
  const sessionState = useSessionStore((s) => s.sessionState);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const tick = useSessionStore((s) => s.tick);
  const isInitialized = useSessionStore((s) => s.isInitialized);

  const currentDbfs = useAudioStore((s) => s.currentDbfs);
  const isSilent = useAudioStore((s) => s.isSilent);

  const [stopping, setStopping] = useState(false);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 1‑second tick ──────────────────────────────────────
  useEffect(() => {
    tickInterval.current = setInterval(() => tick(), 1000);
    return () => {
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
  }, [tick]);

  // ── Handlers ────────────────────────────────────────────

  const handlePause = useCallback(async () => {
    try {
      await monitoringService.pauseSession();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not pause.');
    }
  }, []);

  const handleResume = useCallback(async () => {
    try {
      await monitoringService.resumeSession();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not resume.');
    }
  }, []);

  const handleStop = useCallback(() => {
    Alert.alert('End monitoring session?', 'You will see a summary of this session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          setStopping(true);
          try {
            await monitoringService.stopSession();
            router.replace('/');
          } catch (e) {
            setStopping(false);
            Alert.alert('Error', e instanceof Error ? e.message : 'Could not stop.');
          }
        },
      },
    ]);
  }, [router]);

  // ── Derived ─────────────────────────────────────────────

  const formattedTime = formatSeconds(elapsedSeconds);
  const isMonitoring = sessionState === 'monitoring';
  const isPaused = sessionState === 'paused';

  // ── Loading state ───────────────────────────────────────

  if (!isInitialized) {
    return <LoadingState variant="blocking" message="Starting monitoring…" />;
  }

  if (stopping) {
    return <LoadingState variant="blocking" message="Ending session…" />;
  }

  return (
    <ScreenShell hideBrandTitle>
      <View style={styles.container}>
        {/* ── Status header ──────────────────────────── */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isMonitoring
                  ? colors.success
                  : isPaused
                    ? colors.warning
                    : colors['text-soft'],
              },
            ]}
          />
          <Text style={styles.timer}>{formattedTime}</Text>
        </View>

        {/* ── Audio meter ────────────────────────────── */}
        <AudioMeter dbfs={currentDbfs} isSilent={isSilent} />

        {/* ── Controls ───────────────────────────────── */}
        <View style={styles.controls}>
          {isMonitoring && (
            <PrimaryButton label="Pause" onPress={handlePause} disabled={stopping} />
          )}
          {isPaused && (
            <PrimaryButton label="Resume" onPress={handleResume} disabled={stopping} />
          )}
          <GhostButton
            label="Stop Monitoring"
            onPress={handleStop}
            disabled={stopping}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

// ── Helpers ───────────────────────────────────────────────

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: dwatcherSpacing.welcomeHero.paddingTop,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: dwatcherSpacing.screenContent.paddingHorizontal,
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    paddingHorizontal: dwatcherSpacing.screenContent.paddingHorizontal,
    marginTop: 40,
    gap: 12,
  },
});
