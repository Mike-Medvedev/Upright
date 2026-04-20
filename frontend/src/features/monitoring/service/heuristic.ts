import { InferenceError } from "@/lib/errors";
import { CalibrationBuffer, SlidingWindowBuffer } from "./buffer";

export abstract class Heuristic<TInput, TOutput> {
  protected slidingWindowBuffer: SlidingWindowBuffer;
  protected calibrationBuffer: CalibrationBuffer;
  protected calibratedValue: number | null = null;

  constructor(windowSize: number, calibrationSize: number) {
    this.slidingWindowBuffer = new SlidingWindowBuffer(windowSize);
    this.calibrationBuffer = new CalibrationBuffer(calibrationSize);
  }

  abstract calculate(input: TInput): number | null;

  update(input: TInput, isCalibrating: boolean): TOutput {
    const value = this.calculate(input);
    if (value === null) return this.getDefaultStatus();

    if (isCalibrating) {
      this.calibrationBuffer.push(value);
      if (this.calibrationBuffer.isFull) {
        this.calibratedValue = this.calibrationBuffer.average;
      }
    } else {
      this.slidingWindowBuffer.push(value);
    }

    return this.evaluateStatus();
  }

  get progress(): number {
    return this.calibrationBuffer.progress;
  }

  get isCalibrationComplete(): boolean {
    return this.calibrationBuffer.isFull;
  }

  abstract getCalibrationError(_input: TInput): InferenceError | null 

  flush() {
    this.slidingWindowBuffer.flush();
    this.calibrationBuffer.flush();
    this.calibratedValue = null;
  }

  protected abstract evaluateStatus(): TOutput;
  protected abstract getDefaultStatus(): TOutput;
}
