import type { ValidKeypoints } from "@/features/monitoring/monitoring.types";
import { InferenceError } from "@/lib/errors";
import { Heuristic } from "@/features/monitoring/service/heuristics/core/heuristic";

/**
 * Heuristic that monitors head tilt by comparing the relative
 * distances between each ear and its corresponding shoulder.
 */
export class EarAsymmetryHeuristic extends Heuristic<ValidKeypoints, boolean> {
  /** The maximum allowed increase in asymmetry compared to the calibrated baseline.
   * A value of 0.08 represents 8% of the shoulder width.
   */
  private readonly EAR_ASYMMETRY_TOLERANCE = 0.08;

  constructor() {
    super(30, 150);
  }

  /**
   * Calculates the normalized asymmetry score for the current frame.
   * Returns `null` if the ears are occluded or shoulder width cannot be determined.
   * @param keypoints - The validated keypoint coordinates from the inference engine.
   */
  protected calculate({ lEar, rEar, lShoulder, rShoulder }: ValidKeypoints): number | null {
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

  protected getCalibrationError({ lEar, rEar }: ValidKeypoints): InferenceError | null {
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

  /**
   * Fallback used when ears are not visiblew during live monitoring.
   * Returns `true` to avoid false-positive alerts when the user is simply wearing
   * headphones or has turned their head.
   */
  protected getDefaultStatus(): boolean {
    return true;
  }
}
