export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  weightKg: number | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
