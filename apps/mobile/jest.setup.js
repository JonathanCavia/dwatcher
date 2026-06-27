const React = require('react');
const { Text } = require('react-native');

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: ({ children }) => React.createElement(require('react-native').View, null, children),
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
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) =>
    React.createElement(require('react-native').View, null, children),
  SafeAreaView: ({ children, style }) =>
    React.createElement(
      require('react-native').View,
      { style },
      children
    ),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
    MaterialIcons: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
    MaterialCommunityIcons: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
    FontAwesome: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
    AntDesign: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
    Feather: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
    Entypo: ({ name, size, color, style }) =>
      React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name),
  };
});
