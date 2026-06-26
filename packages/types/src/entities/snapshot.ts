export interface Snapshot {
  id: string;
  sessionId: string;
  capturedAt: string;
  uri: string; // Local file path or remote URL
  camera: 'front' | 'back';
}
