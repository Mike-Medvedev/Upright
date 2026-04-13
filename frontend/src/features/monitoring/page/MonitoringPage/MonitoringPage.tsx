import { Container, Stack, Paper, Button, Loader, Text } from "@mantine/core";
import { useState } from "react";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useInferencePipeline from "@/features/monitoring/hooks/useInferencePipeline";

function InferenceOverlay({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}>
      <p>Connecting to inference...</p>
    </div>
  );
}
function CameraPreview() {
  const { cameraStream, videoRef, isLoading, error } = useLocalCamera();

  const { isConnected } = useInferencePipeline(cameraStream, (data) => {
    console.log("Prediction:", data);
  });

  if (isLoading) return <Loader />;
  if (error) return <Text c="red">{error.message}</Text>;

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
      <InferenceOverlay isConnected={isConnected} />
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
