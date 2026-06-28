import { Audio } from 'expo-av';

/** Request microphone recording permission. Returns `true` if granted. */
export async function requestMicrophonePermission(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}
