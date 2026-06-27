export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  weightKg: number | null;
  /** Photo URI for visual identification (future multi-dog support) */
  photoUri: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
