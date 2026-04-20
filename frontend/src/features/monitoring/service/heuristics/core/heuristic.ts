import { InferenceError } from "@/lib/errors";
import {
  CalibrationBuffer,
  SlidingWindowBuffer,
} from "@/features/monitoring/service/heuristics/core/buffer";

/**
 * Abstract base class for monitoring heuristics that require both a calibration
 * baseline and real-time data smoothing.
 * * This class implements a two-phase lifecycle:
 * 1. **Calibration Phase**: Accumulates data in a fixed buffer to establish a "normal" baseline.
 * 2. **Evaluation Phase**: Compares incoming live data against that baseline using a sliding window.
 * @template TInput - The type of data being processed (e.g., Keypoints or Predictions).
 * @template TOutput - The type of the final assessment (e.g., boolean or status string).
 */
export abstract class Heuristic<TInput, TOutput> {
  /** Buffer used to smooth out noise during live monitoring. */
  protected slidingWindowBuffer: SlidingWindowBuffer;

  /** Buffer used to collect samples and calculate the initial baseline. */
  protected calibrationBuffer: CalibrationBuffer;

  /** The derived baseline value established after successful calibration. */
  protected calibratedValue: number | null = null;

  /**
   * @param windowSize - Number of frames to use for live data smoothing.
   * @param calibrationSize - Number of frames required to establish a stable baseline.
   */
  constructor(windowSize: number, calibrationSize: number) {
    this.slidingWindowBuffer = new SlidingWindowBuffer(windowSize);
    this.calibrationBuffer = new CalibrationBuffer(calibrationSize);
  }

  /**
   * Processes a frame specifically for the purpose of establishing a baseline.
   * If calibration is already complete, this method will not update the baseline further.
   * @param input - The raw data to be analyzed.
   * @returns An object containing the current progress and any environmental errors blocking calibration.
   */
  calibrate(input: TInput): {
    error: InferenceError | null;
    progress: number;
    isComplete: boolean;
  } {
    const error = this.getCalibrationError(input);
    if (error) {
      return {
        error,
        progress: this.progress,
        isComplete: this.isCalibrationComplete,
      };
    }

    const value = this.calculate(input);
    if (value !== null) {
      this.calibrationBuffer.push(value);
      if (this.calibrationBuffer.isFull) {
        this.calibratedValue = this.calibrationBuffer.average;
      }
    }

    return {
      error: null,
      progress: this.progress,
      isComplete: this.isCalibrationComplete,
    };
  }

  /**
   * Performs live evaluation of a frame against the established baseline.
   * * @param input - The raw data to be analyzed.
   * @returns The heuristic's assessment (e.g., is posture healthy? is the user too close?).
   */
  evaluate(input: TInput): TOutput {
    const value = this.calculate(input);
    if (value === null) return this.getDefaultStatus();

    this.slidingWindowBuffer.push(value);
    return this.evaluateStatus();
  }

  /** The current completion percentage of the calibration phase (0-100). */
  get progress(): number {
    return this.calibrationBuffer.progress;
  }

  /** Whether the calibration buffer has reached its target sample size. */
  get isCalibrationComplete(): boolean {
    return this.calibrationBuffer.isFull;
  }

  /**
   * Extracts a numeric metric from the input data (e.g., height-to-width ratio).
   * Returning `null` signifies that the required keypoints were not found in the frame.
   */
  protected abstract calculate(input: TInput): number | null;

  /**
   * Validates if the current frame is suitable for calibration (e.g., user is actually in frame).
   */
  protected abstract getCalibrationError(input: TInput): InferenceError | null;

  /**
   * Clears all internal buffers and resets the calibrated baseline.
   */
  flush() {
    this.slidingWindowBuffer.flush();
    this.calibrationBuffer.flush();
    this.calibratedValue = null;
  }

  /**
   * Compares the current sliding window average against the `calibratedValue`.
   * Invoked only when valid data is present.
   */
  protected abstract evaluateStatus(): TOutput;

  /**
   * Returns a fallback status to use when `calculate` returns `null` (e.g., missing data).
   */
  protected abstract getDefaultStatus(): TOutput;
}
