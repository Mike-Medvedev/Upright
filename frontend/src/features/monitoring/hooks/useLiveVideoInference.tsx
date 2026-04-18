import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useState, useEffectEvent, useCallback } from "react";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useCanvas from "./useCanvas";
import { monitoringService } from "../service/monitoring.service";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";

export function useLiveVideoInference(isActive: boolean) {
  const { cameraStream, isLoading: isCameraLoading, error: cameraError } = useLocalCamera(isActive);
  const { canvasRef, drawEdge, reset, resize } = useCanvas();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [calibrationProgress, setProgress] = useState<number>(0);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number | null>(null);
  const [isCalibrating, setCalibrating] = useState<boolean>(false);
  const [isHealthyPosture, setHealthyPosture] = useState<boolean | null>(null);
  const [requiresCalibration, setRequiresCalibration] = useState<boolean>(false);
  const [hasCalibratedThisSession, setHasCalibratedThisSession] = useState<boolean>(false);
  const [headerMessage, setHeaderMessage] = useState<string | null>(null);
  const [headerMessageTone, setHeaderMessageTone] = useState<"default" | "success" | "warning">("default");

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node) {
        node.srcObject = cameraStream;
        node.onloadedmetadata = () => {
          resize(node.videoWidth, node.videoHeight);
          monitoringService.setDimensions({ width: node.videoWidth, height: node.videoHeight });
        };
      }
    },
    [cameraStream, resize],
  );
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
      const nextHeaderState = getInferenceHeaderState(error);
      if (nextHeaderState) {
        setHeaderMessage(nextHeaderState.message);
        setHeaderMessageTone(nextHeaderState.tone);
      }
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
        setHealthyPosture(null);
        const nextHeaderState = getInferenceHeaderState(postureError);
        if (nextHeaderState) {
          setHeaderMessage(nextHeaderState.message);
          setHeaderMessageTone(nextHeaderState.tone);
        }
        return;
      }
    }
    if (calibrationData != null) {
      reset();
      setHealthyPosture(null);
      setHeaderMessage(null);
      setHeaderMessageTone("default");
      if (calibrationData.isComplete) {
        setProgress(100);
        setCalibrating(false);
        setRequiresCalibration(false);
        setHasCalibratedThisSession(true);
      } else {
        setProgress(calibrationData.progress);
      }
      return;
    }
    if (!postureData) return;
    if (!hasCalibratedThisSession) {
      setRequiresCalibration(true);
      setHealthyPosture(null);
      setHeaderMessage(null);
      setHeaderMessageTone("default");
      reset();
      return;
    }
    const { lShoulder, rShoulder } = postureData.keypoints;
    setHealthyPosture(postureData.isHealthyPosture);
    setHeaderMessage(postureData.isHealthyPosture ? "Healthy posture" : "Unhealthy posture");
    setHeaderMessageTone(postureData.isHealthyPosture ? "success" : "warning");
    reset();
    drawEdge({
      color: postureData.isHealthyPosture ? "rgba(64, 192, 87, 0.95)" : "rgba(250, 82, 82, 0.95)",
      point1: { x: lShoulder.x, y: lShoulder.y },
      point2: { x: rShoulder.x, y: rShoulder.y },
      width: 6,
    });
  });

  useEffect(() => {
    if (calibrationCountdown === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (calibrationCountdown === 1) {
        setCalibrationCountdown(null);
        setProgress(0);
        setCalibrating(true);
        monitoringService.startCalibration();
        return;
      }

      setCalibrationCountdown((current) => (current == null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [calibrationCountdown]);

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
  let status: MonitoringSessionStatus = "idle";

  if (isActive) {
    if (combinedError) {
      status = "error";
    } else if (calibrationCountdown !== null) {
      status = "calibration_countdown";
    } else if (isCalibrating) {
      status = "calibrating";
    } else if (isCameraLoading || isLoading) {
      status = "connecting";
    } else if (requiresCalibration) {
      status = "needs_calibration";
    } else {
      status = "live";
    }
  }

  const startCalibration = () => {
    setProgress(0);
    setCalibrationCountdown(3);
    setCalibrating(false);
    setRequiresCalibration(false);
    setHeaderMessage(null);
    setHeaderMessageTone("default");
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

function getInferenceHeaderState(error: InferenceError): { message: string; tone: "warning" } | null {
  switch (error.code) {
    case "MISSING_KEYPOINTS":
      return { message: "Please make sure both shoulders and head are in frame!", tone: "warning" };
    case "MISSING_NOSE_KEYPOINT":
      return { message: "Please make sure your nose is in frame!", tone: "warning" };
    case "MISSING_LSHOULDER_KEYPOINT":
      return { message: "Please make sure your left shoulder is in frame!", tone: "warning" };
    case "MISSING_RSHOULDER_KEYPOINT":
      return { message: "Please make sure your right shoulder is in frame!", tone: "warning" };
    case "MULTIPLE_PERSONS_IN_FRAME":
      return { message: "Please make sure only one person is in frame!", tone: "warning" };
    default:
      return null;
  }
}
