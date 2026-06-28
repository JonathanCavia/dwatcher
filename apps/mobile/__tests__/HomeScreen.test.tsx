import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { HomeScreen } from '../src/screens/HomeScreen';

// Mock ScreenShell and button components to avoid full dependency tree
jest.mock('../src/components/layout/ScreenShell', () => ({
  ScreenShell: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useScreenShellInsets: () => ({ insets: { top: 0, right: 0, bottom: 0, left: 0 } }),
}));

jest.mock('../src/components/ui/PrimaryButton', () => ({
  PrimaryButton: ({ label }: { label: string }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, label);
  },
}));

jest.mock('../src/components/ui/GhostButton', () => ({
  GhostButton: ({ label }: { label: string }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, label);
  },
}));

describe('HomeScreen', () => {
  it('renders the app title', () => {
    render(<HomeScreen />);
    expect(screen.getByText('dwatcher')).toBeTruthy();
  });

  it('renders the subtitle', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Dog Watcher')).toBeTruthy();
  });
});
