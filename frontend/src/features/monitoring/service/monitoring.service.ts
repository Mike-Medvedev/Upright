import type {
  Frame,
  Keypoint,
  Prediction,
  ValidatedFrame,
  ValidationData,
  ValidKeypoint,
  ValidKeypoints,
} from "@/features/monitoring/monitoring.types";
import { SlidingWindowBuffer, CalibrationBuffer } from "@/features/monitoring/service/Buffer";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";

//Todo: Ensure theres only one person in frame
export class MonitoringService {
  private readonly buffer: SlidingWindowBuffer;
  private calibrationBuffer: CalibrationBuffer;
  private videoDimensions: { width: number; height: number } = { width: 0, height: 0 };
  private calibratedHeight: number = 150 * 0.8;
  private _isCalibrating: boolean = false;

  constructor() {
    this.buffer = new SlidingWindowBuffer();
    this.calibrationBuffer = new CalibrationBuffer(150);
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
    const rawKeypoints = scaledFrame.output.predictions[0].keypoints;
    const { keypoints, error } = this.extractKeypoints(rawKeypoints);

    if (error) return { data: null, error, calibration: null };

    if (this._isCalibrating) {
      this.calibrationBuffer.push(keypoints);
      if (this.calibrationBuffer.isFull) {
        this.calibratedHeight = this.calibrationBuffer.calibratedHeight;
        console.log("Calibrated Height: ", this.calibratedHeight);
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
    return { data: { isHealthyPosture, keypoints }, error: null, calibration: null };
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
    // reset buffer by creating a fresh one
    this.calibrationBuffer = new CalibrationBuffer(150);
    this._isCalibrating = true;
  }

  private extractKeypoints(
    keypoints: Keypoint[],
  ): { keypoints: ValidKeypoints; error: null } | { keypoints: null; error: InferenceError } {
    let nose: ValidKeypoint | null = null;
    let lShoulder: ValidKeypoint | null = null;
    let rShoulder: ValidKeypoint | null = null;
    for (const k of keypoints) {
      if (k.class === "nose") {
        nose = k as ValidKeypoint;
      } else if (k.class === "left_shoulder") {
        lShoulder = k as ValidKeypoint;
      } else if (k.class === "right_shoulder") {
        rShoulder = k as ValidKeypoint;
      }
    }
    if (!nose) return { keypoints: null, error: new InferenceError("MISSING_NOSE_KEYPOINT") };
    if (!lShoulder)
      return { keypoints: null, error: new InferenceError("MISSING_LSHOULDER_KEYPOINT") };
    if (!rShoulder)
      return { keypoints: null, error: new InferenceError("MISSING_RSHOULDER_KEYPOINT") };
    return { keypoints: { nose, lShoulder, rShoulder }, error: null };
  }

  private validatePosture(keypoints: ValidKeypoints) {
    this.buffer.push(keypoints);
    return this.buffer.averagePostureHeight > this.calibratedHeight;
  }

  private scaleFrame(frame: ValidatedFrame): ValidatedFrame {
    const scaleX = this.videoDimensions.width / frame.output.image.width;
    const scaleY = this.videoDimensions.height / frame.output.image.height;

    const scaledPredictions = frame.output.predictions.map((prediction) => {
      return {
        ...prediction,
        x: prediction.x! * scaleX,
        y: prediction.y! * scaleY,
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
