import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function HomeScreen() {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleStartMonitoring = () => {
    setIsMonitoring((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>dwatcher</Text>
        <Text style={styles.subtitle}>Dog Watcher</Text>
        <Text style={styles.description}>
          Monitor your dog's activity, detect barks and anxiety,{'\n'}
          and stay connected when you're away.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            isMonitoring && styles.buttonActive,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStartMonitoring}
        >
          <Text style={[styles.buttonText, isMonitoring && styles.buttonTextActive]}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#e94560',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#a0a0b0',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#7a7a8a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 240,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#2d2d44',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#e94560',
  },
});
