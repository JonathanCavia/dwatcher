// Mock expo-router
jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const React = require('react');

  return {
    Stack: ({ children }) => React.createElement(View, null, children),
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: (callback) => {
      const { useEffect } = require('react');
      useEffect(callback, [callback]);
    },
    useSegments: () => [],
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  SafeAreaView: ({ children, style }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const iconFactory = (name) => ({ name, size, color, style }) =>
    React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name);

  return {
    Ionicons: iconFactory('Ionicons'),
    MaterialIcons: iconFactory('MaterialIcons'),
    MaterialCommunityIcons: iconFactory('MaterialCommunityIcons'),
    FontAwesome: iconFactory('FontAwesome'),
    AntDesign: iconFactory('AntDesign'),
    Feather: iconFactory('Feather'),
    Entypo: iconFactory('Entypo'),
  };
});
