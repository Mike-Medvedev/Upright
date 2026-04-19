import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useState, useEffectEvent, useCallback, useRef } from "react";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useCanvas from "./useCanvas";
import type { Point } from "../service/canvas.service";
import { monitoringAlertsService } from "../service/monitoring-alerts.service";
import { monitoringService } from "../service/monitoring.service";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";

const BAD_POSTURE_ALERT_DELAY_MS = 5000;
const BAD_POSTURE_ALERT_COOLDOWN_MS = 5000;

export function useLiveVideoInference(isActive: boolean) {
  const { alertPreferences } = useMonitoring();
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
  const latestAlertPreferencesRef = useRef(alertPreferences);
  const latestIsHealthyPostureRef = useRef<boolean | null>(null);
  const latestStatusRef = useRef<MonitoringSessionStatus>("idle");
  const unhealthySinceRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef<number | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const syncCanvasToDisplay = useCallback(() => {
    const node = videoElementRef.current;
    if (!node) return;

    const renderedWidth = Math.round(node.clientWidth);
    const renderedHeight = Math.round(node.clientHeight);

    if (!renderedWidth || !renderedHeight) return;

    resize(renderedWidth, renderedHeight);
  }, [resize]);

  const mapPointToDisplaySpace = useCallback((point: Point): Point => {
    const node = videoElementRef.current;
    if (!node) return point;

    const sourceWidth = node.videoWidth;
    const sourceHeight = node.videoHeight;
    const renderedWidth = node.clientWidth;
    const renderedHeight = node.clientHeight;

    if (!sourceWidth || !sourceHeight || !renderedWidth || !renderedHeight) {
      return point;
    }

    const coverScale = Math.max(renderedWidth / sourceWidth, renderedHeight / sourceHeight);
    const drawnWidth = sourceWidth * coverScale;
    const drawnHeight = sourceHeight * coverScale;
    const offsetX = (renderedWidth - drawnWidth) / 2;
    const offsetY = (renderedHeight - drawnHeight) / 2;

    return {
      x: point.x * coverScale + offsetX,
      y: point.y * coverScale + offsetY,
    };
  }, []);

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoElementRef.current = node;
      if (!node) return;

      node.srcObject = cameraStream;
      node.onloadedmetadata = () => {
        syncCanvasToDisplay();
        monitoringService.setDimensions({ width: node.videoWidth, height: node.videoHeight });
      };
    },
    [cameraStream, syncCanvasToDisplay],
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
    const displayLeftShoulder = mapPointToDisplaySpace({ x: lShoulder.x, y: lShoulder.y });
    const displayRightShoulder = mapPointToDisplaySpace({ x: rShoulder.x, y: rShoulder.y });
    setHealthyPosture(postureData.isHealthyPosture);
    if (!postureData.isWithinFrameBounds) {
      setHeaderMessage(
        postureData.frameDistanceStatus === "too_close"
          ? "Move farther back in frame"
          : "Move closer into frame",
      );
      setHeaderMessageTone("warning");
    } else {
      setHeaderMessage(postureData.isHealthyPosture ? "Healthy posture" : "Unhealthy posture");
      setHeaderMessageTone(postureData.isHealthyPosture ? "success" : "warning");
    }
    reset();
    drawEdge({
      color: postureData.isHealthyPosture ? "rgba(64, 192, 87, 0.95)" : "rgba(250, 82, 82, 0.95)",
      point1: displayLeftShoulder,
      point2: displayRightShoulder,
      width: 6,
    });
  });

  useEffect(() => {
    if (!isActive || !videoElementRef.current) {
      return;
    }

    syncCanvasToDisplay();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasToDisplay();
    });

    resizeObserver.observe(videoElementRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isActive, syncCanvasToDisplay]);

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

  useEffect(() => {
    latestAlertPreferencesRef.current = alertPreferences;
  }, [alertPreferences]);

  useEffect(() => {
    latestIsHealthyPostureRef.current = isHealthyPosture;
  }, [isHealthyPosture]);

  useEffect(() => {
    latestStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!isActive || status !== "live" || isHealthyPosture !== false) {
      unhealthySinceRef.current = null;
      return;
    }

    if (unhealthySinceRef.current === null) {
      unhealthySinceRef.current = Date.now();
    }
  }, [isActive, isHealthyPosture, status]);

  useEffect(() => {
    if (!isActive) {
      unhealthySinceRef.current = null;
      lastAlertAtRef.current = null;
      return;
    }

    const intervalId = window.setInterval(() => {
      if (latestStatusRef.current !== "live" || latestIsHealthyPostureRef.current !== false) {
        return;
      }

      const preferences = latestAlertPreferencesRef.current;
      if (!preferences.soundEnabled && !preferences.desktopNotificationsEnabled) {
        return;
      }

      const now = Date.now();

      if (unhealthySinceRef.current === null) {
        unhealthySinceRef.current = now;
        return;
      }

      if (now - unhealthySinceRef.current < BAD_POSTURE_ALERT_DELAY_MS) {
        return;
      }

      if (lastAlertAtRef.current !== null && now - lastAlertAtRef.current < BAD_POSTURE_ALERT_COOLDOWN_MS) {
        return;
      }

      lastAlertAtRef.current = now;

      if (preferences.soundEnabled) {
        monitoringAlertsService.speakBadPostureAlert();
      }

      if (preferences.desktopNotificationsEnabled) {
        monitoringAlertsService.showBadPostureNotification();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive]);

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
