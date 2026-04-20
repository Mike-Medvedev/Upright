import type { Point } from "@/features/canvas/canvas.types";

export function getRenderedVideoSize(node: HTMLVideoElement) {
  return {
    width: Math.round(node.clientWidth),
    height: Math.round(node.clientHeight),
  };
}

/**
 * Maps a point from the raw video coordinate space (source) to the display coordinate
 * space of an HTMLVideoElement using `object-fit: cover` logic.
 * This accounts for the scaling and centering offsets applied by the browser when
 * the video's aspect ratio differs from the element's aspect ratio.
 *
 * @param {Point} point - The original x,y coordinates relative to the video's intrinsic dimensions.
 *
 * @param {HTMLVideoElement | null} node - The video element to map the point against.
 *
 * @returns {Point} The mapped x,y coordinates relative to the video element's client bounds.
 */
export function mapPointToCoverDisplaySpace(point: Point, node: HTMLVideoElement | null): Point {
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
