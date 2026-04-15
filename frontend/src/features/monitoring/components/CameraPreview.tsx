import { Paper, Text } from "@mantine/core";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
export function CameraPreview() {
  const { videoRef, canvasRef, isLoading, error } = useLiveVideoInference();
  if (error) return <Text c="red">{error.message}</Text>;

  return (
    <Paper w="100%" radius="md" p={0} style={{ overflow: "hidden", position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <InferenceOverlay isLoading={isLoading} />
    </Paper>
  );
}
