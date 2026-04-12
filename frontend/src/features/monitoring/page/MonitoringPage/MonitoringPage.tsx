import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import "./MonitoringPage.css";

export function MonitoringPage() {
  const [isCalibrated, setIsCalibrated] = useState(false);

  return (
    <Stack className="monitoringPage" gap="lg">
      <div>
        <Title order={2}>Monitoring</Title>
        <Text c="dimmed" mt="xs" size="sm">
          Live session preview and calibration.
        </Text>
      </div>

      <Group align="center" className="monitoringCalibration" justify="space-between" wrap="wrap">
        <Group gap="sm">
          <Text fw={600} size="sm">
            Posture model
          </Text>
          <Badge color={isCalibrated ? "grape" : "gray"} variant="light">
            {isCalibrated ? "Calibrated" : "Not calibrated"}
          </Badge>
        </Group>
        <Button onClick={() => setIsCalibrated(true)}>Calibrate</Button>
      </Group>

      <div className="monitoringCameraPlaceholder">
        <Text c="dimmed" size="sm">
          Camera preview
        </Text>
      </div>
    </Stack>
  );
}
