import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { getQueryClient, QueryClientProvider } from '../src/services/query-client';
import { colors } from '../src/theme';

const queryClient = getQueryClient();

// Keep the splash screen visible while the layout mounts
SplashScreen.preventAutoHideAsync().catch(() => {
  // Silently ignore — splash may already be hidden
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hide the native splash screen once the React tree is mounted
    async function hideSplash() {
      await SplashScreen.hideAsync();
    }
    hideSplash().catch(() => {});
    setReady(true);
  }, []);

  const onErrorReset = useCallback(() => {
    setReady(false);
    // Re-hide splash after a brief moment to let the tree remount
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    });
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
