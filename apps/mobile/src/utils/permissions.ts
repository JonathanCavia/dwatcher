/**
 * Microphone permission is handled by react-native-audio-api's AudioRecorder.
 * The native module requests permission automatically on first use.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  // react-native-audio-api handles permission via its native module
  return true;
}
