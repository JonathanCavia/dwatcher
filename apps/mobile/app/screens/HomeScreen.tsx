import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '../../src/components/layout/ScreenShell';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { GhostButton } from '../../src/components/ui/GhostButton';
import { colors, dwatcherTypography } from '../../src/theme';

export function HomeScreen() {
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
          label="Start Monitoring"
          onPress={() => {}}
          disabled
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
