import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useState } from "react";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useCanvas from "./useCanvas";
import type { InferenceOutputData } from "../monitoring.types";
import { monitoringService } from "../service/monitoring.service";

export function useLiveVideoInference() {
  const { cameraStream } = useLocalCamera();
  const { canvasRef, drawText, drawEdge, reset, resize, getCanvasDimensions } = useCanvas();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  function videoRef(node: HTMLVideoElement | null) {
    if (node) {
      node.srcObject = cameraStream;
      node.addEventListener("loadedmetadata", () => {
        resize(node.videoWidth, node.videoHeight);
      });
    }
  }

  function onData(data: InferenceOutputData): void {
    if (isLoading) setLoading(false);
    const frame = monitoringService.parseFrame(data);
    if (!frame?.output.predictions.length) return;

    const result = monitoringService.process(data);
    const { isHealthyPosture, shoulderPoints } = result;
    const { leftShoulderKeypoint, rightShoulderKeypoint } = shoulderPoints;
    const { width, height } = getCanvasDimensions();

    reset();
    drawText({
      text: isHealthyPosture ? "Healthy" : "Unhealthy",
      point: { x: width * 0.1, y: height * 0.1 }, // 10% from top left
    });
    drawEdge({
      point1: leftShoulderKeypoint,
      point2: rightShoulderKeypoint,
    });
  }

  useEffect(() => {
    if (!cameraStream) {
      return;
    }
    let disposed = false;

    inferenceClient.start(cameraStream, onData).catch((error) => {
      if (!disposed) {
        setError(error);
      }
    });

    return () => {
      disposed = true;
      inferenceClient.stop();
    };
  }, [cameraStream]);

  return { videoRef, canvasRef, isLoading, error };
}
