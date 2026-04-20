import type { ValidKeypoints } from "@/features/monitoring/monitoring.types";
import { InferenceError } from "@/lib/errors";
import { Heuristic } from "@/features/monitoring/service/heuristics/core/heuristic";
/**
 * Heuristic that monitors vertical posture (slouching) by measuring the
 * height of the nose relative to the shoulder midpoint.
 */
export class NoseShoulderHeightHeuristic extends Heuristic<ValidKeypoints, boolean> {
  /** The percentage of deviation allowed from the calibrated baseline.
   * 0.1 represents a 10% tolerance window.
   */
  private readonly POSTURE_TOLERANCE = 0.1;

  constructor() {
    super(30, 150);
  }

  /**
   * Calculates the normalized posture height.
   * Returns `null` if the nose is below the shoulders or if keypoints are missing.
   * @param keypoints - The validated nose and shoulder coordinates.
   */
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

  /**
   * Calculates the last 30 frames of posture vs the calibrated posture
   * @returns whether or not the posture is healthy or unhealthy
   */
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
