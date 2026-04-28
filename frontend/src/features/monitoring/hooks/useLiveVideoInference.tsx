import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useState, useEffectEvent } from "react";
import { useCanvas } from "@/features/canvas/hooks/useCanvas";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import { useMonitoringAlerts } from "@/features/monitoring/hooks/useMonitoringAlerts";
import { useMonitoringVideoCanvas } from "@/features/monitoring/hooks/useMonitoringVideoCanvas";

import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import { deriveMonitoringSessionStatus } from "@/features/monitoring/utils/monitoring-session.utils";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import type {
  MonitoringSessionStatus,
  ValidationData,
} from "@/features/monitoring/monitoring.types";
import useCalibration from "./useCalibration";
import useMonitoringMessage from "./useMonitoringMessage";

/**
 * The primary orchestrator hook for live AI posture monitoring. The Glue between React and the Processing engine
 * This hook manages the end-to-end "Inference Loop":
 * 1. **Ingestion**: Connects to the local camera via `useLocalCamera`.
 * 2. **Inference**: Streams video tracks to `inferenceClient` (Roboflow/WebRTC).
 * 3. **Processing**: Passes raw AI predictions to `monitoringService` to validate posture and handle calibration.
 * 4. **UI Updates: Exposes State for Inference errors, messages, posture status that is consumed in Monitoring Page
 */
export function useLiveVideoInference(isActive: boolean) {
  //TODO: break up state into actions

  // Notifications
  const { alertPreferences } = useMonitoring();

  // Camera Stream
  const { cameraStream, isLoading: isCameraLoading, error: cameraError } = useLocalCamera(isActive);

  // Canvas
  const { canvasRef, drawEdge, resetCanvas, resize } = useCanvas();

  // Loading set by inference firing
  const [isLoading, setLoading] = useState<boolean>(true);

  // Error set by inferencing webrtc conn failing
  const [error, setError] = useState<Error | null>(null);

  //calibration state
  const {
    state,
    startCalibration,
    stopCalibration,
    completeCalibration,
    updateCalibrationProgress,
  } = useCalibration();

  // does Inference video require calibration
  const [requiresCalibration, setRequiresCalibration] = useState<boolean>(false);

  // Is the posture Healthy? Final output of pipeline
  const [isHealthyPosture, setHealthyPosture] = useState<boolean | null>(null);

  //messaging state
  const {
    headerMessage,
    headerMessageTone,
    resetHeaderMessage,
    setHeaderMessage,
    setHeaderMessageError,
  } = useMonitoringMessage();

  // manages Video Element and syncs to canvas
  const { mapPointToDisplaySpace, videoRef } = useMonitoringVideoCanvas(
    isActive,
    cameraStream,
    resize,
  );

  // handles error and updates UI from Frame processing
  const handlePostureProcessingError = (postureError: InferenceError) => {
    if (monitoringService.isCalibrating) {
      updateCalibrationProgress(monitoringService.progress);
    }

    setHealthyPosture(null);
    setHeaderMessageError(postureError);
  };

  //Updates UI from Frame Processing
  const handleCalibrationFrame = (progress: number, isComplete: boolean) => {
    resetCanvas();
    setHealthyPosture(null);
    resetHeaderMessage();

    if (isComplete) {
      //complete calibration
      completeCalibration();
      setRequiresCalibration(false);
      return;
    }
    updateCalibrationProgress(progress);
  };

  // Updates UIO from Frame processing
  const handlePreCalibrationFrame = () => {
    setRequiresCalibration(true); // set required calibration might not be part of calibration
    setHealthyPosture(null);
    resetHeaderMessage();
    resetCanvas();
  };

  // update UI from Frame Processing
  const handleLivePostureFrame = (postureData: ValidationData) => {
    const { lShoulder, rShoulder } = postureData.keypoints;
    const displayLeftShoulder = mapPointToDisplaySpace({ x: lShoulder.x, y: lShoulder.y });
    const displayRightShoulder = mapPointToDisplaySpace({ x: rShoulder.x, y: rShoulder.y });

    setHeaderMessage(postureData);

    setHealthyPosture(postureData.isHealthyPosture);
    resetCanvas();
    drawEdge({
      color: postureData.isHealthyPosture ? "rgba(64, 192, 87, 0.95)" : "rgba(250, 82, 82, 0.95)",
      point1: displayLeftShoulder,
      point2: displayRightShoulder,
      width: 6,
    });
  };

  // Main Frame processing handler for inference client
  const onData = useEffectEvent((data: WebRTCOutputData): void => {
    // setUI based on this handler
    if (isLoading) {
      setLoading(false);
    }

    // set UI state and reset canvas based on calibratin countdown THIS DOESNT NEED TO BE HERE
    if (state.calibrationCountdown !== null) {
      setHealthyPosture(null);
      resetCanvas();
      return;
    }

    // parse frame, should be here part of pipeline
    const { validatedFrame, error } = monitoringService.parseFrame(data);
    if (error instanceof InferenceError) {
      setHealthyPosture(null);
      setHeaderMessageError(error);
      if (error.code === "MISSING_PREDICTION_IMAGE_DIMENSIONS") {
        console.warn("MISSING_PREDICTION_IMAGE_DIMENSIONS");
        return;
      }
    }
    if (!validatedFrame?.output.predictions.length) return;

    // process frame should be here part of pipeline
    const {
      data: postureData,
      error: postureError,
      calibration: calibrationData,
    } = monitoringService.process(validatedFrame);
    if (postureError && !postureData) {
      if (postureError instanceof InferenceError) {
        handlePostureProcessingError(postureError);
        return;
      }
    }
    if (calibrationData != null) {
      handleCalibrationFrame(calibrationData.progress, calibrationData.isComplete);
      return;
    }
    if (!postureData) return;
    if (!state.hasCalibratedThisSession) {
      handlePreCalibrationFrame();
      return;
    }
    handleLivePostureFrame(postureData);
  });

  // on Comopnent mount starts the inference client? But honestly this should be starting on an event on a button click not on mount
  useEffect(() => {
    if (!isActive || !cameraStream) {
      return;
    }

    let disposed = false;

    inferenceClient.start(cameraStream, onData).catch((error) => {
      if (!disposed) {
        setError(error);
        setLoading(false);
      }
    });

    return () => {
      disposed = true;
      inferenceClient.stop();
      setLoading(true);
      setError(null);
      stopCalibration();
      setHealthyPosture(null);
      setRequiresCalibration(false);
      resetHeaderMessage();
      monitoringService.resetSession();
      resetCanvas();
    };
  }, [cameraStream, isActive, resetCanvas, stopCalibration, resetHeaderMessage]);

  const combinedError = cameraError ?? error;
  const status: MonitoringSessionStatus = deriveMonitoringSessionStatus(
    isActive,
    combinedError,
    state.calibrationCountdown,
    state.isCalibrating,
    isCameraLoading,
    isLoading,
    requiresCalibration,
  );

  useMonitoringAlerts(isActive, status, isHealthyPosture, alertPreferences);

  const initCalibration = () => {
    startCalibration();
    setRequiresCalibration(false);
    resetHeaderMessage();
  };

  return {
    calibrationCountdown: state.calibrationCountdown,
    calibrationProgress: state.calibrationProgress,
    videoRef,
    canvasRef,
    error: combinedError,
    headerMessage,
    headerMessageTone,
    isHealthyPosture,
    initCalibration,
    status,
  };
}
