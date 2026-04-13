import { Paper, Loader, Text } from "@mantine/core";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useInferencePipeline from "@/features/monitoring/hooks/useInferencePipeline";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
import { useRef } from "react";
export function CameraPreview() {
  const { cameraStream, videoRef, isLoading, error } = useLocalCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isConnected } = useInferencePipeline(cameraStream, (data) => {
    console.log("Prediction:", data);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.font = "24px Inter";
    ctx.fillStyle = data.serialized_output_data.status === "Good Posture" ? "green" : "red";
    ctx.fillText(data.serialized_output_data.status, 20, 40);
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
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <InferenceOverlay isConnected={isConnected} />
    </Paper>
  );
}
