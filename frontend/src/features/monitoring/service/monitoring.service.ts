import type {
  Frame,
  Keypoint,
  Prediction,
  ValidatedFrame,
  ValidationData,
  ValidKeypoint,
  ValidKeypoints,
} from "@/features/monitoring/monitoring.types";
import { SlidingWindowBuffer, CalibrationBuffer } from "@/features/monitoring/service/buffer";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";

//Todo: Ensure theres only one person in frame
export class MonitoringService {
  private noseShoulderHeightBuffer: SlidingWindowBuffer;
  private liveEarAsymmetryBuffer: SlidingWindowBuffer;
  private liveBoxDiagonalBuffer: SlidingWindowBuffer;
  private calibrationBuffer: CalibrationBuffer;
  private videoDimensions: { width: number; height: number } = { width: 0, height: 0 };
  private calibratedNoseShoulderHeight: number = 0;
  private calibratedEarAsymmetry: number | null = null;
  private calibratedBoxDiagonal: number | null = null;

  private calibrationEarAsymmetryCount: number = 0;
  private calibrationEarAsymmetryTotal: number = 0;
  private calibrationBoxDiagonalCount: number = 0;
  private calibrationBoxDiagonalTotal: number = 0;
  private _isCalibrating: boolean = false;
  private readonly POSTURE_TOLERANCE: number = 0.1;
  private readonly EAR_ASYMMETRY_TOLERANCE: number = 0.08;
  private readonly EAR_ASYMMETRY_WINDOW_SIZE: number = 30;
  private readonly BOX_DIAGONAL_TOLERANCE: number = 0.15;
  private readonly BOX_DIAGONAL_WINDOW_SIZE: number = 20;

  constructor() {
    this.noseShoulderHeightBuffer = new SlidingWindowBuffer(30);
    this.calibrationBuffer = new CalibrationBuffer(150);
    this.liveEarAsymmetryBuffer = new SlidingWindowBuffer(30);
    this.liveBoxDiagonalBuffer = new SlidingWindowBuffer(30);
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
      this.calibrationBuffer.push(keypoints);
      this.recordCalibrationEarAsymmetry(keypoints);
      this.recordCalibrationBoxDiagonal(prediction);
      if (this.calibrationBuffer.isFull) {
        this.calibratedNoseShoulderHeight = this.calibrationBuffer.calibratedNoseShoulderHeight;
        this.calibratedEarAsymmetry =
          this.calibrationEarAsymmetryCount === 0
            ? null
            : this.calibrationEarAsymmetryTotal / this.calibrationEarAsymmetryCount;
        this.calibratedBoxDiagonal =
          this.calibrationBoxDiagonalCount === 0
            ? null
            : this.calibrationBoxDiagonalTotal / this.calibrationBoxDiagonalCount;
        console.log("Calibrated Height: ", this.calibratedNoseShoulderHeight);
        this._isCalibrating = false;
      }
      return {
        data: null,
        error: null,
        calibration: {
          progress: this.calibrationBuffer.progress,
          isComplete: this.calibrationBuffer.isFull,
        },
      };
    }

