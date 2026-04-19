import type { Prediction, ValidationData } from "@/features/monitoring/monitoring.types";
import { InferenceError } from "@/lib/errors";
import { Heuristic } from "./heuristic";

export class BoxDiagonalHeuristic extends Heuristic<Prediction, ValidationData["frameDistanceStatus"]> {
  private readonly BOX_DIAGONAL_TOLERANCE = 0.15;

  constructor() {
    super(30, 150);
  }

  calculate(prediction: Prediction): number | null {
    if (!prediction.width || !prediction.height) {
      return null;
    }

    return Math.hypot(prediction.width, prediction.height);
  }

  override getCalibrationError(prediction: Prediction): InferenceError | null {
    if (!prediction.width || !prediction.height) {
      return new InferenceError("USER_OUT_OF_FRAME");
    }

    return null;
  }

  protected evaluateStatus(): ValidationData["frameDistanceStatus"] {
    if (this.calibratedValue == null) {
      return "within_bounds";
    }

    const minimumAllowedDiagonal = this.calibratedValue * (1 - this.BOX_DIAGONAL_TOLERANCE);
    const maximumAllowedDiagonal = this.calibratedValue * (1 + this.BOX_DIAGONAL_TOLERANCE);

    if (this.slidingWindowBuffer.average < minimumAllowedDiagonal) {
      return "too_far";
    }

    if (this.slidingWindowBuffer.average > maximumAllowedDiagonal) {
      return "too_close";
    }

    return "within_bounds";
  }

  protected getDefaultStatus(): ValidationData["frameDistanceStatus"] {
    return "within_bounds";
  }
}
