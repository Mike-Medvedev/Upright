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
}
