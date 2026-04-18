import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useEffect } from "react";
import { CameraPreview } from "@/features/monitoring/components/CameraPreview";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { useMonitoring } from "@/features/monitoring/monitoring.context";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";
import "./MonitoringPage.css";

export function MonitoringPage() {
  const { reset, startCamera, state, stopCamera, syncState } = useMonitoring();
  const { calibrationProgress, canvasRef, error, startCalibration, status, videoRef } =
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
  const statusLabel = getStatusLabel(currentStatus);
  const statusDescription = getStatusDescription(
    currentStatus,
    currentErrorMessage,
    calibrationProgress,
  );

  return (
    <Stack className="monitoringPage" gap="md">
      <Paper
        className={`monitoringPreviewCard ${
          isCameraActive ? "monitoringPreviewCard_live" : "monitoringPreviewCard_paused"
        }`}
        p={0}
        radius="lg"
      >
        <div className="monitoringPreviewTopBar">
          <div>
            <Group gap="sm" wrap="wrap">
              <Title order={2}>Monitoring</Title>
              <Badge
                className="monitoringLiveBadge"
                color={getStatusColor(currentStatus)}
                leftSection={
                  <span className={`monitoringStatusDot monitoringStatusDot_${currentStatus}`} />
                }
                radius="xl"
                variant="light"
              >
                {statusLabel}
              </Badge>
            </Group>
            <Text aria-live="polite" c="dimmed" className="monitoringPreviewTopTitle" mt={6} size="sm">
              {statusDescription}
            </Text>
          </div>

          <Group gap="sm" wrap="wrap">
            <Button
              color={isCameraActive ? "red" : "grape"}
              onClick={isCameraActive ? stopCamera : startCamera}
              variant={isCameraActive ? "light" : "filled"}
            >
              {isCameraActive ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button disabled={!canCalibrate} loading={isCalibrating} onClick={startCalibration} variant="default">
              {isCalibrating ? `Calibrating… ${Math.round(calibrationProgress)}%` : "Calibrate"}
            </Button>
          </Group>
        </div>

        {isCameraActive ? (
          <CameraPreview
            calibrationProgress={calibrationProgress}
            canvasRef={canvasRef}
            errorMessage={currentErrorMessage}
            status={currentStatus}
            videoRef={videoRef}
          />
        ) : (
          <div className="monitoringVideoShell">
            <div className="monitoringVideoPlaceholder">
              <Stack align="center" gap="sm">
                <Title order={3}>Ready to Start a Session?</Title>
                <Text c="dimmed" maw={460} size="sm" ta="center">
                  Start recording to open your local camera feed, posture overlay, and live monitoring guidance.
                </Text>
                <Button color="grape" onClick={startCamera} size="md">
                  Start Recording
                </Button>
              </Stack>
            </div>
          </div>
        )}

        <div className={`monitoringPreviewFooter ${!isCameraActive ? "monitoringPreviewFooter_idle" : ""}`}>
          <Text c="dimmed" size="sm">
            {isCameraActive
              ? "Use Calibrate after you settle into a natural seated posture so the live posture feedback stays accurate."
              : "When the session is live, calibration moves into the header so the video area stays focused on guidance."}
          </Text>
        </div>
      </Paper>
    </Stack>
  );
}

function getStatusColor(status: MonitoringSessionStatus) {
  switch (status) {
    case "live":
      return "green";
    case "error":
      return "red";
    case "connecting":
    case "calibrating":
      return "yellow";
    default:
      return "gray";
  }
}

function getStatusLabel(status: MonitoringSessionStatus) {
  switch (status) {
    case "connecting":
      return "Connecting";
    case "live":
      return "Live";
    case "calibrating":
      return "Calibrating";
    case "error":
      return "Needs Attention";
    default:
      return "Camera Off";
  }
}

function getStatusDescription(
  status: MonitoringSessionStatus,
  errorMessage: string | null,
  calibrationProgress: number,
) {
  switch (status) {
    case "connecting":
      return "Connecting to your camera and posture inference stream…";
    case "live":
      return "Live posture monitoring is running.";
    case "calibrating":
      return `Calibration is in progress at ${Math.round(calibrationProgress)}%. Hold still for a moment.`;
    case "error":
      return errorMessage ?? "The camera could not be started. Check permissions and try again.";
    default:
      return "Start a session when you are ready to begin posture monitoring.";
  }
}
