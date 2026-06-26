import { DetectionClass } from '@dwatcher/types';

/**
 * Interface for a TFLite model loaded into memory.
 * Platform-specific implementations provide the actual interpreter.
 */
export interface TFLiteModel {
  /** Unique identifier for this model. */
  readonly id: string;
  /** Input tensor shape expected by the model (e.g. [1, 64, 64]). */
  readonly inputShape: number[];
  /** Output tensor shape produced by the model (e.g. [1, 6]). */
  readonly outputShape: number[];
  /** Sample rate expected for audio input. */
  readonly expectedSampleRate: number;
}

/**
 * Result produced by running inference on a single input.
 */
export interface InferenceResult {
  /** Raw output logits/probabilities from the model. */
  output: Float32Array;
  /** Processing time in milliseconds. */
  inferenceMs: number;
  /** Indices of classes that exceeded the threshold. */
  topClassIndex: number;
}

/**
 * Load a TFLite model from a given path.
 *
 * Stub — actual implementation requires native TFLite bindings.
 *
 * @param modelPath - Path to the .tflite model file
 * @returns A TFLiteModel instance
 */
export async function loadModel(modelPath: string): Promise<TFLiteModel> {
  // Stub: return a placeholder model
  return {
    id: modelPath,
    inputShape: [1, 64, 64],
    outputShape: [1, 6],
    expectedSampleRate: 16000,
  };
}

/**
 * Run inference on preprocessed audio features.
 *
 * Stub — actual implementation uses TFLite interpreter's runInference.
 *
 * @param model - The loaded TFLite model
 * @param input - Preprocessed input tensor (e.g. mel-spectrogram as flat Float32Array)
 * @returns Inference result
 */
export async function runInference(
  _model: TFLiteModel,
  _input: Float32Array,
): Promise<InferenceResult> {
  // Stub: return a placeholder result
  return {
    output: new Float32Array([0.1, 0.1, 0.1, 0.1, 0.5, 0.1]),
    inferenceMs: 0,
    topClassIndex: 4,
  };
}

/**
 * Labels for each output class index.
 * Index matches DetectionClass enum ordering: 0=Bark, 1=Whine, 2=Growl, 3=Howl, 4=Silence, 5=Other
 */
export const DETECTION_CLASS_LABELS: DetectionClass[] = [
  DetectionClass.Bark,
  DetectionClass.Whine,
  DetectionClass.Growl,
  DetectionClass.Howl,
  DetectionClass.Silence,
  DetectionClass.Other,
];
