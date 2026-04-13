import { Paper, Text } from "@mantine/core";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
import { useRef } from "react";
import type { InferenceOutputData } from "@/features/monitoring/monitoring.types";
import { monitoringService } from "@/features/monitoring/service/monitoring.service";
export function CameraPreview() {
  const handlePrediction = (data: InferenceOutputData) => {
    console.log("Predictions: ", data);
    const predictions = data.serialized_output_data?.output?.predictions?.[0];
    const frame = data.serialized_output_data;
    if (!predictions || !frame) return; //skip if model did not make predictions for this frame. THis should be used for validating if user is in frame though
    const isHealthyPosture = monitoringService.validatePosture(frame);
    console.log("Prediction:", data);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.font = "24px Inter";
    ctx.fillStyle = isHealthyPosture ? "green" : "red";
    ctx.fillText(isHealthyPosture ? "Healthy" : "Slouching", 20, 40);
  };

  const { videoRef, isLoading, error } = useLiveVideoInference(handlePrediction);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      <InferenceOverlay isLoading={isLoading} />
    </Paper>
  );
}
