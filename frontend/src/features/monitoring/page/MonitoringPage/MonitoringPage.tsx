import { Container, Button } from "@mantine/core";
import { useState } from "react";

function CameraPreview({ isCameraActive }: { isCameraActive: boolean }) {
  if (!isCameraActive) return undefined;
  return <div>Recording!...</div>;
}

export function MonitoringPage() {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  function startRecording() {
    setIsCameraActive(true);
  }

  return (
    <Container size="md">
      <Button onClick={startRecording} color="red">
        Start Recording
      </Button>
      <CameraPreview isCameraActive={isCameraActive} />
    </Container>
  );
}
