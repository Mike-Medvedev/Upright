import { Paper, Text } from "@mantine/core";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import InferenceOverlay from "@/features/monitoring/components/InferenceOverlay";
import VideoCanvas from "@/features/monitoring/components/VideoCanvas";
export function CameraPreview() {
  const { videoRef, canvasRef, isLoading, error, isCalibrating, setCalibrating } =
    useLiveVideoInference();

  if (error) return <Text c="red">{error.message}</Text>;

  return (
    <Paper w="100%" radius="md" p={0} style={{ overflow: "hidden", position: "relative" }}>
      <VideoCanvas videoRef={videoRef} canvasRef={canvasRef} />
      <InferenceOverlay
        isLoading={isLoading}
        isCalibrating={isCalibrating}
        setCalibrating={setCalibrating}
      />
    </Paper>
  );
}