    const isHealthyPosture = this.validatePosture(keypoints);
    const frameDistanceStatus = this.validateFrameBounds(prediction);
    return {
      data: { isHealthyPosture, frameDistanceStatus, keypoints },
      error: null,
      calibration: null,
    };
  }

  get progress() {
    return this.calibrationBuffer.progress;
  }

  get isCalibrating(): boolean {
    return this._isCalibrating;
  }
  set isCalibrating(status: boolean) {
    this._isCalibrating = status;
  }

  startCalibration() {
    this.noseShoulderHeightBuffer.flush();
    this.calibrationBuffer.flush();
    this.resetEarAsymmetryTracking();
    this.resetBoxDiagonalTracking();
    this._isCalibrating = true;
  }

  resetSession() {
    this.noseShoulderHeightBuffer.flush();
    this.calibrationBuffer.flush();
    this.calibratedNoseShoulderHeight = 0;
    this.resetEarAsymmetryTracking();
    this.resetBoxDiagonalTracking();
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

  private validatePosture(keypoints: ValidKeypoints) {
    const normalizedNoseShoulderHeights = this.normalizeNoseShoulderPostureHeights(keypoints);

    if (normalizedNoseShoulderHeights !== 0) {
      this.noseShoulderHeightBuffer.push(normalizedNoseShoulderHeights);
    }

    const hasHealthyPostureHeight =
      this.noseShoulderHeightBuffer.average >
        this.calibratedNoseShoulderHeight * (1 - this.POSTURE_TOLERANCE) &&
      this.noseShoulderHeightBuffer.average <
        this.calibratedNoseShoulderHeight * (1 + this.POSTURE_TOLERANCE);
    const hasHealthyHeadTilt = this.validateEarAsymmetry(keypoints);
    return hasHealthyPostureHeight && hasHealthyHeadTilt;
  }

  private normalizeNoseShoulderPostureHeights({
    nose,
    lShoulder,
    rShoulder,
  }: ValidKeypoints): number {
    const framePostureheight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
    if (framePostureheight <= 0 || shoulderWidth === 0) return 0;
    return framePostureheight / shoulderWidth;
  }

  private validateEarAsymmetry(keypoints: ValidKeypoints) {
    const asymmetry = this.getEarAsymmetry(keypoints);
    if (asymmetry == null) {
      return true;
    }

    this.liveEarAsymmetryBuffer.push(asymmetry);

    if (this.calibratedEarAsymmetry == null) {
      return true;
    }

    return (
      this.liveEarAsymmetryBuffer.average <=
      this.calibratedEarAsymmetry + this.EAR_ASYMMETRY_TOLERANCE
    );
  }

  private recordCalibrationEarAsymmetry(keypoints: ValidKeypoints) {
    const asymmetry = this.getEarAsymmetry(keypoints);
    if (asymmetry == null) {
      return;
    }

    this.calibrationEarAsymmetryTotal += asymmetry;
    this.calibrationEarAsymmetryCount += 1;
  }

  private getEarAsymmetry({ lEar, rEar, lShoulder, rShoulder }: ValidKeypoints) {
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

  private resetEarAsymmetryTracking() {
    this.calibratedEarAsymmetry = null;
    this.liveEarAsymmetryBuffer.flush();

    this.calibrationEarAsymmetryCount = 0;
    this.calibrationEarAsymmetryTotal = 0;
  }

  private validateFrameBounds(prediction: Prediction): ValidationData["frameDistanceStatus"] {
    const boxDiagonal = this.getBoxDiagonal(prediction);
    if (boxDiagonal == null) {
      return "within_bounds";
    }

    this.liveBoxDiagonalBuffer.push(boxDiagonal);

    if (this.calibratedBoxDiagonal == null) {
      return "within_bounds";
    }

    const minimumAllowedDiagonal = this.calibratedBoxDiagonal * (1 - this.BOX_DIAGONAL_TOLERANCE);
    const maximumAllowedDiagonal = this.calibratedBoxDiagonal * (1 + this.BOX_DIAGONAL_TOLERANCE);

    if (this.liveBoxDiagonalBuffer.average < minimumAllowedDiagonal) {
      return "too_far";
    }

    if (this.liveBoxDiagonalBuffer.average > maximumAllowedDiagonal) {
      return "too_close";
    }

    return "within_bounds";
  }

  private recordCalibrationBoxDiagonal(prediction: Prediction) {
    const boxDiagonal = this.getBoxDiagonal(prediction);
    if (boxDiagonal == null) {
      return;
    }

    this.calibrationBoxDiagonalTotal += boxDiagonal;
    this.calibrationBoxDiagonalCount += 1;
  }

  private getBoxDiagonal(prediction: Prediction) {
    if (!prediction.width || !prediction.height) {
      return null;
    }

    return Math.hypot(prediction.width, prediction.height);
  }

  private resetBoxDiagonalTracking() {
    this.calibratedBoxDiagonal = null;
    this.liveBoxDiagonalBuffer.flush();
    this.calibrationBoxDiagonalCount = 0;
    this.calibrationBoxDiagonalTotal = 0;
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
