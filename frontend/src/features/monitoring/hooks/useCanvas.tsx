import { useRef } from "react";
import { CanvasService } from "../service/canvas.service";
import type { Keypoint } from "../monitoring.types";

export default function useCanvas() {
  const canvasServiceRef = useRef<CanvasService | null>(null);

  function canvasRef(node: HTMLCanvasElement | null) {
    if (node && !canvasServiceRef.current) {
      canvasServiceRef.current = new CanvasService(node);
    } else if (!node) {
      canvasServiceRef.current = null;
    }
  }

  return {
    canvasRef,
    drawKeypoints: (keypoints: Keypoint[]) => canvasServiceRef.current?.drawEdges(keypoints),
    drawPostureStatus: (isHealthyPosture: boolean) =>
      canvasServiceRef.current?.drawPostureStatus(isHealthyPosture),
    reset: () => canvasServiceRef.current?.reset(),
  };
}
