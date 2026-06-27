import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';

export type LoadingStateVariant = 'inline' | 'blocking';

type LoadingStateProps = {
  message?: string;
  color?: string;
  variant?: LoadingStateVariant;
};

export function LoadingState({
  message = 'Loading...',
  color = colors['text-soft'],
  variant = 'blocking',
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={color} />
        {message ? <Text style={[styles.inlineText, { color }]}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.blocking}>
      <ActivityIndicator size="large" color={color} />
      {message ? <Text style={styles.blockingText}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blocking: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  blockingText: {
    fontSize: 14,
    color: colors['text-mid'],
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  inlineText: {
    fontSize: 13,
  },
});
