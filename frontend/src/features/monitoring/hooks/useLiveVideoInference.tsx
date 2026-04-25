import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useState, useEffectEvent } from "react";
import { useCanvas } from "@/features/canvas/hooks/useCanvas";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import { useCalibrationCountdown } from "@/features/monitoring/hooks/useCalibrationCountdown";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import { useMonitoringAlerts } from "@/features/monitoring/hooks/useMonitoringAlerts";
import { useMonitoringVideoCanvas } from "@/features/monitoring/hooks/useMonitoringVideoCanvas";
import {
  getInferenceHeaderState,
  getLivePostureHeaderState,
} from "@/features/monitoring/utils/monitoring-messages.utils";
import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import { deriveMonitoringSessionStatus } from "@/features/monitoring/utils/monitoring-session.utils";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import type {
  MonitoringSessionStatus,
  ValidationData,
} from "@/features/monitoring/monitoring.types";

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
  const { alertPreferences } = useMonitoring();
  const { cameraStream, isLoading: isCameraLoading, error: cameraError } = useLocalCamera(isActive);
  const { canvasRef, drawEdge, reset, resize } = useCanvas();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  //calibration state
  const [calibrationProgress, setProgress] = useState<number>(0);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number | null>(null);
  const [isCalibrating, setCalibrating] = useState<boolean>(false);
  const [requiresCalibration, setRequiresCalibration] = useState<boolean>(false);
  const [hasCalibratedThisSession, setHasCalibratedThisSession] = useState<boolean>(false);

  const [isHealthyPosture, setHealthyPosture] = useState<boolean | null>(null);

  //messaging state
  const [headerMessage, setHeaderMessage] = useState<string | null>(null);
  const [headerMessageTone, setHeaderMessageTone] = useState<"default" | "success" | "warning">(
    "default",
  );
  const { mapPointToDisplaySpace, videoRef } = useMonitoringVideoCanvas(
    isActive,
    cameraStream,
    resize,
  );

  const clearHeaderState = () => {
    setHeaderMessage(null);
    setHeaderMessageTone("default");
  };

  const applyInferenceHeaderState = (error: InferenceError) => {
    const nextHeaderState = getInferenceHeaderState(error);

    if (!nextHeaderState) {
      return;
    }

    setHeaderMessage(nextHeaderState.message);
    setHeaderMessageTone(nextHeaderState.tone);
  };

  const handlePostureProcessingError = (postureError: InferenceError) => {
    if (monitoringService.isCalibrating) {
      setProgress(monitoringService.progress);
    }

    setHealthyPosture(null);
    applyInferenceHeaderState(postureError);
  };

  const handleCalibrationFrame = (progress: number, isComplete: boolean) => {
    reset();
    setHealthyPosture(null);
    clearHeaderState();

    if (isComplete) {
      setProgress(100);
      setCalibrating(false);
      setRequiresCalibration(false);
      setHasCalibratedThisSession(true);
      return;
    }

    setProgress(progress);
  };

  const handlePreCalibrationFrame = () => {
    setRequiresCalibration(true);
    setHealthyPosture(null);
    clearHeaderState();
    reset();
  };

  const handleLivePostureFrame = (postureData: ValidationData) => {
    const { lShoulder, rShoulder } = postureData.keypoints;
    const displayLeftShoulder = mapPointToDisplaySpace({ x: lShoulder.x, y: lShoulder.y });
    const displayRightShoulder = mapPointToDisplaySpace({ x: rShoulder.x, y: rShoulder.y });
    const nextHeaderState = getLivePostureHeaderState(
      postureData.frameDistanceStatus,
      postureData.isHealthyPosture,
    );

    setHealthyPosture(postureData.isHealthyPosture);
    setHeaderMessage(nextHeaderState.message);
    setHeaderMessageTone(nextHeaderState.tone);
    reset();
    drawEdge({
      color: postureData.isHealthyPosture ? "rgba(64, 192, 87, 0.95)" : "rgba(250, 82, 82, 0.95)",
      point1: displayLeftShoulder,
      point2: displayRightShoulder,
      width: 6,
    });
  };

  const onData = useEffectEvent((data: WebRTCOutputData): void => {
    if (isLoading) {
      setLoading(false);
    }

    if (calibrationCountdown !== null) {
      setHealthyPosture(null);
      reset();
      return;
    }

    const { validatedFrame, error } = monitoringService.parseFrame(data);
    if (error instanceof InferenceError) {
      setHealthyPosture(null);
      applyInferenceHeaderState(error);
      if (error.code === "MISSING_PREDICTION_IMAGE_DIMENSIONS") {
        console.warn("MISSING_PREDICTION_IMAGE_DIMENSIONS");
        return;
      }
    }
    if (!validatedFrame?.output.predictions.length) return;

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
    if (!hasCalibratedThisSession) {
      handlePreCalibrationFrame();
      return;
    }
    handleLivePostureFrame(postureData);
  });

  useCalibrationCountdown(
    calibrationCountdown,
    setCalibrationCountdown,
    setProgress,
    setCalibrating,
  );

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
      setProgress(0);
      setCalibrationCountdown(null);
      setCalibrating(false);
      setHealthyPosture(null);
      setRequiresCalibration(false);
      setHasCalibratedThisSession(false);
      setHeaderMessage(null);
      setHeaderMessageTone("default");
      monitoringService.resetSession();
      reset();
    };
  }, [cameraStream, isActive, reset]);

  const combinedError = cameraError ?? error;
  const status: MonitoringSessionStatus = deriveMonitoringSessionStatus(
    isActive,
    combinedError,
    calibrationCountdown,
    isCalibrating,
    isCameraLoading,
    isLoading,
    requiresCalibration,
  );

  useMonitoringAlerts(isActive, status, isHealthyPosture, alertPreferences);

  const startCalibration = () => {
    setProgress(0);
    setCalibrationCountdown(3);
    setCalibrating(false);
    setRequiresCalibration(false);
    clearHeaderState();
  };

  return {
    videoRef,
    canvasRef,
    calibrationProgress,
    calibrationCountdown,
    error: combinedError,
    headerMessage,
    headerMessageTone,
    isHealthyPosture,
    isCalibrating,
    startCalibration,
    status,
  };
}
