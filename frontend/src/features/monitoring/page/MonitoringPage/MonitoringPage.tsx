import { Container, Stack, Paper, Button } from "@mantine/core";
import { useRef, useEffect, useState } from "react";
import useCamera from "@/features/monitoring/hooks/useCamera";
function CameraPreview() {
  const { camera, isLoading, error } = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && camera) {
      videoRef.current.srcObject = camera;
    }
  }, [camera]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
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
