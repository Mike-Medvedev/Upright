import { Container, Stack, Button, Paper } from "@mantine/core";
import { useState, useRef, useEffect } from "react";
import useCamera from "@/features/monitoring/hooks/useCamera";
function CameraPreview() {
  const { camera, isLoading, error } = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && !isLoading && camera) {
      videoRef.current.srcObject = camera;
    }
  }, [isLoading, camera]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading Camera! Reason: {error.message}</p>;
  return (
    <Paper w="100%" radius="md" p={0} style={{ aspectRatio: "16/9", overflow: "hidden" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Paper>
  );
}

export function MonitoringPage() {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  function handleRecordingStatus() {
    setIsCameraActive((prev) => !prev);
  }

  return (
    <Container size="md">
      <Stack align="center" gap="md">
        <Button onClick={handleRecordingStatus}>
          {isCameraActive ? "Stop" : "Start"} Recording
        </Button>
        {isCameraActive && <CameraPreview />}
      </Stack>
    </Container>
  );
}
