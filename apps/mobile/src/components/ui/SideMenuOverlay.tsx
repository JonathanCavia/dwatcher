import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, dwatcherTypography } from '../../theme';

const PANEL_WIDTH = 220;
const ANIM_DURATION = 250;

interface MenuItem {
  id: string;
  emoji: string;
  label: string;
  route: string | null;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'settings', emoji: '⚙️', label: 'Settings', route: null },
];

interface SideMenuOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function SideMenuOverlay({ visible, onClose }: SideMenuOverlayProps) {
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [mounted, setMounted] = useState(false);
  const closingRef = useRef(false);

  // Animate in
  useEffect(() => {
    if (!visible) return;

    closingRef.current = false;
    slideAnim.setValue(PANEL_WIDTH);
    setMounted(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start();
  }, [visible, slideAnim]);

  // Animate out
  useEffect(() => {
    if (visible || !mounted) return;

    closingRef.current = true;

    Animated.timing(slideAnim, {
      toValue: PANEL_WIDTH,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start();

    // Use setTimeout so unmount works reliably in both test and production.
    // The animation callback doesn't fire in Jest, but setTimeout does.
    const timer = setTimeout(() => {
      if (closingRef.current) {
        setMounted(false);
        closingRef.current = false;
      }
    }, ANIM_DURATION);

    return () => {
      clearTimeout(timer);
    };
  }, [visible, mounted, slideAnim]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleItemPress = useCallback(
    (_item: MenuItem) => {
      // No routes implemented yet — just close the panel
      onClose();
    },
    [onClose],
  );

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        {/* Full-screen overlay */}
        <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1} />
        {/* Panel slides over the overlay from the right */}
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
          {/* Collapse button */}
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>

          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.surface,
    paddingTop: 22,
    paddingHorizontal: 24,
  },
  collapseButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuEmoji: {
    fontSize: 22,
  },
  menuLabel: {
    ...dwatcherTypography.menuItem,
    color: colors.text,
  },
});
