import type { Keypoint } from "@/features/monitoring/monitoring.types";

export class CanvasService {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }

    this.ctx = ctx;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.font = "24px Inter";
  }

  drawPostureStatus(isHealthyPosture: boolean) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.ctx.fillStyle = isHealthyPosture ? "green" : "red";
    this.ctx.fillText(isHealthyPosture ? "Healthy" : "Slouching", 200, 400);
  }
  drawEdges(keypoints: Keypoint[]) {
    let nose, lShoulder, rShoulder;
    for (const k of keypoints) {
      if (k.class === "nose") {
        nose = k;
      } else if (k.class === "left_shoulder") {
        lShoulder = k;
      } else if (k.class === "right_shoulder") {
        rShoulder = k;
      }
    }
    if (nose && lShoulder && rShoulder) {
      this.ctx.beginPath();
      this.ctx.moveTo(lShoulder.x, lShoulder.y);
      this.ctx.lineTo(rShoulder.x, rShoulder.y);
      this.ctx.stroke();
    }
  }
}
