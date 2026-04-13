import { Paper, Loader, Text } from "@mantine/core";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useInferencePipeline from "@/features/monitoring/hooks/useInferencePipeline";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
export function CameraPreview() {
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
