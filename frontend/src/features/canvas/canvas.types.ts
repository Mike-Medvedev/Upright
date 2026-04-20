export interface Point {
  x: number;
  y: number;
}

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
