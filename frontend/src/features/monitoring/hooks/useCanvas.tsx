import { useRef } from "react";
import {
  CanvasService,
  type CanvasEdgeProps,
  type CanvasTextProps,
} from "../service/canvas.service";

export default function useCanvas() {
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

  function resize(width: number, height: number) {
    if (canvasNodeRef.current) {
      canvasNodeRef.current.width = width;
      canvasNodeRef.current.height = height;
    }
  }

  function getCanvasDimensions() {
    return {
      width: canvasNodeRef.current?.width ?? 0,
      height: canvasNodeRef.current?.height ?? 0,
    };
  }

  return {
    canvasRef,
    drawText: (props: CanvasTextProps) => canvasServiceRef.current?.drawText(props),
    drawEdge: (props: CanvasEdgeProps) => canvasServiceRef.current?.drawEdge(props),
    reset: () => canvasServiceRef.current?.reset(),
    resize,
    getCanvasDimensions,
  };
}

// drawPostureStatus(isHealthyPosture: boolean) {
//     this.ctx.fillStyle = isHealthyPosture ? "green" : "red";
//     this.ctx.fillText(isHealthyPosture ? "Healthy" : "Slouching", 200, 400);
//   }
//   drawEdges(keypoints: Keypoint[]) {
//     let nose, lShoulder, rShoulder;
//     for (const k of keypoints) {
//       if (k.class === "nose") {
//         nose = k;
//       } else if (k.class === "left_shoulder") {
//         lShoulder = k;
//       } else if (k.class === "right_shoulder") {
//         rShoulder = k;
//       }
//     }

//     if (nose && lShoulder && rShoulder) {
//       this.ctx.beginPath();
//       this.ctx.lineWidth = 5;
//       this.ctx.strokeStyle = "red";
//       this.ctx.moveTo(lShoulder.x, lShoulder.y);
//       this.ctx.lineTo(rShoulder.x, rShoulder.y);
//       this.ctx.stroke();
//     }
//   }
