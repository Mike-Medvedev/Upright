import { InferenceError } from "@/lib/errors";
import {
  CalibrationBuffer,
  SlidingWindowBuffer,
} from "@/features/monitoring/service/heuristics/core/buffer";

export abstract class Heuristic<TInput, TOutput> {
  protected slidingWindowBuffer: SlidingWindowBuffer;
  protected calibrationBuffer: CalibrationBuffer;
  protected calibratedValue: number | null = null;

  constructor(windowSize: number, calibrationSize: number) {
    this.slidingWindowBuffer = new SlidingWindowBuffer(windowSize);
    this.calibrationBuffer = new CalibrationBuffer(calibrationSize);
  }

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

  evaluate(input: TInput): TOutput {
    const value = this.calculate(input);
    if (value === null) return this.getDefaultStatus();

    this.slidingWindowBuffer.push(value);
    return this.evaluateStatus();
  }

  get progress(): number {
    return this.calibrationBuffer.progress;
  }

  get isCalibrationComplete(): boolean {
    return this.calibrationBuffer.isFull;
  }

  protected abstract calculate(input: TInput): number | null;
  protected abstract getCalibrationError(input: TInput): InferenceError | null;

  flush() {
    this.slidingWindowBuffer.flush();
    this.calibrationBuffer.flush();
    this.calibratedValue = null;
  }

  protected abstract evaluateStatus(): TOutput;
  protected abstract getDefaultStatus(): TOutput;
}
