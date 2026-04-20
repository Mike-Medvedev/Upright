import type { CanvasEdgeProps, CanvasTextProps, Point } from "@/features/canvas/canvas.types";

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

  drawEdge({ point1, point2, width = 5, color = "#a450ff" }: CanvasEdgeProps) {
    const strokeStyle = this.createEdgeStroke(point1, point2, color);

    this.ctx.save();
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    // Soft outer stroke gives the shoulder guide a more polished presence.
    this.ctx.beginPath();
    this.ctx.globalAlpha = 0.26;
    this.ctx.lineWidth = width + 8;
    this.ctx.strokeStyle = typeof color === "string" ? color : strokeStyle;
    this.ctx.moveTo(point1.x, point1.y);
    this.ctx.lineTo(point2.x, point2.y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;
    this.ctx.lineWidth = width;
    this.ctx.shadowBlur = 16;
    this.ctx.shadowColor = typeof color === "string" ? color : "rgba(255, 255, 255, 0.35)";
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.moveTo(point1.x, point1.y);
    this.ctx.lineTo(point2.x, point2.y);
    this.ctx.stroke();

    this.drawEdgeHandle(point1, color);
    this.drawEdgeHandle(point2, color);
    this.ctx.restore();
  }

  private createEdgeStroke(
    point1: Point,
    point2: Point,
    color: string | CanvasGradient,
  ): string | CanvasGradient {
    if (typeof color !== "string") {
      return color;
    }

    const gradient = this.ctx.createLinearGradient(point1.x, point1.y, point2.x, point2.y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    gradient.addColorStop(1, color);
    return gradient;
  }

  private drawEdgeHandle(point: Point, color: string | CanvasGradient) {
    this.ctx.beginPath();
    this.ctx.fillStyle = typeof color === "string" ? color : "rgba(255, 255, 255, 0.95)";
    this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
