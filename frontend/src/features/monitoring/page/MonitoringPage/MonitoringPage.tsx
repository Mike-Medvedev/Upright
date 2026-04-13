import { Container, Stack, Button } from "@mantine/core";
import { useState } from "react";
import { CameraPreview } from "@/features/monitoring/components/CameraPreview";

export function MonitoringPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);

  return (
    <Container size="md">
      <Stack align="center" gap="md">
        <Button onClick={() => setIsCameraActive((prev) => !prev)}>
          {isCameraActive ? "Stop" : "Start"} Recording
        </Button>
        {isCameraActive && <CameraPreview />}
      </Stack>
    </Container>
  );
}
