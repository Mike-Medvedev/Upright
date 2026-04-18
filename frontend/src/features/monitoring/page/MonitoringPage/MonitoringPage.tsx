import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { CameraPreview } from "@/features/monitoring/components/CameraPreview";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";
import "./MonitoringPage.css";

export function MonitoringPage() {
  const { reset, startCamera, state, stopCamera, syncState } = useMonitoring();
  const {
    calibrationCountdown,
    calibrationProgress,
    canvasRef,
    error,
    headerMessage: inferenceHeaderMessage,
    headerMessageTone: inferenceHeaderMessageTone,
    isHealthyPosture,
    startCalibration,
    status,
    videoRef,
  } = useLiveVideoInference(state.isCameraActive);

  useEffect(() => {
    if (!state.isCameraActive) {
      return;
    }

    syncState({
      calibrationProgress,
      errorMessage: error?.message ?? null,
      status,
    });
  }, [calibrationProgress, error, state.isCameraActive, status, syncState]);

  useEffect(() => reset, [reset]);

  const isCameraActive = state.isCameraActive;
  const currentStatus = isCameraActive ? status : state.status;
  const currentErrorMessage = isCameraActive ? error?.message ?? null : state.errorMessage;
  const isCalibrating = currentStatus === "calibrating";
  const isCalibrationCountdown = currentStatus === "calibration_countdown";
  const canCalibrate =
    isCameraActive && (currentStatus === "live" || currentStatus === "needs_calibration");
  const headerMessage =
    isCameraActive && currentStatus !== "connecting"
      ? inferenceHeaderMessage ?? getHeaderMessage(currentStatus, currentErrorMessage)
      : getHeaderMessage(currentStatus, currentErrorMessage);
  const headerMessageTone =
    isCameraActive && currentStatus !== "connecting" && inferenceHeaderMessage
      ? inferenceHeaderMessageTone
      : getHeaderMessageTone(currentStatus);

  return (
    <Stack className="monitoringPage" gap="md">
      <Paper
        className={getPreviewCardClassName(isCameraActive, currentStatus, isHealthyPosture)}
        p={0}
        radius="lg"
      >
        <div className={`monitoringPreviewTopBar monitoringPreviewTopBar_${headerMessageTone}`}>
          <Text
            aria-live="polite"
            className={`monitoringPreviewTopTitle monitoringPreviewTopTitle_${headerMessageTone}`}
          >
            {headerMessage}
          </Text>
        </div>

        {isCameraActive ? (
          <>
            <CameraPreview
              calibrationCountdown={calibrationCountdown}
              calibrationProgress={calibrationProgress}
              canvasRef={canvasRef}
              errorMessage={currentErrorMessage}
              status={currentStatus}
              videoRef={videoRef}
            />
            <div className="monitoringControlsBar">
              <Group gap="sm" justify="center" wrap="wrap">
                <Button color="red" onClick={stopCamera} variant="light">
                  Stop Recording
                </Button>
                <Button
                  className={currentStatus === "needs_calibration" ? "monitoringCalibrateButton_prompt" : undefined}
                  disabled={!canCalibrate || isCalibrationCountdown}
                  loading={isCalibrating || isCalibrationCountdown}
                  onClick={startCalibration}
                  variant="default"
                >
                  {isCalibrationCountdown
                    ? `Starting in ${calibrationCountdown ?? 3}`
                    : isCalibrating
                      ? `Calibrating… ${Math.round(calibrationProgress)}%`
                      : "Calibrate"}
                </Button>
              </Group>
            </div>
          </>
        ) : (
          <div className="monitoringVideoShell">
            <div className="monitoringVideoPlaceholder">
              <Button color="grape" onClick={startCamera} size="md">
                Start Recording
              </Button>
            </div>
          </div>
        )}
      </Paper>
    </Stack>
  );
}

function getHeaderMessage(
  status: MonitoringSessionStatus,
  errorMessage: string | null,
) {
  switch (status) {
    case "idle":
      return "Click Start Recording to monitor your posture while you work.";
    case "connecting":
      return "Connecting to Live Inference API and starting posture monitoring.";
    case "needs_calibration":
      return "Calibration required before posture monitoring can begin. Click Calibrate to continue.";
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

function getHeaderMessageTone(status: MonitoringSessionStatus) {
  switch (status) {
    case "error":
      return "warning";
    default:
      return "default";
  }
}

function getPreviewCardClassName(
  isCameraActive: boolean,
  status: MonitoringSessionStatus,
  isHealthyPosture: boolean | null,
) {
  if (!isCameraActive) {
    return "monitoringPreviewCard monitoringPreviewCard_paused";
  }

  if (status !== "live") {
    return "monitoringPreviewCard monitoringPreviewCard_active";
  }

  if (isHealthyPosture === true) {
    return "monitoringPreviewCard monitoringPreviewCard_healthy";
  }

  if (isHealthyPosture === false) {
    return "monitoringPreviewCard monitoringPreviewCard_unhealthy";
  }

  return "monitoringPreviewCard monitoringPreviewCard_active";
}
