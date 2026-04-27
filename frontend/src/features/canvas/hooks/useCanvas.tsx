import { useCallback, useRef } from "react";
import type { CanvasEdgeProps, CanvasTextProps } from "@/features/canvas/canvas.types";
import { CanvasService } from "@/features/canvas/service/canvas.service";

export function useCanvas() {
  const canvasServiceRef = useRef<CanvasService | null>(null);
  const canvasNodeRef = useRef<HTMLCanvasElement | null>(null);

  function canvasRef(node: HTMLCanvasElement | null) {
    if (!node) return;
    canvasNodeRef.current = node;
    canvasServiceRef.current = new CanvasService(node);

    return () => {
      canvasServiceRef.current = null;
    };
  }

  const resize = useCallback((width: number, height: number) => {
    if (canvasNodeRef.current) {
      canvasNodeRef.current.width = width;
      canvasNodeRef.current.height = height;
    }
  }, []);

  const getCanvasDimensions = useCallback(() => {
    return {
      width: canvasNodeRef.current?.width ?? 0,
      height: canvasNodeRef.current?.height ?? 0,
    };
  }, []);

  const drawText = useCallback((props: CanvasTextProps) => {
    canvasServiceRef.current?.drawText(props);
  }, []);

  const drawEdge = useCallback((props: CanvasEdgeProps) => {
    canvasServiceRef.current?.drawEdge(props);
  }, []);

  const resetCanvas = useCallback(() => {
    canvasServiceRef.current?.reset();
  }, []);

  return {
    canvasRef,
    drawText,
    drawEdge,
    resetCanvas,
    resize,
    getCanvasDimensions,
  };
}
