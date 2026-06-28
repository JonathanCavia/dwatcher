import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '../components/layout/ScreenShell';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GhostButton } from '../components/ui/GhostButton';
import { monitoringService } from '../services/monitoring-service';
import { colors, dwatcherTypography } from '../theme';

export function HomeScreen() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const handleStartMonitoring = useCallback(async () => {
    setStarting(true);
    try {
      // TODO: Use the actual dog id from the user's profile.
      // For now we use a placeholder UUID so the session row is valid.
      const placeholderDogId = '00000000-0000-0000-0000-000000000001';
      await monitoringService.startSession(placeholderDogId);
      router.push('/monitoring');
    } catch (err) {
      Alert.alert(
        'Could not start',
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
    } finally {
      setStarting(false);
    }
  }, [router]);

  return (
    <ScreenShell
      headerBackgroundColor={colors.background}
      hideBrandTitle
      showMenuButton
    >
      <View style={styles.content}>
        <Text style={styles.title}>dwatcher</Text>
        <Text style={styles.subtitle}>Dog Watcher</Text>
        <Text style={styles.description}>
          Monitor your dog's activity, detect barks and anxiety,{'\n'}
          and stay connected when you're away.
        </Text>

        <PrimaryButton
          label={starting ? 'Starting…' : 'Start Monitoring'}
          onPress={handleStartMonitoring}
          disabled={starting}
          style={styles.monitorButton}
        />
        <GhostButton
          label="Settings"
          onPress={() => {}}
          style={styles.settingsButton}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    ...dwatcherTypography.heroTitle,
    color: colors.accent,
    marginBottom: 4,
  },
  subtitle: {
    ...dwatcherTypography.heroSubtitle,
    color: colors['text-mid'],
    marginBottom: 24,
  },
  description: {
    ...dwatcherTypography.bodyIntro,
    color: colors['text-soft'],
    textAlign: 'center',
    marginBottom: 48,
  },
  monitorButton: {
    marginBottom: 12,
  },
  settingsButton: {},
});
