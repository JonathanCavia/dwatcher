import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBrandTitle } from './ScreenBrandTitle';
import { SideMenuOverlay } from '../ui/SideMenuOverlay';
import { colors } from '../../theme';

export type ScreenShellStatusBarStyle = 'light' | 'dark' | 'auto';

export type ScreenShellProps = {
  children: ReactNode;
  header?: ReactNode;
  headerBackgroundColor?: string;
  /** Hide centered wordmark (welcome/home screens may want this hidden). */
  hideBrandTitle?: boolean;
  statusBarStyle?: ScreenShellStatusBarStyle;
  style?: ViewStyle;
  /** Show the gear/settings button in the header to open the side menu. */
  showMenuButton?: boolean;
  /** Show back button in the header row (uses router.back() by default, or custom callback). */
  onBack?: () => void;
};

export function ScreenShell({
  children,
  header,
  headerBackgroundColor = colors.background,
  hideBrandTitle = false,
  statusBarStyle = 'light',
  style,
  showMenuButton = false,
  onBack,
}: ScreenShellProps) {
  const showBrandTitle = Boolean(header) && !hideBrandTitle;
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleCloseMenu = () => setMenuVisible(false);

  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.root, style]}>
      <StatusBar style={statusBarStyle} />
      {header ? (
        <SafeAreaView
          edges={['top']}
          style={[styles.header, { backgroundColor: headerBackgroundColor }]}
        >
          {showBrandTitle ? (
            <View style={styles.headerTopRow}>
              {onBack ? (
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Text style={styles.headerBackText}>{'<'} Back</Text>
                </TouchableOpacity>
              ) : null}
              <ScreenBrandTitle />
              {showMenuButton ? (
                <TouchableOpacity
                  style={styles.headerMenuButton}
                  onPress={() => setMenuVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={22} color={colors.white} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          <View style={styles.headerContent}>{header}</View>
        </SafeAreaView>
      ) : null}
      {children}

      <SideMenuOverlay
        visible={menuVisible}
        onClose={handleCloseMenu}
      />
    </View>
  );
}

export function useScreenShellInsets() {
  const insets = useSafeAreaInsets();
  return { insets };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexShrink: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 0,
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    paddingVertical: 8,
    zIndex: 1,
  },
  headerBackText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
  },
  headerMenuButton: {
    position: 'absolute',
    right: 20,
    paddingVertical: 8,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
