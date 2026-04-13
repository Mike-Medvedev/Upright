import { Paper, Text } from "@mantine/core";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
import { useEffect, useRef, useState } from "react";
import type { InferenceOutputData } from "@/features/monitoring/monitoring.types";
import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import { CanvasService } from "@/features/monitoring/service/canvas.service";
export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasServiceRef = useRef<CanvasService | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

  const handlePrediction = (data: InferenceOutputData) => {
    setLoading(false);
    console.log("Predictions: ", data);
    const predictions = data.serialized_output_data?.output?.predictions[0];
    const frame = data.serialized_output_data;
    if (!predictions || !frame || !predictions.keypoints) return; //skip if model did not make predictions for this frame. THis should be used for validating if user is in frame though
    const isHealthyPosture = monitoringService.validatePosture(frame);
    console.log("Prediction:", data);

    if (!canvasRef.current || !canvasServiceRef.current) return;
    canvasServiceRef.current.drawPostureStatus(isHealthyPosture);
    canvasServiceRef.current.drawEdges(predictions.keypoints);
  };

  const { error } = useLiveVideoInference({ videoRef, onData: handlePrediction });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    if (!canvasServiceRef.current && canvasRef.current) {
      canvasServiceRef.current = new CanvasService(canvasRef.current);
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const handleLoaded = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    video.addEventListener("loadedmetadata", handleLoaded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, []);

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
