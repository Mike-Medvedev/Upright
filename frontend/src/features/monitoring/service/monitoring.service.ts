import type { ValidatedFrame, ValidationData } from "@/features/monitoring/monitoring.types";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import { BoxDiagonalHeuristic } from "@/features/monitoring/service/BoxDiagonalHeuristic";
import { EarAsymmetryHeuristic } from "@/features/monitoring/service/EarAsymmetryHeuristic";
import { NoseShoulderHeightHeuristic } from "@/features/monitoring/service/NoseShoulderHeightHeuristic";
import {
  extractMonitoringKeypoints,
  parseMonitoringFrame,
  scaleMonitoringFrame,
} from "@/features/monitoring/service/monitoring-frame.utils";

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
    return parseMonitoringFrame(data);
  }

  process(
    frame: ValidatedFrame,
  ):
    | { data: ValidationData; error: null; calibration: null }
    | { data: null; error: InferenceError; calibration: null }
    | { data: null; error: null; calibration: { progress: number; isComplete: boolean } } {
    if (!this.hasVideoDimensions()) {
      return { data: null, error: new InferenceError("MISSING_VIDEO_DIMENSIONS"), calibration: null };
    }

    const scaledFrame = scaleMonitoringFrame(frame, this.videoDimensions);
    const prediction = scaledFrame.output.predictions[0];
    const { keypoints, error } = extractMonitoringKeypoints(prediction.keypoints);

    if (error) return { data: null, error, calibration: null };

    if (this._isCalibrating) {
      const noseCalibration = this.noseShoulderHeightHeuristic.calibrate(keypoints);
      const earCalibration = this.earAsymmetryHeuristic.calibrate(keypoints);
      const boxCalibration = this.boxDiagonalHeuristic.calibrate(prediction);

      const calibrationError = noseCalibration.error ?? earCalibration.error ?? boxCalibration.error;
      if (calibrationError) {
        return { data: null, error: calibrationError, calibration: null };
      }

      const isComplete =
        noseCalibration.isComplete && earCalibration.isComplete && boxCalibration.isComplete;
      if (isComplete) {
        this._isCalibrating = false;
      }

      return {
        data: null,
        error: null,
        calibration: {
          progress: Math.round(
            (noseCalibration.progress + earCalibration.progress + boxCalibration.progress) / 3,
          ),
          isComplete,
        },
      };
    }

    const isHealthyPosture =
      this.noseShoulderHeightHeuristic.evaluate(keypoints) &&
      this.earAsymmetryHeuristic.evaluate(keypoints);
    const frameDistanceStatus = this.boxDiagonalHeuristic.evaluate(prediction);

    return {
      data: {
        isHealthyPosture,
        frameDistanceStatus,
        keypoints,
      },
      error: null,
      calibration: null,
    };
  }

  private hasVideoDimensions() {
    return this.videoDimensions.width > 0 && this.videoDimensions.height > 0;
  }
  setDimensions(dimensions: { width: number; height: number }) {
    this.videoDimensions = dimensions;
  }

  get progress() {
    return Math.round(
      (
        this.noseShoulderHeightHeuristic.progress +
        this.earAsymmetryHeuristic.progress +
        this.boxDiagonalHeuristic.progress
      ) / 3,
    );
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
}

export const monitoringService = new MonitoringService();
