import {
  getRenderedVideoSize,
  mapPointToCoverDisplaySpace,
} from "@/features/monitoring/utils/monitoring-display.utils";
import type { Point } from "@/features/canvas/canvas.types";
import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import { useCallback, useEffect, useRef } from "react";

/**
 * Manages the synchronization between a camera feed, a HTML video element, and a display canvas.
 * This hook handles three distinct coordinate systems:
 * 1. **Intrinsic Space**: The raw pixel dimensions of the camera stream (e.g., 1280x720).
 * 2. **Display Space**: The actual CSS pixels the `<video>` element occupies on screen.
 * 3. **Canvas Space**: The overlay area where coordinates are mapped after accounting for `object-fit: cover` cropping.
 * @param isActive - Whether the monitoring logic should be actively observing and syncing.
 * @param cameraStream - The MediaStream object from the user's camera.
 * @param resize - Callback to update the overlay canvas dimensions to match the rendered video size.
 * @returns An object containing:
 * - `videoRef`: A callback ref to be attached to the HTMLVideoElement.
 * - `mapPointToDisplaySpace`: A utility to translate raw AI/Video points to UI-ready coordinates.
 * This is used for Drawing on the Canvas ensuring the coordinateds are correctly mapped
 */
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
