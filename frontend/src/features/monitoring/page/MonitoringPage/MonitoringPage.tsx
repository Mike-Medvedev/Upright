import { Button, Group, Paper, Progress, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { CameraPreview } from "@/features/monitoring/components/CameraPreview";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";
import "./MonitoringPage.css";

export function MonitoringPage() {
  const { reset, startCamera, state, stopCamera, syncState } = useMonitoring();
  const { calibrationProgress, canvasRef, error, isHealthyPosture, startCalibration, status, videoRef } =
    useLiveVideoInference(state.isCameraActive);

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
  const canCalibrate = isCameraActive && currentStatus === "live";
  const headerMessage = getHeaderMessage(
    currentStatus,
    currentErrorMessage,
    calibrationProgress,
  );

  return (
    <Stack className="monitoringPage" gap="md">
      <Paper
        className={getPreviewCardClassName(isCameraActive, isHealthyPosture)}
        p={0}
        radius="lg"
      >
        <div className="monitoringPreviewTopBar">
          <Text aria-live="polite" className="monitoringPreviewTopTitle">
            {headerMessage}
          </Text>
        </div>

        {isCameraActive ? (
          <>
            <CameraPreview
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
                <Button disabled={!canCalibrate} loading={isCalibrating} onClick={startCalibration} variant="default">
                  {isCalibrating ? `Calibrating… ${Math.round(calibrationProgress)}%` : "Calibrate"}
                </Button>
              </Group>
              {isCalibrating ? (
                <div className="monitoringCalibrationStatus">
                  <Text className="monitoringCalibrationTitle" size="sm">
                    Calibrating posture monitoring
                  </Text>
                  <Text c="dimmed" size="xs">
                    Sit naturally and keep your shoulders visible for a few seconds.
                  </Text>
                  <Progress color="grape" radius="xl" size="sm" value={calibrationProgress} />
                </div>
              ) : null}
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
  calibrationProgress: number,
) {
  switch (status) {
    case "idle":
      return "Click Start Recording to monitor your posture while you work.";
    case "connecting":
      return "Connecting to your camera and starting posture monitoring.";
    case "live":
      return "Posture monitoring is live while you work.";
    case "calibrating":
      return `Calibrating posture monitoring at ${Math.round(calibrationProgress)}%. Hold still for a moment.`;
    case "error":
      return errorMessage ?? "The camera could not be started. Check permissions and try again.";
  }
}

function getPreviewCardClassName(isCameraActive: boolean, isHealthyPosture: boolean | null) {
  if (!isCameraActive) {
    return "monitoringPreviewCard monitoringPreviewCard_paused";
  }

  if (isHealthyPosture === true) {
    return "monitoringPreviewCard monitoringPreviewCard_healthy";
  }

  if (isHealthyPosture === false) {
    return "monitoringPreviewCard monitoringPreviewCard_unhealthy";
  }

  return "monitoringPreviewCard monitoringPreviewCard_active";
}
