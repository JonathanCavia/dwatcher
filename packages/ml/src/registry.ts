import type { TFLiteModel } from './inference';
import { loadModel } from './inference';

/**
 * Registry that manages multiple TFLite models (bark detector, behavior classifier, etc.).
 */
export class ModelRegistry {
  private models: Map<string, TFLiteModel> = new Map();

  /**
   * Register a model by loading it from the given path.
   */
  async register(id: string, modelPath: string): Promise<void> {
    const model = await loadModel(modelPath);
    this.models.set(id, model);
  }

  /**
   * Get a registered model by its identifier.
   */
  get(id: string): TFLiteModel | undefined {
    return this.models.get(id);
  }

  /**
   * Check if a model is registered.
   */
  has(id: string): boolean {
    return this.models.has(id);
  }

  /**
   * Remove a model from the registry.
   */
  unregister(id: string): void {
    this.models.delete(id);
  }

  /**
   * Remove all registered models.
   */
  clear(): void {
    this.models.clear();
  }

  /**
   * Get all registered model IDs.
   */
  list(): string[] {
    return Array.from(this.models.keys());
  }
}
