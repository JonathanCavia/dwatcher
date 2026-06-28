/**
 * Request microphone recording permission.
 * Falls back to `true` when expo-av is unavailable (simulated audio).
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av');
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  } catch {
    return true; // expo-av not available — simulated audio needs no permission
  }
}
