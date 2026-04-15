import { Paper, Text } from "@mantine/core";
import { useLiveVideoInference } from "@/features/monitoring/hooks/useLiveVideoInference";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
import { useEffect, useRef, useState } from "react";
import type { InferenceOutputData } from "@/features/monitoring/monitoring.types";
import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import useCanvas from "@/features/monitoring/hooks/useCanvas";
export function CameraPreview() {
  const { canvasRef, drawKeypoints, drawPostureStatus, reset } = useCanvas();
  const { videoRef, error } = useLiveVideoInference({ onData: handlePrediction });
  const [isLoading, setLoading] = useState<boolean>(true);

  const handlePrediction = (data: InferenceOutputData) => {
    setLoading(false);

    console.log(
      videoRef.current.videoWidth,
      videoRef.current.videoHeight,
      data.serialized_output_data?.output?.image || "NULL IMAGE VALS?",
    );
    const scaledData = scaleCoords(data);
    function scaleCoords(data: InferenceOutputData): InferenceOutputData | null {
      if (!data) return null;
      const scaleX = videoRef.current.videoWidth / data.serialized_output_data.output.image.width;
      const scaleY =
        videoRef.current.videoHeight / data.serialized_output_data?.output?.image?.height;
      const scaledPredictions = data.serialized_output_data?.output?.predictions.map(
        (prediction) => {
          return {
            ...prediction,
            x: prediction.x! * scaleX,
            y: prediction.y! * scaleY,
            keypoints: prediction.keypoints!.map((k) => ({
              ...k,
              x: k.x * scaleX,
              y: k.y * scaleY,
            })),
          };
        },
      );
      return {
        ...data,
        serialized_output_data: {
          ...data.serialized_output_data,
          output: {
            ...data.serialized_output_data.output,
            predictions: scaledPredictions,
          },
        },
      };
    }
    if (!scaledData) return;
    const frame = scaledData.serialized_output_data;
    if (!scaledData.serialized_output_data?.output?.predictions[0].keypoints || !frame) return; //skip if model did not make predictions for this frame. THis should be used for validating if user is in frame though
    const isHealthyPosture = monitoringService.validatePosture(frame);

    if (!canvasRef.current || !canvasServiceRef.current) return;
    reset();
    drawPostureStatus(isHealthyPosture);
    drawKeypoints(scaledData.serialized_output_data.output.predictions[0].keypoints);
  };

  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

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
