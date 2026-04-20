import type { MonitoringSessionStatus, ValidationData } from "@/features/monitoring/monitoring.types";
import { InferenceConnectionError, InferenceError, LocalCameraError } from "@/lib/errors";

export function getInferenceHeaderState(
  error: InferenceError,
): { message: string; tone: "warning" } | null {
  switch (error.code) {
    case "MISSING_VIDEO_DIMENSIONS":
      return null;
    case "MISSING_KEYPOINTS":
      return { message: "Please make sure both shoulders and head are in frame!", tone: "warning" };
    case "MISSING_EAR_KEYPOINTS":
      return { message: "Please make sure both ears are visible in frame!", tone: "warning" };
    case "MISSING_NOSE_KEYPOINT":
      return { message: "Please make sure your nose is in frame!", tone: "warning" };
    case "INVALID_POSTURE_CALIBRATION":
      return { message: "Please sit upright with your head above your shoulders.", tone: "warning" };
    case "MISSING_LSHOULDER_KEYPOINT":
      return { message: "Please make sure your left shoulder is in frame!", tone: "warning" };
    case "MISSING_RSHOULDER_KEYPOINT":
      return { message: "Please make sure your right shoulder is in frame!", tone: "warning" };
    case "USER_OUT_OF_FRAME":
      return { message: "Please make sure your body is fully visible in frame!", tone: "warning" };
    case "MULTIPLE_PERSONS_IN_FRAME":
      return { message: "Please make sure only one person is in frame!", tone: "warning" };
    default:
      return null;
  }
}

export function getMonitoringErrorMessage(error: Error | null) {
  if (!error) {
    return null;
  }

  if (error instanceof LocalCameraError) {
    return "The camera could not be started. Check camera permissions and try again.";
  }

  if (error instanceof InferenceConnectionError) {
    return "The inference API is unavailable. Check your connection and try again.";
  }

  return "We could not start posture monitoring. Please try again.";
}

export function getMonitoringHeaderMessage(
  status: MonitoringSessionStatus,
  errorMessage: string | null,
) {
  switch (status) {
    case "idle":
      return "Click Start Recording to monitor your posture while you work.";
    case "connecting":
      return "Connecting to Live Inference API and starting posture monitoring.";
    case "needs_calibration":
      return "Calibration required. Click Calibrate to continue.";
    case "calibration_countdown":
      return "Sit upright in a comfortable position. Calibration is about to begin.";
    case "live":
      return "Posture monitoring is live while you work.";
    case "calibrating":
      return "Please sit upright in a comfortable position during calibration.";
    case "error":
      return errorMessage ?? "The camera could not be started. Check permissions and try again.";
  }
}

export function getMonitoringHeaderTone(status: MonitoringSessionStatus) {
  switch (status) {
    case "error":
      return "warning";
    default:
      return "default";
  }
}

export function getLivePostureHeaderState(
  frameDistanceStatus: ValidationData["frameDistanceStatus"],
  isHealthyPosture: boolean,
): { message: string; tone: "success" | "warning" } {
  if (frameDistanceStatus !== "within_bounds") {
    return {
      message: frameDistanceStatus === "too_close" ? "Move farther back in frame" : "Move closer into frame",
      tone: "warning",
    };
  }

  return {
    message: isHealthyPosture ? "Healthy posture" : "Unhealthy posture",
    tone: isHealthyPosture ? "success" : "warning",
  };
}
