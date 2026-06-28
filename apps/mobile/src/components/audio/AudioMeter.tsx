import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, dwatcherSpacing } from '../../theme';

export interface AudioMeterProps {
  /** Current dBFS level (−∞ to 0). */
  dbfs: number;
  /** Whether the audio is currently silent. */
  isSilent: boolean;
  /** Height of the meter bar in points. */
  height?: number;
}

/**
 * Animated audio level meter that maps dBFS to a horizontal bar.
 *
 * Colour zones:
 *  −60 … −30 dB → green  (normal ambient)
 *  −30 … −10 dB → yellow (elevated)
 *  −10 …   0 dB → red    (loud)
 */
export function AudioMeter({ dbfs, isSilent, height = 8 }: AudioMeterProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Map dBFS from [−60, 0] to [0, 1]
    const clamped = Math.max(-60, Math.min(0, Number.isFinite(dbfs) ? dbfs : -60));
    const ratio = (clamped + 60) / 60; // 0 = −60 dB, 1 = 0 dB

    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: ratio,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.timing(animatedColor, {
        toValue: ratio,
        duration: 80,
        useNativeDriver: false,
      }),
    ]).start();
  }, [dbfs, animatedWidth, animatedColor]);

  const widthPercent = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const barColor = animatedColor.interpolate({
    inputRange: [0, 0.5, 0.83, 1],
    outputRange: [colors.success, colors.warning, colors.accent, colors.error],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              width: widthPercent,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>
        {isSilent ? 'Silence detected' : `${dbfs.toFixed(1)} dBFS`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: dwatcherSpacing.screenContent.paddingHorizontal,
  },
  track: {
    width: '100%',
    backgroundColor: colors['border-light'],
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: colors['text-soft'],
    textAlign: 'center',
  },
});
