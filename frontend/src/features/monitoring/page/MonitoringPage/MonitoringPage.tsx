import { Container, Stack, Paper, Button } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useInferencePipeline from "@/features/monitoring/hooks/useInferencePipeline";
function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { cameraStream, isLoading, error } = useLocalCamera();

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const { isConnected } = useInferencePipeline(cameraStream, (data) => {
    console.log("Prediction:", data);
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Paper
      w="100%"
      radius="md"
      p={0}
      style={{ aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {!isConnected && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}>
          <p style={{ color: "white" }}>Connecting to inference...</p>
        </div>
      )}
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
