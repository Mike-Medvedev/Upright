import {
  getRenderedVideoSize,
  mapPointToCoverDisplaySpace,
} from "@/features/monitoring/service/monitoring-display.utils";
import type { Point } from "@/features/monitoring/service/canvas.service";
import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import { useCallback, useEffect, useRef } from "react";

export function useMonitoringVideoCanvas(
  isActive: boolean,
  cameraStream: MediaStream | null,
  resize: (width: number, height: number) => void,
) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const syncCanvasToDisplay = useCallback(() => {
    const node = videoElementRef.current;
    if (!node) {
      return;
    }

    const { width, height } = getRenderedVideoSize(node);
    if (!width || !height) {
      return;
    }

    resize(width, height);
  }, [resize]);

  const mapPointToDisplaySpace = useCallback(
    (point: Point): Point => mapPointToCoverDisplaySpace(point, videoElementRef.current),
    [],
  );

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoElementRef.current = node;
      if (!node) {
        return;
      }

      node.srcObject = cameraStream;
      node.onloadedmetadata = () => {
        syncCanvasToDisplay();
        monitoringService.setDimensions({ width: node.videoWidth, height: node.videoHeight });
      };
    },
    [cameraStream, syncCanvasToDisplay],
  );

  useEffect(() => {
    if (!isActive || !videoElementRef.current) {
      return;
    }

    syncCanvasToDisplay();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasToDisplay();
    });

    resizeObserver.observe(videoElementRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isActive, syncCanvasToDisplay]);

  return {
    mapPointToDisplaySpace,
    videoRef,
  };
}
