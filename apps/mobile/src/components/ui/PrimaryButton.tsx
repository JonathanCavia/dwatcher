import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, dwatcherRadii, dwatcherTypography } from '../../theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
};

export function PrimaryButton({ label, style, disabled, loading, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isDisabled ? colors['background-mid'] : colors.accent },
        pressed && !isDisabled && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text style={styles.label}>{loading ? '...' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: dwatcherRadii.button,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  label: {
    ...dwatcherTypography.button,
    color: colors.white,
  },
});
