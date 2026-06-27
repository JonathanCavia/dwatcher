import { Text, StyleSheet } from 'react-native';

import { colors, dwatcherTypography } from '../../theme';

export function ScreenBrandTitle() {
  return <Text style={styles.title}>dwatcher</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...dwatcherTypography.brandTitle,
    color: colors.accent,
    textAlign: 'center',
  },
});
