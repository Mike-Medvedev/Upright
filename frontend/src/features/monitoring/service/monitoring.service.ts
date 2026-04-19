import type {
  Frame,
  Keypoint,
  Prediction,
  ValidatedFrame,
  ValidationData,
  ValidKeypoint,
  ValidKeypoints,
} from "@/features/monitoring/monitoring.types";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import { BoxDiagonalHeuristic } from "@/features/monitoring/service/BoxDiagonalHeuristic";
import { EarAsymmetryHeuristic } from "@/features/monitoring/service/EarAsymmetryHeuristic";
import { NoseShoulderHeightHeuristic } from "@/features/monitoring/service/NoseShoulderHeightHeuristic";

//Todo: Ensure theres only one person in frame
export class MonitoringService {
  private noseShoulderHeightHeuristic: NoseShoulderHeightHeuristic;
  private earAsymmetryHeuristic: EarAsymmetryHeuristic;
  private boxDiagonalHeuristic: BoxDiagonalHeuristic;
  private videoDimensions: { width: number; height: number } = { width: 0, height: 0 };
  private _isCalibrating: boolean = false;

  constructor() {
    this.noseShoulderHeightHeuristic = new NoseShoulderHeightHeuristic();
    this.earAsymmetryHeuristic = new EarAsymmetryHeuristic();
    this.boxDiagonalHeuristic = new BoxDiagonalHeuristic();
  }

  parseFrame(
    data: WebRTCOutputData,
  ):
    | { validatedFrame: ValidatedFrame; error: null }
    | { validatedFrame: null; error: InferenceError } {
    const raw = data.serialized_output_data as Frame;

    // Verify the structural hierarchy exists
    const hasPredictions = raw?.output?.predictions?.length > 0;

    // Specifically check if the first prediction has the keypoints array
    if (!hasPredictions || !raw.output.predictions[0].keypoints) {
      return { validatedFrame: null, error: new InferenceError("MISSING_KEYPOINTS") };
    }

    if (!raw.output.image?.width || !raw.output.image?.height) {
      return {
        validatedFrame: null,
        error: new InferenceError("MISSING_PREDICTION_IMAGE_DIMENSIONS"),
      };
    }

    if (raw.output.predictions.length > 1) {
      return { validatedFrame: null, error: new InferenceError("MULTIPLE_PERSONS_IN_FRAME") };
    }

    return { validatedFrame: raw as ValidatedFrame, error: null };
  }

  setDimensions(dimensions: { width: number; height: number }) {
    this.videoDimensions = dimensions;
  }

  process(
    frame: ValidatedFrame,
  ):
    | { data: ValidationData; error: null; calibration: null }
    | { data: null; error: InferenceError; calibration: null }
    | { data: null; error: null; calibration: { progress: number; isComplete: boolean } } {
    const scaledFrame = this.scaleFrame(frame);
    const prediction = scaledFrame.output.predictions[0];
    const rawKeypoints = prediction.keypoints;
    const { keypoints, error } = this.extractKeypoints(rawKeypoints);

    if (error) return { data: null, error, calibration: null };

    if (this._isCalibrating) {
      const earCalibrationError = this.earAsymmetryHeuristic.getCalibrationError(keypoints);
      const boxDiagonalCalibrationError = this.boxDiagonalHeuristic.getCalibrationError(prediction);

      this.noseShoulderHeightHeuristic.update(keypoints, true);

      if (!earCalibrationError) {
        this.earAsymmetryHeuristic.update(keypoints, true);
      }

      if (!boxDiagonalCalibrationError) {
        this.boxDiagonalHeuristic.update(prediction, true);
      }

      const isComplete = this.isCalibrationComplete();
      if (isComplete) {
        this._isCalibrating = false;
      }

      const calibrationError = earCalibrationError ?? boxDiagonalCalibrationError;
      if (calibrationError) {
        return { data: null, error: calibrationError, calibration: null };
      }

      return {
        data: null,
        error: null,
        calibration: {
          progress: this.calculateOverallCalibrationProgress(),
          isComplete,
        },
      };
    }

    const hasHealthyPostureHeight = this.noseShoulderHeightHeuristic.update(keypoints, false);
    const hasHealthyHeadTilt = this.earAsymmetryHeuristic.update(keypoints, false);
    const frameDistanceStatus = this.boxDiagonalHeuristic.update(prediction, false);

    return {
      data: {
        isHealthyPosture: hasHealthyPostureHeight && hasHealthyHeadTilt,
        frameDistanceStatus,
        keypoints,
      },
      error: null,
      calibration: null,
    };
  }

