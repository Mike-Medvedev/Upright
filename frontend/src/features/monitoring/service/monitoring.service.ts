import type { ValidatedFrame, ValidationData } from "@/features/monitoring/monitoring.types";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import { BoxDiagonalHeuristic } from "@/features/monitoring/service/heuristics/BoxDiagonalHeuristic";
import { EarAsymmetryHeuristic } from "@/features/monitoring/service/heuristics/EarAsymmetryHeuristic";
import { NoseShoulderHeightHeuristic } from "@/features/monitoring/service/heuristics/NoseShoulderHeightHeuristic";
import {
  extractMonitoringKeypoints,
  parseMonitoringFrame,
  scaleMonitoringFrame,
} from "@/features/monitoring/utils/monitoring-frame.utils";

/**
 * A singleton orchestrator service that processes video frames to monitor posture
 * and positioning metrics.
 * * ### Workflow:
 * 1. **Ingestion**: Parses raw WebRTC data into validated frames.
 * 2. **Scaling**: Normalizes coordinate data to match the current video display dimensions.
 * 3. **Heuristics**: Delegates specific metric logic to specialized sub-services:
 */
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

  /**
   * Validates and parses raw inference data into a structured `ValidatedFrame`.
   * @param data - Raw output from the Inference SDK.
   * @returns An object containing either the `validatedFrame` or an `InferenceError`.
   */
  parseFrame(
    data: WebRTCOutputData,
  ):
    | { validatedFrame: ValidatedFrame; error: null }
    | { validatedFrame: null; error: InferenceError } {
    return parseMonitoringFrame(data);
  }

  /**
   * The primary processing loop for the monitoring session.
   * * - **In Calibration Mode**: Feeds data to heuristics to build an average baseline.
   * - **In Live Mode**: Evaluates current frame data against the calibrated baselines.
   * * @param frame The validated frame data to process.
   * @returns
   * - `data`: Validated posture and distance metrics (if in Live mode).
   * - `error`: Any processing or inference errors encountered.
   * - `calibration`: Progress and completion status (if in Calibration mode).
   */
  process(
    frame: ValidatedFrame,
  ):
    | { data: ValidationData; error: null; calibration: null }
    | { data: null; error: InferenceError; calibration: null }
    | { data: null; error: null; calibration: { progress: number; isComplete: boolean } } {
    if (!this.hasVideoDimensions()) {
      return {
        data: null,
        error: new InferenceError("MISSING_VIDEO_DIMENSIONS"),
        calibration: null,
      };
    }

    const scaledFrame = scaleMonitoringFrame(frame, this.videoDimensions);
    const prediction = scaledFrame.output.predictions[0];
    const { keypoints, error } = extractMonitoringKeypoints(prediction.keypoints);

    if (error) return { data: null, error, calibration: null };

    if (this._isCalibrating) {
      const noseCalibration = this.noseShoulderHeightHeuristic.calibrate(keypoints);
      const earCalibration = this.earAsymmetryHeuristic.calibrate(keypoints);
      const boxCalibration = this.boxDiagonalHeuristic.calibrate(prediction);

      const calibrationError =
        noseCalibration.error ?? earCalibration.error ?? boxCalibration.error;
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

  /**
   * Updates the service with the current rendering dimensions of the video element.
   * Required for accurate coordinate scaling.
   */
  setDimensions(dimensions: { width: number; height: number }) {
    this.videoDimensions = dimensions;
  }

  /**
   * Calculates the aggregate calibration progress across all active heuristics.
   * @returns The average progress as a percentage (0-100).
   */
  get progress() {
    return Math.round(
      (this.noseShoulderHeightHeuristic.progress +
        this.earAsymmetryHeuristic.progress +
        this.boxDiagonalHeuristic.progress) /
        3,
    );
  }

  get isCalibrating(): boolean {
    return this._isCalibrating;
  }
  set isCalibrating(status: boolean) {
    this._isCalibrating = status;
  }

  /**
   * Resets all heuristic buffers and initiates the calibration phase.
   */
  startCalibration() {
    this.noseShoulderHeightHeuristic.flush();
    this.earAsymmetryHeuristic.flush();
    this.boxDiagonalHeuristic.flush();
    this._isCalibrating = true;
  }
  /**
   * Fully clears the session state, including calibration baselines and sliding window buffers.
   */
  resetSession() {
    this.noseShoulderHeightHeuristic.flush();
    this.earAsymmetryHeuristic.flush();
    this.boxDiagonalHeuristic.flush();
    this._isCalibrating = false;
  }
}

export const monitoringService = new MonitoringService();
