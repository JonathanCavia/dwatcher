import { Pressable, StyleSheet, Text, type PressableProps, type TextStyle } from 'react-native';

import { colors } from '../../theme';

type GhostButtonProps = PressableProps & {
  label: string;
  textStyle?: TextStyle;
};

export function GhostButton({ label, style, textStyle, ...props }: GhostButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors['text-soft'],
  },
});
