import type { PermissionResponse } from 'expo-modules-core';

/**
 * Request microphone recording permission.
 * Returns `true` if the permission is granted.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  // Use the global expo-modules-core permissions API which works
  // independently of any specific audio/camera package.
  try {
    // expo-modules-core exposes a permissions API if any module has registered
    // a microphone permission handler. @siteed/audio-studio registers one.
    const { requireNativeModule } = await import('expo-modules-core');
    const AudioStudio = requireNativeModule('AudioStudio');
    const result: PermissionResponse = await AudioStudio.requestPermissionsAsync?.();
    return result?.granted ?? false;
  } catch {
    // Fallback: assume not granted
    return false;
  }
}

/**
 * Resolve a permission status without prompting.
 */
export async function getMicrophonePermission(): Promise<boolean> {
  try {
    const { requireNativeModule } = await import('expo-modules-core');
    const AudioStudio = requireNativeModule('AudioStudio');
    const result: PermissionResponse = await AudioStudio.getPermissionsAsync?.();
    return result?.granted ?? false;
  } catch {
    return false;
  }
}
