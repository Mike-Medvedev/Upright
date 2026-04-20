import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { CameraPreview } from "@/features/monitoring/components/CameraPreview";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";
import {
  getMonitoringErrorMessage,
  getMonitoringHeaderMessage,
  getMonitoringHeaderTone,
} from "@/features/monitoring/service/monitoring-messages.utils";
import "@/features/monitoring/page/MonitoringPage/MonitoringPage.css";

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

    const nextErrorMessage = getMonitoringErrorMessage(error);

    syncState({
      calibrationProgress,
      errorMessage: nextErrorMessage,
      status,
    });
  }, [calibrationProgress, error, state.isCameraActive, status, syncState]);

  useEffect(() => reset, [reset]);

  const isCameraActive = state.isCameraActive;
  const currentStatus = isCameraActive ? status : state.status;
  const currentErrorMessage = isCameraActive ? getMonitoringErrorMessage(error) : state.errorMessage;
  const isCalibrating = currentStatus === "calibrating";
  const isCalibrationCountdown = currentStatus === "calibration_countdown";
  const canCalibrate =
    isCameraActive && (currentStatus === "live" || currentStatus === "needs_calibration");
  const headerMessage =
    isCameraActive && currentStatus !== "connecting"
      ? inferenceHeaderMessage ?? getMonitoringHeaderMessage(currentStatus, currentErrorMessage)
      : getMonitoringHeaderMessage(currentStatus, currentErrorMessage);
  const headerMessageTone =
    isCameraActive && currentStatus !== "connecting" && inferenceHeaderMessage
      ? inferenceHeaderMessageTone
      : getMonitoringHeaderTone(currentStatus);

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