  get progress() {
    return this.calculateOverallCalibrationProgress();
  }

  get isCalibrating(): boolean {
    return this._isCalibrating;
  }
  set isCalibrating(status: boolean) {
    this._isCalibrating = status;
  }

  startCalibration() {
    this.noseShoulderHeightHeuristic.flush();
    this.earAsymmetryHeuristic.flush();
    this.boxDiagonalHeuristic.flush();
    this._isCalibrating = true;
  }

  resetSession() {
    this.noseShoulderHeightHeuristic.flush();
    this.earAsymmetryHeuristic.flush();
    this.boxDiagonalHeuristic.flush();
    this._isCalibrating = false;
  }

  private extractKeypoints(
    keypoints: Keypoint[],
  ): { keypoints: ValidKeypoints; error: null } | { keypoints: null; error: InferenceError } {
    let nose: ValidKeypoint | null = null;
    let lShoulder: ValidKeypoint | null = null;
    let rShoulder: ValidKeypoint | null = null;
    let lEar: ValidKeypoint | undefined;
    let rEar: ValidKeypoint | undefined;
    for (const k of keypoints) {
      if (k.class === "nose") {
        nose = k as ValidKeypoint;
      } else if (k.class === "left_shoulder") {
        lShoulder = k as ValidKeypoint;
      } else if (k.class === "right_shoulder") {
        rShoulder = k as ValidKeypoint;
      } else if (k.class === "left_ear") {
        lEar = k as ValidKeypoint;
      } else if (k.class === "right_ear") {
        rEar = k as ValidKeypoint;
      }
    }
    if (!nose) return { keypoints: null, error: new InferenceError("MISSING_NOSE_KEYPOINT") };
    if (!lShoulder)
      return { keypoints: null, error: new InferenceError("MISSING_LSHOULDER_KEYPOINT") };
    if (!rShoulder)
      return { keypoints: null, error: new InferenceError("MISSING_RSHOULDER_KEYPOINT") };
    return { keypoints: { nose, lShoulder, rShoulder, lEar, rEar }, error: null };
  }

  private calculateOverallCalibrationProgress() {
    return Math.round(
      (
        this.noseShoulderHeightHeuristic.progress +
        this.earAsymmetryHeuristic.progress +
        this.boxDiagonalHeuristic.progress
      ) / 3,
    );
  }

  private isCalibrationComplete() {
    return (
      this.noseShoulderHeightHeuristic.isCalibrationComplete &&
      this.earAsymmetryHeuristic.isCalibrationComplete &&
      this.boxDiagonalHeuristic.isCalibrationComplete
    );
  }

  private scaleFrame(frame: ValidatedFrame): ValidatedFrame {
    const scaleX = this.videoDimensions.width / frame.output.image.width;
    const scaleY = this.videoDimensions.height / frame.output.image.height;

    const scaledPredictions = frame.output.predictions.map((prediction) => {
      return {
        ...prediction,
        x: prediction.x == null ? prediction.x : prediction.x * scaleX,
        y: prediction.y == null ? prediction.y : prediction.y * scaleY,
        width: prediction.width == null ? prediction.width : prediction.width * scaleX,
        height: prediction.height == null ? prediction.height : prediction.height * scaleY,
        keypoints: prediction.keypoints!.map((k) => ({
          ...k,
          x: k.x * scaleX,
          y: k.y * scaleY,
        })),
      };
    });
    return {
      ...frame,
      output: {
        ...frame.output,
        predictions: scaledPredictions as Prediction[] & [{ keypoints: Keypoint[] }],
      },
    };
  }
}

export const monitoringService = new MonitoringService();
