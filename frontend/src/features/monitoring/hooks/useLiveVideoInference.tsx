import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useState, useEffectEvent, useCallback } from "react";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useCanvas from "./useCanvas";
import { monitoringService } from "../service/monitoring.service";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";

export function useLiveVideoInference() {
  const { cameraStream } = useLocalCamera();
  const { canvasRef, drawText, drawEdge, reset, resize, getCanvasDimensions } = useCanvas();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [calibrationProgress, setProgress] = useState<number>(0);
  const [isCalibrating, setCalibrating] = useState<boolean>(false);

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node) {
        node.srcObject = cameraStream;
        node.addEventListener("loadedmetadata", () => {
          resize(node.videoWidth, node.videoHeight);
          monitoringService.setDimensions({ width: node.videoWidth, height: node.videoHeight });
        });
      }
    },
    [cameraStream, resize],
  );
  const onData = useEffectEvent((data: WebRTCOutputData): void => {
    console.log("Predictions", data);
    const { width, height } = getCanvasDimensions();
    if (isLoading) setLoading(false);
    const { validatedFrame, error } = monitoringService.parseFrame(data);
    if (error instanceof InferenceError) {
      if (error.code === "MISSING_KEYPOINTS") {
        drawText({
          text: "Please make sure both shoulders and head are in frame!",
          point: { x: width * 0.8, y: height * 0.2 },
          color: "red",
          font: "24px Inter",
        });
      }
      if (error.code === "MISSING_PREDICTION_IMAGE_DIMENSIONS") {
        console.warn("MISSING_PREDICTION_IMAGE_DIMENSIONS");
        return;
      }
    }
    if (!validatedFrame?.output.predictions.length) return;

    const {
      data: postureData,
      error: postureError,
      calibration: calibrationData,
    } = monitoringService.process(validatedFrame);
    if (error && !postureData) {
      if (postureError instanceof InferenceError) {
        switch (postureError.code) {
          case "MISSING_NOSE_KEYPOINT":
            drawText({
              text: "Please make sure Nose is in frame!",
              point: { x: width * 0.8, y: height * 0.8 },
              color: "red",
            });
            break;
          case "MISSING_LSHOULDER_KEYPOINT":
            drawText({
              text: "Please make sure Left shoulder is in frame!",
              point: { x: width * 0.8, y: height * 0.8 },
              color: "red",
            });
            break;
          case "MISSING_RSHOULDER_KEYPOINT":
            drawText({
              text: "Please make sure Right Shoulder is in frame!",
              point: { x: width * 0.8, y: height * 0.8 },
              color: "red",
            });
            break;
          default:
            break;
        }
        return;
      }
    }
    if (monitoringService.isCalibrating) {
      if (calibrationData?.progress) {
        setProgress(monitoringService.progress);
        reset();
        drawText({
          text: `${monitoringService.progress}`,
          color: "blue",
          point: { x: 15, y: 200 },
        });
      }
      if (calibrationData?.isComplete) {
        setProgress(100);
        setCalibrating(false);
        drawText({
          text: "CALIBRATION COMPLETED!",
          color: "green",
          point: { x: 50, y: 50 },
        });
      }
      return;
    }
    if (!postureData) return;
    const { lShoulder, rShoulder } = postureData.keypoints;
    reset();
    drawText({
      text: postureData.isHealthyPosture ? "Healthy" : "Unhealthy",
      color: postureData.isHealthyPosture ? "green" : "red",
      point: { x: width * 0.1, y: height * 0.1 }, // 10% from top left
    });
    drawEdge({
      point1: { x: lShoulder.x, y: lShoulder.y },
      point2: { x: rShoulder.x, y: rShoulder.y },
    });
  });

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

  return { videoRef, canvasRef, isLoading, isCalibrating, setCalibrating, error };
}
