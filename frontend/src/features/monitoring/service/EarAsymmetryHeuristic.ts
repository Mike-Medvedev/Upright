import type { ValidKeypoints } from "@/features/monitoring/monitoring.types";
import { InferenceError } from "@/lib/errors";
import { Heuristic } from "./heuristic";

export class EarAsymmetryHeuristic extends Heuristic<ValidKeypoints, boolean> {
  private readonly EAR_ASYMMETRY_TOLERANCE = 0.08;

  constructor() {
    super(30, 150);
  }

  calculate({ lEar, rEar, lShoulder, rShoulder }: ValidKeypoints): number | null {
    if (!lEar || !rEar) {
      return null;
    }

    const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
    if (shoulderWidth === 0) {
      return null;
    }

    const leftEarToShoulder = Math.hypot(lShoulder.x - lEar.x, lShoulder.y - lEar.y);
    const rightEarToShoulder = Math.hypot(rShoulder.x - rEar.x, rShoulder.y - rEar.y);

    return Math.abs(leftEarToShoulder - rightEarToShoulder) / shoulderWidth;
  }

  override getCalibrationError({ lEar, rEar }: ValidKeypoints): InferenceError | null {
    if (!lEar || !rEar) {
      return new InferenceError("MISSING_EAR_KEYPOINTS");
    }

    return null;
  }

  protected evaluateStatus(): boolean {
    if (this.calibratedValue == null) {
      return true;
    }

    return this.slidingWindowBuffer.average <= this.calibratedValue + this.EAR_ASYMMETRY_TOLERANCE;
  }

  protected getDefaultStatus(): boolean {
    return true;
  }
}
