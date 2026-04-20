import type { Point } from "@/features/monitoring/service/canvas.service";

export function getRenderedVideoSize(node: HTMLVideoElement) {
  return {
    width: Math.round(node.clientWidth),
    height: Math.round(node.clientHeight),
  };
}

export function mapPointToCoverDisplaySpace(
  point: Point,
  node: HTMLVideoElement | null,
): Point {
  if (!node) {
    return point;
  }

  const sourceWidth = node.videoWidth;
  const sourceHeight = node.videoHeight;
  const renderedWidth = node.clientWidth;
  const renderedHeight = node.clientHeight;

  if (!sourceWidth || !sourceHeight || !renderedWidth || !renderedHeight) {
    return point;
  }

  const coverScale = Math.max(renderedWidth / sourceWidth, renderedHeight / sourceHeight);
  const drawnWidth = sourceWidth * coverScale;
  const drawnHeight = sourceHeight * coverScale;
  const offsetX = (renderedWidth - drawnWidth) / 2;
  const offsetY = (renderedHeight - drawnHeight) / 2;

  return {
    x: point.x * coverScale + offsetX,
    y: point.y * coverScale + offsetY,
  };
}
