export interface CanvasTextProps {
  text: string;
  point: Point;
  color?: string | CanvasGradient;
  font?: string;
}

export interface CanvasEdgeProps {
  point1: Point;
  point2: Point;
  width?: number;
  color?: string | CanvasGradient;
}

export interface Point {
  x: number;
  y: number;
}

export class CanvasService {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }
    this.ctx = ctx;
  }

  reset() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
  drawText({ text, point, color = "red", font = "52px Inter" }: CanvasTextProps) {
    this.ctx.font = font;
    if (color) this.ctx.fillStyle = color;
    this.ctx.fillText(text, point.x, point.y);
  }
  drawEdge({ point1, point2, width = 5, color = "red" }: CanvasEdgeProps) {
    this.ctx.beginPath();
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.moveTo(point1.x, point1.y);
    this.ctx.lineTo(point2.x, point2.y);
    this.ctx.stroke();
  }

  // drawPostureStatus(isHealthyPosture: boolean) {
  //   this.ctx.fillStyle = isHealthyPosture ? "green" : "red";
  //   this.ctx.fillText(isHealthyPosture ? "Healthy" : "Slouching", 200, 400);
  // }
  // drawEdges(keypoints: Keypoint[]) {
  // let nose, lShoulder, rShoulder;
  // for (const k of keypoints) {
  //   if (k.class === "nose") {
  //     nose = k;
  //   } else if (k.class === "left_shoulder") {
  //     lShoulder = k;
  //   } else if (k.class === "right_shoulder") {
  //     rShoulder = k;
  //   }
  // }

  // if (nose && lShoulder && rShoulder) {
  //   this.ctx.beginPath();
  //   this.ctx.lineWidth = 5;
  //   this.ctx.strokeStyle = "red";
  //   this.ctx.moveTo(lShoulder.x, lShoulder.y);
  //   this.ctx.lineTo(rShoulder.x, rShoulder.y);
  //   this.ctx.stroke();
  // }
  // }
}
