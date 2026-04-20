import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";

export function deriveMonitoringSessionStatus(
  isActive: boolean,
  error: Error | null,
  calibrationCountdown: number | null,
  isCalibrating: boolean,
  isCameraLoading: boolean,
  isInferenceLoading: boolean,
  requiresCalibration: boolean,
): MonitoringSessionStatus {
  if (!isActive) {
    return "idle";
  }

  if (error) {
    return "error";
  }

  if (calibrationCountdown !== null) {
    return "calibration_countdown";
  }

  if (isCalibrating) {
    return "calibrating";
  }

  if (isCameraLoading || isInferenceLoading) {
    return "connecting";
  }

  if (requiresCalibration) {
    return "needs_calibration";
  }

  return "live";
}
