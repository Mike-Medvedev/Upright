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

  flush() {
    this.slidingWindowBuffer.flush();
    this.calibrationBuffer.flush();
    this.calibratedValue = null;
  }

  protected abstract evaluateStatus(): TOutput;
  protected abstract getDefaultStatus(): TOutput;
}
