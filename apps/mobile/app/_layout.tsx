import 'react-native-gesture-handler';

import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { getQueryClient, QueryClientProvider } from '../src/services/query-client';
import { useSessionStore } from '../src/stores/session-store';
import { colors } from '../src/theme';

const queryClient = getQueryClient();

// Keep the splash screen visible while the layout mounts
SplashScreen.preventAutoHideAsync().catch(() => {
  // Silently ignore — splash may already be hidden
});

function SessionRehydrator({ ready }: { ready: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    // Hydrate any active session from the database
    const store = useSessionStore.getState();
    if (!store.isInitialized) {
      store.initialize();
    }

    const { currentSession, sessionState } = useSessionStore.getState();
    if (
      currentSession &&
      (sessionState === 'monitoring' || sessionState === 'paused')
    ) {
      // If there's an active session from a previous launch, show the
      // monitoring screen. Audio won't auto-resume, but the user can
      // tap Resume to restart the foreground service.
      router.replace('/monitoring');
    }
  }, [ready, router]);

  return null;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function hideSplash() {
      await SplashScreen.hideAsync();
    }
    hideSplash().catch(() => {});
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <SessionRehydrator ready={ready} />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="monitoring" options={{ headerShown: false }} />
          </Stack>
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
