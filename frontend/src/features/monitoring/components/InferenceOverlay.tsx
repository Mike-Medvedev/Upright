import { Loader, Progress, Stack, Text } from "@mantine/core";
import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";

export default function InferenceOverlay({
  status,
  calibrationProgress,
  errorMessage,
}: {
  status: MonitoringSessionStatus;
  calibrationProgress: number;
  errorMessage: string | null;
}) {
  if (status === "connecting") {
    return (
      <div aria-live="polite" className="monitoringVideoOverlay monitoringVideoOverlay_connecting">
        <Stack align="center" gap="sm">
          <Loader color="grape" size="sm" />
          <Text fw={600}>Connecting…</Text>
          <Text c="dimmed" size="sm">
            Getting the camera and inference stream ready.
          </Text>
        </Stack>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div aria-live="polite" className="monitoringVideoOverlay monitoringVideoOverlay_dim">
        <Stack align="center" gap="xs">
          <Text fw={600}>Camera Unavailable</Text>
          <Text c="dimmed" maw={360} size="sm">
            {errorMessage ?? "Check camera permissions and try starting the session again."}
          </Text>
        </Stack>
      </div>
    );
  }

  if (status !== "calibrating") {
    return null;
  }

  return (
    <div aria-live="polite" className="monitoringCalibrationBanner">
      <Stack gap="xs">
        <Text fw={600} size="sm">
          Calibrating…
        </Text>
        <Text c="dimmed" size="xs">
          Sit naturally and keep your shoulders visible for a few seconds.
        </Text>
        <Progress color="grape" radius="xl" size="sm" value={calibrationProgress} />
      </Stack>
    </div>
  );
}
