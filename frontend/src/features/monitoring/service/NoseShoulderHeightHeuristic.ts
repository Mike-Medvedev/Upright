import type { ValidKeypoints } from "@/features/monitoring/monitoring.types";
import { InferenceError } from "@/lib/errors";
import { Heuristic } from "./heuristic";

export class NoseShoulderHeightHeuristic extends Heuristic<ValidKeypoints, boolean> {
  private readonly POSTURE_TOLERANCE = 0.1;

  constructor() {
    super(30, 150);
  }

  protected calculate({ nose, lShoulder, rShoulder }: ValidKeypoints): number | null {
    const framePostureHeight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);

    if (framePostureHeight <= 0 || shoulderWidth === 0) {
      return null;
    }

    return framePostureHeight / shoulderWidth;
  }

  protected getCalibrationError(input: ValidKeypoints): InferenceError | null {
    if (this.calculate(input) === null) {
      return new InferenceError("INVALID_POSTURE_CALIBRATION");
    }

    return null;
  }

  protected evaluateStatus(): boolean {
    if (this.calibratedValue == null) {
      return false;
    }

    return (
      this.slidingWindowBuffer.average > this.calibratedValue * (1 - this.POSTURE_TOLERANCE) &&
      this.slidingWindowBuffer.average < this.calibratedValue * (1 + this.POSTURE_TOLERANCE)
    );
  }

  protected getDefaultStatus(): boolean {
    return false;
  }
}
