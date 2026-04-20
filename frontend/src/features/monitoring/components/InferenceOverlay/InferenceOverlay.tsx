import { Loader, Progress, Stack, Text } from "@mantine/core";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";
import "./InferenceOverlay.css";

interface InferenceOverlayProps {
  calibrationCountdown: number | null;
  calibrationProgress: number;
  status: MonitoringSessionStatus;
  errorMessage: string | null;
}

export default function InferenceOverlay({
  calibrationCountdown,
  calibrationProgress,
  status,
  errorMessage,
}: InferenceOverlayProps) {
  if (status === "connecting") {
    return (
      <div aria-live="polite" className="monitoringVideoOverlay monitoringVideoOverlay_connecting">
        <Stack align="center" gap="sm">
          <Loader color="grape" size="sm" />
          <Text fw={600}>Connecting…</Text>
        </Stack>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div aria-live="polite" className="monitoringVideoOverlay monitoringVideoOverlay_dim">
        <Stack align="center" gap="xs">
          <Text fw={600}>Monitoring Unavailable</Text>
          <Text c="dimmed" maw={360} size="sm">
            {errorMessage ?? "We could not start posture monitoring. Please try again."}
          </Text>
        </Stack>
      </div>
    );
  }

  if (status === "calibrating") {
    return (
      <div aria-live="polite" className="monitoringVideoOverlay monitoringVideoOverlay_calibrating">
        <Stack className="monitoringCalibrationOverlayRail" gap="xs">
          <div className="monitoringCalibrationOverlayHeader">
            <Text className="monitoringCalibrationOverlayLabel">Calibrating</Text>
            <Text className="monitoringCalibrationOverlayPercent">{Math.round(calibrationProgress)}%</Text>
          </div>
          <Text className="monitoringCalibrationOverlayHeadline">Sit upright in a comfortable position</Text>
          <Progress
            animated
            color="grape"
            className="monitoringCalibrationOverlayProgress"
            radius="xl"
            size="sm"
            striped
            value={calibrationProgress}
          />
        </Stack>
      </div>
    );
  }

  if (status === "calibration_countdown") {
    return (
      <div aria-live="polite" className="monitoringVideoOverlay monitoringVideoOverlay_calibrating">
        <Stack className="monitoringCalibrationOverlayRail monitoringCalibrationOverlayRail_countdown" gap="xs">
          <Text className="monitoringCalibrationOverlayHeadline">Sit upright in a comfortable position</Text>
          <Text className="monitoringCalibrationOverlayCountdown">{calibrationCountdown ?? 3}</Text>
        </Stack>
      </div>
    );
  }

  return null;
}
