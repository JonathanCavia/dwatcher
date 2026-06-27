import type { EdgeInsets } from 'react-native-safe-area-context';

/**
 * Returns the bottom padding incorporating the safe area inset.
 * Use with screens that render content extending below the safe area.
 */
export function getScreenContentPadding(
  insets: EdgeInsets,
  basePaddingBottom = 24,
): { paddingBottom: number } {
  return {
    paddingBottom: basePaddingBottom + insets.bottom,
  };
}
