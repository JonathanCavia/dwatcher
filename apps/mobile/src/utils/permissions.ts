/**
 * Permission helpers — audio permission is not required while the
 * AudioService uses simulated metering.
 *
 * When a real native audio module is added, replace this with an
 * actual permission request (e.g. via expo-av or a custom module).
 */

/** Always returns true — simulated audio needs no mic permission. */
export async function requestMicrophonePermission(): Promise<boolean> {
  return true;
}
